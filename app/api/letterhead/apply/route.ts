import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";
import { resolveTemplateById } from "../../../../lib/letterhead/templates";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_EXTS = new Set([".pdf", ".rtf", ".doc", ".docx", ".odt"]);
const TOP_TRIM_FIRST_PAGE = 92;
const TOP_TRIM_OTHER_PAGES = 30;
const TOP_HEADER_CLEANUP_HEIGHT_FIRST_PAGE = 56;
const TOP_HEADER_CLEANUP_HEIGHT_OTHER_PAGES = 64;
const BOTTOM_FOOTER_CLEANUP_HEIGHT_FIRST_PAGE = 64;
const BOTTOM_FOOTER_CLEANUP_HEIGHT_OTHER_PAGES = 84;
const MIN_TUNE = 0;
const MAX_TUNE = 200;

type LetterheadTune = {
  topTrimFirstPage: number;
  topTrimOtherPages: number;
  topHeaderCleanupFirstPage: number;
  topHeaderCleanupOtherPages: number;
  bottomFooterCleanupFirstPage: number;
  bottomFooterCleanupOtherPages: number;
  contentPaddingTopFirstPage: number;
  contentPaddingTopOtherPages: number;
  contentPaddingBottomFirstPage: number;
  contentPaddingBottomOtherPages: number;
};

function pageValue(
  pageIndex: number,
  firstPage: number,
  otherPages: number,
): number {
  return pageIndex === 0 ? firstPage : otherPages;
}

async function resolveSofficePath(): Promise<string | null> {
  const candidates = [
    process.env.SOFFICE_PATH,
    "soffice",
    "/opt/homebrew/bin/soffice",
    "/usr/local/bin/soffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  ].filter((v): v is string => Boolean(v));

  for (const candidate of candidates) {
    if (candidate === "soffice") return candidate;
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // keep checking
    }
  }
  return null;
}

function ensureRtfMargins(rtfText: string): string {
  const stripped = rtfText
    .replace(/\\margt-?\d+/g, "")
    .replace(/\\margb-?\d+/g, "")
    .replace(/\\margl-?\d+/g, "")
    .replace(/\\margr-?\d+/g, "");

  // Keep moderate margins so converted pages stay stable with letterhead overlay.
  const margins = "\\margt900\\margb900\\margl900\\margr900";
  if (stripped.includes("\\rtf1")) {
    return stripped.replace(/(\\rtf1\b)/, `$1${margins}`);
  }
  return stripped;
}

