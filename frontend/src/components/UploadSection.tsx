import { useState, useRef } from 'react';
import { Upload, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useFileUpload } from '../blob-storage/FileStorage';
import { useSaveFileMetadata } from '../hooks/useQueries';
import { encryptFile } from '../lib/encryption';
import ShareDialog from './ShareDialog';

interface UploadSectionProps {
  onUploadSuccess: () => void;
}

export default function UploadSection({ onUploadSuccess }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [shareData, setShareData] = useState<{ downloadLink: string; fileId: string; encryptionKey: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadFile, isUploading } = useFileUpload();
  const { saveMetadata, isSaving } = useSaveFileMetadata();

  const isProcessing = isUploading || isSaving;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadProgress(10);
      
      // Encrypt file
      const { encryptedData, encryptionKey } = await encryptFile(selectedFile);
      setUploadProgress(30);

      // Generate unique file ID
      const fileId = crypto.randomUUID();
      const filePath = `encrypted/${fileId}.enc`;

      // Convert ArrayBuffer to File for upload
      const encryptedFile = new File([encryptedData], `${fileId}.enc`, {
        type: 'application/octet-stream',
      });

      // Upload encrypted file
      await uploadFile(filePath, encryptedFile, (progress) => {
        setUploadProgress(30 + progress * 0.5);
      });
      setUploadProgress(80);

      // Save metadata with encryption key to backend
      const downloadLink = await saveMetadata(
        fileId,
        selectedFile.name,
        BigInt(encryptedData.byteLength),
        filePath,
        encryptionKey
      );
      setUploadProgress(100);

      toast.success('File uploaded successfully!');
      setShareData({ downloadLink, fileId, encryptionKey });
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload file');
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Upload Encrypted File
          </CardTitle>
          <CardDescription>
            Your file will be encrypted with AES-256 before upload
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={isProcessing}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={isProcessing}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {selectedFile ? selectedFile.name : 'Choose File'}
                  </span>
                </Button>
              </label>
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isProcessing}
              className="sm:w-auto w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Encrypt & Upload
                </>
              )}
            </Button>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {uploadProgress < 30 ? 'Encrypting...' : uploadProgress < 80 ? 'Uploading...' : 'Finalizing...'}
              </p>
            </div>
          )}

          {selectedFile && (
            <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium">{(selectedFile.size / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          )}
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
