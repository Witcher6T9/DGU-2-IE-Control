/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, TrendingUp, Info, Table2, BarChart2 } from 'lucide-react';
import { SMVWeight, StyleNature } from '../types';
import { STYLE_PROGRESSION_MATRIX } from '../data/learningCurveMatrix';

interface StyleProgressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSMVWeight?: SMVWeight;
  activeStyleNature?: StyleNature;
}

export const StyleProgressionModal: React.FC<StyleProgressionModalProps> = ({
  isOpen,
  onClose,
  activeSMVWeight = 'light',
  activeStyleNature = 'new'
}) => {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'interactive'>('side-by-side');
  const [selectedNature, setSelectedNature] = useState<StyleNature>(activeStyleNature);
  const [selectedWeight, setSelectedWeight] = useState<SMVWeight>(activeSMVWeight);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentCurve = STYLE_PROGRESSION_MATRIX[selectedNature][selectedWeight];
  const day1Eff = currentCurve[0];
  const day6Eff = currentCurve[5];
  const day20Eff = currentCurve[19];
  const day40Eff = currentCurve[39];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[#e7e1d5] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                  Style Progression Chart
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                  Standard 40-Day Matrix
                </span>
              </div>
              <p className="text-xs text-[#527078]">
                Garment manufacturing learning curve ramp-up targets across 40 production days (New vs Repeat Styles)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-[#f1eee6] p-0.5 rounded-xl border border-[#d9d2c2]">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'side-by-side'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Full Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('interactive')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'interactive'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Curve Visualizer</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Controls Bar (when in interactive mode) */}
        {viewMode === 'interactive' && (
          <div className="px-6 py-3 bg-[#f1eee6]/80 border-b border-[#e7e1d5] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-[#527078]">Style Nature:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d9d2c2]">
                <button
                  type="button"
                  onClick={() => setSelectedNature('new')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedNature === 'new'
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  New Style
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedNature('repeat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedNature === 'repeat'
                      ? 'bg-[#8c531b] text-white shadow-xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  Repeat Style (Within 3 Months)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase text-[#527078]">SMV Weight:</span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#d9d2c2]">
                <button
                  type="button"
                  onClick={() => setSelectedWeight('light')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeight === 'light'
                      ? 'bg-[#17343a] text-white shadow-xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  Light (0–30 Min)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeight('medium')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeight === 'medium'
                      ? 'bg-[#17343a] text-white shadow-xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  Medium (31–60 Min)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeight('heavy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeight === 'heavy'
                      ? 'bg-[#17343a] text-white shadow-xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  Heavy (61–&gt;61 Min)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {viewMode === 'side-by-side' ? (
            /* EXACT EXCEL SIDE-BY-SIDE VIEW MATCHING USER'S IMAGE */
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-2xl border border-[#d9d2c2] bg-white shadow-sm">
                <table className="w-full text-center text-xs border-collapse">
                  <thead>
                    {/* Top Group Headers */}
                    <tr>
                      <th
                        colSpan={4}
                        className="py-3 px-2 bg-[#f8d7c2] border-b border-r border-[#d9c1b3] text-[#783c18] font-bold text-sm tracking-wide uppercase"
                      >
                        New Style
                      </th>
                      <th
                        colSpan={4}
                        className="py-3 px-2 bg-[#f8d7c2] border-b border-[#d9c1b3] text-[#783c18] font-bold text-sm tracking-wide uppercase"
                      >
                        Repeat Style
                        <span className="block text-[11px] font-normal normal-case text-[#8c531b]">
                          (Within 3 Month in the same line)
                        </span>
                      </th>
                    </tr>
                    {/* Sub Headers for Weight Brackets */}
                    <tr className="bg-[#faecd9] text-[11px] font-bold text-[#5c3818] border-b border-[#d9c1b3]">
                      {/* New Style Columns */}
                      <th className="py-2.5 px-3 border-r border-[#e7d8cb] w-20">Day</th>
                      <th className="py-2.5 px-3 border-r border-[#e7d8cb]">
                        <div>Light</div>
                        <div className="text-[10px] font-mono-numbers font-normal text-[#8c531b]">0 - 30 Min</div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-[#e7d8cb]">
                        <div>Medium</div>
                        <div className="text-[10px] font-mono-numbers font-normal text-[#8c531b]">31 - 60 Min</div>
                      </th>
                      <th className="py-2.5 px-3 border-r-2 border-[#c2aa9a]">
                        <div>Heavy</div>
                        <div className="text-[10px] font-mono-numbers font-normal text-[#8c531b]">61 - &gt;61 Min</div>
                      </th>

                      {/* Repeat Style Columns */}
                      <th className="py-2.5 px-3 border-r border-[#e7d8cb] w-20">Day</th>
                      <th className="py-2.5 px-3 border-r border-[#e7d8cb]">
                        <div>Light</div>
                        <div className="text-[10px] font-mono-numbers font-normal text-[#8c531b]">0 - 30 Min</div>
                      </th>
                      <th className="py-2.5 px-3 border-r border-[#e7d8cb]">
                        <div>Medium</div>
                        <div className="text-[10px] font-mono-numbers font-normal text-[#8c531b]">31 - 60 Min</div>
                      </th>
                      <th className="py-2.5 px-3">
                        <div>Heavy</div>
                        <div className="text-[10px] font-mono-numbers font-normal text-[#8c531b]">61 - &gt;61 Min</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7e1d5] font-mono-numbers text-[12px]">
                    {Array.from({ length: 40 }).map((_, index) => {
                      const dayNum = index + 1;
                      const isDay6 = dayNum === 6;
                      const isDay1 = dayNum === 1;

                      // New Style values
                      const nLight = STYLE_PROGRESSION_MATRIX.new.light[index];
                      const nMedium = STYLE_PROGRESSION_MATRIX.new.medium[index];
                      const nHeavy = STYLE_PROGRESSION_MATRIX.new.heavy[index];

                      // Repeat Style values
                      const rLight = STYLE_PROGRESSION_MATRIX.repeat.light[index];
                      const rMedium = STYLE_PROGRESSION_MATRIX.repeat.medium[index];
                      const rHeavy = STYLE_PROGRESSION_MATRIX.repeat.heavy[index];

                      return (
                        <tr
                          key={dayNum}
                          className={`transition-colors hover:bg-[#fff9f2] ${
                            isDay6
                              ? 'bg-amber-100/50 font-bold'
                              : isDay1
                              ? 'bg-teal-50/40 font-bold'
                              : index % 2 === 0
                              ? 'bg-white'
                              : 'bg-[#fcfbf7]'
                          }`}
                        >
                          {/* New Style Row */}
                          <td className="py-2 px-3 border-r border-[#e7e1d5] font-sans font-bold text-[#17343a] bg-[#fff5ea]/70">
                            Day - {dayNum}
                          </td>
                          <td className="py-2 px-3 border-r border-[#e7e1d5] text-[#17343a]">
                            {nLight}%
                          </td>
                          <td className="py-2 px-3 border-r border-[#e7e1d5] text-[#17343a]">
                            {nMedium}%
                          </td>
                          <td className="py-2 px-3 border-r-2 border-[#c2aa9a] text-[#17343a]">
                            {nHeavy}%
                          </td>

                          {/* Repeat Style Row */}
                          <td className="py-2 px-3 border-r border-[#e7e1d5] font-sans font-bold text-[#17343a] bg-[#fff5ea]/70">
                            Day - {dayNum}
                          </td>
                          <td className="py-2 px-3 border-r border-[#e7e1d5] text-[#17343a]">
                            {rLight}%
                          </td>
                          <td className="py-2 px-3 border-r border-[#e7e1d5] text-[#17343a]">
                            {rMedium}%
                          </td>
                          <td className="py-2 px-3 text-[#17343a]">
                            {rHeavy}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* SMV Range Table & Official Note (Exactly matching Image footer) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* SMV Range Box */}
                <div className="rounded-xl border border-[#3b82f6]/40 overflow-hidden shadow-2xs max-w-xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#2563eb] text-white font-bold">
                      <tr>
                        <th className="py-2 px-3 border-r border-blue-400">SMV Range</th>
                        <th className="py-2 px-3">SMV</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#eef4ff] text-[#1e3a8a] font-mono-numbers divide-y divide-blue-200">
                      <tr>
                        <td className="py-1.5 px-3 font-sans font-medium border-r border-blue-200">Light weight</td>
                        <td className="py-1.5 px-3 font-bold">0 - 30 Min</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-sans font-medium border-r border-blue-200">Medium weight</td>
                        <td className="py-1.5 px-3 font-bold">31 - 60 Min</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-sans font-medium border-r border-blue-200">Heavy weight</td>
                        <td className="py-1.5 px-3 font-bold">61 - &gt;61 Min</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Official IE Note */}
                <div className="p-3.5 rounded-xl bg-[#fff8e8] border border-[#f5e0b0] text-xs text-[#8c531b] flex items-start gap-2.5">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <div className="space-y-1">
                    <div className="font-bold text-[#5c3818] uppercase tracking-wider text-[11px]">Note : -</div>
                    <p className="text-[12px] leading-relaxed text-[#8c531b]">
                      <strong>01.</strong> If any style input starts again within the 3 months, it will be considered as repeat style.
                    </p>
                    <p className="text-[11px] text-[#527078] pt-1">
                      • Day 6 is the standardized gate efficiency for steady state operations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INTERACTIVE VISUALIZER VIEW */
            <div className="space-y-6">
              {/* Key Milestone Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-[#527078]">Day 1 Launch</span>
                  <div className="font-mono-numbers text-2xl font-black text-[#17343a] mt-0.5">
                    {day1Eff}%
                  </div>
                  <span className="text-[10px] text-[#527078] block">Initial ramp-up start</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] border-l-4 border-l-[#176f78] shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-[#176f78]">Day 6 Gate</span>
                  <div className="font-mono-numbers text-2xl font-black text-[#176f78] mt-0.5">
                    {day6Eff}%
                  </div>
                  <span className="text-[10px] text-[#527078] block">Standard 6-day gate threshold</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-[#527078]">Day 20 Maturation</span>
                  <div className="font-mono-numbers text-2xl font-black text-[#17343a] mt-0.5">
                    {day20Eff}%
                  </div>
                  <span className="text-[10px] text-[#527078] block">Batch proficiency level</span>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] border-l-4 border-l-emerald-600 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Day 40 Ceiling</span>
                  <div className="font-mono-numbers text-2xl font-black text-emerald-700 mt-0.5">
                    {day40Eff}%
                  </div>
                  <span className="text-[10px] text-[#527078] block">Terminal target efficiency</span>
                </div>
              </div>

              {/* 40-Day Visual Chart Bars */}
              <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-[#17343a] flex items-center gap-2">
                    <span>Efficiency Curve Trend</span>
                    <span className="font-normal text-[#527078]">
                      ({selectedNature === 'new' ? 'New Style' : 'Repeat Style'} • {selectedWeight.toUpperCase()} SMV)
                    </span>
                  </div>
                  {hoveredDay && (
                    <div className="font-mono-numbers font-bold text-xs text-[#176f78]">
                      Day {hoveredDay}: {currentCurve[hoveredDay - 1]}% Target
                    </div>
                  )}
                </div>

                <div className="h-44 w-full flex items-end justify-between gap-1 pt-4 pb-1">
                  {currentCurve.map((eff, index) => {
                    const dayNum = index + 1;
                    const heightPct = Math.min(100, Math.max(12, (eff / 100) * 100));
                    const isDay6 = dayNum === 6;
                    const isHovered = hoveredDay === dayNum;

                    return (
                      <div
                        key={dayNum}
                        onMouseEnter={() => setHoveredDay(dayNum)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-xs transition-all ${
                            isHovered
                              ? 'bg-[#17343a]'
                              : isDay6
                              ? 'bg-amber-500 ring-2 ring-amber-300'
                              : dayNum <= 6
                              ? 'bg-[#176f78]'
                              : 'bg-[#95b8bc]'
                          }`}
                        />
                        {dayNum % 5 === 0 && (
                          <span className="text-[8px] font-mono-numbers text-[#527078] mt-1">
                            {dayNum}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#527078] pt-1 border-t border-[#e7e1d5]">
                  <span>Day 1</span>
                  <span className="font-bold text-amber-700">Day 6 (Standard Ramp Gate)</span>
                  <span>Day 20</span>
                  <span>Day 40 (70% Max Target)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e7e1d5] bg-white flex items-center justify-between">
          <div className="text-xs text-[#527078]">
            Ref: <strong className="text-[#17343a]">Debonair Unit-2 Industrial Engineering Standards</strong> • Style Progression Matrix
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-xs"
          >
            Close Chart
          </button>
        </div>
      </div>
    </div>
  );
};
