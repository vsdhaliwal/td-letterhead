import { NextResponse } from "next/server";
import { listLetterheadTemplates } from "../../../../lib/letterhead/templates";

export async function GET() {
  try {
    const templates = await listLetterheadTemplates();
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json({ templates: [] }, { status: 200 });
  }
}
