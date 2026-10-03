/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enterprise Workspaces & Sovereign Ownership Hub Modal
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Factory,
  Crown,
  Shield,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Layers,
  MapPin,
  Mail,
  Phone,
  Globe,
  Lock,
  UserCheck,
  Award,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Check,
  X,
  Copy,
  Search,
  Filter
} from 'lucide-react';
import { EnterpriseWorkspace, WorkspaceMember, WorkspaceRole, UserProfile } from '../../types';
import {
  getStoredEnterpriseWorkspaces,
  getActiveEnterpriseWorkspace,
  setActiveEnterpriseWorkspace,
  createEnterpriseWorkspace,
  updateEnterpriseWorkspace,
  transferWorkspaceOwnership,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  deleteEnterpriseWorkspace,
  isCurrentUserWorkspaceOwner,
  getUserWorkspaceRole,
  canManageWorkspace
} from '../../utils/enterpriseWorkspaceManager';
import { INDUSTRY_SECTORS } from '../../data/factoryProfiles';

interface EnterpriseWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
  initialTab?: 'registry' | 'ownership' | 'members' | 'create';
  onWorkspaceChanged?: (workspace: EnterpriseWorkspace) => void;
}

export const EnterpriseWorkspaceModal: React.FC<EnterpriseWorkspaceModalProps> = ({
  isOpen,
  onClose,
  profile,
  initialTab = 'registry',
  onWorkspaceChanged
}) => {
  const [activeTab, setActiveTab] = useState<'registry' | 'ownership' | 'members' | 'create'>(initialTab);
  const [workspaces, setWorkspaces] = useState<EnterpriseWorkspace[]>(() => getStoredEnterpriseWorkspaces());
  const [activeWorkspace, setActiveWorkspace] = useState<EnterpriseWorkspace>(() => getActiveEnterpriseWorkspace());
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(() => getActiveEnterpriseWorkspace().id);

  // Transfer Ownership Form State
  const [transferEmail, setTransferEmail] = useState('');
  const [transferName, setTransferName] = useState('');
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [previousOwnerAction, setPreviousOwnerAction] = useState<'downgrade_admin' | 'downgrade_co_owner' | 'downgrade_ie_manager' | 'revoke_privileges'>('downgrade_admin');
  const [confirmTransferWord, setConfirmTransferWord] = useState('');

  // Invite Member Form State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('ie_manager');
  const [invitePhone, setInvitePhone] = useState('');

  // Create Workspace Form State
  const [newWsName, setNewWsName] = useState('');
  const [newWsCode, setNewWsCode] = useState('');
  const [newWsSector, setNewWsSector] = useState(INDUSTRY_SECTORS[0] || 'Apparel & Garments (RMG)');
  const [newWsHeadquarters, setNewWsHeadquarters] = useState('');
  const [newWsContactEmail, setNewWsContactEmail] = useState('');
  const [newWsBrandColor, setNewWsBrandColor] = useState('#176f78');
  const [newWsDescription, setNewWsDescription] = useState('');

  // Feedback Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleUpdate = () => {
      const currentAll = getStoredEnterpriseWorkspaces();
      setWorkspaces(currentAll);
      const currentActive = getActiveEnterpriseWorkspace();
      setActiveWorkspace(currentActive);
    };

    window.addEventListener('debonair:workspaces_updated', handleUpdate);
    window.addEventListener('debonair:workspace_switched', handleUpdate);
    return () => {
      window.removeEventListener('debonair:workspaces_updated', handleUpdate);
      window.removeEventListener('debonair:workspace_switched', handleUpdate);
    };
  }, []);

  const selectedWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === selectedWorkspaceId) || activeWorkspace;
  }, [workspaces, selectedWorkspaceId, activeWorkspace]);

  const isOwnerOfSelected = isCurrentUserWorkspaceOwner(selectedWorkspace, profile);
  const userRoleInSelected = getUserWorkspaceRole(selectedWorkspace, profile);
  const canManageSelected = canManageWorkspace(selectedWorkspace, profile);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  if (!isOpen) return null;

  // Handle Switch Workspace
  const handleSwitchWorkspace = (ws: EnterpriseWorkspace) => {
    const switched = setActiveEnterpriseWorkspace(ws.id);
    setActiveWorkspace(switched);
    setSelectedWorkspaceId(switched.id);
    onWorkspaceChanged?.(switched);
    showNotification('success', `Switched to "${switched.name}" workspace.`);
  };

  // Handle Create Workspace
  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim() || !newWsCode.trim() || !newWsHeadquarters.trim()) {
      showNotification('error', 'Please fill in all required enterprise fields.');
      return;
    }

    const defaultOwnerProfile: UserProfile = profile || {
      name: 'Workspace Sovereign Owner',
      email: newWsContactEmail || 'owner@enterprise.com',
      jobTitle: 'Executive Enterprise Owner',
      role: 'admin',
      tierId: 'tier_1',
      userId: 'usr_owner_root',
      department: 'Industrial Engineering'
    };

    const created = createEnterpriseWorkspace(
      {
        name: newWsName.trim(),
        code: newWsCode.trim(),
        industrySector: newWsSector,
        headquarters: newWsHeadquarters.trim(),
        contactEmail: newWsContactEmail.trim() || defaultOwnerProfile.email || 'contact@enterprise.com',
        brandColor: newWsBrandColor,
        description: newWsDescription.trim()
      },
      defaultOwnerProfile
    );

    setWorkspaces(getStoredEnterpriseWorkspaces());
    setActiveWorkspace(created);
    setSelectedWorkspaceId(created.id);
    onWorkspaceChanged?.(created);

    // Reset form
    setNewWsName('');
    setNewWsCode('');
    setNewWsHeadquarters('');
    setNewWsContactEmail('');
    setNewWsDescription('');
    setActiveTab('ownership');

    showNotification('success', `Enterprise workspace "${created.name}" created! You are registered as sovereign Owner.`);
  };

  // Handle Transfer Ownership
  const handleTransferOwnership = () => {
    if (!transferEmail.trim() || !transferName.trim()) {
      showNotification('error', 'Recipient email and name are required for ownership transfer.');
      return;
    }

    if (confirmTransferWord.trim().toUpperCase() !== 'TRANSFER') {
      showNotification('error', 'Please type TRANSFER in all capitals to authorize the handover.');
      return;
    }

    if (!profile) {
      showNotification('error', 'Profile context required to verify current ownership.');
      return;
    }

    const result = transferWorkspaceOwnership(
      selectedWorkspace.id,
      { email: transferEmail.trim(), name: transferName.trim() },
      profile,
      { previousOwnerAction }
    );

    if (result.success && result.workspace) {
      setWorkspaces(getStoredEnterpriseWorkspaces());
      setActiveWorkspace(getActiveEnterpriseWorkspace());
      setTransferConfirmOpen(false);
      setTransferEmail('');
      setTransferName('');
      setConfirmTransferWord('');
      showNotification('success', result.message);
      if (onWorkspaceChanged && result.workspace) {
        onWorkspaceChanged(result.workspace);
      }
    } else {
      showNotification('error', result.message);
    }
  };

  // Handle Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      showNotification('error', 'Member name and email are required.');
      return;
    }

    if (!profile) return;

    const result = addWorkspaceMember(
      selectedWorkspace.id,
      {
        name: inviteName.trim(),
        email: inviteEmail.trim(),
        role: inviteRole,
        designation: inviteDesignation.trim() || 'Team Member',
        phone: invitePhone.trim(),
        avatarColor: selectedWorkspace.brandColor,
        status: 'active'
      },
      profile
    );

    if (result.success) {
      setWorkspaces(getStoredEnterpriseWorkspaces());
      setIsInviteModalOpen(false);
      setInviteName('');
      setInviteEmail('');
      setInviteDesignation('');
      setInvitePhone('');
      showNotification('success', result.message);
    } else {
      showNotification('error', result.message);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = (memberId: string) => {
    if (!profile) return;
    const result = removeWorkspaceMember(selectedWorkspace.id, memberId, profile);
    if (result.success) {
      setWorkspaces(getStoredEnterpriseWorkspaces());
      showNotification('success', result.message);
    } else {
      showNotification('error', result.message);
    }
  };

  // Handle Update Member Role
  const handleRoleChange = (memberId: string, newRole: WorkspaceRole) => {
    if (!profile) return;
    const result = updateWorkspaceMemberRole(selectedWorkspace.id, memberId, newRole, profile);
    if (result.success) {
      setWorkspaces(getStoredEnterpriseWorkspaces());
      showNotification('success', result.message);
    } else {
      showNotification('error', result.message);
    }
  };

  // Handle Delete Workspace
  const handleDeleteWorkspace = (wsId: string) => {
    if (!profile) return;
    const target = workspaces.find(w => w.id === wsId);
    if (!target) return;

    if (!window.confirm(`Are you absolutely sure you want to permanently delete "${target.name}"? This action cannot be undone.`)) {
      return;
    }

    const result = deleteEnterpriseWorkspace(wsId, profile);
    if (result.success) {
      const remaining = getStoredEnterpriseWorkspaces();
      setWorkspaces(remaining);
      const active = getActiveEnterpriseWorkspace();
      setActiveWorkspace(active);
      setSelectedWorkspaceId(active.id);
      showNotification('success', result.message);
    } else {
      showNotification('error', result.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs select-none">
      <div
        className="w-full max-w-5xl bg-[#fbfaf6] dark:bg-[#151c26] rounded-3xl border border-[#d9d2c2] dark:border-[#2e3b4d] shadow-[0_24px_64px_rgba(0,0,0,0.32)] overflow-hidden flex flex-col max-h-[92vh] text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e7e1d5] dark:border-[#263344] bg-white/90 dark:bg-[#1a2330]/90 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: selectedWorkspace.brandColor || '#176f78' }}
            >
              <Building2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-display text-[#17343a] dark:text-white leading-tight">
                  Enterprise Workspaces &amp; Ownership Hub
                </h3>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-[#176f78] dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Active: <span className="font-semibold text-slate-700 dark:text-slate-200">{activeWorkspace.name}</span> ({activeWorkspace.code})
                {isOwnerOfSelected && ' · Sovereign Owner verified'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-[#e7e1d5] dark:border-[#263344] bg-[#f5f2eb] dark:bg-[#17202c] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'registry'
                ? 'bg-white dark:bg-[#1a2330] text-[#176f78] dark:text-teal-300 border-[#176f78] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Workspaces ({workspaces.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ownership')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'ownership'
                ? 'bg-white dark:bg-[#1a2330] text-amber-700 dark:text-amber-300 border-amber-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Ownership Management</span>
            {isOwnerOfSelected && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'members'
                ? 'bg-white dark:bg-[#1a2330] text-[#176f78] dark:text-teal-300 border-[#176f78] shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members &amp; Roles ({selectedWorkspace.members?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer shrink-0 ${
              activeTab === 'create'
                ? 'bg-white dark:bg-[#1a2330] text-emerald-700 dark:text-emerald-300 border-emerald-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Workspace</span>
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div
            className={`px-5 py-2.5 text-xs font-bold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-b border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-b border-rose-200 dark:border-rose-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: WORKSPACES REGISTRY */}
          {activeTab === 'registry' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1a2330] p-4 rounded-2xl border border-[#d9d2c2] dark:border-[#2e3b4d]">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Registered Enterprise Workspaces
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select an enterprise to switch the entire factory environment, production lines, and live telemetry to that tenant.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-3.5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                  <span>Register Enterprise</span>
                </button>
              </div>

              {/* Grid of Workspaces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map(ws => {
                  const isActive = ws.id === activeWorkspace.id;
                  const isSelected = ws.id === selectedWorkspaceId;
                  const isOwner = isCurrentUserWorkspaceOwner(ws, profile);
                  const role = getUserWorkspaceRole(ws, profile);

                  return (
                    <div
                      key={ws.id}
                      onClick={() => setSelectedWorkspaceId(ws.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between gap-4 ${
                        isActive
                          ? 'bg-gradient-to-br from-teal-50/70 via-white to-cyan-50/60 dark:from-teal-950/40 dark:via-[#1a2330] dark:to-cyan-950/30 border-[#176f78] shadow-md ring-1 ring-[#176f78]/30'
                          : isSelected
                          ? 'bg-white dark:bg-[#1a2330] border-slate-400 dark:border-slate-600 shadow-xs'
                          : 'bg-white dark:bg-[#1a2330] border-[#d9d2c2] dark:border-[#2e3b4d] hover:border-slate-400'
                      }`}
                    >
                      <div>
                        {/* Top Badges & Tags */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {ws.code}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 border border-emerald-300/40">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Active Workspace</span>
                              </span>
                            )}
                          </div>

                          {isOwner ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-300/50">
                              <Crown className="w-3 h-3 fill-amber-500 text-amber-600" />
                              <span>Sovereign Owner</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-slate-500 capitalize">
                              Role: {role.replace('_', ' ')}
                            </span>
                          )}
                        </div>

                        {/* Title & Brand */}
                        <div className="flex items-start gap-3">
                          <div
                            className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                            style={{ backgroundColor: ws.brandColor || '#176f78' }}
                          >
                            <Building2 className="w-6 h-6 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {ws.name}
                            </h4>
                            <p className="text-xs text-[#176f78] dark:text-teal-400 font-semibold mt-0.5">
                              {ws.industrySector}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                              {ws.description || 'Enterprise production complex with digital line governance.'}
                            </p>
                          </div>
                        </div>

                        {/* Details Grid */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-mono block">Plants &amp; Units</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {ws.plants?.length || 0} Industrial Units
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-mono block">Owner</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate block" title={ws.ownerEmail}>
                              {ws.ownerName}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-400 text-[10px] uppercase font-mono block">Headquarters</span>
                            <span className="text-slate-600 dark:text-slate-300 text-[11px] truncate block">
                              {ws.headquarters}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                        {isActive ? (
                          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>Currently Active Tenant</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitchWorkspace(ws);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-[#176f78] dark:hover:bg-teal-400 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          >
                            <span>Switch to Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkspaceId(ws.id);
                              setActiveTab('ownership');
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
                            title="Manage Ownership & Governance"
                          >
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ownership</span>
                          </button>

                          {ws.isCustom && isOwner && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkspace(ws.id);
                              }}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete this workspace (Owner only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: OWNERSHIP & GOVERNANCE */}
          {activeTab === 'ownership' && (
            <div className="space-y-6">
              {/* Sovereign Ownership Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 dark:from-amber-950/40 dark:via-amber-900/20 dark:to-orange-950/30 border border-amber-300 dark:border-amber-800/60 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                      <Crown className="w-6 h-6 stroke-[2.2] fill-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          Sovereign Workspace Ownership
                        </span>
                        {isOwnerOfSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300">
                            👑 You are the Owner
                          </span>
                        )}
                      </div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedWorkspace.ownerName}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-mono">
                        {selectedWorkspace.ownerEmail}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-500 block uppercase">
                      Workspace Governance
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedWorkspace.name} ({selectedWorkspace.code})
                    </span>
                    {selectedWorkspace.ownershipTransferredAt && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block mt-1">
                        Transferred: {new Date(selectedWorkspace.ownershipTransferredAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-amber-200/80 dark:border-amber-800/40 text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Full Sovereignty:</strong> Can transfer ownership, delete workspace, manage subscription and all attached plants.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Tenant Isolation:</strong> Data namespace <code>{selectedWorkspace.storageNamespace}</code> prevents cross-tenant leaks.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>RBAC Delegation:</strong> Owner can assign Co-Owners, Admins, and IE line managers.</span>
                  </div>
                </div>
              </div>

              {/* Transfer Ownership Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1a2330] border border-[#d9d2c2] dark:border-[#2e3b4d] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>Transfer Workspace Ownership</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Hand over complete administrative sovereignty of this enterprise workspace to another verified user or email.
                    </p>
                  </div>
                </div>

                {isOwnerOfSelected ? (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          New Owner Full Name *
                        </label>
                        <input
                          type="text"
                          value={transferName}
                          onChange={(e) => setTransferName(e.target.value)}
                          placeholder="e.g. Farhan Kabir"
                          className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-medium focus:outline-hidden focus:border-[#176f78]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          New Owner Corporate Email *
                        </label>
                        <input
                          type="email"
                          value={transferEmail}
                          onChange={(e) => setTransferEmail(e.target.value)}
                          placeholder="e.g. f.kabir@debonairbd.com"
                          className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-medium focus:outline-hidden focus:border-[#176f78]"
                        />
                      </div>
                    </div>

                    {transferConfirmOpen ? (
                      <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/80 space-y-4">
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                              Identity Verification &amp; Sovereign Handover Authorization
                            </h5>
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                              You are about to transfer complete sovereign ownership of <strong>{selectedWorkspace.name}</strong> to:
                            </p>
                          </div>
                        </div>

                        {/* Verified New Owner Identity Card */}
                        <div className="p-3 rounded-lg bg-white dark:bg-[#1a2330] border border-amber-200 dark:border-amber-800 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
                              {transferName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-900 dark:text-white">{transferName}</div>
                              <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{transferEmail}</div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 font-mono">
                            VERIFIED IDENTITY
                          </span>
                        </div>

                        {/* Previous Owner Privileges Policy */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                            Action on Previous Owner Privileges:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                              previousOwnerAction === 'downgrade_admin'
                                ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-500 text-slate-900 dark:text-white font-semibold'
                                : 'bg-white dark:bg-[#151c26] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              <input
                                type="radio"
                                name="prevOwnerAction"
                                checked={previousOwnerAction === 'downgrade_admin'}
                                onChange={() => setPreviousOwnerAction('downgrade_admin')}
                                className="accent-amber-600"
                              />
                              <div>
                                <div className="text-[11px] font-bold">Downgrade to Administrator</div>
                                <div className="text-[10px] text-slate-500">Retains admin access</div>
                              </div>
                            </label>

                            <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                              previousOwnerAction === 'downgrade_co_owner'
                                ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-500 text-slate-900 dark:text-white font-semibold'
                                : 'bg-white dark:bg-[#151c26] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              <input
                                type="radio"
                                name="prevOwnerAction"
                                checked={previousOwnerAction === 'downgrade_co_owner'}
                                onChange={() => setPreviousOwnerAction('downgrade_co_owner')}
                                className="accent-amber-600"
                              />
                              <div>
                                <div className="text-[11px] font-bold">Downgrade to Co-Owner</div>
                                <div className="text-[10px] text-slate-500">Shared management</div>
                              </div>
                            </label>

                            <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                              previousOwnerAction === 'downgrade_ie_manager'
                                ? 'bg-amber-100/60 dark:bg-amber-900/40 border-amber-500 text-slate-900 dark:text-white font-semibold'
                                : 'bg-white dark:bg-[#151c26] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              <input
                                type="radio"
                                name="prevOwnerAction"
                                checked={previousOwnerAction === 'downgrade_ie_manager'}
                                onChange={() => setPreviousOwnerAction('downgrade_ie_manager')}
                                className="accent-amber-600"
                              />
                              <div>
                                <div className="text-[11px] font-bold">Downgrade to IE Manager</div>
                                <div className="text-[10px] text-slate-500">Production line scope</div>
                              </div>
                            </label>

                            <label className={`p-2.5 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                              previousOwnerAction === 'revoke_privileges'
                                ? 'bg-rose-100/60 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold'
                                : 'bg-white dark:bg-[#151c26] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}>
                              <input
                                type="radio"
                                name="prevOwnerAction"
                                checked={previousOwnerAction === 'revoke_privileges'}
                                onChange={() => setPreviousOwnerAction('revoke_privileges')}
                                className="accent-rose-600"
                              />
                              <div>
                                <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400">Revoke All Privileges</div>
                                <div className="text-[10px] text-slate-500">Remove from workspace</div>
                              </div>
                            </label>
                          </div>
                        </div>

                        {/* Explicit Word Confirmation */}
                        <div className="pt-2 border-t border-amber-200 dark:border-amber-800">
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Type <span className="font-mono text-rose-600 dark:text-rose-400">TRANSFER</span> to authorize ownership transfer:
                          </label>
                          <input
                            type="text"
                            value={confirmTransferWord}
                            onChange={(e) => setConfirmTransferWord(e.target.value)}
                            placeholder="Type TRANSFER"
                            className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#151c26] text-xs font-mono font-bold uppercase focus:outline-hidden focus:border-amber-500 tracking-wider"
                          />
                        </div>

                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setTransferConfirmOpen(false);
                              setConfirmTransferWord('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleTransferOwnership}
                            disabled={confirmTransferWord.trim().toUpperCase() !== 'TRANSFER'}
                            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>Confirm &amp; Hand Over Ownership</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (!transferName.trim() || !transferEmail.trim()) {
                              showNotification('error', 'Please enter recipient name and email.');
                              return;
                            }
                            if (!transferEmail.includes('@') || !transferEmail.includes('.')) {
                              showNotification('error', 'Please enter a valid email address.');
                              return;
                            }
                            setTransferConfirmOpen(true);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                          <Crown className="w-4 h-4" />
                          <span>Initiate Ownership Transfer</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                    Ownership transfer is locked. Only the current sovereign owner (<strong>{selectedWorkspace.ownerName}</strong>) can initiate transfer.
                  </div>
                )}

                {/* Previous Owners Audit Trail */}
                {selectedWorkspace.previousOwners && selectedWorkspace.previousOwners.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Ownership Transfer History &amp; Audit Trail
                    </h5>
                    <div className="space-y-1.5">
                      {selectedWorkspace.previousOwners.map((prev: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{prev.name || prev.ownerName}</span>
                            <span className="text-slate-400 ml-1">({prev.email || prev.ownerEmail})</span>
                          </div>
                          <span className="font-mono text-[10px]">
                            Handover: {new Date(prev.transferredAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Access Policy & Allowed Domains Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-[#1a2330] border border-[#d9d2c2] dark:border-[#2e3b4d] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#176f78]" />
                    <span>Tenant Access Policy &amp; Security Domain</span>
                  </h4>
                  <span className="text-xs font-mono font-bold uppercase text-[#176f78] dark:text-teal-400">
                    {selectedWorkspace.accessPolicy ? selectedWorkspace.accessPolicy.replace('_', ' ') : 'DOMAIN RESTRICTED'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Allowed corporate email domains for automatic membership matching:
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedWorkspace.allowedDomains?.map((dom: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs font-mono font-bold text-[#176f78] dark:text-teal-300">
                      {dom}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MEMBERS & ROLES */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1a2330] p-4 rounded-2xl border border-[#d9d2c2] dark:border-[#2e3b4d]">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Workspace Members ({selectedWorkspace.members?.length || 0})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manage team access, role assignments, and frontline IE privileges for <strong>{selectedWorkspace.name}</strong>.
                  </p>
                </div>

                {canManageSelected && (
                  <button
                    type="button"
                    onClick={() => setIsInviteModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4 stroke-[2.2]" />
                    <span>Invite Member</span>
                  </button>
                )}
              </div>

              {/* Members Table */}
              <div className="rounded-2xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#1a2330] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f5f2eb] dark:bg-[#17202c] border-b border-[#e7e1d5] dark:border-[#263344] text-[10px] font-mono uppercase text-slate-500">
                      <tr>
                        <th className="py-3 px-4">Member Name</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Designation</th>
                        <th className="py-3 px-4">Joined</th>
                        {canManageSelected && <th className="py-3 px-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedWorkspace.members?.map(member => {
                        const isMemberOwner = member.role === 'owner';

                        return (
                          <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-lg text-white font-bold flex items-center justify-center shrink-0 shadow-2xs text-xs"
                                  style={{ backgroundColor: member.avatarColor || selectedWorkspace.brandColor || '#176f78' }}
                                >
                                  {member.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-white truncate">
                                      {member.name}
                                    </span>
                                    {isMemberOwner && (
                                      <Crown className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                                    {member.email}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              {canManageSelected && !isMemberOwner ? (
                                <select
                                  value={member.role}
                                  onChange={(e) => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                                  className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#151c26] text-xs font-semibold focus:outline-hidden"
                                >
                                  <option value="co_owner">Co-Owner</option>
                                  <option value="admin">Admin</option>
                                  <option value="ie_manager">IE Manager</option>
                                  <option value="line_supervisor">Line Supervisor</option>
                                  <option value="viewer">Viewer</option>
                                </select>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                    isMemberOwner
                                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                                      : member.role === 'admin' || member.role === 'co_owner'
                                      ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                  }`}
                                >
                                  {member.role.replace('_', ' ')}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {member.designation || 'Frontline Cadre'}
                            </td>

                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                              {new Date(member.joinedAt || member.addedAt || Date.now()).toLocaleDateString()}
                            </td>

                            {canManageSelected && (
                              <td className="py-3 px-4 text-right">
                                {!isMemberOwner && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(member.id)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                    title="Remove member"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CREATE ENTERPRISE WORKSPACE */}
          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#1a2330] p-5 sm:p-7 rounded-3xl border border-[#d9d2c2] dark:border-[#2e3b4d] shadow-sm">
              <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#176f78]" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Register New Enterprise Workspace
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create a dedicated multi-tenant enterprise instance. You will automatically become the exclusive <strong>Sovereign Owner</strong> of this workspace.
                </p>
              </div>

              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Enterprise / Holding Group Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="e.g. Pacific Casuals Worldwide LTD"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-medium focus:outline-hidden focus:border-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Enterprise Code / Short Tag *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsCode}
                      onChange={(e) => setNewWsCode(e.target.value.toUpperCase())}
                      placeholder="e.g. PCW-GRP"
                      maxLength={10}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-mono font-bold focus:outline-hidden focus:border-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Industry Sector *
                    </label>
                    <select
                      value={newWsSector}
                      onChange={(e) => setNewWsSector(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-medium focus:outline-hidden focus:border-[#176f78]"
                    >
                      {INDUSTRY_SECTORS.map((sec, i) => (
                        <option key={i} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Corporate Headquarters Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={newWsHeadquarters}
                      onChange={(e) => setNewWsHeadquarters(e.target.value)}
                      placeholder="e.g. Tejgaon Industrial Area, Dhaka, Bangladesh"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-medium focus:outline-hidden focus:border-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Enterprise Admin / Contact Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newWsContactEmail}
                      onChange={(e) => setNewWsContactEmail(e.target.value)}
                      placeholder="e.g. operations@pacificcasuals.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-medium focus:outline-hidden focus:border-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Brand Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newWsBrandColor}
                        onChange={(e) => setNewWsBrandColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer border border-[#d9d2c2] p-0.5"
                      />
                      <input
                        type="text"
                        value={newWsBrandColor}
                        onChange={(e) => setNewWsBrandColor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Enterprise Mission &amp; Overview
                    </label>
                    <textarea
                      rows={2}
                      value={newWsDescription}
                      onChange={(e) => setNewWsDescription(e.target.value)}
                      placeholder="Describe production specialties, export markets, and garment line capacities..."
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] dark:border-[#2e3b4d] bg-white dark:bg-[#151c26] text-xs font-medium focus:outline-hidden focus:border-[#176f78]"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center gap-2.5">
                  <Crown className="w-5 h-5 text-amber-600 fill-amber-400 shrink-0" />
                  <span className="text-xs text-amber-900 dark:text-amber-200">
                    <strong>Sovereignty Guarantee:</strong> You ({profile?.email || 'Current User'}) will immediately be registered as the exclusive <strong>Workspace Owner</strong> with full governance and transfer rights.
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('registry')}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Create Enterprise &amp; Claim Ownership</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#e7e1d5] dark:border-[#263344] bg-[#f5f2eb] dark:bg-[#17202c] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-mono">Namespace: {activeWorkspace.storageNamespace}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Invite Member Sub-Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="w-full max-w-md bg-white dark:bg-[#18202b] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#176f78]" />
                <span>Invite Member to {selectedWorkspace.code}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Kazi Nazmul"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. nazmul.ie@debonairbd.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={inviteDesignation}
                    onChange={(e) => setInviteDesignation(e.target.value)}
                    placeholder="e.g. Line IE Officer"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                  >
                    <option value="co_owner">Co-Owner</option>
                    <option value="admin">Admin</option>
                    <option value="ie_manager">IE Manager</option>
                    <option value="line_supervisor">Line Supervisor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#176f78] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
