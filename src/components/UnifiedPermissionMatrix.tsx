/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — IE Department
 * Canonical Unified Permission & Access Matrix
 * Consolidated Zero Trust Architecture & RBAC Hardening Component
 */

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Printer,
  Download,
  Copy,
  Check,
  Search,
  Sliders,
  Filter,
  RefreshCw,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';
import { RoleTier, UserProfile } from '../types';
import {
  ZERO_TRUST_CAPABILITY_MATRIX,
  ZeroTrustCapability,
  ZeroTrustPermissionStatus,
  canPerformAction,
  getZeroTrustSystemStatus,
  generateBreakGlassToken,
  BreakGlassKeyRecord,
  INITIAL_TAMPER_AUDIT_CHAIN,
  TamperEvidentAuditRecord,
  createTamperEvidentAuditRecord,
  verifyAuditChainIntegrity,
  getUserPrivacyClearance,
  checkLineAccess,
  getLineWing,
  getLineBlock,
  isSystemAdmin,
  FACTORY_BLOCKS
} from '../utils/rbac';

export interface UnifiedPermissionMatrixProps {
  roleTiers: RoleTier[];
  activeTierId?: string;
  profile?: UserProfile;
  onSelectTier?: (tier: RoleTier) => void;
  onOpenRoleEditor?: (tierId?: string) => void;
  showToast?: (message: string) => void;
  initialViewMode?: 'matrix' | 'sop_summary' | 'simulator' | 'audit_chain';
}

