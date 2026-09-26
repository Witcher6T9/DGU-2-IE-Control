/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Cloud,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle2,
  Database,
  ArrowUpRight,
  ShieldCheck,
  Flame,
  Layers
} from 'lucide-react';
import {
  useLineProductivityMetrics,
  LineProductivityMetric,
  saveLineProductivityMetric
} from '../lib/lineProductivityFetcher';
import { LineEntry } from '../types';
import { auth, googleSignIn } from '../lib/firebaseAuth';
import firebaseConfig from '../../firebase-applet-config.json';

interface LineProductivityMetricsCardProps {
  currentLines?: LineEntry[];
  activeDate?: string;
  onSelectLine?: (lineNo: string) => void;
}

export const LineProductivityMetricsCard: React.FC<LineProductivityMetricsCardProps> = ({
  currentLines = [],
  activeDate,
  onSelectLine
}) => {
  const { metrics, summary, loading, error, refetch } = useLineProductivityMetrics(activeDate);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Sync current floor lines to Firestore 'line_entries' collection so user has immediate rich data to fetch
  const handleSeedOrSyncToFirestore = async () => {
    if (!currentLines || currentLines.length === 0) return;

    if (!auth.currentUser) {
      setSyncFeedback('Authentication required for database write operations. Opening Google sign-in...');
      const res = await googleSignIn();
      if (!res?.user) {
        setSyncFeedback('Sign-in required to write records to Firestore.');
        return;
      }
    }

    setIsSyncing(true);
    setSyncFeedback(null);

    try {
      let count = 0;
      for (const line of currentLines.slice(0, 15)) {
        const metric: LineProductivityMetric = {
          id: `line_${line.lineNo.replace(/\s+/g, '_').toLowerCase()}_${line.date || activeDate || 'today'}`,
          lineNo: line.lineNo,
          style: line.style || 'T-Shirt Crew Neck',
          buyer: line.buyer || 'Global Buyer',
          date: line.date || activeDate || new Date().toISOString().split('T')[0],
          floor: line.floor || 'Floor 01',
          targetHourly: Math.round((line.targetProd || 1000) / 8),
          targetDay: line.targetProd || 1000,
          actualOutput: line.achievedProd || 0,
          efficiencyPct: line.efficiency || 0,
          targetEfficiencyPct: line.targetEff || 75,
          smv: line.smv || 18.5,
          operatorPresent: line.mp?.Operator?.present || 35,
          helperPresent: line.mp?.Helper?.present || 8,
          totalManpower: (line.mp?.Operator?.present || 35) + (line.mp?.Helper?.present || 8),
          bottleneckStation: line.bottleneck?.station || 'Armhole Join',
          bottleneckCT: line.bottleneck?.cycleTime || 28,
          targetCT: line.bottleneck?.targetCT || 25,
          status: line.efficiency >= 75 ? 'running' : line.efficiency >= 60 ? 'delayed' : 'critical',
          updatedBy: 'local_sync',
          updatedAt: new Date().toISOString()
        };
        await saveLineProductivityMetric(metric);
        count++;
      }

      setSyncFeedback(`Successfully synced ${count} line metrics to Firestore!`);
      await refetch();
    } catch (err: any) {
      setSyncFeedback(`Sync error: ${err?.message || 'Check Firestore permissions'}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-teal-100 dark:border-teal-900/40 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-sm">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                Live Line Productivity Metrics
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3" /> Firestore Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Database: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">{(firebaseConfig as any).firestoreDatabaseId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="Refresh metrics from Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Fetching...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleSeedOrSyncToFirestore}
            disabled={isSyncing || !currentLines.length}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Upload current lines into Firestore line_entries collection"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Syncing...' : 'Sync Lines to Cloud'}</span>
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 text-xs rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 flex items-center justify-between">
          <span>{syncFeedback}</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
          <span>{error.includes('the client is offline') ? 'Firestore client connecting...' : error}</span>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Tracked Lines</span>
            <Layers className="w-3.5 h-3.5 text-teal-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {metrics.length > 0 ? metrics.length : currentLines.length}
          </div>
          <div className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
            {summary.runningLinesCount || metrics.length} operating
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Total Output</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {summary.totalActualOutput.toLocaleString() || '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Target: {summary.totalTargetDay.toLocaleString()} pcs
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Avg Efficiency</span>
            <Activity className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {summary.averageEfficiency > 0 ? `${summary.averageEfficiency}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Standard pitch SMV
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Bottlenecks</span>
            <Flame className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {summary.criticalLinesCount}
          </div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
            Requires IE balance
          </div>
        </div>
      </div>

      {/* Metrics Feed Table */}
      {metrics.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Line</th>
                <th className="py-2.5 px-3 font-semibold">Style / Buyer</th>
                <th className="py-2.5 px-3 font-semibold text-right">Target</th>
                <th className="py-2.5 px-3 font-semibold text-right">Actual</th>
                <th className="py-2.5 px-3 font-semibold text-right">Efficiency</th>
                <th className="py-2.5 px-3 font-semibold">Key Bottleneck</th>
                <th className="py-2.5 px-3 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {metrics.slice(0, 8).map(m => (
                <tr
                  key={m.id}
                  onClick={() => onSelectLine && onSelectLine(m.lineNo)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{m.lineNo}</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400" />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium truncate max-w-[140px]">{m.style}</div>
                    <div className="text-[10px] text-slate-400">{m.buyer}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">
                    {m.targetDay.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white">
                    {m.actualOutput.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                        m.efficiencyPct >= 75
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : m.efficiencyPct >= 60
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {m.efficiencyPct}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate block max-w-[130px]">
                      {m.bottleneckStation || 'Balanced'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        m.status === 'running'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : m.status === 'delayed'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
          <Database className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            No line productivity records in Firestore collection yet
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Click &quot;Sync Lines to Cloud&quot; above to push the current floor lines into the{' '}
            <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[11px]">line_entries</code> Firestore collection.
          </p>
        </div>
      )}
    </div>
  );
};
