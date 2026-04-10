import { useState } from 'react';
import { Download, Trash2, Calendar, FileText, Loader2, Share2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useListAllFiles, useDeleteFile } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';
import { decryptFile } from '../lib/encryption';
import { formatDistanceToNow } from 'date-fns';
import ShareDialog from './ShareDialog';

export default function FileList() {
  const { data: files, isLoading, error } = useListAllFiles();
  const { deleteFile } = useDeleteFile();
  const [shareData, setShareData] = useState<{ downloadLink: string; fileId: string; encryptionKey: string } | null>(null);

  const handleShare = (fileId: string, downloadLink: string, encryptionKey: string) => {
    setShareData({ fileId, downloadLink, encryptionKey });
  };

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-destructive mb-3" />
          <p className="text-destructive">Failed to load files</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!files || files.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No files uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your first encrypted file to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
          <CardDescription>Manage your encrypted files</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onShare={handleShare}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {shareData && (
        <ShareDialog
          downloadLink={shareData.downloadLink}
          fileId={shareData.fileId}
          encryptionKey={shareData.encryptionKey}
          onClose={() => setShareData(null)}
        />
      )}
    </>
  );
}

interface FileItemProps {
  file: {
    id: string;
    originalFilename: string;
    size: bigint;
    uploadTimestamp: bigint;
    filePath: string;
    downloadLink: string;
    encryptionKey: string;
  };
  onShare: (fileId: string, downloadLink: string, encryptionKey: string) => void;
  onDelete: (fileId: string) => void;
}

function FileItem({ file, onShare, onDelete }: FileItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const { data: fileUrl } = useFileUrl(file.filePath);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(file.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (!file.encryptionKey) {
      toast.error('Encryption key missing - cannot decrypt file');
      return;
    }

    if (!fileUrl) {
      toast.error('File URL not available');
      return;
    }

    setIsDownloading(true);
    setDownloadSuccess(false);
    
    try {
      // Fetch encrypted file from blob storage using the proper URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from storage (HTTP ${response.status})`);
      }

      const encryptedData = await response.arrayBuffer();

      if (!encryptedData || encryptedData.byteLength === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Decrypt file
      const decryptedData = await decryptFile(encryptedData, file.encryptionKey);

      if (!decryptedData || decryptedData.byteLength === 0) {
        throw new Error('Decryption resulted in empty file');
      }

      // Download decrypted file
      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      toast.success('File downloaded and decrypted successfully!');
      
      // Reset success state after 3 seconds
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download file';
      toast.error(errorMessage);
      setDownloadSuccess(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = () => {
    onShare(file.id, file.downloadLink, file.encryptionKey);
  };

  const timestamp = Number(file.uploadTimestamp) / 1_000_000; // Convert nanoseconds to milliseconds
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true });

  const hasEncryptionKey = file.encryptionKey && file.encryptionKey.length > 0;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors bg-card">
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <p className="font-medium truncate">{file.originalFilename}</p>
          {downloadSuccess && (
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {timeAgo}
          </span>
          <Badge variant="secondary" className="text-xs">
            {(Number(file.size) / 1024).toFixed(2)} KB
          </Badge>
        </div>
        {!hasEncryptionKey && (
          <Alert variant="destructive" className="mt-2 py-1 px-2">
            <AlertDescription className="text-xs">
              Encryption key missing - file cannot be decrypted
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleShare}
          disabled={isDownloading || isDeleting || !hasEncryptionKey}
          title={hasEncryptionKey ? "Share file" : "Cannot share - encryption key missing"}
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          disabled={isDownloading || isDeleting || !hasEncryptionKey || !fileUrl}
          title={hasEncryptionKey ? "Download file" : "Cannot download - encryption key missing"}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting || isDownloading}
          title="Delete file"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

