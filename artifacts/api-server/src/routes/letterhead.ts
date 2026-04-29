import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

router.post(
  "/letterhead/apply",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "Please upload a PDF file." });
        return;
      }

      const isPdfMime =
        req.file.mimetype === "application/pdf" ||
        req.file.originalname.toLowerCase().endsWith(".pdf");
      if (!isPdfMime) {
        res.status(400).json({ error: "Only PDF files are supported." });
        return;
      }

      let pdfDoc: PDFDocument;
      try {
        pdfDoc = await PDFDocument.load(req.file.buffer, {
          ignoreEncryption: true,
        });
      } catch (err) {
        req.log.warn({ err }, "Failed to parse uploaded PDF");
        res
          .status(400)
          .json({ error: "Could not read this PDF. It may be corrupted." });
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

        // Center wordmark + logo as a horizontal group
        const wordmark = spacedCaps("TAX DELIVER", 1);
        const wordmarkSize = 22;
        const wordmarkW = helvBold.widthOfTextAtSize(wordmark, wordmarkSize);

        const tagline = spacedCaps("YOUR TRUSTED TAX ADVISOR", 2);
        const taglineSize = 7.5;
        const taglineW = helv.widthOfTextAtSize(tagline, taglineSize);

        const groupGap = 14;
        const groupW = logoW + groupGap + Math.max(wordmarkW, taglineW);
        const groupX = (width - groupW) / 2;

        // Logo on the left
        page.drawImage(logoImage, {
          x: groupX,
          y: headerTop - logoH,
          width: logoW,
          height: logoH,
        });

        // Wordmark on the right of the logo
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

        // Header divider line
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
        req.file.originalname.replace(/\.pdf$/i, "") || "computation";
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
