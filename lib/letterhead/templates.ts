import { promises as fs } from "node:fs";
import path from "node:path";

const DEFAULT_TEMPLATE_PATH = path.join(process.cwd(), "letterhead-template.pdf");
const DEFAULT_TEMPLATE_PATH_AFTER_FIRST_PAGE = path.join(
  process.cwd(),
  "letterhead-template-after-first-page.pdf",
);
const DEFAULT_TEMPLATES_DIR = path.join(process.cwd(), "letterheads");

export type LetterheadTemplateDefinition = {
  id: string;
  label: string;
  firstPagePath: string;
  otherPagesPath: string;
};

function normalizeId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function listLetterheadTemplates(): Promise<
  Array<Pick<LetterheadTemplateDefinition, "id" | "label">>
> {
  const templates = await getLetterheadTemplateDefinitions();
  return templates.map(({ id, label }) => ({ id, label }));
}

export async function resolveTemplateById(
  templateId?: string | null,
): Promise<LetterheadTemplateDefinition> {
  const templates = await getLetterheadTemplateDefinitions();
  if (!templateId) return templates[0];
  return templates.find((template) => template.id === templateId) ?? templates[0];
}

async function getLetterheadTemplateDefinitions(): Promise<LetterheadTemplateDefinition[]> {
  const templates: LetterheadTemplateDefinition[] = [];
  const fromEnvFirst = process.env.LETTERHEAD_TEMPLATE_PATH;
  const fromEnvOther = process.env.LETTERHEAD_TEMPLATE_PATH_AFTER_FIRST_PAGE;

  const defaultFirstPath = fromEnvFirst || DEFAULT_TEMPLATE_PATH;
  const defaultOtherPath = fromEnvOther || DEFAULT_TEMPLATE_PATH_AFTER_FIRST_PAGE;
  const fallbackOtherPath = fromEnvFirst || DEFAULT_TEMPLATE_PATH;
  const otherPagesPath = (await fileExists(defaultOtherPath))
    ? defaultOtherPath
    : fallbackOtherPath;

  if (await fileExists(defaultFirstPath)) {
    templates.push({
      id: "default",
      label: "Default Letterhead",
      firstPagePath: defaultFirstPath,
      otherPagesPath,
    });
  }

  // Include any PDF present at project root as selectable templates.
  try {
    const rootEntries = await fs.readdir(process.cwd());
    for (const fileName of rootEntries) {
      if (!fileName.toLowerCase().endsWith(".pdf")) continue;
      const fullPath = path.join(process.cwd(), fileName);
      const id = `root-${normalizeId(fileName.replace(/\.pdf$/i, ""))}`;
      if (!id || templates.some((template) => template.id === id)) continue;
      templates.push({
        id,
        label: fileName,
        firstPagePath: fullPath,
        otherPagesPath: fullPath,
      });
    }
  } catch {
    // Ignore root scan failures and continue with defaults.
  }

  const configuredDir = process.env.LETTERHEAD_TEMPLATES_DIR || DEFAULT_TEMPLATES_DIR;
  let dirEntries: string[] = [];
  try {
    dirEntries = await fs.readdir(configuredDir);
  } catch {
    return templates.length > 0 ? templates : [];
  }

  const byId = new Map<string, Partial<LetterheadTemplateDefinition>>();
  for (const fileName of dirEntries) {
    if (!fileName.toLowerCase().endsWith(".pdf")) continue;
    const fullPath = path.join(configuredDir, fileName);
    const base = fileName.replace(/\.pdf$/i, "");
    let id = "";
    let role: "first" | "other" | "single" = "single";

    if (base.endsWith("-first-page")) {
      id = normalizeId(base.replace(/-first-page$/i, ""));
      role = "first";
    } else if (base.endsWith("-other-pages")) {
      id = normalizeId(base.replace(/-other-pages$/i, ""));
      role = "other";
    } else if (base.endsWith("-after-first-page")) {
      id = normalizeId(base.replace(/-after-first-page$/i, ""));
      role = "other";
    } else {
      id = normalizeId(base);
      role = "single";
    }

    if (!id) continue;
    const current = byId.get(id) ?? { id, label: toLabel(id) };
    if (role === "first") current.firstPagePath = fullPath;
    else if (role === "other") current.otherPagesPath = fullPath;
    else {
      current.firstPagePath = current.firstPagePath ?? fullPath;
      current.otherPagesPath = current.otherPagesPath ?? fullPath;
    }
    byId.set(id, current);
  }

  const discovered: LetterheadTemplateDefinition[] = [];
  for (const value of byId.values()) {
    if (!value.id || !value.label || !value.firstPagePath) continue;
    discovered.push({
      id: value.id,
      label: value.label,
      firstPagePath: value.firstPagePath,
      otherPagesPath: value.otherPagesPath ?? value.firstPagePath,
    });
  }

  const deduped = discovered.filter((template) => template.id !== "default");
  return templates.concat(deduped);
}

function toLabel(id: string): string {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
