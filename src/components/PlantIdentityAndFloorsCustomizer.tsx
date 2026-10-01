/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Comprehensive Plant Identity & Floor Topology Customization Engine
 * Full corporate branding, multi-plant profiles, dynamic floor management, and live line synchronization
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Factory,
  Building,
  Building2,
  MapPin,
  Mail,
  Layers,
  Plus,
  Edit3,
  Trash2,
  Save,
  Check,
  CheckCircle2,
  ArrowRight,
  ArrowUpDown,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Users,
  Briefcase,
  Palette,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  AlertTriangle,
  Clock,
  Target,
  Hash,
  Share2,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { FactoryIndustryProfile, LineEntry, UserProfile } from '../types';
import {
  CustomFloor,
  DEFAULT_PLANT_FLOORS,
  FLOOR_COLOR_PALETTES,
  getEffectiveFloors,
  saveStoredCustomFloors,
  computeFloorMetricSummaries,
  renameFloorInLines,
  reassignLinesToFloor
} from '../utils/floorManager';
import {
  PRESET_FACTORIES,
  INDUSTRY_SECTORS,
  setStoredActiveFactory,
  setStoredSavedFactories,
  getStoredSavedFactories
} from '../data/factoryProfiles';
import { isMasterAdminOrAdmin } from '../utils/rbac';

interface PlantIdentityAndFloorsCustomizerProps {
  factoryProfile?: FactoryIndustryProfile;
  onUpdateFactoryProfile?: (updated: FactoryIndustryProfile) => void;
  savedFactories?: FactoryIndustryProfile[];
  onSaveFactoryList?: (list: FactoryIndustryProfile[]) => void;
  lines?: LineEntry[];
  onSaveLine?: (line: LineEntry) => void;
  onSaveMultipleLines?: (updatedLines: LineEntry[]) => void;
  onAddNewLine?: (customLine?: LineEntry | Partial<LineEntry>) => void;
  onDeleteLine?: (id: string | number) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onSelectLineNo?: (lineNo: string) => void;
  onSelectFloor?: (floorId: string, floorLabel: string) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
  profile?: UserProfile;
}

