import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { randomUUID } from "node:crypto";

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_EXTS = new Set([".pdf", ".rtf", ".doc", ".docx", ".odt"]);
const TOP_TRIM_FIRST_PAGE = 92;
const TOP_TRIM_OTHER_PAGES = 96;
const TOP_HEADER_CLEANUP_HEIGHT = 56;
const BOTTOM_FOOTER_CLEANUP_HEIGHT = 64;
const DEFAULT_TEMPLATE_PATH =
  path.join(process.cwd(), "letterhead-template.pdf");
const DEFAULT_TEMPLATE_PATH_AFTER_FIRST_PAGE = path.join(
  process.cwd(),
  "letterhead-template-after-first-page.pdf",
);

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

async function loadTemplateFromCandidates(candidates: string[]): Promise<Buffer> {
  for (const candidate of candidates) {
    try {
      return await fs.readFile(candidate);
    } catch {
      // Continue searching
    }
  }
  throw new Error("Template not found.");
}

async function loadLetterheadTemplates(): Promise<{
  firstPageTemplateBytes: Buffer;
  otherPagesTemplateBytes: Buffer;
}> {
  const firstPageTemplateBytes = await loadTemplateFromCandidates(
    [process.env.LETTERHEAD_TEMPLATE_PATH, DEFAULT_TEMPLATE_PATH].filter(
      (v): v is string => Boolean(v),
    ),
  );

  const otherPagesTemplateBytes = await loadTemplateFromCandidates(
    [
      process.env.LETTERHEAD_TEMPLATE_PATH_AFTER_FIRST_PAGE,
      DEFAULT_TEMPLATE_PATH_AFTER_FIRST_PAGE,
      process.env.LETTERHEAD_TEMPLATE_PATH,
      DEFAULT_TEMPLATE_PATH,
    ].filter((v): v is string => Boolean(v)),
  );

  return { firstPageTemplateBytes, otherPagesTemplateBytes };
}

async function applyLetterhead(sourcePdfBuffer: Buffer): Promise<Uint8Array> {
  const sourceDoc = await PDFDocument.load(sourcePdfBuffer, {
    ignoreEncryption: true,
  });
  const sourcePageCount = sourceDoc.getPageCount();
  if (sourcePageCount === 0) {
    throw new Error("This document has no pages.");
  }

  const outDoc = await PDFDocument.create();
  const { firstPageTemplateBytes, otherPagesTemplateBytes } =
    await loadLetterheadTemplates();
  const [firstPageTemplate] = await outDoc.embedPdf(firstPageTemplateBytes, [0]);
  const [otherPagesTemplate] = await outDoc.embedPdf(otherPagesTemplateBytes, [0]);

  for (let pageIndex = 0; pageIndex < sourcePageCount; pageIndex++) {
    const sourcePage = sourceDoc.getPage(pageIndex);
    const sourceWidth = sourcePage.getWidth();
    const sourceHeight = sourcePage.getHeight();
    const topTrim = pageIndex === 0 ? TOP_TRIM_FIRST_PAGE : TOP_TRIM_OTHER_PAGES;

    const page = outDoc.addPage([sourceWidth, sourceHeight]);
    const width = page.getWidth();
    const height = page.getHeight();
    const embeddedSource = await outDoc.embedPage(sourcePage, {
      left: 0,
      right: sourceWidth,
      bottom: 0,
      top: sourceHeight - topTrim,
    });

    // Crop from top on later pages to create fixed gap under branding.
    page.drawPage(embeddedSource, {
      x: 0,
      y: 0,
      width: sourceWidth,
      height: sourceHeight - topTrim,
    });

    // Remove source header/footer traces (assessee/page marker/footer page count)
    // without trimming body content.
    page.drawRectangle({
      x: 0,
      y: height - TOP_HEADER_CLEANUP_HEIGHT,
      width,
      height: TOP_HEADER_CLEANUP_HEIGHT,
      color: rgb(1, 1, 1),
    });
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height: BOTTOM_FOOTER_CLEANUP_HEIGHT,
      color: rgb(1, 1, 1),
    });

    page.drawPage(pageIndex === 0 ? firstPageTemplate : otherPagesTemplate, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return outDoc.save();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

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
      out = await applyLetterhead(pdfBuffer);
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
        "Content-Disposition": `attachment; filename="${downloadName}"`,
        "Content-Length": out.length.toString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while applying the letterhead." },
      { status: 500 },
    );
  }
}
