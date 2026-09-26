import React from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  UserCheck, 
  PlusCircle, 
  ChevronRight,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { StationData, HourlyOutput, DowntimeIncident } from '../types/dcs';

interface OverviewTabProps {
  stations: StationData[];
  hourlyData: HourlyOutput[];
  downtimeLog: DowntimeIncident[];
  onSelectStation: (station: StationData) => void;
  onOpenNewDowntime: () => void;
  onOpenNewAction: () => void;
  onNavigateTab: (tab: 'hourly' | 'loss_pareto' | 'balancing' | 'actions' | 'audits') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  stations,
  hourlyData,
  downtimeLog,
  onSelectStation,
  onOpenNewDowntime,
  onOpenNewAction,
  onNavigateTab,
}) => {
  // Aggregate KPIs
  const totalProduced = stations[stations.length - 1]?.unitsProduced || 1202;
  const targetShiftTotal = 1600;
  const progressPercent = Math.min(100, Math.round((totalProduced / targetShiftTotal) * 100));

  // Average OEE across stations
  const avgOee = (stations.reduce((acc, s) => acc + s.oee, 0) / stations.length).toFixed(1);
  const avgAvail = (stations.reduce((acc, s) => acc + s.availability, 0) / stations.length).toFixed(1);
  const avgPerf = (stations.reduce((acc, s) => acc + s.performance, 0) / stations.length).toFixed(1);
  const avgQual = (stations.reduce((acc, s) => acc + s.quality, 0) / stations.length).toFixed(1);

  // Total scrap across stations
  const totalScrap = stations.reduce((acc, s) => acc + s.scrapCount, 0);
  const scrapRate = ((totalScrap / (totalProduced + totalScrap)) * 100).toFixed(2);

  // Bottleneck Station (highest cycle time)
  const bottleneckStation = [...stations].sort((a, b) => b.cycleTime - a.cycleTime)[0];

  // Total downtime minutes logged
  const totalDowntime = downtimeLog.reduce((acc, d) => acc + d.durationMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Top Industrial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OEE Metric Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Line OEE (DGU-02)
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              Target 85.0%
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {avgOee}%
            </span>
            <span className="text-xs text-slate-400">Net Efficiency</span>
          </div>

          {/* OEE Factors: A x P x Q */}
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Avail (A)</div>
              <div className="font-semibold text-slate-200 mt-0.5">{avgAvail}%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Perf (P)</div>
              <div className="font-semibold text-slate-200 mt-0.5">{avgPerf}%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Qual (Q)</div>
              <div className="font-semibold text-slate-200 mt-0.5">{avgQual}%</div>
            </div>
          </div>
        </div>

        {/* Shift Production Output */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Shift Output / Target
            </span>
            <span className="text-xs font-mono font-medium text-blue-400 bg-blue-950/60 border border-blue-800/80 px-2 py-0.5 rounded">
              Hr 7 of 8
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              {totalProduced.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {targetShiftTotal.toLocaleString()} units</span>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Shift Progress: {progressPercent}%</span>
              <span className="text-amber-400">Forecast: ~1,568 units</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Takt & Bottleneck Pacing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Line Pace & Takt Time
            </span>
            <span className="text-xs font-mono font-medium text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
              Pacing Gap +1.4s
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400 tracking-tight">
              {bottleneckStation?.cycleTime.toFixed(1)}s
            </span>
            <span className="text-xs text-slate-400 font-mono">Takt: 18.0s</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Constraint Station:</span>
            <span className="text-amber-300 font-medium">{bottleneckStation?.code} ({bottleneckStation?.name.split(' ')[0]})</span>
          </div>
        </div>

        {/* Scrap & First Pass Yield */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Scrap & First Pass Yield
            </span>
            <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              FPY: 98.4%
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-rose-400 tracking-tight">
              {totalScrap}
            </span>
            <span className="text-xs text-slate-400 font-mono">Total Scrap ({scrapRate}%)</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Downtime Total:</span>
            <span className="text-slate-200 font-medium">{totalDowntime} mins logged</span>
          </div>
        </div>
      </div>

      {/* DGU-2 Synoptic Line Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Line DGU-02 Synoptic Process Flow
              </h2>
              <span className="text-xs font-mono text-slate-400">
                (Click any station for centerline specs & micro-stop breakdown)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Infeed → Fastening → Ultrasonic Seal (Bottleneck) → Vision & Hi-Pot → Packout
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewDowntime}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Log Downtime</span>
            </button>
            <button
              onClick={onOpenNewAction}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-400" />
              <span>New Action Item</span>
            </button>
          </div>
        </div>

        {/* Stations Diagram Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 relative">
          {stations.map((st, index) => {
            const isBottleneck = st.cycleTime > st.targetCycleTime;
            const cycleDiff = (st.cycleTime - st.targetCycleTime).toFixed(1);

            return (
              <div key={st.id} className="relative group">
                <button
                  onClick={() => onSelectStation(st)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between h-full ${
                    isBottleneck
                      ? 'bg-amber-950/20 border-amber-800/80 hover:border-amber-600 hover:bg-amber-950/30'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {/* Top Badge & Code */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-blue-300">
                        {st.code}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        RUN
                      </span>
                    </div>

                    <h3 className="text-xs font-semibold text-white line-clamp-2 min-h-[32px]">
                      {st.name}
                    </h3>
                  </div>

                  {/* Bottleneck indicator */}
                  {isBottleneck && (
                    <div className="mt-2 text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 rounded px-1.5 py-0.5 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>BOTTLENECK (+{cycleDiff}s)</span>
                    </div>
                  )}

                  {/* Metrics */}
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Cycle Time:</span>
                      <span className={`font-bold ${isBottleneck ? 'text-amber-400' : 'text-slate-200'}`}>
                        {st.cycleTime.toFixed(1)}s
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Station OEE:</span>
                      <span className="text-slate-200">{st.oee.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Produced:</span>
                      <span className="text-slate-200">{st.unitsProduced}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Scrap:</span>
                      <span className={st.scrapCount > 20 ? 'text-rose-400' : 'text-slate-400'}>
                        {st.scrapCount}
                      </span>
                    </div>
                  </div>

                  {/* Operator footer */}
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{st.operator}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  </div>
                </button>

                {/* Arrow connector between stations on desktop */}
                {index < stations.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-400">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Lower Dual Grid: Hourly Pacing Run Chart Preview & Active Daily Control Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hourly Output Quick Preview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Shift Hourly Pacing (UPH)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target: 200 units/hour · Actuals vs Target
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('hourly')}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
            >
              <span>Full Hourly Log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mini Bar Chart */}
          <div className="space-y-2 font-mono text-xs">
            {hourlyData.slice(0, 7).map((hr) => {
              const pct = Math.min(100, Math.round((hr.actualUnits / hr.targetUnits) * 100));
              const isShort = hr.actualUnits < hr.targetUnits && hr.actualUnits > 0;
              const isOver = hr.actualUnits >= hr.targetUnits;

              return (
                <div key={hr.hourIndex} className="flex items-center gap-2">
                  <span className="w-12 text-slate-400 text-[11px] shrink-0">H{hr.hourIndex}</span>
                  <div className="flex-1 bg-slate-800/80 h-5 rounded overflow-hidden relative">
                    <div
                      className={`h-full rounded transition-all duration-300 ${
                        isOver ? 'bg-emerald-500' : isShort ? 'bg-amber-500' : 'bg-slate-700'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-white">
                      <span>{hr.timeSlot.split(' - ')[0]}</span>
                      <span className="font-bold">{hr.actualUnits} / {hr.targetUnits}</span>
                    </div>
                  </div>
                  <span className={`w-14 text-right text-[11px] font-bold ${
                    hr.delta > 0 ? 'text-emerald-400' : hr.delta < 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {hr.delta > 0 ? `+${hr.delta}` : hr.delta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Downtime Incidents & Bottleneck Countermeasure */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                  Recent Stoppages & Micro-Losses
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shift 1 recorded incidents · Total {totalDowntime} mins
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('loss_pareto')}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>Pareto Breakdown</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {downtimeLog.slice(0, 4).map((dt) => (
                <div 
                  key={dt.id} 
                  className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400">{dt.timestamp}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700 text-[10px]">
                        {dt.stationCode}
                      </span>
                      <span className="text-slate-300 font-sans">{dt.category}</span>
                    </div>
                    <span className="font-bold text-rose-400">{dt.durationMinutes} min</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                    {dt.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* IE Quick Bottleneck Callout */}
          <div className="mt-4 p-3 rounded-lg bg-blue-950/30 border border-blue-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <strong className="text-blue-300 font-semibold">IE Daily Focus Item: </strong>
              <span className="text-slate-300">
                Line balance efficiency is 91.8%. Station ST-03 (Ultrasonic Seal) pacing at 19.4s is the line constraint. Action item ACT-001 active to trim 1.5s cooling dwell.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
