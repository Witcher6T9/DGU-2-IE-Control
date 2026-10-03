/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enterprise Multi-Tenant Workspace & Sovereign Ownership Engine
 */

import { EnterpriseWorkspace, WorkspaceMember, WorkspaceRole, EnterprisePlant, UserProfile } from '../types';
import { INITIAL_ENTERPRISE_PLANTS, setActiveEnterprisePlant } from './enterpriseManager';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';

export const STORAGE_KEY_ENTERPRISE_WORKSPACES = 'debonair_enterprise_workspaces_v1';
export const STORAGE_KEY_ACTIVE_WORKSPACE_ID = 'debonair_active_workspace_id_v1';

// Seed Enterprises with explicit ownership and assigned industrial plants
export const INITIAL_ENTERPRISE_WORKSPACES: EnterpriseWorkspace[] = [
  {
    id: 'workspace_debonair',
    name: 'Debonair Group Bangladesh',
    slug: 'debonair-group',
    code: 'DBN-GRP',
    industrySector: 'Apparel & Garments (RMG)',
    description: 'Premier export-oriented outerwear, knitwear, and technical garment manufacturing enterprise with multi-plant digital balancing.',
    headquarters: 'House # 42, Road # 1, Sector # 3, Uttara, Dhaka-1230, Bangladesh',
    country: 'Bangladesh',
    contactEmail: 'ie.central@debonairgroupbd.com',
    brandColor: '#176f78',
    logoIcon: 'Factory',
    establishedYear: '2008',
    subscriptionTier: 'enterprise',
    status: 'active',
    isCustom: false,

    // Sovereign Owner: Default root administrator & IE head
    ownerId: 'usr_ashik_hossain_root',
    ownerName: 'Ashik Hossain',
    ownerEmail: '2222471002@uttarauniversity.edu.bd',
    ownershipTransferredAt: undefined,
    previousOwners: [],

    accessPolicy: 'domain_matched',
    allowedDomains: ['@debonairgroupbd.com', '@debonairbd.com', '@uttarauniversity.edu.bd'],
    members: [
      {
        id: 'mem_ashik_owner',
        userId: 'usr_ashik_hossain_root',
        name: 'Ashik Hossain',
        email: '2222471002@uttarauniversity.edu.bd',
        role: 'owner',
        department: 'Industrial Engineering (IE)',
        designation: 'Head of Industrial Engineering & Enterprise Systems',
        phone: '+880 1711-002233',
        avatarColor: '#176f78',
        status: 'active',
        joinedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'mem_farhan_admin',
        userId: 'usr_farhan_u01',
        name: 'Farhan Kabir',
        email: 'f.kabir@debonairbd.com',
        role: 'admin',
        department: 'Operations',
        designation: 'General Manager Operations (Unit-01)',
        phone: '+880 1712-445566',
        avatarColor: '#0284c7',
        status: 'active',
        joinedAt: '2026-01-10T00:00:00Z',
        invitedBy: 'Ashik Hossain'
      },
      {
        id: 'mem_moin_admin',
        userId: 'usr_moin_u03',
        name: 'Moinuddin Chowdhury',
        email: 'plant.u03@debonairgroupbd.com',
        role: 'admin',
        department: 'Technical & Production',
        designation: 'Executive Director (Unit-03 Technical)',
        phone: '+880 1713-778899',
        avatarColor: '#4f46e5',
        status: 'active',
        joinedAt: '2026-01-12T00:00:00Z',
        invitedBy: 'Ashik Hossain'
      },
      {
        id: 'mem_kamrul_iemgt',
        userId: 'usr_kamrul_ie',
        name: 'Kamrul Ahsan',
        email: 'kamrul.tech@debonairbd.com',
        role: 'ie_manager',
        department: 'Industrial Engineering',
        designation: 'IE Manager & Capacity Balancing Lead',
        phone: '+880 1715-113355',
        avatarColor: '#0d9488',
        status: 'active',
        joinedAt: '2026-02-01T00:00:00Z',
        invitedBy: 'Ashik Hossain'
      }
    ],

    plants: [
      INITIAL_ENTERPRISE_PLANTS[0], // Unit-02 (34 lines)
      INITIAL_ENTERPRISE_PLANTS[1], // Unit-01 (28 lines)
      INITIAL_ENTERPRISE_PLANTS[2]  // Unit-03 (30 lines)
    ],
    defaultPlantId: 'plant_debonair_u02',
    storageNamespace: 'ns_debonair_group',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'workspace_apex',
    name: 'Apex Holdings & Footwear Worldwide',
    slug: 'apex-footwear',
    code: 'APX-HLD',
    industrySector: 'Footwear & Leather Goods',
    description: 'Integrated leather processing, athletic footwear lasting, and upper stitching assembly lines for global export retail brands.',
    headquarters: 'Apex Centre, Plot 6, Block C, Gulshan-1, Dhaka-1212, Bangladesh',
    country: 'Bangladesh',
    contactEmail: 'operations@apexfootwearbd.com',
    brandColor: '#0f766e',
    logoIcon: 'Building2',
    establishedYear: '1990',
    subscriptionTier: 'enterprise',
    status: 'active',
    isCustom: false,

    ownerId: 'usr_rehan_quadir',
    ownerName: 'Rehan Quadir',
    ownerEmail: 'rehan.q@apexfootwearbd.com',
    ownershipTransferredAt: undefined,
    previousOwners: [],

    accessPolicy: 'domain_matched',
    allowedDomains: ['@apexfootwearbd.com', '@apexholdings.com'],
    members: [
      {
        id: 'mem_rehan_owner',
        userId: 'usr_rehan_quadir',
        name: 'Rehan Quadir',
        email: 'rehan.q@apexfootwearbd.com',
        role: 'owner',
        department: 'Operations',
        designation: 'Managing Director & Workspace Owner',
        phone: '+880 1819-334455',
        avatarColor: '#0f766e',
        status: 'active',
        joinedAt: '2026-02-18T00:00:00Z'
      },
      {
        id: 'mem_nasir_admin',
        userId: 'usr_nasir_ed',
        name: 'Sheikh Nasir Uddin',
        email: 'nasir.u@apexfootwearbd.com',
        role: 'admin',
        department: 'Footwear Manufacturing',
        designation: 'Executive Director Operations',
        phone: '+880 1818-223344',
        avatarColor: '#0d9488',
        status: 'active',
        joinedAt: '2026-02-20T00:00:00Z',
        invitedBy: 'Rehan Quadir'
      }
    ],

    plants: [
      INITIAL_ENTERPRISE_PLANTS[3], // Apex Footwear Unit-01 (12 lines)
      INITIAL_ENTERPRISE_PLANTS[4]  // Apex Footwear Unit-02 (18 lines)
    ],
    defaultPlantId: 'plant_apex_footwear',
    storageNamespace: 'ns_apex_footwear',
    createdAt: '2026-02-18T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'workspace_hameem',
    name: 'Ha-Meem Denim & Industrial Holdings',
    slug: 'hameem-denim',
    code: 'HMD-IND',
    industrySector: 'Denim & Heavy Bottoms',
    description: 'Massive vertical denim spinning, weaving, laser scraping, and automated 5-pocket denim sewing complex with high-speed lines.',
    headquarters: 'Ha-Meem Tower, 387 Tejgaon I/A, Dhaka-1208, Bangladesh',
    country: 'Bangladesh',
    contactEmail: 'ie.denim@hameemgroup.com',
    brandColor: '#1e40af',
    logoIcon: 'Layers',
    establishedYear: '1984',
    subscriptionTier: 'enterprise',
    status: 'active',
    isCustom: false,

    ownerId: 'usr_masud_rana',
    ownerName: 'Engr. Masud Rana',
    ownerEmail: 'masud.rana@hameemgroup.com',
    ownershipTransferredAt: undefined,
    previousOwners: [],

    accessPolicy: 'domain_matched',
    allowedDomains: ['@hameemgroup.com'],
    members: [
      {
        id: 'mem_masud_owner',
        userId: 'usr_masud_rana',
        name: 'Engr. Masud Rana',
        email: 'masud.rana@hameemgroup.com',
        role: 'owner',
        department: 'IE & Planning',
        designation: 'General Manager IE & Planning',
        phone: '+880 1911-224466',
        avatarColor: '#1e40af',
        status: 'active',
        joinedAt: '2026-02-25T00:00:00Z'
      },
      {
        id: 'mem_anisur_admin',
        userId: 'usr_anisur_denim',
        name: 'Anisur Rahman',
        email: 'anisur.r@hameemgroup.com',
        role: 'admin',
        department: 'Sewing Operations',
        designation: 'Head of Denim Assembly Lines',
        phone: '+880 1911-667788',
        avatarColor: '#2563eb',
        status: 'active',
        joinedAt: '2026-02-28T00:00:00Z',
        invitedBy: 'Engr. Masud Rana'
      }
    ],

    plants: [
      INITIAL_ENTERPRISE_PLANTS[5], // Ha-Meem Denim Plant-04 (20 lines)
      INITIAL_ENTERPRISE_PLANTS[6]  // Ha-Meem Denim Plant-07 (24 lines)
    ],
    defaultPlantId: 'plant_hameem_denim',
    storageNamespace: 'ns_hameem_denim',
    createdAt: '2026-02-25T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

// Helper to determine if a given user/profile owns the workspace
export function isCurrentUserWorkspaceOwner(workspace: EnterpriseWorkspace, profile?: UserProfile): boolean {
  if (!profile || !workspace) return false;
  
  const userEmail = (profile.email || '').trim().toLowerCase();
  const ownerEmail = (workspace.ownerEmail || '').trim().toLowerCase();

  if (userEmail && ownerEmail && userEmail === ownerEmail) {
    return true;
  }

  if (profile.userId && workspace.ownerId && profile.userId === workspace.ownerId) {
    return true;
  }

  // Master admin check for system override
  if (
    userEmail === '2222471002@uttarauniversity.edu.bd' ||
    userEmail === 'ashikhossainkr@gmail.com' ||
    userEmail === 'applicationhub69@gmail.com'
  ) {
    // If the workspace is Debonair or created by this root admin
    if (workspace.id === 'workspace_debonair' || workspace.ownerEmail.includes('uttarauniversity.edu.bd')) {
      return true;
    }
  }

  return false;
}

// Get the user's role in a workspace
export function getUserWorkspaceRole(workspace: EnterpriseWorkspace, profile?: UserProfile): WorkspaceRole {
  if (isCurrentUserWorkspaceOwner(workspace, profile)) {
    return 'owner';
  }

  if (!profile || !workspace.members) return 'viewer';

  const userEmail = (profile.email || '').trim().toLowerCase();
  const member = workspace.members.find(
    m => (m.email && m.email.trim().toLowerCase() === userEmail) || (profile.userId && m.userId === profile.userId)
  );

  return member ? member.role : 'viewer';
}

// Check if user has management rights in workspace (owner, co_owner, or admin)
export function canManageWorkspace(workspace: EnterpriseWorkspace, profile?: UserProfile): boolean {
  const role = getUserWorkspaceRole(workspace, profile);
  return role === 'owner' || role === 'co_owner' || role === 'admin';
}

// Retrieve stored enterprise workspaces
export function getStoredEnterpriseWorkspaces(): EnterpriseWorkspace[] {
  if (typeof window === 'undefined') return INITIAL_ENTERPRISE_WORKSPACES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTERPRISE_WORKSPACES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse enterprise workspaces from localStorage:', e);
  }
  return INITIAL_ENTERPRISE_WORKSPACES;
}

// Save stored enterprise workspaces to localStorage & Firestore
export function saveStoredEnterpriseWorkspaces(workspaces: EnterpriseWorkspace[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ENTERPRISE_WORKSPACES, JSON.stringify(workspaces));
    window.dispatchEvent(new CustomEvent('debonair:workspaces_updated', { detail: workspaces }));

    // Async sync to Firestore if configured
    if (db) {
      workspaces.forEach(ws => {
        try {
          const docRef = doc(db, 'enterprise_workspaces', ws.id);
          setDoc(docRef, { ...ws, updatedAt: new Date().toISOString() }, { merge: true }).catch(err => {
            console.warn(`Firestore sync for workspace ${ws.id} deferred:`, err);
          });
        } catch {}
      });
    }
  } catch (e) {
    console.error('Failed to save enterprise workspaces:', e);
  }
}

