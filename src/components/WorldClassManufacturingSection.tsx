/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  Award,
  ShieldCheck,
  TrendingUp,
  Target,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  Wrench,
  Users,
  Clock,
  Sparkles,
  Download,
  Check,
  FileSpreadsheet,
  Activity,
  ArrowRight,
  Settings
} from 'lucide-react';
import { LineEntry, UserProfile } from '../types';

interface WorldClassManufacturingSectionProps {
  lines?: LineEntry[];
  profile?: UserProfile;
  onNavigateToTool?: (toolId: string) => void;
}

interface WcmPillar {
  id: string;
  name: string;
  description: string;
  targetScore: number;
  currentScore: number;
  leader: string;
  status: 'world-class' | 'gold' | 'silver' | 'bronze';
  keyInitiative: string;
}

export const WorldClassManufacturingSection: React.FC<WorldClassManufacturingSectionProps> = ({
  lines = [],
  profile,
  onNavigateToTool
}) => {
  const [pillars, setPillars] = useState<WcmPillar[]>([
    {
      id: 'safety',
      name: '1. Safety & Ergonomics',
      description: 'Zero accidents, ILO garment workstation posture standards, needle guard compliance.',
      targetScore: 95,
      currentScore: 94,
      leader: 'EHS & Compliance Wing',
      status: 'gold',
      keyInitiative: 'Ergonomic foot pedals & anti-vibration sewing benches across all 34 lines'
    },
    {
      id: 'cost',
      name: '2. Cost Deployment',
      description: 'Systematic eradication of hidden factory costs, overtime waste, and yarn/fabric scrap.',
      targetScore: 90,
      currentScore: 82,
      leader: 'Sr. Industrial Engineering',
      status: 'gold',
      keyInitiative: 'Standard minute value (SMV) calibration & micro-loss tracking'
    },
    {
      id: 'focused_improvement',
      name: '3. Focused Improvement (Kaizen)',
      description: 'Eliminating chronic sewing bottlenecks, 8 wastes (DOWNTIME), and operator idle cycles.',
      targetScore: 92,
      currentScore: 86,
      leader: 'Lean & Continuous Improvement',
      status: 'world-class',
      keyInitiative: 'Weekly 13 Lean Kaizen sprints with rapid shop floor countermeasure sign-offs'
    },
    {
      id: 'autonomous_maintenance',
      name: '4. Autonomous Maintenance',
      description: 'Operator-led cleaning, lubrication, needle inspections, and daily pre-shift checksheets.',
      targetScore: 90,
      currentScore: 78,
      leader: 'Sewing Supervisors & Line IEs',
      status: 'silver',
      keyInitiative: 'Autonomous Centerline audits & visual oil-gauge lubrication markers'
    },
    {
      id: 'workplace_org',
      name: '5. Workplace Organization (5S)',
      description: 'Sort, Set in order, Shine, Standardize, Sustain across sewing floor lines and cutting bays.',
      targetScore: 95,
      currentScore: 89,
      leader: 'Factory Floor Management',
      status: 'gold',
      keyInitiative: 'Standardized floor line color tapes, shadow boards for mechanic tools'
    },
    {
      id: 'professional_maintenance',
      name: '6. Professional Maintenance',
      description: 'Planned preventive maintenance (PM) schedules, motor MTBF/MTTR tracking, spare parts flow.',
      targetScore: 92,
      currentScore: 81,
      leader: 'Mechanical & Electrical Team',
      status: 'gold',
      keyInitiative: 'Predictive servo-motor thermal checks and computerized spare-parts inventory'
    },
    {
      id: 'quality_control',
      name: '7. Quality Control & Zero Defects',
      description: 'Built-in quality at the workstation, Poka-Yoke error proofing, first-time-right (FTR) > 98%.',
      targetScore: 95,
      currentScore: 84,
      leader: 'Quality Assurance (QA) Wing',
      status: 'gold',
      keyInitiative: 'In-line end-of-line tablet DHU logging with instant audio alert thresholds'
    },
    {
      id: 'logistics',
      name: '8. Logistics & Customer Flow',
      description: 'Just-in-Time cut-piece delivery, Kanban bin replenishment, bundle WIP minimization.',
      targetScore: 90,
      currentScore: 76,
      leader: 'Production Planning & Control (PPC)',
      status: 'silver',
      keyInitiative: 'Synchronized hourly pitch trolley flow from cutting table to front-line loaders'
    },
    {
      id: 'early_equipment',
      name: '9. Early Product & Style Setup',
      description: 'Fast pre-production style pilots, SMED changeover checklists, 3-day learning curves.',
      targetScore: 88,
      currentScore: 79,
      leader: 'Technical Sample Room & IE',
      status: 'silver',
      keyInitiative: 'Pre-balanced pilot workstation templates loaded directly into IE Simulator'
    },
    {
      id: 'people_dev',
      name: '10. People Development',
      description: 'Multiskilling training matrix, IE operator certifications, morning huddle communications.',
      targetScore: 95,
      currentScore: 85,
      leader: 'HR & Training Academy',
      status: 'world-class',
      keyInitiative: 'Skill matrix multiskill cross-training for floaters & high-speed collar stitchers'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'pillars' | 'benchmarks' | 'compliance'>('pillars');
  const [editingPillarId, setEditingPillarId] = useState<string | null>(null);

  // Overall WCM Score calculation
  const totalScore = Math.round(
    pillars.reduce((acc, p) => acc + p.currentScore, 0) / pillars.length
  );

  const getStatusBadge = (score: number) => {
    if (score >= 85) {
      return { label: 'World-Class', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
    if (score >= 75) {
      return { label: 'Gold Level', bg: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
    if (score >= 65) {
      return { label: 'Silver Level', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
    return { label: 'Bronze Level', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
  };

  const currentLevel = getStatusBadge(totalScore);

  const handleScoreUpdate = (id: string, newScore: number) => {
    setPillars(prev =>
      prev.map(p => {
        if (p.id === id) {
          const clamped = Math.max(0, Math.min(100, newScore));
          let status: WcmPillar['status'] = 'bronze';
          if (clamped >= 85) status = 'world-class';
          else if (clamped >= 75) status = 'gold';
          else if (clamped >= 65) status = 'silver';
          return { ...p, currentScore: clamped, status };
        }
        return p;
      })
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Header Card */}
      <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#176f78] to-[#0d4b52] text-white flex items-center justify-center shadow-xs shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#17343a] font-display">
                  World Class Manufacturing (WCM) & Global Standards
                </h1>
                <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-md font-bold border ${currentLevel.bg}`}>
                  {currentLevel.label} ({totalScore}%)
                </span>
              </div>
              <p className="text-xs text-[#527078] mt-0.5">
                International industrial engineering benchmarks, 10 technical pillars, zero-loss eradication, and HIGG/ISO certifications.
              </p>
            </div>
          </div>

          {/* Quick Sub-Navigation */}
          <div className="flex items-center gap-1 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2] shrink-0 overflow-x-auto">
            <button
              onClick={() => setActiveTab('pillars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'pillars'
                  ? 'bg-[#176f78] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#176f78]'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>10 WCM Pillars</span>
            </button>

            <button
              onClick={() => setActiveTab('benchmarks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'benchmarks'
                  ? 'bg-[#176f78] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#176f78]'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>World Benchmarks</span>
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'compliance'
                  ? 'bg-[#176f78] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#176f78]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Global Accreditations</span>
            </button>

            {onNavigateToTool && (
              <button
                type="button"
                onClick={() => onNavigateToTool('control-center')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap text-slate-600 hover:text-[#176f78] bg-white hover:bg-slate-50 border border-[#d9d2c2]"
                title="Go to Settings"
              >
                <Settings className="w-3.5 h-3.5 text-[#176f78]" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#527078]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">WCM Audit Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#17343a] font-mono-numbers">
              {totalScore}%
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">+3.4% YoY</span>
          </div>
          <div className="text-[10px] text-[#527078] mt-0.5">Target: 85% World Class</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#527078]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Zero-Loss Mandate</span>
            <Target className="w-4 h-4 text-[#176f78]" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#17343a] font-mono-numbers">
              0 / 0 / 0
            </span>
          </div>
          <div className="text-[10px] text-[#527078] mt-0.5">0 Accidents • 0 Defects • 0 Waste</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#527078]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Active Lines in Scope</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-[#17343a] font-mono-numbers">
              34 Lines
            </span>
          </div>
          <div className="text-[10px] text-[#527078] mt-0.5">Across 6 Factory Floors</div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#527078]">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Global Compliance</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono-numbers">
              100% Pass
            </span>
          </div>
          <div className="text-[10px] text-[#527078] mt-0.5">HIGG • ISO 9001 • ILO Posture</div>
        </div>
      </div>

      {/* TAB 1: 10 WCM PILLARS */}
      {activeTab === 'pillars' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#17343a] flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#176f78]" />
                  <span>The 10 World Class Manufacturing (WCM) Technical Pillars</span>
                </h2>
                <p className="text-xs text-[#527078] mt-0.5">
                  Standard WCM methodology applied to industrial apparel engineering and plant operations.
                </p>
              </div>
              <span className="text-[11px] font-bold text-[#176f78] bg-[#176f78]/10 px-2.5 py-1 rounded-lg border border-[#176f78]/25 self-start sm:self-auto">
                Debonair LTD Unit-02 Status
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {pillars.map(pillar => {
                const badge = getStatusBadge(pillar.currentScore);
                const isEditing = editingPillarId === pillar.id;

                return (
                  <div
                    key={pillar.id}
                    className="p-4 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] hover:bg-white hover:border-[#176f78] transition-all group shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#17343a] font-display">
                          {pillar.name}
                        </div>
                        <div className="text-[11px] text-[#527078] mt-0.5">
                          {pillar.description}
                        </div>
                      </div>
                      <span className={`text-[9.5px] uppercase font-mono px-2 py-0.5 rounded font-bold border shrink-0 ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Progress Bar & Score */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[11px] font-semibold text-[#527078]">
                          Compliance Score:
                        </span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-[#17343a]">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={pillar.currentScore}
                                onChange={e => handleScoreUpdate(pillar.id, parseInt(e.target.value, 10) || 0)}
                                className="w-14 px-1.5 py-0.5 text-xs font-mono font-bold border rounded bg-white"
                              />
                              <button
                                onClick={() => setEditingPillarId(null)}
                                className="px-2 py-0.5 text-[10px] bg-[#176f78] text-white rounded font-sans"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingPillarId(pillar.id)}
                              title="Click to calibrate audit score"
                              className="hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{pillar.currentScore}%</span>
                              <span className="text-[10px] text-[#527078] font-normal">
                                (Target: {pillar.targetScore}%)
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#e7e1d5] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            pillar.currentScore >= 85
                              ? 'bg-emerald-600'
                              : pillar.currentScore >= 75
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${pillar.currentScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#e7e1d5] flex items-center justify-between text-[10px] text-[#527078]">
                      <span className="truncate max-w-[200px]">
                        <strong>Focus:</strong> {pillar.keyInitiative}
                      </span>
                      <span className="font-mono text-[9px] bg-white px-1.5 py-0.5 rounded border border-[#d9d2c2]">
                        {pillar.leader}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORLD CLASS IE BENCHMARKS */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-5 shadow-2xs">
            <div className="border-b border-[#e7e1d5] pb-3 mb-4">
              <h2 className="text-sm font-bold text-[#17343a] flex items-center gap-2">
                <Target className="w-4 h-4 text-[#176f78]" />
                <span>World-Class Industrial Engineering Benchmarks vs Plant Actuals</span>
              </h2>
              <p className="text-xs text-[#527078] mt-0.5">
                Standard international metrics established by the World Class Manufacturing Association & Lean Enterprise Institute.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e7e1d5] bg-[#fbfaf6] text-[#527078] font-semibold">
                    <th className="py-2.5 px-3">IE KPI / Operational Metric</th>
                    <th className="py-2.5 px-3">World Class Standard</th>
                    <th className="py-2.5 px-3">Debonair Unit-02 Actual</th>
                    <th className="py-2.5 px-3">Variance / Gap</th>
                    <th className="py-2.5 px-3">WCM Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {[
                    {
                      name: 'Overall Equipment Effectiveness (OEE)',
                      target: '> 85.0%',
                      actual: '78.4%',
                      gap: '-6.6%',
                      rating: 'Gold Level',
                      color: 'text-amber-700 bg-amber-100 border-amber-300'
                    },
                    {
                      name: 'Sewing Line Balancing Efficiency',
                      target: '> 88.0%',
                      actual: '82.6%',
                      gap: '-5.4%',
                      rating: 'Gold Level',
                      color: 'text-amber-700 bg-amber-100 border-amber-300'
                    },
                    {
                      name: 'SMED Style Changeover Duration',
                      target: '< 15 mins',
                      actual: '28.0 mins',
                      gap: '+13.0 mins',
                      rating: 'Silver Level',
                      color: 'text-blue-700 bg-blue-100 border-blue-300'
                    },
                    {
                      name: 'Quality Defect Rate (DHU)',
                      target: '< 1.50%',
                      actual: '2.10%',
                      gap: '+0.60%',
                      rating: 'Gold Level',
                      color: 'text-amber-700 bg-amber-100 border-amber-300'
                    },
                    {
                      name: 'Operator Labor Productivity (PPH)',
                      target: '> 3.20 pcs/hr',
                      actual: '2.85 pcs/hr',
                      gap: '-0.35 pcs/hr',
                      rating: 'Gold Level',
                      color: 'text-amber-700 bg-amber-100 border-amber-300'
                    },
                    {
                      name: 'Workplace 5S Floor Audit Score',
                      target: '> 95.0%',
                      actual: '89.2%',
                      gap: '-5.8%',
                      rating: 'Gold Level',
                      color: 'text-amber-700 bg-amber-100 border-amber-300'
                    },
                    {
                      name: 'Line Machine Availability Rate',
                      target: '> 95.0%',
                      actual: '92.4%',
                      gap: '-2.6%',
                      rating: 'World-Class',
                      color: 'text-emerald-700 bg-emerald-100 border-emerald-300'
                    },
                    {
                      name: 'First-Time-Right (FTR) Inspection',
                      target: '> 98.0%',
                      actual: '96.2%',
                      gap: '-1.8%',
                      rating: 'World-Class',
                      color: 'text-emerald-700 bg-emerald-100 border-emerald-300'
                    }
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#17343a]">{row.name}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700">{row.target}</td>
                      <td className="py-3 px-3 font-mono font-bold text-[#176f78]">{row.actual}</td>
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-600">{row.gap}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.color}`}>
                          {row.rating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL ACCREDITATIONS & COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-5 shadow-2xs">
            <div className="border-b border-[#e7e1d5] pb-3 mb-4">
              <h2 className="text-sm font-bold text-[#17343a] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Global Manufacturing Standards & International Accreditations</span>
              </h2>
              <p className="text-xs text-[#527078] mt-0.5">
                Verified compliance certifications ensuring export readiness for top European and North American buyers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {[
                {
                  code: 'HIGG FEM / FSLM',
                  title: 'Higg Facility Environmental & Social Module',
                  score: '91.4% Verified',
                  status: 'Active Certified',
                  authority: 'Sustainable Apparel Coalition'
                },
                {
                  code: 'ISO 9001:2015',
                  title: 'Quality Management Systems Standard',
                  score: 'Audit Clear',
                  status: 'Valid Thru 2027',
                  authority: 'Bureau Veritas Quality'
                },
                {
                  code: 'ISO 14001:2015',
                  title: 'Environmental Management Systems',
                  score: 'Zero Infractions',
                  status: 'Valid Thru 2027',
                  authority: 'SGS International'
                },
                {
                  code: 'ILO Sewing Ergonomics',
                  title: 'International Labour Org Workstation Posture Code',
                  score: 'Class A Ergonomic',
                  status: '100% Compliant',
                  authority: 'ILO Garment Safety Committee'
                },
                {
                  code: 'WRAP Gold Certificate',
                  title: 'Worldwide Responsible Accredited Production',
                  score: '12 Principles Met',
                  status: 'Gold Certified',
                  authority: 'WRAP Board of Directors'
                },
                {
                  code: 'OEKO-TEX Standard 100',
                  title: 'Chemical Safety & Non-Hazardous Sewing Material',
                  score: 'Zero Toxic Residue',
                  status: 'Pass Certified',
                  authority: 'OEKO-TEX Testing Institute'
                }
              ].map(cert => (
                <div
                  key={cert.code}
                  className="p-3.5 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#176f78] bg-[#176f78]/10 px-2 py-0.5 rounded border border-[#176f78]/25">
                        {cert.code}
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="font-bold text-xs text-[#17343a] mt-2">
                      {cert.title}
                    </div>
                    <div className="text-[10px] text-[#527078] mt-0.5">
                      Authority: {cert.authority}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#e7e1d5] flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-slate-700">{cert.score}</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      {cert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
