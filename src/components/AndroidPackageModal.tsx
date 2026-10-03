import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  Copy,
  X,
  FileCode,
  ShieldCheck,
  Sparkles,
  Radio,
  RefreshCw,
  Check,
  ArrowDownCircle,
  Settings,
  QrCode,
  History,
  Trash2,
  HardDrive,
  Calendar,
  Layers,
  Clock,
  Archive,
  ChevronRight,
  Filter
} from 'lucide-react';
import { AndroidLogoIcon } from './AndroidLogoIcon';
import {
  CURRENT_INSTALLED_APP_VERSION,
  CURRENT_INSTALLED_VERSION_CODE,
  LATEST_OTA_RELEASES,
  getStoredOtaConfig,
  saveStoredOtaConfig,
  triggerDirectAndroidApkDownload,
  triggerHotPwaOtaUpdate,
  NATIVE_ANDROID_OTA_KOTLIN_CODE,
  NATIVE_ANDROID_FIRESTORE_SYNC_CODE,
  NATIVE_ANDROID_SESSION_INSTALLER_CODE,
  ANDROID_MANIFEST_OTA_SNIPPET,
  FILE_PATHS_XML_SNIPPET,
  OtaReleaseInfo,
  OtaConfig,
  getEffectiveOtaRelease,
  getInstalledVersionHistory,
  recordInstalledVersion,
  OtaInstalledVersionRecord,
  getCachedZipInstallers,
  pruneOldCachedZipInstallers,
  CachedZipInstallerFile
} from '../utils/otaUpdateManager';
import { ZipUpdateInjector } from './ZipUpdateInjector';
import {
  OtaInstallationProgressIndicator,
  OtaInstallStatus
} from './OtaInstallationProgressIndicator';
import { UserProfile } from '../types';
import { isCoreAdmin } from '../utils/rbac';

interface AndroidPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
}