// Get the currently active Enterprise Workspace
export function getActiveEnterpriseWorkspace(): EnterpriseWorkspace {
  const all = getStoredEnterpriseWorkspaces();
  if (typeof window === 'undefined') return all[0];
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_WORKSPACE_ID);
    if (activeId) {
      const match = all.find(w => w.id === activeId);
      if (match) return match;
    }
  } catch (e) {
    console.error('Failed to get active workspace ID:', e);
  }
  return all[0];
}

// Set active Enterprise Workspace & switch active plant accordingly
export function setActiveEnterpriseWorkspace(workspaceId: string): EnterpriseWorkspace {
  const all = getStoredEnterpriseWorkspaces();
  const match = all.find(w => w.id === workspaceId) || all[0];

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_WORKSPACE_ID, match.id);
      window.dispatchEvent(new CustomEvent('debonair:workspace_switched', { detail: match }));

      // Automatically sync active plant to default plant of the new workspace
      if (match.plants && match.plants.length > 0) {
        const targetPlant = match.plants.find(p => p.id === match.defaultPlantId) || match.plants[0];
        setActiveEnterprisePlant(targetPlant.id);
      }
    } catch (e) {
      console.error('Failed to set active workspace ID:', e);
    }
  }
  return match;
}

// Create a new Enterprise Workspace with the calling user as the sovereign Owner
export function createEnterpriseWorkspace(
  params: {
    name: string;
    code: string;
    industrySector: string;
    description?: string;
    headquarters: string;
    country?: string;
    contactEmail: string;
    brandColor?: string;
    logoIcon?: string;
    accessPolicy?: 'invite_only' | 'domain_matched' | 'open_organization';
    allowedDomains?: string[];
  },
  ownerProfile: UserProfile
): EnterpriseWorkspace {
  const all = getStoredEnterpriseWorkspaces();
  const cleanCode = params.code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || 'ENT-01';
  const newId = `workspace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const ownerEmail = (ownerProfile.email || 'admin@enterprise.com').trim();
  const ownerName = ownerProfile.name || 'Enterprise Sovereign Owner';
  const ownerId = ownerProfile.userId || `usr_${Date.now()}`;

  const defaultPlant: EnterprisePlant = {
    id: `plant_${newId}_main`,
    name: params.name,
    unitName: 'Main Production Complex (Unit-01)',
    plantCode: `${cleanCode}-01`,
    enterpriseGroup: params.name,
    industrySector: params.industrySector,
    department: 'Industrial Engineering & Operations',
    addressLocation: params.headquarters,
    shortTag: `${cleanCode.substring(0, 4)}-01`,
    brandColor: params.brandColor || '#176f78',
    totalLinesCount: 16,
    contactEmail: params.contactEmail,
    plantHead: {
      name: ownerName,
      designation: 'Plant Director / Head of Operations',
      email: ownerEmail,
      phone: ownerProfile.phone || '+880 1700-000000'
    },
    shiftHours: 8,
    targetEfficiencyBenchmark: 85.0,
    status: 'active',
    isCustom: true,
    floors: [
      { id: `fl_${newId}_1`, name: 'Alpha Production Floor', linesCount: 8, assignedLinesRange: 'Lines 01 - 08', floorColor: '#0ea5e9', floorManager: ownerName },
      { id: `fl_${newId}_2`, name: 'Beta Production Floor', linesCount: 8, assignedLinesRange: 'Lines 09 - 16', floorColor: '#10b981', floorManager: 'Operations Lead' }
    ],
    notes: `Initial flagship plant for ${params.name} enterprise workspace.`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const newWorkspace: EnterpriseWorkspace = {
    id: newId,
    name: params.name.trim(),
    slug: params.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    code: cleanCode,
    industrySector: params.industrySector,
    description: params.description || `Industrial manufacturing and digital IE balancing workspace for ${params.name}.`,
    headquarters: params.headquarters.trim(),
    country: params.country || 'Bangladesh',
    contactEmail: params.contactEmail.trim(),
    brandColor: params.brandColor || '#176f78',
    logoIcon: params.logoIcon || 'Factory',
    establishedYear: String(new Date().getFullYear()),
    subscriptionTier: 'professional',
    status: 'active',
    isCustom: true,

    // Calling user becomes the sovereign Owner!
    ownerId,
    ownerName,
    ownerEmail,
    ownershipTransferredAt: undefined,
    previousOwners: [],

    accessPolicy: params.accessPolicy || 'invite_only',
    allowedDomains: params.allowedDomains || [ownerEmail.includes('@') ? `@${ownerEmail.split('@')[1]}` : '@enterprise.com'],
    members: [
      {
        id: `mem_${Date.now()}_owner`,
        userId: ownerId,
        name: ownerName,
        email: ownerEmail,
        role: 'owner',
        department: ownerProfile.department || 'Industrial Engineering',
        designation: ownerProfile.jobTitle || 'Executive Enterprise Owner',
        phone: ownerProfile.phone || '',
        avatarColor: params.brandColor || '#176f78',
        status: 'active',
        joinedAt: new Date().toISOString()
      }
    ],

    plants: [defaultPlant],
    defaultPlantId: defaultPlant.id,
    storageNamespace: `ns_${cleanCode.toLowerCase()}_${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updated = [newWorkspace, ...all];
  saveStoredEnterpriseWorkspaces(updated);
  setActiveEnterpriseWorkspace(newWorkspace.id);
  return newWorkspace;
}

// Transfer Workspace Ownership to another member or verified email
export function transferWorkspaceOwnership(
  workspaceId: string,
  newOwner: { email: string; name: string; userId?: string },
  currentProfile: UserProfile,
  options?: {
    previousOwnerAction?: 'downgrade_admin' | 'downgrade_co_owner' | 'downgrade_ie_manager' | 'revoke_privileges';
  }
): { success: boolean; message: string; workspace?: EnterpriseWorkspace } {
  const all = getStoredEnterpriseWorkspaces();
  const index = all.findIndex(w => w.id === workspaceId);
  if (index === -1) {
    return { success: false, message: 'Enterprise Workspace not found.' };
  }

  const workspace = all[index];

  // Verify that caller is the current Owner or Master Admin
  if (!isCurrentUserWorkspaceOwner(workspace, currentProfile)) {
    return { success: false, message: 'Permission Denied: Only the current Sovereign Owner can transfer workspace ownership.' };
  }

  const targetEmail = newOwner.email.trim().toLowerCase();
  if (!targetEmail || !targetEmail.includes('@')) {
    return { success: false, message: 'Please specify a valid recipient email address for ownership transfer.' };
  }

  const action = options?.previousOwnerAction || 'downgrade_admin';

  // Record audit trail of previous owner
  const previousOwners = workspace.previousOwners || [];
  previousOwners.push({
    userId: workspace.ownerId,
    email: workspace.ownerEmail,
    name: workspace.ownerName,
    ownerEmail: workspace.ownerEmail,
    ownerName: workspace.ownerName,
    actionTaken: action,
    transferredAt: new Date().toISOString()
  });

  // Handle previous owner privileges: revoke or downgrade
  let updatedMembers: WorkspaceMember[] = [];
  if (action === 'revoke_privileges') {
    // Revoke all privileges: remove from workspace member roster
    updatedMembers = (workspace.members || []).filter(
      m => m.email.toLowerCase() !== workspace.ownerEmail.toLowerCase()
    );
  } else {
    // Downgrade to selected role
    const downgradedRole: WorkspaceRole =
      action === 'downgrade_co_owner' ? 'co_owner' :
      action === 'downgrade_ie_manager' ? 'ie_manager' : 'admin';

    updatedMembers = (workspace.members || []).map(m => {
      if (m.email.toLowerCase() === workspace.ownerEmail.toLowerCase()) {
        return { ...m, role: downgradedRole, designation: `${downgradedRole.toUpperCase()} (Former Owner)` };
      }
      return m;
    });
  }

  // Promote or add new owner in members list
  const existingMemberIndex = updatedMembers.findIndex(m => m.email.toLowerCase() === targetEmail);
  if (existingMemberIndex >= 0) {
    updatedMembers[existingMemberIndex] = {
      ...updatedMembers[existingMemberIndex],
      role: 'owner',
      name: newOwner.name || updatedMembers[existingMemberIndex].name
    };
  } else {
    updatedMembers.unshift({
      id: `mem_${Date.now()}_transferred_owner`,
      userId: newOwner.userId || `usr_${Date.now()}`,
      name: newOwner.name || targetEmail.split('@')[0],
      email: targetEmail,
      role: 'owner',
      designation: 'Transferred Sovereign Owner',
      avatarColor: workspace.brandColor,
      status: 'active',
      joinedAt: new Date().toISOString(),
      invitedBy: `${workspace.ownerName} (Handover)`
    });
  }

  const updatedWorkspace: EnterpriseWorkspace = {
    ...workspace,
    ownerId: newOwner.userId || `usr_${Date.now()}_${targetEmail.split('@')[0]}`,
    ownerName: newOwner.name || targetEmail.split('@')[0],
    ownerEmail: targetEmail,
    ownershipTransferredAt: new Date().toISOString(),
    previousOwners,
    members: updatedMembers,
    updatedAt: new Date().toISOString()
  };

  all[index] = updatedWorkspace;
  saveStoredEnterpriseWorkspaces(all);

  return {
    success: true,
    message: `Ownership of "${workspace.name}" has been transferred to ${newOwner.name} (${targetEmail}).`,
    workspace: updatedWorkspace
  };
}

// Add or invite a member to the workspace
export function addWorkspaceMember(
  workspaceId: string,
  member: Omit<WorkspaceMember, 'id' | 'joinedAt'>,
  currentProfile: UserProfile
): { success: boolean; message: string; workspace?: EnterpriseWorkspace } {
  const all = getStoredEnterpriseWorkspaces();
  const index = all.findIndex(w => w.id === workspaceId);
  if (index === -1) return { success: false, message: 'Workspace not found.' };

  const workspace = all[index];
  if (!canManageWorkspace(workspace, currentProfile)) {
    return { success: false, message: 'Permission Denied: Only workspace owners and admins can invite members.' };
  }

  const cleanEmail = member.email.trim().toLowerCase();
  if (workspace.members.some(m => m.email.toLowerCase() === cleanEmail)) {
    return { success: false, message: 'This member already exists in this workspace.' };
  }

  const newMember: WorkspaceMember = {
    ...member,
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    joinedAt: new Date().toISOString(),
    invitedBy: currentProfile.name || 'Workspace Admin'
  };

  workspace.members = [...workspace.members, newMember];
  workspace.updatedAt = new Date().toISOString();
  all[index] = workspace;
  saveStoredEnterpriseWorkspaces(all);

  return {
    success: true,
    message: `Invited ${member.name} (${cleanEmail}) as ${member.role.replace('_', ' ').toUpperCase()}.`,
    workspace
  };
}

// Update a member's role in the workspace
export function updateWorkspaceMemberRole(
  workspaceId: string,
  memberId: string,
  newRole: WorkspaceRole,
  currentProfile: UserProfile
): { success: boolean; message: string; workspace?: EnterpriseWorkspace } {
  const all = getStoredEnterpriseWorkspaces();
  const index = all.findIndex(w => w.id === workspaceId);
  if (index === -1) return { success: false, message: 'Workspace not found.' };

  const workspace = all[index];
  const callerIsOwner = isCurrentUserWorkspaceOwner(workspace, currentProfile);

  if (!callerIsOwner && !canManageWorkspace(workspace, currentProfile)) {
    return { success: false, message: 'Permission Denied: Insufficient privileges.' };
  }

  // Non-owners cannot promote someone to owner or demote an owner
  if (newRole === 'owner') {
    return { success: false, message: 'Use Transfer Ownership to designate a new sovereign owner.' };
  }

  const member = workspace.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: 'Member not found.' };

  if (member.role === 'owner') {
    return { success: false, message: 'The sovereign owner cannot be re-assigned from the member list.' };
  }

  workspace.members = workspace.members.map(m => m.id === memberId ? { ...m, role: newRole } : m);
  workspace.updatedAt = new Date().toISOString();
  all[index] = workspace;
  saveStoredEnterpriseWorkspaces(all);

  return { success: true, message: `Updated ${member.name}'s role to ${newRole.toUpperCase()}.`, workspace };
}

