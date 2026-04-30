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
"[externals]/node:fs [external] (node:fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:fs", () => require("node:fs"));

module.exports = mod;
}),
"[externals]/node:path [external] (node:path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:path", () => require("node:path"));

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
"[project]/app/api/letterhead/template-preview/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs [external] (node:fs, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$letterhead$2f$templates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/letterhead/templates.ts [app-route] (ecmascript)");
;
;
;
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const templateId = searchParams.get("templateId");
        const pageType = searchParams.get("pageType");
        const template = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$letterhead$2f$templates$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveTemplateById"])(templateId);
        const templatePath = pageType === "other" ? template.otherPagesPath : template.firstPagePath;
        const fileBuffer = await __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs__$5b$external$5d$__$28$node$3a$fs$2c$__cjs$29$__["promises"].readFile(templatePath);
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"](fileBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Cache-Control": "no-store"
            }
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Could not load template preview."
        }, {
            status: 404
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__11swu~z._.js.map