import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Layers,
  X,
  FileCode,
  ShieldCheck,
  Sparkles,
  Terminal,
  QrCode
} from 'lucide-react';
import { AndroidLogoIcon } from './AndroidLogoIcon';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidPackageModal: React.FC<AndroidPackageModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'install' | 'package_specs' | 'twa_build' | 'capacitor'>('install');

  if (!isOpen) return null;

  const currentUrl = window.location.origin;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&color=176f78&bgcolor=ffffff`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.debonair.iedailycontrol">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="IE Daily Control"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        
        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:label="IE Daily Control"
            android:exported="true">
            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="${currentUrl}/" />
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="${window.location.host}" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

  const twaManifestJson = JSON.stringify(
    {
      packageId: 'com.debonair.iedailycontrol',
      host: window.location.host,
      name: 'IE Daily Control',
      launcherName: 'IE Daily',
      themeColor: '#176F78',
      navigationColor: '#0B383D',
      backgroundColor: '#F6F4EE',
      enableNotifications: true,
      startUrl: '/',
      iconUrl: `${currentUrl}/pwa-512x512.png`,
      maskableIconUrl: `${currentUrl}/pwa-maskable-512x512.png`,
      appVersionName: '1.0.0',
      appVersionCode: 1,
      generatorApp: 'bubblewrap-cli',
      webManifestUrl: `${currentUrl}/manifest.webmanifest`,
      fallbackType: 'customtabs'
    },
    null,
    2
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#faf8f4] border border-[#d9d2c2] rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-[#176f78] text-white flex items-center justify-between border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200 shadow-inner">
              <AndroidLogoIcon className="w-6 h-6 text-[#3DDC84]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">Android Package &amp; Install Hub</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-teal-950 uppercase tracking-wider">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium">
                com.debonair.iedailycontrol • Standalone PWA / TWA / APK Ready
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-1 border-b border-[#e7e1d5] bg-white flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('install')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'install'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'text-[#476369] hover:bg-[#f1eee6]'
            }`}
          >
            Install on Android
          </button>
          <button
            onClick={() => setActiveTab('package_specs')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'package_specs'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'text-[#476369] hover:bg-[#f1eee6]'
            }`}
          >
            Package Manifest
          </button>
          <button
            onClick={() => setActiveTab('twa_build')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'twa_build'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'text-[#476369] hover:bg-[#f1eee6]'
            }`}
          >
            Google Play / Bubblewrap (APK)
          </button>
          <button
            onClick={() => setActiveTab('capacitor')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'capacitor'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'text-[#476369] hover:bg-[#f1eee6]'
            }`}
          >
            Capacitor &amp; Studio
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: INSTALL ON ANDROID */}
          {activeTab === 'install' && (
            <div className="space-y-5">
              {/* Quick Install Action Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/pwa-192x192.png"
                    alt="IE Daily Control"
                    className="w-14 h-14 rounded-2xl shadow-sm border border-teal-200"
                  />
                  <div>
                    <h3 className="text-sm font-black text-[#14363d]">IE Daily Control</h3>
                    <p className="text-xs text-[#476369]">
                      Package ID: <span className="font-mono font-bold text-[#176f78]">com.debonair.iedailycontrol</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Standalone PWA Enabled
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                        Offline Ready
                      </span>
                    </div>
                  </div>
                </div>

                {isInstalled ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs">
                    <CheckCircle2 className="w-4 h-4" /> Already Installed
                  </div>
                ) : isInstallable ? (
                  <button
                    onClick={install}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" /> Install Android App Now
                  </button>
                ) : (
                  <div className="text-right sm:text-left">
                    <span className="text-xs font-bold text-[#176f78] bg-teal-100/80 px-3 py-1.5 rounded-xl inline-block">
                      Browser Install Active
                    </span>
                  </div>
                )}
              </div>

              {/* QR Code and Mobile Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] flex flex-col items-center text-center justify-center">
                  <div className="p-2 bg-white rounded-2xl border border-teal-100 shadow-xs mb-3">
                    <img src={qrCodeUrl} alt="Scan to install Android package" className="w-36 h-36 rounded-xl" />
                  </div>
                  <span className="text-xs font-black text-[#14363d] flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#176f78]" /> Scan from Android Phone / Tablet
                  </span>
                  <p className="text-[11px] text-[#6b7280] mt-1 max-w-xs">
                    Open Camera or Chrome on any Android workstation to immediately load &amp; install this app.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#476369]">
                    Android Installation Steps
                  </h4>
                  <ol className="space-y-2.5 text-xs text-[#2b4c53]">
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#e8f3f4] text-[#176f78] font-black text-[11px] flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>
                        Open this URL in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong> on Android.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#e8f3f4] text-[#176f78] font-black text-[11px] flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span>
                        Tap the <strong>Install App</strong> button or tap the browser menu (<strong>⋮</strong>) and choose <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#e8f3f4] text-[#176f78] font-black text-[11px] flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>
                        Android will package and install <strong>IE Daily</strong> directly into your app drawer with native full-screen view.
                      </span>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Package Identification Details */}
              <div className="p-4 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2] space-y-2">
                <div className="text-xs font-bold text-[#14363d] flex items-center justify-between">
                  <span>Android Package ID:</span>
                  <span className="font-mono text-teal-800 bg-white px-2 py-0.5 rounded border border-[#d9d2c2]">
                    com.debonair.iedailycontrol
                  </span>
                </div>
                <div className="text-xs font-bold text-[#14363d] flex items-center justify-between">
                  <span>Digital Asset Links URL:</span>
                  <a
                    href="/.well-known/assetlinks.json"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[#176f78] underline flex items-center gap-1 hover:text-teal-900"
                  >
                    /.well-known/assetlinks.json <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-xs font-bold text-[#14363d] flex items-center justify-between">
                  <span>Web App Manifest:</span>
                  <a
                    href="/manifest.webmanifest"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-[#176f78] underline flex items-center gap-1 hover:text-teal-900"
                  >
                    /manifest.webmanifest <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PACKAGE MANIFEST & ASSETS */}
          {activeTab === 'package_specs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-[#14363d] uppercase tracking-wider">
                    Android Web App Manifest (manifest.webmanifest)
                  </h3>
                  <p className="text-[11px] text-[#6b7280]">
                    Verified with standalone display mode, orientation locks, and adaptive maskable icons.
                  </p>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      JSON.stringify(
                        {
                          id: '/',
                          name: 'IE Daily Control',
                          short_name: 'IE Daily',
                          start_url: '/',
                          display: 'standalone',
                          background_color: '#f6f4ee',
                          theme_color: '#176f78',
                          packageId: 'com.debonair.iedailycontrol'
                        },
                        null,
                        2
                      ),
                      'manifest'
                    )
                  }
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {copiedKey === 'manifest' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey === 'manifest' ? 'Copied' : 'Copy'}
                </button>
              </div>

              {/* Icon Assets Preview */}
              <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-3">
                <span className="text-xs font-black text-[#14363d] block">Packaged Android Icon Assets</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e7e1d5] flex flex-col items-center text-center">
                    <img src="/pwa-192x192.png" alt="192x192" className="w-12 h-12 rounded-xl mb-1.5 shadow-2xs" />
                    <span className="text-[11px] font-bold text-[#14363d]">192 x 192 px</span>
                    <span className="text-[10px] text-[#6b7280]">Any Purpose</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e7e1d5] flex flex-col items-center text-center">
                    <img src="/pwa-512x512.png" alt="512x512" className="w-12 h-12 rounded-xl mb-1.5 shadow-2xs" />
                    <span className="text-[11px] font-bold text-[#14363d]">512 x 512 px</span>
                    <span className="text-[10px] text-[#6b7280]">Hi-Res Splash</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e7e1d5] flex flex-col items-center text-center">
                    <img src="/pwa-maskable-512x512.png" alt="Maskable" className="w-12 h-12 rounded-full mb-1.5 shadow-2xs" />
                    <span className="text-[11px] font-bold text-[#14363d]">512 x 512 Mask</span>
                    <span className="text-[10px] text-[#6b7280]">Android Adaptive</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#faf8f4] border border-[#e7e1d5] flex flex-col items-center text-center">
                    <img src="/apple-touch-icon.png" alt="iOS" className="w-12 h-12 rounded-xl mb-1.5 shadow-2xs" />
                    <span className="text-[11px] font-bold text-[#14363d]">180 x 180 px</span>
                    <span className="text-[10px] text-[#6b7280]">Touch Icon</span>
                  </div>
                </div>
              </div>

              {/* AndroidManifest.xml preview & download */}
              <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#176f78]" />
                    <span className="text-xs font-black text-[#14363d]">AndroidManifest.xml (Android Native)</span>
                  </div>
                  <button
                    onClick={() => handleDownloadFile('AndroidManifest.xml', androidManifestXml, 'application/xml')}
                    className="px-2.5 py-1 rounded-lg bg-[#176f78] hover:bg-[#125860] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" /> Download XML
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#0f282f] text-teal-200 font-mono text-[10px] overflow-x-auto max-h-36">
                  {androidManifestXml}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: BUBBLEWRAP (GOOGLE PLAY TWA / APK BUILD) */}
          {activeTab === 'twa_build' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-amber-950">
                      Google Bubblewrap CLI (Official Trusted Web Activity)
                    </h4>
                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      Bubblewrap is Google's official command-line tool that turns Progressive Web Apps into signed <strong>.apk</strong> and <strong>.aab</strong> (Android App Bundle) packages ready for direct sideloading or Google Play Store release.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#176f78]" />
                    <span className="text-xs font-black text-[#14363d]">One-Command APK Generation</span>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `# Install Bubblewrap CLI\nnpm i -g @bubblewrap/cli\n\n# Initialize from manifest\nbubblewrap init --manifest=${currentUrl}/manifest.webmanifest\n\n# Build Signed Android APK\nbubblewrap build`,
                        'bubblewrap'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#f1eee6] hover:bg-[#e7e1d5] text-xs font-bold text-[#17343a] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'bubblewrap' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    Copy Commands
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-[#0f282f] text-emerald-300 font-mono text-xs space-y-1.5">
                  <div className="text-teal-400/60"># 1. Install Bubblewrap CLI globally</div>
                  <div>npm install -g @bubblewrap/cli</div>
                  <div className="text-teal-400/60 pt-1"># 2. Initialize Android project</div>
                  <div>bubblewrap init --manifest={currentUrl}/manifest.webmanifest</div>
                  <div className="text-teal-400/60 pt-1"># 3. Build Production APK &amp; AAB</div>
                  <div>bubblewrap build</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-[#14363d]">twa-manifest.json</h4>
                  <p className="text-[11px] text-[#6b7280]">
                    Pre-configured package metadata for com.debonair.iedailycontrol
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadFile('twa-manifest.json', twaManifestJson, 'application/json')}
                  className="px-3 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download twa-manifest.json
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CAPACITOR & ANDROID STUDIO */}
          {activeTab === 'capacitor' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#176f78]" />
                  <h4 className="text-xs font-black text-[#14363d]">Build Native Android Studio Project</h4>
                </div>
                <p className="text-xs text-[#476369] leading-relaxed">
                  Use Capacitor to open the app directly inside <strong>Android Studio</strong>, test on Android emulators, and generate Gradle builds.
                </p>

                <div className="p-3 rounded-xl bg-[#0f282f] text-emerald-300 font-mono text-xs space-y-1.5">
                  <div className="text-teal-400/60"># 1. Install Capacitor CLI &amp; Android platform</div>
                  <div>npm install @capacitor/core @capacitor/android</div>
                  <div>npm install -D @capacitor/cli</div>
                  <div className="text-teal-400/60 pt-1"># 2. Build production web bundle</div>
                  <div>npm run build</div>
                  <div className="text-teal-400/60 pt-1"># 3. Add Android platform &amp; sync</div>
                  <div>npx cap add android</div>
                  <div>npx cap sync android</div>
                  <div className="text-teal-400/60 pt-1"># 4. Open in Android Studio to build APK</div>
                  <div>npx cap open android</div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `npm install @capacitor/core @capacitor/android && npm install -D @capacitor/cli && npm run build && npx cap add android && npx cap sync android && npx cap open android`,
                        'cap_all'
                      )
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-xs font-bold text-[#17343a] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'cap_all' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Full Capacitor Workflow
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#f1eee6] border-t border-[#d9d2c2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold text-[#14363d]">
              SHA256 &amp; Digital Asset Links Pre-Configured
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-gray-50 text-xs font-bold text-[#17343a] cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
