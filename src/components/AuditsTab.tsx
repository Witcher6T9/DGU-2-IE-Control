import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Gauge, 
  ClipboardCheck, 
  Plus, 
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { AuditCheckItem, CenterlineAuditItem } from '../types/dcs';

interface AuditsTabProps {
  auditItems: AuditCheckItem[];
  centerlines: CenterlineAuditItem[];
  onToggleAuditItem: (id: string, newStatus: 'pass' | 'warning' | 'fail') => void;
  onUpdateCenterlineValue: (id: string, newValue: number) => void;
}

export const AuditsTab: React.FC<AuditsTabProps> = ({
  auditItems,
  centerlines,
  onToggleAuditItem,
  onUpdateCenterlineValue,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'5s' | 'centerlines'>('5s');

  // Compute 5S Score
  const passCount = auditItems.filter((a) => a.status === 'pass').length;
  const warningCount = auditItems.filter((a) => a.status === 'warning').length;
  const failCount = auditItems.filter((a) => a.status === 'fail').length;
  // Weighting: pass = 100%, warning = 50%, fail = 0%
  const totalWeight = auditItems.length || 1;
  const score5s = Math.round(((passCount * 1.0 + warningCount * 0.5) / totalWeight) * 100);

  // Compute Centerlines compliance
  const inSpecCount = centerlines.filter((c) => c.status === 'in_spec').length;
  const centerlineCompliance = Math.round((inSpecCount / (centerlines.length || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Audit KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Daily 5S Workplace Score
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className={`text-3xl font-extrabold ${score5s >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {score5s}%
            </span>
            <span className="text-xs text-slate-400">Target ≥ 95%</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {passCount} Pass · {warningCount} Warning · {failCount} Fail
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Centerline Compliance (CIL)
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-blue-400">
              {centerlineCompliance}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {inSpecCount}/{centerlines.length} in spec
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Zero critical centerline drifts
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Gemba Walk Verification
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-emerald-400">
              Complete
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Audited at 09:30 by Marcus Chen & Sarah Jenkins
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Safety & Interlocks
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-emerald-400">
              100% OK
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            All 5 light curtains & e-stops verified
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Sub Navigation */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('5s')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                activeSubTab === '5s'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>5S Workplace Organization Checklist ({auditItems.length})</span>
            </button>

            <button
              onClick={() => setActiveSubTab('centerlines')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                activeSubTab === 'centerlines'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              <Gauge className="w-3.5 h-3.5 text-blue-400" />
              <span>Process Centerlines & CIL Parameters ({centerlines.length})</span>
            </button>
          </div>
        </div>

        {activeSubTab === '5s' ? (
          /* 5S Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Zone</th>
                  <th className="py-3 px-4 font-semibold">5S Pillar / Item</th>
                  <th className="py-3 px-6 font-semibold">Established Standard Work Definition</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold">Shift Findings & Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {auditItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors font-sans">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {item.zone}
                    </td>
                    <td className="py-3 px-4 font-medium text-white text-xs">
                      {item.item}
                    </td>
                    <td className="py-3 px-6 text-slate-300 text-xs">
                      {item.standard}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => onToggleAuditItem(item.id, 'pass')}
                          className={`p-1 rounded text-xs transition-colors ${
                            item.status === 'pass'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Pass"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleAuditItem(item.id, 'warning')}
                          className={`p-1 rounded text-xs transition-colors ${
                            item.status === 'warning'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Warning"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleAuditItem(item.id, 'fail')}
                          className={`p-1 rounded text-xs transition-colors ${
                            item.status === 'fail'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                          title="Fail"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-400">
                      {item.notes || <span className="text-slate-600">No deviation observed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Centerlines Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Station</th>
                  <th className="py-3 px-4 font-semibold">Critical Parameter</th>
                  <th className="py-3 px-3 font-semibold text-right">LSL (Min)</th>
                  <th className="py-3 px-3 font-semibold text-center">Nominal Target</th>
                  <th className="py-3 px-3 font-semibold text-left">USL (Max)</th>
                  <th className="py-3 px-4 font-semibold text-right">Live Value</th>
                  <th className="py-3 px-3 font-semibold text-center">Status</th>
                  <th className="py-3 px-3 font-semibold text-right">Last Verified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {centerlines.map((cl) => {
                  const isIn = cl.status === 'in_spec';

                  return (
                    <tr key={cl.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-blue-400">{cl.stationCode}</td>
                      <td className="py-3 px-4 font-sans text-slate-200 font-medium">{cl.parameter}</td>
                      <td className="py-3 px-3 text-right text-slate-500">{cl.lsl} {cl.unit}</td>
                      <td className="py-3 px-3 text-center text-slate-300 font-bold">{cl.target} {cl.unit}</td>
                      <td className="py-3 px-3 text-left text-slate-500">{cl.usl} {cl.unit}</td>
                      <td className="py-3 px-4 text-right font-bold text-white">
                        <span className="text-sm">{cl.currentValue}</span> {cl.unit}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isIn ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5" /> In-Spec
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> Drift
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">{cl.lastChecked}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
