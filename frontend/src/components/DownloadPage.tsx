import { useState, useEffect } from 'react';
import { Download, ArrowLeft, Loader2, FileText, AlertCircle, Lock, CheckCircle, Key, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useGetFileMetadata } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';
import { decryptFile } from '../lib/encryption';

interface DownloadPageProps {
  fileId: string;
  onBack: () => void;
}

export default function DownloadPage({ fileId, onBack }: DownloadPageProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [downloadError, setDownloadError] = useState<string>('');
  
  const { data: metadata, isLoading, error } = useGetFileMetadata(fileId);
  const { data: fileUrl, isLoading: isLoadingUrl } = useFileUrl(metadata?.filePath || '');

  useEffect(() => {
    // Extract encryption key from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('key');
    if (keyParam) {
      const decodedKey = decodeURIComponent(keyParam);
      setEncryptionKey(decodedKey);
      
      // Validate key format
      if (!/^[0-9a-fA-F]{64}$/.test(decodedKey)) {
        console.warn('Encryption key format appears invalid');
        toast.warning('Encryption key format may be invalid');
      }
    }
  }, []);

  const handleDownload = async () => {
    if (!metadata) {
      toast.error('File metadata not found');
      return;
    }

    if (!encryptionKey) {
      toast.error('Encryption key missing - cannot decrypt file');
      return;
    }

    if (!fileUrl) {
      toast.error('File URL not available');
      return;
    }

    setIsDownloading(true);
    setDownloadSuccess(false);
    setDownloadError('');
    
    try {
      toast.info('Fetching encrypted file...');
      
      // Fetch encrypted file from blob storage using the proper URL
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file from storage (HTTP ${response.status})`);
      }

      const encryptedData = await response.arrayBuffer();

      if (!encryptedData || encryptedData.byteLength === 0) {
        throw new Error('Downloaded file is empty');
      }

      toast.info('Decrypting file...');

      // Decrypt file
      const decryptedData = await decryptFile(encryptedData, encryptionKey);

      if (!decryptedData || decryptedData.byteLength === 0) {
        throw new Error('Decryption resulted in empty file');
      }

      toast.info('Preparing download...');

      // Download decrypted file
      const blob = new Blob([decryptedData]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = metadata.originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setDownloadError('');
      toast.success(`File "${metadata.originalFilename}" downloaded and decrypted successfully!`);
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download and decrypt file';
      setDownloadError(errorMessage);
      toast.error(errorMessage);
      setDownloadSuccess(false);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading || isLoadingUrl) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading file information...</p>
          <p className="text-xs text-muted-foreground">File ID: {fileId.substring(0, 16)}...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !metadata) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            File Not Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The file you're trying to access doesn't exist or the link is invalid.
              {error && <div className="mt-2 text-xs">{error instanceof Error ? error.message : 'Unknown error'}</div>}
            </AlertDescription>
          </Alert>
          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
            <p className="font-medium">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Check that the complete link was copied</li>
              <li>Verify the QR code was scanned correctly</li>
              <li>The file may have been deleted</li>
            </ul>
          </div>
          <Button onClick={onBack} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!encryptionKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-destructive" />
            Encryption Key Missing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The encryption key is missing from the link. The file cannot be decrypted without it.
            </AlertDescription>
          </Alert>
          <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
            <p className="font-medium">How to fix this:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Use the complete link that was shared with you</li>
              <li>Scan the QR code again to get the full URL</li>
              <li>Make sure the URL includes "?file=...&key=..."</li>
            </ul>
            <div className="mt-2 pt-2 border-t border-border">
              <p className="text-muted-foreground">Current URL parameters:</p>
              <p className="font-mono text-xs break-all mt-1">
                {window.location.search || '(none)'}
              </p>
            </div>
          </div>
          <Button onClick={onBack} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </CardContent>
      </Card>
    );
  }

  const fileSizeKB = (Number(metadata.size) / 1024).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Download File
        </CardTitle>
        <CardDescription>
          This file is encrypted and will be decrypted during download
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Filename:</span>
            <span className="font-medium truncate ml-2 max-w-[200px]" title={metadata.originalFilename}>
              {metadata.originalFilename}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Size:</span>
            <span className="font-medium">{fileSizeKB} KB</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Encryption:</span>
            <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              AES-256-GCM
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Key Status:</span>
            <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Valid
            </span>
          </div>
        </div>

        {downloadSuccess && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              File downloaded and decrypted successfully! Check your downloads folder for "{metadata.originalFilename}".
            </AlertDescription>
          </Alert>
        )}

        {downloadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Download Failed:</strong> {downloadError}
              <div className="mt-2 text-xs">
                Please try again or contact support if the issue persists.
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            The file is stored encrypted with AES-256-GCM. It will be automatically decrypted when you download it using the encryption key from this link.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            disabled={isDownloading || !fileUrl}
            className="flex-1"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading & Decrypting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download File
              </>
            )}
          </Button>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
