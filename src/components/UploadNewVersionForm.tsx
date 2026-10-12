"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { uploadNewVersion } from "@/lib/actions/documents";

export function UploadNewVersionForm({ documentId }: { documentId: string }) {
  const action = uploadNewVersion.bind(null, documentId);
  const [state, formAction, pending] = useActionState(action, undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => setIsNative(Capacitor.isNativePlatform()));
  }, []);

  async function handleTakePhoto() {
    setCapturing(true);
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({ resultType: CameraResultType.Uri, source: CameraSource.Camera, quality: 85 });
      if (!photo.webPath) return;

      const response = await fetch(photo.webPath);
      const blob = await response.blob();
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: blob.type || "image/jpeg" });

      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInputRef.current.files = dt.files;
        setFileName(file.name);
      }
    } catch {
      // user cancelled the camera
    } finally {
      setCapturing(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            required
            accept="image/*,application/pdf"
            className="text-sm"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
          {isNative && (
            <button
              type="button"
              onClick={handleTakePhoto}
              disabled={capturing}
              className="rounded-full border border-stone-300 text-xs font-medium px-2.5 py-1 transition-all duration-150 hover:border-stone-400 hover:bg-stone-50 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {capturing ? "Opening camera…" : "Take photo"}
            </button>
          )}
        </div>
        {isNative && fileName && <p className="text-xs text-stone-500 mt-1">{fileName}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-stone-300 text-sm font-medium px-4 py-1.5 transition-all duration-150 hover:border-stone-400 hover:bg-stone-50 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2 disabled:opacity-60 disabled:active:scale-100"
      >
        {pending ? "Uploading…" : "Replace with new version"}
      </button>
      {state?.error && <p className="text-sm text-rust-600 w-full">{state.error}</p>}
    </form>
  );
}
