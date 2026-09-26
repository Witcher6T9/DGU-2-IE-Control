/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Shield,
  Check,
  ArrowRight,
  Edit3,
  Trash2,
  CheckSquare,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Lock,
  Sliders,
  Network,
  Search,
  Filter,
  Layers,
  UserCheck,
  Building2,
  ArrowDown,
  CheckCircle2,
  ExternalLink,
  Info,
  Pencil,
  ArrowLeftRight,
  Move,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Fingerprint,
  Timer,
  KeyRound
} from 'lucide-react';
import { RoleTier, UserProfile } from '../types';
import { ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';
import {
  DEBONAIR_IE_ORG_CHART,
  DebonairOrgChart,
  ManagerNode,
  InchargeNode,
  LineIEMember
} from '../data/debonairOrgData';
import { EditOrgNodeModal, EditNodeData } from './EditOrgNodeModal';
import { RearrangeOrgModal } from './RearrangeOrgModal';
import { isMasterAdminOrAdmin } from '../utils/rbac';
import { UnifiedPermissionMatrix } from './UnifiedPermissionMatrix';

interface ActiveOperationalTiersProps {
  currentTierId: string;
  onSelectTier: (tier: RoleTier) => void;
  profile?: UserProfile;
  roleTiers?: RoleTier[];
  onOpenRoleEditor?: (tierId?: string) => void;
  onSelectLineFilter?: (lineNo: string) => void;
}

type ViewMode = 'organogram' | 'matrix';
type WingFilter = 'all' | 'blue' | 'green';

export const ActiveOperationalTiers: React.FC<ActiveOperationalTiersProps> = ({
  currentTierId,
  onSelectTier,
  profile,
  roleTiers = DEFAULT_ROLE_TIERS,
  onOpenRoleEditor,
  onSelectLineFilter
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const [viewMode, setViewMode] = useState<ViewMode>('organogram');
  const [wingFilter, setWingFilter] = useState<WingFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persistent Org Chart state (with localStorage caching)
  const [orgChart, setOrgChart] = useState<DebonairOrgChart>(() => {
    try {
      const saved = localStorage.getItem('debonair_ie_org_chart_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load saved org chart', e);
    }
    return DEBONAIR_IE_ORG_CHART;
  });

  // Edit & Rearrange modes
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRearrangeModalOpen, setIsRearrangeModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<EditNodeData | null>(null);

  const saveOrgChart = (newChart: DebonairOrgChart) => {
    setOrgChart(newChart);
    try {
      localStorage.setItem('debonair_ie_org_chart_v2', JSON.stringify(newChart));
    } catch (e) {
      console.error('Failed to save org chart', e);
    }
  };

  const handleResetDefault = () => {
    if (
      window.confirm(
        'Reset all roles, line assignments, and hierarchy back to Debonair factory regular data?'
      )
    ) {
      saveOrgChart(DEBONAIR_IE_ORG_CHART);
      handleSelectSrManager();
    }
  };

  const availableIncharges = orgChart.managers.flatMap(mgr =>
    mgr.incharges.map(inc => ({
      id: inc.id,
      title: inc.title,
      name: inc.name,
      floorName: inc.assignedFloors,
      wing: inc.section
    }))
  );

  const handleSaveNodeEdit = (updated: EditNodeData) => {
    const newChart: DebonairOrgChart = JSON.parse(JSON.stringify(orgChart));

    if (updated.type === 'head') {
      newChart.head.name = updated.name;
      newChart.head.title = updated.title;
      if (selectedNode.code === newChart.head.code) {
        setSelectedNode(prev => ({ ...prev, name: updated.name, title: updated.title }));
      }
    } else if (updated.type === 'manager') {
      const mgr = newChart.managers.find(m => m.id === updated.id);
      if (mgr) {
        mgr.name = updated.name;
        mgr.title = updated.title;
        if (updated.wingName) mgr.wingName = updated.wingName;
        if (updated.assignedLinesRange) mgr.assignedLinesRange = updated.assignedLinesRange;
        if (selectedNode.code === mgr.code) {
          setSelectedNode(prev => ({
            ...prev,
            name: updated.name,
            title: `${updated.title} (${mgr.wingName})`,
            assignedLines: `${mgr.assignedLinesRange} (17 Lines)`
          }));
        }
      }
    } else if (updated.type === 'incharge') {
      newChart.managers.forEach(mgr => {
        const inc = mgr.incharges.find(i => i.id === updated.id);
        if (inc) {
          inc.name = updated.name;
          inc.title = updated.title;
          if (updated.assignedFloors) inc.assignedFloors = updated.assignedFloors;
          if (updated.assignedLinesRange) inc.assignedLinesRange = updated.assignedLinesRange;
          if (selectedNode.code === inc.code) {
            setSelectedNode(prev => ({
              ...prev,
              name: updated.name,
              title: updated.title,
              assignedFloor: inc.assignedFloors,
              assignedLines: `${inc.assignedLinesRange} (6 Lines Total)`
            }));
          }
        }
      });
    } else if (updated.type === 'line_ie') {
      let currentMgrIdx = -1;
      let currentIncIdx = -1;
      let currentLieIdx = -1;

      newChart.managers.forEach((mgr, mIdx) => {
        mgr.incharges.forEach((inc, iIdx) => {
          const lIdx = inc.lineIEs.findIndex(l => l.id === updated.id);
          if (lIdx !== -1) {
            currentMgrIdx = mIdx;
            currentIncIdx = iIdx;
            currentLieIdx = lIdx;
          }
        });
      });

      if (currentMgrIdx !== -1 && currentIncIdx !== -1 && currentLieIdx !== -1) {
        const lie = newChart.managers[currentMgrIdx].incharges[currentIncIdx].lineIEs[currentLieIdx];
        lie.engineerName = updated.name;
        lie.title = updated.title;
        if (updated.lines && updated.lines.length >= 2) {
          lie.lines = updated.lines;
          lie.lineNo = `${updated.lines[0]} & ${updated.lines[1]}`;
        }
        if (updated.floorName) lie.floorName = updated.floorName;
        if (updated.status) lie.status = updated.status;

        // Check if transferred to another incharge
        if (
          updated.inchargeId &&
          updated.inchargeId !== newChart.managers[currentMgrIdx].incharges[currentIncIdx].id
        ) {
          newChart.managers[currentMgrIdx].incharges[currentIncIdx].lineIEs.splice(currentLieIdx, 1);
          let placed = false;
          newChart.managers.forEach(mgr => {
            mgr.incharges.forEach(inc => {
              if (inc.id === updated.inchargeId) {
                lie.section = inc.section;
                lie.floor = inc.assignedFloors;
                lie.floorName = inc.title.replace('IE Incharge - ', '') + ' Floor';
                inc.lineIEs.push(lie);
                placed = true;
              }
            });
          });
          if (!placed) {
            newChart.managers[currentMgrIdx].incharges[currentIncIdx].lineIEs.splice(currentLieIdx, 0, lie);
          }
        }

        if (selectedNode.code === lie.code) {
          setSelectedLieMember(lie);
          setSelectedNode(prev => ({
            ...prev,
            name: lie.engineerName,
            title: `${lie.title} • Lines ${lie.lines.join(' & ')}`,
            assignedLines: `Sewing Lines ${lie.lines.join(' & ')} (2 Lines Per IE)`,
            assignedFloor: `${lie.floorName} (${lie.floor})`
          }));
        }
      }
    }

    saveOrgChart(newChart);
  };

  // Card Swap handlers
  const handleSwapLineIE = (
    mgrIdx: number,
    incIdx: number,
    lieIdx: number,
    direction: 'left' | 'right'
  ) => {
    const targetIdx = direction === 'left' ? lieIdx - 1 : lieIdx + 1;
    const inc = orgChart.managers[mgrIdx].incharges[incIdx];
    if (targetIdx < 0 || targetIdx >= inc.lineIEs.length) return;

    const newChart: DebonairOrgChart = JSON.parse(JSON.stringify(orgChart));
    const list = newChart.managers[mgrIdx].incharges[incIdx].lineIEs;
    const temp = list[lieIdx];
    list[lieIdx] = list[targetIdx];
    list[targetIdx] = temp;

    saveOrgChart(newChart);
  };

  const handleSwapIncharge = (mgrIdx: number, incIdx: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? incIdx - 1 : incIdx + 1;
    const mgr = orgChart.managers[mgrIdx];
    if (targetIdx < 0 || targetIdx >= mgr.incharges.length) return;

    const newChart: DebonairOrgChart = JSON.parse(JSON.stringify(orgChart));
    const list = newChart.managers[mgrIdx].incharges;
    const temp = list[incIdx];
    list[incIdx] = list[targetIdx];
    list[targetIdx] = temp;

    saveOrgChart(newChart);
  };

  const [selectedLieMember, setSelectedLieMember] = useState<LineIEMember | null>(null);
  const [selectedNode, setSelectedNode] = useState<{
    type: 'sr_manager' | 'manager' | 'incharge' | 'line_ie';
    title: string;
    name: string;
    code: string;
    tierId: string;
    section?: 'blue' | 'green' | 'executive';
    assignedLines?: string;
    assignedFloor?: string;
    reportsTo?: string;
    subordinates?: string;
  }>({
    type: 'sr_manager',
    title: DEBONAIR_IE_ORG_CHART.head.title,
    name: DEBONAIR_IE_ORG_CHART.head.name,
    code: DEBONAIR_IE_ORG_CHART.head.code,
    tierId: 'tier_1',
    section: 'executive',
    assignedLines: 'Factory-Wide (Lines 01 - 34)',
    assignedFloor: 'All Floors (Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag)',
    reportsTo: 'Factory Managing Director / General Manager',
    subordinates: '2 Managers (Blue & Green Wings), 6 IE Incharges, 18 Line IEs (2 Lines Per IE)'
  });

  // Tiers matrix collapse state
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({
    tier_0: true,
    tier_1: true,
    tier_2: true,
    tier_3: true,
    tier_4: true
  });

  const toggleExpand = (id: string) => {
    setExpandedTiers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const currentRoleTier =
    roleTiers.find(t => t.id === currentTierId) || roleTiers[0] || DEFAULT_ROLE_TIERS[0];

  const handleSelectSrManager = () => {
    setSelectedLieMember(null);
    setSelectedNode({
      type: 'sr_manager',
      title: orgChart.head.title,
      name: orgChart.head.name,
      code: orgChart.head.code,
      tierId: 'tier_1',
      section: 'executive',
      assignedLines: 'Factory-Wide (Lines 01 - 34)',
      assignedFloor: 'All 6 Floors (Padma to Turag)',
      reportsTo: 'Factory Managing Director / Executive Management',
      subordinates: '2 Wing Managers, 6 IE Incharges, 18 Line IEs (2 Lines Per IE)'
    });
    const tier = roleTiers.find(t => t.id === 'tier_1');
    if (tier) onSelectTier(tier);
  };

  const handleSelectManager = (mgr: ManagerNode) => {
    setSelectedLieMember(null);
    setSelectedNode({
      type: 'manager',
      title: `${mgr.title} (${mgr.wingName})`,
      name: mgr.name,
      code: mgr.code,
      tierId: 'tier_2',
      section: mgr.section,
      assignedLines: `${mgr.assignedLinesRange} (17 Lines)`,
      assignedFloor: mgr.assignedFloors,
      reportsTo: 'Sr. Manager - IE Dept. (Debonair LTD Unit-02)',
      subordinates: `3 IE Incharges (${mgr.incharges.map(i => i.title).join(', ')}), 9 Line IEs (2 Lines Per IE)`
    });
    const tier = roleTiers.find(t => t.id === 'tier_2');
    if (tier) onSelectTier(tier);
  };

  const handleSelectIncharge = (inc: InchargeNode, mgr: ManagerNode) => {
    setSelectedLieMember(null);
    setSelectedNode({
      type: 'incharge',
      title: inc.title,
      name: inc.name,
      code: inc.code,
      tierId: 'tier_3',
      section: inc.section,
      assignedLines: `${inc.assignedLinesRange} (6 Lines Total)`,
      assignedFloor: inc.assignedFloors,
      reportsTo: `${mgr.title} (${mgr.name}) • ${mgr.wingName}`,
      subordinates: `3 Assigned Line IEs: ${inc.lineIEs.map(l => `${l.title} (${l.engineerName}: Lines ${l.lines.join(' & ')})`).join(', ')}`
    });
    const tier = roleTiers.find(t => t.id === 'tier_3');
    if (tier) onSelectTier(tier);
  };

  const handleSelectLineIE = (lie: LineIEMember, inc: InchargeNode, mgr: ManagerNode) => {
    setSelectedLieMember(lie);
    setSelectedNode({
      type: 'line_ie',
      title: `${lie.title} • Lines ${lie.lines.join(' & ')}`,
      name: lie.engineerName,
      code: lie.code,
      tierId: 'tier_4',
      section: lie.section,
      assignedLines: `Sewing Lines ${lie.lines.join(' & ')} (2 Lines Per IE)`,
      assignedFloor: `${lie.floorName} (${lie.floor})`,
      reportsTo: `${inc.title} (${inc.name}) -> ${mgr.title} (${mgr.name})`,
      subordinates: `Frontline Line Operators, Helpers & Quality Checkers on Lines ${lie.lines.join(' & ')}`
    });
    const tier = roleTiers.find(t => t.id === 'tier_4');
    if (tier) onSelectTier(tier);
  };

  return (
    <div id="debonair-roles-organogram-container" className="space-y-5">
      {/* Top Header & Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-3xl bg-[#f8f6f0] border border-[#d9d2c2] shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-[#17343a]">
                Debonair LTD (Unit-02) IE Department Roles
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                27 Verified Personnel
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-0.5 font-medium">
              Hierarchical organization structure: Sr. Manager, 2 Managers, 6 Incharges, and 18 Line IEs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#eae5d8] p-1 rounded-2xl border border-[#d2c9b6] flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setViewMode('organogram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'organogram'
                  ? 'bg-white text-[#17343a] shadow-xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Organogram View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-[#17343a] shadow-xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Permission Matrix</span>
            </button>
          </div>

          {isMasterAdmin && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setIsEditMode(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                  isEditMode
                    ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400'
                    : 'bg-white hover:bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2]'
                }`}
                title="Toggle interactive editing mode for all nodes"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Exit Edit Mode' : 'Edit Roles'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRearrangeModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-[#f1eee6] text-[#176f78] border border-[#d9d2c2] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Open Rearrange & Swap Studio"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Rearrange</span>
              </button>

              {onOpenRoleEditor && (
                <button
                  type="button"
                  onClick={() => onOpenRoleEditor()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors shadow-2xs cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Roles</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {viewMode === 'organogram' && (
        <div className="space-y-4">
          {/* Edit Mode Notice Banner */}
          {isMasterAdmin && isEditMode && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <span className="p-1 rounded-lg bg-amber-200 text-amber-900 shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </span>
                <span>
                  <strong>Interactive Organogram Editing Active:</strong> Click the ✏️ pencil icon on any card to update names & line numbers. Use ◀ ▶ arrows on Line IEs to swap positions, or click <strong>Rearrange</strong> for batch operations.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="px-2.5 py-1 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  Reset Factory Regular Data
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-2xs cursor-pointer transition-colors"
                >
                  Done Editing
                </button>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-[#527078] uppercase shrink-0">Filter Wing:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setWingFilter('all')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    wingFilter === 'all'
                      ? 'bg-[#17343a] text-white shadow-2xs'
                      : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e6e0d2]'
                  }`}
                >
                  All Wings (27)
                </button>
                <button
                  type="button"
                  onClick={() => setWingFilter('blue')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    wingFilter === 'blue'
                      ? 'bg-[#2563eb] text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Blue Wing (Mgr 1)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWingFilter('green')}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    wingFilter === 'green'
                      ? 'bg-[#16a34a] text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Green Wing (Mgr 2)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsRearrangeModalOpen(true)}
                className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f8f6f0] hover:bg-[#ede8dc] border border-[#d9d2c2] text-xs font-bold text-[#17343a] transition-colors cursor-pointer"
                title="Swap Line IEs or transfer floors"
              >
                <Move className="w-3 h-3 text-[#176f78]" />
                <span>Rearrange Studio</span>
              </button>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#527078] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search engineer, incharge, or line..."
                  className="w-full pl-8.5 pr-3 py-1.5 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] placeholder:text-[#527078]/60 bg-[#fbfaf6] focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                />
              </div>
            </div>
          </div>

          {/* Organogram Chart Canvas matching uploaded image */}
          <div className="p-4 sm:p-8 rounded-3xl bg-[#ece9e0] border-2 border-[#d0c7b3] shadow-inner overflow-x-auto">
            <div className="min-w-[760px] max-w-[1100px] mx-auto flex flex-col items-center select-none">
              {/* Main Organogram Banner matching image title */}
              <div className="text-center mb-6">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
                  {orgChart.unitName}
                </h2>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-700 mt-0.5">
                  {orgChart.deptName}
                </h3>
              </div>

              {/* LEVEL 1: Sr. Manager Card (Full Width Metallic Bar) */}
              <div className="w-full flex flex-col items-center">
                <div className="relative w-full max-w-[900px]">
                  <button
                    type="button"
                    onClick={handleSelectSrManager}
                    className={`w-full py-3.5 px-6 rounded-md transition-all duration-150 cursor-pointer shadow-md text-center relative ${
                      selectedNode.type === 'sr_manager'
                        ? 'ring-4 ring-slate-700 ring-offset-2 scale-[1.01]'
                        : 'hover:brightness-105'
                    }`}
                    style={{
                      background:
                        'linear-gradient(180deg, #94a3b8 0%, #64748b 45%, #475569 50%, #64748b 100%)',
                      border: '2px solid #334155',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 6px -1px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-white drop-shadow-sm">
                        {orgChart.head.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-sans font-extrabold uppercase bg-slate-900/40 text-slate-100 border border-slate-400/40">
                        Tier 1 • Head
                      </span>
                    </div>
                    <div className="text-xs font-sans text-slate-200 mt-0.5 flex items-center justify-center gap-2">
                      <span className="font-semibold">{orgChart.head.name}</span>
                      <span>•</span>
                      <span>Oversees All 34 Factory Lines • 18 Line IEs (2 Lines Per IE)</span>
                    </div>

                    {currentTierId === 'tier_1' && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Active Role
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingNode({
                        type: 'head',
                        id: orgChart.head.code,
                        title: orgChart.head.title,
                        name: orgChart.head.name,
                        code: orgChart.head.code
                      });
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-white transition-colors cursor-pointer shadow-xs"
                    title="Edit Head of IE details"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Vertical Trunk Line from Sr. Manager */}
                <div className="w-0.5 h-6 bg-slate-600 relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600 absolute -top-1 -left-1" />
                </div>

                {/* Horizontal Fork Bar connecting both Managers */}
                <div className="w-[50%] h-0.5 bg-slate-600 relative">
                  {/* Left down arrow */}
                  <div className="absolute left-0 top-0 w-0.5 h-5 bg-slate-600">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-700 absolute -bottom-1.5 -left-[3px]" />
                  </div>
                  {/* Right down arrow */}
                  <div className="absolute right-0 top-0 w-0.5 h-5 bg-slate-600">
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-700 absolute -bottom-1.5 -left-[3px]" />
                  </div>
                </div>
              </div>

              {/* LEVEL 2: Managers (2 Wings: Blue & Green) */}
              <div className="w-full max-w-[900px] grid grid-cols-2 mt-4 gap-1">
                {/* Manager 1: Blue Wing */}
                <div className={`flex flex-col relative ${wingFilter === 'green' ? 'opacity-30' : ''}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectManager(orgChart.managers[0])}
                    className={`w-full py-3 px-4 rounded-l-md transition-all duration-150 cursor-pointer text-center relative ${
                      selectedNode.code === orgChart.managers[0].code
                        ? 'ring-4 ring-blue-600 ring-offset-2 z-10'
                        : 'hover:brightness-105'
                    }`}
                    style={{
                      background:
                        'linear-gradient(180deg, #60a5fa 0%, #3b82f6 45%, #2563eb 50%, #3b82f6 100%)',
                      border: '2px solid #1d4ed8',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 5px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div className="font-serif text-lg sm:text-xl font-bold tracking-wide text-white drop-shadow-sm">
                      {orgChart.managers[0].title}
                    </div>
                    <div className="text-[11px] text-blue-100 font-sans font-semibold">
                      {orgChart.managers[0].name} • {orgChart.managers[0].wingName}
                    </div>
                    <div className="text-[10px] text-blue-200 uppercase font-mono mt-0.5">
                      Oversees Incharges 1 - 3 ({orgChart.managers[0].assignedLinesRange}) • 9 Line IEs (2 Lines/IE)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingNode({
                        type: 'manager',
                        id: orgChart.managers[0].id,
                        title: orgChart.managers[0].title,
                        name: orgChart.managers[0].name,
                        code: orgChart.managers[0].code,
                        wingName: orgChart.managers[0].wingName,
                        assignedLinesRange: orgChart.managers[0].assignedLinesRange,
                        assignedFloors: orgChart.managers[0].assignedFloors
                      });
                    }}
                    className="absolute right-2 top-2 z-20 p-1 rounded-md bg-blue-900/40 hover:bg-blue-900/70 text-white transition-colors cursor-pointer"
                    title="Edit Manager 1 details"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>

                  {/* 3 Arrows to Incharges 1, 2, 3 */}
                  <div className="grid grid-cols-3 pt-1">
                    {[0, 1, 2].map(idx => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-blue-600 relative">
                          <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[5px] border-t-blue-700 absolute -bottom-1 -left-[2.5px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manager 2: Green Wing */}
                <div className={`flex flex-col relative ${wingFilter === 'blue' ? 'opacity-30' : ''}`}>
                  <button
                    type="button"
                    onClick={() => handleSelectManager(orgChart.managers[1])}
                    className={`w-full py-3 px-4 rounded-r-md transition-all duration-150 cursor-pointer text-center relative ${
                      selectedNode.code === orgChart.managers[1].code
                        ? 'ring-4 ring-emerald-600 ring-offset-2 z-10'
                        : 'hover:brightness-105'
                    }`}
                    style={{
                      background:
                        'linear-gradient(180deg, #bef264 0%, #a3e635 45%, #84cc16 50%, #a3e635 100%)',
                      border: '2px solid #65a30d',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 5px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div className="font-serif text-lg sm:text-xl font-bold tracking-wide text-slate-900 drop-shadow-sm">
                      {orgChart.managers[1].title}
                    </div>
                    <div className="text-[11px] text-slate-800 font-sans font-semibold">
                      {orgChart.managers[1].name} • {orgChart.managers[1].wingName}
                    </div>
                    <div className="text-[10px] text-slate-700 uppercase font-mono mt-0.5">
                      Oversees Incharges 4 - 6 ({orgChart.managers[1].assignedLinesRange}) • 9 Line IEs (2 Lines/IE)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      setEditingNode({
                        type: 'manager',
                        id: orgChart.managers[1].id,
                        title: orgChart.managers[1].title,
                        name: orgChart.managers[1].name,
                        code: orgChart.managers[1].code,
                        wingName: orgChart.managers[1].wingName,
                        assignedLinesRange: orgChart.managers[1].assignedLinesRange,
                        assignedFloors: orgChart.managers[1].assignedFloors
                      });
                    }}
                    className="absolute right-2 top-2 z-20 p-1 rounded-md bg-emerald-900/30 hover:bg-emerald-900/60 text-slate-900 transition-colors cursor-pointer"
                    title="Edit Manager 2 details"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>

                  {/* 3 Arrows to Incharges 4, 5, 6 */}
                  <div className="grid grid-cols-3 pt-1">
                    {[0, 1, 2].map(idx => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="w-0.5 h-6 bg-emerald-600 relative">
                          <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[5px] border-t-emerald-700 absolute -bottom-1 -left-[2.5px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* LEVEL 3: 6 IE Incharges (3 Blue, 3 Green) */}
              <div className="w-full max-w-[900px] grid grid-cols-6 gap-1">
                {/* Manager 1's Incharges */}
                {orgChart.managers[0].incharges.map((inc, incIdx) => {
                  const isDimmed = wingFilter === 'green';
                  const isSelected = selectedNode.code === inc.code;
                  return (
                    <div key={inc.id} className={`flex flex-col relative ${isDimmed ? 'opacity-30' : ''}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectIncharge(inc, orgChart.managers[0])}
                        className={`w-full py-2 px-1 text-center transition-all cursor-pointer rounded-xs relative ${
                          isSelected ? 'ring-3 ring-blue-700 z-10 scale-105' : 'hover:brightness-105'
                        }`}
                        style={{
                          background:
                            inc.inchargeNo === 1
                              ? 'linear-gradient(180deg, #93c5fd 0%, #60a5fa 50%, #3b82f6 100%)'
                              : inc.inchargeNo === 2
                              ? 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 50%, #0284c7 100%)'
                              : 'linear-gradient(180deg, #67e8f9 0%, #22d3ee 50%, #0891b2 100%)',
                          border: '1.5px solid #1e40af',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div className="font-serif text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                          {inc.title}
                        </div>
                        <div className="text-[10px] text-slate-800 font-sans font-semibold mt-0.5 truncate">
                          {inc.name.split(' ')[0]}
                        </div>
                        <div className="text-[9px] text-blue-900 font-mono font-bold mt-0.5">
                          {inc.assignedLinesRange}
                        </div>
                        <div className="text-[8px] text-blue-950 font-sans font-medium mt-0.5">
                          {inc.lineIEs.length} Line IEs • 2 Lines Each
                        </div>

                        {/* Edit incharge button */}
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            setEditingNode({
                              type: 'incharge',
                              id: inc.id,
                              title: inc.title,
                              name: inc.name,
                              code: inc.code,
                              assignedFloors: inc.assignedFloors,
                              assignedLinesRange: inc.assignedLinesRange
                            });
                          }}
                          className="absolute right-0.5 top-0.5 p-0.5 rounded bg-blue-950/20 hover:bg-blue-950/50 text-slate-900 transition-colors cursor-pointer"
                          title="Edit Incharge"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </div>
                      </button>

                      {/* Incharge swap arrows if in edit mode */}
                      {isEditMode && (
                        <div className="flex items-center justify-between px-0.5 py-0.5 bg-[#dbeafe] rounded text-[9px]">
                          <button
                            type="button"
                            disabled={incIdx === 0}
                            onClick={() => handleSwapIncharge(0, incIdx, 'left')}
                            className="p-0.5 rounded hover:bg-blue-200 text-blue-900 disabled:opacity-20 cursor-pointer"
                            title="Shift Incharge Left"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-[9px] text-blue-800">Swap</span>
                          <button
                            type="button"
                            disabled={incIdx === orgChart.managers[0].incharges.length - 1}
                            onClick={() => handleSwapIncharge(0, incIdx, 'right')}
                            className="p-0.5 rounded hover:bg-blue-200 text-blue-900 disabled:opacity-20 cursor-pointer"
                            title="Shift Incharge Right"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* 3 Arrows down to Line IEs */}
                      <div className="grid grid-cols-3 pt-1">
                        {[0, 1, 2].map(idx => (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="w-0.5 h-5 bg-blue-600 relative">
                              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-blue-700 absolute -bottom-1 -left-[2px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Manager 2's Incharges */}
                {orgChart.managers[1].incharges.map((inc, incIdx) => {
                  const isDimmed = wingFilter === 'blue';
                  const isSelected = selectedNode.code === inc.code;
                  return (
                    <div key={inc.id} className={`flex flex-col relative ${isDimmed ? 'opacity-30' : ''}`}>
                      <button
                        type="button"
                        onClick={() => handleSelectIncharge(inc, orgChart.managers[1])}
                        className={`w-full py-2 px-1 text-center transition-all cursor-pointer rounded-xs relative ${
                          isSelected
                            ? 'ring-3 ring-emerald-700 z-10 scale-105'
                            : 'hover:brightness-105'
                        }`}
                        style={{
                          background:
                            inc.inchargeNo === 4
                              ? 'linear-gradient(180deg, #bef264 0%, #a3e635 50%, #84cc16 100%)'
                              : inc.inchargeNo === 5
                              ? 'linear-gradient(180deg, #a7f3d0 0%, #6ee7b7 50%, #10b981 100%)'
                              : 'linear-gradient(180deg, #86efac 0%, #4ade80 50%, #16a34a 100%)',
                          border: '1.5px solid #166534',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div className="font-serif text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                          {inc.title}
                        </div>
                        <div className="text-[10px] text-slate-800 font-sans font-semibold mt-0.5 truncate">
                          {inc.name.split(' ')[0]}
                        </div>
                        <div className="text-[9px] text-emerald-950 font-mono font-bold mt-0.5">
                          {inc.assignedLinesRange}
                        </div>
                        <div className="text-[8px] text-emerald-950 font-sans font-medium mt-0.5">
                          {inc.lineIEs.length} Line IEs • 2 Lines Each
                        </div>

                        {/* Edit incharge button */}
                        <div
                          onClick={e => {
                            e.stopPropagation();
                            setEditingNode({
                              type: 'incharge',
                              id: inc.id,
                              title: inc.title,
                              name: inc.name,
                              code: inc.code,
                              assignedFloors: inc.assignedFloors,
                              assignedLinesRange: inc.assignedLinesRange
                            });
                          }}
                          className="absolute right-0.5 top-0.5 p-0.5 rounded bg-emerald-950/20 hover:bg-emerald-950/50 text-slate-900 transition-colors cursor-pointer"
                          title="Edit Incharge"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                        </div>
                      </button>

                      {/* Incharge swap arrows if in edit mode */}
                      {isEditMode && (
                        <div className="flex items-center justify-between px-0.5 py-0.5 bg-[#dcfce7] rounded text-[9px]">
                          <button
                            type="button"
                            disabled={incIdx === 0}
                            onClick={() => handleSwapIncharge(1, incIdx, 'left')}
                            className="p-0.5 rounded hover:bg-emerald-200 text-emerald-900 disabled:opacity-20 cursor-pointer"
                            title="Shift Incharge Left"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-[9px] text-emerald-800">Swap</span>
                          <button
                            type="button"
                            disabled={incIdx === orgChart.managers[1].incharges.length - 1}
                            onClick={() => handleSwapIncharge(1, incIdx, 'right')}
                            className="p-0.5 rounded hover:bg-emerald-200 text-emerald-900 disabled:opacity-20 cursor-pointer"
                            title="Shift Incharge Right"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {/* 3 Arrows down to Line IEs */}
                      <div className="grid grid-cols-3 pt-1">
                        {[0, 1, 2].map(idx => (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="w-0.5 h-5 bg-emerald-600 relative">
                              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-emerald-700 absolute -bottom-1 -left-[2px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LEVEL 4: 18 Line IEs (3 Per Incharge) - Vertical Pill Cards matching diagram */}
              <div className="w-full max-w-[900px] grid grid-cols-6 gap-1">
                {/* 3 Incharges for Manager 1 */}
                {orgChart.managers[0].incharges.map((inc, incIdx) => (
                  <div key={inc.id} className="grid grid-cols-3 gap-0.5">
                    {inc.lineIEs.map((lie, lieIdx) => {
                      const isDimmed = wingFilter === 'green';
                      const isSelected = selectedNode.code === lie.code;
                      const q = searchQuery.toLowerCase().trim();
                      const rawQ = q.replace(/^l-?|^line\s*/i, '').trim();
                      const isMatch =
                        !q ||
                        lie.lines.some(
                          l =>
                            l.toLowerCase() === rawQ ||
                            l.replace(/^0+/, '') === rawQ ||
                            l.includes(q)
                        ) ||
                        lie.lineNo.toLowerCase().includes(q) ||
                        lie.engineerName.toLowerCase().includes(q) ||
                        lie.floor.toLowerCase().includes(q) ||
                        lie.floorName.toLowerCase().includes(q);

                      return (
                        <div key={lie.id} className="flex flex-col">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectLineIE(lie, inc, orgChart.managers[0])
                            }
                            className={`h-32 sm:h-36 flex flex-col justify-between py-1 px-0.5 rounded-xs transition-all cursor-pointer relative ${
                              isDimmed || (q && !isMatch) ? 'opacity-25' : ''
                            } ${
                              isSelected
                                ? 'ring-2 ring-blue-900 z-10 scale-105 brightness-110 shadow-md'
                                : q && isMatch
                                ? 'ring-2 ring-amber-400 z-10 scale-105 brightness-110 shadow-md'
                                : 'hover:brightness-105'
                            }`}
                            style={{
                              background:
                                inc.inchargeNo === 1
                                  ? 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)'
                                  : inc.inchargeNo === 2
                                  ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 50%, #0369a1 100%)'
                                  : 'linear-gradient(180deg, #22d3ee 0%, #0891b2 50%, #0e7490 100%)',
                              border: '1.5px solid #1e3a8a',
                              boxShadow:
                                'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 3px rgba(0,0,0,0.15)'
                            }}
                            title={`Line IE • Lines ${lie.lines.join(' & ')} (${lie.engineerName}) - ${lie.floorName}`}
                          >
                            {/* Top 2 assigned lines badges */}
                            <div className="flex flex-col items-center leading-none gap-0.5 w-full">
                              <span className="text-[8px] sm:text-[8.5px] font-extrabold text-white font-mono uppercase tracking-tight bg-blue-950/40 rounded px-0.5 py-0.5 w-full text-center">
                                L-{lie.lines[0]}
                              </span>
                              <span className="text-[8px] sm:text-[8.5px] font-extrabold text-blue-100 font-mono uppercase tracking-tight bg-blue-950/30 rounded px-0.5 py-0.5 w-full text-center">
                                L-{lie.lines[1]}
                              </span>
                            </div>

                            {/* Vertical Line IE text */}
                            <span className="font-serif text-[10px] sm:text-[11px] font-bold text-white leading-none [writing-mode:vertical-rl] rotate-180 mx-auto tracking-wide drop-shadow-xs my-0.5">
                              Line IE
                            </span>

                            {/* Bottom engineer name & 2 Lines indicator */}
                            <div className="text-[7.5px] text-blue-100 font-sans truncate w-full px-0.5 text-center leading-tight">
                              <span className="block truncate font-semibold">
                                {lie.engineerName.split(' ')[0]}
                              </span>
                              <span className="text-[6.5px] uppercase font-mono font-bold text-white/90 bg-black/20 rounded px-0.5">
                                2 Lines
                              </span>
                            </div>
                          </button>

                          {/* Quick Card Controls in Edit Mode */}
                          {isEditMode && (
                            <div className="flex items-center justify-between w-full px-0.5 py-0.5 bg-[#172554] rounded-b text-white mt-0.5">
                              <button
                                type="button"
                                disabled={lieIdx === 0}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSwapLineIE(0, incIdx, lieIdx, 'left');
                                }}
                                className="p-0.5 rounded hover:bg-white/20 disabled:opacity-20 cursor-pointer"
                                title="Swap with left neighbor"
                              >
                                <ChevronLeft className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingNode({
                                    type: 'line_ie',
                                    id: lie.id,
                                    title: lie.title,
                                    name: lie.engineerName,
                                    code: lie.code,
                                    lines: lie.lines,
                                    floor: lie.floor,
                                    floorName: lie.floorName,
                                    status: lie.status,
                                    inchargeId: inc.id
                                  });
                                }}
                                className="p-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 cursor-pointer"
                                title="Edit Line IE"
                              >
                                <Pencil className="w-2 h-2" />
                              </button>
                              <button
                                type="button"
                                disabled={lieIdx === inc.lineIEs.length - 1}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSwapLineIE(0, incIdx, lieIdx, 'right');
                                }}
                                className="p-0.5 rounded hover:bg-white/20 disabled:opacity-20 cursor-pointer"
                                title="Swap with right neighbor"
                              >
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* 3 Incharges for Manager 2 */}
                {orgChart.managers[1].incharges.map((inc, incIdx) => (
                  <div key={inc.id} className="grid grid-cols-3 gap-0.5">
                    {inc.lineIEs.map((lie, lieIdx) => {
                      const isDimmed = wingFilter === 'blue';
                      const isSelected = selectedNode.code === lie.code;
                      const q = searchQuery.toLowerCase().trim();
                      const rawQ = q.replace(/^l-?|^line\s*/i, '').trim();
                      const isMatch =
                        !q ||
                        lie.lines.some(
                          l =>
                            l.toLowerCase() === rawQ ||
                            l.replace(/^0+/, '') === rawQ ||
                            l.includes(q)
                        ) ||
                        lie.lineNo.toLowerCase().includes(q) ||
                        lie.engineerName.toLowerCase().includes(q) ||
                        lie.floor.toLowerCase().includes(q) ||
                        lie.floorName.toLowerCase().includes(q);

                      return (
                        <div key={lie.id} className="flex flex-col">
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectLineIE(lie, inc, orgChart.managers[1])
                            }
                            className={`h-32 sm:h-36 flex flex-col justify-between py-1 px-0.5 rounded-xs transition-all cursor-pointer relative ${
                              isDimmed || (q && !isMatch) ? 'opacity-25' : ''
                            } ${
                              isSelected
                                ? 'ring-2 ring-emerald-900 z-10 scale-105 brightness-110 shadow-md'
                                : q && isMatch
                                ? 'ring-2 ring-amber-400 z-10 scale-105 brightness-110 shadow-md'
                                : 'hover:brightness-105'
                            }`}
                            style={{
                              background:
                                inc.inchargeNo === 4
                                  ? 'linear-gradient(180deg, #a3e635 0%, #84cc16 50%, #65a30d 100%)'
                                  : inc.inchargeNo === 5
                                  ? 'linear-gradient(180deg, #6ee7b7 0%, #10b981 50%, #059669 100%)'
                                  : 'linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)',
                              border: '1.5px solid #14532d',
                              boxShadow:
                                'inset 0 1px 0 rgba(255,255,255,0.4), 0 2px 3px rgba(0,0,0,0.15)'
                            }}
                            title={`Line IE • Lines ${lie.lines.join(' & ')} (${lie.engineerName}) - ${lie.floorName}`}
                          >
                            {/* Top 2 assigned lines badges */}
                            <div className="flex flex-col items-center leading-none gap-0.5 w-full">
                              <span className="text-[8px] sm:text-[8.5px] font-extrabold text-slate-900 font-mono uppercase tracking-tight bg-black/10 rounded px-0.5 py-0.5 w-full text-center">
                                L-{lie.lines[0]}
                              </span>
                              <span className="text-[8px] sm:text-[8.5px] font-extrabold text-slate-800 font-mono uppercase tracking-tight bg-black/10 rounded px-0.5 py-0.5 w-full text-center">
                                L-{lie.lines[1]}
                              </span>
                            </div>

                            {/* Vertical Line IE text */}
                            <span className="font-serif text-[10px] sm:text-[11px] font-bold text-slate-900 leading-none [writing-mode:vertical-rl] rotate-180 mx-auto tracking-wide drop-shadow-xs my-0.5">
                              Line IE
                            </span>

                            {/* Bottom engineer name & 2 Lines indicator */}
                            <div className="text-[7.5px] text-slate-800 font-sans truncate w-full px-0.5 text-center leading-tight">
                              <span className="block truncate font-semibold">
                                {lie.engineerName.split(' ')[0]}
                              </span>
                              <span className="text-[6.5px] uppercase font-mono font-bold text-slate-900 bg-white/40 rounded px-0.5">
                                2 Lines
                              </span>
                            </div>
                          </button>

                          {/* Quick Card Controls in Edit Mode */}
                          {isEditMode && (
                            <div className="flex items-center justify-between w-full px-0.5 py-0.5 bg-[#064e3b] rounded-b text-white mt-0.5">
                              <button
                                type="button"
                                disabled={lieIdx === 0}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSwapLineIE(1, incIdx, lieIdx, 'left');
                                }}
                                className="p-0.5 rounded hover:bg-white/20 disabled:opacity-20 cursor-pointer"
                                title="Swap with left neighbor"
                              >
                                <ChevronLeft className="w-2.5 h-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingNode({
                                    type: 'line_ie',
                                    id: lie.id,
                                    title: lie.title,
                                    name: lie.engineerName,
                                    code: lie.code,
                                    lines: lie.lines,
                                    floor: lie.floor,
                                    floorName: lie.floorName,
                                    status: lie.status,
                                    inchargeId: inc.id
                                  });
                                }}
                                className="p-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 cursor-pointer"
                                title="Edit Line IE"
                              >
                                <Pencil className="w-2 h-2" />
                              </button>
                              <button
                                type="button"
                                disabled={lieIdx === inc.lineIEs.length - 1}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleSwapLineIE(1, incIdx, lieIdx, 'right');
                                }}
                                className="p-0.5 rounded hover:bg-white/20 disabled:opacity-20 cursor-pointer"
                                title="Swap with right neighbor"
                              >
                                <ChevronRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Role Inspector Panel (Bottom of Chart) */}
          <div className="p-5 rounded-3xl bg-white border border-[#d9d2c2] shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1eee6]">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-2xl text-white font-bold flex items-center justify-center text-sm shadow-xs"
                  style={{
                    backgroundColor:
                      selectedNode.section === 'blue'
                        ? '#2563eb'
                        : selectedNode.section === 'green'
                        ? '#16a34a'
                        : '#475569'
                  }}
                >
                  {selectedNode.type === 'sr_manager'
                    ? 'SR'
                    : selectedNode.type === 'manager'
                    ? 'MGR'
                    : selectedNode.type === 'incharge'
                    ? 'INC'
                    : 'LIE'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-extrabold text-[#17343a]">
                      {selectedNode.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f1eee6] text-[#527078] border border-[#d9d2c2]">
                      {selectedNode.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedNode.section === 'blue'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedNode.section === 'green'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {selectedNode.section === 'blue'
                        ? 'Blue Wing (Sec A)'
                        : selectedNode.section === 'green'
                        ? 'Green Wing (Sec B)'
                        : 'Executive Head'}
                    </span>
                  </div>
                  <p className="text-xs text-[#527078] mt-0.5 font-medium">
                    Assigned Person: <strong className="text-[#17343a]">{selectedNode.name}</strong> • Unit:{' '}
                    <strong>Debonair LTD (Unit-02)</strong>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {currentTierId === selectedNode.tierId ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Current Active Role</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const tier = roleTiers.find(t => t.id === selectedNode.tierId);
                      if (tier) onSelectTier(tier);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
                  >
                    <span>Simulate / Switch to this Role</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (selectedNode.type === 'sr_manager') {
                      setEditingNode({
                        type: 'head',
                        id: orgChart.head.code,
                        title: orgChart.head.title,
                        name: orgChart.head.name,
                        code: orgChart.head.code
                      });
                    } else if (selectedNode.type === 'manager') {
                      const mgr =
                        orgChart.managers.find(m => m.code === selectedNode.code) ||
                        orgChart.managers[0];
                      setEditingNode({
                        type: 'manager',
                        id: mgr.id,
                        title: mgr.title,
                        name: mgr.name,
                        code: mgr.code,
                        wingName: mgr.wingName,
                        assignedLinesRange: mgr.assignedLinesRange,
                        assignedFloors: mgr.assignedFloors
                      });
                    } else if (selectedNode.type === 'incharge') {
                      let foundInc: InchargeNode | undefined;
                      orgChart.managers.forEach(m => {
                        const i = m.incharges.find(inc => inc.code === selectedNode.code);
                        if (i) foundInc = i;
                      });
                      if (foundInc) {
                        setEditingNode({
                          type: 'incharge',
                          id: foundInc.id,
                          title: foundInc.title,
                          name: foundInc.name,
                          code: foundInc.code,
                          assignedFloors: foundInc.assignedFloors,
                          assignedLinesRange: foundInc.assignedLinesRange
                        });
                      }
                    } else if (selectedNode.type === 'line_ie') {
                      if (selectedLieMember) {
                        let parentIncId = '';
                        orgChart.managers.forEach(m => {
                          m.incharges.forEach(inc => {
                            if (inc.lineIEs.some(l => l.id === selectedLieMember.id)) {
                              parentIncId = inc.id;
                            }
                          });
                        });
                        setEditingNode({
                          type: 'line_ie',
                          id: selectedLieMember.id,
                          title: selectedLieMember.title,
                          name: selectedLieMember.engineerName,
                          code: selectedLieMember.code,
                          lines: selectedLieMember.lines,
                          floor: selectedLieMember.floor,
                          floorName: selectedLieMember.floorName,
                          status: selectedLieMember.status,
                          inchargeId: parentIncId
                        });
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#f8f6f0] hover:bg-[#ede8dc] text-[#17343a] border border-[#d9d2c2] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title="Edit this role, assigned engineer or lines"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-600" />
                  <span>Edit Node</span>
                </button>

                {selectedNode.type === 'line_ie' && onSelectLineFilter && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedLieMember ? (
                      selectedLieMember.lines.map(lineNo => (
                        <button
                          key={lineNo}
                          type="button"
                          onClick={() => onSelectLineFilter(lineNo.replace(/^0+/, ''))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2] text-xs font-bold transition-all shadow-2xs hover:border-[#176f78] cursor-pointer"
                          title={`View Sewing Line ${lineNo} Real-Time Performance & Metrics`}
                        >
                          <Layers className="w-3.5 h-3.5 text-[#176f78]" />
                          <span>Line {lineNo} Data</span>
                        </button>
                      ))
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const match = selectedNode.title.match(/Line[s]?\s*(\d+)/i);
                          if (match) onSelectLineFilter(match[1]);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2] text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-[#176f78]" />
                        <span>View Line Data</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Role Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#f8f6f0] border border-[#e4ddce] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#527078] block">
                  Reporting Chain
                </span>
                <p className="font-semibold text-[#17343a] leading-relaxed">
                  {selectedNode.reportsTo}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8f6f0] border border-[#e4ddce] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#527078] block">
                  Floor &amp; Production Lines
                </span>
                <p className="font-semibold text-[#17343a] leading-relaxed">
                  {selectedNode.assignedFloor} • {selectedNode.assignedLines}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#f8f6f0] border border-[#e4ddce] space-y-1">
                <span className="text-[10px] font-bold uppercase text-[#527078] block">
                  Supervised Personnel
                </span>
                <p className="font-semibold text-[#17343a] leading-relaxed">
                  {selectedNode.subordinates}
                </p>
              </div>
            </div>

            {/* Privacy & Security Clearance Profile */}
            {(() => {
              const nodeTier = roleTiers.find(t => t.id === selectedNode.tierId) || roleTiers[0];
              return (
                <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#176f78]" />
                      Privacy &amp; Security Clearance Matrix ({nodeTier.name})
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] bg-[#17343a] text-teal-300">
                      {nodeTier.privacyClearanceLevel || (nodeTier.level <= 1 ? 'Level 4 Clearance' : nodeTier.level === 2 ? 'Level 3 Clearance' : nodeTier.level === 3 ? 'Level 2 Clearance' : 'Level 1 Clearance')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Operator PII</span>
                      <span className={`font-bold text-xs ${nodeTier.canViewPii !== false ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {nodeTier.canViewPii !== false ? 'Unmasked Access' : 'Masked (***)'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Cost &amp; Financials</span>
                      <span className={`font-bold text-xs ${nodeTier.canViewSensitiveFinancials ? 'text-amber-700' : 'text-slate-500'}`}>
                        {nodeTier.canViewSensitiveFinancials ? 'Commercial Rates' : 'Cost Masked'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">DLP Watermark</span>
                      <span className="font-bold text-xs text-sky-800">
                        {nodeTier.exportWatermarkEnabled ? 'Forensic Enforced' : 'Clean (Admin)'}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">Network Scope</span>
                      <span className="font-bold text-xs text-indigo-700 truncate block">
                        {nodeTier.allowedNetworkScope === 'unrestricted' ? 'Unrestricted' : nodeTier.allowedNetworkScope === 'vpn_secure' ? 'Secure VPN' : 'Intranet Only'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {viewMode === 'matrix' && (
        <UnifiedPermissionMatrix
          roleTiers={roleTiers}
          activeTierId={currentTierId}
          profile={profile}
          onSelectTier={onSelectTier}
          onOpenRoleEditor={onOpenRoleEditor}
        />
      )}

      {/* Edit Org Node Modal */}
      {isMasterAdmin && editingNode && (
        <EditOrgNodeModal
          nodeData={editingNode}
          isOpen={!!editingNode}
          onClose={() => setEditingNode(null)}
          onSave={handleSaveNodeEdit}
          availableIncharges={availableIncharges}
        />
      )}

      {/* Rearrange Org Modal */}
      {isMasterAdmin && isRearrangeModalOpen && (
        <RearrangeOrgModal
          orgChart={orgChart}
          isOpen={isRearrangeModalOpen}
          onClose={() => setIsRearrangeModalOpen(false)}
          onSaveChart={newChart => {
            saveOrgChart(newChart);
          }}
          onResetDefault={handleResetDefault}
        />
      )}
    </div>
  );
};
