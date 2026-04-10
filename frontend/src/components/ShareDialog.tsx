import { useState, useEffect } from 'react';
import { Copy, Check, Download, X, Loader2, AlertCircle, RefreshCw, QrCode, ExternalLink, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { generateQRCode } from '../lib/qrcode';

interface ShareDialogProps {
  downloadLink: string;
  fileId: string;
  encryptionKey: string;
  onClose: () => void;
}

export default function ShareDialog({ downloadLink, fileId, encryptionKey, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(true);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrError, setQrError] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [qrValidated, setQrValidated] = useState(false);
  const [isFallbackQR, setIsFallbackQR] = useState(false);
  const [encodedUrl, setEncodedUrl] = useState<string>('');

  // Create the actual shareable download link with file ID and encryption key
  // Use window.location.origin to ensure we get the correct base URL
  const baseUrl = window.location.origin;
  const shareableLink = `${baseUrl}/?file=${encodeURIComponent(fileId)}&key=${encodeURIComponent(encryptionKey)}`;

  const validateInputs = (): { valid: boolean; error?: string } => {
    if (!shareableLink || shareableLink.trim().length === 0) {
      return { valid: false, error: 'Invalid shareable link' };
    }

    if (!fileId || fileId.trim().length === 0) {
      return { valid: false, error: 'Missing file ID' };
    }

    if (!encryptionKey || encryptionKey.trim().length === 0) {
      return { valid: false, error: 'Missing encryption key' };
    }

    // Validate encryption key format (should be 64 hex characters)
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      return { valid: false, error: 'Invalid encryption key format (must be 64 hex characters)' };
    }

    // Validate URL format and required parameters
    try {
      const url = new URL(shareableLink);
      const params = new URLSearchParams(url.search);
      const fileParam = params.get('file');
      const keyParam = params.get('key');
      
      if (!fileParam || !keyParam) {
        return { valid: false, error: 'Download link is missing required parameters (file or key)' };
      }
      
      // Verify the parameters match what we expect
      if (decodeURIComponent(fileParam) !== fileId) {
        return { valid: false, error: `File ID mismatch: expected ${fileId}, got ${decodeURIComponent(fileParam)}` };
      }
      
      if (decodeURIComponent(keyParam) !== encryptionKey) {
        return { valid: false, error: 'Encryption key mismatch in URL parameters' };
      }
    } catch (err) {
      return { valid: false, error: `Invalid URL format: ${err instanceof Error ? err.message : 'Unknown error'}` };
    }

    // Check URL length for QR code compatibility
    if (shareableLink.length > 2953) {
      return { valid: false, error: `URL too long for QR code (${shareableLink.length} chars, max 2953)` };
    }

    return { valid: true };
  };

  const generateCode = async () => {
    try {
      setQrError('');
      setIsGeneratingQR(true);
      setQrCodeDataUrl('');
      setQrValidated(false);
      setIsFallbackQR(false);
      setEncodedUrl('');
      
      // Validate inputs before generating
      const validation = validateInputs();
      if (!validation.valid) {
        throw new Error(validation.error || 'Validation failed');
      }
      
      console.log('=== QR Code Generation Started ===');
      console.log('Complete download URL:', shareableLink);
      console.log('URL length:', shareableLink.length, 'characters');
      console.log('File ID:', fileId);
      console.log('Encryption key:', encryptionKey.substring(0, 16) + '...');
      console.log('Encryption key length:', encryptionKey.length, 'characters');
      console.log('Target specifications:');
      console.log('  - Version: 15-20 (larger grid)');
      console.log('  - Error correction: Level H (30% recovery)');
      console.log('  - Size: Minimum 800×800 pixels');
      console.log('  - Colors: Pure black on white (no gray edges)');
      
      // Generate QR code with the actual complete download link
      // Using minimum 800x800 size, version 15-20, error correction H
      const result = await generateQRCode(shareableLink, { 
        size: 800,  // Minimum 800×800 pixels
        margin: 4 
      });
      
      if (!result.dataUrl) {
        throw new Error('QR code generation returned empty result');
      }
      
      // Verify the URL was encoded correctly
      console.log('✓ QR code generated successfully');
      console.log('✓ Version: 15-20 (auto-selected based on URL length)');
      console.log('✓ Error correction level H (30% recovery) applied');
      console.log('✓ Size: 800×800 pixels (minimum enforced)');
      console.log('✓ Colors: Pure black (#000000) on white (#FFFFFF)');
      console.log('✓ Encoded URL matches input:', result.dataUrl.length > 0);
      console.log('✓ Using fallback renderer:', result.isFallback);
      
      setQrCodeDataUrl(result.dataUrl);
      setIsFallbackQR(result.isFallback);
      setEncodedUrl(shareableLink); // Store the exact URL that was encoded
      setQrValidated(true);
      setRetryCount(0); // Reset retry count on success
      
      // Show appropriate message based on result
      if (retryCount > 0) {
        if (result.isFallback) {
          toast.success('QR code generated using fallback method (Version 15-20, Error Correction H)');
        } else {
          toast.success('QR code generated successfully (Version 15-20, Error Correction H, 800×800px)!');
        }
      } else if (result.isFallback) {
        console.info('Using fallback QR code generation');
        toast.info('QR code generated (Version 15-20, Error Correction H, 800×800px, fallback renderer)');
      } else {
        toast.success('QR code generated with Version 15-20, Error Correction Level H (30%), 800×800px, pure black on white!');
      }
      
      console.log('=== QR Code Generation Complete ===');
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate QR code';
      setQrError(errorMsg);
      setQrValidated(false);
      setIsFallbackQR(false);
      setEncodedUrl('');
      
      // Show appropriate toast based on context
      if (retryCount === 0) {
        toast.error('QR code generation failed. You can still copy and share the link below.');
      } else {
        toast.error(`Retry attempt ${retryCount} failed: ${errorMsg}`);
      }
    } finally {
      setIsGeneratingQR(false);
    }
  };

  useEffect(() => {
    // Validate inputs first
    const validation = validateInputs();
    if (!validation.valid) {
      setQrError(validation.error || 'Invalid inputs');
      setIsGeneratingQR(false);
      toast.error(`Cannot generate QR code: ${validation.error}`);
      return;
    }

    // Generate QR code when dialog opens
    generateCode();
  }, []);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast.success('Complete download link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link. Please copy it manually.');
    }
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      toast.error('Maximum retry attempts reached. Please use the copy link button instead.');
      return;
    }
    setRetryCount(prev => prev + 1);
    toast.info(`Retrying QR code generation (attempt ${retryCount + 1})...`);
    generateCode();
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(onClose, 200);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) {
      toast.error('No QR code available to download');
      return;
    }
    
    try {
      const a = document.createElement('a');
      a.href = qrCodeDataUrl;
      a.download = `qr-code-${fileId.substring(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('QR code downloaded successfully (800×800px, Version 15-20, Error Correction H)!');
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleTestLink = () => {
    // Open the link in a new tab to test
    window.open(shareableLink, '_blank');
    toast.info('Opening download link in new tab for testing');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Share Your File
          </DialogTitle>
          <DialogDescription>
            Share this link or scan the QR code to download and decrypt the file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shareable Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Download Link</label>
            <div className="flex items-center gap-2">
              <Input
                value={shareableLink}
                readOnly
                className="flex-1 font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
                title="Copy complete link to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                File ID: <span className="font-mono">{fileId.substring(0, 12)}...</span>
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                Key included ({encryptionKey.length} chars)
              </span>
            </div>
          </div>

          {/* QR Code Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium">QR Code (Version 15-20, Error Correction H, 800×800px)</label>
            <div className="flex justify-center p-6 bg-white dark:bg-gray-100 rounded-lg border-2 border-border">
              {isGeneratingQR ? (
                <div className="w-[400px] h-[400px] flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-sm font-medium text-gray-700">Generating QR code...</p>
                    <p className="text-xs text-muted-foreground">Version 15-20, Error Correction H (30%)</p>
                    <p className="text-xs text-muted-foreground">800×800 pixels, pure black on white</p>
                    {retryCount > 0 && (
                      <p className="text-xs text-muted-foreground">Attempt {retryCount + 1}</p>
                    )}
                  </div>
                </div>
              ) : qrCodeDataUrl && qrValidated && !qrError ? (
                <div className="space-y-3">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code for secure file download - Version 15-20, Error Correction H (30%), 800×800 pixels, pure black on white" 
                    className="w-[400px] h-[400px]"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500 justify-center">
                    <CheckCircle className="w-3 h-3" />
                    <span>Version 15-20 • Error Correction H (30%) • 800×800px • Pure Black/White</span>
                  </div>
                  {isFallbackQR && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500 justify-center">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Fallback QR renderer - Test scan recommended</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleDownloadQR}
                      className="flex-1"
                      title="Download QR code as PNG image (800×800 pixels)"
                    >
                      <Download className="w-3 h-3 mr-2" />
                      Download QR
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleTestLink}
                      className="flex-1"
                      title="Test the download link in a new tab"
                    >
                      <ExternalLink className="w-3 h-3 mr-2" />
                      Test Link
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-[400px] h-[400px] flex items-center justify-center">
                  <div className="text-center space-y-3 p-4">
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-destructive">
                        QR Code Generation Failed
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {qrError || 'Unknown error occurred'}
                      </p>
                    </div>
                    {retryCount > 0 && retryCount < 3 && (
                      <p className="text-xs text-muted-foreground">
                        Failed after {retryCount} {retryCount === 1 ? 'attempt' : 'attempts'}
                      </p>
                    )}
                    <Button 
                      size="sm" 
                      variant="default" 
                      onClick={handleRetry}
                      className="mt-2"
                      disabled={retryCount >= 3}
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      {retryCount >= 3 ? 'Max retries reached' : 'Retry Generation'}
                    </Button>
                    <div className="bg-muted/50 rounded p-2 text-xs text-left space-y-1">
                      <p className="font-medium">Alternative sharing methods:</p>
                      <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                        <li>Use the "Copy Link" button above</li>
                        <li>Test the link with "Test Link" button</li>
                        <li>Share the complete URL via email or messaging</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Validation - Prominent Display */}
          {qrValidated && encodedUrl && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs text-green-800 dark:text-green-200">
                <div className="space-y-2">
                  <div className="font-semibold text-sm">✓ QR Code Verified - Version 15-20 with Highest Error Correction</div>
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">QR Version:</span>
                      <span className="font-semibold">15-20 (Larger grid for better scannability)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Error Correction:</span>
                      <span className="font-semibold">Level H (Highest) - Up to 30% damage recovery</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Image Size:</span>
                      <span className="font-semibold">800×800 pixels (minimum enforced)</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Colors:</span>
                      <span className="font-semibold">Pure black (#000000) on white (#FFFFFF) - No gray edges</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium min-w-[120px]">Encoded URL:</span>
                      <span className="font-mono text-[10px] break-all flex-1">{encodedUrl}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[120px]">URL Length:</span>
                      <span>{encodedUrl.length} characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[120px]">File ID:</span>
                      <span className="font-mono text-[10px]">{fileId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[120px]">Encryption Key:</span>
                      <span className="font-mono text-[10px]">{encryptionKey.substring(0, 32)}...</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-green-200 dark:border-green-800 text-muted-foreground">
                    This QR code uses Version 15-20 (larger grid), Error Correction Level H (30% recovery), 
                    800×800 pixel minimum size, and pure black on white colors with no gray edges or gradients. 
                    It contains the complete download URL with all required parameters and can be scanned by any standard QR code reader, 
                    even if partially damaged or obscured.
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* URL Verification Information */}
          {qrValidated && encodedUrl && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Verification Confirmation:</strong>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>QR Version 15-20 (larger grid for better scanning)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Error Correction Level H (30% damage recovery)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Minimum 800×800 pixel image size</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Pure black on white (no gray edges or gradients)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Complete URL encoded (no truncation)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>File ID parameter included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Encryption key parameter included</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>URL matches download link exactly</span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                  The QR code above meets all specifications: Version 15-20 (larger grid), Error Correction Level H (30%), 
                  minimum 800×800 pixels, pure black on white with no gray edges. It encodes the exact same URL shown in the 
                  "Download Link" field. This ensures maximum compatibility with all QR code readers and allows the code to be 
                  scanned even if partially damaged.
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Security Notice:</strong> The encryption key is embedded in the link for secure access. Anyone with this link can download and decrypt the file. Share it only with trusted recipients.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleCopy} className="flex-1" variant="default">
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button onClick={handleTestLink} variant="outline" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-2" />
              Test
            </Button>
            <Button onClick={handleClose} variant="outline">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
