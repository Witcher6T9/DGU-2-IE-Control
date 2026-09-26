import React, { useState } from 'react';
import { 
  TrendingDown, 
  AlertTriangle, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  Wrench, 
  Activity,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { DowntimeIncident, LossCategory } from '../types/dcs';

interface LossParetoTabProps {
  downtimeLog: DowntimeIncident[];
  onOpenNewDowntime: () => void;
}

export const LossParetoTab: React.FC<LossParetoTabProps> = ({
  downtimeLog,
  onOpenNewDowntime,
}) => {
  const [stationFilter, setStationFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Group losses by category for Pareto
  const categories: LossCategory[] = [
    'Equipment Breakdown',
    'Setup & Adjustments',
    'Idling & Minor Stops',
    'Reduced Speed',
    'Process Defects / Rework',
    'Startup & Material Starvation',
  ];

  // Calculate totals per category
  const categoryTotals = categories.map((cat) => {
    const incidents = downtimeLog.filter((d) => d.category === cat);
    const totalMins = incidents.reduce((sum, d) => sum + d.durationMinutes, 0);
    const count = incidents.length;
    return { category: cat, minutes: totalMins, count };
  });

  // Sort descending for Pareto
  const sortedPareto = [...categoryTotals].sort((a, b) => b.minutes - a.minutes);
  const totalDowntimeMinutes = sortedPareto.reduce((sum, p) => sum + p.minutes, 0) || 1;

  // Compute cumulative percentages
  let runningSum = 0;
  const paretoWithCumulative = sortedPareto.map((item) => {
    runningSum += item.minutes;
    const cumulativePct = Math.round((runningSum / totalDowntimeMinutes) * 100);
    return { ...item, cumulativePct };
  });

  // Filtered downtime incidents
  const filteredIncidents = downtimeLog.filter((item) => {
    const matchesStation = stationFilter === 'ALL' || item.stationCode === stationFilter;
    const matchesCat = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesSearch = 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reportedBy.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStation && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              Loss Analysis & Pareto Elimination (IE Six Big Losses)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative Shift Downtime: <strong className="text-white font-mono">{totalDowntimeMinutes} minutes</strong> across {downtimeLog.length} recorded events
            </p>
          </div>

          <button
            onClick={onOpenNewDowntime}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Downtime Incident</span>
          </button>
        </div>

        {/* Pareto Chart Visualizer (SVG) */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs mb-2 font-mono">
            <span className="text-slate-400">Duration in Minutes (Bars)</span>
            <span className="text-blue-400 font-medium">Cumulative % Curve (Line)</span>
          </div>

          <div className="h-60 w-full relative">
            {/* 80% Pareto Reference Line */}
            <div 
              className="absolute left-12 right-12 border-b border-dashed border-rose-500/60 z-10 flex items-center justify-end pr-2"
              style={{ top: '20%' }}
            >
              <span className="text-[10px] font-mono text-rose-400 bg-slate-900 px-1 font-bold">
                80% VITAL FEW THRESHOLD
              </span>
            </div>

            {/* SVG Canvas for Bar + Line overlay */}
            <div className="h-full flex items-end justify-between gap-2 sm:gap-4 pl-8 pr-8 pb-8">
              {paretoWithCumulative.map((item, index) => {
                const maxMins = sortedPareto[0]?.minutes || 15;
                const barHeightPct = Math.max(8, (item.minutes / maxMins) * 75);

                return (
                  <div key={item.category} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 border border-slate-700 text-[10px] font-mono text-white px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap pointer-events-none">
                      {item.minutes}m ({item.cumulativePct}% cum.)
                    </div>

                    {/* Cumulative % Badge */}
                    <span className="text-[10px] font-mono text-blue-400 font-bold mb-1">
                      {item.cumulativePct}%
                    </span>

                    {/* Bar */}
                    <div className="w-full max-w-[54px] bg-slate-800/80 rounded-t-lg overflow-hidden flex flex-col justify-end">
                      <div
                        style={{ height: `${barHeightPct}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          index === 0
                            ? 'bg-rose-500 group-hover:bg-rose-400'
                            : index === 1
                            ? 'bg-amber-500 group-hover:bg-amber-400'
                            : 'bg-blue-500/80 group-hover:bg-blue-400'
                        }`}
                      />
                    </div>

                    {/* Mins label */}
                    <span className="text-[11px] font-mono text-white font-bold mt-1">
                      {item.minutes}m
                    </span>

                    {/* X Axis Name */}
                    <div className="text-[10px] text-slate-400 text-center truncate max-w-[80px] mt-1 font-sans">
                      {item.category.split(' ')[0]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Six Big Losses Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {paretoWithCumulative.map((item) => (
          <div key={item.category} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
            <div className="text-[11px] font-medium text-slate-400 truncate" title={item.category}>
              {item.category}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5 font-mono">
              <span className="text-xl font-bold text-white">{item.minutes}</span>
              <span className="text-xs text-slate-500">mins</span>
            </div>
            <div className="mt-1 text-[10px] font-mono text-slate-400">
              {item.count} incident{item.count === 1 ? '' : 's'} ({Math.round((item.minutes / totalDowntimeMinutes) * 100)}%)
            </div>
          </div>
        ))}
      </div>

      {/* Incident Log Table with Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Downtime Incidents ({filteredIncidents.length})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search root cause, notes..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Station Filter */}
            <select
              value={stationFilter}
              onChange={(e) => setStationFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Stations</option>
              <option value="ST-01">ST-01 Infeed</option>
              <option value="ST-02">ST-02 Robotic Fastening</option>
              <option value="ST-03">ST-03 Ultrasonic Seal</option>
              <option value="ST-04">ST-04 AOI & Testing</option>
              <option value="ST-05">ST-05 Packaging</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-sans text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Loss Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-3 font-semibold">Station</th>
                <th className="py-3 px-3 font-semibold">Loss Category</th>
                <th className="py-3 px-3 font-semibold text-center">Duration</th>
                <th className="py-3 px-4 font-semibold">Problem Description</th>
                <th className="py-3 px-4 font-semibold">Root Cause Identification</th>
                <th className="py-3 px-4 font-semibold">Action / Countermeasure</th>
                <th className="py-3 px-3 font-semibold text-right">Reported By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No downtime incidents match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-800/30 transition-colors font-sans">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{inc.timestamp}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 text-xs font-semibold">
                        {inc.stationCode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-medium">
                      {inc.category}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-400">
                        {inc.durationMinutes} min
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 font-normal max-w-xs">
                      {inc.description}
                    </td>
                    <td className="py-3 px-4 text-amber-300/90 text-xs font-mono max-w-xs">
                      {inc.rootCause}
                    </td>
                    <td className="py-3 px-4 text-emerald-300/90 text-xs max-w-xs">
                      {inc.actionTaken}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 text-xs">
                      {inc.reportedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
