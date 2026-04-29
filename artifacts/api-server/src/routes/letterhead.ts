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
const WHITE = rgb(1, 1, 1);

const HEADER_HEIGHT = 95;
const FOOTER_HEIGHT = 70;

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

function ensureRtfMargins(rtfText: string): string {
  // Strip existing margin control words so ours win deterministically.
  const stripped = rtfText
    .replace(/\\margt-?\d+/g, "")
    .replace(/\\margb-?\d+/g, "")
    .replace(/\\margl-?\d+/g, "")
    .replace(/\\margr-?\d+/g, "");

  // Twips: 1 inch = 1440 twips. ~1.4" top, ~1.05" bottom, ~0.8" sides.
  const margins = "\\margt2000\\margb1500\\margl1134\\margr1134";

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
      // If anything goes wrong, fall back to original bytes.
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

interface AssesseeInfo {
  name?: string;
  ay?: string;
  pan?: string;
}

async function extractAssesseeInfo(pdfBuffer: Buffer): Promise<AssesseeInfo> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: false,
      disableFontFace: true,
      verbosity: 0,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    type TextItem = { str: string; transform?: number[] };
    const items = content.items as TextItem[];

    // Build per-line text by clustering items whose y-coord (transform[5]) is similar.
    const lines: { y: number; text: string }[] = [];
    for (const it of items) {
      const y = it.transform ? Math.round(it.transform[5]) : 0;
      const existing = lines.find((l) => Math.abs(l.y - y) <= 2);
      if (existing) existing.text += " " + it.str;
      else lines.push({ y, text: it.str });
    }
    const fullText = lines
      .sort((a, b) => b.y - a.y)
      .map((l) => l.text.replace(/\s+/g, " ").trim())
      .join("\n");

    await doc.destroy();

    const info: AssesseeInfo = {};

    const nameMatch = fullText.match(
      /Name\s+of\s+Assessee\s+(.+?)(?=\s{2,}|\n|Father|Address|E[- ]?Mail|Status|$)/i,
    );
    if (nameMatch) info.name = nameMatch[1].trim();

    const ayMatch = fullText.match(
      /Assessment\s+Year[\s:]*(\d{4}\s*-\s*\d{2,4})/i,
    );
    if (ayMatch) info.ay = ayMatch[1].replace(/\s+/g, "");

    const panMatch = fullText.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
    if (panMatch) info.pan = panMatch[1];

    return info;
  } catch {
    return {};
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

      const assessee = await extractAssesseeInfo(pdfBuffer);

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
      const totalPages = pages.length;

      pages.forEach((page, idx) => {
        const pageNum = idx + 1;
        const { width, height } = page.getSize();

        // ----- HEADER MASK (white block hides any underlying content) -----
        page.drawRectangle({
          x: 0,
          y: height - HEADER_HEIGHT,
          width,
          height: HEADER_HEIGHT,
          color: WHITE,
          opacity: 1,
        });

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

        // Per-page assessee header on pages 2+ (only if we successfully parsed it)
        if (pageNum >= 2 && (assessee.name || assessee.pan || assessee.ay)) {
          const parts: string[] = [];
          if (assessee.name) parts.push(`NAME OF ASSESSEE : ${assessee.name}`);
          if (assessee.ay) parts.push(`A.Y. ${assessee.ay}`);
          if (assessee.pan) parts.push(`PAN : ${assessee.pan}`);
          const line = parts.join("    ");

          page.drawText(line, {
            x: 36,
            y: height - 14,
            size: 8,
            font: helvBold,
            color: TEXT_NAVY,
          });
        }

        // Subtle divider below header
        page.drawLine({
          start: { x: 36, y: height - HEADER_HEIGHT + 4 },
          end: { x: width - 36, y: height - HEADER_HEIGHT + 4 },
          thickness: 0.5,
          color: RULE_GREY,
        });

        // ----- FOOTER MASK -----
        page.drawRectangle({
          x: 0,
          y: 0,
          width,
          height: FOOTER_HEIGHT,
          color: WHITE,
          opacity: 1,
        });

        // ----- FOOTER -----
        const footerTop = FOOTER_HEIGHT - 8;

        page.drawLine({
          start: { x: 36, y: footerTop },
          end: { x: width - 36, y: footerTop },
          thickness: 0.5,
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

        // Page number on every page (right-aligned just above the footer divider)
        if (totalPages > 1) {
          const pageLabel = `Page ${pageNum} of ${totalPages}`;
          const pageLabelW = helv.widthOfTextAtSize(pageLabel, 8);
          page.drawText(pageLabel, {
            x: width - 36 - pageLabelW,
            y: footerTop + 4,
            size: 8,
            font: helv,
            color: TEXT_NAVY,
          });
        }
      });

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
