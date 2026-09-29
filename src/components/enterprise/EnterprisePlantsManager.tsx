/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enterprise Plants & Multiple Managements Hub
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Factory,
  Users,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Layers,
  ArrowRight,
  Sparkles,
  Sliders,
  Check,
  X,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Search,
  Filter,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Award,
  Hash,
  Activity,
  Globe,
  Briefcase,
  Crown,
  Shield,
  Workflow,
  Network,
  ChevronDown,
  CheckSquare,
  Square
} from 'lucide-react';
import { EnterprisePlant, ManagementDivision, ManagementMember, PlantFloorConfig, UserProfile, PlantLeadershipMember } from '../../types';
import {
  getStoredEnterprisePlants,
  saveStoredEnterprisePlants,
  getActiveEnterprisePlant,
  setActiveEnterprisePlant,
  getStoredManagementDivisions,
  saveStoredManagementDivisions,
  getStoredPlantLeaderships,
  saveStoredPlantLeaderships,
  calculateEnterpriseAggregateStats,
  INITIAL_ENTERPRISE_PLANTS,
  INITIAL_MANAGEMENT_DIVISIONS,
  INITIAL_PLANT_LEADERSHIPS,
  plantToFactoryProfile
} from '../../utils/enterpriseManager';
import { INDUSTRY_SECTORS } from '../../data/factoryProfiles';
import { isMasterAdminOrAdmin } from '../../utils/rbac';

interface EnterprisePlantsManagerProps {
  profile?: UserProfile;
  onActivePlantChanged?: (plant: EnterprisePlant) => void;
  onClose?: () => void;
  initialTab?: 'plants' | 'managements' | 'leaderships' | 'matrix';
}