// Remove a member from the workspace
export function removeWorkspaceMember(
  workspaceId: string,
  memberId: string,
  currentProfile: UserProfile
): { success: boolean; message: string; workspace?: EnterpriseWorkspace } {
  const all = getStoredEnterpriseWorkspaces();
  const index = all.findIndex(w => w.id === workspaceId);
  if (index === -1) return { success: false, message: 'Workspace not found.' };

  const workspace = all[index];
  if (!canManageWorkspace(workspace, currentProfile)) {
    return { success: false, message: 'Permission Denied: Only owners and admins can remove members.' };
  }

  const member = workspace.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: 'Member not found.' };

  if (member.role === 'owner') {
    return { success: false, message: 'Cannot remove the workspace Sovereign Owner.' };
  }

  workspace.members = workspace.members.filter(m => m.id !== memberId);
  workspace.updatedAt = new Date().toISOString();
  all[index] = workspace;
  saveStoredEnterpriseWorkspaces(all);

  return { success: true, message: `Removed ${member.name} from the workspace.`, workspace };
}

// Update workspace general details
export function updateEnterpriseWorkspace(
  workspaceId: string,
  updates: Partial<EnterpriseWorkspace>,
  currentProfile: UserProfile
): { success: boolean; message: string; workspace?: EnterpriseWorkspace } {
  const all = getStoredEnterpriseWorkspaces();
  const index = all.findIndex(w => w.id === workspaceId);
  if (index === -1) return { success: false, message: 'Workspace not found.' };

  const workspace = all[index];
  if (!canManageWorkspace(workspace, currentProfile)) {
    return { success: false, message: 'Permission Denied: Only owners and admins can edit workspace profile.' };
  }

  // Prevent changing owner fields through generic update
  const { ownerId, ownerEmail, ownerName, previousOwners, ownershipTransferredAt, ...allowedUpdates } = updates;

  const updatedWorkspace: EnterpriseWorkspace = {
    ...workspace,
    ...allowedUpdates,
    updatedAt: new Date().toISOString()
  };

  all[index] = updatedWorkspace;
  saveStoredEnterpriseWorkspaces(all);

  return { success: true, message: 'Enterprise workspace updated successfully.', workspace: updatedWorkspace };
}

