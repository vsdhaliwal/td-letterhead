import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { LETTERHEAD_TEMPLATE_BYTES } from "../assets/letterhead-template";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const ACCEPTED_EXTS = new Set([".pdf", ".rtf", ".doc", ".docx", ".odt"]);

// Safe content area inside the letterhead template (A4 595x842 pt).
// Tuned so user content sits cleanly between the header (logo + decoration)
// and the footer (firm details + decoration), with small side breathing room.
const SAFE_TOP = 110;
const SAFE_BOTTOM = 130;
const SAFE_SIDE = 28;

function ensureRtfMargins(rtfText: string): string {
  // Strip existing page-margin control words so ours win deterministically.
  const stripped = rtfText
    .replace(/\\margt-?\d+/g, "")
    .replace(/\\margb-?\d+/g, "")
    .replace(/\\margl-?\d+/g, "")
    .replace(/\\margr-?\d+/g, "");

  // Twips: 1 inch = 1440 twips. Sized to roughly match the letterhead safe area.
  const margins = "\\margt2400\\margb2200\\margl1000\\margr1000";

  if (stripped.includes("\\rtf1")) {
    return stripped.replace(/(\\rtf1\b)/, `$1${margins}`);
  }
  return stripped;
}

async function convertToPdfWithSoffice(
  inputBuffer: Buffer,
  ext: string,
): Promise<Buffer> {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "lh-"));
  const profileDir = path.join(workDir, "profile");

  let processedInput = inputBuffer;
  if (ext === ".rtf") {
    try {
      const rtfStr = inputBuffer.toString("latin1");
      processedInput = Buffer.from(ensureRtfMargins(rtfStr), "latin1");
    } catch {
      processedInput = inputBuffer;
    }
  }

  const inputPath = path.join(workDir, `in-${randomUUID()}${ext}`);
  await fs.writeFile(inputPath, processedInput);

  try {
    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        "soffice",
        [
          "--headless",
          "--norestore",
          "--nologo",
          "--nofirststartwizard",
          `-env:UserInstallation=file://${profileDir}`,
          "--convert-to",
          "pdf",
          "--outdir",
          workDir,
          inputPath,
        ],
        { stdio: ["ignore", "pipe", "pipe"] },
      );

      const timeout = setTimeout(() => {
        proc.kill("SIGKILL");
        reject(new Error("Conversion timed out"));
      }, 60_000);

      let stderr = "";
      proc.stderr.on("data", (d) => {
        stderr += d.toString();
      });
      proc.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
      proc.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) resolve();
        else reject(new Error(`soffice exited with ${code}: ${stderr}`));
      });
    });

    const baseName = path.basename(inputPath, ext);
    const outputPath = path.join(workDir, `${baseName}.pdf`);
    return await fs.readFile(outputPath);
  } finally {
    fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

router.post(
  "/letterhead/apply",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Please upload a file." });
        return;
      }

      const originalName = req.file.originalname || "computation";
      const ext = path.extname(originalName).toLowerCase();
      if (!ACCEPTED_EXTS.has(ext)) {
        res.status(400).json({
          error:
            "Unsupported file type. Please upload a PDF, RTF, DOC, or DOCX file.",
        });
        return;
      }

      let pdfBuffer: Buffer;
      if (ext === ".pdf") {
        pdfBuffer = req.file.buffer;
      } else {
        try {
          pdfBuffer = await convertToPdfWithSoffice(req.file.buffer, ext);
        } catch (err) {
          req.log.warn({ err }, "Failed to convert document to PDF");
          res.status(400).json({
            error:
              "Could not read this file. Please make sure it's a valid CompuTax document.",
          });
          return;
        }
      }

      // Load source content PDF
      let sourceDoc: PDFDocument;
      try {
        sourceDoc = await PDFDocument.load(pdfBuffer, {
          ignoreEncryption: true,
        });
      } catch (err) {
        req.log.warn({ err }, "Failed to parse PDF");
        res
          .status(400)
          .json({ error: "Could not read this file. It may be corrupted." });
        return;
      }
      const sourcePageCount = sourceDoc.getPageCount();
      if (sourcePageCount === 0) {
        res.status(400).json({ error: "This document has no pages." });
        return;
      }

      // Build the output document fresh, with the letterhead PDF as background
      // and user content embedded inside the safe area on each page.
      const outDoc = await PDFDocument.create();

      const [letterheadPage] = await outDoc.embedPdf(
        LETTERHEAD_TEMPLATE_BYTES,
        [0],
      );
      const letterheadW = letterheadPage.width;
      const letterheadH = letterheadPage.height;

      const embeddedSourcePages = await outDoc.embedPdf(
        pdfBuffer,
        Array.from({ length: sourcePageCount }, (_, i) => i),
      );

      const safeWidth = letterheadW - 2 * SAFE_SIDE;
      const safeHeight = letterheadH - SAFE_TOP - SAFE_BOTTOM;

      for (let i = 0; i < sourcePageCount; i++) {
        const newPage = outDoc.addPage([letterheadW, letterheadH]);

        // Letterhead background (fills the page).
        newPage.drawPage(letterheadPage, {
          x: 0,
          y: 0,
          width: letterheadW,
          height: letterheadH,
        });

        // Embedded source page, scaled uniformly to fit the safe area
        // and centered horizontally (top-aligned within the safe area).
        const src = embeddedSourcePages[i];
        const scale = Math.min(safeWidth / src.width, safeHeight / src.height);
        const drawW = src.width * scale;
        const drawH = src.height * scale;
        const drawX = (letterheadW - drawW) / 2;
        const drawY = letterheadH - SAFE_TOP - drawH; // top-align inside safe area

        newPage.drawPage(src, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      }

      const out = await outDoc.save();

      const baseName =
        path.basename(originalName, path.extname(originalName)) ||
        "computation";
      const downloadName = `${baseName}-letterhead.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${downloadName}"`,
      );
      res.setHeader("Content-Length", out.length.toString());
      res.send(Buffer.from(out));
    } catch (err) {
      req.log.error({ err }, "Failed to apply letterhead");
      if (!res.headersSent) {
        res
          .status(500)
          .json({ error: "Something went wrong while applying the letterhead." });
      }
    }
  },
);

router.use(
  (
    err: Error & { code?: string },
    _req: Request,
    res: Response,
    next: (err?: unknown) => void,
  ) => {
    if (err && err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File is too large. Max size is 25 MB." });
      return;
    }
    next(err);
  },
);

export default router;
