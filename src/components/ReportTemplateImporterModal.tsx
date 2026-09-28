/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Check,
  X,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Copy,
  Sliders,
  Settings2,
  Table,
  Eye
} from 'lucide-react';

export interface ReportTemplateConfig {
  id: string;
  name: string;
  description: string;
  author: string;
  category: 'shift_end' | 'attainment' | 'wip_audit' | 'quality' | 'custom';
  columns: {
    lineNo: boolean;
    floor: boolean;
    buyer: boolean;
    style: boolean;
    target: boolean;
    achieved: boolean;
    variance: boolean;
    efficiency: boolean;
    wip: boolean;
    bottleneckStage: boolean;
    cycleTime: boolean;
    action: boolean;
  };
  highlightBottlenecks: boolean;
  wipWarningThreshold: number;
  targetEfficiencyBenchmark: number;
  orientation: 'portrait' | 'landscape';
  defaultSortBy: 'lineNo' | 'efficiency' | 'wip' | 'achieved' | 'bottleneck';
  sortOrder: 'asc' | 'desc';
}

export const PREBUILT_REPORT_TEMPLATES: ReportTemplateConfig[] = [
  {
    id: 'debonair-shift-end-standard',
    name: 'Shift End Management Summary (Standard)',
    description: 'Factory baseline compilation: Final WIP, total achieved output, overall efficiency averages, and Bottleneck Stage Names.',
    author: 'Debonair IE Core',
    category: 'shift_end',
    columns: {
      lineNo: true,
      floor: true,
      buyer: true,
      style: true,
      target: true,
      achieved: true,
      variance: true,
      efficiency: true,
      wip: true,
      bottleneckStage: true,
      cycleTime: true,
      action: true
    },
    highlightBottlenecks: true,
    wipWarningThreshold: 800,
    targetEfficiencyBenchmark: 80,
    orientation: 'landscape',
    defaultSortBy: 'wip',
    sortOrder: 'desc'
  },
  {
    id: 'bottleneck-choke-resolution',
    name: 'Bottleneck Stage & Cycle Time Audit Matrix',
    description: 'Prioritizes line cycle times, station choke names, operator pacing variance, and immediate IE floor countermeasures.',
    author: 'Debonair Work Study Dept.',
    category: 'wip_audit',
    columns: {
      lineNo: true,
      floor: true,
      buyer: false,
      style: true,
      target: true,
      achieved: true,
      variance: true,
      efficiency: true,
      wip: true,
      bottleneckStage: true,
      cycleTime: true,
      action: true
    },
    highlightBottlenecks: true,
    wipWarningThreshold: 600,
    targetEfficiencyBenchmark: 75,
    orientation: 'landscape',
    defaultSortBy: 'bottleneck',
    sortOrder: 'asc'
  },
  {
    id: 'executive-attainment-ledger',
    name: 'Executive Daily Attainment & Variance Ledger',
    description: 'Focuses on production targets, final output attainment, floor-wise contributions, and variance percentages for plant heads.',
    author: 'Operations Director Office',
    category: 'attainment',
    columns: {
      lineNo: true,
      floor: true,
      buyer: true,
      style: true,
      target: true,
      achieved: true,
      variance: true,
      efficiency: true,
      wip: false,
      bottleneckStage: false,
      cycleTime: false,
      action: false
    },
    highlightBottlenecks: false,
    wipWarningThreshold: 1000,
    targetEfficiencyBenchmark: 85,
    orientation: 'portrait',
    defaultSortBy: 'achieved',
    sortOrder: 'desc'
  },
  {
    id: 'wip-flow-synchronization',
    name: 'WIP Buffer & Starvation Sentinel',
    description: 'Monitors minimum and maximum piece buffers across sewing stages to prevent line choking and upstream starvation.',
    author: 'IE Line Balancing Cell',
    category: 'wip_audit',
    columns: {
      lineNo: true,
      floor: true,
      buyer: true,
      style: true,
      target: false,
      achieved: true,
      variance: false,
      efficiency: true,
      wip: true,
      bottleneckStage: true,
      cycleTime: true,
      action: true
    },
    highlightBottlenecks: true,
    wipWarningThreshold: 750,
    targetEfficiencyBenchmark: 78,
    orientation: 'landscape',
    defaultSortBy: 'wip',
    sortOrder: 'desc'
  }
];

