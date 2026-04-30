import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Loader2, Paperclip, X, Download, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../integrations/supabase/client";
import SequenceFileEditor from "./SequenceFileEditor";

interface SequenceFileUploadProps {
  bookingId: string | null; // null when creating — upload deferred until after submit
  existingFileName?: string | null;
  existingFileSize?: number | null;
  onUploaded?: (info: { key: string; name: string; size: number }) => void;
  onRemoved?: () => void;
  /** When set, this picker just stores the File locally; the parent uploads after creating the booking */
  onLocalFilePicked?: (file: File | null) => void;
  disabled?: boolean;
}

const MAX_SIZE = 25 * 1024 * 1024;
const ALLOWED = [".xlsx", ".xls", ".csv"];

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const SequenceFileUpload: React.FC<SequenceFileUploadProps> = ({
  bookingId,
  existingFileName,
  existingFileSize,
  onUploaded,
  onRemoved,
  onLocalFilePicked,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_SIZE) return `File too large (max ${MAX_SIZE / 1024 / 1024} MB)`;
    const lower = file.name.toLowerCase();
    if (!ALLOWED.some((ext) => lower.endsWith(ext))) {
      return `File type not allowed. Allowed: ${ALLOWED.join(", ")}`;
    }
    return null;
  };

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      toast.error(err);
      e.target.value = "";
      return;
    }

    if (!bookingId) {
      // Create flow — defer upload to parent
      setPendingFile(file);
      onLocalFilePicked?.(file);
      return;
    }

    // Edit flow — upload immediately
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bookingId", bookingId);
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/s3-upload-sequence`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Upload failed");
      toast.success("Sequence file uploaded");
      onUploaded?.({ key: json.key, name: json.name, size: json.size });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  const handleRemove = async () => {
    if (pendingFile) {
      setPendingFile(null);
      onLocalFilePicked?.(null);
      return;
    }
    if (!bookingId) return;
    if (!confirm("Remove the uploaded sequence file?")) return;
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/s3-delete-sequence`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId }),
        },
      );
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || "Delete failed");
      toast.success("Sequence file removed");
      onRemoved?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!bookingId) return;
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/s3-download-sequence?bookingId=${bookingId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Download failed");
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = existingFileName || "sequence-file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  const hasExisting = !!existingFileName && !pendingFile;
  const hasPending = !!pendingFile;

  return (
    <div className="space-y-2">
      <Label>Sequence File (Optional)</Label>
      {hasExisting && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{existingFileName}</div>
            {existingFileSize ? (
              <div className="text-xs text-muted-foreground">{formatSize(existingFileSize)}</div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={busy || disabled}
            title="Download"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={busy || disabled}
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {hasPending && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
          <Paperclip className="h-4 w-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{pendingFile!.name}</div>
            <div className="text-xs text-muted-foreground">
              {formatSize(pendingFile!.size)} · will upload after booking is created
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
            title="Remove"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {!hasExisting && !hasPending && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handlePick}
            disabled={busy || disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={busy || disabled}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Paperclip className="h-4 w-4 mr-2" /> Upload LCMS Sequence (.xlsx, .xls, .csv)
              </>
            )}
          </Button>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        Optional — attach your LCMS sequence file. Max 25 MB.
      </p>
    </div>
  );
};

export default SequenceFileUpload;
