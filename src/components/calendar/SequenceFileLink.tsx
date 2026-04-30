import React from "react";
import { Button } from "../ui/button";
import { Paperclip, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../integrations/supabase/client";

interface SequenceFileLinkProps {
  bookingId: string;
  fileName: string;
}

const SequenceFileLink: React.FC<SequenceFileLinkProps> = ({ bookingId, fileName }) => {
  const handleDownload = async () => {
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
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Download failed");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleDownload}
      className="h-7"
    >
      <Paperclip className="h-3.5 w-3.5 mr-1" />
      <span className="truncate max-w-[200px]">{fileName}</span>
      <Download className="h-3.5 w-3.5 ml-1" />
    </Button>
  );
};

export default SequenceFileLink;