interface ReportTemplateImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTemplate: ReportTemplateConfig;
  onApplyTemplate: (template: ReportTemplateConfig) => void;
}

export const ReportTemplateImporterModal: React.FC<ReportTemplateImporterModalProps> = ({
  isOpen,
  onClose,
  activeTemplate,
  onApplyTemplate
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'import' | 'customize' | 'export'>('presets');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(activeTemplate.id);
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [customTemplate, setCustomTemplate] = useState<ReportTemplateConfig>({ ...activeTemplate });
  const [copiedExport, setCopiedExport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (tmpl: ReportTemplateConfig) => {
    setSelectedTemplateId(tmpl.id);
    setCustomTemplate({ ...tmpl });
    onApplyTemplate(tmpl);
    setImportSuccessMsg(`Applied template: "${tmpl.name}"`);
    setTimeout(() => {
      setImportSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setImportJsonText(text);
        validateAndParseTemplate(text);
      } catch (err: any) {
        setImportError(`File read failure: ${err.message || 'Corrupted file'}`);
      }
    };
    reader.readAsText(file);
  };

  const validateAndParseTemplate = (rawJson: string) => {
    setImportError(null);
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed.name || typeof parsed.columns !== 'object') {
        throw new Error('Template must include a "name" string and "columns" map');
      }

      const validated: ReportTemplateConfig = {
        id: parsed.id || `custom-imported-${Date.now()}`,
        name: parsed.name,
        description: parsed.description || 'Imported custom report blueprint',
        author: parsed.author || 'Custom Factory Operator',
        category: 'custom',
        columns: {
          lineNo: parsed.columns.lineNo !== false,
          floor: parsed.columns.floor !== false,
          buyer: parsed.columns.buyer !== false,
          style: parsed.columns.style !== false,
          target: parsed.columns.target !== false,
          achieved: parsed.columns.achieved !== false,
          variance: parsed.columns.variance !== false,
          efficiency: parsed.columns.efficiency !== false,
          wip: parsed.columns.wip !== false,
          bottleneckStage: parsed.columns.bottleneckStage !== false,
          cycleTime: parsed.columns.cycleTime !== false,
          action: parsed.columns.action !== false
        },
        highlightBottlenecks: parsed.highlightBottlenecks !== false,
        wipWarningThreshold: Number(parsed.wipWarningThreshold) || 800,
        targetEfficiencyBenchmark: Number(parsed.targetEfficiencyBenchmark) || 80,
        orientation: parsed.orientation === 'portrait' ? 'portrait' : 'landscape',
        defaultSortBy: parsed.defaultSortBy || 'wip',
        sortOrder: parsed.sortOrder === 'asc' ? 'asc' : 'desc'
      };

      setCustomTemplate(validated);
      onApplyTemplate(validated);
      setImportSuccessMsg(`Successfully imported and activated "${validated.name}"!`);
      setTimeout(() => {
        setImportSuccessMsg(null);
        onClose();
      }, 1400);
    } catch (err: any) {
      setImportError(`Invalid Template Structure: ${err.message}`);
    }
  };

  const handleDownloadTemplateJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customTemplate, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `report_template_${customTemplate.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(customTemplate, null, 2));
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#fbfaf6] dark:bg-[#1a1f26] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#17343a] dark:text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d9d2c2] dark:border-[#2e3846] flex items-center justify-between bg-white dark:bg-[#202732]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Reports Template Importer</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#176f78]/15 text-[#176f78] dark:text-teal-400 font-mono">
                  IE Blueprint
                </span>
              </div>
              <p className="text-xs text-[#527078] dark:text-slate-400">
                Load certified factory shift report templates or import custom JSON formats
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#f1eee6] dark:hover:bg-[#2e3846] text-[#527078] dark:text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-5 pt-3 border-b border-[#d9d2c2] dark:border-[#2e3846] flex gap-2 bg-[#f6f4ee] dark:bg-[#161a20]">
          {[
            { id: 'presets', label: 'Factory Presets', icon: Sparkles },
            { id: 'import', label: 'Import JSON / File', icon: Upload },
            { id: 'customize', label: 'Customize Layout', icon: Sliders },
            { id: 'export', label: 'Export Schema', icon: Download }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#176f78] text-[#176f78] dark:text-teal-400 bg-white dark:bg-[#1a1f26] rounded-t-lg'
                    : 'border-transparent text-[#527078] dark:text-slate-400 hover:text-[#17343a]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notifications / Feedback */}
        {importSuccessMsg && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {importError && (
          <div className="mx-4 sm:mx-5 mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#527078] dark:text-slate-400">
                <span>Select a certified template to update report columns and bottleneck highlights:</span>
                <span className="font-mono text-[11px] font-bold text-[#176f78]">
                  {PREBUILT_REPORT_TEMPLATES.length} Presets Available
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {PREBUILT_REPORT_TEMPLATES.map(tmpl => {
                  const isCurrent = activeTemplate.id === tmpl.id;
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleSelectPreset(tmpl)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? 'border-[#176f78] bg-white dark:bg-[#202732] ring-2 ring-[#176f78]/20 shadow-xs'
                          : 'border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1e242d] hover:border-[#176f78]/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                            {tmpl.name}
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#176f78] text-white">
                              Active
                            </span>
                          )}
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-[#527078] dark:text-slate-300">
                            {tmpl.orientation.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-[#527078] dark:text-slate-400 leading-relaxed">
                          {tmpl.description}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-0.5">
                          <span>Sort: {tmpl.defaultSortBy.toUpperCase()} ({tmpl.sortOrder.toUpperCase()})</span>
                          <span>•</span>
                          <span>WIP Threshold: {tmpl.wipWarningThreshold} pcs</span>
                          <span>•</span>
                          <span>Benchmark: {tmpl.targetEfficiencyBenchmark}% Eff</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPreset(tmpl);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-[#176f78] text-white hover:bg-[#12555c]'
                        }`}
                      >
                        {isCurrent ? 'Re-Apply' : 'Load Template'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT JSON / FILE */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-dashed border-[#176f78] bg-[#176f78]/5 flex flex-col items-center justify-center text-center gap-2">
                <Upload className="w-8 h-8 text-[#176f78]" />
                <div>
                  <p className="text-xs font-bold text-[#17343a] dark:text-slate-200">
                    Upload .json Report Template Blueprint
                  </p>
                  <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                    Drag and drop or browse from local storage
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-xs"
                >
                  Choose File
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Or Paste JSON Template Schema Directly:
                </label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`{\n  "name": "Custom Floor Shift Report",\n  "description": "Shift End Summary with Bottlenecks",\n  "columns": {\n    "wip": true,\n    "achieved": true,\n    "efficiency": true,\n    "bottleneckStage": true\n  }\n}`}
                  className="w-full text-xs font-mono p-3 rounded-xl bg-white dark:bg-[#151a21] border border-[#d9d2c2] dark:border-[#2e3846] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => validateAndParseTemplate(importJsonText)}
                  disabled={!importJsonText.trim()}
                  className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Validate &amp; Activate Template
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMIZE LAYOUT */}
          {activeTab === 'customize' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white dark:bg-[#1e242d] border border-[#d9d2c2] dark:border-[#2e3846] space-y-3">
                <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">
                  Visible Report Columns &amp; Data Fields
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(customTemplate.columns).map(([colKey, isEnabled]) => {
                    const labelMap: Record<string, string> = {
                      lineNo: 'Line Number',
                      floor: 'Floor / Wing',
                      buyer: 'Buyer Name',
                      style: 'Style Number',
                      target: 'Target Output',
                      achieved: 'Achieved Output',
                      variance: 'Output Variance',
                      efficiency: 'Overall Efficiency %',
                      wip: 'Final WIP Status',
                      bottleneckStage: 'Bottle Neck Stage (Name)',
                      cycleTime: 'Cycle Time vs Target',
                      action: 'IE Floor Actions'
                    };
                    return (
                      <label
                        key={colKey}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          isEnabled
                            ? 'bg-[#176f78]/10 border-[#176f78]/40 text-[#176f78] dark:text-teal-300 font-bold'
                            : 'bg-[#fbfaf6] dark:bg-[#151a21] border-[#d9d2c2] dark:border-[#2e3846] text-slate-500'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => {
                            setCustomTemplate(prev => ({
                              ...prev,
                              columns: {
                                ...prev.columns,
                                [colKey]: e.target.checked
                              }
                            }));
                          }}
                          className="w-3.5 h-3.5 rounded text-[#176f78] focus:ring-[#176f78]"
                        />
                        <span className="truncate">{labelMap[colKey] || colKey}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white dark:bg-[#1e242d] border border-[#d9d2c2] dark:border-[#2e3846] space-y-2">
                  <label className="block text-xs font-bold text-[#17343a] dark:text-slate-100">
                    High WIP Alert Threshold
                  </label>
                  <input
                    type="number"
                    value={customTemplate.wipWarningThreshold}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, wipWarningThreshold: Number(e.target.value) || 800 }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#151a21] font-mono"
                  />
                  <p className="text-[10px] text-[#527078] dark:text-slate-400">
                    Lines exceeding this WIP buffer show amber warning tags.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#1e242d] border border-[#d9d2c2] dark:border-[#2e3846] space-y-2">
                  <label className="block text-xs font-bold text-[#17343a] dark:text-slate-100">
                    Default Sort Column
                  </label>
                  <select
                    value={customTemplate.defaultSortBy}
                    onChange={(e) => setCustomTemplate(prev => ({ ...prev, defaultSortBy: e.target.value as any }))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#151a21]"
                  >
                    <option value="wip">Final WIP (Highest Buffer First)</option>
                    <option value="achieved">Achieved Output (Most Units First)</option>
                    <option value="efficiency">Efficiency (Lowest Efficiency First)</option>
                    <option value="bottleneck">Bottleneck Stage (Active Alerts First)</option>
                    <option value="lineNo">Line Number (01 to 34)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onApplyTemplate(customTemplate);
                    setImportSuccessMsg('Updated custom template configuration applied live!');
                    setTimeout(() => {
                      setImportSuccessMsg(null);
                      onClose();
                    }, 1200);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-xs"
                >
                  Apply Custom Template
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT SCHEMA */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#1e242d] border border-[#d9d2c2] dark:border-[#2e3846] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">
                    Current Active Template JSON Blueprint
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 text-xs font-bold text-[#176f78] dark:text-teal-400 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedExport ? 'Copied!' : 'Copy Schema'}</span>
                  </button>
                </div>
                <pre className="p-3 rounded-lg bg-slate-900 text-teal-300 text-[11px] font-mono overflow-x-auto max-h-56">
                  {JSON.stringify(customTemplate, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplateJson}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json Template File</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#202732] flex items-center justify-between text-xs text-[#527078] dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-[#17343a] dark:text-slate-200">
              Active: {activeTemplate.name}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] text-xs font-bold hover:bg-[#f1eee6] dark:hover:bg-[#2e3846] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
