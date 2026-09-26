import React, { useState } from 'react';
import { Download, Check, X, ShieldAlert } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidLogoIcon } from './AndroidLogoIcon';

interface PWAInstallButtonProps {
  onOpenAndroidPackageModal?: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenAndroidPackageModal,
  className = ''
}) => {
  const { isInstallable, isInstalled, isAndroid, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else if (onOpenAndroidPackageModal) {
      onOpenAndroidPackageModal();
    }
  };

  // If already running in standalone mode, display a subtle Android app badge or allow opening package details
  if (isInstalled) {
    return (
      <button
        onClick={onOpenAndroidPackageModal}
        title="Running as installed Android / Standalone App (Click to view package specs)"
        aria-label="Running as installed Android app"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-[11px] font-bold hover:bg-emerald-500/20 transition-all cursor-pointer touch-manipulation active:scale-95 ${className}`}
      >
        <AndroidLogoIcon className="w-4 h-4 text-emerald-600" />
        <span className="hidden sm:inline font-display">Android</span>
        <Check className="w-3 h-3 text-emerald-600" />
      </button>
    );
  }

  // Active install prompt available (Chrome on Android, Edge, Desktop Chrome)
  if (isInstallable) {
    return (
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#3DDC84] hover:bg-[#32c974] text-[#07301c] text-xs font-black shadow-xs hover:shadow-sm transition-all touch-manipulation active:scale-95 cursor-pointer ${className}`}
        title="Install IE Daily Control on Android device"
        aria-label="Install Android App"
      >
        {installSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-900" />
            <span className="hidden xs:inline">Installed!</span>
          </>
        ) : (
          <>
            <AndroidLogoIcon className="w-4 h-4 text-[#07301c]" />
            <span className="hidden xs:inline font-display">Install</span>
          </>
        )}
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white text-[#176f78] border border-[#d9d2c2] text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 ${className}`}
          title="Install on Mobile Device"
          aria-label="Install App"
        >
          <AndroidLogoIcon className="w-4 h-4 text-[#176f78]" />
          <span className="hidden sm:inline">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl border border-[#d9d2c2] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-[#14363d] flex items-center gap-2">
                  <AndroidLogoIcon className="w-4 h-4 text-[#3DDC84]" />
                  <span>Install on Mobile Device</span>
                </h3>
                <button onClick={() => setShowIOSGuide(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#476369] leading-relaxed">
                1. Tap the <strong>Share</strong> button in your browser toolbar.<br />
                2. Select <strong>Add to Home Screen</strong>.<br />
                3. Launch <strong>IE Daily</strong> directly from your home screen.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Android Package & APK modal trigger button with official Android robot branding
  return (
    <button
      onClick={onOpenAndroidPackageModal}
      className={`h-10 sm:h-9 px-2 sm:px-2.5 rounded-xl bg-[#e8f7ee] hover:bg-[#d6f0df] text-[#0f5132] border border-[#a3e6be] text-xs font-bold transition-all cursor-pointer shadow-2xs group flex items-center gap-1.5 touch-manipulation active:scale-95 shrink-0 ${className}`}
      title="Android Package, APK & Install Hub (com.debonair.iedailycontrol)"
      aria-label="Open Android Package and Install Hub"
    >
      <AndroidLogoIcon className="w-4 h-4 text-[#107c41] group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline font-display font-bold">Android</span>
    </button>
  );
};
