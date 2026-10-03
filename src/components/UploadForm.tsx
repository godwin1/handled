"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { uploadDocument } from "@/lib/actions/documents";

type Option = { id: string; name: string };

export function UploadForm({
  people,
  assets,
  accounts,
}: {
  people: Option[];
  assets: Option[];
  accounts: Option[];
}) {
  const [state, formAction, pending] = useActionState(uploadDocument, undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isNative, setIsNative] = useState(false);
  const [capturing, setCapturing] = useState(false);

  // Checked after mount only, so server and first client render stay
  // identical — avoids a hydration mismatch from the native-only button.
  useEffect(() => {
    import("@capacitor/core").then(({ Capacitor }) => setIsNative(Capacitor.isNativePlatform()));
  }, []);

  async function handleTakePhoto() {
    setCapturing(true);
    try {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 85,
      });
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
      // user cancelled the camera — nothing to do
    } finally {
      setCapturing(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">File (photo or PDF)</label>
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
              className="rounded-md border border-stone-300 text-xs font-medium px-2 py-1 hover:bg-stone-50 disabled:opacity-60"
            >
              {capturing ? "Opening camera…" : "Take photo"}
            </button>
          )}
        </div>
        {isNative && fileName && <p className="text-xs text-stone-500 mt-1">{fileName}</p>}
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Person</label>
        <select name="personId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
          <option value="">—</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Asset</label>
        <select name="assetId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
          <option value="">—</option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-600 mb-1">Account</label>
        <select name="accountId" className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
          <option value="">—</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-accent-600 text-white text-sm font-medium px-4 py-1.5 hover:bg-accent-700 disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload"}
      </button>
      {state?.error && <p className="text-sm text-red-600 w-full">{state.error}</p>}
    </form>
  );
}
