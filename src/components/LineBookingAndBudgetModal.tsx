/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Line Booking for Upcoming Styles & Monthly Operating Budget Management Hub
 * Comprehensive Import, Export, Validation, and Synchronization Interface
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  DollarSign,
  Upload,
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Filter,
  Layers,
  Shirt,
  Sparkles,
  RefreshCw,
  FileText,
  Clock,
  TrendingUp,
  TrendingDown,
  Building2,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { LineBookingRecord, MonthlyBudgetRecord, LineEntry, UserProfile } from '../types';
import {
  parseLineBookingFromTextOrBuffer,
  exportLineBookingsToCSV,
  generateLineBookingTemplateCSV,
  parseMonthlyBudgetFromTextOrBuffer,
  exportMonthlyBudgetsToCSV,
  generateMonthlyBudgetTemplateCSV,
  downloadTextAsFile,
  loadStoredLineBookings,
  saveStoredLineBookings,
  loadStoredMonthlyBudgets,
  saveStoredMonthlyBudgets
} from '../utils/bookingAndBudgetCsv';
import { isMasterAdminOrAdmin } from '../utils/rbac';

interface LineBookingAndBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'booking' | 'budget';
  lines?: LineEntry[];
  onSyncLinesWithBookings?: (bookings: LineBookingRecord[]) => void;
  profile?: UserProfile;
}

