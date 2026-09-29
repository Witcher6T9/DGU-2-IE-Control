import React, { useState, useRef } from 'react';
import {
  FileArchive,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Copy,
  Radio,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  FileCode,
  FolderTree,
  Terminal,
  RotateCcw,
  Check,
  Zap,
  Download
} from 'lucide-react';
import {
  parseInjectedZipPackage,
  generateSampleOtaZipBlob,
  pushInjectedPackageToOta,
  getInjectedOtaReleases,
  saveInjectedOtaRelease,
  ParsedZipResult,
  OtaReleaseInfo,
  triggerDirectAndroidApkDownload
} from '../utils/otaUpdateManager';

interface ZipUpdateInjectorProps {
  onUpdatePushed?: (release: OtaReleaseInfo) => void;
  onOpenAndroidPackageModal?: () => void;
  variant?: 'card' | 'embedded' | 'standalone';
}

export const ZipUpdateInjector: React.FC<ZipUpdateInjectorProps> = ({
  onUpdatePushed,
  onOpenAndroidPackageModal,
  variant = 'card'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [pushProgress, setPushProgress] = useState(0);
  const [parsedZip, setParsedZip] = useState<ParsedZipResult | null>(null);
  const [pushSuccess, setPushSuccess] = useState<string | null>(null);
  const [targetChannel, setTargetChannel] = useState<'production' | 'fast-track'>('production');
  const [copiedHash, setCopiedHash] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [activeInjectedRelease, setActiveInjectedRelease] = useState<OtaReleaseInfo | null>(() => {
    const stored = getInjectedOtaReleases();
    return stored.production || stored['fast-track'] || null;
  });

  const appendLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev.slice(-15), `[${time}] ${msg}`]);
  };

  const handleFileSelected = async (file: File) => {
    if (!file) return;
    setIsParsing(true);
    setPushSuccess(null);
    setTerminalLogs([]);
    appendLog(`Opening ZIP archive: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);

    try {
      const result = await parseInjectedZipPackage(file);
      setParsedZip(result);
      setTargetChannel(result.inferredRelease.channel);
      appendLog(`Successfully indexed ${result.fileCount} entries inside ZIP package.`);
      appendLog(`Computed SHA-256 seal: ${result.sha256}`);
      appendLog(`Target version identified: v${result.inferredRelease.version} (${result.inferredRelease.channel})`);
    } catch (err: any) {
      appendLog(`ERROR parsing ZIP archive: ${err?.message || 'Corrupt or unreadable zip format'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateSampleZip = async () => {
    setIsParsing(true);
    setPushSuccess(null);
    setTerminalLogs([]);
    appendLog(`Generating valid enterprise hotfix ZIP package in memory...`);

    try {
      const { blob, fileName } = await generateSampleOtaZipBlob('2.4.3', targetChannel);
      const result = await parseInjectedZipPackage(blob, fileName);
      setParsedZip(result);
      appendLog(`Generated ${fileName} with valid manifest.json, APK descriptor & SHA-256 seal.`);
      appendLog(`Ready to inject into System Updates Pusher.`);
    } catch (err: any) {
      appendLog(`ERROR generating sample zip: ${err?.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePushUpdate = async () => {
    if (!parsedZip) return;
    setIsPushing(true);
    setPushProgress(10);
    setPushSuccess(null);

    const releaseToPush: OtaReleaseInfo = {
      ...parsedZip.inferredRelease,
      channel: targetChannel,
      downloadUrl: `/packages/android/${parsedZip.inferredRelease.apkFileName}`
    };

    appendLog(`Initiating System Updates Pusher for v${releaseToPush.version}...`);
    appendLog(`Staging assets to /packages/android/${releaseToPush.apkFileName}...`);
    setPushProgress(35);

    setTimeout(async () => {
      appendLog(`Updating live OTA sentinel at /api/ota/latest...`);
      setPushProgress(70);

      setTimeout(async () => {
        const res = await pushInjectedPackageToOta(releaseToPush);
        setActiveInjectedRelease(releaseToPush);
        setPushProgress(100);
        setIsPushing(false);
        setPushSuccess(res.message);
        appendLog(`SUCCESS: OTA push notification dispatched to all 34 sewing line tablets!`);
        if (onUpdatePushed) onUpdatePushed(releaseToPush);
      }, 600);
    }, 500);
  };

  const handleRevertInjected = () => {
    try {
      const stored = getInjectedOtaReleases();
      stored.production = null;
      stored['fast-track'] = null;
      localStorage.setItem('debonair_injected_ota_releases_v1', JSON.stringify(stored));
      setActiveInjectedRelease(null);
      setParsedZip(null);
      setPushSuccess(null);
      appendLog(`Reverted injected release to base factory image.`);
    } catch (e) {
      console.warn(e);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div
      className={`rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1a212b] overflow-hidden shadow-xs transition-all ${
        variant === 'card' ? 'p-4 sm:p-5' : 'p-3 sm:p-4'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e7e1d5] dark:border-[#28323f]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <FileArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#17343a] dark:text-slate-100 flex items-center gap-1.5">
                Zip File Injector on System Updates Pusher
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 font-bold">
                OTA Pusher
              </span>
            </div>
            <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
              Inject OTA update ZIP packages, APK bundles, or delta patches into the live floor distribution pipeline.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenAndroidPackageModal && (
            <button
              type="button"
              onClick={onOpenAndroidPackageModal}
              className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#125860] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>Open OTA Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Injected Banner if exists */}
      {activeInjectedRelease && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                Active Injected Release: v{activeInjectedRelease.version} ({activeInjectedRelease.channel.toUpperCase()})
              </span>
              <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-mono">
                {activeInjectedRelease.apkFileName} • {activeInjectedRelease.fileSizeMb} • Injected {activeInjectedRelease.injectedAt ? new Date(activeInjectedRelease.injectedAt).toLocaleTimeString() : 'Recently'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => triggerDirectAndroidApkDownload(activeInjectedRelease)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Download staged APK package directly"
            >
              <Download className="w-3 h-3" />
              <span>Download Staged APK</span>
            </button>
            <button
              type="button"
              onClick={handleRevertInjected}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f2630] border border-emerald-300 dark:border-emerald-700/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-700 dark:text-slate-300 hover:text-rose-600 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Revert injected update back to base build"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Upload & Drag-and-Drop Area */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Drag and drop dropzone */}
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="lg:col-span-2 border-2 border-dashed border-[#d9d2c2] dark:border-[#374454] hover:border-[#176f78] dark:hover:border-teal-400 bg-[#fbfaf6] dark:bg-[#181d24] rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip,.ota.zip,.apk.zip"
            className="hidden"
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileSelected(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 transition-colors">
            <UploadCloud className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </div>

          <h4 className="text-xs font-black text-[#17343a] dark:text-slate-100 uppercase tracking-wider">
            Drag &amp; Drop Update ZIP File Here
          </h4>
          <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
            Upload enterprise update archive (<code>.zip</code>) containing <code>manifest.json</code>, app bundle deltas, or compiled Android APK.
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#202732] border border-[#d9d2c2] dark:border-[#2e3846] text-xs font-bold text-[#176f78] dark:text-teal-300 shadow-2xs group-hover:bg-[#176f78] group-hover:text-white transition-colors">
              Browse ZIP File
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Max 100MB</span>
          </div>
        </div>

        {/* Right: Quick Action & Test Generator */}
        <div className="p-4 rounded-2xl bg-[#f5f3ec] dark:bg-[#161c24] border border-[#e7e1d5] dark:border-[#28323f] flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Instant Test Generator
            </span>
            <p className="text-[11px] text-[#527078] dark:text-slate-400 leading-relaxed">
              Don't have a ZIP file ready? Generate and inject a validated in-memory test hotfix archive (<code>v2.4.3</code>) with one click.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setTargetChannel('production')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                  targetChannel === 'production'
                    ? 'bg-[#176f78] text-white shadow-2xs'
                    : 'bg-white dark:bg-[#202732] text-slate-700 dark:text-slate-300'
                }`}
              >
                Production
              </button>
              <button
                type="button"
                onClick={() => setTargetChannel('fast-track')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                  targetChannel === 'fast-track'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white dark:bg-[#202732] text-slate-700 dark:text-slate-300'
                }`}
              >
                Fast-Track
              </button>
            </div>

            <button
              type="button"
              onClick={handleGenerateSampleZip}
              disabled={isParsing}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Generate Sample ZIP (v2.4.3)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Parsing Spinner */}
      {isParsing && (
        <div className="mt-4 p-4 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center gap-2 text-xs font-bold text-[#176f78] dark:text-teal-300 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Extracting ZIP archive entries, verifying structure &amp; computing SHA-256 seal...</span>
        </div>
      )}

      {/* Parsed Zip Inspector & Push Controls */}
      {parsedZip && (
        <div className="mt-4 p-4 rounded-2xl bg-[#faf8f4] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] dark:border-[#28323f] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
                <h4 className="text-xs font-black text-[#17343a] dark:text-slate-100 uppercase tracking-wide">
                  Package Inspector: {parsedZip.fileName}
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                  {parsedZip.fileCount} Entries
                </span>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400 font-mono mt-0.5">
                Size: {(parsedZip.totalSize / (1024 * 1024)).toFixed(2)} MB ({parsedZip.totalSize.toLocaleString()} bytes)
              </p>
            </div>

            {/* Target Channel Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-500 font-bold">Target Channel:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase font-mono bg-[#176f78] text-white">
                {targetChannel}
              </span>
            </div>
          </div>

          {/* SHA-256 and Integrity Check */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#202732] border border-[#d9d2c2] dark:border-[#2e3846] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">SHA-256 Cryptographic Seal</span>
                <span className="text-xs font-mono font-bold text-[#17343a] dark:text-slate-200 truncate block">
                  {parsedZip.sha256}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => copyHash(parsedZip.sha256)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer shrink-0"
            >
              {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              {copiedHash ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Files inside the Zip list */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[#17343a] dark:text-slate-200 flex items-center gap-1.5">
              <FolderTree className="w-3.5 h-3.5 text-[#176f78]" />
              Extracted Package Contents:
            </span>
            <div className="max-h-36 overflow-y-auto rounded-xl border border-[#e7e1d5] dark:border-[#28323f] bg-white dark:bg-[#14181f] p-2 space-y-1 font-mono text-[11px]">
              {parsedZip.files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-0.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="text-amber-500 font-bold">{file.isDirectory ? '📁' : '📄'}</span>
                    <span className="truncate">{file.name}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Push Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-[#527078] dark:text-slate-400">
              Ready to stage as <strong>v{parsedZip.inferredRelease.version}</strong> for all 34 floor tablets.
            </div>

            <button
              type="button"
              onClick={handlePushUpdate}
              disabled={isPushing}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isPushing ? `Pushing (${pushProgress}%)...` : `Inject & Push v${parsedZip.inferredRelease.version} via OTA`}</span>
            </button>
          </div>
        </div>
      )}

      {/* Push Success Toast */}
      {pushSuccess && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-950 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{pushSuccess}</span>
          </div>
          {onOpenAndroidPackageModal && (
            <button
              type="button"
              onClick={onOpenAndroidPackageModal}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 cursor-pointer shadow-2xs"
            >
              Verify in OTA Hub
            </button>
          )}
        </div>
      )}

      {/* Terminal Log Console */}
      {terminalLogs.length > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-[#0f282f] text-emerald-300 font-mono text-[10px] space-y-1 max-h-36 overflow-y-auto">
          <div className="flex items-center gap-1.5 text-teal-400/80 pb-1 border-b border-teal-800/40">
            <Terminal className="w-3 h-3" />
            <span>Pusher &amp; Injector Transaction Stream</span>
          </div>
          {terminalLogs.map((log, idx) => (
            <div key={idx} className="leading-tight">
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
