"use client";

import { cn } from "@/lib/utils";
import { Camera, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";

interface PhotoUploadProps {
  onUpload: (file: File, base64: string) => void;
  preview?: string | null;
  onClear?: () => void;
  className?: string;
  label?: string;
}

export function PhotoUpload({ onUpload, preview, onClear, className, label = "Upload a photo" }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        onUpload(file, base64);
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  if (preview) {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl", className)}>
        <img src={preview} alt="Preview" className="h-64 w-full object-cover" />
        {onClear && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 p-8 transition-colors dark:border-zinc-700",
        dragActive && "border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800/50",
        className
      )}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
    >
      <div className="mb-3 rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800">
        <Camera className="h-6 w-6 text-zinc-400" />
      </div>
      <p className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
      <p className="text-xs text-zinc-400">
        <Upload className="mr-1 inline h-3 w-3" />
        Drag & drop or click to browse
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
