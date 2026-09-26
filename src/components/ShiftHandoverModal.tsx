import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Printer, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Send
} from 'lucide-react';
import { ShiftInfo, StationData, HourlyOutput, DowntimeIncident, ActionItem } from '../types/dcs';

interface ShiftHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentShift: ShiftInfo;
  stations: StationData[];
  hourlyData: HourlyOutput[];
  downtimeLog: DowntimeIncident[];
  actions: ActionItem[];
}

export const ShiftHandoverModal: React.FC<ShiftHandoverModalProps> = ({
  isOpen,
  onClose,
  currentShift,
  stations,
  hourlyData,
  downtimeLog,
  actions,
}) => {
  const [handoverNotes, setHandoverNotes] = useState(
    'ST-03 running steady but closely monitor cooling dwell. Maintenance has scheduled feeder collet inspection for ST-02 at 14:15 during inter-shift buffer. Scrap bins emptied and 5S clean complete.'
  );
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const totalProduced = stations[stations.length - 1]?.unitsProduced || 1202;
  const totalTarget = currentShift.targetOutput;
  const totalScrap = stations.reduce((acc, s) => acc + s.scrapCount, 0);
  const totalDowntime = downtimeLog.reduce((acc, d) => acc + d.durationMinutes, 0);
  const avgOee = (stations.reduce((acc, s) => acc + s.oee, 0) / stations.length).toFixed(1);
  const openActions = actions.filter((a) => a.status !== 'Verified Closed');

  // Export CSV function
  const handleExportCsv = () => {
    const rows = [
      ['DGU-2 Industrial Engineering Daily Control System - Shift Handover Report'],
      ['Date', new Date().toLocaleDateString()],
      ['Shift', `${currentShift.name} (${currentShift.hours})`],
      ['Supervisor', currentShift.leadSupervisor],
      ['IE Lead', currentShift.ieEngineer],
      [],
      ['KPI Summary'],
      ['Metric', 'Value', 'Target / Status'],
      ['Total Units Produced', totalProduced, `${totalTarget} units`],
      ['Average Line OEE', `${avgOee}%`, '85.0% Target'],
      ['Total Downtime', `${totalDowntime} mins`, `${downtimeLog.length} events`],
      ['Total Scrap Units', totalScrap, `${((totalScrap / totalProduced) * 100).toFixed(2)}% Scrap Rate`],
      [],
      ['Station Breakdown'],
      ['Station', 'Name', 'Cycle Time (s)', 'OEE (%)', 'Produced', 'Scrap', 'Operator'],
      ...stations.map((s) => [s.code, s.name, s.cycleTime, s.oee, s.unitsProduced, s.scrapCount, s.operator]),
      [],
      ['Downtime Incidents'],
      ['Time', 'Station', 'Category', 'Duration (min)', 'Problem', 'Root Cause', 'Action Taken'],
      ...downtimeLog.map((d) => [d.timestamp, d.stationCode, d.category, d.durationMinutes, d.description, d.rootCause, d.actionTaken]),
      [],
      ['Handover Notes for Next Shift'],
      [handoverNotes]
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((cell) => `"${cell}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DGU2_IE_ShiftHandover_${currentShift.id.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                DGU-2 Shift Handover Report & Daily Operations Review
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {currentShift.name} ({currentShift.hours}) · Line DGU-02
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shift Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 font-mono">
            <div className="text-[11px] text-slate-400">Output Volume</div>
            <div className="text-xl font-bold text-white mt-1">
              {totalProduced} / {totalTarget}
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5">
              Delta: {totalProduced - totalTarget} units
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 font-mono">
            <div className="text-[11px] text-slate-400">Average OEE</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {avgOee}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Net operating rate
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 font-mono">
            <div className="text-[11px] text-slate-400">Total Downtime</div>
            <div className="text-xl font-bold text-rose-400 mt-1">
              {totalDowntime}m
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {downtimeLog.length} incidents logged
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800 font-mono">
            <div className="text-[11px] text-slate-400">Scrap / Defect Rate</div>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {totalScrap} ({((totalScrap / totalProduced) * 100).toFixed(2)}%)
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              FPY: 98.4%
            </div>
          </div>
        </div>

        {/* Station Performance Quick Grid */}
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
            Station Pacing & Bottleneck Status
          </h3>
          <div className="border border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Station</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3 text-right">Cycle Time</th>
                  <th className="py-2 px-3 text-right">OEE</th>
                  <th className="py-2 px-3 text-right">Scrap</th>
                  <th className="py-2 px-3 text-right">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stations.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="py-2 px-3 font-bold text-blue-400">{s.code}</td>
                    <td className="py-2 px-3 font-sans text-slate-200">{s.name}</td>
                    <td className={`py-2 px-3 text-right font-bold ${
                      s.cycleTime > 18.0 ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {s.cycleTime.toFixed(1)}s {s.cycleTime > 18.0 && '(Bottleneck)'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{s.oee.toFixed(1)}%</td>
                    <td className="py-2 px-3 text-right text-rose-400">{s.scrapCount}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{s.operator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Critical Open Action Items */}
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
            Pending Action Items for Next Shift ({openActions.length})
          </h3>
          <div className="space-y-2">
            {openActions.slice(0, 3).map((a) => (
              <div key={a.id} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs">
                <div className="flex items-center justify-between font-mono">
                  <span className="font-semibold text-white">{a.title} ({a.stationCode})</span>
                  <span className="text-amber-400">{a.priority} Priority · Due {a.dueDate}</span>
                </div>
                <div className="text-slate-400 mt-1 line-clamp-1">{a.countermeasure}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Handover Remarks Editor */}
        <div className="mt-5">
          <label className="block text-xs font-mono text-slate-300 font-semibold mb-1.5">
            Incoming Shift Handover Notes (Supervisor & IE Signoff)
          </label>
          <textarea
            rows={3}
            value={handoverNotes}
            onChange={(e) => setHandoverNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-sans text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Handover</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Sign & Acknowledge Handover
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