// Delete a custom enterprise workspace (Only the sovereign Owner can delete!)
export function deleteEnterpriseWorkspace(
  workspaceId: string,
  currentProfile: UserProfile
): { success: boolean; message: string } {
  const all = getStoredEnterpriseWorkspaces();
  const workspace = all.find(w => w.id === workspaceId);
  if (!workspace) return { success: false, message: 'Workspace not found.' };

  if (!isCurrentUserWorkspaceOwner(workspace, currentProfile)) {
    return { success: false, message: 'Permission Denied: Only the sovereign Owner can permanently delete an enterprise workspace.' };
  }

  if (workspace.id === 'workspace_debonair') {
    return { success: false, message: 'The primary flagship enterprise workspace cannot be deleted.' };
  }

  const remaining = all.filter(w => w.id !== workspaceId);
  saveStoredEnterpriseWorkspaces(remaining);

  // If deleted workspace was active, switch to first remaining
  const activeWs = getActiveEnterpriseWorkspace();
  if (activeWs.id === workspaceId) {
    setActiveEnterpriseWorkspace(remaining[0].id);
  }

  // Delete from Firestore if configured
  if (db) {
    try {
      deleteDoc(doc(db, 'enterprise_workspaces', workspaceId)).catch(() => {});
    } catch {}
  }

  return { success: true, message: `Enterprise workspace "${workspace.name}" deleted successfully.` };
}
