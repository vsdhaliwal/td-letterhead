"use client";

import { useState, useRef, ChangeEvent, DragEvent, MouseEvent } from "react";
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

function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ url: string; filename: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      // Auto-download
      const a = document.createElement("a");
      a.href = url;
      a.download = newFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSuccessData({ url, filename: newFilename });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setSuccessData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      {/* Header Strip */}
      <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-md bg-[#1A8FD8]/10 text-[#1A8FD8] grid place-items-center font-bold">
              TD
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-[#1A8FD8] leading-none">TAX DELIVER</span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-1">
                Your Trusted Tax Advisor
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
        <div className="text-center mb-10 w-full">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
            CompuTax Letterhead Tool
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Drop your CompuTax document (RTF or PDF) below to instantly stamp the firm's letterhead on every page.
          </p>
        </div>

        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {!successData ? (
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
            ) : (
              <motion.div
                key="success-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
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
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto px-4">
                      The letterhead was applied to your document. The download should have started automatically.
                    </p>
                  </div>
                  <CardContent className="p-8 bg-white flex flex-col items-center gap-4">
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
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
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white mt-auto py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-medium text-foreground/80">
            Tax Deliver Pvt. Ltd. — C-9/28, Sec-7, Rohini, Delhi-85
          </p>
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
