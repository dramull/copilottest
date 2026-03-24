"use client";

import { cn } from "@/lib/utils";
import { Camera, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface MediaCaptureProps {
  onCapture: (file: File, base64: string) => void;
  preview?: string | null;
  onClear?: () => void;
  className?: string;
  label?: string;
  accept?: "photo" | "video" | "both";
  showPreview?: boolean;
}

export function MediaCapture({
  onCapture,
  preview,
  onClear,
  className,
  label = "Take a photo or upload",
  accept = "photo",
  showPreview = true,
}: MediaCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        onCapture(file, base64);
      };
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const acceptTypes = accept === "video" ? "video/*" : accept === "both" ? "image/*,video/*" : "image/*";

  if (preview && showPreview) {
    const isVideo = preview.startsWith("data:video") || preview.includes("video");
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", className)}>
        {isVideo ? (
          <video src={preview} className="h-72 w-full rounded-2xl object-cover" controls />
        ) : (
          <img src={preview} alt="Preview" className="h-72 w-full object-cover" />
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {onClear && (
            <button
              onClick={onClear}
              className="rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Camera / Upload buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 p-6 transition-all hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
        >
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {accept === "video" ? "Record Video" : "Take Photo"}
          </span>
          <span className="text-xs text-zinc-400">Use camera</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 p-6 transition-all hover:border-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:bg-zinc-800/50"
        >
          <div className="rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 p-3">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Upload File</span>
          <span className="text-xs text-zinc-400">From device</span>
        </button>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          "flex items-center justify-center rounded-xl border border-zinc-200 p-3 text-xs text-zinc-400 transition-colors dark:border-zinc-800",
          dragActive && "border-zinc-500 bg-zinc-50 dark:bg-zinc-800/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        Or drag and drop a file here
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept === "video" ? "video/*" : "image/*"}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