export const PlantIdentityAndFloorsCustomizer: React.FC<PlantIdentityAndFloorsCustomizerProps> = ({
  factoryProfile,
  onUpdateFactoryProfile,
  savedFactories: propSavedFactories,
  onSaveFactoryList,
  lines = [],
  onSaveLine,
  onSaveMultipleLines,
  onAddNewLine,
  onDeleteLine,
  onDeleteFloor,
  onSelectLineNo,
  onSelectFloor,
  onNavigate,
  profile
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const [activeTab, setActiveTab] = useState<'identity' | 'floors' | 'presets'>('identity');

  // ==========================================
  // PLANT IDENTITY STATE
  // ==========================================
  const [factoryName, setFactoryName] = useState(factoryProfile?.name || 'Debonair LTD');
  const [unitName, setUnitName] = useState(factoryProfile?.unitName || 'Unit-02');
  const [sector, setSector] = useState(factoryProfile?.industrySector || 'Apparel & Garment Manufacturing (RMG)');
  const [location, setLocation] = useState(factoryProfile?.addressLocation || 'Gorai, Mirzapur, Tangail, Bangladesh');
  const [factoryCode, setFactoryCode] = useState(factoryProfile?.factoryCode || 'DBN-U02');
  const [shortTag, setShortTag] = useState(factoryProfile?.shortTag || 'DBN-02');
  const [department, setDepartment] = useState(factoryProfile?.department || 'Industrial Engineering (IE) Dept.');
  const [establishedYear, setEstablishedYear] = useState(factoryProfile?.establishedYear || '2008');
  const [contactEmail, setContactEmail] = useState(factoryProfile?.contactEmail || 'ie.unit02@debonairgroupbd.com');
  const [brandColor, setBrandColor] = useState(factoryProfile?.brandColor || '#176f78');
  const [isSavedPlant, setIsSavedPlant] = useState(false);
  const [importExportFeedback, setImportExportFeedback] = useState<string | null>(null);

  // Sync state if factoryProfile prop updates
  useEffect(() => {
    if (factoryProfile) {
      setFactoryName(factoryProfile.name || 'Debonair LTD');
      setUnitName(factoryProfile.unitName || 'Unit-02');
      setSector(factoryProfile.industrySector || 'Apparel & Garment Manufacturing (RMG)');
      setLocation(factoryProfile.addressLocation || 'Gorai, Mirzapur, Tangail, Bangladesh');
      setFactoryCode(factoryProfile.factoryCode || 'DBN-U02');
      setShortTag(factoryProfile.shortTag || 'DBN-02');
      setDepartment(factoryProfile.department || 'Industrial Engineering (IE) Dept.');
      setEstablishedYear(factoryProfile.establishedYear || '2008');
      setContactEmail(factoryProfile.contactEmail || 'ie.unit02@debonairgroupbd.com');
      setBrandColor(factoryProfile?.brandColor || '#176f78');
    }
  }, [factoryProfile]);

  // Saved Factories list
  const savedFactories = useMemo(() => {
    return propSavedFactories && propSavedFactories.length > 0
      ? propSavedFactories
      : getStoredSavedFactories();
  }, [propSavedFactories]);

  const handleSavePlantIdentity = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: FactoryIndustryProfile = {
      id: factoryProfile?.id || `factory_${Date.now()}`,
      name: factoryName.trim() || 'Debonair LTD',
      unitName: unitName.trim() || 'Unit-02',
      industrySector: sector.trim(),
      department: department.trim(),
      factoryCode: factoryCode.trim() || 'DBN-U02',
      addressLocation: location.trim(),
      shortTag: shortTag.trim() || factoryCode.trim().slice(0, 6) || 'PLANT-01',
      brandColor: brandColor.trim(),
      establishedYear: establishedYear.trim(),
      contactEmail: contactEmail.trim(),
      totalLinesCount: lines.length,
      isCustom: true
    };

    if (onUpdateFactoryProfile) {
      onUpdateFactoryProfile(updated);
    }
    setStoredActiveFactory(updated);

    // Save to savedFactories if not already present
    const existingIdx = savedFactories.findIndex(f => f.id === updated.id);
    let nextList = [...savedFactories];
    if (existingIdx >= 0) {
      nextList[existingIdx] = updated;
    } else {
      nextList.push(updated);
    }
    setStoredSavedFactories(nextList);
    if (onSaveFactoryList) {
      onSaveFactoryList(nextList);
    }

    setIsSavedPlant(true);
    setTimeout(() => setIsSavedPlant(false), 3000);
  };

  const handleSelectPresetFactory = (selected: FactoryIndustryProfile) => {
    setFactoryName(selected.name);
    setUnitName(selected.unitName);
    setSector(selected.industrySector);
    setLocation(selected.addressLocation || '');
    setFactoryCode(selected.factoryCode || '');
    setShortTag(selected.shortTag || '');
    setDepartment(selected.department || 'Industrial Engineering (IE) Dept.');
    setEstablishedYear(selected.establishedYear || '');
    setContactEmail(selected.contactEmail || '');
    setBrandColor(selected.brandColor || '#176f78');

    if (onUpdateFactoryProfile) {
      onUpdateFactoryProfile(selected);
    }
    setStoredActiveFactory(selected);
    setImportExportFeedback(`Active plant switched to ${selected.name} (${selected.unitName})`);
    setTimeout(() => setImportExportFeedback(null), 3500);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPlantJson = () => {
    const dataToExport = {
      plantIdentity: {
        id: factoryProfile?.id || 'plant_debonair_u02',
        name: factoryName,
        unitName,
        industrySector: sector,
        department,
        factoryCode,
        shortTag,
        addressLocation: location,
        brandColor,
        establishedYear,
        contactEmail,
        exportedAt: new Date().toISOString()
      },
      floors: getEffectiveFloors(lines)
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plant_Identity_${(factoryName || 'Plant').replace(/\s+/g, '_')}_${unitName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportExportFeedback('Plant identity and floor configuration exported to JSON successfully.');
    setTimeout(() => setImportExportFeedback(null), 3000);
  };

  const handleImportPlantJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed && parsed.plantIdentity) {
          const p = parsed.plantIdentity;
          setFactoryName(p.name || 'Custom Plant');
          setUnitName(p.unitName || 'Unit-01');
          setSector(p.industrySector || 'Apparel & Garments (RMG)');
          setLocation(p.addressLocation || '');
          setFactoryCode(p.factoryCode || 'PLT-01');
          setShortTag(p.shortTag || 'PLT-01');
          setDepartment(p.department || 'IE Department');
          setEstablishedYear(p.establishedYear || '2020');
          setContactEmail(p.contactEmail || '');
          setBrandColor(p.brandColor || '#176f78');

          const updatedPlant: FactoryIndustryProfile = {
            id: p.id || `plant_${Date.now()}`,
            name: p.name,
            unitName: p.unitName,
            industrySector: p.industrySector,
            department: p.department,
            factoryCode: p.factoryCode,
            addressLocation: p.addressLocation,
            shortTag: p.shortTag,
            brandColor: p.brandColor,
            establishedYear: p.establishedYear,
            contactEmail: p.contactEmail,
            isCustom: true
          };
          if (onUpdateFactoryProfile) {
            onUpdateFactoryProfile(updatedPlant);
          }
          setStoredActiveFactory(updatedPlant);

          if (parsed.floors && Array.isArray(parsed.floors)) {
            setFloors(parsed.floors);
            saveStoredCustomFloors(parsed.floors);
          }
          setImportExportFeedback('Plant configuration and floor topology successfully imported!');
          setTimeout(() => setImportExportFeedback(null), 3500);
        } else {
          setImportExportFeedback('Invalid plant configuration file format.');
          setTimeout(() => setImportExportFeedback(null), 3500);
        }
      } catch (err) {
        setImportExportFeedback('Error parsing JSON configuration file.');
        setTimeout(() => setImportExportFeedback(null), 3500);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ==========================================
  // FLOOR TOPOLOGY STATE
  // ==========================================
  const [floors, setFloors] = useState<CustomFloor[]>(() => getEffectiveFloors(lines));

  // Compute live floor summaries from lines
  const floorSummaries = useMemo(() => {
    return computeFloorMetricSummaries(floors, lines);
  }, [floors, lines]);

  // Modals for Floor Management
  const [isAddFloorModalOpen, setIsAddFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<CustomFloor | null>(null);
  const [floorToDelete, setFloorToDelete] = useState<CustomFloor | null>(null);
  const [deleteMode, setDeleteMode] = useState<'reassign' | 'delete_all_lines'>('reassign');
  const [reassignTargetFloorName, setReassignTargetFloorName] = useState<string>('');
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignSourceFloor, setReassignSourceFloor] = useState<CustomFloor | null>(null);
  const [selectedLinesToMove, setSelectedLinesToMove] = useState<string[]>([]);
  const [destinationFloorName, setDestinationFloorName] = useState<string>('');

  // Add Floor Form State
  const [newFloorName, setNewFloorName] = useState('');
  const [newFloorBuilding, setNewFloorBuilding] = useState('Building A (South Wing)');
  const [newFloorCode, setNewFloorCode] = useState('');
  const [newFloorTargetEff, setNewFloorTargetEff] = useState(70);
  const [newFloorHours, setNewFloorHours] = useState(8);
  const [newFloorManager, setNewFloorManager] = useState('');
  const [newFloorColor, setNewFloorColor] = useState('#176f78');
  const [newFloorNotes, setNewFloorNotes] = useState('');

  // Edit Floor Form State
  const [editFloorName, setEditFloorName] = useState('');
  const [editFloorBuilding, setEditFloorBuilding] = useState('');
  const [editFloorCode, setEditFloorCode] = useState('');
  const [editFloorTargetEff, setEditFloorTargetEff] = useState(70);
  const [editFloorHours, setEditFloorHours] = useState(8);
  const [editFloorManager, setEditFloorManager] = useState('');
  const [editFloorColor, setEditFloorColor] = useState('#176f78');
  const [editFloorNotes, setEditFloorNotes] = useState('');
  const [syncRenameLines, setSyncRenameLines] = useState(true);

  const handleOpenAddFloor = () => {
    setNewFloorName('');
    setNewFloorBuilding(`Building Complex (${unitName || 'Unit-02'})`);
    setNewFloorCode(`FL-0${floors.length + 1}`);
    setNewFloorTargetEff(70);
    setNewFloorHours(8);
    setNewFloorManager('');
    setNewFloorColor(FLOOR_COLOR_PALETTES[floors.length % FLOOR_COLOR_PALETTES.length].value);
    setNewFloorNotes('');
    setIsAddFloorModalOpen(true);
  };

  const handleConfirmAddFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;

    const newFloorObj: CustomFloor = {
      id: `floor_${newFloorName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      name: newFloorName.trim(),
      building: newFloorBuilding.trim() || 'Main Complex',
      floorCode: newFloorCode.trim() || `FL-${newFloorName.slice(0, 4).toUpperCase()}`,
      targetEfficiency: Number(newFloorTargetEff) || 70,
      standardWorkingHours: Number(newFloorHours) || 8,
      floorManager: newFloorManager.trim(),
      color: newFloorColor,
      notes: newFloorNotes.trim(),
      order: floors.length + 1,
      createdAt: new Date().toISOString()
    };

    const updated = [...floors, newFloorObj];
    setFloors(updated);
    saveStoredCustomFloors(updated);
    setIsAddFloorModalOpen(false);
    setImportExportFeedback(`Floor "${newFloorObj.name}" added to plant topology.`);
    setTimeout(() => setImportExportFeedback(null), 3000);
  };

  const handleOpenEditFloor = (floor: CustomFloor) => {
    setEditingFloor(floor);
    setEditFloorName(floor.name);
    setEditFloorBuilding(floor.building || '');
    setEditFloorCode(floor.floorCode || '');
    setEditFloorTargetEff(floor.targetEfficiency || 70);
    setEditFloorHours(floor.standardWorkingHours || 8);
    setEditFloorManager(floor.floorManager || '');
    setEditFloorColor(floor.color || '#176f78');
    setEditFloorNotes(floor.notes || '');
    setSyncRenameLines(true);
  };

  const handleConfirmEditFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFloor || !editFloorName.trim()) return;

    const oldName = editingFloor.name;
    const cleanNewName = editFloorName.trim();

    const updatedFloors = floors.map(f => {
      if (f.id === editingFloor.id) {
        return {
          ...f,
          name: cleanNewName,
          building: editFloorBuilding.trim(),
          floorCode: editFloorCode.trim(),
          targetEfficiency: Number(editFloorTargetEff) || 70,
          standardWorkingHours: Number(editFloorHours) || 8,
          floorManager: editFloorManager.trim(),
          color: editFloorColor,
          notes: editFloorNotes.trim()
        };
      }
      return f;
    });

    setFloors(updatedFloors);
    saveStoredCustomFloors(updatedFloors);

    // If floor name changed and syncRenameLines is true, batch update lines
    if (oldName.trim().toLowerCase() !== cleanNewName.toLowerCase() && syncRenameLines) {
      const updatedLines = renameFloorInLines(lines, oldName, cleanNewName);
      if (onSaveMultipleLines) {
        onSaveMultipleLines(updatedLines);
      } else if (onSaveLine) {
        updatedLines.forEach(l => {
          if (l.floor === cleanNewName) onSaveLine(l);
        });
      }
    }

    setEditingFloor(null);
    setImportExportFeedback(`Floor "${cleanNewName}" details updated successfully.`);
    setTimeout(() => setImportExportFeedback(null), 3000);
  };

  const handleOpenDeleteFloor = (floor: CustomFloor) => {
    setFloorToDelete(floor);
    const otherFloors = floors.filter(f => f.id !== floor.id);
    setReassignTargetFloorName(otherFloors[0]?.name || '');
    setDeleteMode('reassign');
  };

  const handleConfirmDeleteFloor = () => {
    if (!floorToDelete) return;
    const floorName = floorToDelete.name;

    if (onDeleteFloor) {
      onDeleteFloor(floorName, deleteMode, reassignTargetFloorName);
    } else {
      if (deleteMode === 'reassign' && reassignTargetFloorName) {
        const updatedLines = renameFloorInLines(lines, floorName, reassignTargetFloorName);
        if (onSaveMultipleLines) onSaveMultipleLines(updatedLines);
      }
    }

    const updatedFloors = floors.filter(f => f.id !== floorToDelete.id);
    setFloors(updatedFloors);
    saveStoredCustomFloors(updatedFloors);
    setFloorToDelete(null);
    setImportExportFeedback(`Floor "${floorName}" decommissioned.`);
    setTimeout(() => setImportExportFeedback(null), 3000);
  };

  const handleOpenReassignLines = (floor: CustomFloor) => {
    setReassignSourceFloor(floor);
    const matched = lines.filter(l => (l.floor?.trim().toLowerCase() || '') === floor.name.trim().toLowerCase());
    setSelectedLinesToMove(matched.map(l => l.lineNo));
    const otherFloors = floors.filter(f => f.id !== floor.id);
    setDestinationFloorName(otherFloors[0]?.name || '');
    setIsReassignModalOpen(true);
  };

  const handleConfirmReassignLines = () => {
    if (!reassignSourceFloor || !destinationFloorName || selectedLinesToMove.length === 0) return;

    const updatedLines = reassignLinesToFloor(lines, selectedLinesToMove, destinationFloorName);
    if (onSaveMultipleLines) {
      onSaveMultipleLines(updatedLines);
    } else if (onSaveLine) {
      updatedLines
        .filter(l => selectedLinesToMove.includes(l.lineNo))
        .forEach(l => onSaveLine(l));
    }

    setIsReassignModalOpen(false);
    setImportExportFeedback(`Reassigned ${selectedLinesToMove.length} line(s) to ${destinationFloorName}.`);
    setTimeout(() => setImportExportFeedback(null), 3000);
  };

  const handleMoveFloorOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= floors.length) return;
    const copy = [...floors];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    copy.forEach((f, idx) => {
      f.order = idx + 1;
    });
    setFloors(copy);
    saveStoredCustomFloors(copy);
  };

  const handleResetToDefaultFloors = () => {
    if (window.confirm('Reset floors to Debonair Unit-02 factory defaults (Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag)?')) {
      setFloors(DEFAULT_PLANT_FLOORS);
      saveStoredCustomFloors(DEFAULT_PLANT_FLOORS);
      setImportExportFeedback('Floors reset to standard Debonair Unit-02 defaults.');
      setTimeout(() => setImportExportFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportPlantJson}
        className="hidden"
      />

      {/* Header and Sub-Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: brandColor || '#176f78' }}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] dark:text-slate-400 font-mono">
              Enterprise Topology • {factoryCode || 'DBN-U02'}
            </span>
            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              Live Customizer
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-[#17343a] dark:text-slate-100 flex items-center gap-2.5">
            <Factory className="w-5 h-5 text-[#176f78] dark:text-teal-400" />
            <span>Plant Identity &amp; Floors Customization</span>
          </h2>
          <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
            Personalize corporate branding, facility codes, and manage production floor topology and line allocation.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportPlantJson}
            className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-white dark:bg-[#181d24] text-xs font-bold text-[#17343a] dark:text-slate-200 hover:bg-[#f1eee6] dark:hover:bg-[#202732] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Export complete plant identity and floor configuration as JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#176f78]" />
            <span>Export JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-white dark:bg-[#181d24] text-xs font-bold text-[#17343a] dark:text-slate-200 hover:bg-[#f1eee6] dark:hover:bg-[#202732] flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Import plant identity and floor configuration from JSON"
          >
            <Upload className="w-3.5 h-3.5 text-[#176f78]" />
            <span>Import JSON</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {importExportFeedback && (
        <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[#176f78] dark:text-teal-300 text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importExportFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportExportFeedback(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub-Tabs: Plant Identity, Operating Floors, Presets */}
      <div className="flex items-center gap-2 p-1 bg-[#f1eee6] dark:bg-[#181d24] rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-white dark:bg-[#222936] text-[#17343a] dark:text-white shadow-xs'
              : 'text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
          <span>Plant Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('floors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'floors'
              ? 'bg-white dark:bg-[#222936] text-[#17343a] dark:text-white shadow-xs'
              : 'text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
          <span>Operating Floors</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#dceceb] text-[#176f78] dark:bg-teal-900/60 dark:text-teal-300">
            {floors.length} Floors
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-white dark:bg-[#222936] text-[#17343a] dark:text-white shadow-xs'
              : 'text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Plant Presets</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: PLANT IDENTITY CUSTOMIZATION
      ======================================================== */}
      {activeTab === 'identity' && (
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="p-5 rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] bg-gradient-to-br from-[#fbfaf6] to-white dark:from-[#151a21] dark:to-[#1b222c] shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0"
                  style={{ backgroundColor: brandColor || '#176f78' }}
                >
                  {factoryName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base sm:text-lg font-bold text-[#17343a] dark:text-white">
                      {factoryName || 'Debonair LTD'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 border border-[#176f78]/30">
                      {unitName || 'Unit-02'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[#527078] dark:text-slate-400 border border-[#d9d2c2] dark:border-[#384454]">
                      {factoryCode || 'DBN-U02'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#527078] dark:text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{sector}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[280px]">{location}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono">
                  {lines.length} Lines Online
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-100 dark:bg-teal-950/60 text-[#176f78] dark:text-teal-300 font-mono">
                  {floors.length} Floors
                </span>
              </div>
            </div>
          </div>

          {/* Plant Identity Form */}
          <form onSubmit={handleSavePlantIdentity} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Company / Enterprise Group Name
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={factoryName}
                    onChange={e => setFactoryName(e.target.value)}
                    placeholder="e.g. Debonair LTD"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Active Complex Unit Designation
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={unitName}
                    onChange={e => setUnitName(e.target.value)}
                    placeholder="e.g. Unit-02 (Outerwear Complex)"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Industry Sector
                </label>
                <select
                  value={sector}
                  onChange={e => setSector(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                >
                  {INDUSTRY_SECTORS.map(sec => (
                    <option key={sec} value={sec}>
                      {sec}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Factory Facility Code
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={factoryCode}
                    onChange={e => setFactoryCode(e.target.value)}
                    placeholder="e.g. DBN-U02"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Short Tag / Header Badge
                </label>
                <input
                  type="text"
                  value={shortTag}
                  onChange={e => setShortTag(e.target.value)}
                  placeholder="e.g. DBN-02"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono font-bold text-[#176f78] dark:text-teal-400 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Responsible Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Industrial Engineering (IE) Dept."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Facility Physical Address / Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Gorai, Mirzapur, Tangail / Gazipur Industrial Zone"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Established Year
                </label>
                <input
                  type="text"
                  value={establishedYear}
                  onChange={e => setEstablishedYear(e.target.value)}
                  placeholder="e.g. 2008"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Official Plant Contact Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="e.g. ie.unit02@debonairgroupbd.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              {/* Brand Accent Color Swatches */}
              <div>
                <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Brand Theme Color Accent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-[#d9d2c2] dark:border-[#384454] p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                  />
                </div>
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {['#176f78', '#059669', '#0284c7', '#7c3aed', '#d97706', '#e11d48', '#0f172a'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBrandColor(c)}
                      className={`w-5 h-5 rounded-full border transition-transform cursor-pointer ${
                        brandColor === c ? 'scale-125 ring-2 ring-[#176f78]' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={`Select ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Save Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846]">
              <div>
                {isSavedPlant && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Plant identity saved and applied across entire system!</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Plant Identity</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          TAB 2: PRODUCTION FLOOR TOPOLOGY & CUSTOMIZATION
      ======================================================== */}
      {activeTab === 'floors' && (
        <div className="space-y-6">
          {/* Header controls for floors */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbfaf6] dark:bg-[#181d24] p-4 rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846]">
            <div>
              <h3 className="font-bold text-sm text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176f78]" />
                <span>Operating Floors ({floors.length} Floors • {lines.length} Active Lines)</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Configure floor titles, building sectors, target efficiencies, and manage line assignments.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleOpenAddFloor}
                className="px-3.5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Floor</span>
              </button>
              <button
                type="button"
                onClick={handleResetToDefaultFloors}
                className="px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-white dark:bg-[#202732] hover:bg-[#f1eee6] text-xs font-bold text-[#527078] dark:text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
                title="Reset to Debonair Unit-02 standard floors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Floors Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {floorSummaries.map((summary, idx) => {
              const { floor, linesCount, linesRangeText, totalPresentMP, avgEfficiency, totalAchievedOutput, totalPlannedOutput, criticalBottlenecksCount, wipBreachesCount } = summary;

              return (
                <div
                  key={floor.id || floor.name}
                  className="rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1a202c] p-4.5 space-y-3.5 shadow-2xs hover:shadow-xs transition-all relative group"
                >
                  {/* Top Bar: Floor Color, Name, Reorder & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 ring-2 ring-white dark:ring-slate-800"
                        style={{ backgroundColor: floor.color || '#176f78' }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-[#17343a] dark:text-slate-100 font-display">
                            {floor.name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {floor.floorCode || `FL-${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                          {floor.building || 'Main Complex'}
                        </p>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Move Order */}
                      <button
                        type="button"
                        onClick={() => handleMoveFloorOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Move Floor Up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveFloorOrder(idx, 'down')}
                        disabled={idx === floorSummaries.length - 1}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                        title="Move Floor Down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Floor */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditFloor(floor)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#176f78] dark:text-teal-400 transition-colors cursor-pointer"
                        title={`Edit / Rename Floor "${floor.name}"`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Floor */}
                      <button
                        type="button"
                        onClick={() => handleOpenDeleteFloor(floor)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                        title={`Delete Floor "${floor.name}"`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Floor Metrics Snapshot */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-xl bg-[#fbfaf6] dark:bg-[#151a21] border border-[#f1eee6] dark:border-[#28323f] text-center">
                    <div>
                      <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-bold block">
                        Lines
                      </span>
                      <span className="text-sm font-extrabold text-[#17343a] dark:text-slate-100 font-mono">
                        {linesCount}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-bold block">
                        Avg Eff
                      </span>
                      <span className="text-sm font-extrabold text-[#176f78] dark:text-teal-400 font-mono">
                        {avgEfficiency}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-bold block">
                        Manpower
                      </span>
                      <span className="text-sm font-extrabold text-[#17343a] dark:text-slate-100 font-mono">
                        {totalPresentMP} MP
                      </span>
                    </div>
                  </div>

                  {/* Assigned Lines Range & Output */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[#527078] dark:text-slate-400">
                      <span>Assigned:</span>
                      <span className="font-bold text-[#17343a] dark:text-slate-200 font-mono">
                        {linesRangeText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[#527078] dark:text-slate-400">
                      <span>Output vs Target:</span>
                      <span className="font-bold font-mono">
                        <strong className="text-[#176f78] dark:text-teal-400">{totalAchievedOutput}</strong> / {totalPlannedOutput} pcs
                      </span>
                    </div>
                    {floor.floorManager && (
                      <div className="flex items-center justify-between text-[#527078] dark:text-slate-400">
                        <span>Floor Lead:</span>
                        <span className="font-medium text-[#17343a] dark:text-slate-200 truncate max-w-[160px]">
                          {floor.floorManager}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Alerts (Bottlenecks / WIP) */}
                  {(criticalBottlenecksCount > 0 || wipBreachesCount > 0) && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap text-[10px]">
                      {criticalBottlenecksCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold">
                          {criticalBottlenecksCount} Bottlenecks
                        </span>
                      )}
                      {wipBreachesCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
                          {wipBreachesCount} WIP Breaches
                        </span>
                      )}
                    </div>
                  )}

                  {/* Footer Action Links */}
                  <div className="pt-2 border-t border-[#f1eee6] dark:border-[#28323f] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenReassignLines(floor)}
                      className="text-[#176f78] dark:text-teal-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage Lines</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectFloor) onSelectFloor(floor.name, floor.name);
                          onNavigate('line-data', summary.lines[0]?.lineNo);
                        }}
                        className="text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-slate-200 font-medium flex items-center gap-1 cursor-pointer"
                        title={`Filter Floor "${floor.name}" in Line Data`}
                      >
                        <span>Filter in Line Data</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: PRESET FACTORY PROFILES
      ======================================================== */}
      {activeTab === 'presets' && (
        <div className="space-y-4">
          <div className="bg-[#fbfaf6] dark:bg-[#181d24] p-4 rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846]">
            <h3 className="font-bold text-sm text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Garment &amp; Industrial Manufacturing Plant Presets</span>
            </h3>
            <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
              Instantly switch your active enterprise configuration between verified industry plant profiles.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_FACTORIES.map(preset => {
              const isCurrent = (factoryProfile?.name || factoryName) === preset.name && (factoryProfile?.unitName || unitName) === preset.unitName;

              return (
                <div
                  key={preset.id}
                  className={`p-4.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'border-[#176f78] dark:border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 ring-2 ring-[#176f78]/20'
                      : 'border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1a202c] hover:border-[#176f78]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {preset.factoryCode || 'PRESET'}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Active Plant</span>
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-[#17343a] dark:text-slate-100 font-display">
                      {preset.name}
                    </h4>
                    <p className="text-xs text-[#176f78] dark:text-teal-400 font-semibold">
                      {preset.unitName}
                    </p>
                    <p className="text-xs text-[#527078] dark:text-slate-400">
                      {preset.industrySector}
                    </p>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{preset.addressLocation}</span>
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#f1eee6] dark:border-[#28323f] flex items-center justify-between">
                    <span className="text-xs text-[#527078] font-mono">
                      {preset.totalLinesCount || 34} Planned Lines
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectPresetFactory(preset)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-[#176f78] hover:bg-[#12555c] text-white shadow-2xs active:scale-95'
                      }`}
                    >
                      {isCurrent ? 'Current' : 'Load Preset'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADD NEW OPERATING FLOOR
      ======================================================== */}
      {isAddFloorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1a202c] border border-[#d9d2c2] dark:border-[#2e3846] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-[#176f78] dark:text-teal-300 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#17343a] dark:text-slate-100">
                    Add New Operating Floor
                  </h3>
                  <p className="text-xs text-[#527078] dark:text-slate-400">
                    Configure a new production floor in {factoryName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFloorModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAddFloor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Name *
                </label>
                <input
                  type="text"
                  required
                  value={newFloorName}
                  onChange={e => setNewFloorName(e.target.value)}
                  placeholder="e.g. Floor 04, Meghna, Mezzanine Pilot"
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Floor Code
                  </label>
                  <input
                    type="text"
                    value={newFloorCode}
                    onChange={e => setNewFloorCode(e.target.value)}
                    placeholder="e.g. FL-04"
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Building / Wing
                  </label>
                  <input
                    type="text"
                    value={newFloorBuilding}
                    onChange={e => setNewFloorBuilding(e.target.value)}
                    placeholder="e.g. Building A (South)"
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Target Efficiency (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={newFloorTargetEff}
                    onChange={e => setNewFloorTargetEff(parseInt(e.target.value) || 70)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Shift Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={newFloorHours}
                    onChange={e => setNewFloorHours(parseInt(e.target.value) || 8)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Supervisor / Manager
                </label>
                <input
                  type="text"
                  value={newFloorManager}
                  onChange={e => setNewFloorManager(e.target.value)}
                  placeholder="e.g. Engr. Mahmudul Hasan"
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100"
                />
              </div>

              {/* Color Accent Picker */}
              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Color Badge
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {FLOOR_COLOR_PALETTES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setNewFloorColor(p.value)}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        newFloorColor === p.value ? 'ring-2 ring-offset-2 ring-[#176f78] scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.value }}
                      title={p.name}
                    >
                      {newFloorColor === p.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Notes &amp; Specialization
                </label>
                <textarea
                  rows={2}
                  value={newFloorNotes}
                  onChange={e => setNewFloorNotes(e.target.value)}
                  placeholder="e.g. Heavy outerwear seam-seal and padding lines"
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFloorModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] text-slate-600 dark:text-slate-300 font-bold hover:bg-[#f1eee6] dark:hover:bg-[#202732] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Create Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT / RENAME OPERATING FLOOR
      ======================================================== */}
      {editingFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1a202c] border border-[#d9d2c2] dark:border-[#2e3846] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: editFloorColor || '#176f78' }}
                >
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#17343a] dark:text-slate-100">
                    Edit Floor: {editingFloor.name}
                  </h3>
                  <p className="text-xs text-[#527078] dark:text-slate-400">
                    Modify floor name, building wing, and line linkage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingFloor(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditFloor} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFloorName}
                  onChange={e => setEditFloorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-bold"
                />
              </div>

              {/* Automatic line re-tagging option */}
              {editingFloor.name.trim().toLowerCase() !== editFloorName.trim().toLowerCase() && (
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-start gap-2 text-[#176f78] dark:text-teal-300">
                  <input
                    type="checkbox"
                    id="sync-rename-lines"
                    checked={syncRenameLines}
                    onChange={e => setSyncRenameLines(e.target.checked)}
                    className="mt-0.5 rounded text-[#176f78] cursor-pointer"
                  />
                  <label htmlFor="sync-rename-lines" className="text-xs font-semibold cursor-pointer">
                    Automatically update all active lines on "{editingFloor.name}" to the new name "{editFloorName.trim()}"
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Floor Code
                  </label>
                  <input
                    type="text"
                    value={editFloorCode}
                    onChange={e => setEditFloorCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Building / Wing
                  </label>
                  <input
                    type="text"
                    value={editFloorBuilding}
                    onChange={e => setEditFloorBuilding(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Target Efficiency (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={editFloorTargetEff}
                    onChange={e => setEditFloorTargetEff(parseInt(e.target.value) || 70)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                    Shift Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={editFloorHours}
                    onChange={e => setEditFloorHours(parseInt(e.target.value) || 8)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Supervisor / Manager
                </label>
                <input
                  type="text"
                  value={editFloorManager}
                  onChange={e => setEditFloorManager(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100"
                />
              </div>

              {/* Color Accent Picker */}
              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Color Badge
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {FLOOR_COLOR_PALETTES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setEditFloorColor(p.value)}
                      className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                        editFloorColor === p.value ? 'ring-2 ring-offset-2 ring-[#176f78] scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: p.value }}
                      title={p.name}
                    >
                      {editFloorColor === p.value && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Floor Notes &amp; Specialization
                </label>
                <textarea
                  rows={2}
                  value={editFloorNotes}
                  onChange={e => setEditFloorNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingFloor(null)}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] text-slate-600 dark:text-slate-300 font-bold hover:bg-[#f1eee6] dark:hover:bg-[#202732] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Save Floor Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REASSIGN LINES BETWEEN FLOORS
      ======================================================== */}
      {isReassignModalOpen && reassignSourceFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1a202c] border border-[#d9d2c2] dark:border-[#2e3846] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-[#176f78]" />
                  <span>Reassign Lines from {reassignSourceFloor.name}</span>
                </h3>
                <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                  Select lines to move and specify target destination floor
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReassignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  Destination Floor *
                </label>
                <select
                  value={destinationFloorName}
                  onChange={e => setDestinationFloorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-bold"
                >
                  {floors
                    .filter(f => f.id !== reassignSourceFloor.id)
                    .map(f => (
                      <option key={f.id || f.name} value={f.name}>
                        {f.name} ({f.building || 'Building Complex'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-[#17343a] dark:text-slate-200">
                    Select Lines to Transfer ({selectedLinesToMove.length} Selected)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const matched = lines.filter(l => (l.floor?.trim().toLowerCase() || '') === reassignSourceFloor.name.trim().toLowerCase());
                        setSelectedLinesToMove(matched.map(l => l.lineNo));
                      }}
                      className="text-[#176f78] dark:text-teal-400 hover:underline font-bold"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedLinesToMove([])}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21]">
                  {lines
                    .filter(l => (l.floor?.trim().toLowerCase() || '') === reassignSourceFloor.name.trim().toLowerCase())
                    .map(line => {
                      const isSelected = selectedLinesToMove.includes(line.lineNo);
                      return (
                        <button
                          key={line.id || line.lineNo}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLinesToMove(prev => prev.filter(n => n !== line.lineNo));
                            } else {
                              setSelectedLinesToMove(prev => [...prev, line.lineNo]);
                            }
                          }}
                          className={`p-2 rounded-xl border font-mono font-bold text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#176f78] bg-teal-50 dark:bg-teal-950/60 text-[#176f78] dark:text-teal-300 ring-1 ring-[#176f78]'
                              : 'border-[#d9d2c2] dark:border-[#384454] bg-white dark:bg-[#202732] text-slate-700 dark:text-slate-300 hover:bg-[#f1eee6]'
                          }`}
                        >
                          Line {line.lineNo}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReassignModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#384454] text-slate-600 dark:text-slate-300 font-bold hover:bg-[#f1eee6] dark:hover:bg-[#202732] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedLinesToMove.length === 0 || !destinationFloorName}
                  onClick={handleConfirmReassignLines}
                  className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] disabled:opacity-40 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Transfer {selectedLinesToMove.length} Line(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: DELETE / DECOMMISSION OPERATING FLOOR
      ======================================================== */}
      {floorToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#1a202c] border border-rose-200 dark:border-rose-900/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#17343a] dark:text-slate-100">
                  Decommission Floor: {floorToDelete.name}
                </h3>
                <p className="text-xs text-[#527078] dark:text-slate-400">
                  Choose how to handle the active lines assigned to this floor
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block p-3 rounded-2xl border cursor-pointer transition-all border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] hover:bg-white">
                <div className="flex items-center gap-2 font-bold text-[#17343a] dark:text-slate-200 mb-1">
                  <input
                    type="radio"
                    name="delete-floor-mode"
                    value="reassign"
                    checked={deleteMode === 'reassign'}
                    onChange={() => setDeleteMode('reassign')}
                    className="text-[#176f78]"
                  />
                  <span>Reassign lines to another floor (Recommended)</span>
                </div>
                {deleteMode === 'reassign' && (
                  <div className="mt-2 pl-5">
                    <label className="block text-[11px] text-[#527078] mb-1">Target Floor:</label>
                    <select
                      value={reassignTargetFloorName}
                      onChange={e => setReassignTargetFloorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] dark:border-[#384454] bg-white dark:bg-[#1a202c]"
                    >
                      {floors
                        .filter(f => f.id !== floorToDelete.id)
                        .map(f => (
                          <option key={f.id || f.name} value={f.name}>
                            {f.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </label>

              <label className="block p-3 rounded-2xl border cursor-pointer transition-all border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <input
                    type="radio"
                    name="delete-floor-mode"
                    value="delete_all_lines"
                    checked={deleteMode === 'delete_all_lines'}
                    onChange={() => setDeleteMode('delete_all_lines')}
                    className="text-rose-600"
                  />
                  <span>Delete all lines assigned to this floor</span>
                </div>
                <p className="text-[11px] text-rose-700 pl-5">
                  Warning: Permanently removes lines on {floorToDelete.name} from the active schedule.
                </p>
              </label>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setFloorToDelete(null)}
                className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-slate-600 dark:text-slate-300 font-bold hover:bg-[#f1eee6] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteFloor}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
