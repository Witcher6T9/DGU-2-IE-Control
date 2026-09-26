import React, { useState } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Save, 
  X,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { HourlyOutput } from '../types/dcs';

interface HourlyPacingTabProps {
  hourlyData: HourlyOutput[];
  onUpdateHourNotes: (hourIndex: number, notes: string) => void;
  onUpdateHourActuals?: (hourIndex: number, actualUnits: number, scrapUnits: number) => void;
}

export const HourlyPacingTab: React.FC<HourlyPacingTabProps> = ({
  hourlyData,
  onUpdateHourNotes,
  onUpdateHourActuals,
}) => {
  const [editingHour, setEditingHour] = useState<HourlyOutput | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editActual, setEditActual] = useState(0);
  const [editScrap, setEditScrap] = useState(0);

  const handleStartEdit = (hr: HourlyOutput) => {
    setEditingHour(hr);
    setEditNotes(hr.notes || '');
    setEditActual(hr.actualUnits);
    setEditScrap(hr.scrapUnits);
  };

  const handleSaveEdit = () => {
    if (!editingHour) return;
    onUpdateHourNotes(editingHour.hourIndex, editNotes);
    if (onUpdateHourActuals) {
      onUpdateHourActuals(editingHour.hourIndex, editActual, editScrap);
    }
    setEditingHour(null);
  };

  // Aggregates
  const totalActual = hourlyData.reduce((acc, h) => acc + h.actualUnits, 0);
  const totalTarget = hourlyData.reduce((acc, h) => acc + h.targetUnits, 0);
  const totalScrap = hourlyData.reduce((acc, h) => acc + h.scrapUnits, 0);
  const totalDowntime = hourlyData.reduce((acc, h) => acc + h.downtimeMinutes, 0);

  // Active hours count (where actual > 0)
  const activeHours = hourlyData.filter(h => h.actualUnits > 0).length || 1;
  const currentAverageUph = Math.round(totalActual / activeHours);

  // Projected shift total = current actual + (remaining hours * current pace or target)
  const remainingHours = 8 - activeHours;
  const projectedShiftTotal = totalActual + (remainingHours * 190);

  return (
    <div className="space-y-6">
      {/* Pacing Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Cumulative Production
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {totalActual.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">/ 1,600 Target</span>
          </div>
          <div className="text-xs text-amber-400 font-mono mt-1">
            Current Delta: {totalActual - 1400} units vs Hr 7 plan
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Shift Run-Rate Velocity
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400">
              {currentAverageUph}
            </span>
            <span className="text-xs font-mono text-slate-400">UPH (Units / Hr)</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Standard Line Pitch: 200 UPH
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Shift End Forecast
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-blue-400">
              {projectedShiftTotal.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-slate-400">Projected Units</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Recovery Plan required for -32 units
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Micro-Stops Recorded
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-rose-400">
              {totalDowntime}
            </span>
            <span className="text-xs font-mono text-slate-400">Total Minutes</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {totalScrap} defect parts segregated
          </div>
        </div>
      </div>

      {/* Visual Hourly Chart: Bar of Actual vs Planned Line */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Hourly Output Distribution & Line Pacing Chart
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Green = Exceeded 200 UPH target · Amber = Below target · Grey = Scheduled / Upcoming
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span>Above Target (≥200)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-amber-500" />
              <span>Below Target (&lt;200)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-4 h-0.5 bg-blue-400" />
              <span>Target Benchmark (200)</span>
            </div>
          </div>
        </div>

        {/* SVG Visualization */}
        <div className="h-64 w-full relative pt-6 pb-2">
          {/* 200 Unit Target Guideline */}
          <div 
            className="absolute left-10 right-4 border-b-2 border-dashed border-blue-400/60 z-10 flex items-center justify-end pr-2"
            style={{ top: '25%' }}
          >
            <span className="text-[10px] font-mono text-blue-400 bg-slate-900 px-1 font-bold">
              TARGET 200 UPH
            </span>
          </div>

          <div className="h-full flex items-end justify-between gap-3 pl-10 pr-4">
            {hourlyData.map((hr) => {
              const maxScale = 240;
              const heightPct = Math.min(100, (hr.actualUnits / maxScale) * 100);
              const isOver = hr.actualUnits >= hr.targetUnits;
              const isUnder = hr.actualUnits < hr.targetUnits && hr.actualUnits > 0;
              const isUpcoming = hr.actualUnits === 0;

              return (
                <div key={hr.hourIndex} className="flex-1 flex flex-col items-center h-full justify-end group">
                  {/* Bar value badge */}
                  <span className={`text-[11px] font-mono font-bold mb-1 transition-opacity ${
                    isOver ? 'text-emerald-400' : isUnder ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {hr.actualUnits > 0 ? hr.actualUnits : '—'}
                  </span>

                  {/* Bar */}
                  <div className="w-full max-w-[48px] bg-slate-800/80 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isOver
                          ? 'bg-emerald-500 group-hover:bg-emerald-400'
                          : isUnder
                          ? 'bg-amber-500 group-hover:bg-amber-400'
                          : 'bg-slate-700/40'
                      }`}
                    />
                  </div>

                  {/* X Axis Label */}
                  <div className="text-center mt-2">
                    <div className="text-xs font-mono font-semibold text-slate-300">H{hr.hourIndex}</div>
                    <div className="text-[10px] font-mono text-slate-500 truncate max-w-[55px]">
                      {hr.timeSlot.split(' - ')[0]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detailed Hourly Production Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Shift Pitch Board · Hourly Production & Loss Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click edit on any hour to update actuals, scrap count, or IE shift notes
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Hour</th>
                <th className="py-3 px-3 font-semibold">Time Slot</th>
                <th className="py-3 px-3 font-semibold text-right">Target</th>
                <th className="py-3 px-3 font-semibold text-right">Actual</th>
                <th className="py-3 px-3 font-semibold text-right">Scrap</th>
                <th className="py-3 px-3 font-semibold text-right">Delta</th>
                <th className="py-3 px-3 font-semibold text-right">Cum. Actual</th>
                <th className="py-3 px-3 font-semibold text-center">Stop Mins</th>
                <th className="py-3 px-4 font-semibold">IE Deviation & Problem Notes</th>
                <th className="py-3 px-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {hourlyData.map((hr) => {
                const isUnder = hr.delta < 0 && hr.actualUnits > 0;
                const isOver = hr.delta >= 0 && hr.actualUnits > 0;

                return (
                  <tr key={hr.hourIndex} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">Hour {hr.hourIndex}</td>
                    <td className="py-3 px-3 text-slate-400">{hr.timeSlot}</td>
                    <td className="py-3 px-3 text-right text-slate-400">{hr.targetUnits}</td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      isOver ? 'text-emerald-400' : isUnder ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {hr.actualUnits}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-400">{hr.scrapUnits}</td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      hr.delta > 0 ? 'text-emerald-400' : hr.delta < 0 ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {hr.actualUnits > 0 ? (hr.delta > 0 ? `+${hr.delta}` : hr.delta) : '—'}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300 font-semibold">
                      {hr.cumulativeActual}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {hr.downtimeMinutes > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-400 font-bold">
                          {hr.downtimeMinutes}m
                        </span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                      {hr.notes || <span className="text-slate-600 italic">No remarks recorded</span>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleStartEdit(hr)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Edit hour entry"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Hour Modal */}
      {editingHour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">
                Edit Hour {editingHour.hourIndex} ({editingHour.timeSlot})
              </h3>
              <button
                onClick={() => setEditingHour(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Actual Units Processed
                  </label>
                  <input
                    type="number"
                    value={editActual}
                    onChange={(e) => setEditActual(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Scrapped Parts Count
                  </label>
                  <input
                    type="number"
                    value={editScrap}
                    onChange={(e) => setEditScrap(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  IE Reason for Variance / Micro-Stop Remarks
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Explain line stoppages, feeder jams, tool changes or speed slowdowns..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-sans text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingHour(null)}
                className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
