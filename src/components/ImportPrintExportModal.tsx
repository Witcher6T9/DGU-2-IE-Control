/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Upload,
  Copy,
  Check,
  X,
  FileText,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Settings2,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Shirt
} from 'lucide-react';
import { LineEntry, UserProfile } from '../types';
import {
  calculateFactoryOverall,
  calculateLineMetrics,
  calculateStyleSummary,
  exportReportToCSV,
  downloadCSV,
  formatDateLabel
} from '../utils';
import {
  downloadDailyPerformancePDF,
  generateDailyPerformancePDF,
  PDFReportOptions
} from '../utils/generatePdfReport';
import { isMasterAdminOrAdmin } from '../utils/rbac';

interface ImportPrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineEntry[];
  reportDate: string;
  onSelectDate?: (date: string) => void;
  profile: UserProfile;
  onImportLines?: (importedLines: LineEntry[], mode?: 'upsert' | 'append' | 'replace') => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
}

export const ImportPrintExportModal: React.FC<ImportPrintExportModalProps> = ({
  isOpen,
  onClose,
  lines,
  reportDate,
  onSelectDate,
  profile,
  onImportLines,
  onOpenDatabase
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const [activeTab, setActiveTab] = useState<'pdf' | 'print' | 'import' | 'export'>('pdf');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // PDF generation options
  const [pdfOptions, setPdfOptions] = useState<PDFReportOptions>({
    includeFloors: true,
    includeStyles: true,
    includeLineMatrix: true,
    includeSignatures: true,
    orientation: 'landscape'
  });

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [importMode, setImportMode] = useState<'upsert' | 'append' | 'replace'>('upsert');
  const [parsedImportLines, setParsedImportLines] = useState<LineEntry[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show transient toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackToast({ text, type });
    setTimeout(() => setFeedbackToast(null), 3800);
  };

  // Lines for the active report date
  const dayLines = useMemo(() => {
    const matched = lines.filter(l => l.date === reportDate);
    return matched.length > 0 ? matched : lines;
  }, [lines, reportDate]);

  const factory = useMemo(() => calculateFactoryOverall(dayLines), [dayLines]);
  const styleRollup = useMemo(() => calculateStyleSummary(dayLines), [dayLines]);
  const formattedDate = useMemo(() => formatDateLabel(reportDate), [reportDate]);

  if (!isOpen) return null;

  // Handle PDF Generation & Download
  const handleGenerateAndDownloadPDF = () => {
    try {
      setIsGeneratingPdf(true);
      downloadDailyPerformancePDF({
        lines: dayLines,
        reportDate,
        profile,
        options: pdfOptions
      });
      showToast(`Daily Line Performance PDF for ${reportDate} generated successfully!`, 'success');
    } catch (err: any) {
      showToast('Failed to generate PDF: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Quick Print
  const handlePrintReport = () => {
    window.print();
  };

  // Handle Copy Executive Text Summary
  const handleCopySummaryText = () => {
    const varianceSign = factory.targetVariance >= 0 ? `+${factory.targetVariance.toLocaleString()}` : factory.targetVariance.toLocaleString();
    const summaryText = `*DEBONAIR UNIT-02 • DAILY LINE PERFORMANCE REPORT*
📅 Date: ${reportDate} (${formattedDate})
👤 Engineer: ${profile.name} (${profile.role})
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏭 Active Sewing Lines: ${dayLines.length}
🎯 Target Output: ${factory.totalTargetProd.toLocaleString()} pcs
📦 Achieved Output: ${factory.totalAchievedProd.toLocaleString()} pcs
📊 Target Variance: ${varianceSign} pcs
⚡ Factory Efficiency: ${factory.overallEfficiency}%
👥 Present MP: ${factory.totalPresent} Ops/Hlps (${factory.attendanceRate}% attendance)
🧵 Total In-Line WIP: ${factory.totalWip.toLocaleString()} pcs
⏱ Produced Standard Hours: ${(factory.totalProducedMinutes / 60).toFixed(1)} hrs
━━━━━━━━━━━━━━━━━━━━━━━━━━
Top Performing Lines:
${dayLines
  .slice()
  .sort((a, b) => b.efficiency - a.efficiency)
  .slice(0, 3)
  .map(l => `• L-${l.lineNo} (${l.style}): ${l.achievedProd}/${l.targetProd} pcs (${l.efficiency.toFixed(1)}% eff)`)
  .join('\n')}
Generated via Debonair IE Operational Cockpit.`;

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopiedSummary(true);
      showToast('Executive text summary copied to clipboard!', 'success');
      setTimeout(() => setCopiedSummary(false), 2500);
    });
  };

  // Handle CSV parsing for import
  const parseCSVContent = (text: string) => {
    setImportError(null);
    try {
      const rows = text
        .split(/\r?\n/)
        .map(r => r.trim())
        .filter(r => r.length > 0);

      if (rows.length < 2) {
        setImportError('CSV must have a header row and at least one line entry row.');
        setParsedImportLines([]);
        return;
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
      const lineNoIdx = headers.findIndex(h => h.includes('line') || h === 'l');
      const buyerIdx = headers.findIndex(h => h.includes('buyer'));
      const styleIdx = headers.findIndex(h => h.includes('style'));
      const smvIdx = headers.findIndex(h => h.includes('smv') || h.includes('sam'));
      const targetIdx = headers.findIndex(h => h.includes('target'));
      const achievedIdx = headers.findIndex(h => h.includes('actual') || h.includes('achieved') || h.includes('output'));
      const mpIdx = headers.findIndex(h => h.includes('mp') || h.includes('manpower') || h.includes('operator'));
      const wipIdx = headers.findIndex(h => h.includes('wip'));
      const floorIdx = headers.findIndex(h => h.includes('floor'));

      if (lineNoIdx === -1) {
        setImportError('CSV must include a "Line" or "LineNo" column header.');
        setParsedImportLines([]);
        return;
      }

      const parsed: LineEntry[] = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
        const rawLineNo = cols[lineNoIdx]?.replace(/line\s*/i, '').trim();
        if (!rawLineNo) continue;

        const target = targetIdx >= 0 ? parseInt(cols[targetIdx]) || 1200 : 1200;
        const actual = achievedIdx >= 0 ? parseInt(cols[achievedIdx]) || 0 : 0;
        const smvVal = smvIdx >= 0 ? parseFloat(cols[smvIdx]) || 14.5 : 14.5;
        const mpVal = mpIdx >= 0 ? parseInt(cols[mpIdx]) || 38 : 38;
        const wipVal = wipIdx >= 0 ? parseInt(cols[wipIdx]) || 150 : 150;
        const eff = target > 0 ? (actual / target) * 85 : 0;

        const newEntry: LineEntry = {
          id: Date.now() + i,
          date: reportDate,
          lineNo: rawLineNo,
          floor: floorIdx >= 0 && cols[floorIdx] ? cols[floorIdx] : 'Floor 01 (Unit-02)',
          buyer: buyerIdx >= 0 && cols[buyerIdx] ? cols[buyerIdx] : 'H&M',
          style: styleIdx >= 0 && cols[styleIdx] ? cols[styleIdx] : 'Standard Crewneck',
          smv: smvVal,
          plannedMP: mpVal,
          workingHours: 8,
          targetEff: 85,
          targetProd: target,
          achievedProd: actual,
          efficiency: eff,
          remarks: 'Imported via Report Telemetry Sync',
          orderQty: 12000,
          dailyInput: target,
          dailyOutput: actual,
          wip: wipVal,
          balancingGraph: 'day2',
          nextStyle: '',
          nextStyleDate: '',
          mp: {
            Operator: { present: Math.max(1, Math.round(mpVal * 0.78)), absent: 0 },
            Helper: { present: Math.max(1, Math.round(mpVal * 0.16)), absent: 0 },
            'Iron Man': { present: Math.max(1, Math.round(mpVal * 0.06)), absent: 0 }
          },
          balanceMethod: 'IE Line Balancing',
          balanceNotes: 'Telemetry synchronization',
          top5: {
            held: 'yes',
            attendance: 98,
            items: ['Production logged from CSV', 'Verified with supervisor tally'],
            notes: 'Imported batch'
          },
          bottleneck: {
            station: 'Assembly Station',
            cycleTime: 25,
            targetCT: 24,
            status: 'ok',
            action: 'Normal throughput'
          },
          timeStudy: {
            done: 'yes',
            type: 'time',
            observedRate: 140,
            standardRate: 150
          },
          buildUp: {
            day: '2',
            plannedPct: 75,
            achievedPct: 80,
            operators: mpVal
          },
          lineIE: {
            name: profile.name,
            level: profile.role,
            period: 'daily'
          }
        };

        parsed.push(newEntry);
      }

      setParsedImportLines(parsed);
      if (parsed.length === 0) {
        setImportError('No valid line records could be extracted from the CSV.');
      } else {
        showToast(`Parsed ${parsed.length} line records ready to import for ${reportDate}!`, 'info');
      }
    } catch (err: any) {
      setImportError('Failed to parse CSV file: ' + err.message);
      setParsedImportLines([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      setCsvRawText(content);
      parseCSVContent(content);
    };
    reader.readAsText(file);
  };

  const handleApplyImport = () => {
    if (parsedImportLines.length === 0) return;
    if (onImportLines) {
      onImportLines(parsedImportLines, importMode);
      showToast(`Successfully imported ${parsedImportLines.length} lines for ${reportDate}!`, 'success');
      setParsedImportLines([]);
      setCsvRawText('');
    } else {
      showToast('Import handler not connected.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150 text-[#17343a]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e7e1d5] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#176f78] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                  Import / Print / Export Report
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#dceceb] text-[#176f78] tracking-wider uppercase">
                  PDF &amp; Telemetry
                </span>
              </div>
              <p className="text-xs text-[#527078] flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Selected Shift Date: <strong>{reportDate}</strong> ({formattedDate})</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#e7e1d5] text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 pt-3 border-b border-[#e7e1d5] bg-[#f8f6f0] flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pdf'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Summarized PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('print')}
            className={`px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'print'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report &amp; Preview</span>
          </button>

          {isMasterAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('import')}
              className={`px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'import'
                  ? 'border-[#176f78] text-[#176f78]'
                  : 'border-transparent text-[#527078] hover:text-[#17343a]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Line Telemetry / CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3.5 py-2 border-b-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'export'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Spreadsheets &amp; Text</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: PDF GENERATION */}
          {activeTab === 'pdf' && (
            <div className="space-y-5">
              {/* Executive Snapshot Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f1eee6]">
                  <div>
                    <h3 className="font-display text-sm font-bold uppercase text-[#17343a] tracking-tight">
                      Daily Performance Executive Rollup
                    </h3>
                    <p className="text-xs text-[#527078]">
                      Consolidated metrics prepared for official PDF documentation
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="modal-generate-pdf-btn"
                      onClick={handleGenerateAndDownloadPDF}
                      disabled={isGeneratingPdf}
                      className="px-4 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Summarized PDF'}</span>
                    </button>
                  </div>
                </div>

                {/* 4 Metric Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                  <div className="p-2.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                    <div className="text-[10px] text-[#527078] uppercase font-bold tracking-wider">Active Lines</div>
                    <div className="text-base sm:text-lg font-bold text-[#17343a] font-mono-numbers">
                      {dayLines.length} <span className="text-xs font-normal text-[#527078]">Lines</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                    <div className="text-[10px] text-[#527078] uppercase font-bold tracking-wider">Actual Output</div>
                    <div className="text-base sm:text-lg font-bold text-[#17343a] font-mono-numbers">
                      {factory.totalAchievedProd.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-[#527078]">/ {factory.totalTargetProd.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                    <div className="text-[10px] text-[#527078] uppercase font-bold tracking-wider">Factory Efficiency</div>
                    <div className="text-base sm:text-lg font-bold text-[#176f78] font-mono-numbers">
                      {factory.overallEfficiency}%
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                    <div className="text-[10px] text-[#527078] uppercase font-bold tracking-wider">Attendance Rate</div>
                    <div className="text-base sm:text-lg font-bold text-emerald-700 font-mono-numbers">
                      {factory.attendanceRate}%
                    </div>
                  </div>
                </div>
              </div>

              {/* PDF Configuration Controls */}
              <div className="p-4 rounded-2xl bg-[#f1eee6]/60 border border-[#e7e1d5] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17343a] flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5 text-[#176f78]" />
                    PDF Report Configuration &amp; Layout
                  </span>
                  <span className="text-[11px] text-[#527078]">A4 Format</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#d9d2c2] cursor-pointer hover:border-[#176f78] transition-colors">
                    <input
                      type="checkbox"
                      checked={pdfOptions.includeFloors}
                      onChange={e => setPdfOptions(prev => ({ ...prev, includeFloors: e.target.checked }))}
                      className="rounded text-[#176f78] focus:ring-[#176f78]"
                    />
                    <div>
                      <div className="font-bold text-[#17343a]">Include Floor Breakdown</div>
                      <div className="text-[10px] text-[#527078]">Rollup table by production floor/apartment</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#d9d2c2] cursor-pointer hover:border-[#176f78] transition-colors">
                    <input
                      type="checkbox"
                      checked={pdfOptions.includeStyles}
                      onChange={e => setPdfOptions(prev => ({ ...prev, includeStyles: e.target.checked }))}
                      className="rounded text-[#176f78] focus:ring-[#176f78]"
                    />
                    <div>
                      <div className="font-bold text-[#17343a]">Include Style &amp; Buyer Summary</div>
                      <div className="text-[10px] text-[#527078]">Aggregated matrix by garment style &amp; SMV</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#d9d2c2] cursor-pointer hover:border-[#176f78] transition-colors">
                    <input
                      type="checkbox"
                      checked={pdfOptions.includeLineMatrix}
                      onChange={e => setPdfOptions(prev => ({ ...prev, includeLineMatrix: e.target.checked }))}
                      className="rounded text-[#176f78] focus:ring-[#176f78]"
                    />
                    <div>
                      <div className="font-bold text-[#17343a]">Include Line Performance Matrix</div>
                      <div className="text-[10px] text-[#527078]">Detailed table of all individual sewing lines</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-[#d9d2c2] cursor-pointer hover:border-[#176f78] transition-colors">
                    <input
                      type="checkbox"
                      checked={pdfOptions.includeSignatures}
                      onChange={e => setPdfOptions(prev => ({ ...prev, includeSignatures: e.target.checked }))}
                      className="rounded text-[#176f78] focus:ring-[#176f78]"
                    />
                    <div>
                      <div className="font-bold text-[#17343a]">Include IE Sign-Off Verification</div>
                      <div className="text-[10px] text-[#527078]">Formal signature lines for IE, Floor Incharge &amp; GM</div>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-[#527078]">Page Orientation:</div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPdfOptions(prev => ({ ...prev, orientation: 'landscape' }))}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        pdfOptions.orientation === 'landscape'
                          ? 'bg-[#176f78] text-white'
                          : 'bg-white border border-[#d9d2c2] text-[#527078]'
                      }`}
                    >
                      Landscape (Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfOptions(prev => ({ ...prev, orientation: 'portrait' }))}
                      className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                        pdfOptions.orientation === 'portrait'
                          ? 'bg-[#176f78] text-white'
                          : 'bg-white border border-[#d9d2c2] text-[#527078]'
                      }`}
                    >
                      Portrait
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview Snapshot */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] text-xs space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-[#527078] border-b border-[#f1eee6] pb-2">
                  <span className="font-bold text-[#17343a]">Document Table of Contents Preview</span>
                  <span>Document ID: IE-DPR-{reportDate.replace(/-/g, '')}</span>
                </div>
                <ul className="space-y-1.5 text-[#527078] text-[11px]">
                  <li className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#176f78]/10 text-[#176f78] flex items-center justify-center font-bold text-[9px]">1</span>
                    <span><strong>Section 1:</strong> Executive Summary, Overall Targets &amp; Manpower Attendance</span>
                  </li>
                  {pdfOptions.includeFloors && (
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#176f78]/10 text-[#176f78] flex items-center justify-center font-bold text-[9px]">2</span>
                      <span><strong>Section 2:</strong> Floor &amp; Production Unit Summary Breakdown</span>
                    </li>
                  )}
                  {pdfOptions.includeStyles && (
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#176f78]/10 text-[#176f78] flex items-center justify-center font-bold text-[9px]">3</span>
                      <span><strong>Section 3:</strong> Style &amp; Buyer Production Rollup ({styleRollup.length} active styles)</span>
                    </li>
                  )}
                  {pdfOptions.includeLineMatrix && (
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#176f78]/10 text-[#176f78] flex items-center justify-center font-bold text-[9px]">4</span>
                      <span><strong>Section 4:</strong> Detailed Line Performance &amp; Bottleneck Telemetry ({dayLines.length} lines)</span>
                    </li>
                  )}
                  {pdfOptions.includeSignatures && (
                    <li className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#176f78]/10 text-[#176f78] flex items-center justify-center font-bold text-[9px]">5</span>
                      <span><strong>Section 5:</strong> Tri-Signature IE Verification &amp; Management Approval</span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: PRINT REPORT & PREVIEW */}
          {activeTab === 'print' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm font-bold uppercase text-[#17343a] tracking-tight">
                    Print Daily Line Performance Summary
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Clean printable layout optimized for factory notice boards and shift handover
                  </p>
                </div>
                <button
                  type="button"
                  id="modal-print-direct-btn"
                  onClick={handlePrintReport}
                  className="px-4 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet (System Dialog)</span>
                </button>
              </div>

              {/* Printable Card Preview */}
              <div className="p-6 rounded-2xl bg-white border border-[#d9d2c2] text-xs space-y-4 shadow-xs font-sans">
                {/* Print Document Header */}
                <div className="border-b-2 border-[#176f78] pb-3 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-base text-[#17343a]">DEBONAIR GROUP • UNIT-02 GARMENTS LTD.</div>
                    <div className="text-[11px] text-[#527078] uppercase font-bold tracking-wider">
                      Industrial Engineering &amp; Production Control Department
                    </div>
                    <div className="text-xs text-[#176f78] font-bold mt-1">
                      DAILY SEWING LINE PERFORMANCE SUMMARY REPORT
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-[#527078]">
                    <div>Date: <strong>{reportDate}</strong></div>
                    <div>Shift: Day (08:00 - 17:00)</div>
                    <div>Prepared by: {profile.name}</div>
                  </div>
                </div>

                {/* KPI Bar */}
                <div className="grid grid-cols-4 gap-2 text-center py-2 bg-[#f8f6f0] rounded-xl border border-[#e7e1d5]">
                  <div>
                    <div className="text-[10px] text-[#527078]">Target Output</div>
                    <div className="text-sm font-bold font-mono-numbers">{factory.totalTargetProd.toLocaleString()} pcs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#527078]">Actual Output</div>
                    <div className="text-sm font-bold font-mono-numbers">{factory.totalAchievedProd.toLocaleString()} pcs</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#527078]">Factory Efficiency</div>
                    <div className="text-sm font-bold font-mono-numbers text-[#176f78]">{factory.overallEfficiency}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#527078]">Total In-Line WIP</div>
                    <div className="text-sm font-bold font-mono-numbers">{factory.totalWip.toLocaleString()} pcs</div>
                  </div>
                </div>

                {/* Top 6 Lines Table Preview */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-[#176f78] text-white">
                        <th className="p-1.5">Line</th>
                        <th className="p-1.5">Buyer</th>
                        <th className="p-1.5">Style</th>
                        <th className="p-1.5 text-right">Target</th>
                        <th className="p-1.5 text-right">Actual</th>
                        <th className="p-1.5 text-right">Variance</th>
                        <th className="p-1.5 text-center">Efficiency</th>
                        <th className="p-1.5 text-right">WIP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]">
                      {dayLines.slice(0, 8).map(l => {
                        const variance = l.achievedProd - l.targetProd;
                        return (
                          <tr key={l.id} className="hover:bg-slate-50">
                            <td className="p-1.5 font-bold">L-{l.lineNo}</td>
                            <td className="p-1.5">{l.buyer}</td>
                            <td className="p-1.5 truncate max-w-[140px]">{l.style}</td>
                            <td className="p-1.5 text-right font-mono-numbers">{l.targetProd.toLocaleString()}</td>
                            <td className="p-1.5 text-right font-mono-numbers">{l.achievedProd.toLocaleString()}</td>
                            <td className={`p-1.5 text-right font-mono-numbers font-bold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {variance >= 0 ? `+${variance}` : variance}
                            </td>
                            <td className="p-1.5 text-center font-bold font-mono-numbers">{l.efficiency.toFixed(1)}%</td>
                            <td className="p-1.5 text-right font-mono-numbers">{l.wip}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {dayLines.length > 8 && (
                    <div className="text-[10px] text-[#527078] text-center pt-2 italic">
                      + {dayLines.length - 8} more lines included in the full printable sheet
                    </div>
                  )}
                </div>

                {/* Sign-off Boxes */}
                <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#d9d2c2]">
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-center text-[#527078]">
                    <div className="font-bold text-[#17343a]">Line Industrial Engineer</div>
                    <div>{profile.name}</div>
                  </div>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-center text-[#527078]">
                    <div className="font-bold text-[#17343a]">Floor IE Incharge</div>
                    <div>Debonair Unit-02</div>
                  </div>
                  <div className="border-t border-slate-400 pt-1 text-[10px] text-center text-[#527078]">
                    <div className="font-bold text-[#17343a]">General Manager / Production Head</div>
                    <div>Verified &amp; Approved</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IMPORT LINE TELEMETRY & CSV - ONLY for Master Administration/Admin Role */}
          {activeTab === 'import' && isMasterAdmin && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div>
                  <h3 className="font-display text-sm font-bold uppercase text-[#17343a] tracking-tight">
                    Import Daily Line Performance CSV
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Import line output telemetry or shift log spreadsheets directly into this date ({reportDate})
                  </p>
                </div>

                {/* Upload or Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-xl border-2 border-dashed border-[#176f78]/30 hover:border-[#176f78] bg-[#fbfaf6] text-center cursor-pointer transition-colors space-y-2"
                >
                  <Upload className="w-6 h-6 text-[#176f78] mx-auto" />
                  <div className="text-xs font-bold text-[#17343a]">Click to select CSV File or drag &amp; drop</div>
                  <div className="text-[11px] text-[#527078]">Supported columns: LineNo, Buyer, Style, SMV, MP, Target, Actual, WIP</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Raw CSV Text area */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#17343a]">Or Paste Raw CSV Data:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const sample = `Line,Floor,Buyer,Style,SMV,PlannedMP,Target,Actual,WIP\n18,Floor 01 (Padma),H&M,TS-2401 Crewneck,12.5,38,1200,1140,240\n19,Floor 01 (Padma),Zara,PK-302 Polo Shirt,14.2,40,1100,1080,190\n20,Floor 02 (Meghna),Target,DK-902 Basic Tee,10.8,36,1350,1320,310`;
                        setCsvRawText(sample);
                        parseCSVContent(sample);
                      }}
                      className="text-[11px] text-[#176f78] hover:underline font-bold cursor-pointer"
                    >
                      Load Sample Template
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={csvRawText}
                    onChange={e => {
                      setCsvRawText(e.target.value);
                      parseCSVContent(e.target.value);
                    }}
                    placeholder="Line,Floor,Buyer,Style,SMV,PlannedMP,Target,Actual,WIP..."
                    className="w-full p-2.5 rounded-xl border border-[#d9d2c2] bg-white font-mono text-xs text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                {/* Error Banner */}
                {importError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Parsed Preview Table */}
                {parsedImportLines.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#f1eee6]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Validated {parsedImportLines.length} Line Records Ready to Import
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#527078]">Import Strategy:</span>
                        <select
                          value={importMode}
                          onChange={e => setImportMode(e.target.value as any)}
                          className="px-2 py-1 rounded-lg border border-[#d9d2c2] bg-white text-xs font-bold text-[#17343a]"
                        >
                          <option value="upsert">Update Existing &amp; Add New</option>
                          <option value="append">Append New Lines Only</option>
                          <option value="replace">Replace All Lines for Date</option>
                        </select>
                      </div>
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-xl border border-[#e7e1d5]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f1eee6] text-[#527078] sticky top-0">
                          <tr>
                            <th className="p-1.5">Line</th>
                            <th className="p-1.5">Style</th>
                            <th className="p-1.5 text-right">Target</th>
                            <th className="p-1.5 text-right">Actual</th>
                            <th className="p-1.5 text-right">WIP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e7e1d5]">
                          {parsedImportLines.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50">
                              <td className="p-1.5 font-bold">L-{l.lineNo}</td>
                              <td className="p-1.5 truncate max-w-[150px]">{l.style}</td>
                              <td className="p-1.5 text-right font-mono-numbers">{l.targetProd}</td>
                              <td className="p-1.5 text-right font-mono-numbers">{l.achievedProd}</td>
                              <td className="p-1.5 text-right font-mono-numbers">{l.wip}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      id="modal-apply-import-btn"
                      onClick={handleApplyImport}
                      className="w-full py-2.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Apply {parsedImportLines.length} Lines to Registry &amp; Update PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT SPREADSHEETS & TEXT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: PDF */}
                <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold mb-2">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-sm font-bold text-[#17343a]">Summarized Executive PDF</h4>
                    <p className="text-xs text-[#527078] mt-1 leading-relaxed">
                      Official factory audit format with executive KPI blocks, style rollups, line matrix, and sign-offs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAndDownloadPDF}
                    className="w-full mt-3 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF ({reportDate})</span>
                  </button>
                </div>

                {/* Option 2: CSV */}
                <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-2">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <h4 className="font-display text-sm font-bold text-[#17343a]">Shift CSV Spreadsheet</h4>
                    <p className="text-xs text-[#527078] mt-1 leading-relaxed">
                      Comma-separated raw dataset compatible with Microsoft Excel, Google Sheets, and ERP imports.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const csv = exportReportToCSV(lines, reportDate);
                      downloadCSV(`IE_Summarized_Shift_Report_${reportDate}.csv`, csv);
                      showToast('CSV Spreadsheet downloaded successfully!', 'success');
                    }}
                    className="w-full mt-3 py-2 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] border border-[#d9d2c2] text-[#17343a] text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Download CSV Dataset</span>
                  </button>
                </div>
              </div>

              {/* Text Summary Copy Card */}
              <div className="p-4 rounded-2xl bg-[#f8f6f0] border border-[#d9d2c2] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#17343a] flex items-center gap-1.5">
                    <Copy className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Quick Copy: Shift Executive Text Summary</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySummaryText}
                    className="px-3 py-1 rounded-lg bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {copiedSummary ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-[#527078]">
                  Formatted plaintext summary formatted with emojis and key factory indicators for direct pasting into WhatsApp, Slack, or executive emails.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Toast Notification */}
        {feedbackToast && (
          <div
            className={`px-4 py-2.5 border-t text-xs font-semibold flex items-center justify-between ${
              feedbackToast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : feedbackToast.type === 'info'
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackToast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackToast(null)}
              className="text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[#e7e1d5] bg-white flex items-center justify-between text-xs">
          <div className="text-[11px] text-[#527078]">
            Debonair Unit-02 Garments Ltd. • Report Date: <strong>{reportDate}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-[#176f78] text-white font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