export const EnterprisePlantsManager: React.FC<EnterprisePlantsManagerProps> = ({
  profile,
  onActivePlantChanged,
  onClose,
  initialTab = 'plants'
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const [activeTab, setActiveTab] = useState<'plants' | 'managements' | 'leaderships' | 'matrix'>(initialTab);

  // Core Data
  const [plants, setPlants] = useState<EnterprisePlant[]>(() => getStoredEnterprisePlants());
  const [activePlant, setActivePlant] = useState<EnterprisePlant>(() => getActiveEnterprisePlant());
  const [managements, setManagements] = useState<ManagementDivision[]>(() => getStoredManagementDivisions());
  const [leaderships, setLeaderships] = useState<PlantLeadershipMember[]>(() => getStoredPlantLeaderships());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [plantFilterForMgt, setPlantFilterForMgt] = useState<string>('all');
  const [selectedPlantForLeadership, setSelectedPlantForLeadership] = useState<string>('all');
  const [leadershipTierFilter, setLeadershipTierFilter] = useState<string>('all');

  // Modals & Forms State
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);

  const [isMgtModalOpen, setIsMgtModalOpen] = useState(false);
  const [editingMgtId, setEditingMgtId] = useState<string | null>(null);

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [selectedMgtForRoster, setSelectedMgtForRoster] = useState<ManagementDivision | null>(null);

  // Leadership Modal & Org Tree State
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [editingLeaderId, setEditingLeaderId] = useState<string | null>(null);
  const [isOrgTreeOpen, setIsOrgTreeOpen] = useState(false);
  const [selectedPlantForOrgTree, setSelectedPlantForOrgTree] = useState<string>(activePlant.id);

  // Leader Form State
  const [leaderFormPlantId, setLeaderFormPlantId] = useState<string>(activePlant.id);
  const [leaderFormName, setLeaderFormName] = useState('');
  const [leaderFormTitle, setLeaderFormTitle] = useState('General Manager Operations');
  const [leaderFormTier, setLeaderFormTier] = useState<'plant_executive' | 'departmental_head' | 'divisional_lead' | 'floor_commander'>('departmental_head');
  const [leaderFormEmail, setLeaderFormEmail] = useState('');
  const [leaderFormPhone, setLeaderFormPhone] = useState('');
  const [leaderFormLinesRange, setLeaderFormLinesRange] = useState('Lines 01 - 34');
  const [leaderFormFloors, setLeaderFormFloors] = useState<string[]>([]);
  const [leaderFormAuthorities, setLeaderFormAuthorities] = useState<string[]>([
    'Line Rebalancing Sign-Off',
    'Target Efficiency Approval'
  ]);
  const [leaderFormKpi, setLeaderFormKpi] = useState('Maintain 85.0%+ Target Efficiency with zero floor stalls');
  const [leaderFormStatus, setLeaderFormStatus] = useState<'active' | 'on_floor' | 'in_standup' | 'leave'>('active');
  const [leaderFormIsPlantHead, setLeaderFormIsPlantHead] = useState(false);
  const [leaderFormColor, setLeaderFormColor] = useState('#176f78');
  const [leaderFormNotes, setLeaderFormNotes] = useState('');
  const [leaderFormYears, setLeaderFormYears] = useState(10);
  const [leaderFormReports, setLeaderFormReports] = useState(18);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    saveStoredEnterprisePlants(plants);
  }, [plants]);

  useEffect(() => {
    saveStoredManagementDivisions(managements);
  }, [managements]);

  useEffect(() => {
    saveStoredPlantLeaderships(leaderships);
  }, [leaderships]);

  // Aggregate Stats
  const stats = useMemo(() => calculateEnterpriseAggregateStats(plants), [plants]);

  // Handle Plant Activation
  const handleSelectActivePlant = (plant: EnterprisePlant) => {
    const updated = setActiveEnterprisePlant(plant.id);
    if (updated) {
      setActivePlant(updated);
      if (onActivePlantChanged) {
        onActivePlantChanged(updated);
      }
      showToast(`Active Enterprise Plant switched to "${updated.name} - ${updated.unitName}"`);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // PLANT FORM STATE & HANDLERS
  // ─────────────────────────────────────────────────────────────
  const [plantFormName, setPlantFormName] = useState('');
  const [plantFormUnitName, setPlantFormUnitName] = useState('');
  const [plantFormCode, setPlantFormCode] = useState('');
  const [plantFormGroup, setPlantFormGroup] = useState('Debonair Group Bangladesh');
  const [plantFormSector, setPlantFormSector] = useState(INDUSTRY_SECTORS[0]);
  const [plantFormDept, setPlantFormDept] = useState('Industrial Engineering (IE) Dept.');
  const [plantFormAddress, setPlantFormAddress] = useState('');
  const [plantFormEmail, setPlantFormEmail] = useState('');
  const [plantFormYear, setPlantFormYear] = useState('2024');
  const [plantFormTotalLines, setPlantFormTotalLines] = useState<number>(24);
  const [plantFormHeadName, setPlantFormHeadName] = useState('');
  const [plantFormHeadTitle, setPlantFormHeadTitle] = useState('General Manager Operations');
  const [plantFormHeadEmail, setPlantFormHeadEmail] = useState('');
  const [plantFormHeadPhone, setPlantFormHeadPhone] = useState('');
  const [plantFormShiftHours, setPlantFormShiftHours] = useState<number>(8);
  const [plantFormBenchmark, setPlantFormBenchmark] = useState<number>(85.0);
  const [plantFormColor, setPlantFormColor] = useState('#176f78');
  const [plantFormFloorsInput, setPlantFormFloorsInput] = useState('Floor 01 (06 Lines), Floor 02 (06 Lines), Floor 03 (06 Lines), Floor 04 (06 Lines)');
  const [plantFormNotes, setPlantFormNotes] = useState('');

  const openCreatePlantModal = () => {
    setEditingPlantId(null);
    setPlantFormName('Debonair LTD');
    setPlantFormUnitName('Unit-04 (Smart Assembly Complex)');
    setPlantFormCode('DBN-U04');
    setPlantFormGroup('Debonair Group Bangladesh');
    setPlantFormSector(INDUSTRY_SECTORS[0]);
    setPlantFormDept('Industrial Engineering & Automation Cell');
    setPlantFormAddress('Gorai Industrial Zone, Mirzapur, Tangail');
    setPlantFormEmail('ie.unit04@debonairgroupbd.com');
    setPlantFormYear('2026');
    setPlantFormTotalLines(24);
    setPlantFormHeadName('Ashik Hossain');
    setPlantFormHeadTitle('Head of Industrial Engineering / Sr. Manager');
    setPlantFormHeadEmail('ashik.hossain@debonairbd.com');
    setPlantFormHeadPhone('+880 1711-002233');
    setPlantFormShiftHours(8);
    setPlantFormBenchmark(85.0);
    setPlantFormColor('#0f766e');
    setPlantFormFloorsInput('Padma Floor (06 Lines), Meghna Floor (06 Lines), Karnophuli Floor (06 Lines), Korotoya Floor (06 Lines)');
    setPlantFormNotes('Automated smart conveyor sewing lines with integrated pitch balancing and IoT needle counters.');
    setIsPlantModalOpen(true);
  };

  const openEditPlantModal = (p: EnterprisePlant) => {
    setEditingPlantId(p.id);
    setPlantFormName(p.name);
    setPlantFormUnitName(p.unitName);
    setPlantFormCode(p.plantCode);
    setPlantFormGroup(p.enterpriseGroup || 'Debonair Group Bangladesh');
    setPlantFormSector(p.industrySector);
    setPlantFormDept(p.department);
    setPlantFormAddress(p.addressLocation);
    setPlantFormEmail(p.contactEmail || '');
    setPlantFormYear(p.establishedYear || '2024');
    setPlantFormTotalLines(p.totalLinesCount || 24);
    setPlantFormHeadName(p.plantHead?.name || '');
    setPlantFormHeadTitle(p.plantHead?.designation || 'Plant Manager');
    setPlantFormHeadEmail(p.plantHead?.email || '');
    setPlantFormHeadPhone(p.plantHead?.phone || '');
    setPlantFormShiftHours(p.shiftHours || 8);
    setPlantFormBenchmark(p.targetEfficiencyBenchmark || 85.0);
    setPlantFormColor(p.brandColor || '#176f78');
    setPlantFormNotes(p.notes || '');

    const floorsStr = p.floors && p.floors.length > 0
      ? p.floors.map(f => `${f.name} (${f.linesCount < 10 ? '0' + f.linesCount : f.linesCount} Lines)`).join(', ')
      : 'Floor 01 (06 Lines), Floor 02 (06 Lines)';
    setPlantFormFloorsInput(floorsStr);

    setIsPlantModalOpen(true);
  };

  const handleSavePlantForm = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse floors
    const floorItems = plantFormFloorsInput.split(',').map((part, idx) => {
      const trimmed = part.trim();
      const match = trimmed.match(/(.+?)\s*\((\d+)\s*Lines?\)/i);
      if (match) {
        return {
          id: `fl_${idx + 1}_${Date.now()}`,
          name: match[1].trim(),
          linesCount: parseInt(match[2], 10) || 6,
          assignedLinesRange: `Section ${idx + 1}`
        };
      }
      return {
        id: `fl_${idx + 1}_${Date.now()}`,
        name: trimmed || `Floor ${idx + 1}`,
        linesCount: Math.max(1, Math.round(plantFormTotalLines / 4)),
        assignedLinesRange: `Section ${idx + 1}`
      };
    });

    if (editingPlantId) {
      // Update existing
      setPlants(prev => prev.map(p => {
        if (p.id === editingPlantId) {
          const updated: EnterprisePlant = {
            ...p,
            name: plantFormName.trim(),
            unitName: plantFormUnitName.trim(),
            plantCode: plantFormCode.trim().toUpperCase(),
            enterpriseGroup: plantFormGroup.trim(),
            industrySector: plantFormSector,
            department: plantFormDept.trim(),
            addressLocation: plantFormAddress.trim(),
            contactEmail: plantFormEmail.trim(),
            establishedYear: plantFormYear.trim(),
            totalLinesCount: Number(plantFormTotalLines) || 24,
            plantHead: {
              name: plantFormHeadName.trim(),
              designation: plantFormHeadTitle.trim(),
              email: plantFormHeadEmail.trim(),
              phone: plantFormHeadPhone.trim()
            },
            shiftHours: Number(plantFormShiftHours) || 8,
            targetEfficiencyBenchmark: Number(plantFormBenchmark) || 85.0,
            brandColor: plantFormColor,
            floors: floorItems,
            notes: plantFormNotes.trim(),
            updatedAt: new Date().toISOString()
          };
          if (activePlant.id === updated.id) {
            setActivePlant(updated);
            if (onActivePlantChanged) onActivePlantChanged(updated);
          }
          return updated;
        }
        return p;
      }));
      showToast(`Enterprise Plant "${plantFormName} - ${plantFormUnitName}" updated successfully.`);
    } else {
      // Create new
      const newPlant: EnterprisePlant = {
        id: `plant_${Date.now()}`,
        name: plantFormName.trim(),
        unitName: plantFormUnitName.trim(),
        plantCode: plantFormCode.trim().toUpperCase() || `PLN-${Date.now().toString().slice(-4)}`,
        enterpriseGroup: plantFormGroup.trim(),
        industrySector: plantFormSector,
        department: plantFormDept.trim(),
        addressLocation: plantFormAddress.trim(),
        shortTag: plantFormCode.trim().toUpperCase() || 'PLN',
        brandColor: plantFormColor,
        establishedYear: plantFormYear.trim() || '2026',
        totalLinesCount: Number(plantFormTotalLines) || 24,
        contactEmail: plantFormEmail.trim(),
        plantHead: {
          name: plantFormHeadName.trim() || 'Plant Head',
          designation: plantFormHeadTitle.trim() || 'General Manager Operations',
          email: plantFormHeadEmail.trim(),
          phone: plantFormHeadPhone.trim()
        },
        shiftHours: Number(plantFormShiftHours) || 8,
        targetEfficiencyBenchmark: Number(plantFormBenchmark) || 85.0,
        floors: floorItems,
        status: 'active',
        isCustom: true,
        notes: plantFormNotes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setPlants(prev => [newPlant, ...prev]);
      showToast(`New Enterprise Plant "${newPlant.name} - ${newPlant.unitName}" created!`);
    }

    setIsPlantModalOpen(false);
  };

  const handleDeletePlant = (plantId: string) => {
    if (activePlant.id === plantId) {
      alert('Cannot delete the currently active plant. Switch to another active plant first.');
      return;
    }
    if (confirm('Are you sure you want to remove this Enterprise Plant from the multi-plant directory?')) {
      setPlants(prev => prev.filter(p => p.id !== plantId));
      showToast('Enterprise Plant removed from directory.');
    }
  };

  const handleDuplicatePlant = (source: EnterprisePlant) => {
    const cloned: EnterprisePlant = {
      ...source,
      id: `plant_${Date.now()}`,
      unitName: `${source.unitName} (Copy)`,
      plantCode: `${source.plantCode}-CPY`,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPlants(prev => [cloned, ...prev]);
    showToast(`Duplicated plant "${cloned.unitName}".`);
  };

  // ─────────────────────────────────────────────────────────────
  // MANAGEMENT FORM STATE & HANDLERS
  // ─────────────────────────────────────────────────────────────
  const [mgtFormName, setMgtFormName] = useState('');
  const [mgtFormCode, setMgtFormCode] = useState('');
  const [mgtFormPlantId, setMgtFormPlantId] = useState('plant_debonair_u02');
  const [mgtFormLeadName, setMgtFormLeadName] = useState('');
  const [mgtFormLeadTitle, setMgtFormLeadTitle] = useState('');
  const [mgtFormLeadEmail, setMgtFormLeadEmail] = useState('');
  const [mgtFormLeadPhone, setMgtFormLeadPhone] = useState('');
  const [mgtFormLeadTier, setMgtFormLeadTier] = useState('tier_2');
  const [mgtFormDeputyName, setMgtFormDeputyName] = useState('');
  const [mgtFormDeputyTitle, setMgtFormDeputyTitle] = useState('');
  const [mgtFormAssignedLines, setMgtFormAssignedLines] = useState('');
  const [mgtFormAssignedFloors, setMgtFormAssignedFloors] = useState('');
  const [mgtFormCadreCount, setMgtFormCadreCount] = useState<number>(12);
  const [mgtFormTargetEff, setMgtFormTargetEff] = useState<number>(85.0);
  const [mgtFormBudget, setMgtFormBudget] = useState('$40,000 / mo');
  const [mgtFormKpis, setMgtFormKpis] = useState('Pitch Balancing, WIP Control, Needle Breakage Takt');
  const [mgtFormReportingTo, setMgtFormReportingTo] = useState('General Manager Operations');
  const [mgtFormColor, setMgtFormColor] = useState('#2563eb');
  const [mgtFormNotes, setMgtFormNotes] = useState('');

  const openCreateMgtModal = () => {
    setEditingMgtId(null);
    setMgtFormName('Garment Assembly & Sewing Management');
    setMgtFormCode('MGT-SEW');
    setMgtFormPlantId(activePlant.id);
    setMgtFormLeadName('Tanvir Ahmed');
    setMgtFormLeadTitle('Divisional Production Manager');
    setMgtFormLeadEmail('tanvir.a@debonairbd.com');
    setMgtFormLeadPhone('+880 1711-889900');
    setMgtFormLeadTier('tier_2');
    setMgtFormDeputyName('Md. Rafiqul Islam');
    setMgtFormDeputyTitle('Assistant Production Manager');
    setMgtFormAssignedLines('01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17');
    setMgtFormAssignedFloors('Padma Floor, Meghna Floor, Karnophuli Floor');
    setMgtFormCadreCount(18);
    setMgtFormTargetEff(85.5);
    setMgtFormBudget('$45,000 / mo');
    setMgtFormKpis('Line Balancing & Pitch Time, Daily Top 5 Standup, WIP Kanban Compliance');
    setMgtFormReportingTo('Executive Director Operations & HOD IE');
    setMgtFormColor('#2563eb');
    setMgtFormNotes('Direct operational execution management commanding sewing lines, supervisors, and mechanic takts.');
    setIsMgtModalOpen(true);
  };

  const openEditMgtModal = (m: ManagementDivision) => {
    setEditingMgtId(m.id);
    setMgtFormName(m.name);
    setMgtFormCode(m.divisionCode);
    setMgtFormPlantId(m.plantId);
    setMgtFormLeadName(m.lead.name);
    setMgtFormLeadTitle(m.lead.designation);
    setMgtFormLeadEmail(m.lead.email);
    setMgtFormLeadPhone(m.lead.phone || '');
    setMgtFormLeadTier(m.lead.tierLevel || 'tier_2');
    setMgtFormDeputyName(m.deputyLead?.name || '');
    setMgtFormDeputyTitle(m.deputyLead?.designation || '');
    setMgtFormAssignedLines(m.assignedLines.join(', '));
    setMgtFormAssignedFloors(m.assignedFloors.join(', '));
    setMgtFormCadreCount(m.cadreCount || 10);
    setMgtFormTargetEff(m.targetEfficiency || 85.0);
    setMgtFormBudget(m.operatingBudgetMonthly || '');
    setMgtFormKpis(m.kpiFocus.join(', '));
    setMgtFormReportingTo(m.reportingTo || 'General Manager Operations');
    setMgtFormColor(m.colorTheme || '#176f78');
    setMgtFormNotes(m.notes || '');
    setIsMgtModalOpen(true);
  };

  const handleSaveMgtForm = (e: React.FormEvent) => {
    e.preventDefault();

    const linesList = mgtFormAssignedLines
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const floorsList = mgtFormAssignedFloors
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const kpiList = mgtFormKpis
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const targetPlant = plants.find(p => p.id === mgtFormPlantId);

    if (editingMgtId) {
      setManagements(prev => prev.map(m => {
        if (m.id === editingMgtId) {
          return {
            ...m,
            name: mgtFormName.trim(),
            divisionCode: mgtFormCode.trim().toUpperCase(),
            plantId: mgtFormPlantId,
            plantName: targetPlant ? `${targetPlant.name} (${targetPlant.unitName})` : m.plantName,
            lead: {
              name: mgtFormLeadName.trim(),
              designation: mgtFormLeadTitle.trim(),
              email: mgtFormLeadEmail.trim(),
              phone: mgtFormLeadPhone.trim(),
              tierLevel: mgtFormLeadTier,
              avatarColor: mgtFormColor
            },
            deputyLead: mgtFormDeputyName.trim() ? {
              name: mgtFormDeputyName.trim(),
              designation: mgtFormDeputyTitle.trim()
            } : undefined,
            assignedLines: linesList,
            assignedFloors: floorsList,
            cadreCount: Number(mgtFormCadreCount) || linesList.length,
            targetEfficiency: Number(mgtFormTargetEff) || 85.0,
            operatingBudgetMonthly: mgtFormBudget.trim(),
            kpiFocus: kpiList,
            reportingTo: mgtFormReportingTo.trim(),
            colorTheme: mgtFormColor,
            notes: mgtFormNotes.trim(),
            updatedAt: new Date().toISOString()
          };
        }
        return m;
      }));
      showToast(`Management Division "${mgtFormName}" updated.`);
    } else {
      const newMgt: ManagementDivision = {
        id: `mgt_${Date.now()}`,
        name: mgtFormName.trim(),
        divisionCode: mgtFormCode.trim().toUpperCase() || `MGT-${Date.now().toString().slice(-3)}`,
        plantId: mgtFormPlantId,
        plantName: targetPlant ? `${targetPlant.name} (${targetPlant.unitName})` : 'Enterprise Wide',
        lead: {
          name: mgtFormLeadName.trim(),
          designation: mgtFormLeadTitle.trim(),
          email: mgtFormLeadEmail.trim(),
          phone: mgtFormLeadPhone.trim(),
          tierLevel: mgtFormLeadTier,
          avatarColor: mgtFormColor
        },
        deputyLead: mgtFormDeputyName.trim() ? {
          name: mgtFormDeputyName.trim(),
          designation: mgtFormDeputyTitle.trim()
        } : undefined,
        assignedLines: linesList,
        assignedFloors: floorsList,
        cadreCount: Number(mgtFormCadreCount) || linesList.length,
        targetEfficiency: Number(mgtFormTargetEff) || 85.0,
        operatingBudgetMonthly: mgtFormBudget.trim(),
        kpiFocus: kpiList,
        status: 'active',
        reportingTo: mgtFormReportingTo.trim(),
        colorTheme: mgtFormColor,
        members: [
          {
            id: `mbr_${Date.now()}_1`,
            name: mgtFormLeadName.trim(),
            role: mgtFormLeadTitle.trim() || 'Division Lead',
            lineOrFloor: 'All Assigned Lines',
            contact: mgtFormLeadEmail.trim(),
            status: 'active',
            avatarColor: mgtFormColor
          }
        ],
        notes: mgtFormNotes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setManagements(prev => [newMgt, ...prev]);
      showToast(`New Management Division "${newMgt.name}" created!`);
    }

    setIsMgtModalOpen(false);
  };

  const handleDeleteMgt = (mgtId: string) => {
    if (confirm('Are you sure you want to remove this Management Division?')) {
      setManagements(prev => prev.filter(m => m.id !== mgtId));
      showToast('Management Division removed.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // ROSTER MANAGEMENT STATE & HANDLERS
  // ─────────────────────────────────────────────────────────────
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('IE Incharge');
  const [newMemberScope, setNewMemberScope] = useState('');
  const [newMemberContact, setNewMemberContact] = useState('');

  const openRosterModal = (m: ManagementDivision) => {
    setSelectedMgtForRoster(m);
    setNewMemberName('');
    setNewMemberRole('Floor Incharge');
    setNewMemberScope(m.assignedFloors[0] || 'Sewing Floor');
    setNewMemberContact('');
    setIsRosterModalOpen(true);
  };

  const handleAddMemberToRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMgtForRoster || !newMemberName.trim()) return;

    const newMbr: ManagementMember = {
      id: `mbr_${Date.now()}`,
      name: newMemberName.trim(),
      role: newMemberRole.trim(),
      lineOrFloor: newMemberScope.trim() || 'Floor Operations',
      contact: newMemberContact.trim(),
      status: 'active',
      avatarColor: selectedMgtForRoster.colorTheme || '#176f78'
    };

    const updatedMgt: ManagementDivision = {
      ...selectedMgtForRoster,
      members: [...(selectedMgtForRoster.members || []), newMbr],
      cadreCount: (selectedMgtForRoster.members?.length || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    setManagements(prev => prev.map(m => m.id === updatedMgt.id ? updatedMgt : m));
    setSelectedMgtForRoster(updatedMgt);
    setNewMemberName('');
    showToast(`Added "${newMbr.name}" to ${updatedMgt.name} roster.`);
  };

  const handleRemoveMember = (mgtId: string, memberId: string) => {
    setManagements(prev => prev.map(m => {
      if (m.id === mgtId) {
        const nextMembers = (m.members || []).filter(mb => mb.id !== memberId);
        const updated = {
          ...m,
          members: nextMembers,
          cadreCount: Math.max(1, nextMembers.length)
        };
        if (selectedMgtForRoster?.id === mgtId) {
          setSelectedMgtForRoster(updated);
        }
        return updated;
      }
      return m;
    }));
    showToast('Member removed from management roster.');
  };

  // ─────────────────────────────────────────────────────────────
  // PLANT LEADERSHIP STATE & HANDLERS ("THEY MANAGE THEIR OWN PLANTS")
  // ─────────────────────────────────────────────────────────────
  const AVAILABLE_AUTHORITIES = [
    'Line Rebalancing Sign-Off',
    'Target Efficiency Approval',
    'SMV / SAM Override Approval',
    'OT & Shift Authorization',
    'Quality Gate Pass Sign-Off',
    'Machinery Relocation Approval',
    'Operator Skill Promotion',
    'Buyer Technical Audit Clearance',
    'Capacity Loading & Takt Release'
  ];

  const openCreateLeaderModal = (preselectedPlantId?: string) => {
    setEditingLeaderId(null);
    const targetPlantId = preselectedPlantId || (selectedPlantForLeadership !== 'all' ? selectedPlantForLeadership : activePlant.id);
    const targetPlant = plants.find(p => p.id === targetPlantId) || activePlant;
    setLeaderFormPlantId(targetPlant.id);
    setLeaderFormName('');
    setLeaderFormTitle('Head of Industrial Engineering & Work Study');
    setLeaderFormTier('departmental_head');
    setLeaderFormEmail('');
    setLeaderFormPhone('');
    setLeaderFormLinesRange(`Lines 01 - ${targetPlant.totalLinesCount || 24}`);
    setLeaderFormFloors(targetPlant.floors?.map(f => f.name) || []);
    setLeaderFormAuthorities(['Line Rebalancing Sign-Off', 'Target Efficiency Approval']);
    setLeaderFormKpi(`Maintain ${targetPlant.targetEfficiencyBenchmark || 85}%+ benchmark efficiency with synchronized balance`);
    setLeaderFormStatus('active');
    setLeaderFormIsPlantHead(false);
    setLeaderFormColor(targetPlant.brandColor || '#176f78');
    setLeaderFormNotes('');
    setLeaderFormYears(8);
    setLeaderFormReports(12);
    setIsLeaderModalOpen(true);
  };

  const openEditLeaderModal = (ldr: PlantLeadershipMember) => {
    setEditingLeaderId(ldr.id);
    setLeaderFormPlantId(ldr.plantId);
    setLeaderFormName(ldr.name);
    setLeaderFormTitle(ldr.designation);
    setLeaderFormTier(ldr.leadershipTier);
    setLeaderFormEmail(ldr.email);
    setLeaderFormPhone(ldr.phone || '');
    setLeaderFormLinesRange(ldr.managedLinesRange || 'Lines 01 - 24');
    setLeaderFormFloors(ldr.managedFloors || []);
    setLeaderFormAuthorities(ldr.delegatedAuthorities || []);
    setLeaderFormKpi(ldr.kpiCommitment || '');
    setLeaderFormStatus(ldr.status);
    setLeaderFormIsPlantHead(Boolean(ldr.isPlantHead));
    setLeaderFormColor(ldr.avatarColor || '#176f78');
    setLeaderFormNotes(ldr.notes || '');
    setLeaderFormYears(ldr.yearsInLeadership || 10);
    setLeaderFormReports(ldr.directReportsCount || 15);
    setIsLeaderModalOpen(true);
  };

  const handleToggleAuthority = (auth: string) => {
    setLeaderFormAuthorities(prev =>
      prev.includes(auth) ? prev.filter(a => a !== auth) : [...prev, auth]
    );
  };

  const handleToggleLeaderFloor = (flName: string) => {
    setLeaderFormFloors(prev =>
      prev.includes(flName) ? prev.filter(f => f !== flName) : [...prev, flName]
    );
  };

  const handleSaveLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderFormName.trim()) {
      alert('Please specify the Leader Full Name.');
      return;
    }
    const assignedPlant = plants.find(p => p.id === leaderFormPlantId) || activePlant;

    if (editingLeaderId) {
      const updatedLeader: PlantLeadershipMember = {
        id: editingLeaderId,
        plantId: assignedPlant.id,
        plantName: `${assignedPlant.name} (${assignedPlant.shortTag})`,
        name: leaderFormName.trim(),
        designation: leaderFormTitle.trim(),
        leadershipTier: leaderFormTier,
        email: leaderFormEmail.trim(),
        phone: leaderFormPhone.trim(),
        avatarColor: leaderFormColor,
        yearsInLeadership: Number(leaderFormYears) || 5,
        directReportsCount: Number(leaderFormReports) || 10,
        delegatedAuthorities: leaderFormAuthorities,
        managedLinesRange: leaderFormLinesRange.trim(),
        managedFloors: leaderFormFloors,
        kpiCommitment: leaderFormKpi.trim(),
        status: leaderFormStatus,
        isPlantHead: leaderFormIsPlantHead,
        notes: leaderFormNotes.trim(),
      };
      setLeaderships(prev => prev.map(l => l.id === editingLeaderId ? updatedLeader : l));
      showToast(`Leader "${updatedLeader.name}" updated for ${assignedPlant.unitName}.`);
    } else {
      const newLeader: PlantLeadershipMember = {
        id: `ldr_${Date.now()}`,
        plantId: assignedPlant.id,
        plantName: `${assignedPlant.name} (${assignedPlant.shortTag})`,
        name: leaderFormName.trim(),
        designation: leaderFormTitle.trim(),
        leadershipTier: leaderFormTier,
        email: leaderFormEmail.trim(),
        phone: leaderFormPhone.trim(),
        avatarColor: leaderFormColor,
        yearsInLeadership: Number(leaderFormYears) || 5,
        directReportsCount: Number(leaderFormReports) || 10,
        delegatedAuthorities: leaderFormAuthorities,
        managedLinesRange: leaderFormLinesRange.trim(),
        managedFloors: leaderFormFloors,
        kpiCommitment: leaderFormKpi.trim(),
        status: leaderFormStatus,
        isPlantHead: leaderFormIsPlantHead,
        notes: leaderFormNotes.trim(),
        createdAt: new Date().toISOString()
      };
      setLeaderships(prev => [newLeader, ...prev]);
      showToast(`New Leader "${newLeader.name}" appointed to ${assignedPlant.unitName}!`);
    }
    setIsLeaderModalOpen(false);
  };

  const handleDeleteLeader = (leaderId: string) => {
    if (confirm('Are you sure you want to remove this Leader from their plant?')) {
      setLeaderships(prev => prev.filter(l => l.id !== leaderId));
      showToast('Leader removed from plant leadership council.');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BACKUP & RESET
  // ─────────────────────────────────────────────────────────────
  const handleExportJson = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      activePlantId: activePlant.id,
      plants,
      managements,
      leaderships
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enterprise_plants_managements_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Enterprise plants, leaderships & managements exported to JSON.');
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset enterprise plants, leaderships, and managements to initial factory benchmark defaults?')) {
      setPlants(INITIAL_ENTERPRISE_PLANTS);
      setManagements(INITIAL_MANAGEMENT_DIVISIONS);
      setLeaderships(INITIAL_PLANT_LEADERSHIPS);
      setActiveEnterprisePlant(INITIAL_ENTERPRISE_PLANTS[0].id);
      setActivePlant(INITIAL_ENTERPRISE_PLANTS[0]);
      if (onActivePlantChanged) onActivePlantChanged(INITIAL_ENTERPRISE_PLANTS[0]);
      showToast('Reset to enterprise factory benchmarks.');
    }
  };

  // Filtered Lists
  const filteredPlants = useMemo(() => {
    return plants.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.plantCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.addressLocation && p.addressLocation.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchSector = sectorFilter === 'all' || p.industrySector === sectorFilter;
      return matchSearch && matchSector;
    });
  }, [plants, searchQuery, sectorFilter]);

  const filteredManagements = useMemo(() => {
    return managements.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.divisionCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.lead.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPlant = plantFilterForMgt === 'all' || m.plantId === plantFilterForMgt;
      return matchSearch && matchPlant;
    });
  }, [managements, searchQuery, plantFilterForMgt]);

  const filteredLeaderships = useMemo(() => {
    return leaderships.filter(l => {
      const matchSearch =
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.plantName && l.plantName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (l.delegatedAuthorities && l.delegatedAuthorities.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())));
      const matchPlant = selectedPlantForLeadership === 'all' || l.plantId === selectedPlantForLeadership;
      const matchTier = leadershipTierFilter === 'all' || l.leadershipTier === leadershipTierFilter;
      return matchSearch && matchPlant && matchTier;
    });
  }, [leaderships, searchQuery, selectedPlantForLeadership, leadershipTierFilter]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-[#17343a] text-white text-xs font-bold shadow-xl border border-white/20 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Enterprise Overview KPIs */}
      <div className="rounded-3xl border border-[#d9d2c2] bg-gradient-to-br from-[#176f78] via-[#0f545c] to-[#0c4349] text-white p-5 sm:p-7 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 shadow-2xs">
                ENTERPRISE MULTI-PLANT ARCHITECTURE
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/10 text-cyan-200 border border-white/20">
                ACTIVE: {activePlant.plantCode} • {activePlant.unitName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display text-white">
              Multiple Enterprise Plants &amp; Managements
            </h1>
            <p className="text-xs sm:text-sm text-cyan-100">
              Configure multi-facility industrial plants, assign production wing divisions, and empower sectional management leadership across the enterprise.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title="Export configuration as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              title="Reset to benchmark defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Benchmarks</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 5 Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-white/15 text-white">
          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
            <div className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1">
              <Factory className="w-3 h-3 text-cyan-300" /> Enterprise Plants
            </div>
            <div className="text-xl font-black mt-1 font-display">
              {stats.totalPlants} Plants
            </div>
            <div className="text-[10px] text-cyan-200 mt-0.5 font-medium">
              {stats.activePlantsCount} Active Clusters
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
            <div className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-300" /> Sewing Lines Capacity
            </div>
            <div className="text-xl font-black mt-1 font-display text-emerald-300">
              {stats.totalCapacityLines} Lines
            </div>
            <div className="text-[10px] text-cyan-200 mt-0.5 font-medium">
              Across {stats.totalFloorsCount} Multi-Story Floors
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
            <div className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-300" /> Plant Leaderships
            </div>
            <div className="text-xl font-black mt-1 font-display text-amber-300">
              {leaderships.length} Leaders
            </div>
            <div className="text-[10px] text-cyan-200 mt-0.5 font-medium">
              {leaderships.filter(l => l.isPlantHead).length} Plant Heads • {leaderships.filter(l => l.status === 'on_floor').length} On Floor
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15">
            <div className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-cyan-300" /> Managements
            </div>
            <div className="text-xl font-black mt-1 font-display text-cyan-200">
              {managements.length} Units
            </div>
            <div className="text-[10px] text-cyan-200 mt-0.5 font-medium">
              {managements.reduce((sum, m) => sum + (m.members?.length || 0), 0)} Officers in Roster
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold text-cyan-200 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-300" /> Target Benchmark
            </div>
            <div className="text-xl font-black mt-1 font-display text-purple-200">
              {stats.averageTargetEff}%
            </div>
            <div className="text-[10px] text-cyan-200 mt-0.5 font-medium">
              Enterprise Average Target
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#d9d2c2] pb-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('plants')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'plants'
                ? 'bg-[#176f78] text-white shadow-xs'
                : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#fbfaf6]'
            }`}
          >
            <Factory className="w-4 h-4" />
            <span>Enterprise Plants ({plants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('managements')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'managements'
                ? 'bg-[#176f78] text-white shadow-xs'
                : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#fbfaf6]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Multiple Managements ({managements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderships')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'leaderships'
                ? 'bg-[#176f78] text-white shadow-xs'
                : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#fbfaf6]'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Plant Leaderships &amp; Ownership ({leaderships.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-[#176f78] text-white shadow-xs'
                : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#fbfaf6]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Cross-Plant Matrix</span>
          </button>
        </div>

        {/* Action Button for Current Tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'plants' && (
            <button
              type="button"
              onClick={openCreatePlantModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Enterprise Plant</span>
            </button>
          )}

          {activeTab === 'managements' && (
            <button
              type="button"
              onClick={openCreateMgtModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Management Unit</span>
            </button>
          )}

          {activeTab === 'leaderships' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedPlantForOrgTree(selectedPlantForLeadership !== 'all' ? selectedPlantForLeadership : activePlant.id);
                  setIsOrgTreeOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="View plant leadership hierarchy tree"
              >
                <Network className="w-4 h-4 text-[#176f78]" />
                <span>Plant Org Hierarchy</span>
              </button>

              <button
                type="button"
                onClick={() => openCreateLeaderModal()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Appoint Plant Leader</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: ENTERPRISE PLANTS                                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'plants' && (
        <div className="space-y-4">
          {/* Search & Sector Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#527078]" />
              <input
                type="text"
                placeholder="Search plants by name, facility unit, code, or city..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs font-semibold focus:outline-none focus:border-[#176f78]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#527078]" />
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs font-semibold focus:outline-none focus:border-[#176f78]"
              >
                <option value="all">All Industry Sectors</option>
                {INDUSTRY_SECTORS.map(sec => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Plants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlants.map(plant => {
              const isActive = plant.id === activePlant.id;
              const floorsCount = plant.floors?.length || 0;

              return (
                <div
                  key={plant.id}
                  className={`rounded-3xl border p-5 transition-all relative flex flex-col justify-between ${
                    isActive
                      ? 'border-[#176f78] bg-gradient-to-br from-[#176f78]/5 via-[#fbfaf6] to-white shadow-md ring-2 ring-[#176f78]'
                      : 'border-[#d9d2c2] bg-white hover:border-[#176f78]/50 shadow-xs'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Plant Code & Active Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#176f78]/10 text-[#176f78] border border-[#176f78]/20">
                        {plant.plantCode}
                      </span>
                      {isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>ACTIVE COCKPIT PLANT</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectActivePlant(plant)}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#f1eee6] hover:bg-[#176f78] text-[#176f78] hover:text-white border border-[#d9d2c2] hover:border-[#176f78] transition-colors cursor-pointer"
                        >
                          Switch to This Plant
                        </button>
                      )}
                    </div>

                    {/* Plant Title & Sector */}
                    <div>
                      <h3 className="text-base font-bold text-[#17343a] leading-tight">
                        {plant.name}
                      </h3>
                      <div className="text-xs font-semibold text-[#176f78] mt-0.5">
                        {plant.unitName}
                      </div>
                      <div className="text-[11px] text-[#527078] mt-0.5">
                        {plant.industrySector} • {plant.enterpriseGroup || 'Industrial Cluster'}
                      </div>
                    </div>

                    {/* Quick Metadata Box */}
                    <div className="p-3 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-1.5 text-xs text-[#527078]">
                      <div className="flex items-center justify-between font-semibold text-[#17343a]">
                        <span>Capacity:</span>
                        <span className="text-[#176f78] font-bold">{plant.totalLinesCount} Sewing Lines</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Floors:</span>
                        <span className="font-semibold text-[#17343a]">{floorsCount} Floors</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Benchmark Eff:</span>
                        <span className="font-bold text-emerald-700">{plant.targetEfficiencyBenchmark || 85.0}% Target</span>
                      </div>
                      {plant.plantHead?.name && (
                        <div className="flex items-center justify-between pt-1 border-t border-[#e7e1d5]">
                          <span>Plant Head:</span>
                          <span className="font-bold text-[#17343a] truncate max-w-[150px]">
                            {plant.plantHead.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Location */}
                    {plant.addressLocation && (
                      <div className="flex items-start gap-1.5 text-[11px] text-[#527078]">
                        <MapPin className="w-3.5 h-3.5 text-[#176f78] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{plant.addressLocation}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 mt-4 border-t border-[#e7e1d5] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEditPlantModal(plant)}
                        className="p-1.5 rounded-lg hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer"
                        title="Edit Plant Configuration"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicatePlant(plant)}
                        className="p-1.5 rounded-lg hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer"
                        title="Clone / Duplicate Plant"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => handleDeletePlant(plant.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Plant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {!isActive && (
                      <button
                        type="button"
                        onClick={() => handleSelectActivePlant(plant)}
                        className="flex items-center gap-1 text-xs font-bold text-[#176f78] hover:underline cursor-pointer"
                      >
                        <span>Activate</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: MULTIPLE MANAGEMENTS                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'managements' && (
        <div className="space-y-4">
          {/* Plant Ownership Scope Filter Pills */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-white p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-700" />
                <span className="text-xs font-bold text-[#17343a] uppercase tracking-wider">
                  Management Scope: Divisions Manage Their Designated Plant
                </span>
              </div>
              <span className="text-[11px] text-[#527078]">
                Every management division governs lines, floors, and supervisory cadres within their specific plant
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setPlantFilterForMgt('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  plantFilterForMgt === 'all'
                    ? 'bg-[#17343a] text-white shadow-2xs'
                    : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All Enterprise Plants ({managements.length})</span>
              </button>

              {plants.map(p => {
                const plantMgtsCount = managements.filter(m => m.plantId === p.id).length;
                const isSelected = plantFilterForMgt === p.id;
                const isCurrentlyActive = activePlant.id === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlantFilterForMgt(p.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-[#176f78] text-white border-[#176f78] shadow-2xs'
                        : 'bg-white text-[#17343a] border-[#d9d2c2] hover:bg-[#fbfaf6]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.brandColor || '#176f78' }}
                    />
                    <span>{p.shortTag} • {p.unitName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#f1eee6] text-[#527078]'
                    }`}>
                      {plantMgtsCount}
                    </span>
                    {isCurrentlyActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Active Enterprise Plant" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search & Plant Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#527078]" />
              <input
                type="text"
                placeholder="Search management divisions by title, code, or lead name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs font-semibold focus:outline-none focus:border-[#176f78]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#527078]" />
              <select
                value={plantFilterForMgt}
                onChange={e => setPlantFilterForMgt(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs font-semibold focus:outline-none focus:border-[#176f78]"
              >
                <option value="all">All Associated Plants</option>
                {plants.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {p.unitName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Managements Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredManagements.map(mgt => {
              const membersCount = mgt.members?.length || 0;

              return (
                <div
                  key={mgt.id}
                  className="rounded-3xl border border-[#d9d2c2] bg-white p-5 hover:border-[#176f78]/50 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header Row: Division Code & Scope */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {mgt.divisionCode}
                        </span>
                        <span className="text-[10px] font-bold text-[#527078] truncate max-w-[150px]">
                          {mgt.plantName || 'Enterprise Plant'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                        {mgt.status}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-base font-bold text-[#17343a] leading-snug">
                        {mgt.name}
                      </h3>
                      <div className="text-xs text-[#527078] mt-0.5">
                        Reports to: {mgt.reportingTo || 'GM Operations'}
                      </div>
                    </div>

                    {/* Lead Showcase Box */}
                    <div className="p-3 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: mgt.colorTheme || '#176f78' }}
                      >
                        {mgt.lead.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#17343a] truncate">
                          {mgt.lead.name}
                        </div>
                        <div className="text-[11px] text-[#176f78] font-semibold truncate">
                          {mgt.lead.designation}
                        </div>
                        {mgt.lead.email && (
                          <div className="text-[10px] text-[#527078] truncate">
                            {mgt.lead.email}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned Lines & Floors */}
                    <div className="space-y-1.5 text-xs">
                      <div className="text-[10px] uppercase font-bold text-[#527078] tracking-wider">
                        Assigned Lines ({mgt.assignedLines.length}):
                      </div>
                      <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto pr-1">
                        {mgt.assignedLines.map(lNo => (
                          <span
                            key={lNo}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f1eee6] text-[#17343a] border border-[#d9d2c2]"
                          >
                            L{lNo}
                          </span>
                        ))}
                      </div>

                      <div className="text-[10px] uppercase font-bold text-[#527078] tracking-wider pt-1">
                        Target Efficiency &amp; Budget:
                      </div>
                      <div className="flex items-center justify-between text-xs font-semibold text-[#17343a]">
                        <span className="text-emerald-700 font-bold">{mgt.targetEfficiency}% Benchmark</span>
                        <span className="text-[#527078]">{mgt.operatingBudgetMonthly || '—'}</span>
                      </div>
                    </div>

                    {/* KPI Focus Chips */}
                    {mgt.kpiFocus && mgt.kpiFocus.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {mgt.kpiFocus.slice(0, 3).map((kpi, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-blue-50/70 text-blue-800 border border-blue-100"
                          >
                            {kpi}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 mt-4 border-t border-[#e7e1d5] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => openRosterModal(mgt)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>Roster ({membersCount})</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditMgtModal(mgt)}
                        className="p-1.5 rounded-lg hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer"
                        title="Edit Management Unit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMgt(mgt.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Delete Management Unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: PLANT LEADERSHIPS & OWNERSHIP                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'leaderships' && (
        <div className="space-y-4">
          {/* Plant Ownership Scope Filter Pills */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-white p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-[#17343a] uppercase tracking-wider">
                  Plant Ownership Scope: Multiple Leaderships Manage Their Own Plants
                </span>
              </div>
              <span className="text-[11px] text-[#527078]">
                Inspect each manufacturing plant's autonomous leadership council, delegated sign-offs, and floor command
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedPlantForLeadership('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedPlantForLeadership === 'all'
                    ? 'bg-[#17343a] text-white shadow-2xs'
                    : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>All Enterprise Plants ({leaderships.length})</span>
              </button>

              {plants.map(p => {
                const plantLeadersCount = leaderships.filter(l => l.plantId === p.id).length;
                const isSelected = selectedPlantForLeadership === p.id;
                const isCurrentlyActive = activePlant.id === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlantForLeadership(p.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                      isSelected
                        ? 'bg-[#176f78] text-white border-[#176f78] shadow-2xs'
                        : 'bg-white text-[#17343a] border-[#d9d2c2] hover:bg-[#fbfaf6]'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.brandColor || '#176f78' }}
                    />
                    <span>{p.shortTag} • {p.unitName}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#f1eee6] text-[#527078]'
                    }`}>
                      {plantLeadersCount}
                    </span>
                    {isCurrentlyActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Active Enterprise Plant" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Plant Showcase Banner when specific plant is selected */}
          {selectedPlantForLeadership !== 'all' && (() => {
            const currentSelectedPlant = plants.find(p => p.id === selectedPlantForLeadership);
            if (!currentSelectedPlant) return null;
            const isCurrentActive = activePlant.id === currentSelectedPlant.id;
            const plantLeaders = leaderships.filter(l => l.plantId === currentSelectedPlant.id);
            const plantHead = plantLeaders.find(l => l.isPlantHead) || plantLeaders[0];

            return (
              <div
                className="rounded-2xl border p-4 sm:p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                style={{
                  background: `linear-gradient(135deg, ${currentSelectedPlant.brandColor || '#176f78'} 0%, #0d3d42 100%)`,
                  borderColor: currentSelectedPlant.brandColor || '#176f78'
                }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950">
                      AUTONOMOUS PLANT LEADERSHIP
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/15 text-cyan-100">
                      {currentSelectedPlant.plantCode}
                    </span>
                    {isCurrentActive && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/80 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> ACTIVE SYSTEM PLANT
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black font-display tracking-tight text-white">
                    {currentSelectedPlant.name} — {currentSelectedPlant.unitName}
                  </h3>
                  <p className="text-xs text-cyan-100">
                    Governed by {plantLeaders.length} dedicated leaders • {currentSelectedPlant.totalLinesCount} sewing lines • {currentSelectedPlant.floors?.length || 0} floors • Target: {currentSelectedPlant.targetEfficiencyBenchmark}%
                  </p>
                  {plantHead && (
                    <div className="text-xs font-semibold text-amber-200 pt-1 flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Plant Head: {plantHead.name} ({plantHead.designation})</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {!isCurrentActive ? (
                    <button
                      type="button"
                      onClick={() => handleSelectActivePlant(currentSelectedPlant)}
                      className="px-3.5 py-2 rounded-xl bg-white text-[#17343a] text-xs font-bold shadow-xs hover:bg-[#fbfaf6] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Switch Active System to This Plant</span>
                    </button>
                  ) : (
                    <div className="px-3 py-2 rounded-xl bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Currently Active Cockpit Plant</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlantForOrgTree(currentSelectedPlant.id);
                      setIsOrgTreeOpen(true);
                    }}
                    className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>View Org Hierarchy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openCreateLeaderModal(currentSelectedPlant.id)}
                    className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Appoint Leader</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Search & Tier Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#527078]" />
              <input
                type="text"
                placeholder="Search leaders by name, designation, plant, or delegated power..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs font-semibold focus:outline-none focus:border-[#176f78]"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#527078]" />
              <select
                value={leadershipTierFilter}
                onChange={e => setLeadershipTierFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs font-semibold focus:outline-none focus:border-[#176f78]"
              >
                <option value="all">All Leadership Tiers</option>
                <option value="plant_executive">Plant Executives (GM / Director)</option>
                <option value="departmental_head">Departmental Heads (IE / QA / Cut)</option>
                <option value="divisional_lead">Divisional Wing Leads</option>
                <option value="floor_commander">Floor Incharges &amp; Commanders</option>
              </select>
            </div>
          </div>

          {/* Leaders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeaderships.map(ldr => {
              const plant = plants.find(p => p.id === ldr.plantId);
              const isCurrentPlantActive = activePlant.id === ldr.plantId;

              const tierBadgeConfig = {
                plant_executive: { label: 'Plant Executive', bg: 'bg-purple-100 text-purple-900 border-purple-200' },
                departmental_head: { label: 'Department Head', bg: 'bg-teal-100 text-teal-900 border-teal-200' },
                divisional_lead: { label: 'Divisional Wing Lead', bg: 'bg-blue-100 text-blue-900 border-blue-200' },
                floor_commander: { label: 'Floor Command', bg: 'bg-amber-100 text-amber-900 border-amber-200' }
              }[ldr.leadershipTier] || { label: 'Leader', bg: 'bg-slate-100 text-slate-800 border-slate-200' };

              const statusBadgeConfig = {
                active: { label: 'Active', bg: 'bg-emerald-100 text-emerald-800' },
                on_floor: { label: 'On Floor', bg: 'bg-blue-100 text-blue-800' },
                in_standup: { label: 'In Standup', bg: 'bg-amber-100 text-amber-800' },
                leave: { label: 'On Leave', bg: 'bg-rose-100 text-rose-800' }
              }[ldr.status] || { label: 'Active', bg: 'bg-emerald-100 text-emerald-800' };

              return (
                <div
                  key={ldr.id}
                  className="rounded-3xl border border-[#d9d2c2] bg-white p-5 hover:border-[#176f78]/50 shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Plant Assignment & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: plant?.brandColor || ldr.avatarColor || '#176f78' }}
                        />
                        <span className="text-[10px] font-bold text-[#527078] truncate" title={plant?.unitName}>
                          Manages: <strong className="text-[#17343a]">{plant?.shortTag || ldr.plantName}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {ldr.isPlantHead && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 flex items-center gap-1 shadow-2xs">
                            <Crown className="w-2.5 h-2.5" /> Plant Head
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${statusBadgeConfig.bg}`}>
                          {statusBadgeConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Leader Profile Info */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs relative"
                        style={{ backgroundColor: ldr.avatarColor || '#176f78' }}
                      >
                        {ldr.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        {ldr.isPlantHead && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-[9px]">
                            ★
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#17343a] truncate leading-tight">
                          {ldr.name}
                        </h4>
                        <div className="text-xs text-[#176f78] font-semibold line-clamp-1 mt-0.5">
                          {ldr.designation}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${tierBadgeConfig.bg}`}>
                            {tierBadgeConfig.label}
                          </span>
                          <span className="text-[10px] text-[#527078] font-medium">
                            {ldr.yearsInLeadership || 8}y Exp • {ldr.directReportsCount || 12} Reports
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Scope: Lines & Floors */}
                    <div className="p-3 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-2 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[#527078]">Governed Lines:</span>
                        <span className="font-mono font-bold text-[#17343a]">{ldr.managedLinesRange || 'All Lines'}</span>
                      </div>

                      {ldr.managedFloors && ldr.managedFloors.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[#527078] tracking-wider mb-1">
                            Floor Responsibilities:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {ldr.managedFloors.map((fl, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white text-[#17343a] border border-[#d9d2c2]"
                              >
                                {fl}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Delegated Authorities Badges */}
                    {ldr.delegatedAuthorities && ldr.delegatedAuthorities.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase font-bold text-[#527078] tracking-wider flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#176f78]" />
                          <span>Delegated Authorities:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {ldr.delegatedAuthorities.map((auth, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-cyan-50 text-cyan-900 border border-cyan-200"
                            >
                              ✓ {auth}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* KPI Commitment statement */}
                    {ldr.kpiCommitment && (
                      <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-[11px] text-amber-950 font-medium italic">
                        "{ldr.kpiCommitment}"
                      </div>
                    )}

                    {/* Direct Contact info */}
                    <div className="flex items-center gap-3 text-xs text-[#527078] pt-1">
                      {ldr.email && (
                        <a
                          href={`mailto:${ldr.email}`}
                          className="flex items-center gap-1 hover:text-[#176f78] transition-colors truncate"
                          title={ldr.email}
                        >
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ldr.email}</span>
                        </a>
                      )}
                      {ldr.phone && (
                        <a
                          href={`tel:${ldr.phone}`}
                          className="flex items-center gap-1 hover:text-[#176f78] transition-colors shrink-0"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{ldr.phone}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 mt-4 border-t border-[#e7e1d5] flex items-center justify-between gap-2">
                    {plant && (
                      !isCurrentPlantActive ? (
                        <button
                          type="button"
                          onClick={() => handleSelectActivePlant(plant)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#176f78]/10 hover:bg-[#176f78] text-[#176f78] hover:text-white text-xs font-bold transition-all cursor-pointer"
                          title="Switch system active plant to this leader's plant"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Switch to Plant</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Plant
                        </span>
                      )
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => openEditLeaderModal(ldr)}
                        className="p-1.5 rounded-lg hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer"
                        title="Edit Leader"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLeader(ldr.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove Leader"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredLeaderships.length === 0 && (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#d9d2c2] space-y-3">
              <Crown className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-base font-bold text-[#17343a]">No Plant Leaders Found</div>
              <p className="text-xs text-[#527078] max-w-md mx-auto">
                No plant leaders match your current search or plant filter. Click below to appoint leadership to this plant.
              </p>
              <button
                type="button"
                onClick={() => openCreateLeaderModal()}
                className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold shadow-xs hover:bg-[#125860] transition-all cursor-pointer"
              >
                + Appoint Plant Leader
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: CROSS-PLANT PERFORMANCE MATRIX                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="rounded-3xl border border-[#d9d2c2] bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#176f78]" />
                <span>Enterprise Multi-Plant Benchmarking Matrix</span>
              </h2>
              <p className="text-xs text-[#527078] mt-0.5">
                Executive comparative overview across all enterprise manufacturing plants and associated management wings.
              </p>
            </div>
            <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-lg bg-[#176f78]/10 text-[#176f78] border border-[#176f78]/25">
              {plants.length} Plants • {managements.length} Managements
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e7e1d5] bg-[#fbfaf6] text-[#527078] uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Plant / Facility</th>
                  <th className="py-2.5 px-3">Plant Code</th>
                  <th className="py-2.5 px-3">Industry Sector</th>
                  <th className="py-2.5 px-3">Sewing Lines</th>
                  <th className="py-2.5 px-3">Floors</th>
                  <th className="py-2.5 px-3">Benchmark Target</th>
                  <th className="py-2.5 px-3">Plant Leadership Council</th>
                  <th className="py-2.5 px-3">Dedicated Units</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e1d5]">
                {plants.map(plant => {
                  const isActive = plant.id === activePlant.id;
                  const plantMgts = managements.filter(m => m.plantId === plant.id);
                  const plantLeaders = leaderships.filter(l => l.plantId === plant.id);
                  const plantHead = plantLeaders.find(l => l.isPlantHead) || plantLeaders[0];

                  return (
                    <tr
                      key={plant.id}
                      className={`hover:bg-[#fbfaf6] transition-colors ${
                        isActive ? 'bg-[#176f78]/5 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#17343a]">{plant.name}</div>
                        <div className="text-[11px] text-[#176f78]">{plant.unitName}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#527078]">
                        {plant.plantCode}
                      </td>
                      <td className="py-3 px-3 text-[#527078]">
                        {plant.industrySector}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#17343a]">
                        {plant.totalLinesCount} Lines
                      </td>
                      <td className="py-3 px-3 text-[#527078]">
                        {plant.floors?.length || 0} Floors
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-700">
                          {plant.targetEfficiencyBenchmark || 85}% Target
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#17343a] flex items-center gap-1">
                          {plantHead?.isPlantHead && <Crown className="w-3 h-3 text-amber-500 shrink-0" />}
                          <span className="truncate">{plantHead?.name || plant.plantHead?.name || '—'}</span>
                        </div>
                        <div className="text-[10px] text-[#527078] truncate">{plantHead?.designation || plant.plantHead?.designation}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPlantForLeadership(plant.id);
                              setActiveTab('leaderships');
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer flex items-center gap-1"
                            title="Inspect Plant Leadership Council"
                          >
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            <span>{plantLeaders.length} Leaders</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPlantFilterForMgt(plant.id);
                              setActiveTab('managements');
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-900 border border-cyan-200 hover:bg-cyan-100 transition-colors cursor-pointer flex items-center gap-1"
                            title="Inspect Plant Management Divisions"
                          >
                            <Briefcase className="w-2.5 h-2.5 text-cyan-700" />
                            <span>{plantMgts.length} Units</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3 stroke-[3]" /> Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectActivePlant(plant)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#176f78] hover:bg-[#125860] text-white transition-colors cursor-pointer"
                          >
                            Switch
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 1: CREATE / EDIT ENTERPRISE PLANT                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isPlantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl w-full max-w-3xl overflow-hidden animate-fadeIn my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#e7e1d5] bg-gradient-to-r from-[#176f78]/10 via-transparent to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17343a]">
                    {editingPlantId ? 'Edit Enterprise Plant Profile' : 'Create New Enterprise Plant'}
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Establish industrial plant capacity, location, floor buildings, and benchmark parameters.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPlantModalOpen(false)}
                className="p-2 rounded-xl hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlantForm} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Company / Enterprise Group Name *
                  </label>
                  <input
                    type="text"
                    value={plantFormName}
                    onChange={e => setPlantFormName(e.target.value)}
                    placeholder="e.g. Debonair LTD or Apex Footwear"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Plant / Facility Unit Designation *
                  </label>
                  <input
                    type="text"
                    value={plantFormUnitName}
                    onChange={e => setPlantFormUnitName(e.target.value)}
                    placeholder="e.g. Unit-02 (Heavy Padding) or Plant-04"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Plant Code *
                  </label>
                  <input
                    type="text"
                    value={plantFormCode}
                    onChange={e => setPlantFormCode(e.target.value)}
                    placeholder="e.g. DBN-U02"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold uppercase focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Enterprise Group Holding
                  </label>
                  <input
                    type="text"
                    value={plantFormGroup}
                    onChange={e => setPlantFormGroup(e.target.value)}
                    placeholder="e.g. Debonair Group Bangladesh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Industry Sector
                  </label>
                  <select
                    value={plantFormSector}
                    onChange={e => setPlantFormSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                  >
                    {INDUSTRY_SECTORS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Total Sewing Lines Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={plantFormTotalLines}
                    onChange={e => setPlantFormTotalLines(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Shift Hours / Day
                  </label>
                  <select
                    value={plantFormShiftHours}
                    onChange={e => setPlantFormShiftHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                  >
                    <option value={8}>8 Hours Standard Shift</option>
                    <option value={10}>10 Hours Shift (Overtime Included)</option>
                    <option value={12}>12 Hours Heavy Shift</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Target Efficiency Benchmark %
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="50"
                    max="100"
                    value={plantFormBenchmark}
                    onChange={e => setPlantFormBenchmark(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Plant Head Leadership */}
              <div className="p-4 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-3">
                <div className="text-xs font-bold text-[#17343a] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#176f78]" />
                  <span>Plant Leadership (General Manager / Plant Head)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Plant Head Full Name
                    </label>
                    <input
                      type="text"
                      value={plantFormHeadName}
                      onChange={e => setPlantFormHeadName(e.target.value)}
                      placeholder="e.g. Ashik Hossain"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Designation / Role
                    </label>
                    <input
                      type="text"
                      value={plantFormHeadTitle}
                      onChange={e => setPlantFormHeadTitle(e.target.value)}
                      placeholder="e.g. General Manager Operations"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={plantFormHeadEmail}
                      onChange={e => setPlantFormHeadEmail(e.target.value)}
                      placeholder="plant.head@domain.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={plantFormHeadPhone}
                      onChange={e => setPlantFormHeadPhone(e.target.value)}
                      placeholder="+880 1711-xxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Floors Setup input */}
              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  Floor Buildings &amp; Line Allocation (Comma Separated)
                </label>
                <input
                  type="text"
                  value={plantFormFloorsInput}
                  onChange={e => setPlantFormFloorsInput(e.target.value)}
                  placeholder="Padma Floor (06 Lines), Meghna Floor (06 Lines), Karnophuli Floor (05 Lines)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                />
                <span className="text-[10px] text-[#527078] mt-1 block">
                  Example: <em>Padma Floor (06 Lines), Meghna Floor (06 Lines), Karnophuli Floor (05 Lines)</em>
                </span>
              </div>

              {/* Address & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Plant Physical Address &amp; Industrial Belt
                  </label>
                  <input
                    type="text"
                    value={plantFormAddress}
                    onChange={e => setPlantFormAddress(e.target.value)}
                    placeholder="City, District, Industrial Belt"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Plant Contact Email
                  </label>
                  <input
                    type="email"
                    value={plantFormEmail}
                    onChange={e => setPlantFormEmail(e.target.value)}
                    placeholder="operations@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  Plant Operational Notes / Product Capabilities
                </label>
                <textarea
                  rows={2}
                  value={plantFormNotes}
                  onChange={e => setPlantFormNotes(e.target.value)}
                  placeholder="Key specializations, machinery brands, certifications (ISO, WRAP, OEKO-TEX)..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d9d2c2] text-xs font-medium focus:outline-none focus:border-[#176f78]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setIsPlantModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingPlantId ? 'Save Plant Updates' : 'Create Enterprise Plant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 2: CREATE / EDIT MANAGEMENT DIVISION                    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isMgtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl w-full max-w-3xl overflow-hidden animate-fadeIn my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#e7e1d5] bg-gradient-to-r from-blue-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17343a]">
                    {editingMgtId ? 'Edit Management Division' : 'Create New Management Unit / Wing'}
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Define management hierarchy, assigned lines, assigned floors, leads, and operational KPI targets.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMgtModalOpen(false)}
                className="p-2 rounded-xl hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMgtForm} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Management Division Title *
                  </label>
                  <input
                    type="text"
                    value={mgtFormName}
                    onChange={e => setMgtFormName(e.target.value)}
                    placeholder="e.g. Blue Wing Sewing Management or IE & Work Study"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Division Code *
                  </label>
                  <input
                    type="text"
                    value={mgtFormCode}
                    onChange={e => setMgtFormCode(e.target.value)}
                    placeholder="e.g. MGT-BLU or MGT-IE"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold uppercase focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Assigned Enterprise Plant *
                  </label>
                  <select
                    value={mgtFormPlantId}
                    onChange={e => setMgtFormPlantId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                  >
                    {plants.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.unitName} ({p.plantCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Reporting Chain / Superior Officer
                  </label>
                  <input
                    type="text"
                    value={mgtFormReportingTo}
                    onChange={e => setMgtFormReportingTo(e.target.value)}
                    placeholder="e.g. General Manager Operations / HOD IE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Division Lead Information */}
              <div className="p-4 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-3">
                <div className="text-xs font-bold text-[#17343a] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Division Head / Manager in Charge</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Lead Full Name *
                    </label>
                    <input
                      type="text"
                      value={mgtFormLeadName}
                      onChange={e => setMgtFormLeadName(e.target.value)}
                      placeholder="e.g. Tanvir Ahmed"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Designation Title *
                    </label>
                    <input
                      type="text"
                      value={mgtFormLeadTitle}
                      onChange={e => setMgtFormLeadTitle(e.target.value)}
                      placeholder="e.g. Divisional Production Manager"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      RBAC Authority Tier
                    </label>
                    <select
                      value={mgtFormLeadTier}
                      onChange={e => setMgtFormLeadTier(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    >
                      <option value="tier_1">Tier 1: Sr. Manager / Head of Dept</option>
                      <option value="tier_2">Tier 2: Manager (Wing Control)</option>
                      <option value="tier_3">Tier 3: Floor Incharge</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Lead Email
                    </label>
                    <input
                      type="email"
                      value={mgtFormLeadEmail}
                      onChange={e => setMgtFormLeadEmail(e.target.value)}
                      placeholder="lead@debonairbd.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Lead Phone
                    </label>
                    <input
                      type="text"
                      value={mgtFormLeadPhone}
                      onChange={e => setMgtFormLeadPhone(e.target.value)}
                      placeholder="+880 1711-xxxxxx"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#e7e1d5]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Deputy Lead (Optional)
                    </label>
                    <input
                      type="text"
                      value={mgtFormDeputyName}
                      onChange={e => setMgtFormDeputyName(e.target.value)}
                      placeholder="e.g. Md. Rafiqul Islam"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Deputy Designation
                    </label>
                    <input
                      type="text"
                      value={mgtFormDeputyTitle}
                      onChange={e => setMgtFormDeputyTitle(e.target.value)}
                      placeholder="e.g. Assistant Production Manager"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Lines & Floors Allocation */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Assigned Sewing Lines (Comma Separated) *
                  </label>
                  <input
                    type="text"
                    value={mgtFormAssignedLines}
                    onChange={e => setMgtFormAssignedLines(e.target.value)}
                    placeholder="01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12, 13, 14, 15, 16, 17"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                  <span className="text-[10px] text-[#527078] mt-0.5 block">
                    Lines controlled and supervised by this management division.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Assigned Floors / Zones (Comma Separated)
                  </label>
                  <input
                    type="text"
                    value={mgtFormAssignedFloors}
                    onChange={e => setMgtFormAssignedFloors(e.target.value)}
                    placeholder="Padma Floor, Meghna Floor, Karnophuli Floor"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Performance Targets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Target Efficiency %
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="50"
                    max="100"
                    value={mgtFormTargetEff}
                    onChange={e => setMgtFormTargetEff(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Operating Budget / mo
                  </label>
                  <input
                    type="text"
                    value={mgtFormBudget}
                    onChange={e => setMgtFormBudget(e.target.value)}
                    placeholder="$45,000 / mo"
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Cadre Team Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={mgtFormCadreCount}
                    onChange={e => setMgtFormCadreCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  KPI Focus Areas (Comma Separated)
                </label>
                <input
                  type="text"
                  value={mgtFormKpis}
                  onChange={e => setMgtFormKpis(e.target.value)}
                  placeholder="Line Balancing & Pitch Time, Daily Top 5 Standup, WIP Kanban Compliance"
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  Scope of Authority &amp; Notes
                </label>
                <textarea
                  rows={2}
                  value={mgtFormNotes}
                  onChange={e => setMgtFormNotes(e.target.value)}
                  placeholder="Responsibilities, daily standup routines, handover protocols..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d9d2c2] text-xs font-medium focus:outline-none focus:border-[#176f78]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setIsMgtModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingMgtId ? 'Save Management Updates' : 'Create Management Unit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 3: MANAGEMENT ROSTER BUILDER                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isRosterModalOpen && selectedMgtForRoster && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#e7e1d5] bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17343a]">
                    Management Roster: {selectedMgtForRoster.name}
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Incharge officers, floor engineers, and supervisory cadre assigned to this unit.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="p-2 rounded-xl hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Member List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#17343a] uppercase tracking-wider">
                  Active Roster Members ({(selectedMgtForRoster.members || []).length})
                </div>

                <div className="divide-y divide-[#e7e1d5] border border-[#e7e1d5] rounded-2xl overflow-hidden bg-[#fbfaf6]">
                  {(selectedMgtForRoster.members || []).map(mbr => (
                    <div key={mbr.id} className="p-3 flex items-center justify-between gap-3 bg-white">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs"
                          style={{ backgroundColor: mbr.avatarColor || '#176f78' }}
                        >
                          {mbr.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#17343a] truncate">
                            {mbr.name}
                          </div>
                          <div className="text-[11px] text-[#527078] truncate">
                            {mbr.role} • {mbr.lineOrFloor || 'Floor'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {mbr.status.replace('_', ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(selectedMgtForRoster.id, mbr.id)}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add New Member Form */}
              <form onSubmit={handleAddMemberToRoster} className="p-4 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-3">
                <div className="text-xs font-bold text-[#17343a] uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Add Team Member to Roster</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Member Full Name *
                    </label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={e => setNewMemberName(e.target.value)}
                      placeholder="e.g. Md. Rafiqul Islam"
                      required
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Role / Position
                    </label>
                    <input
                      type="text"
                      value={newMemberRole}
                      onChange={e => setNewMemberRole(e.target.value)}
                      placeholder="e.g. IE Incharge or Assistant Manager"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Assigned Floor or Line
                    </label>
                    <input
                      type="text"
                      value={newMemberScope}
                      onChange={e => setNewMemberScope(e.target.value)}
                      placeholder="e.g. Padma Floor (Lines 01-06)"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#527078] mb-0.5">
                      Contact Email or Mobile
                    </label>
                    <input
                      type="text"
                      value={newMemberContact}
                      onChange={e => setNewMemberContact(e.target.value)}
                      placeholder="officer@debonairbd.com"
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Unit Roster</span>
                </button>
              </form>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRosterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#17343a] text-white text-xs font-bold cursor-pointer"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 4: APPOINT / EDIT PLANT LEADER                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isLeaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl w-full max-w-3xl overflow-hidden animate-fadeIn my-8">
            <div className="flex items-center justify-between p-5 border-b border-[#e7e1d5] bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center shadow-xs">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17343a]">
                    {editingLeaderId ? 'Edit Plant Leader & Scope' : 'Appoint Plant Leader: Managing Their Own Plant'}
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Designate leadership authority, assigned lines, floor command, and delegated approval sign-offs for this plant.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaderModalOpen(false)}
                className="p-2 rounded-xl hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLeader} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Plant Assignment Dropdown */}
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-1.5">
                <label className="block text-xs font-bold text-amber-950">
                  Designated Plant Assignment (They Manage Their Own Plant) *
                </label>
                <select
                  value={leaderFormPlantId}
                  onChange={e => {
                    const nextPlantId = e.target.value;
                    setLeaderFormPlantId(nextPlantId);
                    const selP = plants.find(p => p.id === nextPlantId);
                    if (selP) {
                      setLeaderFormLinesRange(`Lines 01 - ${selP.totalLinesCount || 24}`);
                      setLeaderFormFloors(selP.floors?.map(f => f.name) || []);
                      setLeaderFormColor(selP.brandColor || '#176f78');
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-300 text-xs font-bold text-[#17343a] bg-white focus:outline-none focus:border-amber-500"
                >
                  {plants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.unitName} ({p.plantCode})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-amber-800 block">
                  This leader's operational command, sign-offs, and reporting structure will govern this designated manufacturing facility.
                </span>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Leader Full Name *
                  </label>
                  <input
                    type="text"
                    value={leaderFormName}
                    onChange={e => setLeaderFormName(e.target.value)}
                    placeholder="e.g. Ashik Hossain"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Official Leadership Title / Designation *
                  </label>
                  <input
                    type="text"
                    value={leaderFormTitle}
                    onChange={e => setLeaderFormTitle(e.target.value)}
                    placeholder="e.g. Head of Industrial Engineering / Sr. Manager"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Tier & Plant Head Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Leadership Hierarchy Tier *
                  </label>
                  <select
                    value={leaderFormTier}
                    onChange={e => setLeaderFormTier(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                  >
                    <option value="plant_executive">Plant Executive (Executive Director / Plant GM / VP)</option>
                    <option value="departmental_head">Departmental Head (Head of IE / Head of QA / Maintenance Lead)</option>
                    <option value="divisional_lead">Divisional Wing Lead (Blue Wing Manager / Green Wing Manager)</option>
                    <option value="floor_commander">Floor Commander / Senior IE Incharge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Live Operational Status
                  </label>
                  <select
                    value={leaderFormStatus}
                    onChange={e => setLeaderFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78] bg-white"
                  >
                    <option value="active">Active On Duty</option>
                    <option value="on_floor">On Floor Inspection / Line Takt Walk</option>
                    <option value="in_standup">In Daily Production Standup</option>
                    <option value="leave">On Leave / Travelling</option>
                  </select>
                </div>
              </div>

              {/* Is Plant Head Checkbox */}
              <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-[#17343a]">
                      Designate as Autonomous Plant Head / General Manager
                    </div>
                    <div className="text-[10px] text-[#527078]">
                      Grants executive signature on overall plant output, line rebalancing, and cross-wing authorizations.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={leaderFormIsPlantHead}
                  onChange={e => setLeaderFormIsPlantHead(e.target.checked)}
                  className="w-4 h-4 rounded text-[#176f78] focus:ring-[#176f78]"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={leaderFormEmail}
                    onChange={e => setLeaderFormEmail(e.target.value)}
                    placeholder="leader.plant@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Direct Contact Phone
                  </label>
                  <input
                    type="text"
                    value={leaderFormPhone}
                    onChange={e => setLeaderFormPhone(e.target.value)}
                    placeholder="+880 1711-xxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Lines & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Governed Lines Scope
                  </label>
                  <input
                    type="text"
                    value={leaderFormLinesRange}
                    onChange={e => setLeaderFormLinesRange(e.target.value)}
                    placeholder="e.g. Lines 01 - 34 or Lines 01 - 17"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Years in Plant Leadership
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={leaderFormYears}
                    onChange={e => setLeaderFormYears(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17343a] mb-1">
                    Direct Reports Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={leaderFormReports}
                    onChange={e => setLeaderFormReports(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                  />
                </div>
              </div>

              {/* Floor Responsibilities in this Plant */}
              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1.5">
                  Floor Responsibilities in {plants.find(p => p.id === leaderFormPlantId)?.unitName || 'Plant'}
                </label>
                <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5]">
                  {(plants.find(p => p.id === leaderFormPlantId)?.floors || [
                    { id: 'fl1', name: 'Main Production Floor 1', linesCount: 6 },
                    { id: 'fl2', name: 'Main Production Floor 2', linesCount: 6 }
                  ]).map(fl => {
                    const isChecked = leaderFormFloors.includes(fl.name);
                    return (
                      <button
                        key={fl.id}
                        type="button"
                        onClick={() => handleToggleLeaderFloor(fl.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#176f78] text-white border-[#176f78]'
                            : 'bg-white text-[#527078] border-[#d9d2c2] hover:bg-[#f1eee6]'
                        }`}
                      >
                        {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        <span>{fl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delegated Authorities Checkboxes */}
              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#176f78]" />
                  <span>Delegated Operational &amp; IE Sign-Off Authorities</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5]">
                  {AVAILABLE_AUTHORITIES.map(auth => {
                    const hasAuth = leaderFormAuthorities.includes(auth);
                    return (
                      <button
                        key={auth}
                        type="button"
                        onClick={() => handleToggleAuthority(auth)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                          hasAuth
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-950 font-bold'
                            : 'bg-white border-[#e7e1d5] text-[#527078] hover:bg-[#f1eee6]'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          hasAuth ? 'bg-[#176f78] text-white' : 'border border-[#d9d2c2]'
                        }`}>
                          {hasAuth && <Check className="w-3 h-3" />}
                        </span>
                        <span className="truncate">{auth}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* KPI Commitment Statement */}
              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  Plant KPI &amp; Efficiency Commitment Statement
                </label>
                <input
                  type="text"
                  value={leaderFormKpi}
                  onChange={e => setLeaderFormKpi(e.target.value)}
                  placeholder="e.g. Maintain 85.0%+ Efficiency with zero downtime and < 1.2% DHU"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-semibold focus:outline-none focus:border-[#176f78]"
                />
              </div>

              {/* Avatar Color Picker */}
              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  Leader Avatar Accent Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {['#176f78', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#059669', '#0d9488', '#d97706', '#dc2626'].map(col => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setLeaderFormColor(col)}
                      className={`w-7 h-7 rounded-xl border-2 transition-transform cursor-pointer ${
                        leaderFormColor === col ? 'scale-115 border-[#17343a]' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-[#17343a] mb-1">
                  Leadership Biography / Plant Responsibilities Notes
                </label>
                <textarea
                  rows={2}
                  value={leaderFormNotes}
                  onChange={e => setLeaderFormNotes(e.target.value)}
                  placeholder="Operational tenure, major lean implementations, style specializations..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d9d2c2] text-xs font-medium focus:outline-none focus:border-[#176f78]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setIsLeaderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingLeaderId ? 'Save Leader Updates' : 'Appoint to Plant Leadership'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODAL 5: PLANT LEADERSHIP ORG HIERARCHY TREE                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isOrgTreeOpen && (() => {
        const treePlant = plants.find(p => p.id === selectedPlantForOrgTree) || activePlant;
        const treeLeaders = leaderships.filter(l => l.plantId === treePlant.id);
        const plantHead = treeLeaders.find(l => l.isPlantHead) || treeLeaders[0];
        const deptHeads = treeLeaders.filter(l => l.id !== plantHead?.id && (l.leadershipTier === 'departmental_head' || l.leadershipTier === 'plant_executive'));
        const wingLeads = treeLeaders.filter(l => l.id !== plantHead?.id && l.leadershipTier === 'divisional_lead');
        const floorLeads = treeLeaders.filter(l => l.id !== plantHead?.id && l.leadershipTier === 'floor_commander');
        const plantMgts = managements.filter(m => m.plantId === treePlant.id);
        const isCurrentActive = activePlant.id === treePlant.id;

        return (
          <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl border border-[#d9d2c2] shadow-2xl w-full max-w-4xl overflow-hidden animate-fadeIn my-8">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-[#e7e1d5] bg-gradient-to-r from-teal-500/10 via-transparent to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                      <span>Plant Command Hierarchy: {treePlant.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#176f78]/10 text-[#176f78]">
                        {treePlant.plantCode}
                      </span>
                    </h3>
                    <p className="text-xs text-[#527078]">
                      Organized chain of command, operational authority levels, and departmental reporting for this plant.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOrgTreeOpen(false)}
                  className="p-2 rounded-xl hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Plant Switcher Bar inside Org Tree */}
              <div className="p-3 bg-[#fbfaf6] border-b border-[#e7e1d5] flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-[#527078] shrink-0">Switch Plant View:</span>
                {plants.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlantForOrgTree(p.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedPlantForOrgTree === p.id
                        ? 'bg-[#176f78] text-white shadow-2xs'
                        : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#f1eee6]'
                    }`}
                  >
                    {p.shortTag} • {p.unitName}
                  </button>
                ))}
              </div>

              {/* Tree Content */}
              <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Level 0: Plant Head / GM Executive */}
                <div className="text-center space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-2xs">
                    <Crown className="w-3 h-3 text-amber-600" /> Tier 0: Primary Plant Head &amp; Executive Command
                  </div>

                  {plantHead ? (
                    <div className="max-w-md mx-auto p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/60 to-white shadow-xs text-left relative overflow-hidden">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0"
                          style={{ backgroundColor: plantHead.avatarColor || '#176f78' }}
                        >
                          {plantHead.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-[#17343a] truncate">{plantHead.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-400 text-amber-950">
                              PLANT HEAD
                            </span>
                          </div>
                          <div className="text-xs text-[#176f78] font-semibold">{plantHead.designation}</div>
                          <div className="text-[11px] text-[#527078] mt-0.5">
                            Governs {treePlant.totalLinesCount} Lines • {plantHead.directReportsCount || 20} Direct Reports
                          </div>
                        </div>
                      </div>

                      {plantHead.delegatedAuthorities && plantHead.delegatedAuthorities.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-amber-200/70 flex flex-wrap gap-1">
                          {plantHead.delegatedAuthorities.slice(0, 3).map((a, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-white text-amber-950 border border-amber-200">
                              ✓ {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-[#d9d2c2] text-xs text-[#527078]">
                      No plant head assigned yet. Click "Appoint Leader" to assign executive leadership.
                    </div>
                  )}
                </div>

                {/* Vertical Connector Line */}
                <div className="w-0.5 h-6 bg-[#d9d2c2] mx-auto" />

                {/* Level 1: Departmental Command Heads */}
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 px-3 py-1 rounded-full inline-block">
                      Tier 1: Functional Departmental Heads (IE, Quality, Cutting &amp; Automation)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {deptHeads.map(dh => (
                      <div key={dh.id} className="p-3.5 rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: dh.avatarColor || '#0d9488' }}
                          >
                            {dh.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#17343a] truncate">{dh.name}</div>
                            <div className="text-[11px] text-[#176f78] truncate font-medium">{dh.designation}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#527078] truncate">
                          Scope: {dh.managedLinesRange || 'Plant-Wide'}
                        </div>
                      </div>
                    ))}
                    {deptHeads.length === 0 && (
                      <div className="col-span-3 text-center py-2 text-xs text-[#527078] italic">
                        No additional departmental heads registered.
                      </div>
                    )}
                  </div>
                </div>

                {/* Vertical Connector Line */}
                <div className="w-0.5 h-6 bg-[#d9d2c2] mx-auto" />

                {/* Level 2: Divisional Production Leads */}
                <div className="space-y-2">
                  <div className="text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-3 py-1 rounded-full inline-block">
                      Tier 2: Divisional Wing Production Managers &amp; Finishing Leads
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wingLeads.map(wl => (
                      <div key={wl.id} className="p-3.5 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-2xs space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: wl.avatarColor || '#2563eb' }}
                          >
                            {wl.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#17343a] truncate">{wl.name}</div>
                            <div className="text-[11px] text-blue-700 truncate font-medium">{wl.designation}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-[#527078]">
                          Assigned: <strong>{wl.managedLinesRange || 'Lines'}</strong> • {wl.managedFloors?.join(', ') || 'Floors'}
                        </div>
                      </div>
                    ))}
                    {wingLeads.length === 0 && (
                      <div className="col-span-2 text-center py-2 text-xs text-[#527078] italic">
                        No divisional wing managers appointed yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Associated Management Divisions Pill Showcase */}
                <div className="pt-4 border-t border-[#e7e1d5] space-y-2">
                  <div className="text-xs font-bold text-[#17343a] flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-[#176f78]" />
                    <span>Management Divisions Operating in {treePlant.name} ({plantMgts.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plantMgts.map(m => (
                      <div
                        key={m.id}
                        className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white text-xs flex items-center gap-2 shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.colorTheme || '#176f78' }} />
                        <span className="font-bold text-[#17343a]">{m.name}</span>
                        <span className="text-[10px] font-mono text-[#527078]">({m.assignedLines.length} Lines)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-[#e7e1d5] bg-[#fbfaf6] flex items-center justify-between">
                <div>
                  {!isCurrentActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectActivePlant(treePlant);
                        setIsOrgTreeOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Switch System to This Plant</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Currently Active System Plant</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsOrgTreeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#17343a] text-white text-xs font-bold cursor-pointer"
                >
                  Close Hierarchy
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