export const LineBookingAndBudgetModal: React.FC<LineBookingAndBudgetModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'booking',
  lines = [],
  onSyncLinesWithBookings,
  profile
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const [activeTab, setActiveTab] = useState<'booking' | 'budget'>(initialTab);

  // Persistent records state
  const [bookings, setBookings] = useState<LineBookingRecord[]>(() => loadStoredLineBookings());
  const [budgets, setBudgets] = useState<MonthlyBudgetRecord[]>(() => loadStoredMonthlyBudgets());

  // Toast notification
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3800);
  };

  /* -------------------------------------------------------------------------- */
  /*                           LINE BOOKINGS FILTERS & STATE                     */
  /* -------------------------------------------------------------------------- */
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFloorFilter, setBookingFloorFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Line Booking Importer Modal State
  const [isBookingImporterOpen, setIsBookingImporterOpen] = useState(false);
  const [bookingImportText, setBookingImportText] = useState('');
  const [bookingImportMode, setBookingImportMode] = useState<'upsert' | 'replace' | 'append'>('upsert');
  const [syncToLiveLinesOnImport, setSyncToLiveLinesOnImport] = useState(true);
  const [parsedBookingPreview, setParsedBookingPreview] = useState<LineBookingRecord[]>([]);
  const [bookingImportErrors, setBookingImportErrors] = useState<string[]>([]);
  const [bookingImportWarnings, setBookingImportWarnings] = useState<string[]>([]);
  const bookingFileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Booking State
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [newBooking, setNewBooking] = useState<Partial<LineBookingRecord>>({
    lineNo: 'L01',
    floor: 'Floor 03',
    style: '',
    buyer: 'ZARA',
    orderQty: 20000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
    sam: 18.5,
    plannedOperators: 42,
    plannedHelpers: 8,
    targetEfficiency: 70,
    dailyTarget: 1100,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: ''
  });

  /* -------------------------------------------------------------------------- */
  /*                           MONTHLY BUDGET FILTERS & STATE                   */
  /* -------------------------------------------------------------------------- */
  const [selectedBudgetMonth, setSelectedBudgetMonth] = useState('2026-10');
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState('all');
  const [budgetStatusFilter, setBudgetStatusFilter] = useState('all');

  // Monthly Budget Importer Modal State
  const [isBudgetImporterOpen, setIsBudgetImporterOpen] = useState(false);
  const [budgetImportText, setBudgetImportText] = useState('');
  const [budgetImportMode, setBudgetImportMode] = useState<'upsert' | 'replace' | 'append'>('upsert');
  const [parsedBudgetPreview, setParsedBudgetPreview] = useState<MonthlyBudgetRecord[]>([]);
  const [budgetImportErrors, setBudgetImportErrors] = useState<string[]>([]);
  const [budgetImportWarnings, setBudgetImportWarnings] = useState<string[]>([]);
  const budgetFileInputRef = useRef<HTMLInputElement>(null);

  // Manual Add Budget State
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [newBudget, setNewBudget] = useState<Partial<MonthlyBudgetRecord>>({
    month: selectedBudgetMonth,
    category: 'Direct Labor Wages (Sewing Operators)',
    department: 'Sewing Operations',
    floor: 'All Floors',
    allocatedBudget: 50000,
    actualSpend: 48000,
    status: 'Within Budget',
    responsiblePerson: 'Production Manager',
    notes: ''
  });

  /* -------------------------------------------------------------------------- */
  /*                            COMPUTED METRICS                                */
  /* -------------------------------------------------------------------------- */

  // Unique floors and months
  const availableFloors = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach(b => set.add(b.floor));
    lines.forEach(l => set.add(l.floor));
    return Array.from(set).sort();
  }, [bookings, lines]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    budgets.forEach(b => set.add(b.month));
    set.add('2026-10');
    set.add('2026-09');
    set.add('2026-11');
    return Array.from(set).sort().reverse();
  }, [budgets]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchSearch =
        !bookingSearch.trim() ||
        b.style.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.lineNo.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.buyer.toLowerCase().includes(bookingSearch.toLowerCase()) ||
        b.floor.toLowerCase().includes(bookingSearch.toLowerCase());

      const matchFloor = bookingFloorFilter === 'all' || b.floor.toLowerCase() === bookingFloorFilter.toLowerCase();
      const matchStatus = bookingStatusFilter === 'all' || b.bookingStatus.toLowerCase() === bookingStatusFilter.toLowerCase();

      return matchSearch && matchFloor && matchStatus;
    });
  }, [bookings, bookingSearch, bookingFloorFilter, bookingStatusFilter]);

  // Bookings Summary Metrics
  const bookingSummary = useMemo(() => {
    const totalBookedStyles = bookings.length;
    const totalOrderQty = bookings.reduce((sum, b) => sum + (b.orderQty || 0), 0);
    const uniqueLines = new Set(bookings.map(b => b.lineNo)).size;
    const readyTRCount = bookings.filter(b => b.trSampleStatus === 'Ready').length;
    const trReadyPct = totalBookedStyles > 0 ? Math.round((readyTRCount / totalBookedStyles) * 100) : 0;

    return {
      totalBookedStyles,
      totalOrderQty,
      uniqueLines,
      readyTRCount,
      trReadyPct
    };
  }, [bookings]);

  // Filtered Budgets for active selected month
  const activeMonthBudgets = useMemo(() => {
    return budgets.filter(b => b.month === selectedBudgetMonth);
  }, [budgets, selectedBudgetMonth]);

  const filteredBudgets = useMemo(() => {
    return activeMonthBudgets.filter(b => {
      const matchCat = budgetCategoryFilter === 'all' || b.category.toLowerCase().includes(budgetCategoryFilter.toLowerCase());
      const matchStatus = budgetStatusFilter === 'all' || b.status.toLowerCase() === budgetStatusFilter.toLowerCase();
      return matchCat && matchStatus;
    });
  }, [activeMonthBudgets, budgetCategoryFilter, budgetStatusFilter]);

  // Budget Summary Metrics
  const budgetSummary = useMemo(() => {
    const totalAllocated = activeMonthBudgets.reduce((acc, b) => acc + (b.allocatedBudget || 0), 0);
    const totalActual = activeMonthBudgets.reduce((acc, b) => acc + (b.actualSpend || 0), 0);
    const netVariance = totalAllocated - totalActual;
    const burnPct = totalAllocated > 0 ? Math.round((totalActual / totalAllocated) * 100) : 0;
    const overBudgetCnt = activeMonthBudgets.filter(b => b.status === 'Over Budget').length;
    const warningCnt = activeMonthBudgets.filter(b => b.status === 'Warning').length;

    return {
      totalAllocated,
      totalActual,
      netVariance,
      burnPct,
      overBudgetCnt,
      warningCnt,
      itemCount: activeMonthBudgets.length
    };
  }, [activeMonthBudgets]);

  if (!isOpen) return null;

  /* -------------------------------------------------------------------------- */
  /*                            BOOKING HANDLERS                                */
  /* -------------------------------------------------------------------------- */

  const handleExportBookings = () => {
    try {
      const csv = exportLineBookingsToCSV(bookings);
      downloadTextAsFile(`Debonair_Upcoming_Style_Line_Bookings_${new Date().toISOString().split('T')[0]}.csv`, csv);
      showToast(`Exported ${bookings.length} line booking schedules to CSV.`, 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  };

  const handleDownloadBookingTemplate = () => {
    try {
      const csv = generateLineBookingTemplateCSV();
      downloadTextAsFile('Line_Booking_Upcoming_Styles_Template.csv', csv);
      showToast('Downloaded standard Line Booking CSV Template.', 'info');
    } catch (err: any) {
      showToast(`Template download failed: ${err.message}`, 'error');
    }
  };

  const handleBookingFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result;
      if (!result) return;
      const parseRes = parseLineBookingFromTextOrBuffer(result);
      setParsedBookingPreview(parseRes.bookings);
      setBookingImportErrors(parseRes.errors);
      setBookingImportWarnings(parseRes.warnings);

      if (parseRes.bookings.length > 0) {
        showToast(`Parsed ${parseRes.bookings.length} line booking records! Review and click Apply.`, 'info');
      } else if (parseRes.errors.length > 0) {
        showToast(`Failed to parse file: ${parseRes.errors[0]}`, 'error');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleParseBookingPastedText = () => {
    if (!bookingImportText.trim()) {
      showToast('Please paste CSV text or select a file.', 'error');
      return;
    }
    const parseRes = parseLineBookingFromTextOrBuffer(bookingImportText);
    setParsedBookingPreview(parseRes.bookings);
    setBookingImportErrors(parseRes.errors);
    setBookingImportWarnings(parseRes.warnings);

    if (parseRes.bookings.length > 0) {
      showToast(`Parsed ${parseRes.bookings.length} records from pasted text!`, 'info');
    } else if (parseRes.errors.length > 0) {
      showToast(`Parse error: ${parseRes.errors[0]}`, 'error');
    }
  };

  const handleApplyBookingImport = () => {
    if (parsedBookingPreview.length === 0) return;

    let updatedList: LineBookingRecord[] = [];
    if (bookingImportMode === 'replace') {
      updatedList = parsedBookingPreview;
    } else if (bookingImportMode === 'append') {
      updatedList = [...bookings, ...parsedBookingPreview];
    } else {
      // upsert by lineNo
      const existing = [...bookings];
      parsedBookingPreview.forEach(newItem => {
        const idx = existing.findIndex(
          b => b.lineNo.toLowerCase().trim() === newItem.lineNo.toLowerCase().trim()
        );
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...newItem, id: existing[idx].id };
        } else {
          existing.push(newItem);
        }
      });
      updatedList = existing;
    }

    setBookings(updatedList);
    saveStoredLineBookings(updatedList);

    // If sync with live lines is checked, broadcast
    if (syncToLiveLinesOnImport && onSyncLinesWithBookings) {
      onSyncLinesWithBookings(parsedBookingPreview);
    }

    showToast(`Successfully imported ${parsedBookingPreview.length} line booking schedules!`, 'success');
    setIsBookingImporterOpen(false);
    setParsedBookingPreview([]);
    setBookingImportText('');
  };

  const handleDeleteBooking = (id: string) => {
    const updated = bookings.filter(b => b.id !== id);
    setBookings(updated);
    saveStoredLineBookings(updated);
    showToast('Line booking schedule deleted.', 'info');
  };

  const handleSaveNewBooking = () => {
    if (!newBooking.style?.trim() || !newBooking.lineNo?.trim()) {
      showToast('Style and Line Number are required.', 'error');
      return;
    }

    const created: LineBookingRecord = {
      id: `book-${Date.now()}`,
      lineNo: newBooking.lineNo.trim().toUpperCase(),
      floor: newBooking.floor || 'Floor 03',
      style: newBooking.style.trim(),
      buyer: newBooking.buyer?.trim() || 'General Buyer',
      orderQty: Number(newBooking.orderQty) || 15000,
      startDate: newBooking.startDate || new Date().toISOString().split('T')[0],
      endDate: newBooking.endDate || new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0],
      sam: Number(newBooking.sam) || 18.0,
      plannedOperators: Number(newBooking.plannedOperators) || 40,
      plannedHelpers: Number(newBooking.plannedHelpers) || 8,
      targetEfficiency: Number(newBooking.targetEfficiency) || 70,
      dailyTarget: Number(newBooking.dailyTarget) || 1100,
      totalTarget: Number(newBooking.orderQty) || 15000,
      trSampleStatus: (newBooking.trSampleStatus as any) || 'Ready',
      trimsStatus: (newBooking.trimsStatus as any) || 'In House',
      bookingStatus: (newBooking.bookingStatus as any) || 'Confirmed',
      notes: newBooking.notes || 'Manually added line booking.',
      updatedAt: new Date().toISOString()
    };

    const updated = [created, ...bookings];
    setBookings(updated);
    saveStoredLineBookings(updated);

    if (onSyncLinesWithBookings) {
      onSyncLinesWithBookings([created]);
    }

    showToast(`Added booking schedule for ${created.lineNo} (${created.style})!`, 'success');
    setIsAddBookingOpen(false);
  };

  /* -------------------------------------------------------------------------- */
  /*                            BUDGET HANDLERS                                 */
  /* -------------------------------------------------------------------------- */

  const handleExportBudgets = () => {
    try {
      const csv = exportMonthlyBudgetsToCSV(budgets, selectedBudgetMonth);
      downloadTextAsFile(`Debonair_Monthly_Budget_${selectedBudgetMonth}_${new Date().toISOString().split('T')[0]}.csv`, csv);
      showToast(`Exported ${activeMonthBudgets.length} monthly budget categories to CSV.`, 'success');
    } catch (err: any) {
      showToast(`Export failed: ${err.message}`, 'error');
    }
  };

  const handleDownloadBudgetTemplate = () => {
    try {
      const csv = generateMonthlyBudgetTemplateCSV();
      downloadTextAsFile('Monthly_Operating_Budget_Template.csv', csv);
      showToast('Downloaded standard Monthly Budget CSV Template.', 'info');
    } catch (err: any) {
      showToast(`Template download failed: ${err.message}`, 'error');
    }
  };

  const handleBudgetFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result;
      if (!result) return;
      const parseRes = parseMonthlyBudgetFromTextOrBuffer(result);
      setParsedBudgetPreview(parseRes.budgets);
      setBudgetImportErrors(parseRes.errors);
      setBudgetImportWarnings(parseRes.warnings);

      if (parseRes.budgets.length > 0) {
        showToast(`Parsed ${parseRes.budgets.length} budget items! Review and click Apply.`, 'info');
      } else if (parseRes.errors.length > 0) {
        showToast(`Failed to parse file: ${parseRes.errors[0]}`, 'error');
      }
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handleParseBudgetPastedText = () => {
    if (!budgetImportText.trim()) {
      showToast('Please paste CSV text or select a file.', 'error');
      return;
    }
    const parseRes = parseMonthlyBudgetFromTextOrBuffer(budgetImportText);
    setParsedBudgetPreview(parseRes.budgets);
    setBudgetImportErrors(parseRes.errors);
    setBudgetImportWarnings(parseRes.warnings);

    if (parseRes.budgets.length > 0) {
      showToast(`Parsed ${parseRes.budgets.length} budget items from text!`, 'info');
    } else if (parseRes.errors.length > 0) {
      showToast(`Parse error: ${parseRes.errors[0]}`, 'error');
    }
  };

  const handleApplyBudgetImport = () => {
    if (parsedBudgetPreview.length === 0) return;

    let updatedList: MonthlyBudgetRecord[] = [];
    if (budgetImportMode === 'replace') {
      // replace only the target month entries
      const others = budgets.filter(b => b.month !== selectedBudgetMonth);
      updatedList = [...others, ...parsedBudgetPreview];
    } else if (budgetImportMode === 'append') {
      updatedList = [...budgets, ...parsedBudgetPreview];
    } else {
      // upsert by (month + category)
      const existing = [...budgets];
      parsedBudgetPreview.forEach(newItem => {
        const idx = existing.findIndex(
          b => b.month === newItem.month && b.category.toLowerCase().trim() === newItem.category.toLowerCase().trim()
        );
        if (idx >= 0) {
          existing[idx] = { ...existing[idx], ...newItem, id: existing[idx].id };
        } else {
          existing.push(newItem);
        }
      });
      updatedList = existing;
    }

    setBudgets(updatedList);
    saveStoredMonthlyBudgets(updatedList);

    showToast(`Successfully imported ${parsedBudgetPreview.length} monthly budget items!`, 'success');
    setIsBudgetImporterOpen(false);
    setParsedBudgetPreview([]);
    setBudgetImportText('');
  };

  const handleDeleteBudget = (id: string) => {
    const updated = budgets.filter(b => b.id !== id);
    setBudgets(updated);
    saveStoredMonthlyBudgets(updated);
    showToast('Budget ledger item removed.', 'info');
  };

  const handleSaveNewBudget = () => {
    if (!newBudget.category?.trim()) {
      showToast('Budget Category is required.', 'error');
      return;
    }

    const alloc = Number(newBudget.allocatedBudget) || 0;
    const spent = Number(newBudget.actualSpend) || 0;
    const variance = alloc - spent;
    const variancePercent = alloc > 0 ? ((alloc - spent) / alloc) * 100 : 0;

    let status: MonthlyBudgetRecord['status'] = 'Within Budget';
    if (spent > alloc) status = 'Over Budget';
    else if (spent >= alloc * 0.9) status = 'Warning';

    const created: MonthlyBudgetRecord = {
      id: `bud-${Date.now()}`,
      month: newBudget.month || selectedBudgetMonth,
      category: newBudget.category.trim(),
      department: newBudget.department?.trim() || 'General Operations',
      floor: newBudget.floor || 'All Floors',
      allocatedBudget: alloc,
      actualSpend: spent,
      variance,
      variancePercent: parseFloat(variancePercent.toFixed(2)),
      status,
      responsiblePerson: newBudget.responsiblePerson?.trim() || 'Department Head',
      notes: newBudget.notes?.trim() || 'Manually entered monthly budget line.',
      updatedAt: new Date().toISOString()
    };

    const updated = [created, ...budgets];
    setBudgets(updated);
    saveStoredMonthlyBudgets(updated);

    showToast(`Added budget item for ${created.category}!`, 'success');
    setIsAddBudgetOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl overflow-hidden">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-white border-b border-[#e7e1d5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-[#176f78] flex items-center justify-center shadow-2xs">
              {activeTab === 'booking' ? <Shirt className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-bold text-[#17343a] uppercase tracking-tight">
                  Line Booking &amp; Monthly Budget Hub
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#dceceb] text-[#176f78]">
                  Import &amp; Export
                </span>
              </div>
              <p className="text-xs text-[#527078] mt-0.5">
                Debonair Unit-02 • Upcoming style schedules, line capacities &amp; financial cost center ledgers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRIMARY SUB-TAB NAVIGATION */}
        <div className="px-5 pt-3 bg-white border-b border-[#e7e1d5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('booking')}
              className={`pb-2.5 px-3 flex items-center gap-2 font-display text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'booking'
                  ? 'border-[#176f78] text-[#176f78]'
                  : 'border-transparent text-[#527078] hover:text-[#17343a]'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Line Booking (Upcoming Styles)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#dceceb] text-[#176f78] font-bold">
                {bookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('budget')}
              className={`pb-2.5 px-3 flex items-center gap-2 font-display text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'budget'
                  ? 'border-[#176f78] text-[#176f78]'
                  : 'border-transparent text-[#527078] hover:text-[#17343a]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Monthly Operating Budget</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                ${(budgetSummary.totalAllocated / 1000).toFixed(0)}k
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-2">
            <button
              type="button"
              onClick={activeTab === 'booking' ? handleDownloadBookingTemplate : handleDownloadBudgetTemplate}
              className="text-[11px] font-bold text-[#176f78] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ========================================================================= */}
          {/* TAB 1: LINE BOOKING FOR UPCOMING STYLES                                   */}
          {/* ========================================================================= */}
          {activeTab === 'booking' && (
            <div className="space-y-4">
              {/* Booking KPI Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    Booked Upcoming Styles
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">
                    {bookingSummary.totalBookedStyles} <span className="text-xs text-[#527078] font-normal">Styles</span>
                  </div>
                  <div className="text-[10px] text-teal-700 font-medium mt-1 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Across {bookingSummary.uniqueLines} Active Lines
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    Total Order Quantity
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">
                    {bookingSummary.totalOrderQty.toLocaleString()} <span className="text-xs text-[#527078] font-normal">pcs</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 font-medium mt-1">
                    Planned capacity for 10–30 days
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    T.R Sample Readiness
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-[#176f78] mt-0.5">
                    {bookingSummary.trReadyPct}%
                  </div>
                  <div className="text-[10px] text-[#527078] mt-1">
                    {bookingSummary.readyTRCount} of {bookingSummary.totalBookedStyles} styles approved
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    Floor Distribution
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">
                    {availableFloors.length} <span className="text-xs text-[#527078] font-normal">Floors</span>
                  </div>
                  <div className="text-[10px] text-[#527078] mt-1 truncate">
                    {availableFloors.slice(0, 3).join(', ')}
                  </div>
                </div>
              </div>

              {/* Action Ribbon & Filters */}
              <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[160px] max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#527078]" />
                    <input
                      type="text"
                      placeholder="Search style, line, buyer..."
                      value={bookingSearch}
                      onChange={e => setBookingSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] focus:outline-hidden focus:border-[#176f78]"
                    />
                  </div>

                  {/* Floor Filter */}
                  <select
                    value={bookingFloorFilter}
                    onChange={e => setBookingFloorFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                  >
                    <option value="all">All Floors</option>
                    {availableFloors.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={bookingStatusFilter}
                    onChange={e => setBookingStatusFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="tentative">Tentative</option>
                    <option value="in production">In Production</option>
                  </select>
                </div>

                {/* Import / Export & Add Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBookingImporterOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-300 hover:bg-teal-100 text-[#176f78] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Bookings</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportBookings}
                    className="px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] hover:bg-[#e7e1d5] text-[#17343a] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddBookingOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Booking</span>
                  </button>
                </div>
              </div>

              {/* Bookings Ledger Table */}
              <div className="rounded-2xl border border-[#d9d2c2] bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f1eee6] text-[#527078] uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-[#d9d2c2]">
                      <tr>
                        <th className="py-2.5 px-3">Line &amp; Floor</th>
                        <th className="py-2.5 px-3">Upcoming Style &amp; Buyer</th>
                        <th className="py-2.5 px-3">Order Qty</th>
                        <th className="py-2.5 px-3">Schedule Dates</th>
                        <th className="py-2.5 px-3">SAM / MP</th>
                        <th className="py-2.5 px-3">Daily Target</th>
                        <th className="py-2.5 px-3">T.R Sample</th>
                        <th className="py-2.5 px-3">Trims</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]">
                      {filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-[#527078]">
                            No upcoming style bookings found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map(b => (
                          <tr key={b.id} className="hover:bg-[#fbfaf6] transition-colors">
                            <td className="py-2.5 px-3 font-semibold text-[#17343a] whitespace-nowrap">
                              <span className="font-bold text-[#176f78]">{b.lineNo}</span>
                              <div className="text-[10px] text-[#527078] font-normal">{b.floor}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-[#17343a]">{b.style}</div>
                              <div className="text-[10px] text-[#527078]">{b.buyer}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono-numbers font-semibold text-[#17343a] whitespace-nowrap">
                              {b.orderQty.toLocaleString()} pcs
                            </td>
                            <td className="py-2.5 px-3 font-mono-numbers text-[11px] whitespace-nowrap">
                              <span className="text-[#17343a]">{b.startDate}</span>
                              <span className="text-[#527078] mx-1">→</span>
                              <span className="text-[#527078]">{b.endDate}</span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-mono-numbers font-semibold text-[#17343a]">{b.sam} min</div>
                              <div className="text-[10px] text-[#527078]">
                                {b.plannedOperators} Op + {b.plannedHelpers} Hlp
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono-numbers whitespace-nowrap">
                              <div className="font-bold text-[#17343a]">{b.dailyTarget} pcs</div>
                              <div className="text-[10px] text-teal-700">{b.targetEfficiency}% eff</div>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  b.trSampleStatus === 'Ready'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : b.trSampleStatus === 'In Development'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {b.trSampleStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  b.trimsStatus === 'In House'
                                    ? 'bg-teal-100 text-teal-800'
                                    : b.trimsStatus === 'Partial'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {b.trimsStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                                  b.bookingStatus === 'Confirmed'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                    : b.bookingStatus === 'In Production'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-300'
                                    : 'bg-amber-50 text-amber-700 border border-amber-300'
                                }`}
                              >
                                {b.bookingStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteBooking(b.id)}
                                title="Delete Booking"
                                className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: MONTHLY OPERATING BUDGET                                          */}
          {/* ========================================================================= */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              {/* Budget KPI Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    Allocated Budget ({selectedBudgetMonth})
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">
                    ${budgetSummary.totalAllocated.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#527078] mt-1">
                    {budgetSummary.itemCount} Cost Center Categories
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    Actual Expenditure
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">
                    ${budgetSummary.totalActual.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#176f78] font-medium mt-1">
                    {budgetSummary.burnPct}% of budget utilized
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    Net Variance (Balance)
                  </div>
                  <div
                    className={`text-xl font-bold font-mono-numbers mt-0.5 ${
                      budgetSummary.netVariance >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {budgetSummary.netVariance >= 0 ? `+$${budgetSummary.netVariance.toLocaleString()}` : `-$${Math.abs(budgetSummary.netVariance).toLocaleString()}`}
                  </div>
                  <div className="text-[10px] text-[#527078] mt-1 flex items-center gap-1">
                    {budgetSummary.netVariance >= 0 ? (
                      <span className="text-emerald-700 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" /> Favorable Surplus
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center">
                        <TrendingDown className="w-3 h-3 mr-0.5" /> Deficit Overrun
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                  <div className="text-[11px] font-semibold text-[#527078] uppercase tracking-wide">
                    Cost Center Health
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">
                    {budgetSummary.overBudgetCnt === 0 ? 'Optimal' : `${budgetSummary.overBudgetCnt} Over Budget`}
                  </div>
                  <div className="text-[10px] text-[#527078] mt-1">
                    {budgetSummary.warningCnt} on watch (&gt;90%)
                  </div>
                </div>
              </div>

              {/* Month Selector & Action Toolbar */}
              <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[240px]">
                  {/* Month Dropdown */}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#176f78]" />
                    <select
                      value={selectedBudgetMonth}
                      onChange={e => setSelectedBudgetMonth(e.target.value)}
                      className="py-1.5 px-3 text-xs font-bold rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                    >
                      {availableMonths.map(m => (
                        <option key={m} value={m}>
                          {m} {m === '2026-10' ? '(Active Forecast)' : m === '2026-09' ? '(Benchmark)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Filter */}
                  <select
                    value={budgetCategoryFilter}
                    onChange={e => setBudgetCategoryFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                  >
                    <option value="all">All Cost Categories</option>
                    <option value="labor">Direct / Indirect Labor</option>
                    <option value="maintenance">Maintenance &amp; Spares</option>
                    <option value="overtime">Overtime Allocations</option>
                    <option value="utility">Utility &amp; Power</option>
                    <option value="quality">Quality &amp; Consumables</option>
                    <option value="training">IE &amp; Skill Training</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={budgetStatusFilter}
                    onChange={e => setBudgetStatusFilter(e.target.value)}
                    className="py-1.5 px-2.5 text-xs rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                  >
                    <option value="all">All Statuses</option>
                    <option value="within budget">Within Budget</option>
                    <option value="warning">Warning (&gt;90%)</option>
                    <option value="over budget">Over Budget</option>
                  </select>
                </div>

                {/* Import / Export & Add Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBudgetImporterOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-300 hover:bg-teal-100 text-[#176f78] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Budget</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportBudgets}
                    className="px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] hover:bg-[#e7e1d5] text-[#17343a] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddBudgetOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Cost Item</span>
                  </button>
                </div>
              </div>

              {/* Budget Ledger Table */}
              <div className="rounded-2xl border border-[#d9d2c2] bg-white overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[460px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#f1eee6] text-[#527078] uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-[#d9d2c2]">
                      <tr>
                        <th className="py-2.5 px-3">Expense Category</th>
                        <th className="py-2.5 px-3">Department &amp; Floor</th>
                        <th className="py-2.5 px-3">Allocated Budget</th>
                        <th className="py-2.5 px-3">Actual Spent</th>
                        <th className="py-2.5 px-3">Variance</th>
                        <th className="py-2.5 px-3">Burn %</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Responsible</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]">
                      {filteredBudgets.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-[#527078]">
                            No budget ledger items found for {selectedBudgetMonth}.
                          </td>
                        </tr>
                      ) : (
                        filteredBudgets.map(b => {
                          const burn = b.allocatedBudget > 0 ? Math.round((b.actualSpend / b.allocatedBudget) * 100) : 0;
                          return (
                            <tr key={b.id} className="hover:bg-[#fbfaf6] transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-[#17343a]">{b.category}</div>
                                {b.notes && <div className="text-[10px] text-[#527078] line-clamp-1">{b.notes}</div>}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <div className="font-semibold text-[#17343a]">{b.department}</div>
                                <div className="text-[10px] text-[#527078]">{b.floor || 'All Floors'}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono-numbers font-semibold text-[#17343a] whitespace-nowrap">
                                ${b.allocatedBudget.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 font-mono-numbers font-semibold text-[#17343a] whitespace-nowrap">
                                ${b.actualSpend.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 font-mono-numbers whitespace-nowrap">
                                <span className={b.variance >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                                  {b.variance >= 0 ? `+$${b.variance.toLocaleString()}` : `-$${Math.abs(b.variance).toLocaleString()}`}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono-numbers whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className={`h-full ${
                                        burn > 100 ? 'bg-rose-500' : burn > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(100, burn)}%` }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-semibold text-[#527078]">{burn}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    b.status === 'Within Budget'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : b.status === 'Warning'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#527078] text-[11px] whitespace-nowrap">
                                {b.responsiblePerson || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBudget(b.id)}
                                  title="Delete Cost Item"
                                  className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* LINE BOOKING IMPORTER DRAWER MODAL                                        */}
        {/* ========================================================================= */}
        {isBookingImporterOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#176f78] flex items-center justify-center font-bold">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#17343a]">
                      Import Upcoming Style Line Bookings
                    </h3>
                    <p className="text-xs text-[#527078]">Upload CSV or Excel spreadsheet with style booking schedules</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBookingImporterOpen(false)}
                  className="p-1.5 rounded-lg bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => bookingFileInputRef.current?.click()}
                className="p-6 rounded-2xl border-2 border-dashed border-[#176f78]/30 hover:border-[#176f78] bg-[#fbfaf6] hover:bg-teal-50/30 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-8 h-8 text-[#176f78] mb-2" />
                <div className="text-xs font-bold text-[#17343a]">Click to select CSV or Excel (.xlsx) file</div>
                <div className="text-[11px] text-[#527078] mt-0.5">
                  Accepts standard IE schedule columns (LineNo, Style, Buyer, OrderQty, StartDate, EndDate, SAM, etc.)
                </div>
                <input
                  ref={bookingFileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleBookingFileUpload(file);
                  }}
                  className="hidden"
                />
              </div>

              {/* Or Paste Raw Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#17343a]">
                  <span>Or Paste Comma-Separated (CSV) Text:</span>
                  <button
                    type="button"
                    onClick={handleParseBookingPastedText}
                    className="text-[11px] font-bold text-[#176f78] hover:underline"
                  >
                    Parse Pasted Text
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={bookingImportText}
                  onChange={e => setBookingImportText(e.target.value)}
                  placeholder="LineNo,UpcomingStyle,Buyer,OrderQty,StartDate,EndDate,SAM..."
                  className="w-full p-2.5 text-xs font-mono rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] focus:outline-hidden focus:border-[#176f78]"
                />
              </div>

              {/* Import Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-[#f1eee6]/60 border border-[#d9d2c2]">
                <div>
                  <label className="text-[11px] font-bold text-[#17343a] block mb-1">Import Strategy:</label>
                  <select
                    value={bookingImportMode}
                    onChange={e => setBookingImportMode(e.target.value as any)}
                    className="w-full p-1.5 text-xs rounded-lg bg-white border border-[#d9d2c2]"
                  >
                    <option value="upsert">Upsert (Update existing lines &amp; append new)</option>
                    <option value="append">Append All (Keep duplicates)</option>
                    <option value="replace">Replace Entire Schedule</option>
                  </select>
                </div>

                <div className="flex items-center pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#17343a] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncToLiveLinesOnImport}
                      onChange={e => setSyncToLiveLinesOnImport(e.target.checked)}
                      className="rounded text-[#176f78] focus:ring-teal-500 cursor-pointer"
                    />
                    <span>Sync Next Style directly into Active Floor Lines</span>
                  </label>
                </div>
              </div>

              {/* Errors & Warnings */}
              {bookingImportErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <div className="font-bold">Parsing Errors:</div>
                  <ul className="list-disc pl-4 mt-1 text-[11px]">
                    {bookingImportErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {parsedBookingPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#176f78]">
                    <span>Validated {parsedBookingPreview.length} Line Bookings Ready to Import</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-[#d9d2c2] bg-white text-xs divide-y divide-[#e7e1d5]">
                    {parsedBookingPreview.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div>
                          <strong className="text-[#176f78]">{item.lineNo}</strong> • {item.style} ({item.buyer})
                        </div>
                        <div className="text-[#527078] font-mono-numbers">
                          {item.orderQty.toLocaleString()} pcs • {item.startDate}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyBookingImport}
                    className="w-full py-2.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply {parsedBookingPreview.length} Bookings to Factory Schedule</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MONTHLY BUDGET IMPORTER DRAWER MODAL                                      */}
        {/* ========================================================================= */}
        {isBudgetImporterOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-[#17343a]">
                      Import Monthly Operating Budget
                    </h3>
                    <p className="text-xs text-[#527078]">Upload CSV or Excel ledger for manufacturing cost centers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBudgetImporterOpen(false)}
                  className="p-1.5 rounded-lg bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Drop Zone */}
              <div
                onClick={() => budgetFileInputRef.current?.click()}
                className="p-6 rounded-2xl border-2 border-dashed border-emerald-500/30 hover:border-emerald-600 bg-[#fbfaf6] hover:bg-emerald-50/30 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
              >
                <FileSpreadsheet className="w-8 h-8 text-emerald-700 mb-2" />
                <div className="text-xs font-bold text-[#17343a]">Click to select CSV or Excel (.xlsx) file</div>
                <div className="text-[11px] text-[#527078] mt-0.5">
                  Accepts Month, Category, Department, AllocatedBudget, ActualSpend, Status, Notes
                </div>
                <input
                  ref={budgetFileInputRef}
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleBudgetFileUpload(file);
                  }}
                  className="hidden"
                />
              </div>

              {/* Or Paste Raw Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#17343a]">
                  <span>Or Paste Comma-Separated (CSV) Text:</span>
                  <button
                    type="button"
                    onClick={handleParseBudgetPastedText}
                    className="text-[11px] font-bold text-[#176f78] hover:underline"
                  >
                    Parse Pasted Text
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={budgetImportText}
                  onChange={e => setBudgetImportText(e.target.value)}
                  placeholder="Month,Category,Department,AllocatedBudget_USD,ActualSpend_USD,Status,Notes..."
                  className="w-full p-2.5 text-xs font-mono rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] focus:outline-hidden focus:border-[#176f78]"
                />
              </div>

              {/* Import Options */}
              <div className="p-3 rounded-xl bg-[#f1eee6]/60 border border-[#d9d2c2]">
                <label className="text-[11px] font-bold text-[#17343a] block mb-1">Import Strategy:</label>
                <select
                  value={budgetImportMode}
                  onChange={e => setBudgetImportMode(e.target.value as any)}
                  className="w-full p-1.5 text-xs rounded-lg bg-white border border-[#d9d2c2]"
                >
                  <option value="upsert">Upsert (Update matching month &amp; category, append new)</option>
                  <option value="replace">Replace Active Month Ledger ({selectedBudgetMonth})</option>
                  <option value="append">Append All Entries</option>
                </select>
              </div>

              {/* Errors & Warnings */}
              {budgetImportErrors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <div className="font-bold">Parsing Errors:</div>
                  <ul className="list-disc pl-4 mt-1 text-[11px]">
                    {budgetImportErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {parsedBudgetPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span>Validated {parsedBudgetPreview.length} Budget Items Ready to Import</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-[#d9d2c2] bg-white text-xs divide-y divide-[#e7e1d5]">
                    {parsedBudgetPreview.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div>
                          <strong className="text-[#17343a]">{item.category}</strong> ({item.department})
                        </div>
                        <div className="text-[#527078] font-mono-numbers">
                          Budget: ${item.allocatedBudget.toLocaleString()} • Spent: ${item.actualSpend.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyBudgetImport}
                    className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply {parsedBudgetPreview.length} Items to Monthly Budget</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MANUAL ADD BOOKING MODAL                                                  */}
        {/* ========================================================================= */}
        {isAddBookingOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <h3 className="font-display text-base font-bold text-[#17343a]">
                  Add Upcoming Style Line Booking
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="p-1.5 rounded-lg bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Line Number</label>
                  <input
                    type="text"
                    value={newBooking.lineNo}
                    onChange={e => setNewBooking({ ...newBooking, lineNo: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="e.g. L01"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Floor</label>
                  <input
                    type="text"
                    value={newBooking.floor}
                    onChange={e => setNewBooking({ ...newBooking, floor: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="Floor 03"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Upcoming Style Name</label>
                  <input
                    type="text"
                    value={newBooking.style}
                    onChange={e => setNewBooking({ ...newBooking, style: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="e.g. QUINN LIGHT BOMBER JKT"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Buyer / Brand</label>
                  <input
                    type="text"
                    value={newBooking.buyer}
                    onChange={e => setNewBooking({ ...newBooking, buyer: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="e.g. ZARA"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Order Qty (pcs)</label>
                  <input
                    type="number"
                    value={newBooking.orderQty}
                    onChange={e => setNewBooking({ ...newBooking, orderQty: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newBooking.startDate}
                    onChange={e => setNewBooking({ ...newBooking, startDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">End Date</label>
                  <input
                    type="date"
                    value={newBooking.endDate}
                    onChange={e => setNewBooking({ ...newBooking, endDate: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">SAM / SMV (min)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newBooking.sam}
                    onChange={e => setNewBooking({ ...newBooking, sam: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Target Efficiency %</label>
                  <input
                    type="number"
                    value={newBooking.targetEfficiency}
                    onChange={e => setNewBooking({ ...newBooking, targetEfficiency: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setIsAddBookingOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1eee6] text-[#17343a] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewBooking}
                  className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c]"
                >
                  Save Line Booking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MANUAL ADD BUDGET COST ITEM MODAL                                         */}
        {/* ========================================================================= */}
        {isAddBudgetOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
                <h3 className="font-display text-base font-bold text-[#17343a]">
                  Add Cost Center Item to {selectedBudgetMonth}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddBudgetOpen(false)}
                  className="p-1.5 rounded-lg bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Expense Category</label>
                  <input
                    type="text"
                    value={newBudget.category}
                    onChange={e => setNewBudget({ ...newBudget, category: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="e.g. Needle &amp; Machine Spare Parts"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Department</label>
                  <input
                    type="text"
                    value={newBudget.department}
                    onChange={e => setNewBudget({ ...newBudget, department: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="Plant Engineering"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Floor Allocation</label>
                  <input
                    type="text"
                    value={newBudget.floor}
                    onChange={e => setNewBudget({ ...newBudget, floor: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="All Floors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Allocated Budget ($ USD)</label>
                  <input
                    type="number"
                    value={newBudget.allocatedBudget}
                    onChange={e => setNewBudget({ ...newBudget, allocatedBudget: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Actual Spend ($ USD)</label>
                  <input
                    type="number"
                    value={newBudget.actualSpend}
                    onChange={e => setNewBudget({ ...newBudget, actualSpend: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-[#17343a] mb-1">Responsible Person / In-Charge</label>
                  <input
                    type="text"
                    value={newBudget.responsiblePerson}
                    onChange={e => setNewBudget({ ...newBudget, responsiblePerson: e.target.value })}
                    className="w-full p-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    placeholder="Chief Maintenance Engineer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setIsAddBudgetOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#f1eee6] text-[#17343a] text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewBudget}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
                >
                  Save Cost Item
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FEEDBACK TOAST */}
        {toast && (
          <div
            className={`px-4 py-2.5 border-t text-xs font-semibold flex items-center justify-between ${
              toast.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : toast.type === 'info'
                ? 'bg-sky-50 border-sky-200 text-sky-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{toast.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-xs font-bold opacity-75 hover:opacity-100 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-[#e7e1d5] bg-white flex items-center justify-between text-xs shrink-0">
          <div className="text-[11px] text-[#527078]">
            {activeTab === 'booking'
              ? `${bookings.length} line bookings scheduled • Ready for automated factory allocation`
              : `${budgets.length} ledger entries across ${availableMonths.length} operating cycles`}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-[#176f78] text-white font-bold hover:bg-[#12555c] transition-colors cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
