/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — Industrial Engineering Department
 * Data Page: Centralized IE Org & Multi-Tier RBAC Operations Hub
 */

import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  Sparkles,
  Layers,
  Sliders,
  Clock,
  History,
  LayoutGrid,
  BarChart2,
  PieChart,
  Network,
  ShieldCheck,
  Shield,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Building2,
  Filter,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  X,
  Lock,
  Check,
  CheckSquare,
  RefreshCw,
  Download,
  Eye,
  ArrowRight,
  Activity,
  Zap,
  Gauge
} from 'lucide-react';
import { LineEntry, ChecklistMap, UserProfile, RoleTier, LeanActionItem } from '../types';
import { StationData, HourlyOutput, DowntimeIncident } from '../types/dcs';
import { LineData, LineSortCriterion, SortDirection } from './LineData';
import { LineBalancingTab } from './LineBalancingTab';
import { HourlyPacingTab } from './HourlyPacingTab';
import { LossParetoTab } from './LossParetoTab';
import { FloorPlanLineSetup } from './FloorPlanLineSetup';
import { LineProductionHistoryView } from './LineProductionHistoryView';
import { CapacityCalculatorWorkspace } from './CapacityCalculatorWorkspace';
import { AiOptimizationAssistant } from './AiOptimizationAssistant';
import { ActiveOperationalTiers } from './ActiveOperationalTiers';
import {
  groupLinesByIEOrg,
  getLineIEMeta,
  WingGroupData,
  InchargeGroupData,
  LineIEMeta
} from '../utils/ieOrgMapping';
import { checkLineAccess, isMasterAdminOrAdmin, isSystemAdmin, normalizeLineNo } from '../utils/rbac';
import { ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';
import { LineEfficiencySparkline } from './LineEfficiencySparkline';
import { QuickOutputUpdateModal } from './QuickOutputUpdateModal';
import { WingBlockLineSelector, WingId } from './WingBlockLineSelector';

/**
 * Fast export of all lines data with IE Org hierarchy metadata as CSV
 */
export function exportLinesDataCSV(lines: LineEntry[], filename: string = 'Debonair_IE_Data.csv') {
  const headers = [
    'Line No',
    'Buyer',
    'Style',
    'Floor',
    'Wing',
    'Incharge',
    'Line IE',
    'Target Prod (pcs)',
    'Achieved Prod (pcs)',
    'Variance (pcs)',
    'Efficiency %',
    'Planned MP',
    'SMV (min)',
    'Bottleneck Station',
    'Bottleneck Status',
    'Observed CT (s)',
    'Target CT (s)'
  ];

  const rows = lines.map(line => {
    const meta = getLineIEMeta(line.lineNo);
    const variance = (Number(line.achievedProd) || 0) - (Number(line.targetProd) || 0);
    return [
      `"${line.lineNo}"`,
      `"${line.buyer || ''}"`,
      `"${line.style || ''}"`,
      `"${line.floor || ''}"`,
      `"${meta.wing}"`,
      `"${meta.inchargeName}"`,
      `"${meta.lineIEName}"`,
      line.targetProd || 0,
      line.achievedProd || 0,
      variance,
      line.efficiency || 0,
      line.plannedMP || 0,
      line.smv || 0,
      `"${line.bottleneck?.station || ''}"`,
      `"${line.bottleneck?.status || ''}"`,
      line.bottleneck?.cycleTime || 0,
      line.bottleneck?.targetCT || 0
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export type LineDataSubTab =
  | 'lines'
  | 'ie-org'
  | 'optimizer'
  | 'balancing'
  | 'hourly'
  | 'loss-pareto'
  | 'floor-plan'
  | 'history'
  | 'capacity';

export type OrgDataViewMode = 'hierarchy' | 'flat';

interface LineDataPageProps {
  lines: LineEntry[];
  checklists?: ChecklistMap;
  selectedLineNo: string;
  onSelectLineNo: (lineNo: string) => void;
  onSaveLine: (line: LineEntry) => void;
  onAddNewLine?: (customLine?: LineEntry | Partial<LineEntry>) => void;
  onDeleteLine?: (identifier: string | number) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onReorderLines?: (reordered: LineEntry[]) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  profile?: UserProfile;
  roleTiers?: RoleTier[];
  initialSubTab?: LineDataSubTab;
  initialSortBy?: LineSortCriterion;
  initialSortDirection?: SortDirection;
  stations?: StationData[];
  hourlyData?: HourlyOutput[];
  downtimeLog?: DowntimeIncident[];
  onOpenNewDowntime?: () => void;
  onUpdateHourNotes?: (hourIndex: number, notes: string) => void;
  onUpdateHourOutput?: (hourIndex: number, actual: number, scrap: number, downtimeMinutes: number) => void;
  factoryProfile?: any;
  onUpdateFactoryProfile?: (updated: any) => void;
  savedFactories?: any[];
  onSaveFactoryList?: (list: any[]) => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  actions?: LeanActionItem[];
  onUpdateActions?: (actions: LeanActionItem[]) => void;
}

export const LineDataPage: React.FC<LineDataPageProps> = ({
  lines,
  checklists,
  selectedLineNo,
  onSelectLineNo,
  onSaveLine,
  onAddNewLine,
  onDeleteLine,
  onDeleteFloor,
  onReorderLines,
  onNavigate,
  activeDate = '2026-09-24',
  onSelectDate,
  profile,
  roleTiers = DEFAULT_ROLE_TIERS,
  initialSubTab = 'lines',
  initialSortBy = 'lineNo',
  initialSortDirection = 'asc',
  stations = [],
  hourlyData = [],
  downtimeLog = [],
  onOpenNewDowntime = () => {},
  onUpdateHourNotes = () => {},
  factoryProfile,
  onUpdateFactoryProfile,
  savedFactories,
  onSaveFactoryList,
  onOpenDatabase,
  actions = [],
  onUpdateActions = () => {}
}) => {
  const [subTab, setSubTab] = useState<LineDataSubTab>(initialSubTab);
  const [simulatedTierId, setSimulatedTierId] = useState<string>(profile?.tierId || 'tier_1');

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWingFilter, setSelectedWingFilter] = useState<WingId>('all');
  const [selectedInchargeFilter, setSelectedInchargeFilter] = useState<number | 'all'>('all');
  const [selectedLineFilter, setSelectedLineFilter] = useState<string>('all');
  const [bottlenecksOnly, setBottlenecksOnly] = useState(false);

  // Accordion state for wings and incharge blocks
  const [expandedWings, setExpandedWings] = useState<{ [key: string]: boolean }>({
    'Blue Wing': true,
    'Green Wing': true
  });
  const [expandedIncharges, setExpandedIncharges] = useState<{ [key: number]: boolean }>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true
  });

  // Effective Profile automatically sourced from authenticated profile
  const effectiveProfile: UserProfile = useMemo(() => {
    if (!profile) {
      return {
        id: 'usr_default',
        name: 'IE Operations',
        email: 'ashikur.rahman.0971@gmail.com',
        role: 'admin',
        tierId: 'tier_1',
        assignedUnit: 'Plant #1 (Debonair Unit-02)',
        department: 'Industrial Engineering (IE)',
        assignedLines: ['All Factory Lines'],
        jobTitle: 'Sr. Manager (Head of IE)',
        theme: 'light',
        density: 'normal',
        shift: 'General Shift (8:00 AM - 5:00 PM)'
      };
    }
    return profile;
  }, [profile]);

  // Active Tier automatically resolved from user profile
  const activeRoleTier = useMemo(() => {
    const tierId = effectiveProfile.tierId || 'tier_1';
    return roleTiers.find(t => t.id === tierId) || roleTiers[0];
  }, [roleTiers, effectiveProfile.tierId]);

  // Check if current user has department-wide / full root authority scope
  const isFullScope = useMemo(() => {
    return (
      isSystemAdmin(effectiveProfile) ||
      isMasterAdminOrAdmin(effectiveProfile) ||
      activeRoleTier.scopeType === 'all' ||
      activeRoleTier.level <= 1
    );
  }, [effectiveProfile, activeRoleTier]);

  // Group lines into the Debonair IE Org hierarchy
  const wingGroups = useMemo(() => {
    return groupLinesByIEOrg(lines, activeDate);
  }, [lines, activeDate]);

  // Overall Department Totals calculated automatically for lines within user's active scope
  const departmentTotals = useMemo(() => {
    let target = 0;
    let actual = 0;
    let sumEff = 0;
    let bottlenecks = 0;
    let criticalBottlenecks = 0;

    // Deduplicate lines by lineNo so each physical active line is represented once (preferring activeDate)
    const lineMap = new Map<string, LineEntry>();
    if (activeDate) {
      for (const line of lines) {
        if (line.date === activeDate) {
          lineMap.set(String(line.lineNo).trim(), line);
        }
      }
    }
    for (const line of lines) {
      const key = String(line.lineNo).trim();
      if (!lineMap.has(key)) {
        lineMap.set(key, line);
      }
    }
    const distinctLines = Array.from(lineMap.values());

    const scopedLines = isFullScope
      ? distinctLines
      : distinctLines.filter(l => checkLineAccess(effectiveProfile, roleTiers, l.lineNo).inScope);

    scopedLines.forEach(l => {
      target += Number(l.targetProd) || 0;
      actual += Number(l.achievedProd) || 0;
      sumEff += Number(l.efficiency) || 0;
      if (l.bottleneck && l.bottleneck.station && l.bottleneck.station !== 'No Bottleneck Reported') {
        bottlenecks++;
        if (l.bottleneck.status === 'critical') criticalBottlenecks++;
      }
    });

    const avgEff = scopedLines.length > 0 ? Math.round((sumEff / scopedLines.length) * 10) / 10 : 0;
    return {
      linesCount: scopedLines.length,
      target,
      actual,
      variance: actual - target,
      efficiency: avgEff,
      bottlenecks,
      criticalBottlenecks
    };
  }, [lines, activeDate, isFullScope, effectiveProfile, roleTiers]);

  // Quick Edit Line Modal State
  const [editingLine, setEditingLine] = useState<LineEntry | null>(null);
  const [editForm, setEditForm] = useState<Partial<LineEntry>>({});
  const [quickOutputLine, setQuickOutputLine] = useState<LineEntry | null>(null);

  const handleOpenQuickEdit = (line: LineEntry) => {
    setEditingLine(line);
    setEditForm({
      achievedProd: line.achievedProd,
      targetProd: line.targetProd,
      efficiency: line.efficiency,
      smv: line.smv,
      plannedMP: line.plannedMP,
      bottleneck: line.bottleneck ? { ...line.bottleneck } : undefined
    });
  };

  const handleSaveQuickEdit = () => {
    if (!editingLine) return;
    const updated: LineEntry = {
      ...editingLine,
      ...editForm,
      bottleneck: editForm.bottleneck || editingLine.bottleneck
    };
    onSaveLine(updated);
    setEditingLine(null);
  };

  // Sign-off / Incharge approval state
  const [approvedIncharges, setApprovedIncharges] = useState<{ [key: number]: boolean }>({});
  const handleToggleInchargeApproval = (incNo: number) => {
    setApprovedIncharges(prev => ({
      ...prev,
      [incNo]: !prev[incNo]
    }));
  };

  const toggleWing = (wing: string) => {
    setExpandedWings(prev => ({
      ...prev,
      [wing]: !prev[wing]
    }));
  };

  const toggleIncharge = (incNo: number) => {
    setExpandedIncharges(prev => ({
      ...prev,
      [incNo]: !prev[incNo]
    }));
  };

  // Filter lines based on search query, wing, incharge, bottleneck and automatic RBAC scope
  const filteredWingGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return wingGroups
      .filter((wing: WingGroupData) => {
        if (selectedWingFilter === 'all') return true;
        return wing.wing === selectedWingFilter;
      })
      .map((wing: WingGroupData) => {
        const filteredIncharges = wing.incharges
          .filter((inc: InchargeGroupData) => {
            if (selectedInchargeFilter === 'all') return true;
            return inc.inchargeNo === selectedInchargeFilter;
          })
          .map((inc: InchargeGroupData) => {
            const filteredLines = inc.lines.filter((line: LineEntry) => {
              const meta = getLineIEMeta(line.lineNo);
              const access = checkLineAccess(effectiveProfile, roleTiers, line.lineNo);

              // Automatic Scope Filter: automatically applies user's role scope
              if (!isFullScope && !access.inScope) {
                return false;
              }

              // Bottlenecks only
              if (bottlenecksOnly && (!line.bottleneck || !line.bottleneck.station || line.bottleneck.station === 'No Bottleneck Reported')) {
                return false;
              }

              // Specific Line Selection Filter
              if (selectedLineFilter !== 'all') {
                const normReq = normalizeLineNo(selectedLineFilter);
                if (normalizeLineNo(line.lineNo) !== normReq) {
                  return false;
                }
              }

              // Search query
              if (!q) return true;
              return (
                String(line.lineNo).toLowerCase().includes(q) ||
                (line.style || '').toLowerCase().includes(q) ||
                (line.buyer || '').toLowerCase().includes(q) ||
                (line.floor || '').toLowerCase().includes(q) ||
                meta.inchargeName.toLowerCase().includes(q) ||
                meta.lineIEName.toLowerCase().includes(q) ||
                (line.bottleneck?.station || '').toLowerCase().includes(q)
              );
            });

            return {
              ...inc,
              lines: filteredLines
            };
          })
          .filter((inc: InchargeGroupData) => inc.lines.length > 0 || !q);

        return {
          ...wing,
          incharges: filteredIncharges
        };
      })
      .filter((wing: WingGroupData) => wing.incharges.some((inc: InchargeGroupData) => inc.lines.length > 0) || !q);
  }, [wingGroups, searchQuery, selectedWingFilter, selectedInchargeFilter, selectedLineFilter, bottlenecksOnly, isFullScope, effectiveProfile, roleTiers]);

  return (
    <div className="space-y-4">
      {/* Breadcrumb banner when viewing a deep operational workspace */}
      {subTab !== 'lines' && (
        <div className="flex items-center justify-between bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('lines')}
            className="flex items-center gap-1.5 font-bold text-[#176f78] hover:underline cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Daily Data Collection</span>
          </button>
          <span className="font-semibold text-[#527078] capitalize">{subTab.replace('-', ' ')} Workspace</span>
        </div>
      )}

      {/* SUB-TAB 1: MAIN DATA HUB (Daily Data Collection Workspace) */}
      {subTab === 'lines' && (
        <div className="space-y-4">
          <LineData
            lines={lines}
            checklists={checklists}
            selectedLineNo={selectedLineNo}
            onSelectLineNo={onSelectLineNo}
            onSaveLine={onSaveLine}
            onAddNewLine={onAddNewLine}
            onDeleteLine={onDeleteLine}
            onDeleteFloor={onDeleteFloor}
            onNavigate={onNavigate}
            activeDate={activeDate}
            onSelectDate={onSelectDate}
            profile={effectiveProfile}
            roleTiers={roleTiers}
            initialSortBy={initialSortBy}
            initialSortDirection={initialSortDirection}
            onOpenOptimizer={() => setSubTab('optimizer')}
            onExportCSV={() => exportLinesDataCSV(lines)}
          />
        </div>
      )}

      {/* SUB-TAB 2: IE ORGANOGRAM & RBAC MATRIX */}
      {subTab === 'ie-org' && (
        <div className="space-y-4">
          {/* RBAC Active Identity & Automatic Scope Clearance Banner */}
          <div className="bg-white border border-[#d9d2c2] rounded-2xl p-3 sm:p-4 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* User Identity & Clearance Badge */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0"
                  style={{ backgroundColor: activeRoleTier.color || '#1e3a8a' }}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#17343a]">
                      {effectiveProfile.name}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white shadow-2xs"
                      style={{ backgroundColor: activeRoleTier.color || '#1e3a8a' }}
                    >
                      {activeRoleTier.tierLevelLabel}: {activeRoleTier.roleTitle}
                    </span>
                    <span className="text-[11px] text-[#527078] font-medium flex items-center gap-1.5 flex-wrap">
                      <span>Scope:</span>
                      <strong className="text-[#17343a]">{activeRoleTier.reportingScope}</strong>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Automatic Scope Active
                      </span>
                    </span>
                  </div>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Clearance: <span className="font-semibold text-[#17343a]">{activeRoleTier.accessControlLevel}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Executive Overview Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            <div className="bg-white border border-[#d9d2c2] rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider">Total Active Lines</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-black text-[#17343a] font-mono-numbers">
                  {departmentTotals.linesCount}
                </span>
                <span className="text-xs text-[#527078]">Lines</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">2 Wings • 6 Blocks</span>
            </div>

            <div className="bg-white border border-[#d9d2c2] rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider">Target Output</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-black text-[#17343a] font-mono-numbers">
                  {departmentTotals.target.toLocaleString()}
                </span>
                <span className="text-xs text-[#527078]">pcs</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">8h Shift Target</span>
            </div>

            <div className="bg-white border border-[#d9d2c2] rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider">Actual Output</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-black text-blue-900 font-mono-numbers">
                  {departmentTotals.actual.toLocaleString()}
                </span>
                <span className="text-xs text-[#527078]">pcs</span>
              </div>
              <span className={`text-[10px] font-bold ${departmentTotals.variance >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {departmentTotals.variance >= 0 ? `+${departmentTotals.variance.toLocaleString()}` : departmentTotals.variance.toLocaleString()} pcs
              </span>
            </div>

            <div className="bg-white border border-[#d9d2c2] rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider">Avg Efficiency</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-black text-[#176f78] font-mono-numbers">
                  {departmentTotals.efficiency}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Target: 60.0%</span>
            </div>

            <div className="bg-white border border-[#d9d2c2] rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider">Active Bottlenecks</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono-numbers">
                  {departmentTotals.bottlenecks}
                </span>
                <span className="text-xs text-[#527078]">Stations</span>
              </div>
              <span className="text-[10px] text-amber-800 font-semibold">Choked operations</span>
            </div>

            <div className="bg-white border border-[#d9d2c2] rounded-xl p-3 shadow-2xs">
              <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider">Critical Chokes</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl sm:text-2xl font-black text-red-700 font-mono-numbers">
                  {departmentTotals.criticalBottlenecks}
                </span>
                <span className="text-xs text-[#527078]">Critical</span>
              </div>
              <span className="text-[10px] text-red-700 font-bold">Needs IE balancing</span>
            </div>
          </div>

          {/* Organogram & Multi-Tier RBAC Command Architecture */}
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[#d9d2c2]">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#17343a] font-display flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-600" />
                  <span>Industrial Engineering Organogram &amp; Multi-Tier RBAC Architecture</span>
                </h2>
                <p className="text-xs text-[#527078]">
                  Debonair LTD (Unit-02) 6-Tier Command Structure: Sr. Manager, Wing Managers, Floor Incharges, and Line IEs.
                </p>
              </div>
            </div>

            <ActiveOperationalTiers
              currentTierId={simulatedTierId}
              onSelectTier={(tier) => setSimulatedTierId(tier.id)}
              profile={effectiveProfile}
              roleTiers={roleTiers}
              onSelectLineFilter={(lineNo) => {
                onSelectLineNo(lineNo);
                setSubTab('lines');
              }}
            />
          </div>

          {/* Unified Merged (Wings, Blocks, Lines) Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs font-bold text-[#527078] uppercase tracking-wider">
                Sewing Line &amp; Org Filter
              </span>
              <button
                type="button"
                onClick={() => setBottlenecksOnly(!bottlenecksOnly)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  bottlenecksOnly
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-red-600'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Bottlenecks Only</span>
                {bottlenecksOnly && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            </div>

            <WingBlockLineSelector
              selectedWing={selectedWingFilter}
              onSelectWing={setSelectedWingFilter}
              selectedBlockId={selectedInchargeFilter === 'all' ? 'all' : `block_${selectedInchargeFilter}`}
              onSelectBlock={(bId, bDef) => {
                setSelectedInchargeFilter(bDef ? bDef.blockNo : 'all');
              }}
              selectedLineNo={selectedLineFilter}
              onSelectLineNo={setSelectedLineFilter}
              onSelectionChange={(sel) => {
                setSelectedWingFilter(sel.wing);
                if (sel.blockId === 'all') {
                  setSelectedInchargeFilter('all');
                } else {
                  const bNum = parseInt(sel.blockId.replace('block_', ''), 10);
                  setSelectedInchargeFilter(isNaN(bNum) ? 'all' : bNum);
                }
                setSelectedLineFilter(sel.lineNo);
              }}
              lines={lines}
              variant="inline"
            />
          </div>

          {/* IE ORG HIERARCHY: Incharge Blocks → Line Pairs */}
          <div className="space-y-6">
              {filteredWingGroups.map((wing: WingGroupData) => (
                <div key={wing.wing} className="space-y-4">
                  {/* Incharge Blocks under this Wing */}
                  <div className="space-y-4">
                    {wing.incharges.map((inc: InchargeGroupData) => (
                      <div
                        key={inc.inchargeNo}
                        className="bg-white border border-[#d9d2c2] rounded-2xl overflow-hidden shadow-2xs"
                      >
                          {/* Incharge Block Header */}
                          <div className="bg-[#fbfaf6] border-b border-[#d9d2c2] p-3 sm:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold text-xs shadow-xs"
                                style={{ backgroundColor: inc.inchargeColor }}
                              >
                                {inc.inchargeCode}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-bold text-sm text-[#17343a]">
                                    Block {inc.inchargeNo} — {inc.floorLabel}
                                  </h3>
                                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                    {inc.assignedLinesRange}
                                  </span>
                                  {approvedIncharges[inc.inchargeNo] && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Approved
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#527078]">
                                  IE Incharge: <strong>{inc.inchargeName}</strong> (Tier 3)
                                </p>
                              </div>
                            </div>

                            {/* Block Metrics & Quick Actions */}
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-3 font-mono-numbers text-xs">
                                <div>
                                  <span className="text-[10px] text-[#527078] block">Output</span>
                                  <span className="font-bold text-[#17343a]">
                                    {inc.totalActual.toLocaleString()} / {inc.totalTarget.toLocaleString()} pcs
                                  </span>
                                </div>
                                <div className="h-5 w-px bg-[#d9d2c2]" />
                                <div>
                                  <span className="text-[10px] text-[#527078] block">Efficiency</span>
                                  <span className="font-bold text-[#176f78]">{inc.averageEfficiency}%</span>
                                </div>
                                <div className="h-5 w-px bg-[#d9d2c2]" />
                                <div>
                                  <span className="text-[10px] text-[#527078] block">Bottlenecks</span>
                                  <span className={`font-bold ${inc.bottlenecksCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                                    {inc.bottlenecksCount} stations
                                  </span>
                                </div>
                              </div>

                              {/* Incharge Sign-off Button */}
                              <button
                                type="button"
                                onClick={() => handleToggleInchargeApproval(inc.inchargeNo)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                  approvedIncharges[inc.inchargeNo]
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-emerald-600'
                                }`}
                              >
                                <CheckSquare className="w-3.5 h-3.5" />
                                <span>{approvedIncharges[inc.inchargeNo] ? 'Signed Off' : 'Incharge Sign-Off'}</span>
                              </button>

                              {/* Accordion Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleIncharge(inc.inchargeNo)}
                                className="p-1 rounded-lg hover:bg-slate-200/60 transition-colors text-slate-500 cursor-pointer"
                              >
                                {expandedIncharges[inc.inchargeNo] ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Line Cards Grid inside Incharge Block */}
                          {expandedIncharges[inc.inchargeNo] && (
                            <div className="p-3 sm:p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {inc.lines.map((line: LineEntry) => {
                                const meta = getLineIEMeta(line.lineNo);
                                const access = checkLineAccess(effectiveProfile, roleTiers, line.lineNo);
                                const isSelected = String(line.lineNo) === String(selectedLineNo);
                                const eff = Number(line.efficiency) || 0;
                                const hasBottleneck = line.bottleneck && line.bottleneck.station && line.bottleneck.station !== 'No Bottleneck Reported';

                                return (
                                  <div
                                    key={line.id}
                                    className={`rounded-xl border p-3 transition-all relative flex flex-col justify-between ${
                                      isSelected
                                        ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/30 shadow-xs'
                                        : 'bg-white border-[#d9d2c2] hover:border-[#176f78] shadow-2xs'
                                    }`}
                                  >
                                    {/* Quick Update Floating Action Button on Line Card */}
                                    {access.canEdit && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setQuickOutputLine(line);
                                        }}
                                        title={`Quick Update Achieved Output for Line ${line.lineNo}`}
                                        className="absolute -top-2.5 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-[#176f78] text-white hover:bg-[#125860] shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/60 z-10"
                                      >
                                        <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                                        <span>Quick Update</span>
                                      </button>
                                    )}

                                    <div>
                                      {/* Line Header */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => onSelectLineNo(line.lineNo)}
                                            className="font-black text-sm text-[#17343a] hover:text-[#176f78] font-mono cursor-pointer"
                                          >
                                            {meta.normalizedLine}
                                          </button>
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                            {line.buyer || 'Debonair'}
                                          </span>
                                        </div>

                                        {/* Line IE Engineer Pill */}
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#176f78]/10 text-[#176f78] border border-[#176f78]/20 shrink-0">
                                          {meta.lineIECode}: {meta.lineIEName}
                                        </span>
                                      </div>

                                      {/* Style & Item */}
                                      <p className="text-xs text-[#527078] truncate mt-1">
                                        Style: <strong className="text-[#17343a]">{line.style || 'Standard Jacket'}</strong>
                                      </p>

                                      {/* Output & Efficiency Gauge */}
                                      <div className="grid grid-cols-2 gap-2 mt-2.5 p-2 bg-[#fbfaf6] rounded-lg border border-[#e5dfd3] font-mono-numbers">
                                        <div
                                          onClick={() => access.canEdit && setQuickOutputLine(line)}
                                          className={`p-1 rounded-lg transition-colors ${
                                            access.canEdit ? 'cursor-pointer hover:bg-emerald-50/80 group/output' : ''
                                          }`}
                                          title={access.canEdit ? 'Click to quick update Achieved Output' : undefined}
                                        >
                                          <span className="text-[9px] uppercase font-bold text-[#527078] flex items-center justify-between">
                                            <span>Actual / Target</span>
                                            {access.canEdit && <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                                          </span>
                                          <span className="text-xs font-bold text-[#17343a]">
                                            {(Number(line.achievedProd) || 0).toLocaleString()} / {(Number(line.targetProd) || 0).toLocaleString()}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] uppercase font-bold text-[#527078] block">Efficiency</span>
                                          <span
                                            className={`text-xs font-bold ${
                                              eff >= 60 ? 'text-emerald-700' : eff >= 45 ? 'text-amber-700' : 'text-red-700'
                                            }`}
                                          >
                                            {eff}%
                                          </span>
                                        </div>
                                      </div>

                                      {/* Manpower & SMV */}
                                      <div className="flex items-center justify-between text-[11px] text-[#527078] mt-2 font-mono-numbers">
                                        <span>MP: <strong className="text-[#17343a]">{line.plannedMP || 45}</strong> (Op: {line.mp?.Operator?.present || 38})</span>
                                        <span>SMV: <strong className="text-[#17343a]">{line.smv || 14.5}m</strong></span>
                                      </div>

                                      {/* Bottleneck Status */}
                                      {hasBottleneck ? (
                                        <div
                                          className={`mt-2 p-1.5 rounded-lg text-[10px] flex items-center justify-between border ${
                                            line.bottleneck?.status === 'critical'
                                              ? 'bg-red-50 text-red-900 border-red-200'
                                              : 'bg-amber-50 text-amber-900 border-amber-200'
                                          }`}
                                        >
                                          <div className="flex items-center gap-1.5 truncate">
                                            <AlertTriangle className="w-3 h-3 shrink-0" />
                                            <span className="font-bold truncate">{line.bottleneck?.station}</span>
                                          </div>
                                          <span className="font-mono shrink-0 font-bold">
                                            {line.bottleneck?.cycleTime}s / {line.bottleneck?.targetCT}s
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="mt-2 p-1 rounded-lg text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                          <span>Flow Balanced (No Choke)</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Action Drawer & RBAC Status */}
                                    <div className="mt-3 pt-2 border-t border-[#e5dfd3] flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1">
                                        {access.canEdit ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() => setQuickOutputLine(line)}
                                              className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                                              title="Quick adjust Achieved Output without navigating away"
                                            >
                                              <Zap className="w-3 h-3 fill-white" />
                                              <span>Quick Output</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenQuickEdit(line)}
                                              className="px-2 py-1 rounded-lg bg-[#176f78] text-white text-[10px] font-bold hover:bg-[#135d65] transition-colors cursor-pointer flex items-center gap-1"
                                            >
                                              <Edit3 className="w-3 h-3" />
                                              <span>Edit</span>
                                            </button>
                                          </>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100">
                                            <Lock className="w-2.5 h-2.5" />
                                            View Only
                                          </span>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => {
                                            onSelectLineNo(line.lineNo);
                                            setSubTab('balancing');
                                          }}
                                          title="Line Balancing (Yamazumi)"
                                          className="p-1 rounded-lg bg-white border border-[#d9d2c2] text-[#176f78] hover:bg-slate-100 text-[10px] font-bold transition-colors cursor-pointer"
                                        >
                                          <Sliders className="w-3 h-3" />
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            onSelectLineNo(line.lineNo);
                                            setSubTab('hourly');
                                          }}
                                          title="Hourly Pacing"
                                          className="p-1 rounded-lg bg-white border border-[#d9d2c2] text-[#176f78] hover:bg-slate-100 text-[10px] font-bold transition-colors cursor-pointer"
                                        >
                                          <Clock className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          onSelectLineNo(line.lineNo);
                                          setSubTab('lines');
                                        }}
                                        className="text-[10px] font-bold text-[#176f78] hover:underline cursor-pointer flex items-center gap-0.5"
                                      >
                                        <span>Deep telemetry</span>
                                        <ArrowRight className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                </div>
              ))}
            </div>
        </div>
      )}

      {/* SUB-TAB 3: AI OPTIMIZATION ASSISTANT */}
      {subTab === 'optimizer' && (
        <AiOptimizationAssistant
          lines={lines}
          onSaveLine={onSaveLine}
          onNavigateToLine={(lineNo) => {
            onSelectLineNo(lineNo);
            setSubTab('lines');
          }}
        />
      )}

      {/* SUB-TAB 4: LINE BALANCING (YAMAZUMI) */}
      {subTab === 'balancing' && (
        <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
          <LineBalancingTab stations={stations} />
        </div>
      )}

      {/* SUB-TAB 5: HOURLY PACING (UPH) */}
      {subTab === 'hourly' && (
        <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
          <HourlyPacingTab
            hourlyData={hourlyData}
            onUpdateHourNotes={onUpdateHourNotes}
          />
        </div>
      )}

      {/* SUB-TAB 6: CAPACITY CALCULATOR */}
      {subTab === 'capacity' && (
        <CapacityCalculatorWorkspace
          onBack={() => setSubTab('lines')}
          lines={lines}
          selectedLineNo={selectedLineNo}
          onSaveLine={onSaveLine}
          actions={actions}
          onUpdateActions={onUpdateActions}
          profile={effectiveProfile}
        />
      )}

      {/* SUB-TAB 7: FLOOR PLAN & SETUP */}
      {subTab === 'floor-plan' && (
        <FloorPlanLineSetup
          lines={lines}
          onSaveLine={onSaveLine}
          onAddNewLine={(newLine: LineEntry) => onAddNewLine && onAddNewLine(newLine)}
          onDeleteLine={onDeleteLine}
          onDeleteFloor={onDeleteFloor}
          onReorderLines={onReorderLines}
          onNavigate={(tab, lineNo) => onNavigate && onNavigate(tab, lineNo)}
          activeDate={activeDate}
          profile={effectiveProfile}
          initialLineNo={selectedLineNo}
          onOpenDatabase={onOpenDatabase}
          factoryProfile={factoryProfile}
          onUpdateFactoryProfile={onUpdateFactoryProfile}
          savedFactories={savedFactories}
          onSaveFactoryList={onSaveFactoryList}
        />
      )}

      {/* SUB-TAB 8: PRODUCTION HISTORY */}
      {subTab === 'history' && (
        <LineProductionHistoryView
          lines={lines}
          selectedLineNo={selectedLineNo}
          onSelectLineNo={onSelectLineNo}
          onNavigate={onNavigate}
          onSelectDate={onSelectDate}
          profile={effectiveProfile}
        />
      )}

      {/* SUB-TAB 9: LOSS PARETO & DOWNTIME */}
      {subTab === 'loss-pareto' && (
        <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
          <LossParetoTab
            downtimeLog={downtimeLog}
            onOpenNewDowntime={onOpenNewDowntime}
          />
        </div>
      )}

      {/* MODAL: QUICK EDIT LINE TELEMETRY */}
      {editingLine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#d9d2c2] max-w-lg w-full p-4 sm:p-6 shadow-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#d9d2c2]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#176f78] text-white flex items-center justify-center font-bold text-xs">
                  {editingLine.lineNo}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#17343a]">
                    Quick Edit: Line {editingLine.lineNo}
                  </h3>
                  <p className="text-[11px] text-[#527078]">
                    {editingLine.buyer} • Style: {editingLine.style}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingLine(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#527078] block mb-1">Target Output (pcs)</label>
                  <input
                    type="number"
                    value={editForm.targetProd ?? editingLine.targetProd}
                    onChange={(e) => setEditForm({ ...editForm, targetProd: Number(e.target.value) })}
                    className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#527078] block mb-1">Actual Output (pcs)</label>
                  <input
                    type="number"
                    value={editForm.achievedProd ?? editingLine.achievedProd}
                    onChange={(e) => setEditForm({ ...editForm, achievedProd: Number(e.target.value) })}
                    className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#17343a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#527078] block mb-1">Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.efficiency ?? editingLine.efficiency}
                    onChange={(e) => setEditForm({ ...editForm, efficiency: Number(e.target.value) })}
                    className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#527078] block mb-1">SMV (min)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.smv ?? editingLine.smv}
                    onChange={(e) => setEditForm({ ...editForm, smv: Number(e.target.value) })}
                    className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#527078] block mb-1">Planned MP</label>
                  <input
                    type="number"
                    value={editForm.plannedMP ?? editingLine.plannedMP}
                    onChange={(e) => setEditForm({ ...editForm, plannedMP: Number(e.target.value) })}
                    className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#17343a]"
                  />
                </div>
              </div>

              <div className="border-t border-[#d9d2c2] pt-3">
                <span className="font-bold text-xs text-[#17343a] block mb-2">Bottleneck Choke Station</span>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="text-[11px] text-[#527078] block mb-1">Choked Station</label>
                    <input
                      type="text"
                      value={editForm.bottleneck?.station ?? editingLine.bottleneck?.station ?? ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          bottleneck: {
                            ...(editForm.bottleneck || editingLine.bottleneck || { cycleTime: 0, targetCT: 0, status: 'ok', action: '' }),
                            station: e.target.value
                          }
                        })
                      }
                      className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-1.5 text-xs text-[#17343a]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#527078] block mb-1">Severity Status</label>
                    <select
                      value={editForm.bottleneck?.status ?? editingLine.bottleneck?.status ?? 'ok'}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          bottleneck: {
                            ...(editForm.bottleneck || editingLine.bottleneck || { cycleTime: 0, targetCT: 0, status: 'ok', action: '' }),
                            station: editForm.bottleneck?.station || editingLine.bottleneck?.station || '',
                            status: e.target.value as 'ok' | 'high' | 'critical'
                          }
                        })
                      }
                      className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-2 py-1.5 text-xs text-[#17343a]"
                    >
                      <option value="ok">Ok (Balanced)</option>
                      <option value="high">High Choke</option>
                      <option value="critical">Critical Bottleneck</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#527078] block mb-1">Observed Cycle Time (sec)</label>
                    <input
                      type="number"
                      value={editForm.bottleneck?.cycleTime ?? editingLine.bottleneck?.cycleTime ?? 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          bottleneck: {
                            ...(editForm.bottleneck || editingLine.bottleneck || { cycleTime: 0, targetCT: 0, status: 'ok', action: '' }),
                            station: editForm.bottleneck?.station || editingLine.bottleneck?.station || '',
                            cycleTime: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#17343a]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#527078] block mb-1">Target Cycle Time (sec)</label>
                    <input
                      type="number"
                      value={editForm.bottleneck?.targetCT ?? editingLine.bottleneck?.targetCT ?? 0}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          bottleneck: {
                            ...(editForm.bottleneck || editingLine.bottleneck || { cycleTime: 0, targetCT: 0, status: 'ok', action: '' }),
                            station: editForm.bottleneck?.station || editingLine.bottleneck?.station || '',
                            targetCT: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-[#17343a]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#d9d2c2]">
              <button
                type="button"
                onClick={() => setEditingLine(null)}
                className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickEdit}
                className="px-4 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#135d65] shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Telemetry</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPACT MODAL: RAPID ACHIEVED OUTPUT QUICK UPDATE */}
      {quickOutputLine && (
        <QuickOutputUpdateModal
          line={quickOutputLine}
          isOpen={!!quickOutputLine}
          onClose={() => setQuickOutputLine(null)}
          onSave={(updated) => {
            onSaveLine(updated);
            setQuickOutputLine(null);
          }}
        />
      )}
    </div>
  );
};

export default LineDataPage;
