module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:child_process [external] (node:child_process, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:child_process", () => require("node:child_process"));

module.exports = mod;
}),
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

module.exports = mod;
}),
"[externals]/node:os [external] (node:os, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:os", () => require("node:os"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/lib/letterhead/templates.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "listLetterheadTemplates",
    ()=>listLetterheadTemplates,
    "resolveTemplateById",
    ()=>resolveTemplateById
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
const DEFAULT_TEMPLATE_PATH = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "letterhead-template.pdf");
const DEFAULT_TEMPLATE_PATH_AFTER_FIRST_PAGE = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "letterhead-template-after-first-page.pdf");
const DEFAULT_TEMPLATES_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), "letterheads");
function normalizeId(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
async function fileExists(filePath) {
    try {
        await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].access(filePath);
        return true;
    } catch  {
        return false;
    }
}
async function listLetterheadTemplates() {
    const templates = await getLetterheadTemplateDefinitions();
    return templates.map(({ id, label })=>({
            id,
            label
        }));
}
async function resolveTemplateById(templateId) {
    const templates = await getLetterheadTemplateDefinitions();
    if (!templateId) return templates[0];
    return templates.find((template)=>template.id === templateId) ?? templates[0];
}
async function getLetterheadTemplateDefinitions() {
    const templates = [];
    const fromEnvFirst = process.env.LETTERHEAD_TEMPLATE_PATH;
    const fromEnvOther = process.env.LETTERHEAD_TEMPLATE_PATH_AFTER_FIRST_PAGE;
    const defaultFirstPath = fromEnvFirst || DEFAULT_TEMPLATE_PATH;
    const defaultOtherPath = fromEnvOther || DEFAULT_TEMPLATE_PATH_AFTER_FIRST_PAGE;
    const fallbackOtherPath = fromEnvFirst || DEFAULT_TEMPLATE_PATH;
    const otherPagesPath = await fileExists(defaultOtherPath) ? defaultOtherPath : fallbackOtherPath;
    if (await fileExists(defaultFirstPath)) {
        templates.push({
            id: "default",
            label: "Default Letterhead",
            firstPagePath: defaultFirstPath,
            otherPagesPath
        });
    }
    // Include any PDF present at project root as selectable templates.
    try {
        const rootEntries = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readdir(process.cwd());
        for (const fileName of rootEntries){
            if (!fileName.toLowerCase().endsWith(".pdf")) continue;
            const fullPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(process.cwd(), fileName);
            const id = `root-${normalizeId(fileName.replace(/\.pdf$/i, ""))}`;
            if (!id || templates.some((template)=>template.id === id)) continue;
            templates.push({
                id,
                label: fileName,
                firstPagePath: fullPath,
                otherPagesPath: fullPath
            });
        }
    } catch  {
    // Ignore root scan failures and continue with defaults.
    }
    const configuredDir = process.env.LETTERHEAD_TEMPLATES_DIR || DEFAULT_TEMPLATES_DIR;
    let dirEntries = [];
    try {
        dirEntries = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readdir(configuredDir);
    } catch  {
        return templates.length > 0 ? templates : [];
    }
    const byId = new Map();
    for (const fileName of dirEntries){
        if (!fileName.toLowerCase().endsWith(".pdf")) continue;
        const fullPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(configuredDir, fileName);
        const base = fileName.replace(/\.pdf$/i, "");
        let id = "";
        let role = "single";
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
        const current = byId.get(id) ?? {
            id,
            label: toLabel(id)
        };
        if (role === "first") current.firstPagePath = fullPath;
        else if (role === "other") current.otherPagesPath = fullPath;
        else {
            current.firstPagePath = current.firstPagePath ?? fullPath;
            current.otherPagesPath = current.otherPagesPath ?? fullPath;
        }
        byId.set(id, current);
    }
    const discovered = [];
    for (const value of byId.values()){
        if (!value.id || !value.label || !value.firstPagePath) continue;
        discovered.push({
            id: value.id,
            label: value.label,
            firstPagePath: value.firstPagePath,
            otherPagesPath: value.otherPagesPath ?? value.firstPagePath
        });
    }
    const deduped = discovered.filter((template)=>template.id !== "default");
    return templates.concat(deduped);
}
function toLabel(id) {
    return id.split("-").filter(Boolean).map((part)=>part[0].toUpperCase() + part.slice(1)).join(" ");
}
}),
"[project]/app/api/letterhead/apply/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/pdf-lib/es/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$PDFDocument$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__PDFDocument$3e$__ = __turbopack_context__.i("[project]/node_modules/pdf-lib/es/api/PDFDocument.js [app-route] (ecmascript) <export default as PDFDocument>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/pdf-lib/es/api/colors.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$child_process__$5b$external$5d$__$28$node$3a$child_process$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:child_process [external] (node:child_process, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:os [external] (node:os, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$letterhead$2f$templates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/letterhead/templates.ts [app-route] (ecmascript)");
;
;
;
;
;
;
;
;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
const ACCEPTED_EXTS = new Set([
    ".pdf",
    ".rtf",
    ".doc",
    ".docx",
    ".odt"
]);
const TOP_TRIM_FIRST_PAGE = 92;
const TOP_TRIM_OTHER_PAGES = 30;
const TOP_HEADER_CLEANUP_HEIGHT_FIRST_PAGE = 56;
const TOP_HEADER_CLEANUP_HEIGHT_OTHER_PAGES = 64;
const BOTTOM_FOOTER_CLEANUP_HEIGHT_FIRST_PAGE = 64;
const BOTTOM_FOOTER_CLEANUP_HEIGHT_OTHER_PAGES = 84;
const MIN_TUNE = 0;
const MAX_TUNE = 200;
async function resolveSofficePath() {
    const candidates = [
        process.env.SOFFICE_PATH,
        "soffice",
        "/opt/homebrew/bin/soffice",
        "/usr/local/bin/soffice",
        "/Applications/LibreOffice.app/Contents/MacOS/soffice"
    ].filter((v)=>Boolean(v));
    for (const candidate of candidates){
        if (candidate === "soffice") return candidate;
        try {
            await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].access(candidate);
            return candidate;
        } catch  {
        // keep checking
        }
    }
    return null;
}
function ensureRtfMargins(rtfText) {
    const stripped = rtfText.replace(/\\margt-?\d+/g, "").replace(/\\margb-?\d+/g, "").replace(/\\margl-?\d+/g, "").replace(/\\margr-?\d+/g, "");
    // Keep moderate margins so converted pages stay stable with letterhead overlay.
    const margins = "\\margt900\\margb900\\margl900\\margr900";
    if (stripped.includes("\\rtf1")) {
        return stripped.replace(/(\\rtf1\b)/, `$1${margins}`);
    }
    return stripped;
}
async function convertToPdfWithSoffice(inputBuffer, ext) {
    const sofficePath = await resolveSofficePath();
    if (!sofficePath) {
        throw new Error("soffice_not_found");
    }
    const workDir = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].mkdtemp(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__["default"].tmpdir(), "lh-"));
    const profileDir = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(workDir, "profile");
    let processedInput = inputBuffer;
    if (ext === ".rtf") {
        try {
            const rtfStr = inputBuffer.toString("latin1");
            processedInput = Buffer.from(ensureRtfMargins(rtfStr), "latin1");
        } catch  {
            processedInput = inputBuffer;
        }
    }
    const inputPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(workDir, `in-${(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["randomUUID"])()}${ext}`);
    await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].writeFile(inputPath, processedInput);
    try {
        await new Promise((resolve, reject)=>{
            const proc = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$child_process__$5b$external$5d$__$28$node$3a$child_process$2c$__cjs$29$__["spawn"])(sofficePath, [
                "--headless",
                "--norestore",
                "--nologo",
                "--nofirststartwizard",
                `-env:UserInstallation=file://${profileDir}`,
                "--convert-to",
                "pdf",
                "--outdir",
                workDir,
                inputPath
            ], {
                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ]
            });
            const timeout = setTimeout(()=>{
                proc.kill("SIGKILL");
                reject(new Error("Conversion timed out"));
            }, 60_000);
            let stderr = "";
            proc.stderr.on("data", (d)=>{
                stderr += d.toString();
            });
            proc.on("error", (err)=>{
                clearTimeout(timeout);
                reject(err);
            });
            proc.on("close", (code)=>{
                clearTimeout(timeout);
                if (code === 0) resolve();
                else reject(new Error(`soffice exited with ${code}: ${stderr}`));
            });
        });
        const baseName = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].basename(inputPath, ext);
        const outputPath = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].join(workDir, `${baseName}.pdf`);
        return await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(outputPath);
    } finally{
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].rm(workDir, {
            recursive: true,
            force: true
        }).catch(()=>{});
    }
}
function clampTuneValue(value, fallback) {
    if (Number.isNaN(value)) return fallback;
    return Math.max(MIN_TUNE, Math.min(MAX_TUNE, Math.round(value)));
}
function parseTune(formData) {
    const getNum = (key, fallback)=>{
        const raw = formData.get(key);
        if (typeof raw !== "string") return fallback;
        return clampTuneValue(Number(raw), fallback);
    };
    return {
        topTrimFirstPage: getNum("topTrimFirstPage", TOP_TRIM_FIRST_PAGE),
        topTrimOtherPages: getNum("topTrimOtherPages", TOP_TRIM_OTHER_PAGES),
        topHeaderCleanupFirstPage: getNum("topHeaderCleanupFirstPage", TOP_HEADER_CLEANUP_HEIGHT_FIRST_PAGE),
        topHeaderCleanupOtherPages: getNum("topHeaderCleanupOtherPages", TOP_HEADER_CLEANUP_HEIGHT_OTHER_PAGES),
        bottomFooterCleanupFirstPage: getNum("bottomFooterCleanupFirstPage", BOTTOM_FOOTER_CLEANUP_HEIGHT_FIRST_PAGE),
        bottomFooterCleanupOtherPages: getNum("bottomFooterCleanupOtherPages", BOTTOM_FOOTER_CLEANUP_HEIGHT_OTHER_PAGES)
    };
}
async function applyLetterhead(sourcePdfBuffer, tune, selectedTemplateId, selectedOtherPagesTemplateId) {
    const sourceDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$PDFDocument$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__PDFDocument$3e$__["PDFDocument"].load(sourcePdfBuffer, {
        ignoreEncryption: true
    });
    const sourcePageCount = sourceDoc.getPageCount();
    if (sourcePageCount === 0) {
        throw new Error("This document has no pages.");
    }
    const outDoc = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$PDFDocument$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__PDFDocument$3e$__["PDFDocument"].create();
    const selectedTemplate = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$letterhead$2f$templates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveTemplateById"])(selectedTemplateId);
    const selectedOtherPagesTemplate = selectedOtherPagesTemplateId ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$letterhead$2f$templates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveTemplateById"])(selectedOtherPagesTemplateId) : null;
    const [firstPageTemplateBytes, otherPagesTemplateBytes] = await Promise.all([
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(selectedTemplate.firstPagePath),
        __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(selectedOtherPagesTemplate?.firstPagePath ?? selectedTemplate.otherPagesPath)
    ]);
    const [firstPageTemplate] = await outDoc.embedPdf(firstPageTemplateBytes, [
        0
    ]);
    const [otherPagesEmbeddedTemplate] = await outDoc.embedPdf(otherPagesTemplateBytes, [
        0
    ]);
    for(let pageIndex = 0; pageIndex < sourcePageCount; pageIndex++){
        const sourcePage = sourceDoc.getPage(pageIndex);
        const sourceWidth = sourcePage.getWidth();
        const sourceHeight = sourcePage.getHeight();
        const topTrim = pageIndex === 0 ? tune.topTrimFirstPage : tune.topTrimOtherPages;
        const topHeaderCleanupHeight = pageIndex === 0 ? tune.topHeaderCleanupFirstPage : tune.topHeaderCleanupOtherPages;
        const bottomFooterCleanupHeight = pageIndex === 0 ? tune.bottomFooterCleanupFirstPage : tune.bottomFooterCleanupOtherPages;
        const page = outDoc.addPage([
            sourceWidth,
            sourceHeight
        ]);
        const width = page.getWidth();
        const height = page.getHeight();
        const embeddedSource = await outDoc.embedPage(sourcePage, {
            left: 0,
            right: sourceWidth,
            bottom: 0,
            top: sourceHeight - topTrim
        });
        // Crop from top on later pages to create fixed gap under branding.
        page.drawPage(embeddedSource, {
            x: 0,
            y: 0,
            width: sourceWidth,
            height: sourceHeight - topTrim
        });
        // Remove source header/footer traces (assessee/page marker/footer page count)
        // without trimming body content.
        page.drawRectangle({
            x: 0,
            y: height - topHeaderCleanupHeight,
            width,
            height: topHeaderCleanupHeight,
            color: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rgb"])(1, 1, 1)
        });
        page.drawRectangle({
            x: 0,
            y: 0,
            width,
            height: bottomFooterCleanupHeight,
            color: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$pdf$2d$lib$2f$es$2f$api$2f$colors$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["rgb"])(1, 1, 1)
        });
        page.drawPage(pageIndex === 0 ? firstPageTemplate : otherPagesEmbeddedTemplate, {
            x: 0,
            y: 0,
            width,
            height
        });
    }
    return outDoc.save();
}
async function POST(request) {
    try {
        const formData = await request.formData();
        const tune = parseTune(formData);
        const selectedTemplateId = typeof formData.get("templateId") === "string" ? formData.get("templateId") : null;
        const selectedOtherPagesTemplateId = typeof formData.get("otherPagesTemplateId") === "string" ? formData.get("otherPagesTemplateId") : null;
        const file = formData.get("file");
        if (!(file instanceof File)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Please upload a file."
            }, {
                status: 400
            });
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "File is too large. Max size is 25 MB."
            }, {
                status: 413
            });
        }
        const originalName = file.name || "computation";
        const ext = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(originalName).toLowerCase();
        if (!ACCEPTED_EXTS.has(ext)) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Unsupported file type. Please upload a PDF, RTF, DOC, or DOCX file."
            }, {
                status: 400
            });
        }
        const inputBuffer = Buffer.from(await file.arrayBuffer());
        let pdfBuffer;
        if (ext === ".pdf") {
            pdfBuffer = inputBuffer;
        } else {
            try {
                pdfBuffer = await convertToPdfWithSoffice(inputBuffer, ext);
            } catch (err) {
                if (err instanceof Error && err.message === "soffice_not_found") {
                    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                        error: "LibreOffice is required for DOC/RTF conversion. Install it and ensure `soffice` is available."
                    }, {
                        status: 400
                    });
                }
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: "Could not convert this file. Install LibreOffice and make sure `soffice` is available in PATH."
                }, {
                    status: 400
                });
            }
        }
        let out;
        try {
            out = await applyLetterhead(pdfBuffer, tune, selectedTemplateId, selectedOtherPagesTemplateId);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong while processing.";
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: message
            }, {
                status: 400
            });
        }
        const baseName = __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].basename(originalName, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["default"].extname(originalName)) || "computation";
        const downloadName = `${baseName}-letterhead.pdf`;
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](Buffer.from(out), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${downloadName}"`,
                "Content-Length": out.length.toString()
            }
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Something went wrong while applying the letterhead."
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0o_u5uc._.js.map