async function convertToPdfWithSoffice(
  inputBuffer: Buffer,
  ext: string,
): Promise<Buffer> {
  const sofficePath = await resolveSofficePath();
  if (!sofficePath) {
    throw new Error("soffice_not_found");
  }

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
        sofficePath,
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

function clampTuneValue(value: number, fallback: number): number {
  if (Number.isNaN(value)) return fallback;
  return Math.max(MIN_TUNE, Math.min(MAX_TUNE, Math.round(value)));
}

function parseTune(formData: FormData): LetterheadTune {
  const getNum = (key: string, fallback: number) => {
    const raw = formData.get(key);
    if (typeof raw !== "string") return fallback;
    return clampTuneValue(Number(raw), fallback);
  };

  return {
    topTrimFirstPage: getNum("topTrimFirstPage", TOP_TRIM_FIRST_PAGE),
    topTrimOtherPages: getNum("topTrimOtherPages", TOP_TRIM_OTHER_PAGES),
    topHeaderCleanupFirstPage: getNum(
      "topHeaderCleanupFirstPage",
      TOP_HEADER_CLEANUP_HEIGHT_FIRST_PAGE,
    ),
    topHeaderCleanupOtherPages: getNum(
      "topHeaderCleanupOtherPages",
      TOP_HEADER_CLEANUP_HEIGHT_OTHER_PAGES,
    ),
    bottomFooterCleanupFirstPage: getNum(
      "bottomFooterCleanupFirstPage",
      BOTTOM_FOOTER_CLEANUP_HEIGHT_FIRST_PAGE,
    ),
    bottomFooterCleanupOtherPages: getNum(
      "bottomFooterCleanupOtherPages",
      BOTTOM_FOOTER_CLEANUP_HEIGHT_OTHER_PAGES,
    ),
    contentPaddingTopFirstPage: getNum("contentPaddingTopFirstPage", 0),
    contentPaddingTopOtherPages: getNum("contentPaddingTopOtherPages", 0),
    contentPaddingBottomFirstPage: getNum("contentPaddingBottomFirstPage", 0),
    contentPaddingBottomOtherPages: getNum("contentPaddingBottomOtherPages", 0),
  };
}

async function applyLetterhead(
  sourcePdfBuffer: Buffer,
  tune: LetterheadTune,
  selectedTemplateId?: string | null,
  selectedOtherPagesTemplateId?: string | null,
  maxPages?: number,
): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(sourcePdfBuffer, {
    ignoreEncryption: true,
  });
  const sourcePageCount = sourceDoc.getPageCount();
  if (sourcePageCount === 0) {
    throw new Error("This document has no pages.");
  }

  const outDoc = await PDFDocument.create();
  const selectedTemplate = await resolveTemplateById(selectedTemplateId);
  const skipOtherPagesLetterhead = selectedOtherPagesTemplateId === "none";
  const selectedOtherPagesTemplate =
    !skipOtherPagesLetterhead && selectedOtherPagesTemplateId
      ? await resolveTemplateById(selectedOtherPagesTemplateId)
      : null;
  const firstPageTemplateBytes = await fs.readFile(selectedTemplate.firstPagePath);
  const [firstPageTemplate] = await outDoc.embedPdf(firstPageTemplateBytes, [0]);
  let otherPagesEmbeddedTemplate: Awaited<
    ReturnType<typeof outDoc.embedPdf>
  >[number] | null = null;
  if (!skipOtherPagesLetterhead) {
    const otherPagesTemplateBytes = await fs.readFile(
      selectedOtherPagesTemplate?.firstPagePath ?? selectedTemplate.otherPagesPath,
    );
    [otherPagesEmbeddedTemplate] = await outDoc.embedPdf(otherPagesTemplateBytes, [0]);
  }

  const pagesToProcess = maxPages
    ? Math.min(sourcePageCount, maxPages)
    : sourcePageCount;

  for (let pageIndex = 0; pageIndex < pagesToProcess; pageIndex++) {
    const sourcePage = sourceDoc.getPage(pageIndex);
    const sourceWidth = sourcePage.getWidth();
    const sourceHeight = sourcePage.getHeight();
    const topTrim = pageValue(
      pageIndex,
      tune.topTrimFirstPage,
      tune.topTrimOtherPages,
    );
    const paddingTop = pageValue(
      pageIndex,
      tune.contentPaddingTopFirstPage,
      tune.contentPaddingTopOtherPages,
    );
    const paddingBottom = pageValue(
      pageIndex,
      tune.contentPaddingBottomFirstPage,
      tune.contentPaddingBottomOtherPages,
    );
    const topHeaderCleanupHeight = pageValue(
      pageIndex,
      tune.topHeaderCleanupFirstPage,
      tune.topHeaderCleanupOtherPages,
    );
    const bottomFooterCleanupHeight = pageValue(
      pageIndex,
      tune.bottomFooterCleanupFirstPage,
      tune.bottomFooterCleanupOtherPages,
    );

    const page = outDoc.addPage([sourceWidth, sourceHeight]);
    const width = page.getWidth();
    const height = page.getHeight();
    const croppedHeight = Math.max(0, sourceHeight - topTrim);
    const availableHeight = Math.max(0, croppedHeight - paddingTop - paddingBottom);
    const scale =
      croppedHeight > 0
        ? Math.min(1, availableHeight / croppedHeight)
        : 1;
    const drawWidth = sourceWidth * scale;
    const drawHeight = croppedHeight * scale;
    const drawX = (sourceWidth - drawWidth) / 2;
    const drawY = paddingBottom;

    const embeddedSource = await outDoc.embedPage(sourcePage, {
      left: 0,
      right: sourceWidth,
      bottom: 0,
      top: sourceHeight - topTrim,
    });

    // Shrink content inward to add breathing room without cropping text away.
    page.drawPage(embeddedSource, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });

    // Remove source header/footer traces (assessee/page marker/footer page count)
    // without trimming body content.
    page.drawRectangle({
      x: 0,
      y: height - topHeaderCleanupHeight,
      width,
      height: topHeaderCleanupHeight,
      color: rgb(1, 1, 1),
    });
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: bottomFooterCleanupHeight,
      color: rgb(1, 1, 1),
    });

    if (pageIndex === 0) {
      page.drawPage(firstPageTemplate, { x: 0, y: 0, width, height });
    } else if (otherPagesEmbeddedTemplate) {
      page.drawPage(otherPagesEmbeddedTemplate, { x: 0, y: 0, width, height });
    }
  }

  return outDoc.save();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const tune = parseTune(formData);
    const selectedTemplateId =
      typeof formData.get("templateId") === "string"
        ? (formData.get("templateId") as string)
        : null;
    const selectedOtherPagesTemplateId =
      typeof formData.get("otherPagesTemplateId") === "string"
        ? (formData.get("otherPagesTemplateId") as string)
        : null;
    const file = formData.get("file");
    const isPreview = formData.get("preview") === "true";
    const previewMaxPages = isPreview
      ? Math.min(10, Math.max(1, Number(formData.get("previewMaxPages")) || 2))
      : undefined;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a file." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Max size is 25 MB." },
        { status: 413 },
      );
    }

    const originalName = file.name || "computation";
    const ext = path.extname(originalName).toLowerCase();
    if (!ACCEPTED_EXTS.has(ext)) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type. Please upload a PDF, RTF, DOC, or DOCX file.",
        },
        { status: 400 },
      );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    let pdfBuffer: Buffer;
    if (ext === ".pdf") {
      pdfBuffer = inputBuffer;
    } else {
      try {
        pdfBuffer = await convertToPdfWithSoffice(inputBuffer, ext);
      } catch (err) {
        if (err instanceof Error && err.message === "soffice_not_found") {
          return NextResponse.json(
            {
              error:
                "LibreOffice is required for DOC/RTF conversion. Install it and ensure `soffice` is available.",
            },
            { status: 400 },
          );
        }
        return NextResponse.json(
          {
            error:
              "Could not convert this file. Install LibreOffice and make sure `soffice` is available in PATH.",
          },
          { status: 400 },
        );
      }
    }

    let out: Uint8Array;
    try {
      out = await applyLetterhead(
        pdfBuffer,
        tune,
        selectedTemplateId,
        selectedOtherPagesTemplateId,
        previewMaxPages,
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while processing.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const baseName =
      path.basename(originalName, path.extname(originalName)) || "computation";
    const downloadName = `${baseName}-letterhead.pdf`;

    return new NextResponse(Buffer.from(out), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": isPreview
          ? "inline"
          : `attachment; filename="${downloadName}"`,
        "Content-Length": out.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while applying the letterhead." },
      { status: 500 },
    );
  }
}
