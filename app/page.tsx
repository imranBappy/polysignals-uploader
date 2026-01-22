'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { uploadStaticAsset } from '@/lib/uploadStaticAsset';

const CROP_SIZE = 512;

const cropImageToSquare = (sourceFile: File, size: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(sourceFile);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas context unavailable.'));
        return;
      }

      const cropSize = Math.min(img.width, img.height);
      const sx = (img.width - cropSize) / 2;
      const sy = (img.height - cropSize) / 2;

      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, size, size);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          reject(new Error('Failed to generate cropped image.'));
          return;
        }
        resolve(blob);
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read image.'));
    };

    img.src = objectUrl;
  });

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  croppedFile: File | null;
  croppedPreviewUrl: string | null;
  uploadedUrl: string | null;
  isCropping: boolean;
  isUploading: boolean;
  error: string | null;
};

const createItemId = (file: File, index: number) =>
  `${file.name}-${file.lastModified}-${file.size}-${index}-${Math.random().toString(16).slice(2)}`;

const revokeItemUrls = (items: UploadItem[]) => {
  items.forEach((item) => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    if (item.croppedPreviewUrl) URL.revokeObjectURL(item.croppedPreviewUrl);
  });
};

export default function ImageUploaderToolPage() {
  const defaultUid =  "XylmJi4I58TKAMKa5hfkRJPW1Zd2"

  const [uid, setUid] = useState(defaultUid);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const itemsRef = useRef<UploadItem[]>([]);

  useEffect(() => {
    setUid(defaultUid);
  }, [defaultUid]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      revokeItemUrls(itemsRef.current);
    };
  }, []);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setError(null);
    setIsUploading(false);
    revokeItemUrls(items);

    const nextItems = selectedFiles.map((file, index) => ({
      id: createItemId(file, index),
      file,
      previewUrl: URL.createObjectURL(file),
      croppedFile: null,
      croppedPreviewUrl: null,
      uploadedUrl: null,
      isCropping: true,
      isUploading: false,
      error: null,
    }));

    setItems(nextItems);

    nextItems.forEach(async (item) => {
      try {
        const blob = await cropImageToSquare(item.file, CROP_SIZE);
        const filename = item.file.name.replace(/\.[^/.]+$/, '') || 'image';
        const nextFile = new File([blob], `${filename}-${CROP_SIZE}.png`, {
          type: blob.type || 'image/png',
        });
        const nextPreviewUrl = URL.createObjectURL(nextFile);

        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                ...entry,
                croppedFile: nextFile,
                croppedPreviewUrl: nextPreviewUrl,
                isCropping: false,
              }
              : entry,
          ),
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((entry) =>
            entry.id === item.id
              ? {
                ...entry,
                isCropping: false,
                error: err.message || 'Failed to crop image.',
              }
              : entry,
          ),
        );
      }
    });
  };

  const onUpload = async () => {
    if (!items.length) {
      setError('Please select an image file.');
      return;
    }
    if (!uid) {
      setError('Firebase UID is required to upload.');
      return;
    }

    setError(null);
    setIsUploading(true);
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        isUploading: true,
        error: null,
      })),
    );

    await Promise.all(
      items.map(async (item) => {
        const targetFile = item.croppedFile || item.file;
        try {
          const url = await uploadStaticAsset({ file: targetFile, firebaseUid: uid });
          setItems((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? { ...entry, uploadedUrl: url, isUploading: false }
                : entry,
            ),
          );
        } catch (err: any) {
          setItems((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? {
                  ...entry,
                  isUploading: false,
                  error: err.message || 'Upload failed.',
                }
                : entry,
            ),
          );
        }
      }),
    );

    setIsUploading(false);
  };

  const onCopyUrl = async (url: string | null) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch (err: any) {
      setError(err.message || 'Failed to copy URL.');
    }
  };

  const onReset = () => {
    revokeItemUrls(items);
    setItems([]);
    setError(null);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="space-y-2">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Tools</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Image uploader</h1>
          <p className="text-sm text-slate-400">
            Upload a static image using the backend upload endpoint.
          </p>
        </header>

        <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="firebase-uid">
              Firebase UID
            </label>
            <input
              id="firebase-uid"
              value={uid}
              onChange={(event) => setUid(event.target.value)}
              placeholder="Enter Firebase UID"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-3">
            <label className="text-sm font-medium text-slate-200" htmlFor="image-file">
              Image file
            </label>
            <input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={onFileChange}
              ref={fileInputRef}
              multiple
              className="w-full rounded-lg border border-dashed border-slate-700 bg-slate-950 px-4 py-6 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-100 hover:file:bg-slate-700"
            />
          </div>

          {!!items.length && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-slate-400">
                Selected previews
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <img
                      src={item.croppedPreviewUrl || item.previewUrl}
                      alt={item.file.name}
                      className="h-40 w-full rounded-lg object-cover"
                    />
                    <div className="text-xs text-slate-300">
                      {item.file.name}
                    </div>
                    {item.isCropping && (
                      <div className="text-xs text-slate-400">
                        Cropping to {CROP_SIZE}x{CROP_SIZE}...
                      </div>
                    )}
                    {item.error && (
                      <div className="text-xs text-red-300">
                        {item.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {items.some((item) => item.uploadedUrl) && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              <p className="font-semibold">Uploaded images</p>
              <div className="mt-3 flex flex-col gap-3 text-xs text-emerald-100">
                {items
                  .filter((item) => item.uploadedUrl)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 sm:grid-cols-[80px_1fr_1.5fr_auto] sm:items-center"
                    >
                      <img
                        src={item.croppedPreviewUrl || item.previewUrl}
                        alt={item.file.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="text-xs text-emerald-50">
                        {item.file.name}
                      </div>
                      <div className="break-all text-[11px] text-emerald-100">
                        {item.uploadedUrl}
                      </div>
                      <button
                        type="button"
                        onClick={() => onCopyUrl(item.uploadedUrl)}
                        className="inline-flex items-center justify-center rounded-md border border-emerald-500/40 px-2 py-1 text-[11px] font-semibold text-emerald-50 transition hover:border-emerald-400"
                      >
                        <span className="sr-only">Copy URL</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="h-4 w-4"
                        >
                          <path d="M16 1H6a2 2 0 0 0-2 2v12h2V3h10V1Zm3 4H10a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H10V7h9v14Z" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onUpload}
              disabled={
                isUploading ||
                !items.length ||
                items.some((item) => item.isCropping)
              }
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-500/60"
            >
              {isUploading
                ? 'Uploading…'
                : items.some((item) => item.isCropping)
                  ? 'Cropping…'
                  : 'Upload images'}
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
            >
              Reset
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
