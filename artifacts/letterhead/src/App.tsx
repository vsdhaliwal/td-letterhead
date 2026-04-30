"use client";

import { useState, useRef, useEffect, ChangeEvent, DragEvent, MouseEvent } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X, Download, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const queryClient = new QueryClient();
const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type TuneSettings = {
  topTrimFirstPage: number;
  topTrimOtherPages: number;
  topHeaderCleanupFirstPage: number;
  topHeaderCleanupOtherPages: number;
  bottomFooterCleanupFirstPage: number;
  bottomFooterCleanupOtherPages: number;
};

type TemplateOption = {
  id: string;
  label: string;
};

function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ url: string; filename: string } | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("default");
  const [selectedOtherPagesTemplateId, setSelectedOtherPagesTemplateId] = useState("same-as-first");
  const [showTuneSettings, setShowTuneSettings] = useState(false);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [tune, setTune] = useState<TuneSettings>({
    topTrimFirstPage: 92,
    topTrimOtherPages: 30,
    topHeaderCleanupFirstPage: 56,
    topHeaderCleanupOtherPages: 64,
    bottomFooterCleanupFirstPage: 64,
    bottomFooterCleanupOtherPages: 84,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (successData?.url) URL.revokeObjectURL(successData.url);
    };
  }, [successData]);

  useEffect(() => {
    if (!file) {
      setSourcePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const canPreview =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!canPreview) {
      setSourcePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const nextUrl = URL.createObjectURL(file);
    setSourcePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return nextUrl;
    });
  }, [file]);

  useEffect(() => {
    let mounted = true;
    const loadTemplates = async () => {
      try {
        const response = await fetch("/api/letterhead/templates");
        if (!response.ok) return;
        const data = await response.json();
        if (!mounted || !Array.isArray(data.templates)) return;
        const options: TemplateOption[] = data.templates.filter(
          (item: unknown): item is TemplateOption =>
            Boolean(
              item &&
                typeof item === "object" &&
                "id" in item &&
                "label" in item &&
                typeof (item as { id: unknown }).id === "string" &&
                typeof (item as { label: unknown }).label === "string",
            ),
        );
        if (options.length > 0) {
          setTemplates(options);
          setSelectedTemplateId((current) =>
            options.some((option) => option.id === current) ? current : options[0].id,
          );
          setSelectedOtherPagesTemplateId((current) =>
            current === "same-as-first" || options.some((option) => option.id === current)
              ? current
              : "same-as-first",
          );
        }
      } catch {
        // Keep default option if fetching fails.
      }
    };
    loadTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const name = selectedFile.name.toLowerCase();
    const ok = [".pdf", ".rtf", ".doc", ".docx", ".odt"].some((ext) =>
      name.endsWith(ext),
    );
    if (!ok) {
      setError("Please select a PDF, RTF, DOC, or DOCX file.");
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }
    setFile(selectedFile);
    setSuccessData(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = (e: MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setError(null);
    setSuccessData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleApplyLetterhead = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccessData(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("templateId", selectedTemplateId);
    formData.append(
      "otherPagesTemplateId",
      selectedOtherPagesTemplateId === "same-as-first"
        ? ""
        : selectedOtherPagesTemplateId,
    );
    formData.append("topTrimFirstPage", String(tune.topTrimFirstPage));
    formData.append("topTrimOtherPages", String(tune.topTrimOtherPages));
    formData.append("topHeaderCleanupFirstPage", String(tune.topHeaderCleanupFirstPage));
    formData.append("topHeaderCleanupOtherPages", String(tune.topHeaderCleanupOtherPages));
    formData.append("bottomFooterCleanupFirstPage", String(tune.bottomFooterCleanupFirstPage));
    formData.append("bottomFooterCleanupOtherPages", String(tune.bottomFooterCleanupOtherPages));

    try {
      const response = await fetch(`/api/letterhead/apply`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = "An error occurred while processing the file.";
        try {
          const errData = await response.json();
          if (errData.error) {
            errorMessage = errData.error;
          }
        } catch (e) {
          // Ignore parsing error
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const originalName = file.name.replace(/\.(pdf|rtf|docx?|odt)$/i, "");
      const newFilename = `${originalName}-letterhead.pdf`;
      if (successData?.url) URL.revokeObjectURL(successData.url);

      setSuccessData({ url, filename: newFilename });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    if (successData?.url) URL.revokeObjectURL(successData.url);
    setFile(null);
    setSuccessData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const otherPagesTemplatePreviewId =
    selectedOtherPagesTemplateId === "same-as-first"
      ? selectedTemplateId
      : selectedOtherPagesTemplateId;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      {/* Header Strip */}
      <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Tax Deliver Logo" className="h-12 w-12 rounded-md object-contain" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#2d6bf0] leading-none">TAX DELIVER</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">
                Your Trusted Tax Advisor
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        <div className="text-center mb-10 w-full">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            Tax Deliver Letterhead Tool
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Drop your document (RTF or PDF) below to instantly stamp the firm's letterhead on every page.
          </p>
        </div>

        {successData ? (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full"
          >
            <Card className="shadow-lg border-primary/20 bg-white overflow-hidden text-center">
              <div className="bg-primary/5 py-8 border-b border-border/50 flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-4"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                <h2 className="text-2xl font-bold text-foreground">Success!</h2>
                <p className="text-muted-foreground mt-2 max-w-xl mx-auto px-4">
                  The letterhead was applied to your document. Review the full preview below.
                </p>
              </div>
              <CardContent className="p-6 bg-white flex flex-col items-center gap-4">
                <iframe
                  src={successData.url}
                  title="Generated PDF full preview"
                  className="w-full h-[calc(100vh-260px)] min-h-[700px] border rounded-md bg-white"
                />
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
                  <Button asChild variant="outline" className="flex-1 h-12">
                    <a href={successData.url} download={successData.filename}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Again
                    </a>
                  </Button>
                  <Button onClick={resetState} className="flex-1 h-12 shadow-sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Process Another File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <Card className="border-border/50 bg-white">
            <CardContent className="p-4 space-y-4">
              <label className="flex flex-col gap-2 text-sm">
                First Page Letterhead
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="border rounded px-3 py-2 bg-white"
                >
                  {(templates.length > 0
                    ? templates
                    : [{ id: "default", label: "Default Letterhead" }]
                  ).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="border rounded-md overflow-hidden bg-slate-50">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-white">
                  First Page Preview
                </div>
                <iframe
                  key={`first-preview-${selectedTemplateId}`}
                  src={`/api/letterhead/template-preview?templateId=${encodeURIComponent(selectedTemplateId)}&pageType=first`}
                  title="First page letterhead preview"
                  className="w-full h-[260px] bg-white"
                />
              </div>
              <label className="flex flex-col gap-2 text-sm">
                Page 2+ Letterhead
                <select
                  value={selectedOtherPagesTemplateId}
                  onChange={(e) => setSelectedOtherPagesTemplateId(e.target.value)}
                  className="border rounded px-3 py-2 bg-white"
                >
                  <option value="same-as-first">Same as First Page</option>
                  {(templates.length > 0
                    ? templates
                    : [{ id: "default", label: "Default Letterhead" }]
                  ).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="border rounded-md overflow-hidden bg-slate-50">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-white">
                  Page 2+ Preview
                </div>
                <iframe
                  key={`other-preview-${otherPagesTemplatePreviewId}`}
                  src={`/api/letterhead/template-preview?templateId=${encodeURIComponent(otherPagesTemplatePreviewId)}&pageType=other`}
                  title="Page 2 and onward letterhead preview"
                  className="w-full h-[260px] bg-white"
                />
              </div>
              <div className="border rounded-md">
                <button
                  type="button"
                  onClick={() => setShowTuneSettings((v) => !v)}
                  className="w-full px-3 py-2 text-left text-sm font-medium hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>Advanced Trim & Cleanup Settings</span>
                  <span>{showTuneSettings ? "Hide" : "Show"}</span>
                </button>
                {showTuneSettings && (
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm border-t">
                    <label className="flex flex-col gap-1">
                      Top Trim P1
                      <input type="number" min={0} max={200} value={tune.topTrimFirstPage} onChange={(e) => setTune((t) => ({ ...t, topTrimFirstPage: Number(e.target.value || 0) }))} className="border rounded px-2 py-1" />
                    </label>
                    <label className="flex flex-col gap-1">
                      Top Trim P2+
                      <input type="number" min={0} max={200} value={tune.topTrimOtherPages} onChange={(e) => setTune((t) => ({ ...t, topTrimOtherPages: Number(e.target.value || 0) }))} className="border rounded px-2 py-1" />
                    </label>
                    <label className="flex flex-col gap-1">
                      Top Cleanup P1
                      <input type="number" min={0} max={200} value={tune.topHeaderCleanupFirstPage} onChange={(e) => setTune((t) => ({ ...t, topHeaderCleanupFirstPage: Number(e.target.value || 0) }))} className="border rounded px-2 py-1" />
                    </label>
                    <label className="flex flex-col gap-1">
                      Top Cleanup P2+
                      <input type="number" min={0} max={200} value={tune.topHeaderCleanupOtherPages} onChange={(e) => setTune((t) => ({ ...t, topHeaderCleanupOtherPages: Number(e.target.value || 0) }))} className="border rounded px-2 py-1" />
                    </label>
                    <label className="flex flex-col gap-1">
                      Bottom Cleanup P1
                      <input type="number" min={0} max={200} value={tune.bottomFooterCleanupFirstPage} onChange={(e) => setTune((t) => ({ ...t, bottomFooterCleanupFirstPage: Number(e.target.value || 0) }))} className="border rounded px-2 py-1" />
                    </label>
                    <label className="flex flex-col gap-1">
                      Bottom Cleanup P2+
                      <input type="number" min={0} max={200} value={tune.bottomFooterCleanupOtherPages} onChange={(e) => setTune((t) => ({ ...t, bottomFooterCleanupOtherPages: Number(e.target.value || 0) }))} className="border rounded px-2 py-1" />
                    </label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key="upload-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-lg border-border/50 overflow-hidden bg-white">
                  <CardContent className="p-8">
                      {/* Dropzone */}
                      <div
                        className={`relative group border-2 border-dashed rounded-xl p-10 transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer ${
                          isDragging
                            ? "border-primary bg-primary/5"
                            : file
                            ? "border-border bg-slate-50 hover:bg-slate-100"
                            : "border-border hover:border-primary/50 hover:bg-slate-50"
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !file && fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          title="Upload a document"
                          aria-label="Upload document"
                          accept=".pdf,.rtf,.doc,.docx,.odt,application/pdf,application/rtf,text/rtf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                        />

                        {!file ? (
                          <>
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform">
                              <UploadCloud className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              Click or drag your file here
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              PDF, RTF, DOC or DOCX &middot; up to {MAX_FILE_SIZE_MB}MB
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center w-full gap-4 text-left bg-white p-4 rounded-lg shadow-sm border border-border">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {file.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={removeFile}
                              disabled={isProcessing}
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {sourcePreviewUrl && (
                        <div className="mt-4 border rounded-md overflow-hidden bg-slate-50">
                          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-white">
                            Uploaded Document Preview
                          </div>
                          <iframe
                            src={sourcePreviewUrl}
                            title="Uploaded document preview"
                            className="w-full h-[360px] bg-white"
                          />
                        </div>
                      )}

                      {/* Error Message */}
                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 overflow-hidden"
                          >
                            <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-md text-sm">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <p>{error}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action Button */}
                      <div className="mt-8">
                        <Button
                          size="lg"
                          className="w-full text-base font-semibold shadow-md"
                          disabled={!file || isProcessing}
                          onClick={handleApplyLetterhead}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Processing Document...
                            </>
                          ) : (
                            "Apply Letterhead"
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
            </AnimatePresence>
          </div>
        </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <span className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer">
              99 11 22 44 20
            </span>
            <span className="hidden md:inline text-border">•</span>
            <a href="https://www.taxdeliver.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              www.taxdeliver.com
            </a>
            <span className="hidden md:inline text-border">•</span>
            <a href="mailto:team@taxdeliver.com" className="hover:text-primary transition-colors">
              team@taxdeliver.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Home />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
