import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { resolveTemplateById } from "../../../../lib/letterhead/templates";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");
    const pageType = searchParams.get("pageType");

    const template = await resolveTemplateById(templateId);
    const templatePath =
      pageType === "other" ? template.otherPagesPath : template.firstPagePath;
    const fileBuffer = await fs.readFile(templatePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load template preview." },
      { status: 404 },
    );
  }
}
