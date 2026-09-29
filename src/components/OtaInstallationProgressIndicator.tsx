import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle2,
  DownloadCloud,
  ShieldCheck,
  Cpu,
  Wifi,
  Sparkles
} from 'lucide-react';

export type OtaInstallStatus = 'Pending' | 'Installing' | 'Completed';

interface OtaInstallationProgressIndicatorProps {
  status: OtaInstallStatus;
  progress: number; // 0 to 100
  version: string;
  fileName: string;
  downloadedMb?: string;
  totalMb?: string;
  speed?: string;
  phaseMessage?: string;
  onDismiss?: () => void;
}

export const OtaInstallationProgressIndicator: React.FC<OtaInstallationProgressIndicatorProps> = ({
  status,
  progress,
  version,
  fileName,
  downloadedMb = '0 MB',
  totalMb = '28.4 MB',
  speed = '7.5 MB/s',
  phaseMessage,
  onDismiss
}) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  // Derive dynamic phase description if not provided
  const currentPhase =
    phaseMessage ||
    (status === 'Pending'
      ? 'Initializing secure OTA payload channel & battery checks...'
      : status === 'Installing'
      ? clampedProgress < 40
        ? 'Ingesting binary package stream...'
        : clampedProgress < 85
        ? 'Verifying SHA-256 cryptographic seal & uncompressing...'
        : 'Finalizing Android PackageInstaller session...'
      : 'OTA package ready! Dispatched to Android OS PackageInstaller.');

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-md animate-in fade-in duration-200 ${
        status === 'Pending'
          ? 'bg-gradient-to-br from-amber-500/15 via-[#182029] to-[#12171e] border-amber-500/35 text-amber-100'
          : status === 'Installing'
          ? 'bg-gradient-to-br from-teal-900/40 via-[#13282f] to-[#0c1a1f] border-teal-500/45 text-teal-100'
          : 'bg-gradient-to-br from-emerald-900/40 via-[#0e2a22] to-[#0a1c17] border-emerald-500/45 text-emerald-100'
      }`}
      role="status"
      aria-live="polite"
    >
      {/* Top Meta Header: Status & Version Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          {/* Status Badge */}
          {status === 'Pending' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase font-mono tracking-wider bg-amber-400 text-amber-950 shadow-xs">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Pending</span>
            </span>
          )}

          {status === 'Installing' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase font-mono tracking-wider bg-teal-400 text-teal-950 shadow-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Installing</span>
            </span>
          )}

          {status === 'Completed' && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase font-mono tracking-wider bg-emerald-400 text-emerald-950 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          )}

          <div>
            <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
              <span>OTA Task: v{version}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300 font-normal">
                {fileName}
              </span>
            </h4>
          </div>
        </div>

        {/* Real-time Percentage & Speed Readout */}
        <div className="flex items-center gap-2 sm:gap-3 text-right">
          <div className="text-right">
            <span className="text-lg font-black font-mono tracking-tight text-white leading-none block">
              {clampedProgress}%
            </span>
            <span className="text-[10px] font-mono text-slate-300/80 leading-none">
              {status === 'Installing' ? speed : status === 'Completed' ? '100% Verified' : 'Queued'}
            </span>
          </div>

          {onDismiss && status === 'Completed' && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-3.5 space-y-1.5">
        <div className="w-full h-3 rounded-full bg-black/40 border border-white/10 overflow-hidden p-0.5 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-200 ease-out ${
              status === 'Pending'
                ? 'bg-gradient-to-r from-amber-500 to-amber-300'
                : status === 'Installing'
                ? 'bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-300 shadow-sm'
                : 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-sm'
            }`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        {/* Phase Description & Byte Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono">
          <span className="text-slate-200 flex items-center gap-1.5 truncate">
            {status === 'Installing' && <Loader2 className="w-3 h-3 text-teal-300 animate-spin shrink-0" />}
            {status === 'Pending' && <Clock className="w-3 h-3 text-amber-300 shrink-0" />}
            {status === 'Completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
            <span className="truncate">{currentPhase}</span>
          </span>

          <span className="text-slate-300/80 shrink-0 font-bold">
            {downloadedMb} / {totalMb}
          </span>
        </div>
      </div>

      {/* Milestone Checkpoint Indicators */}
      <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
              clampedProgress >= 15 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'
            }`}
          >
            ✓
          </span>
          <span className={clampedProgress >= 15 ? 'text-emerald-200 font-bold' : 'text-slate-400'}>
            1. Verified
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
              clampedProgress >= 85 ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'
            }`}
          >
            ✓
          </span>
          <span className={clampedProgress >= 85 ? 'text-emerald-200 font-bold' : 'text-slate-400'}>
            2. Streamed
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
              status === 'Completed' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'
            }`}
          >
            ✓
          </span>
          <span className={status === 'Completed' ? 'text-emerald-200 font-bold' : 'text-slate-400'}>
            3. Dispatched
          </span>
        </div>
      </div>
    </div>
  );
};
