import React from 'react';
import { X, CheckCircle, AlertTriangle, Cpu, Gauge, Clock, User, Wrench } from 'lucide-react';
import { StationData } from '../types/dcs';

interface StationDetailModalProps {
  station: StationData | null;
  onClose: () => void;
  onQuickAction: (actionType: string, station: StationData) => void;
}

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  onClose,
  onQuickAction,
}) => {
  if (!station) return null;

  const totalTime = station.breakdownTime.valueAdded + station.breakdownTime.nonValueAdded + station.breakdownTime.waste;
  const isBottleneck = station.cycleTime > station.targetCycleTime;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-mono text-xs font-bold text-blue-400">
              {station.code}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{station.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
                <span>Operator: {station.operator}</span>
                <span aria-hidden="true">·</span>
                <span className={station.status === 'running' ? 'text-emerald-400' : 'text-amber-400'}>
                  Status: {station.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Bottleneck / Alert Notice if present */}
          {station.currentAlert && (
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 flex items-start gap-2.5 text-xs text-amber-200 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 font-medium">Bottleneck Warning: </strong>
                {station.currentAlert}
              </div>
            </div>
          )}

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="text-xs text-slate-400">Measured Cycle Time</div>
              <div className={`text-xl font-bold font-mono mt-1 ${isBottleneck ? 'text-amber-400' : 'text-emerald-400'}`}>
                {station.cycleTime.toFixed(1)}s
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Target: {station.targetCycleTime.toFixed(1)}s
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="text-xs text-slate-400">Station OEE</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {station.oee.toFixed(1)}%
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Avail: {station.availability}% · Qual: {station.quality}%
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="text-xs text-slate-400">Units Processed</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {station.unitsProduced}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Shift Output
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/60">
              <div className="text-xs text-slate-400">Scrap / Defect Count</div>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                {station.scrapCount}
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                Rate: {((station.scrapCount / (station.unitsProduced + station.scrapCount)) * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Cycle Time Breakdown (Yamazumi element) */}
          <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-slate-200">Cycle Time Element Decomposition (s)</span>
              <span className="font-mono text-slate-400">Total: {totalTime.toFixed(1)}s</span>
            </div>
            
            {/* Visual Bar */}
            <div className="h-4 rounded-md overflow-hidden flex bg-slate-800 text-[10px] font-mono text-white font-medium">
              <div 
                style={{ width: `${(station.breakdownTime.valueAdded / totalTime) * 100}%` }}
                className="bg-emerald-600 flex items-center justify-center"
                title={`Value Added: ${station.breakdownTime.valueAdded}s`}
              >
                VA {station.breakdownTime.valueAdded}s
              </div>
              <div 
                style={{ width: `${(station.breakdownTime.nonValueAdded / totalTime) * 100}%` }}
                className="bg-amber-600 flex items-center justify-center"
                title={`Non-Value Added: ${station.breakdownTime.nonValueAdded}s`}
              >
                NVA {station.breakdownTime.nonValueAdded}s
              </div>
              <div 
                style={{ width: `${(station.breakdownTime.waste / totalTime) * 100}%` }}
                className="bg-rose-600 flex items-center justify-center"
                title={`Waste: ${station.breakdownTime.waste}s`}
              >
                W {station.breakdownTime.waste}s
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Value Added: <strong className="text-slate-200 font-mono">{station.breakdownTime.valueAdded}s</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Non-Value Added: <strong className="text-slate-200 font-mono">{station.breakdownTime.nonValueAdded}s</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Waste / Dwell: <strong className="text-slate-200 font-mono">{station.breakdownTime.waste}s</strong></span>
              </div>
            </div>
          </div>

          {/* Centerlines (Process Parameter Standards) */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                Process Centerlines & Critical Quality Parameters
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">All within USL/LSL</span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3 font-medium">Parameter</th>
                    <th className="py-2 px-2 font-medium text-center">Nominal</th>
                    <th className="py-2 px-2 font-medium text-center">Spec Range</th>
                    <th className="py-2 px-2 font-medium text-right">Current Value</th>
                    <th className="py-2 px-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {station.centerlines.map((cl, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-sans text-slate-200">{cl.parameter}</td>
                      <td className="py-2.5 px-2 text-center text-slate-400">{cl.nominal} {cl.unit}</td>
                      <td className="py-2.5 px-2 text-center text-slate-500">{cl.min} – {cl.max} {cl.unit}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-white">{cl.current} {cl.unit}</td>
                      <td className="py-2.5 px-3 text-right">
                        {cl.inSpec ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle className="w-3 h-3" /> In-Spec
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                            <AlertTriangle className="w-3 h-3" /> Out-of-Spec
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onQuickAction('log_downtime', station)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Log Downtime
            </button>
            <button
              onClick={() => onQuickAction('create_action', station)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Add IE Action Item
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
