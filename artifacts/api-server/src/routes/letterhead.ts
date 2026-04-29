import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { TD_LOGO_BYTES } from "../assets/logo";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const BRAND_BLUE = rgb(0.102, 0.561, 0.847);
const TEXT_NAVY = rgb(0.071, 0.118, 0.196);
const RULE_GREY = rgb(0.78, 0.81, 0.85);

const HEADER_HEIGHT = 78;
const FOOTER_HEIGHT = 56;

const ACCEPTED_EXTS = new Set([".pdf", ".rtf", ".doc", ".docx", ".odt"]);

function spacedCaps(str: string, gaps = 1): string {
  const space = " ".repeat(gaps);
  return str.split("").join(space);
}

function drawCenteredText(
  page: import("pdf-lib").PDFPage,
  text: string,
  font: import("pdf-lib").PDFFont,
  size: number,
  y: number,
  color: import("pdf-lib").RGB,
) {
  const width = font.widthOfTextAtSize(text, size);
  const x = (page.getWidth() - width) / 2;
  page.drawText(text, { x, y, size, font, color });
}

async function convertToPdfWithSoffice(
  inputBuffer: Buffer,
  ext: string,
): Promise<Buffer> {
  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), "lh-"));
  const profileDir = path.join(workDir, "profile");
  const inputPath = path.join(workDir, `in-${randomUUID()}${ext}`);
  await fs.writeFile(inputPath, inputBuffer);

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

      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.load(pdfBuffer, {
          ignoreEncryption: true,
        });
      } catch (err) {
        req.log.warn({ err }, "Failed to parse PDF");
        res
          .status(400)
          .json({ error: "Could not read this file. It may be corrupted." });
        return;
      }

      const logoImage = await pdfDoc.embedJpg(TD_LOGO_BYTES);
      const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helv = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const pages = pdfDoc.getPages();

      for (const page of pages) {
        const { width, height } = page.getSize();

        // ----- HEADER -----
        const headerTop = height - 18;
        const logoH = 44;
        const logoW = (logoImage.width / logoImage.height) * logoH;

        const wordmark = spacedCaps("TAX DELIVER", 1);
        const wordmarkSize = 22;
        const wordmarkW = helvBold.widthOfTextAtSize(wordmark, wordmarkSize);

        const tagline = spacedCaps("YOUR TRUSTED TAX ADVISOR", 2);
        const taglineSize = 7.5;
        const taglineW = helv.widthOfTextAtSize(tagline, taglineSize);

        const groupGap = 14;
        const groupW = logoW + groupGap + Math.max(wordmarkW, taglineW);
        const groupX = (width - groupW) / 2;

        page.drawImage(logoImage, {
          x: groupX,
          y: headerTop - logoH,
          width: logoW,
          height: logoH,
        });

        const textX = groupX + logoW + groupGap;
        page.drawText(wordmark, {
          x: textX,
          y: headerTop - 24,
          size: wordmarkSize,
          font: helvBold,
          color: BRAND_BLUE,
        });

        page.drawText(tagline, {
          x: textX,
          y: headerTop - 38,
          size: taglineSize,
          font: helv,
          color: TEXT_NAVY,
        });

        page.drawLine({
          start: { x: 32, y: height - HEADER_HEIGHT },
          end: { x: width - 32, y: height - HEADER_HEIGHT },
          thickness: 0.6,
          color: RULE_GREY,
        });

        // ----- FOOTER -----
        const footerTop = FOOTER_HEIGHT;

        page.drawLine({
          start: { x: 32, y: footerTop },
          end: { x: width - 32, y: footerTop },
          thickness: 0.6,
          color: RULE_GREY,
        });

        drawCenteredText(
          page,
          "TAX DELIVER PVT. LTD.",
          helvBold,
          9.5,
          footerTop - 14,
          BRAND_BLUE,
        );

        drawCenteredText(
          page,
          "C-9/28, Sec-7, Rohini, Delhi-85",
          helv,
          8.5,
          footerTop - 26,
          TEXT_NAVY,
        );

        drawCenteredText(
          page,
          "99 11 22 44 20  |  www.taxdeliver.com  |  team@taxdeliver.com",
          helv,
          8.5,
          footerTop - 38,
          TEXT_NAVY,
        );
      }

      const out = await pdfDoc.save();

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
