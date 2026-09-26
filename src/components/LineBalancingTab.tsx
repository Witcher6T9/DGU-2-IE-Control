import React, { useState } from 'react';
import { 
  Sliders, 
  Flame, 
  CheckCircle, 
  TrendingUp, 
  Cpu, 
  Users, 
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { StationData } from '../types/dcs';

interface LineBalancingTabProps {
  stations: StationData[];
}

export const LineBalancingTab: React.FC<LineBalancingTabProps> = ({
  stations,
}) => {
  // Line parameters
  const taktTime = 18.0;

  // Simulation state for Kaizen proposal on ST-03
  const [st3Reduction, setSt3Reduction] = useState<number>(0); // 0 to 2.5s reduction

  // Calculate actual sum of cycle times and bottleneck
  const currentTotalCycle = stations.reduce((sum, s) => sum + s.cycleTime, 0);
  const actualBottleneck = Math.max(...stations.map((s) => s.cycleTime));
  const currentLbe = ((currentTotalCycle / (stations.length * actualBottleneck)) * 100).toFixed(1);
  const currentBalanceDelay = (100 - parseFloat(currentLbe)).toFixed(1);

  // Simulated metrics with Kaizen
  const simulatedStations = stations.map((s) => {
    if (s.code === 'ST-03') {
      const newCycle = Math.max(16.0, s.cycleTime - st3Reduction);
      return {
        ...s,
        simulatedCycle: newCycle,
        simulatedBreakdown: {
          ...s.breakdownTime,
          waste: Math.max(0.2, s.breakdownTime.waste - st3Reduction * 0.4),
          nonValueAdded: Math.max(2.0, s.breakdownTime.nonValueAdded - st3Reduction * 0.6),
        }
      };
    }
    return { ...s, simulatedCycle: s.cycleTime, simulatedBreakdown: s.breakdownTime };
  });

  const simTotalCycle = simulatedStations.reduce((sum, s) => sum + s.simulatedCycle, 0);
  const simBottleneck = Math.max(...simulatedStations.map((s) => s.simulatedCycle));
  const simLbe = ((simTotalCycle / (simulatedStations.length * simBottleneck)) * 100).toFixed(1);
  const simCapacityShift = Math.floor((8 * 3600 * 0.90) / simBottleneck); // 90% net avail
  const actualCapacityShift = Math.floor((8 * 3600 * 0.90) / actualBottleneck);

  return (
    <div className="space-y-6">
      {/* Header Cards: Line Balance Efficiency (LBE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Line Balance Efficiency (LBE)
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-white">
              {st3Reduction > 0 ? simLbe : currentLbe}%
            </span>
            {st3Reduction > 0 && (
              <span className="text-xs text-emerald-400 font-bold">
                (+{(parseFloat(simLbe) - parseFloat(currentLbe)).toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Target Benchmark: ≥90.0%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Line Takt Time Benchmark
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-blue-400">
              {taktTime.toFixed(1)}s
            </span>
            <span className="text-xs text-slate-400 font-mono">per unit</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            Required for 200 units / net operating hour
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Bottleneck Station
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-amber-400">
              {st3Reduction > 0 ? simBottleneck.toFixed(1) : actualBottleneck.toFixed(1)}s
            </span>
            <span className="text-xs text-slate-400 font-mono">ST-03</span>
          </div>
          <div className="text-xs text-amber-400 font-mono mt-1">
            {simBottleneck > taktTime ? `+${(simBottleneck - taktTime).toFixed(1)}s over Takt` : 'Within Takt standard!'}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Shift Production Capacity
          </div>
          <div className="mt-2 flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-emerald-400">
              {st3Reduction > 0 ? simCapacityShift : actualCapacityShift}
            </span>
            <span className="text-xs text-slate-400 font-mono">units/shift</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-1">
            {st3Reduction > 0 ? `+${simCapacityShift - actualCapacityShift} units unlocked with Kaizen` : 'At 90% OEE baseline'}
          </div>
        </div>
      </div>

      {/* Yamazumi Chart (Stacked Bar of Cycle Time Elements) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              IE Yamazumi Chart · Station Workload Decomposition
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Work element breakdown (Value-Added, Non-Value-Added, Waste) calibrated against 18.0s Takt Time
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-emerald-600" />
              <span>Value-Added (VA)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-amber-600" />
              <span>Non-Value-Added (NVA)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded bg-rose-600" />
              <span>Waste / Dwell</span>
            </div>
          </div>
        </div>

        {/* SVG Yamazumi Chart */}
        <div className="h-72 w-full relative pt-6 pb-2">
          {/* Takt Time Reference Line (18.0s) */}
          <div 
            className="absolute left-10 right-4 border-b-2 border-dashed border-red-500/80 z-20 flex items-center justify-end pr-2"
            style={{ top: '28%' }} // 18s on a 25s scale = (25-18)/25 = 28% from top
          >
            <span className="text-[10px] font-mono text-rose-400 bg-slate-900 px-1 font-bold">
              TAKT TIME LINE: 18.0s
            </span>
          </div>

          <div className="h-full flex items-end justify-around gap-4 pl-10 pr-4">
            {simulatedStations.map((st) => {
              const maxScale = 25.0; // 25s max
              const totalCycle = st.simulatedCycle;
              const isBottleneck = totalCycle > taktTime;
              const vaPct = (st.simulatedBreakdown.valueAdded / maxScale) * 100;
              const nvaPct = (st.simulatedBreakdown.nonValueAdded / maxScale) * 100;
              const wastePct = (st.simulatedBreakdown.waste / maxScale) * 100;

              return (
                <div key={st.id} className="flex-1 flex flex-col items-center h-full justify-end group max-w-[110px]">
                  {/* Total Cycle Time Badge */}
                  <span className={`text-xs font-mono font-bold mb-1.5 ${
                    isBottleneck ? 'text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800' : 'text-slate-200'
                  }`}>
                    {totalCycle.toFixed(1)}s
                  </span>

                  {/* Stacked Bar Container */}
                  <div className="w-full max-w-[56px] bg-slate-800/60 rounded-t-lg overflow-hidden flex flex-col justify-end border border-slate-700/60">
                    {/* Waste (Top) */}
                    <div 
                      style={{ height: `${wastePct * 2.5}px` }} 
                      className="w-full bg-rose-600 hover:bg-rose-500 transition-all flex items-center justify-center text-[9px] font-mono text-white"
                      title={`Waste: ${st.simulatedBreakdown.waste.toFixed(1)}s`}
                    >
                      {st.simulatedBreakdown.waste > 0.6 && `${st.simulatedBreakdown.waste.toFixed(1)}`}
                    </div>

                    {/* Non-Value-Added (Middle) */}
                    <div 
                      style={{ height: `${nvaPct * 2.5}px` }} 
                      className="w-full bg-amber-600 hover:bg-amber-500 transition-all flex items-center justify-center text-[9px] font-mono text-white"
                      title={`Non-Value-Added: ${st.simulatedBreakdown.nonValueAdded.toFixed(1)}s`}
                    >
                      {st.simulatedBreakdown.nonValueAdded > 1.5 && `${st.simulatedBreakdown.nonValueAdded.toFixed(1)}`}
                    </div>

                    {/* Value-Added (Bottom) */}
                    <div 
                      style={{ height: `${vaPct * 2.5}px` }} 
                      className="w-full bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center text-[9px] font-mono text-white font-medium"
                      title={`Value-Added: ${st.simulatedBreakdown.valueAdded.toFixed(1)}s`}
                    >
                      {st.simulatedBreakdown.valueAdded.toFixed(1)}s
                    </div>
                  </div>

                  {/* Station Code & Name */}
                  <div className="text-center mt-2.5">
                    <span className="font-mono text-xs font-bold text-white block">
                      {st.code}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block max-w-[90px] font-sans">
                      {st.name.split(' ')[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Kaizen Rebalancing Simulator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Interactive Kaizen Simulator: ST-03 Bottleneck Trimming
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate installing active chill-plate cooling at Station 03 to eliminate 1.8s dwell waste
              </p>
            </div>
          </div>

          {st3Reduction > 0 && (
            <button
              onClick={() => setSt3Reduction(0)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Baseline</span>
            </button>
          )}
        </div>

        <div className="bg-slate-950/40 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                <span className="text-slate-300">Simulate Cycle Reduction on ST-03 (Cooling Dwell):</span>
                <span className="font-bold text-emerald-400">-{st3Reduction.toFixed(1)}s trimmed</span>
              </div>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.1"
                value={st3Reduction}
                onChange={(e) => setSt3Reduction(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                <span>Baseline (19.4s)</span>
                <span>Target -1.4s (18.0s Takt)</span>
                <span>Optimized -2.5s (16.9s)</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs font-mono border-l border-slate-800 pl-6">
              <div>
                <div className="text-slate-500 text-[10px]">NEW ST-03 CYCLE</div>
                <div className={`text-lg font-bold ${
                  (19.4 - st3Reduction) <= taktTime ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {(19.4 - st3Reduction).toFixed(1)}s
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-[10px]">NEW BALANCING LBE</div>
                <div className="text-lg font-bold text-white">
                  {simLbe}%
                </div>
              </div>

              <div>
                <div className="text-slate-500 text-[10px]">SHIFT GAIN</div>
                <div className="text-lg font-bold text-blue-400">
                  +{simCapacityShift - actualCapacityShift} units
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Operator Workcell Allocation & Standard Work Adherence */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Workcell Line Manpower & Standard Work Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Assigned operators, certified skill tier, and standard work procedure compliance
            </p>
          </div>
          <div className="text-xs font-mono text-emerald-400">
            5 Station Operators + 1 Team Lead Active
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Station</th>
                <th className="py-3 px-4 font-semibold">Station Name</th>
                <th className="py-3 px-4 font-semibold">Assigned Operator</th>
                <th className="py-3 px-3 font-semibold text-center">Skill Tier</th>
                <th className="py-3 px-3 font-semibold text-right">Cycle Time</th>
                <th className="py-3 px-3 font-semibold text-right">Takt Delta</th>
                <th className="py-3 px-3 font-semibold text-center">Standard Work Audit</th>
                <th className="py-3 px-4 font-semibold">IE Standard Work Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {stations.map((st) => {
                const delta = (st.cycleTime - taktTime).toFixed(1);
                const isOver = st.cycleTime > taktTime;

                return (
                  <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-400">{st.code}</td>
                    <td className="py-3 px-4 font-sans text-slate-200">{st.name}</td>
                    <td className="py-3 px-4 font-sans font-medium text-white">{st.operator}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                        Level 3 Certified
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {st.cycleTime.toFixed(1)}s
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${isOver ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {parseFloat(delta) > 0 ? `+${delta}s` : `${delta}s`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> 98.2%
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400 text-xs">
                      {isOver ? (
                        <span className="text-amber-300 font-medium">Bottleneck constraint. Action plan ACT-001 assigned.</span>
                      ) : (
                        'Operating within standard cycle variance ±0.3s.'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
