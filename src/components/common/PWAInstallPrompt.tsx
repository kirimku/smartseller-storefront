import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  Bell, 
  Zap, 
  X,
  CheckCircle
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  onClose?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = (window.navigator as any).standalone || isStandalone;
    setIsInstalled(isInstalled);

    console.log('PWA Install Prompt - App installed:', isInstalled);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('PWA Install Prompt - beforeinstallprompt event fired', e);
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Don't show immediately if already installed
      if (!isInstalled) {
        // Show after a delay to not be intrusive
        setTimeout(() => {
          console.log('PWA Install Prompt - Showing install prompt');
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setShowInstallPrompt(false);
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during app installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    if (onClose) onClose();
  };

  // Don't show if already installed or no prompt available
  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          App Installed
        </Badge>
      </div>
    );
  }

  // For debugging - show a manual install button if no automatic prompt
  if (!showInstallPrompt && !deferredPrompt) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <Button 
          onClick={() => setShowInstallPrompt(true)}
          variant="outline"
          size="sm"
          className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
        >
          <Download className="w-4 h-4 mr-2" />
          PWA Debug
        </Button>
      </div>
    );
  }

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md relative animate-in fade-in-0 zoom-in-95 duration-300">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDismiss}
          className="absolute right-2 top-2 h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Download className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-xl">Install Rexus Gaming Rewards</CardTitle>
          <CardDescription>
            Get the full app experience with offline access and notifications
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Wifi className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Offline Access</h4>
                <p className="text-xs text-muted-foreground">Browse products even without internet</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bell className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Push Notifications</h4>
                <p className="text-xs text-muted-foreground">Get notified about order updates and rewards</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Faster Performance</h4>
                <p className="text-xs text-muted-foreground">Lightning fast app experience</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Native App Feel</h4>
                <p className="text-xs text-muted-foreground">Seamless mobile and desktop experience</p>
              </div>
            </div>
          </div>

          {/* Install Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="w-full"
            >
              Maybe Later
            </Button>
          </div>

          {/* Platform Info */}
          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              <Monitor className="w-3 h-3 mr-1" />
              Works on all devices
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