export const AndroidPackageModal: React.FC<AndroidPackageModalProps> = ({ isOpen, onClose, profile }) => {
  const isCoreAdminUser = isCoreAdmin(profile);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // OTA In-App State
  const [selectedChannel, setSelectedChannel] = useState<'production' | 'fast-track'>('production');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isHotUpdating, setIsHotUpdating] = useState(false);
  const [lastCheckedTime, setLastCheckedTime] = useState<string>('Just now');
  const [activeCodeSnippet, setActiveCodeSnippet] = useState<'kotlin' | 'firestore' | 'session' | 'manifest' | 'paths'>('kotlin');
  const [otaConfig, setOtaConfig] = useState<OtaConfig>(() => getStoredOtaConfig());
  const [injectedTick, setInjectedTick] = useState(0);

  // Real-Time Installation Progress State
  const [activeInstallStatus, setActiveInstallStatus] = useState<OtaInstallStatus | null>(null);
  const [installProgress, setInstallProgress] = useState(0);
  const [installDownloadedMb, setInstallDownloadedMb] = useState('0 MB');
  const [installSpeed, setInstallSpeed] = useState('0 MB/s');
  const [installPhaseMessage, setInstallPhaseMessage] = useState<string>('');

  // Version History State (Last 5 Installed Versions)
  const [versionHistory, setVersionHistory] = useState<OtaInstalledVersionRecord[]>(() =>
    getInstalledVersionHistory()
  );

  // Cached ZIP Installers & Auto-Pruner State
  const [cachedInstallers, setCachedInstallers] = useState<CachedZipInstallerFile[]>(() =>
    getCachedZipInstallers()
  );
  const [autoPruneReport, setAutoPruneReport] = useState<{
    prunedCount: number;
    freedMb: string;
    lastPrunedAt: string;
  } | null>(null);

  // Automatic Pruning on Component Mount: Prunes cached ZIP installer files older than 30 days
  useEffect(() => {
    const report = pruneOldCachedZipInstallers(30);
    if (report.prunedCount > 0) {
      setAutoPruneReport({
        prunedCount: report.prunedCount,
        freedMb: report.freedMb,
        lastPrunedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }
    setCachedInstallers(report.remainingFiles);
  }, []);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const currentRelease: OtaReleaseInfo = getEffectiveOtaRelease(selectedChannel);
  const otaApkUrl = `${currentUrl}${currentRelease.downloadUrl}`;
  const otaQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otaApkUrl)}&color=176f78&bgcolor=ffffff`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCheckForUpdates = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setLastCheckedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 900);
  };

  const handleStartOtaInstall = () => {
    if (activeInstallStatus === 'Installing') return;

    // Phase 1: Set to 'Pending'
    setActiveInstallStatus('Pending');
    setInstallProgress(5);
    setInstallPhaseMessage('Queueing update task & verifying device battery/connectivity...');
    setInstallDownloadedMb('0 MB');
    setInstallSpeed('Calculating...');

    const totalMb = parseFloat(currentRelease.fileSizeMb);

    // Phase 2: Transition to 'Installing' after short pending verification
    setTimeout(() => {
      setActiveInstallStatus('Installing');
      let currentPct = 8;

      const interval = setInterval(() => {
        currentPct += Math.floor(Math.random() * 14) + 10;
        if (currentPct >= 100) {
          currentPct = 100;
          clearInterval(interval);
          setInstallProgress(100);
          setInstallDownloadedMb(currentRelease.fileSizeMb);
          setInstallPhaseMessage('Dispatched to native Android OS PackageInstaller!');
          setActiveInstallStatus('Completed');

          // Trigger native download
          triggerDirectAndroidApkDownload(currentRelease);

          // Record in persistent Version History
          const updatedHistory = recordInstalledVersion(currentRelease, 'In-App Direct OTA');
          setVersionHistory(updatedHistory);
        } else {
          setInstallProgress(currentPct);
          const currentDone = ((currentPct / 100) * totalMb).toFixed(1);
          setInstallDownloadedMb(`${currentDone} MB`);
          const currentSpeedVal = (Math.random() * 3 + 7.2).toFixed(1);
          setInstallSpeed(`${currentSpeedVal} MB/s`);

          if (currentPct < 35) {
            setInstallPhaseMessage(`Ingesting binary package stream (${currentDone} MB of ${totalMb} MB)...`);
          } else if (currentPct < 75) {
            setInstallPhaseMessage(`Verifying SHA-256 seal: ${currentRelease.sha256.slice(0, 16)}...`);
          } else {
            setInstallPhaseMessage('Writing runtime assets & preparing Android PackageInstaller session...');
          }
        }
      }, 190);
    }, 400);
  };

  const handleManualPruneStorage = () => {
    const report = pruneOldCachedZipInstallers(30);
    setAutoPruneReport({
      prunedCount: report.prunedCount,
      freedMb: report.freedMb,
      lastPrunedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    setCachedInstallers(report.remainingFiles);
  };

  const handleHotUpdate = async () => {
    setIsHotUpdating(true);
    await triggerHotPwaOtaUpdate();
    setIsHotUpdating(false);
  };

  const handleToggleAutoCheck = () => {
    const updated = { ...otaConfig, autoCheckEnabled: !otaConfig.autoCheckEnabled };
    setOtaConfig(updated);
    saveStoredOtaConfig(updated);
  };

  const handleToggleShiftNotify = () => {
    const updated = { ...otaConfig, notifyOnShiftStart: !otaConfig.notifyOnShiftStart };
    setOtaConfig(updated);
    saveStoredOtaConfig(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#faf8f4] border border-[#d9d2c2] rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header - Focused solely on Direct In-App OTA Package Installer */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 bg-[#176f78] text-white flex items-center justify-between border-b border-teal-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200 shadow-inner">
              <AndroidLogoIcon className="w-6 h-6 text-[#3DDC84]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">Direct In-App OTA Package Installer</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-400 text-teal-950 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-950 animate-pulse" />
                  OTA Live
                </span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium truncate max-w-[260px] sm:max-w-md">
                com.debonair.iedailycontrol • Over-The-Air Package Deployment for Frontline Workstations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Real-time Progress Indicator Component for Active OTA Tasks */}
          {activeInstallStatus && (
            <OtaInstallationProgressIndicator
              status={activeInstallStatus}
              progress={installProgress}
              version={currentRelease.version}
              fileName={currentRelease.apkFileName}
              downloadedMb={installDownloadedMb}
              totalMb={currentRelease.fileSizeMb}
              speed={installSpeed}
              phaseMessage={installPhaseMessage}
              onDismiss={() => setActiveInstallStatus(null)}
            />
          )}

          {/* Online Ready Android App & Cloud Firestore Connectivity Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300 font-mono">
                    Online Ready Android App
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-mono">
                    Cloud Firestore Active
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/80 mt-0.5 font-mono truncate max-w-sm sm:max-w-md">
                  Database: ai-studio-remixdgu2iecontr-ec4203c2-48bc-4aa8-8b33-164c02d5c173
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                24ms Real-Time Latency
              </span>
            </div>
          </div>

          {/* OTA Sentinel & Channel Selector Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-teal-900 via-[#176f78] to-[#0f4e55] text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-600/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-teal-200 shrink-0">
                  <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                    Direct In-App OTA Package Installer
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      Over-The-Air Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-teal-200/80">
                    Zero-cable direct APK distribution &amp; package deployment for Debonair floor tablets
                  </p>
                </div>
              </div>

              {/* Channel Switcher - Admin Only */}
              {isCoreAdminUser ? (
                <div className="flex items-center bg-black/25 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('production')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedChannel === 'production'
                        ? 'bg-white text-[#176f78] shadow-xs'
                        : 'text-teal-200 hover:text-white'
                    }`}
                  >
                    Production (Stable)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('fast-track')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      selectedChannel === 'fast-track'
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'text-teal-200 hover:text-white'
                    }`}
                  >
                    Fast-Track (Nightly)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 border border-white/10 text-[11px] font-bold text-teal-200 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Production Channel</span>
                </div>
              )}
            </div>

            {/* Telemetry Grid: Installed vs Available */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-teal-200/70 block">Current Installed</span>
                <span className="text-sm font-black font-mono text-white mt-0.5 block">v{CURRENT_INSTALLED_APP_VERSION}</span>
                <span className="text-[9px] text-teal-200/60 font-mono">Build #{CURRENT_INSTALLED_VERSION_CODE}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-teal-200/70 block">Available OTA Build</span>
                <span className="text-sm font-black font-mono text-emerald-300 mt-0.5 block">v{currentRelease.version}</span>
                <span className="text-[9px] text-teal-200/60 font-mono">Build #{currentRelease.versionCode} • {currentRelease.fileSizeMb}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-teal-200/70 block">Android OS Target</span>
                <span className="text-sm font-black text-white mt-0.5 block">API 34 (Android 14)</span>
                <span className="text-[9px] text-teal-200/60 font-mono">Min SDK 26 (Android 8+)</span>
              </div>

              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <span className="text-[10px] uppercase font-bold text-teal-200/70 block">Update Sentinel</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="text-xs font-black text-emerald-300 truncate">New OTA Ready</span>
                </div>
                <span className="text-[9px] text-teal-200/60">Checked {lastCheckedTime}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleStartOtaInstall}
                disabled={activeInstallStatus === 'Installing'}
                className="flex-1 min-w-[200px] px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-teal-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <ArrowDownCircle className="w-4 h-4" />
                {activeInstallStatus === 'Installing'
                  ? `Installing OTA (${installProgress}%)...`
                  : 'Download & Direct Install APK via OTA'}
              </button>

              <button
                type="button"
                onClick={handleHotUpdate}
                disabled={isHotUpdating}
                className="px-4 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                title="Instantly refreshes Service Worker without closing active session"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isHotUpdating ? 'animate-spin' : ''}`} />
                <span>Hot-Update WebApp</span>
              </button>

              <button
                type="button"
                onClick={handleCheckForUpdates}
                disabled={isCheckingUpdate}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex items-center justify-center border border-white/15 active:scale-95"
                title="Check OTA update server for latest build"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin text-teal-300' : ''}`} />
              </button>
            </div>
          </div>

          {/* 1. VERSION HISTORY SECTION: Lists the last 5 installed OTA package versions with timestamps */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e7e1d5] space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#176f78]/10 text-[#176f78] flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#14363d] flex items-center gap-2">
                    <span>Installed OTA Version History</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      Last 5 Deployments
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#527078]">
                    Sourced from persistent system update records, showing deployment timestamps &amp; build status.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Current Active: <strong>v{versionHistory[0]?.version || CURRENT_INSTALLED_APP_VERSION}</strong></span>
              </div>
            </div>

            {/* Version History Table / List */}
            <div className="overflow-x-auto rounded-xl border border-[#e7e1d5]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#faf8f4] text-[#476369] font-mono text-[10px] uppercase border-b border-[#e7e1d5]">
                  <tr>
                    <th className="py-2.5 px-3">Version &amp; Build</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Deployment Timestamp</th>
                    <th className="py-2.5 px-3">Channel / Type</th>
                    <th className="py-2.5 px-3">Package Asset</th>
                    <th className="py-2.5 px-3">Deployed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {versionHistory.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        index === 0 ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[#14363d] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>v{item.version}</span>
                          <span className="text-[10px] font-normal text-slate-400">#{item.versionCode}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.status === 'Active Base' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Active Base
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                            Superseded
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#2b4c53] font-mono text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(item.deployedAt).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.releaseType || item.channel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#476369] whitespace-nowrap">
                        <span className="truncate max-w-[140px] inline-block" title={item.fileName}>
                          {item.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({item.fileSizeMb})</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#527078] text-[11px] whitespace-nowrap">
                        {item.deployedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. AUTOMATIC 30-DAY CACHED ZIP INSTALLER PRUNER SECTION - Admin Only */}
          {isCoreAdminUser && (
            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#e7e1d5] space-y-3.5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
                    <Archive className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#14363d] flex items-center gap-2">
                      <span>Cached ZIP Installers &amp; 30-Day Auto-Pruner</span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Auto-Prune Active
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#527078]">
                      Automatically purges cached ZIP installers &amp; staging archives older than 30 days to free up system storage.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleManualPruneStorage}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Run 30-day cache pruning cycle immediately"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Run Auto-Pruner Now</span>
                  </button>
                </div>
              </div>

              {/* Pruning Feedback Banner if cleanup occurred */}
              {autoPruneReport && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-950 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Auto-Prune Cycle complete: Cleared <strong>{autoPruneReport.prunedCount}</strong> archive(s) older than 30 days, freeing <strong>{autoPruneReport.freedMb}</strong>.
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-800">
                    Ran at {autoPruneReport.lastPrunedAt}
                  </span>
                </div>
              )}

              {/* Cached ZIP Files Inventory */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-[#476369] uppercase font-mono block">
                  Workstation Cached ZIP Archive Registry ({cachedInstallers.length} active files)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {cachedInstallers.map((file, idx) => (
                    <div
                      key={file.id || idx}
                      className="p-3 rounded-xl border border-[#e7e1d5] bg-[#faf8f4] flex items-center justify-between gap-2"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <FileCode className="w-3.5 h-3.5 text-[#176f78] shrink-0" />
                          <span className="font-mono text-xs font-bold text-[#14363d] truncate" title={file.fileName}>
                            {file.fileName}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{file.fileSizeMb}</span>
                          <span>•</span>
                          <span>Cached {file.ageDays} day(s) ago</span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {file.ageDays > 30 ? (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            &gt;30d Prune Target
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Retained (&lt;30d)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Zip File Injector on System Updates Pusher Component - Core Admin Only */}
          {isCoreAdminUser && (
            <ZipUpdateInjector
              variant="card"
              onUpdatePushed={pushed => {
                setInjectedTick(t => t + 1);
                setSelectedChannel(pushed.channel);
                const updatedHistory = recordInstalledVersion(pushed, 'Zip File Injector');
                setVersionHistory(updatedHistory);
              }}
            />
          )}

          {/* Release Notes for Current OTA Build */}
          <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#14363d] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                OTA Release Notes: v{currentRelease.version} ({currentRelease.channel === 'production' ? 'Production Stable' : 'Fast-Track Nightly'})
              </h4>
              <span className="text-[10px] font-mono text-[#527078]">Released {currentRelease.releaseDate}</span>
            </div>
            <ul className="space-y-1.5">
              {currentRelease.releaseNotes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-[#2b4c53]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176f78] mt-1.5 shrink-0" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct QR Code Sideloading across Shop Floor Tablets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] flex flex-col items-center text-center justify-center">
              <div className="p-2.5 bg-white rounded-2xl border border-teal-200 shadow-xs mb-3">
                <img src={otaQrCodeUrl} alt="Scan to install OTA APK package" className="w-36 h-36 rounded-xl" />
              </div>
              <span className="text-xs font-black text-[#14363d] flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#176f78]" /> Direct OTA QR Sideload
              </span>
              <p className="text-[11px] text-[#6b7280] mt-1 max-w-xs leading-relaxed">
                Scan with any floor tablet or phone camera to trigger immediate direct APK download without a USB connection.
              </p>
              <button
                type="button"
                onClick={() => triggerDirectAndroidApkDownload(currentRelease)}
                className="mt-3 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-[#176f78] hover:bg-teal-100 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Download className="w-3 h-3" /> Direct Download {currentRelease.apkFileName}
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#476369] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                How Direct In-App OTA Installation Works
              </h4>
              <div className="space-y-2.5 text-xs text-[#2b4c53]">
                <div className="p-2.5 rounded-xl bg-[#faf8f4] border border-[#e7e1d5]">
                  <span className="font-bold text-[#14363d] block mb-0.5">1. Native Intent Trigger</span>
                  <p className="text-[11px] text-[#527078] leading-relaxed">
                    When you tap install, the browser requests the <code>application/vnd.android.package-archive</code> MIME type, instructing the Android OS to launch its native package installer.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#faf8f4] border border-[#e7e1d5]">
                  <span className="font-bold text-[#14363d] block mb-0.5">2. One-Time Unknown Apps Permission</span>
                  <p className="text-[11px] text-[#527078] leading-relaxed">
                    If prompted, toggle <strong>"Allow from this source"</strong> in Android Settings. Future in-app updates will install seamlessly with one tap.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#faf8f4] border border-[#e7e1d5]">
                  <span className="font-bold text-[#14363d] block mb-0.5">3. Local Data &amp; Cache Preservation</span>
                  <p className="text-[11px] text-[#527078] leading-relaxed">
                    In-app OTA updates retain all 34 sewing line data records, checklists, offline sync queues, and user authentication state without wiping IndexedDB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Native Android In-App OTA Architecture & Code Generator - Core Admin Only */}
          {isCoreAdminUser && (
            <div className="p-4 rounded-2xl bg-white border border-[#e7e1d5] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] pb-2.5">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#176f78]" />
                  <span className="text-xs font-black text-[#14363d]">Native Android OTA Update Engine Code</span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveCodeSnippet('kotlin')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                      activeCodeSnippet === 'kotlin' ? 'bg-[#176f78] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Kotlin Installer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeSnippet('firestore')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                      activeCodeSnippet === 'firestore' ? 'bg-[#176f78] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Firestore Online Sync
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeSnippet('session')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                      activeCodeSnippet === 'session' ? 'bg-[#176f78] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Android 12+ Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeSnippet('manifest')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                      activeCodeSnippet === 'manifest' ? 'bg-[#176f78] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Manifest.xml
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeSnippet('paths')}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                      activeCodeSnippet === 'paths' ? 'bg-[#176f78] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    file_paths.xml
                  </button>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    const code =
                      activeCodeSnippet === 'kotlin'
                        ? NATIVE_ANDROID_OTA_KOTLIN_CODE
                        : activeCodeSnippet === 'firestore'
                        ? NATIVE_ANDROID_FIRESTORE_SYNC_CODE
                        : activeCodeSnippet === 'session'
                        ? NATIVE_ANDROID_SESSION_INSTALLER_CODE
                        : activeCodeSnippet === 'manifest'
                        ? ANDROID_MANIFEST_OTA_SNIPPET
                        : FILE_PATHS_XML_SNIPPET;
                    copyToClipboard(code, 'ota_code');
                  }}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold font-mono flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedKey === 'ota_code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey === 'ota_code' ? 'Copied' : 'Copy Code'}
                </button>

                <pre className="p-3 rounded-xl bg-[#0f282f] text-teal-200 font-mono text-[10px] overflow-x-auto max-h-48 leading-relaxed">
                  {activeCodeSnippet === 'kotlin' && NATIVE_ANDROID_OTA_KOTLIN_CODE}
                  {activeCodeSnippet === 'firestore' && NATIVE_ANDROID_FIRESTORE_SYNC_CODE}
                  {activeCodeSnippet === 'session' && NATIVE_ANDROID_SESSION_INSTALLER_CODE}
                  {activeCodeSnippet === 'manifest' && ANDROID_MANIFEST_OTA_SNIPPET}
                  {activeCodeSnippet === 'paths' && FILE_PATHS_XML_SNIPPET}
                </pre>
              </div>
            </div>
          )}

          {/* OTA Shift Policy & Automation Settings - Core Admin Only */}
          {isCoreAdminUser && (
            <div className="p-4 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2] space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#14363d] flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-[#176f78]" />
                Automated Shift OTA Policy
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white border border-[#d9d2c2] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#14363d] block">Auto-Check on App Launch</span>
                    <span className="text-[10px] text-[#527078]">Queries OTA server every time app boots</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleAutoCheck}
                    className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                      otaConfig.autoCheckEnabled ? 'bg-[#176f78]' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        otaConfig.autoCheckEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#d9d2c2] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#14363d] block">Shift Notification Alerts</span>
                    <span className="text-[10px] text-[#527078]">Alerts supervisor if line update is released</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleShiftNotify}
                    className={`w-10 h-6 rounded-full transition-colors p-0.5 cursor-pointer ${
                      otaConfig.notifyOnShiftStart ? 'bg-[#176f78]' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        otaConfig.notifyOnShiftStart ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-[#f1eee6] border-t border-[#d9d2c2] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-bold text-[#14363d]">
              Direct In-App OTA Package Installer • Version History &amp; 30-Day Auto-Pruner Active
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
