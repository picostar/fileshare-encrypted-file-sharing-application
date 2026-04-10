import { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import UploadSection from './components/UploadSection';
import FileList from './components/FileList';
import DownloadPage from './components/DownloadPage';
import { useActor } from './hooks/useActor';
import { Loader2 } from 'lucide-react';
import { preloadQRCodeLibrary } from './lib/qrcode';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fileIdFromUrl, setFileIdFromUrl] = useState<string | null>(null);
  const { actor, isFetching } = useActor();

  useEffect(() => {
    // Check if there's a file parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const fileParam = urlParams.get('file');
    if (fileParam) {
      setFileIdFromUrl(decodeURIComponent(fileParam));
    }

    // Preload QR code library for faster generation (non-blocking)
    preloadQRCodeLibrary().then(success => {
      if (success) {
        console.log('QR code library ready');
      } else {
        console.info('QR code library preload failed, will use fallback when needed');
      }
    });
  }, []);

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleBackToHome = () => {
    setFileIdFromUrl(null);
    // Clear URL parameters
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {fileIdFromUrl ? (
              <DownloadPage fileId={fileIdFromUrl} onBack={handleBackToHome} />
            ) : (
              <>
                <div className="text-center space-y-3">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Secure File Sharing
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Upload files with AES-256 encryption and share via QR codes
                  </p>
                </div>
                
                {isFetching && !actor ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <UploadSection onUploadSuccess={handleUploadSuccess} />
                    <FileList key={refreshTrigger} />
                  </>
                )}
              </>
            )}
          </div>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;
