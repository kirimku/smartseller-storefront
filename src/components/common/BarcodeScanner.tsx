import React, { useState, useRef, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
  isOpen: boolean;
  title?: string;
  description?: string;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onScan,
  onClose,
  isOpen,
  title = "Scan Barcode",
  description = "Position the barcode within the camera view"
}) => {
  const [error, setError] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setHasPermission(true);
      setError('');
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      // Initialize the code reader
      codeReader.current = new BrowserMultiFormatReader();
      
      if (videoRef.current) {
        try {
          await codeReader.current.decodeFromVideoDevice(
            undefined, // Use default camera
            videoRef.current,
            (result, error) => {
              if (result && !isScanning) {
                setIsScanning(true);
                onScan(result.getText());
                // Reset scanning state after a delay to prevent multiple scans
                setTimeout(() => setIsScanning(false), 1000);
              }
              if (error && error.name !== 'NotFoundException') {
                console.error('Barcode scanning error:', error);
              }
            }
          );
        } catch (err) {
          console.error('Failed to start video stream:', err);
          setError('Failed to start camera. Please check your camera permissions.');
        }
      }
    } catch (err) {
      setHasPermission(false);
      setError('Camera access denied. Please allow camera permissions to scan barcodes.');
    }
  };

  const stopScanner = () => {
    if (codeReader.current) {
      // Stop the scanner
      codeReader.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const requestCameraPermission = () => {
    initializeScanner();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-testid="barcode-scanner"
      role="dialog"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            data-testid="close-scanner"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasPermission === false && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Camera access is required to scan barcodes.
              </p>
              <Button onClick={requestCameraPermission} variant="outline">
                Request Camera Permission
              </Button>
            </div>
          )}

          {hasPermission === true && (
            <div className="space-y-4">
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  data-testid="scanner-camera"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                </div>
              </div>
              
              {isScanning && (
                <div className="text-center">
                  <p className="text-sm text-green-600 font-medium">
                    Barcode detected! Processing...
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BarcodeScanner;