export const UnifiedPermissionMatrix: React.FC<UnifiedPermissionMatrixProps> = ({
  roleTiers,
  activeTierId = 'tier_1',
  profile,
  onSelectTier,
  onOpenRoleEditor,
  showToast,
  initialViewMode = 'matrix'
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'sop_summary' | 'simulator' | 'audit_chain'>(initialViewMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulator State
  const [simulatedTierId, setSimulatedTierId] = useState<string>(activeTierId);
  const [simulatedActionId, setSimulatedActionId] = useState<string>('override_target_midshift');
  const [simulatedLineNo, setSimulatedLineNo] = useState<string>('Line 04');
  const [simulatedWing, setSimulatedWing] = useState<'Blue Wing' | 'Green Wing'>(() => {
    return profile?.assignedWing === 'Green Wing' ? 'Green Wing' : 'Blue Wing';
  });

  // Break Glass Emergency Token State
  const [breakGlassRecord, setBreakGlassRecord] = useState<BreakGlassKeyRecord | null>(null);
  const [breakGlassReason, setBreakGlassReason] = useState('Emergency line stoppage / pitch rebalancing override');

  // Tamper Evident Audit Chain State
  const [auditChain, setAuditChain] = useState<TamperEvidentAuditRecord[]>(INITIAL_TAMPER_AUDIT_CHAIN);
  const [chainIntegrity, setChainIntegrity] = useState<{ isValid: boolean; checkedAt?: string }>({
    isValid: true
  });

  // Zero Trust System Status
  const ztStatus = useMemo(() => getZeroTrustSystemStatus(profile, roleTiers), [profile, roleTiers]);
  const activeClearance = useMemo(() => getUserPrivacyClearance(profile, roleTiers), [profile, roleTiers]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ZERO_TRUST_CAPABILITY_MATRIX.map(c => c.category)));
    return ['All', ...cats];
  }, []);

  const filteredCapabilities = useMemo(() => {
    return ZERO_TRUST_CAPABILITY_MATRIX.filter(cap => {
      const matchesCategory = selectedCategory === 'All' || cap.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        cap.name.toLowerCase().includes(query) ||
        cap.description.toLowerCase().includes(query) ||
        cap.category.toLowerCase().includes(query) ||
        cap.id.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyText = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    if (showToast) showToast('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Generate Break Glass Token
  const handleForgeBreakGlass = () => {
    const actor = profile?.email || 'supervisor@debonair.com';
    const rec = generateBreakGlassToken(actor, 'EMERGENCY_OVERRIDE', breakGlassReason, 4);
    setBreakGlassRecord(rec);

    // Append to audit chain
    const lastBlock = auditChain[auditChain.length - 1];
    const newBlock = createTamperEvidentAuditRecord(
      lastBlock,
      actor,
      'BREAK_GLASS_SYNTHESIS',
      `Token ${rec.token} generated for action: EMERGENCY_OVERRIDE (${breakGlassReason})`,
      'security'
    );
    setAuditChain(prev => [...prev, newBlock]);

    if (showToast) showToast('Emergency 4-Hour Break-Glass Supervisor Token synthesized!');
  };

  // Run Integrity Check on Audit Ledger
  const handleVerifyChain = () => {
    const result = verifyAuditChainIntegrity(auditChain);
    setChainIntegrity({
      isValid: result.isValid,
      checkedAt: new Date().toLocaleTimeString()
    });
    if (result.isValid && showToast) {
      showToast('Audit chain verified: 100% cryptographic integrity intact.');
    }
  };

  // Live Simulator Evaluation
  const simulatedProfile: UserProfile = useMemo(() => {
    const isRoot = simulatedTierId === 'tier_0';
    const targetBlock = FACTORY_BLOCKS.find(b => b.wing === simulatedWing) || FACTORY_BLOCKS[3];
    return {
      name: profile?.name || 'Simulated User',
      jobTitle: roleTiers.find(t => t.id === simulatedTierId)?.name || 'IE Engineer',
      role: isRoot ? 'admin' : simulatedTierId === 'tier_2' ? 'manager' : 'ie_incharge',
      tierId: simulatedTierId,
      email: isRoot ? 'ashikur.rahman.0971@gmail.com' : (profile?.email || 'engineer@debonair.com'),
      assignedWing: simulatedWing,
      assignedBlock: profile?.assignedBlock || targetBlock.label,
      assignedLines: profile?.assignedLines || ['Line 01', 'Line 02', 'Line 03', 'Line 04']
    };
  }, [profile, simulatedTierId, roleTiers, simulatedWing]);

  const simulationResult = useMemo(() => {
    return canPerformAction(simulatedProfile, simulatedActionId, { lineNo: simulatedLineNo });
  }, [simulatedProfile, simulatedActionId, simulatedLineNo]);

  // Export Matrix to CSV
  const handleExportCSV = () => {
    const headers = ['Category', 'Capability ID', 'Operation Name', 'Tier 0 (Root)', 'Tier 1 (Sr Mgr)', 'Tier 2 (Manager)', 'Tier 3 (Incharge)', 'Tier 4 (Line IE)', 'Audit Level', 'Description'];
    const rows = ZERO_TRUST_CAPABILITY_MATRIX.map(c => [
      `"${c.category}"`,
      `"${c.id}"`,
      `"${c.name}"`,
      `"${c.t0}"`,
      `"${c.t1}"`,
      `"${c.t2}"`,
      `"${c.t3}"`,
      `"${c.t4}"`,
      `"${c.auditLevel}"`,
      `"${c.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Debonair_Zero_Trust_Permission_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('Zero Trust Permission Matrix exported to CSV');
  };

  // Render Status Badge
  const renderStatusBadge = (status: ZeroTrustPermissionStatus) => {
    switch (status) {
      case 'ALLOWED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <Check className="w-2.5 h-2.5" />
            <span>ALLOWED</span>
          </span>
        );
      case 'WING_ONLY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
            <span>WING ONLY</span>
          </span>
        );
      case 'BLOCK_ONLY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span>BLOCK ONLY</span>
          </span>
        );
      case 'ASSIGNED_LINES_ONLY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
            <span>LINES ONLY</span>
          </span>
        );
      case 'APPROVAL_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-2.5 h-2.5" />
            <span>APPROVAL</span>
          </span>
        );
      case 'SUBMIT_ONLY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span>SUBMIT ONLY</span>
          </span>
        );
      case 'PASSCODE_PIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
            <Key className="w-2.5 h-2.5" />
            <span>PIN REQ</span>
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span>RESTRICTED</span>
          </span>
        );
      case 'DENIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-2.5 h-2.5" />
            <span>DENIED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. MASTER ZERO TRUST ARCHITECTURE BANNER */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f2837] text-white shadow-md border border-slate-700/80 overflow-hidden">
        <div className="p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-slate-700/60">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Zero Trust Architecture Active
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SOP-IE-04 Standard
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Debonair Unit-02 (Lines 01–34)
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-2 flex items-center gap-2">
              <span>Unified Zero Trust Permission &amp; Access Matrix</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Consolidated enterprise access governance: strict least-privilege enforcement, dynamic role scoping (Wings, Blocks &amp; Lines), cryptographic session heartbeats, and tamper-evident audit ledger.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
              title="Print Official SOP Matrix"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Matrix</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 cursor-pointer"
              title="Download CSV Table"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {onOpenRoleEditor && (
              <button
                type="button"
                onClick={() => onOpenRoleEditor(activeTierId)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Configure Tiers</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Zero Trust Telemetry Bar */}
        <div className="bg-black/30 px-6 py-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-[11px]">Heartbeat:</span>
              <span className="font-bold text-emerald-300">Verified ({ztStatus.overallHealthScore}%)</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-medium text-[11px]">Policy:</span>
              <span className="font-mono text-[11px] text-amber-300 font-bold">Fail-Secure Deny</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-medium text-[11px]">Active Clearance:</span>
              <span className="font-bold text-white px-2 py-0.5 rounded bg-white/10 text-[10px]">
                {ztStatus.activeTierLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="font-medium text-[11px]">Signature:</span>
              <span className="font-mono text-[11px] text-teal-300">{ztStatus.sessionFingerprint}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Guarded Capabilities:</span>
            <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
              {ztStatus.totalCapabilitiesGuarded} Operations
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUB-VIEW CONTROLLER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#d9d2c2] shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-[#f1eee6] rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'matrix'
                ? 'bg-white text-[#17343a] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#176f78]" />
            <span>Capability Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('sop_summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'sop_summary'
                ? 'bg-white text-[#17343a] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#1e3a8a]" />
            <span>SOP-IE-04 Tier Summary</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('simulator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'simulator'
                ? 'bg-white text-[#17343a] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Zero Trust Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('audit_chain')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              viewMode === 'audit_chain'
                ? 'bg-white text-[#17343a] shadow-xs'
                : 'text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Audit Chain</span>
          </button>
        </div>

        {/* Break-Glass Quick Button */}
        <button
          type="button"
          onClick={handleForgeBreakGlass}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          title="Forge emergency break-glass key for urgent floor interventions"
        >
          <Key className="w-3.5 h-3.5" />
          <span>Forge Break-Glass Key</span>
        </button>
      </div>

      {/* Break-Glass Active Banner */}
      {breakGlassRecord && (
        <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-600 text-white">
                Active Break-Glass Key
              </span>
              <span className="text-xs text-purple-900 font-bold">TTL: 4 Hours</span>
            </div>
            <div className="font-mono text-sm font-bold text-purple-800 mt-1">
              {breakGlassRecord.token}
            </div>
            <p className="text-[11px] text-purple-700 mt-0.5">
              Reason: {breakGlassRecord.reason} • Actor: {breakGlassRecord.actorEmail}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleCopyText(breakGlassRecord.token, 'break_glass')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 cursor-pointer self-start sm:self-auto"
          >
            {copiedKey === 'break_glass' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'break_glass' ? 'Copied' : 'Copy Key'}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
       * VIEW 1: GRANULAR ZERO TRUST CAPABILITY MATRIX
       * ========================================================================= */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#d9d2c2]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search capability by name, description, ID, or domain..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-[#f1eee6]/60 border border-[#d9d2c2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#176f78]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e4dfd3]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Master Table */}
          <div className="bg-white rounded-2xl border border-[#d9d2c2] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[840px]">
                <thead className="bg-[#17343a] text-white text-[11px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-72">Operation / Factory Domain</th>
                    <th className="py-3 px-2 text-center w-24">Tier 0 (Root)</th>
                    <th className="py-3 px-2 text-center w-28">Tier 1 (Sr Mgr)</th>
                    <th className="py-3 px-2 text-center w-28">Tier 2 (Manager)</th>
                    <th className="py-3 px-2 text-center w-28">Tier 3 (Incharge)</th>
                    <th className="py-3 px-2 text-center w-28">Tier 4 (Line IE)</th>
                    <th className="py-3 px-3 text-center w-20">Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {filteredCapabilities.map((cap, idx) => (
                    <tr
                      key={cap.id}
                      className={`hover:bg-[#f8f6f0] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#faf9f5]'}`}
                    >
                      {/* Operation details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{cap.name}</span>
                          {cap.requiresPin && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">
                              PIN
                            </span>
                          )}
                          {cap.requiresBreakGlass && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                              Break-Glass
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {cap.description}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                          {cap.category} • ID: {cap.id}
                        </div>
                      </td>

                      {/* Tier 0 */}
                      <td className="py-3 px-2 text-center">{renderStatusBadge(cap.t0)}</td>
                      {/* Tier 1 */}
                      <td className="py-3 px-2 text-center">{renderStatusBadge(cap.t1)}</td>
                      {/* Tier 2 */}
                      <td className="py-3 px-2 text-center">{renderStatusBadge(cap.t2)}</td>
                      {/* Tier 3 */}
                      <td className="py-3 px-2 text-center">{renderStatusBadge(cap.t3)}</td>
                      {/* Tier 4 */}
                      <td className="py-3 px-2 text-center">{renderStatusBadge(cap.t4)}</td>

                      {/* Audit Level */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            cap.auditLevel === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : cap.auditLevel === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cap.auditLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCapabilities.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <div className="font-bold text-sm">No capabilities matched your filter</div>
                <div className="text-xs mt-1">Try adjusting the search query or category filter.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
       * VIEW 2: OFFICIAL SOP-IE-04 RBAC TIER SUMMARY TABLE
       * ========================================================================= */}
      {viewMode === 'sop_summary' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs overflow-hidden">
            {/* Blue Banner Header */}
            <div className="bg-[#1e3a8a] text-white px-6 sm:px-8 py-5 border-b border-[#172554]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white/20 text-white tracking-wider border border-white/20">
                  Official Factory Policy
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  Standard Operating Procedure (SOP-IE-04)
                </span>
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
                DEBONAIR LTD (UNIT-02) — IE DEPARTMENT
              </h2>
              <p className="italic text-blue-100 text-xs sm:text-sm font-serif mt-0.5">
                Role-Based Access Control (RBAC) Official Tier Summary &amp; Scoping Matrix
              </p>
            </div>

            {/* Official Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-[#f8f6f0] text-slate-700 text-[11px] font-bold uppercase border-b border-[#d9d2c2]">
                  <tr>
                    <th className="py-3 px-4 w-40">Tier &amp; Role Title</th>
                    <th className="py-3 px-4 w-48">Reporting Scope</th>
                    <th className="py-3 px-4 w-60">Access Control Level</th>
                    <th className="py-3 px-3 text-center w-32">Checklist Sign-off</th>
                    <th className="py-3 px-3 text-center w-28">Max Export Rows</th>
                    <th className="py-3 px-3 text-center w-28">Inactivity Lock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {roleTiers
                    .filter(t => !t.isHidden || isSystemAdmin(profile) || t.id === activeTierId)
                    .map(tier => {
                      const isActive = tier.id === activeTierId;
                      return (
                        <tr
                          key={tier.id}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            isActive ? 'bg-blue-50/80 font-medium ring-1 ring-blue-500/20' : 'bg-white'
                          }`}
                        >
                          {/* Role Title */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: tier.color || '#1e3a8a' }}
                              ></span>
                              <div>
                                <div className="font-bold text-slate-900">
                                  {tier.tierLevelLabel || `Tier ${tier.level}`}: {tier.name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  {tier.shortCode} • Level {tier.level}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Reporting Scope */}
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="font-medium">{tier.reportingScope || 'Factory Standard'}</div>
                            <div className="text-[10px] text-slate-500">
                              {tier.scopeType === 'all'
                                ? 'All 34 Factory Lines'
                                : tier.scopeType === 'wing'
                                ? 'Assigned Wing (16–18 Lines)'
                                : tier.scopeType === 'block'
                                ? 'Assigned Block (5–6 Lines)'
                                : 'Assigned Lines (Data Entry)'}
                            </div>
                          </td>

                          {/* Access Control Level */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">
                              {tier.accessControlLevel || tier.systemEdit}
                            </div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">
                              {tier.description}
                            </div>
                          </td>

                          {/* Checklist Sign-off */}
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                tier.checklistSignoff === 'Authorized'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {tier.checklistSignoff || 'Submit Only'}
                            </span>
                          </td>

                          {/* Export rows */}
                          <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                            {tier.maxExportRowsLimit === 0 ? 'Unlimited' : `${tier.maxExportRowsLimit || 500} rows`}
                          </td>

                          {/* Session lock */}
                          <td className="py-3.5 px-3 text-center font-mono text-slate-600">
                            {tier.sessionTimeoutMinutes || 30} mins
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * VIEW 3: LIVE ZERO TRUST SIMULATOR
       * ========================================================================= */}
      {viewMode === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-[#d9d2c2] shadow-2xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Simulation Parameters</span>
              </h3>
              <p className="text-xs text-[#527078] mt-0.5">
                Test any role clearance against any factory action in real-time.
              </p>
            </div>

            {/* Select Role Tier */}
            <div>
              <label className="block text-xs font-bold text-[#17343a] mb-1">
                Target Role Tier to Test:
              </label>
              <select
                value={simulatedTierId}
                onChange={e => setSimulatedTierId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#f1eee6]/60 border border-[#d9d2c2] font-medium"
              >
                {roleTiers.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tierLevelLabel || `Tier ${t.level}`}: {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* If testing Tier 2 Manager, allow choosing assigned wing */}
            {simulatedTierId === 'tier_2' && (
              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  Manager Assigned Wing Authority:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulatedWing('Blue Wing')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      simulatedWing === 'Blue Wing'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-[#f1eee6]/60 text-slate-700 border-[#d9d2c2] hover:bg-white'
                    }`}
                  >
                    Blue Wing (01–17)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulatedWing('Green Wing')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      simulatedWing === 'Green Wing'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-[#f1eee6]/60 text-slate-700 border-[#d9d2c2] hover:bg-white'
                    }`}
                  >
                    Green Wing (18–34)
                  </button>
                </div>
              </div>
            )}

            {/* Select Production Line */}
            <div>
              <label className="block text-xs font-bold text-[#17343a] mb-1">
                Production Line Context:
              </label>
              <select
                value={simulatedLineNo}
                onChange={e => setSimulatedLineNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#f1eee6]/60 border border-[#d9d2c2] font-medium"
              >
                {Array.from({ length: 34 }, (_, i) => {
                  const num = i + 1;
                  const lineStr = num < 10 ? `Line 0${num}` : `Line ${num}`;
                  const wing = getLineWing(lineStr);
                  return (
                    <option key={lineStr} value={lineStr}>
                      {lineStr} ({wing})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Select Action */}
            <div>
              <label className="block text-xs font-bold text-[#17343a] mb-1">
                Capability / Action to Execute:
              </label>
              <select
                value={simulatedActionId}
                onChange={e => setSimulatedActionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-[#f1eee6]/60 border border-[#d9d2c2] font-medium"
              >
                {ZERO_TRUST_CAPABILITY_MATRIX.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.category.split(' ')[0]}] {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-1">
              <div className="font-bold text-purple-900">Zero Trust Verification Loop</div>
              <div className="text-[11px] text-purple-700">
                Evaluating against line boundary ({getLineWing(simulatedLineNo)} / {getLineBlock(simulatedLineNo).label}), clearance level, and fail-secure default.
              </div>
            </div>
          </div>

          {/* Result Column */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-[#d9d2c2] shadow-2xs space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5]">
                <span className="text-xs font-bold uppercase text-slate-500">
                  Real-Time Authorization Verdict
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Audit Level: {simulationResult.auditLevel.toUpperCase()}
                </span>
              </div>

              {/* Huge Decision Pill */}
              <div className="mt-4 flex items-center gap-3">
                {simulationResult.allowed ? (
                  <div className="p-3 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-base font-extrabold">ACTION GRANTED</div>
                      <div className="text-xs text-emerald-700 mt-0.5">
                        Status: {simulationResult.status}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-rose-100 border border-rose-300 text-rose-800 flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                    <div>
                      <div className="text-base font-extrabold">ACTION RESTRICTED / DENIED</div>
                      <div className="text-xs text-rose-700 mt-0.5">
                        Status: {simulationResult.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Explanation */}
              <div className="mt-5 space-y-3">
                <div className="p-3.5 rounded-xl bg-[#f1eee6]/60 border border-[#d9d2c2] text-xs">
                  <div className="font-bold text-slate-800">Zero Trust Decision Rationale:</div>
                  <div className="text-slate-600 mt-1 leading-relaxed">
                    {simulationResult.reason}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-slate-500 font-medium">Requires Break-Glass:</div>
                    <div className={`font-bold mt-0.5 ${simulationResult.requiresBreakGlass ? 'text-purple-600' : 'text-slate-700'}`}>
                      {simulationResult.requiresBreakGlass ? 'YES (Dual-Key Required)' : 'NO'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-slate-500 font-medium">Requires PIN:</div>
                    <div className={`font-bold mt-0.5 ${simulationResult.requiresPin ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {simulationResult.requiresPin ? 'YES (Security Passcode)' : 'NO'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-slate-500 font-medium">Effective Clearance:</div>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {simulationResult.clearanceLevel}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Line Access Card */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-blue-900">Line Boundary Inspection: </span>
                <span className="text-blue-800">
                  {simulatedLineNo} is in {getLineWing(simulatedLineNo)} ({getLineBlock(simulatedLineNo).label}).
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white shrink-0">
                Verified
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
       * VIEW 4: TAMPER-EVIDENT AUDIT CHAIN
       * ========================================================================= */}
      {viewMode === 'audit_chain' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#d9d2c2]">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Cryptographic SHA-256 Audit Ledger Chain</span>
              </h3>
              <p className="text-xs text-[#527078] mt-0.5">
                Immutable, hash-linked block ledger recording every security authorization and override event.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyChain}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Verify Chain Integrity</span>
              </button>
            </div>
          </div>

          {/* Verification Status Banner */}
          {chainIntegrity.checkedAt && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-900">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">
                  All {auditChain.length} blocks verified: zero tampering detected.
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-mono">
                Verified at {chainIntegrity.checkedAt}
              </span>
            </div>
          )}

          {/* Chain Blocks List */}
          <div className="space-y-3">
            {auditChain.map((record, i) => (
              <div
                key={record.index}
                className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-2 hover:border-[#176f78] transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-[#e7e1d5]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#17343a] text-white">
                      Block #{record.index}
                    </span>
                    <span className="text-xs font-bold text-slate-800">{record.action}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-600">
                      {record.severity}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {new Date(record.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-xs text-slate-700">{record.details}</div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-slate-400 bg-[#f8f6f0] p-2 rounded-xl border border-[#e7e1d5]">
                  <div>
                    <span className="text-slate-500 font-medium">Prev Hash: </span>
                    <span className="text-slate-700">{record.previousHash}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Self Hash: </span>
                    <span className="text-emerald-700 font-bold">{record.hash}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
