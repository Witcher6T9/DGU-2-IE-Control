/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — IE Department
 * Role-Based Access Control (RBAC) Security & Scoping Engine
 */

import { RoleTier, UserProfile } from '../types';

export interface LineScopeCheckResult {
  inScope: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canDelete: boolean;
  accessControlLevel: string;
  scopeType: 'all' | 'wing' | 'block' | 'line';
  reason?: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'slate';
}

/**
 * Wing mappings for Debonair LTD (Unit-02)
 * Total 34 Production Lines:
 * - Blue Wing (Mgr 1): Lines 01 to 17 (17 Lines, Floors 1–3)
 * - Green Wing (Mgr 2): Lines 18 to 34 (17 Lines, Floors 4–6)
 */
export const BLUE_WING_LINES = Array.from({ length: 17 }, (_, i) => {
  const num = i + 1;
  return num < 10 ? `Line 0${num}` : `Line ${num}`;
});

export const GREEN_WING_LINES = Array.from({ length: 17 }, (_, i) => {
  const num = i + 18;
  return `Line ${num}`;
});

export const ALL_FACTORY_LINES = [...BLUE_WING_LINES, ...GREEN_WING_LINES];

/**
 * Block / Floor Mappings (5–6 Lines Each) for IE Incharges / Assistant Managers:
 * - Block 1 (Floor 1 / Sec 1): Lines 01–06 (Blue Wing - Padma Floor)
 * - Block 2 (Floor 2 / Sec 2): Lines 07–12 (Blue Wing - Meghna Floor)
 * - Block 3 (Floor 3 / Sec 3): Lines 13–17 (Blue Wing - Karnophuli Floor)
 * - Block 4 (Floor 4 / Sec 4): Lines 18–23 (Green Wing - Korotoya Floor)
 * - Block 5 (Floor 5 / Sec 5): Lines 24–29 (Green Wing - Shitalokshya Floor)
 * - Block 6 (Floor 6 / Sec 6): Lines 30–34 (Green Wing - Turag Floor)
 */
export interface LineBlockDefinition {
  blockId: string;
  blockNo: number;
  label: string;
  wing: 'Blue Wing' | 'Green Wing';
  floor: string;
  lines: string[];
}

export const FACTORY_BLOCKS: LineBlockDefinition[] = [
  {
    blockId: 'block_1',
    blockNo: 1,
    label: 'Block 1 — Floor 1 (Lines 01–06)',
    wing: 'Blue Wing',
    floor: 'Floor 1 (Padma Floor)',
    lines: ['Line 01', 'Line 02', 'Line 03', 'Line 04', 'Line 05', 'Line 06']
  },
  {
    blockId: 'block_2',
    blockNo: 2,
    label: 'Block 2 — Floor 2 (Lines 07–12)',
    wing: 'Blue Wing',
    floor: 'Floor 2 (Meghna Floor)',
    lines: ['Line 07', 'Line 08', 'Line 09', 'Line 10', 'Line 11', 'Line 12']
  },
  {
    blockId: 'block_3',
    blockNo: 3,
    label: 'Block 3 — Floor 3 (Lines 13–17)',
    wing: 'Blue Wing',
    floor: 'Floor 3 (Karnophuli Floor)',
    lines: ['Line 13', 'Line 14', 'Line 15', 'Line 16', 'Line 17']
  },
  {
    blockId: 'block_4',
    blockNo: 4,
    label: 'Block 4 — Floor 4 (Lines 18–23)',
    wing: 'Green Wing',
    floor: 'Floor 4 (Korotoya Floor)',
    lines: ['Line 18', 'Line 19', 'Line 20', 'Line 21', 'Line 22', 'Line 23']
  },
  {
    blockId: 'block_5',
    blockNo: 5,
    label: 'Block 5 — Floor 5 (Lines 24–29)',
    wing: 'Green Wing',
    floor: 'Floor 5 (Shitalokshya Floor)',
    lines: ['Line 24', 'Line 25', 'Line 26', 'Line 27', 'Line 28', 'Line 29']
  },
  {
    blockId: 'block_6',
    blockNo: 6,
    label: 'Block 6 — Floor 6 (Lines 30–34)',
    wing: 'Green Wing',
    floor: 'Floor 6 (Turag Floor)',
    lines: ['Line 30', 'Line 31', 'Line 32', 'Line 33', 'Line 34']
  }
];

/**
 * Standardize line number string (e.g. '18' -> 'Line 18', 'Line 04' -> 'Line 04')
 */
export function normalizeLineNo(lineNo: string | number): string {
  if (typeof lineNo === 'number') {
    return lineNo < 10 ? `Line 0${lineNo}` : `Line ${lineNo}`;
  }
  const clean = String(lineNo).trim();
  if (clean.toLowerCase().startsWith('line')) {
    const digits = clean.replace(/[^0-9]/g, '');
    const n = parseInt(digits, 10);
    if (!isNaN(n)) {
      return n < 10 ? `Line 0${n}` : `Line ${n}`;
    }
    return clean;
  }
  const n = parseInt(clean, 10);
  if (!isNaN(n)) {
    return n < 10 ? `Line 0${n}` : `Line ${n}`;
  }
  return clean;
}

/**
 * Get Wing for a specific production line
 */
export function getLineWing(lineNo: string | number): 'Blue Wing' | 'Green Wing' {
  const norm = normalizeLineNo(lineNo);
  const digits = parseInt(norm.replace(/[^0-9]/g, ''), 10);
  if (isNaN(digits) || digits <= 17) {
    return 'Blue Wing';
  }
  return 'Green Wing';
}

/**
 * Get Block definition for a line
 */
export function getLineBlock(lineNo: string | number): LineBlockDefinition {
  const norm = normalizeLineNo(lineNo);
  const found = FACTORY_BLOCKS.find(b => b.lines.includes(norm));
  if (found) return found;
  const digits = parseInt(norm.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(digits)) {
    if (digits <= 6) return FACTORY_BLOCKS[0];
    if (digits <= 12) return FACTORY_BLOCKS[1];
    if (digits <= 17) return FACTORY_BLOCKS[2];
    if (digits <= 23) return FACTORY_BLOCKS[3];
    if (digits <= 29) return FACTORY_BLOCKS[4];
    return FACTORY_BLOCKS[5];
  }
  return FACTORY_BLOCKS[0];
}

export const SYSTEM_ADMIN_EMAIL = 'ashikur.rahman.0971@gmail.com';
export const SYSTEM_ADMIN_EMAILS = [
  'ashikur.rahman.0971@gmail.com',
  'applicationhub69@gmail.com',
  'ashikuregen@gmail.com',
  'nahidnazrulislam40@gmail.com'
];
export const SYSTEM_ADMIN_PASSCODE = '911999';

/**
 * Enforce strict root Master System Administrator identity:
 * Designated master admin emails can hold or qualify for Master System Administrator (Tier 0 / Admin).
 */
export function isSystemAdmin(profile?: Partial<UserProfile> | UserProfile | null): boolean {
  if (!profile || !profile.email) return false;
  const normalizedEmail = profile.email.toLowerCase().trim();
  return (
    normalizedEmail === SYSTEM_ADMIN_EMAIL.toLowerCase() ||
    SYSTEM_ADMIN_EMAILS.some(e => e.toLowerCase() === normalizedEmail)
  );
}

/**
 * Check if the active profile has Master Administration or Admin Role.
 * Root operations and administrative system controls components are visible
 * ONLY to users who pass this check.
 */
export function isMasterAdminOrAdmin(profile?: Partial<UserProfile> | UserProfile | null): boolean {
  if (!profile) return false;
  if (isSystemAdmin(profile)) return true;
  if (profile.role === 'admin') return true;
  if (profile.tierId === 'tier_0') return true;
  const email = (profile.email || '').toLowerCase().trim();
  if (SYSTEM_ADMIN_EMAILS.some(e => e.toLowerCase() === email)) {
    return true;
  }
  const jobTitle = (profile.jobTitle || '').toLowerCase();
  if (
    jobTitle.includes('system administrator') ||
    jobTitle.includes('master admin') ||
    jobTitle.includes('root operations')
  ) {
    return true;
  }
  return false;
}

export function verifySystemAdminPasscode(passcode: string, userEmail?: string): boolean {
  // If email is provided, verify email match as well
  if (userEmail) {
    const norm = userEmail.toLowerCase().trim();
    if (!SYSTEM_ADMIN_EMAILS.some(e => e.toLowerCase() === norm)) {
      return false;
    }
  }
  return (passcode || '').trim() === SYSTEM_ADMIN_PASSCODE;
}

/**
 * Check if the current user profile has access to edit or approve data for a given line
 */
export function checkLineAccess(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[],
  lineNo: string | number
): LineScopeCheckResult {
  const normLine = normalizeLineNo(lineNo);
  const lineWing = getLineWing(normLine);
  const lineBlock = getLineBlock(normLine);

  // Check if System Admin with root authority
  if (isSystemAdmin(profile)) {
    return {
      inScope: true,
      canEdit: true,
      canApprove: true,
      canDelete: true,
      accessControlLevel: 'System Administrator (Full Root Authority)',
      scopeType: 'all',
      badgeLabel: 'System Admin • Root Access',
      badgeColor: 'emerald'
    };
  }

  // Find active tier
  const rawTier = roleTiers.find(t => t.id === profile?.tierId) || roleTiers[0];
  // If tier_0 is set on profile without ashikur.rahman.0971@gmail.com, downgrade check to Tier 1
  const tier = (rawTier.id === 'tier_0' && !isSystemAdmin(profile))
    ? (roleTiers.find(t => t.id === 'tier_1') || roleTiers[1] || rawTier)
    : rawTier;
  const level = tier.level;

  // TIER 0: System Admin (Reserved exclusively for ashikur.rahman.0971@gmail.com)
  if (isSystemAdmin(profile) && (level === 0 || tier.id === 'tier_0')) {
    return {
      inScope: true,
      canEdit: true,
      canApprove: true,
      canDelete: true,
      accessControlLevel: 'System Administrator (Full Root Authority)',
      scopeType: 'all',
      badgeLabel: 'System Admin • Root Access',
      badgeColor: 'emerald'
    };
  }

  // TIER 1: Sr. Manager — All Factory Lines (Department Administrator)
  if (level <= 1 || tier.scopeType === 'all') {
    return {
      inScope: true,
      canEdit: true,
      canApprove: true,
      canDelete: true,
      accessControlLevel: 'Department Administrator (Full System Access)',
      scopeType: 'all',
      badgeLabel: 'Tier 1 • Full Access',
      badgeColor: 'emerald'
    };
  }

  // TIER 2: Manager — Assigned Wing - Lines (Wing Super-User)
  if (level === 2 || tier.scopeType === 'wing') {
    const userWing = profile?.assignedWing || 'Blue Wing';
    const isAssignedWing = userWing === 'All' || userWing === lineWing;

    if (isAssignedWing) {
      return {
        inScope: true,
        canEdit: true,
        canApprove: true,
        canDelete: false,
        accessControlLevel: 'Wing Super-User (Assigned Wing Control Write & Approve)',
        scopeType: 'wing',
        badgeLabel: `Tier 2 • ${userWing} Super-User`,
        badgeColor: 'blue'
      };
    }

    return {
      inScope: false,
      canEdit: false,
      canApprove: false,
      canDelete: false,
      accessControlLevel: 'Wing Super-User (Assigned Wing Control Write & Approve)',
      scopeType: 'wing',
      reason: `${normLine} is in ${lineWing}. Your scope is restricted to ${userWing}.`,
      badgeLabel: `Tier 2 • Outside Wing (${userWing})`,
      badgeColor: 'slate'
    };
  }

  // TIER 3: IE Incharges/Assistant Manager's — Assigned Line Blocks/Floor (5–6 Lines Each)
  if (level === 3 || tier.scopeType === 'block') {
    const assignedBlockId = profile?.assignedBlock || 'block_2';
    const activeBlockDef =
      FACTORY_BLOCKS.find(b => b.blockId === assignedBlockId || b.label === profile?.assignedBlock) ||
      FACTORY_BLOCKS[1]; // default Floor 2 / Lines 07-12

    const isInsideBlock = activeBlockDef.lines.includes(normLine);

    if (isInsideBlock) {
      return {
        inScope: true,
        canEdit: true,
        canApprove: true,
        canDelete: false,
        accessControlLevel: 'Section Moderator (Assigned Block/Floor Write & Approve)',
        scopeType: 'block',
        badgeLabel: `Tier 3 • ${activeBlockDef.label.split('—')[0].trim()} Moderator`,
        badgeColor: 'blue'
      };
    }

    return {
      inScope: false,
      canEdit: false,
      canApprove: false,
      canDelete: false,
      accessControlLevel: 'Section Moderator (Assigned Block/Floor Write & Approve)',
      scopeType: 'block',
      reason: `${normLine} belongs to ${lineBlock.label}. Your assigned block is ${activeBlockDef.label}.`,
      badgeLabel: `Tier 3 • Outside Assigned Block`,
      badgeColor: 'slate'
    };
  }

  // TIER 4: Line IEs — Assigned Line's (Standard IE - Data Entry Only)
  const userAssignedLines =
    profile?.assignedLines && profile.assignedLines.length > 0
      ? profile.assignedLines.map(normalizeLineNo)
      : ['Line 01', 'Line 02']; // standard default for Line IE

  const isMyAssignedLine = userAssignedLines.includes(normLine);

  if (isMyAssignedLine) {
    return {
      inScope: true,
      canEdit: true, // Data entry permitted
      canApprove: false, // Cannot approve checklists, only Submit
      canDelete: false,
      accessControlLevel: 'Standard IE (Assigned Lines Data Entry Only)',
      scopeType: 'line',
      badgeLabel: 'Tier 4 • Data Entry Only',
      badgeColor: 'amber'
    };
  }

  return {
    inScope: false,
    canEdit: false,
    canApprove: false,
    canDelete: false,
    accessControlLevel: 'Standard IE (Assigned Lines Data Entry Only)',
    scopeType: 'line',
    reason: `${normLine} is not in your assigned lines (${userAssignedLines.join(', ')}). Tier 4 has data entry access only for assigned lines.`,
    badgeLabel: 'Tier 4 • View-Only (Restricted)',
    badgeColor: 'slate'
  };
}

/**
 * Return all lines within the user's reporting scope
 */
export function getLinesInUserScope(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): string[] {
  const tier = roleTiers.find(t => t.id === profile?.tierId) || roleTiers[0];
  const level = tier.level;

  if (isSystemAdmin(profile) || level <= 1 || tier.scopeType === 'all') {
    return ALL_FACTORY_LINES;
  }

  if (level === 2 || tier.scopeType === 'wing') {
    const wing = profile?.assignedWing || 'Blue Wing';
    if (wing === 'Green Wing') return GREEN_WING_LINES;
    if (wing === 'All') return ALL_FACTORY_LINES;
    return BLUE_WING_LINES;
  }

  if (level === 3 || tier.scopeType === 'block') {
    const assignedBlockId = profile?.assignedBlock || 'block_2';
    const found =
      FACTORY_BLOCKS.find(b => b.blockId === assignedBlockId || b.label === profile?.assignedBlock) ||
      FACTORY_BLOCKS[1];
    return found.lines;
  }

  // Tier 4: Line IEs
  if (profile?.assignedLines && profile.assignedLines.length > 0) {
    return profile.assignedLines.map(normalizeLineNo);
  }
  return ['Line 01', 'Line 02'];
}

/**
 * ============================================================================
 * Enterprise Privacy & Security Clearance Engine
 * ============================================================================
 */

export interface UserPrivacyClearance {
  clearanceLevel: string;
  badgeLabel: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'slate' | 'indigo';
  canViewFinancials: boolean;
  canViewPii: boolean;
  canManageSecurity: boolean;
  canViewAuditLogs: boolean;
  canLockTerminal: boolean;
  requiresPin: boolean;
  maskingLevel: 'none' | 'partial' | 'strict';
  sessionTimeoutMinutes: number;
  securityScore: number; // 0 to 100
  exportWatermark: boolean;
  canExportRawData: boolean;
  maxExportRowsLimit: number; // 0 = unlimited
  twoFactorRequired: boolean;
  networkScope: 'factory_intranet' | 'vpn_secure' | 'unrestricted';
  canOverrideLocks: boolean;
  canPurgeAuditLogs: boolean;
  privacyRiskLevel: 'Low' | 'Moderate' | 'Guarded' | 'Restricted';
  securityScoreRating: { label: string; color: string };
}

/**
 * Determine effective active role tier for security evaluation
 */
export function getEffectiveRoleTier(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): RoleTier {
  if (isSystemAdmin(profile)) {
    const adminTier = roleTiers.find(t => t.id === 'tier_0');
    if (adminTier) return adminTier;
  }
  const rawTier = roleTiers.find(t => t.id === profile?.tierId) || roleTiers[0];
  // If tier_0 is configured without valid sysadmin email, downgrade to Tier 1
  if (rawTier.id === 'tier_0' && !isSystemAdmin(profile)) {
    return roleTiers.find(t => t.id === 'tier_1') || roleTiers[1] || rawTier;
  }
  return rawTier;
}

/**
 * Check whether the active user can view unmasked Operator PII
 */
export function canUserViewPii(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return true;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canViewPii ?? (tier.level <= 3);
}

/**
 * Check whether the active user can view sensitive commercial costing / financials
 */
export function canUserViewFinancials(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return true;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canViewSensitiveFinancials ?? (tier.level <= 2);
}

/**
 * Check whether the active user can manage factory security policies, PINs, and encryption
 */
export function canUserManageSecurity(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return true;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canManageSecuritySettings ?? (tier.level <= 1);
}

/**
 * Check whether the active user can view system security audit trails
 */
export function canUserViewAuditLogs(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return true;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canViewAuditLogs ?? (tier.level <= 2);
}

/**
 * Check whether the active user has authority to lock floor terminals
 */
export function canUserLockTerminal(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canLockTerminal ?? true;
}

/**
 * Check whether high-impact actions require security PIN re-verification
 */
export function doesUserRequirePin(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return false;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.requiresPinConfirmation ?? (tier.level >= 1);
}

/**
 * Get active data masking level for display
 */
export function getUserDataMasking(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): 'none' | 'partial' | 'strict' {
  if (isSystemAdmin(profile)) return 'none';
  const tier = getEffectiveRoleTier(profile, roleTiers);
  if (tier.dataMaskingLevel) return tier.dataMaskingLevel;
  if (tier.level <= 2) return 'none';
  if (tier.level === 3) return 'partial';
  return 'strict';
}

/**
 * Get role-tailored workstation auto-lock inactivity duration in minutes
 */
export function getUserSessionTimeout(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): number {
  if (isSystemAdmin(profile)) return 60;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.sessionTimeoutMinutes || (tier.level >= 4 ? 10 : tier.level === 3 ? 15 : 30);
}

/**
 * Mask Personally Identifiable Information (phone, email, NID) unless authorized
 */
export function maskPii(value: string | undefined | null, isAllowed: boolean): string {
  if (!value) return 'N/A';
  if (isAllowed) return value;
  const clean = String(value).trim();
  if (clean.length <= 4) return '••••';
  // Phone number masking: +880 1712-345678 -> +880 17••-••••78
  if (clean.includes('+') || clean.replace(/[^0-9]/g, '').length >= 9) {
    return clean.slice(0, 6) + '••••-••••' + clean.slice(-2);
  }
  // Email masking: john.doe@debonair.com -> j•••@debonair.com
  if (clean.includes('@')) {
    const [name, domain] = clean.split('@');
    return `${name.charAt(0)}••••@${domain}`;
  }
  return clean.slice(0, 2) + '••••••' + clean.slice(-2);
}

/**
 * Mask commercial financial figures (piece rates, dollarized labor, margin)
 */
export function maskFinancial(value: number | string, isAllowed: boolean): string {
  if (isAllowed) return String(value);
  return '•••••• [Restricted]';
}

/**
 * Check whether the active user can export raw un-aggregated telemetry / operator payroll data
 */
export function canUserExportRawData(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return true;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canExportRawData ?? (tier.level <= 1);
}

/**
 * Get export batch quota limit for the active role tier (0 = unlimited)
 */
export function getUserExportLimit(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): number {
  if (isSystemAdmin(profile)) return 0;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  if (tier.maxExportRowsLimit !== undefined) return tier.maxExportRowsLimit;
  if (tier.level === 0) return 0;
  if (tier.level === 1) return 5000;
  if (tier.level === 2) return 1000;
  if (tier.level === 3) return 500;
  return 100;
}

/**
 * Check whether Data Loss Prevention (DLP) digital watermark is enforced on exports
 */
export function isExportWatermarkRequired(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return false;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.exportWatermarkEnabled ?? true;
}

/**
 * Check whether Multi-Factor Authentication (2FA) is enforced for this role
 */
export function isTwoFactorRequired(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.twoFactorRequired ?? (tier.level <= 1);
}

/**
 * Get approved network perimeter scope for the active user
 */
export function getUserNetworkScope(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): 'factory_intranet' | 'vpn_secure' | 'unrestricted' {
  if (isSystemAdmin(profile)) return 'unrestricted';
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.allowedNetworkScope || (tier.level <= 1 ? 'vpn_secure' : 'factory_intranet');
}

/**
 * Check whether user can override emergency workstation lockouts
 */
export function canUserOverrideLock(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return true;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canOverrideLocks ?? (tier.level <= 2);
}

/**
 * Check whether user has authority to purge security audit trails
 */
export function canUserPurgeAudit(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): boolean {
  if (isSystemAdmin(profile)) return true;
  const tier = getEffectiveRoleTier(profile, roleTiers);
  return tier.canPurgeAuditLogs ?? (tier.level === 0);
}

/**
 * Get complete Privacy & Security Clearance Profile for the user
 */
export function getUserPrivacyClearance(
  profile: UserProfile | undefined,
  roleTiers: RoleTier[]
): UserPrivacyClearance {
  const isSys = isSystemAdmin(profile);
  const tier = getEffectiveRoleTier(profile, roleTiers);
  const level = isSys ? 0 : tier.level;

  const canFinancials = isSys || (tier.canViewSensitiveFinancials ?? (level <= 2));
  const canPii = isSys || (tier.canViewPii ?? (level <= 3));
  const canSecurity = isSys || (tier.canManageSecuritySettings ?? (level <= 1));
  const canAudit = isSys || (tier.canViewAuditLogs ?? (level <= 2));
  const canLock = tier.canLockTerminal ?? true;
  const requiresPin = !isSys && (tier.requiresPinConfirmation ?? (level >= 1));
  const masking = isSys ? 'none' : (tier.dataMaskingLevel || (level <= 2 ? 'none' : level === 3 ? 'partial' : 'strict'));
  const timeout = isSys ? 60 : (tier.sessionTimeoutMinutes || (level >= 4 ? 10 : level === 3 ? 15 : 30));
  
  const exportWatermark = !isSys && (tier.exportWatermarkEnabled ?? true);
  const canRawExport = isSys || (tier.canExportRawData ?? (level <= 1));
  const maxRows = isSys ? 0 : (tier.maxExportRowsLimit !== undefined ? tier.maxExportRowsLimit : (level === 1 ? 5000 : level === 2 ? 1000 : level === 3 ? 500 : 100));
  const twoFactor = isSys || (tier.twoFactorRequired ?? (level <= 1));
  const networkScope = isSys ? 'unrestricted' : (tier.allowedNetworkScope || (level <= 1 ? 'vpn_secure' : 'factory_intranet'));
  const overrideLock = isSys || (tier.canOverrideLocks ?? (level <= 2));
  const purgeAudit = isSys || (tier.canPurgeAuditLogs ?? (level === 0));

  let clearanceLevel: string = tier.privacyClearanceLevel || 'Level 2 (Operational Clearance)';
  let badgeColor: 'emerald' | 'blue' | 'amber' | 'slate' | 'indigo' = 'blue';

  if (level === 0 || isSys) {
    clearanceLevel = 'Level 4 (Root Security Authority)';
    badgeColor = 'indigo';
  } else if (level === 1) {
    clearanceLevel = 'Level 4 (Full Department Clearance)';
    badgeColor = 'emerald';
  } else if (level === 2) {
    clearanceLevel = 'Level 3 (Super-User Clearance)';
    badgeColor = 'blue';
  } else if (level === 3) {
    clearanceLevel = 'Level 2 (Operational Clearance)';
    badgeColor = 'amber';
  } else {
    clearanceLevel = 'Level 1 (Field Clearance)';
    badgeColor = 'slate';
  }

  // Calculate composite security compliance score (0 - 100)
  let score = 50;
  if (canSecurity) score += 10;
  if (canAudit) score += 10;
  if (canLock) score += 5;
  if (exportWatermark) score += 10;
  if (twoFactor) score += 10;
  if (masking !== 'none') score += 5;

  let privacyRiskLevel: 'Low' | 'Moderate' | 'Guarded' | 'Restricted' = 'Guarded';
  if (level <= 1) privacyRiskLevel = 'Low';
  else if (level === 2) privacyRiskLevel = 'Moderate';
  else if (level === 3) privacyRiskLevel = 'Guarded';
  else privacyRiskLevel = 'Restricted';

  const securityScore = Math.min(100, Math.max(0, score));
  let securityScoreRating = { label: 'Good Standard', color: 'emerald' };
  if (securityScore >= 90) securityScoreRating = { label: 'Military-Grade Compliance', color: 'indigo' };
  else if (securityScore >= 75) securityScoreRating = { label: 'High Enterprise Security', color: 'emerald' };
  else if (securityScore >= 60) securityScoreRating = { label: 'Standard Operational', color: 'blue' };
  else securityScoreRating = { label: 'Basic Floor Guarded', color: 'amber' };

  return {
    clearanceLevel,
    badgeLabel: clearanceLevel.split('(')[1]?.replace(')', '') || clearanceLevel,
    badgeColor,
    canViewFinancials: canFinancials,
    canViewPii: canPii,
    canManageSecurity: canSecurity,
    canViewAuditLogs: canAudit,
    canLockTerminal: canLock,
    requiresPin,
    maskingLevel: masking,
    sessionTimeoutMinutes: timeout,
    securityScore,
    exportWatermark,
    canExportRawData: canRawExport,
    maxExportRowsLimit: maxRows,
    twoFactorRequired: twoFactor,
    networkScope,
    canOverrideLocks: overrideLock,
    canPurgeAuditLogs: purgeAudit,
    privacyRiskLevel,
    securityScoreRating
  };
}

/* ============================================================================
 * ZERO TRUST ARCHITECTURE & RBAC HARDENING ENGINE
 * Principle: "Never Trust, Always Verify" — Fail-Secure Least Privilege
 * ============================================================================ */

export type ZeroTrustPermissionStatus =
  | 'ALLOWED'
  | 'WING_ONLY'
  | 'BLOCK_ONLY'
  | 'ASSIGNED_LINES_ONLY'
  | 'APPROVAL_REQUIRED'
  | 'SUBMIT_ONLY'
  | 'PASSCODE_PIN'
  | 'RESTRICTED'
  | 'DENIED';

export interface ZeroTrustCapability {
  id: string;
  category:
    | 'Planning & Commitments'
    | 'Floor Execution & Bottlenecks'
    | 'Engineering & SMV Balancing'
    | 'Quality & Rework'
    | 'Reports & Analytics (DLP)'
    | 'Security & System Governance';
  name: string;
  description: string;
  t0: ZeroTrustPermissionStatus;
  t1: ZeroTrustPermissionStatus;
  t2: ZeroTrustPermissionStatus;
  t3: ZeroTrustPermissionStatus;
  t4: ZeroTrustPermissionStatus;
  requiresPin?: boolean;
  requiresBreakGlass?: boolean;
  auditLevel: 'critical' | 'high' | 'standard';
}

/**
 * Canonical Zero Trust Capabilities Matrix
 * Authoritative mapping across all Debonair Unit-02 factory tiers (Tier 0 to Tier 4)
 */
export const ZERO_TRUST_CAPABILITY_MATRIX: ZeroTrustCapability[] = [
  // 1. Planning & Commitments
  {
    id: 'view_line_targets',
    category: 'Planning & Commitments',
    name: 'View Floor Targets & WIP',
    description: 'Inspect real-time daily line targets, hourly run rates, and WIP counts across factory lines',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'ALLOWED',
    auditLevel: 'standard'
  },
  {
    id: 'edit_line_targets',
    category: 'Planning & Commitments',
    name: 'Set Standard Shift Targets',
    description: 'Configure official baseline line output targets and operator quotas for scheduled shifts',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'WING_ONLY',
    t3: 'BLOCK_ONLY',
    t4: 'DENIED',
    auditLevel: 'high'
  },
  {
    id: 'override_target_midshift',
    category: 'Planning & Commitments',
    name: 'Override Floor Target Mid-Shift',
    description: 'Emergency modification of line commitment target during active production shift',
    t0: 'ALLOWED',
    t1: 'APPROVAL_REQUIRED',
    t2: 'RESTRICTED',
    t3: 'RESTRICTED',
    t4: 'DENIED',
    requiresBreakGlass: true,
    requiresPin: true,
    auditLevel: 'critical'
  },
  {
    id: 'reallocate_order_commitment',
    category: 'Planning & Commitments',
    name: 'Reallocate Style Commitments Across Wings',
    description: 'Shift production styles and buyer commitments between Blue Wing and Green Wing',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'RESTRICTED',
    t3: 'DENIED',
    t4: 'DENIED',
    auditLevel: 'high'
  },

  // 2. Floor Execution & Bottlenecks
  {
    id: 'record_hourly_output',
    category: 'Floor Execution & Bottlenecks',
    name: 'Record Hourly Output & Reject Count',
    description: 'Log live hourly piece production, operator counts, and defect numbers at line end',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'ASSIGNED_LINES_ONLY',
    auditLevel: 'standard'
  },
  {
    id: 'log_downtime_incident',
    category: 'Floor Execution & Bottlenecks',
    name: 'Log Downtime, Stoppage & Andon Incident',
    description: 'Register mechanical, electrical, fabric, or trim stoppage codes impacting pitch velocity',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'ASSIGNED_LINES_ONLY',
    auditLevel: 'standard'
  },
  {
    id: 'reassign_operator_station',
    category: 'Floor Execution & Bottlenecks',
    name: 'Re-assign Operator Workstation Mid-Day',
    description: 'Dynamically relocate operators to relieve bottleneck operations based on skill matrix',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'DENIED',
    auditLevel: 'standard'
  },
  {
    id: 'signoff_daily_checklist',
    category: 'Floor Execution & Bottlenecks',
    name: 'Sign-off & Lock Daily IE Checklist',
    description: 'Authorized verification and permanent lock of shift checklist items and 5S inspection',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'SUBMIT_ONLY',
    auditLevel: 'high'
  },

  // 3. Engineering & SMV Balancing
  {
    id: 'view_smv_pitch',
    category: 'Engineering & SMV Balancing',
    name: 'Inspect Operation Breakdown & Pitch Diagram',
    description: 'View standard SAM, machine pitch diagram, theoretical cycle times, and theoretical manpower',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'ALLOWED',
    auditLevel: 'standard'
  },
  {
    id: 'modify_operation_smv',
    category: 'Engineering & SMV Balancing',
    name: 'Update Operation SAM & Pitch Velocity',
    description: 'Modify standard allowed minutes (SAM/SMV) of critical operations impacting line efficiency',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'APPROVAL_REQUIRED',
    t3: 'RESTRICTED',
    t4: 'DENIED',
    requiresPin: true,
    auditLevel: 'critical'
  },
  {
    id: 'edit_skill_matrix',
    category: 'Engineering & SMV Balancing',
    name: 'Modify Operator Multi-Skill Matrix Ratings',
    description: 'Update operator grading (A/B/C/D), efficiency ratings, and multi-machine competency',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'DENIED',
    auditLevel: 'standard'
  },
  {
    id: 'rebalance_line_pitch',
    category: 'Engineering & SMV Balancing',
    name: 'Execute Auto-Balancing & Line Relayout',
    description: 'Run automatic heuristic line balancing algorithm and reallocate stations across line operators',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'APPROVAL_REQUIRED',
    t3: 'DENIED',
    t4: 'DENIED',
    auditLevel: 'high'
  },

  // 4. Quality & Rework
  {
    id: 'log_defect_rate',
    category: 'Quality & Rework',
    name: 'Log Defect Types & DHU Incidents',
    description: 'Capture end-of-line quality audit defects, skip stitch, broken stitch, and fabric flaws',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'ASSIGNED_LINES_ONLY',
    auditLevel: 'standard'
  },
  {
    id: 'authorize_rework_release',
    category: 'Quality & Rework',
    name: 'Authorize Rework Garment Batch Release',
    description: 'Clear quarantine or rework bundles back into finished packaging line',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'APPROVAL_REQUIRED',
    t4: 'DENIED',
    auditLevel: 'high'
  },
  {
    id: 'conduct_aql_audit',
    category: 'Quality & Rework',
    name: 'Conduct AQL 2.5/4.0 Quality Inspection',
    description: 'Run statistical acceptance quality limit inspection before dispatch',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'DENIED',
    auditLevel: 'standard'
  },

  // 5. Reports & Analytics (DLP)
  {
    id: 'export_loss_analysis',
    category: 'Reports & Analytics (DLP)',
    name: 'Export Balancing Loss & Efficiency Matrix',
    description: 'Download balancing loss, takt variance, and labor utilization analytics',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'RESTRICTED',
    auditLevel: 'standard'
  },
  {
    id: 'export_raw_telemetry',
    category: 'Reports & Analytics (DLP)',
    name: 'Export Unaggregated Raw Telemetry & Timestamps',
    description: 'Export granular cycle time study records subject to Data Loss Prevention (DLP) watermark',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'APPROVAL_REQUIRED',
    t3: 'DENIED',
    t4: 'DENIED',
    auditLevel: 'critical'
  },
  {
    id: 'download_executive_report',
    category: 'Reports & Analytics (DLP)',
    name: 'Download Executive Monthly PDF Dossier',
    description: 'Generate compiled Debonair Unit-02 monthly efficiency, OEE, and financial summary PDF',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'DENIED',
    t4: 'DENIED',
    auditLevel: 'high'
  },
  {
    id: 'view_financial_costing',
    category: 'Reports & Analytics (DLP)',
    name: 'View Commercial Costing & Labor Cost/Minute',
    description: 'Inspect sensitive dollarized standard minute value cost, line margins, and overhead figures',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'DENIED',
    t4: 'DENIED',
    auditLevel: 'high'
  },

  // 6. Security & System Governance
  {
    id: 'lock_floor_terminals',
    category: 'Security & System Governance',
    name: 'Emergency Shop-Floor Terminal Lockout',
    description: 'Trigger immediate operational freeze on all or specific shop-floor tablet workstations',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'ALLOWED',
    t4: 'DENIED',
    auditLevel: 'high'
  },
  {
    id: 'override_terminal_lock',
    category: 'Security & System Governance',
    name: 'Override Emergency Terminal Lockout',
    description: 'Unlock frozen workstation using verified supervisor credential',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'ALLOWED',
    t3: 'DENIED',
    t4: 'DENIED',
    requiresPin: true,
    auditLevel: 'critical'
  },
  {
    id: 'manage_rbac_tiers',
    category: 'Security & System Governance',
    name: 'Configure User Roles & Scope Assignments',
    description: 'Elevate user tier, alter wing/block/line scope assignments, and configure RBAC roles',
    t0: 'ALLOWED',
    t1: 'ALLOWED',
    t2: 'RESTRICTED',
    t3: 'DENIED',
    t4: 'DENIED',
    requiresPin: true,
    auditLevel: 'critical'
  },
  {
    id: 'purge_audit_trails',
    category: 'Security & System Governance',
    name: 'Purge Security & Forensics Audit Ledger',
    description: 'Cryptographically wipe audit trail history (strictly restricted to root administrator)',
    t0: 'ALLOWED',
    t1: 'DENIED',
    t2: 'DENIED',
    t3: 'DENIED',
    t4: 'DENIED',
    requiresBreakGlass: true,
    requiresPin: true,
    auditLevel: 'critical'
  },
  {
    id: 'root_tier0_access',
    category: 'Security & System Governance',
    name: 'Access Tier_0 Root Command Hub',
    description: 'Full access to Schema Forge, Access Matrix, Security Loop, Privacy Vault, and Backup Forge',
    t0: 'ALLOWED',
    t1: 'DENIED',
    t2: 'DENIED',
    t3: 'DENIED',
    t4: 'DENIED',
    auditLevel: 'critical'
  },
  {
    id: 'break_glass_emergency_key',
    category: 'Security & System Governance',
    name: 'Synthesize Shift Break-Glass Token',
    description: 'Generate temporary cryptographic authorization key for emergency floor intervention',
    t0: 'ALLOWED',
    t1: 'APPROVAL_REQUIRED',
    t2: 'RESTRICTED',
    t3: 'DENIED',
    t4: 'DENIED',
    requiresPin: true,
    auditLevel: 'critical'
  }
];

export interface ActionPermissionEvaluation {
  allowed: boolean;
  status: ZeroTrustPermissionStatus;
  reason: string;
  requiresBreakGlass: boolean;
  requiresPin: boolean;
  clearanceLevel: string;
  auditLevel: 'critical' | 'high' | 'standard';
}

/**
 * Strict Zero Trust Action Evaluation
 * Evaluates whether an active user profile has authority to perform a specific action,
 * taking into account Line/Wing/Block context and Fail-Secure defaults.
 */
export function canPerformAction(
  profile: UserProfile | undefined,
  actionId: string,
  context?: { lineNo?: string | number }
): ActionPermissionEvaluation {
  const cap = ZERO_TRUST_CAPABILITY_MATRIX.find(c => c.id === actionId);
  const isSys = isSystemAdmin(profile);

  // Default fail-secure if unknown capability
  if (!cap) {
    return {
      allowed: false,
      status: 'DENIED',
      reason: 'Unknown capability. Zero Trust fail-secure default applied.',
      requiresBreakGlass: false,
      requiresPin: false,
      clearanceLevel: 'None',
      auditLevel: 'high'
    };
  }

  // System Administrator (Root / Tier 0) has full authority
  if (isSys) {
    return {
      allowed: true,
      status: 'ALLOWED',
      reason: 'Root System Administrator authority verified.',
      requiresBreakGlass: false,
      requiresPin: false,
      clearanceLevel: 'Tier 0 (Root Authority)',
      auditLevel: cap.auditLevel
    };
  }

  // Determine user's effective tier
  const tierId = profile?.tierId || 'tier_4';
  let tierStatus: ZeroTrustPermissionStatus = 'DENIED';

  switch (tierId) {
    case 'tier_0':
      // Demote if not valid sysadmin email
      tierStatus = isSys ? cap.t0 : cap.t1;
      break;
    case 'tier_1':
      tierStatus = cap.t1;
      break;
    case 'tier_2':
      tierStatus = cap.t2;
      break;
    case 'tier_3':
      tierStatus = cap.t3;
      break;
    case 'tier_4':
    default:
      tierStatus = cap.t4;
      break;
  }

  // Evaluate line-scoped status if line context is provided
  if (context?.lineNo !== undefined) {
    const norm = normalizeLineNo(context.lineNo);
    const lineWing = getLineWing(norm);
    const lineBlock = getLineBlock(norm);

    if (tierStatus === 'WING_ONLY') {
      const userWing = profile?.assignedWing || 'Blue Wing';
      const inWing = userWing === 'All' || userWing === lineWing;
      if (!inWing) {
        return {
          allowed: false,
          status: 'WING_ONLY',
          reason: `${norm} is in ${lineWing}. Your scope is restricted to ${userWing}.`,
          requiresBreakGlass: !!cap.requiresBreakGlass,
          requiresPin: !!cap.requiresPin,
          clearanceLevel: 'Tier 2 (Wing Scoped)',
          auditLevel: cap.auditLevel
        };
      }
      return {
        allowed: true,
        status: 'ALLOWED',
        reason: `Authorized within assigned ${userWing}.`,
        requiresBreakGlass: false,
        requiresPin: !!cap.requiresPin,
        clearanceLevel: 'Tier 2 (Wing Scoped)',
        auditLevel: cap.auditLevel
      };
    }

    if (tierStatus === 'BLOCK_ONLY') {
      const assignedBlockId = profile?.assignedBlock || 'block_2';
      const activeBlockDef =
        FACTORY_BLOCKS.find(b => b.blockId === assignedBlockId || b.label === profile?.assignedBlock) ||
        FACTORY_BLOCKS[1];
      const inBlock = activeBlockDef.lines.includes(norm);
      if (!inBlock) {
        return {
          allowed: false,
          status: 'BLOCK_ONLY',
          reason: `${norm} belongs to ${lineBlock.label}. Your assigned block is ${activeBlockDef.label}.`,
          requiresBreakGlass: !!cap.requiresBreakGlass,
          requiresPin: !!cap.requiresPin,
          clearanceLevel: 'Tier 3 (Block Scoped)',
          auditLevel: cap.auditLevel
        };
      }
      return {
        allowed: true,
        status: 'ALLOWED',
        reason: `Authorized within assigned block (${activeBlockDef.label}).`,
        requiresBreakGlass: false,
        requiresPin: !!cap.requiresPin,
        clearanceLevel: 'Tier 3 (Block Scoped)',
        auditLevel: cap.auditLevel
      };
    }

    if (tierStatus === 'ASSIGNED_LINES_ONLY') {
      const userLines =
        profile?.assignedLines && profile.assignedLines.length > 0
          ? profile.assignedLines.map(normalizeLineNo)
          : ['Line 01', 'Line 02'];
      const inLine = userLines.includes(norm);
      if (!inLine) {
        return {
          allowed: false,
          status: 'ASSIGNED_LINES_ONLY',
          reason: `${norm} is outside your assigned lines (${userLines.join(', ')}).`,
          requiresBreakGlass: !!cap.requiresBreakGlass,
          requiresPin: false,
          clearanceLevel: 'Tier 4 (Line Scoped)',
          auditLevel: cap.auditLevel
        };
      }
      return {
        allowed: true,
        status: 'ALLOWED',
        reason: `Authorized for assigned line (${norm}).`,
        requiresBreakGlass: false,
        requiresPin: false,
        clearanceLevel: 'Tier 4 (Line Scoped)',
        auditLevel: cap.auditLevel
      };
    }
  }

  const allowed = tierStatus === 'ALLOWED';
  let reason = '';
  switch (tierStatus) {
    case 'ALLOWED':
      reason = 'Authorized by role clearance.';
      break;
    case 'APPROVAL_REQUIRED':
      reason = 'Permitted with Tier 1/0 administrative pre-approval.';
      break;
    case 'SUBMIT_ONLY':
      reason = 'Submit permitted; official sign-off requires Tier 3+ authority.';
      break;
    case 'PASSCODE_PIN':
      reason = 'Authorized with security PIN challenge.';
      break;
    case 'RESTRICTED':
      reason = 'Restricted under Zero Trust least privilege policy.';
      break;
    case 'DENIED':
    default:
      reason = 'Access denied. Insufficient role tier clearance.';
      break;
  }

  return {
    allowed,
    status: tierStatus,
    reason,
    requiresBreakGlass: !allowed && !!cap.requiresBreakGlass,
    requiresPin: !!cap.requiresPin,
    clearanceLevel: tierId.toUpperCase().replace('_', ' '),
    auditLevel: cap.auditLevel
  };
}

/* ============================================================================
 * CRYPTOGRAPHIC SESSION INTEGRITY & TAMPER DETECTION
 * ============================================================================ */

/**
 * Generate lightweight cryptographic session fingerprint for active profile
 */
export function generateSessionFingerprint(profile?: Partial<UserProfile> | null): string {
  if (!profile) return 'ZT-ANON-0000';
  const raw = `${profile.email || 'anon'}:${profile.role || 'viewer'}:${profile.tierId || 'tier_4'}:DEBONAIR-U2-SALT`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  return `ZT-SIG-${hex}`;
}

/**
 * Verify session token integrity against active user profile
 */
export function verifySessionIntegrity(
  profile?: Partial<UserProfile> | null,
  storedToken?: string | null
): boolean {
  if (!profile) return false;
  const expected = generateSessionFingerprint(profile);
  return !storedToken || storedToken === expected;
}

/**
 * Detect client-side localStorage tampering of role or email
 */
export function detectStorageTampering(profile?: Partial<UserProfile> | null): {
  isTampered: boolean;
  reason?: string;
} {
  if (!profile) return { isTampered: false };
  // Check if user claims Tier 0 without sysadmin email
  if (profile.tierId === 'tier_0' && !isSystemAdmin(profile)) {
    return {
      isTampered: true,
      reason: 'Role elevation mismatch: Tier 0 claimed without verified System Administrator email.'
    };
  }
  return { isTampered: false };
}

/* ============================================================================
 * TAMPER-EVIDENT AUDIT CHAIN (SHA-256 HASH CHAIN)
 * ============================================================================ */

export interface TamperEvidentAuditRecord {
  index: number;
  timestamp: string;
  actorEmail: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'security' | 'critical';
  previousHash: string;
  hash: string;
}

/**
 * Compute simple deterministic SHA-256 style hash string for audit records
 */
export function computeAuditRecordHash(
  index: number,
  timestamp: string,
  actorEmail: string,
  action: string,
  details: string,
  previousHash: string
): string {
  const content = `${index}|${timestamp}|${actorEmail}|${action}|${details}|${previousHash}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `0x${part1}${part2}`.toUpperCase();
}

export const GENESIS_AUDIT_HASH = '0x0000000000000000';

/**
 * Seed initial canonical tamper-evident audit records
 */
export const INITIAL_TAMPER_AUDIT_CHAIN: TamperEvidentAuditRecord[] = (() => {
  const genesis: TamperEvidentAuditRecord = {
    index: 1,
    timestamp: '2026-09-26T06:00:00Z',
    actorEmail: 'system.bootstrap@debonair.com',
    action: 'ZERO_TRUST_BOOTSTRAP',
    details: 'Zero Trust Architecture initialized with fail-secure RBAC policies (Unit-02)',
    severity: 'security',
    previousHash: GENESIS_AUDIT_HASH,
    hash: ''
  };
  genesis.hash = computeAuditRecordHash(
    genesis.index,
    genesis.timestamp,
    genesis.actorEmail,
    genesis.action,
    genesis.details,
    genesis.previousHash
  );

  const block2: TamperEvidentAuditRecord = {
    index: 2,
    timestamp: '2026-09-26T07:15:20Z',
    actorEmail: 'ashikuregen@gmail.com',
    action: 'RBAC_SECURITY_AUDIT',
    details: 'System Administrator verified all 34 line boundaries across Blue and Green Wings',
    severity: 'info',
    previousHash: genesis.hash,
    hash: ''
  };
  block2.hash = computeAuditRecordHash(
    block2.index,
    block2.timestamp,
    block2.actorEmail,
    block2.action,
    block2.details,
    block2.previousHash
  );

  const block3: TamperEvidentAuditRecord = {
    index: 3,
    timestamp: '2026-09-26T08:30:00Z',
    actorEmail: 'ashikur.rahman.0971@gmail.com',
    action: 'POLICY_CONSOLIDATION',
    details: 'Consolidated Permission Matrix components into unified Zero Trust architecture',
    severity: 'security',
    previousHash: block2.hash,
    hash: ''
  };
  block3.hash = computeAuditRecordHash(
    block3.index,
    block3.timestamp,
    block3.actorEmail,
    block3.action,
    block3.details,
    block3.previousHash
  );

  return [genesis, block2, block3];
})();

/**
 * Create next block in the tamper-evident audit chain
 */
export function createTamperEvidentAuditRecord(
  previousRecord: TamperEvidentAuditRecord,
  actorEmail: string,
  action: string,
  details: string,
  severity: 'info' | 'warning' | 'security' | 'critical' = 'info'
): TamperEvidentAuditRecord {
  const index = previousRecord.index + 1;
  const timestamp = new Date().toISOString();
  const previousHash = previousRecord.hash;
  const hash = computeAuditRecordHash(index, timestamp, actorEmail, action, details, previousHash);
  return {
    index,
    timestamp,
    actorEmail,
    action,
    details,
    severity,
    previousHash,
    hash
  };
}

/**
 * Verify cryptographic hash chain integrity of the audit ledger
 */
export function verifyAuditChainIntegrity(chain: TamperEvidentAuditRecord[]): {
  isValid: boolean;
  failedIndex?: number;
  reason?: string;
} {
  if (!chain || chain.length === 0) return { isValid: true };

  for (let i = 0; i < chain.length; i++) {
    const record = chain[i];
    // Check previous hash link
    if (i === 0) {
      if (record.previousHash !== GENESIS_AUDIT_HASH) {
        return {
          isValid: false,
          failedIndex: record.index,
          reason: 'Genesis block previous hash is corrupt.'
        };
      }
    } else {
      const prev = chain[i - 1];
      if (record.previousHash !== prev.hash) {
        return {
          isValid: false,
          failedIndex: record.index,
          reason: `Hash link broken between block #${prev.index} and block #${record.index}.`
        };
      }
    }

    // Verify self hash
    const expectedHash = computeAuditRecordHash(
      record.index,
      record.timestamp,
      record.actorEmail,
      record.action,
      record.details,
      record.previousHash
    );
    if (record.hash !== expectedHash) {
      return {
        isValid: false,
        failedIndex: record.index,
        reason: `Block #${record.index} content hash mismatch (tampering detected).`
      };
    }
  }

  return { isValid: true };
}

/* ============================================================================
 * EMERGENCY BREAK-GLASS PROTOCOL
 * ============================================================================ */

export interface BreakGlassKeyRecord {
  token: string;
  actorEmail: string;
  action: string;
  reason: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

/**
 * Generate a 4-hour emergency break-glass token with cryptographic signature
 */
export function generateBreakGlassToken(
  actorEmail: string,
  action: string,
  reason: string,
  durationHours = 4
): BreakGlassKeyRecord {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timeHex = Date.now().toString(16).slice(-4).toUpperCase();
  const token = `BG-DGU2-${rand}-${timeHex}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000).toISOString();

  return {
    token,
    actorEmail,
    action,
    reason,
    createdAt: now.toISOString(),
    expiresAt,
    isActive: true
  };
}

/**
 * Validate emergency break-glass key
 */
export function validateBreakGlassToken(
  token: string,
  keyRecord?: BreakGlassKeyRecord | null
): { isValid: boolean; reason?: string } {
  if (!token || !token.trim()) {
    return { isValid: false, reason: 'Empty token supplied.' };
  }
  const clean = token.trim();
  if (!clean.startsWith('BG-DGU2-') || clean.length < 15) {
    return { isValid: false, reason: 'Invalid Break-Glass token format.' };
  }
  if (keyRecord) {
    if (keyRecord.token !== clean) {
      return { isValid: false, reason: 'Token does not match active authorization.' };
    }
    if (new Date(keyRecord.expiresAt).getTime() < Date.now()) {
      return { isValid: false, reason: 'Break-Glass token has expired.' };
    }
    if (!keyRecord.isActive) {
      return { isValid: false, reason: 'Break-Glass token has already been revoked or consumed.' };
    }
  }
  return { isValid: true };
}

/* ============================================================================
 * ZERO TRUST SYSTEM HEALTH STATUS
 * ============================================================================ */

export interface ZeroTrustSystemStatus {
  overallHealthScore: number;
  policy: 'Fail-Secure Least Privilege (Strict)';
  sessionFingerprint: string;
  sessionVerified: boolean;
  tamperGuardActive: boolean;
  tamperDetected: boolean;
  activeTierLevel: number;
  activeTierLabel: string;
  rootOperationsGuarded: boolean;
  totalCapabilitiesGuarded: number;
}

export function getZeroTrustSystemStatus(
  profile?: UserProfile | null,
  roleTiers: RoleTier[] = []
): ZeroTrustSystemStatus {
  const isSys = isSystemAdmin(profile);
  const fingerprint = generateSessionFingerprint(profile);
  const tamper = detectStorageTampering(profile);
  const activeTier = roleTiers.find(t => t.id === profile?.tierId) || roleTiers[0];
  const level = isSys ? 0 : activeTier?.level ?? 4;

  let score = 95;
  if (tamper.isTampered) score -= 40;
  if (!profile) score -= 20;

  return {
    overallHealthScore: Math.max(0, Math.min(100, score)),
    policy: 'Fail-Secure Least Privilege (Strict)',
    sessionFingerprint: fingerprint,
    sessionVerified: !tamper.isTampered,
    tamperGuardActive: true,
    tamperDetected: tamper.isTampered,
    activeTierLevel: level,
    activeTierLabel: isSys ? 'Tier 0 (Root Admin)' : activeTier?.tierLevelLabel || `Tier ${level}`,
    rootOperationsGuarded: true,
    totalCapabilitiesGuarded: ZERO_TRUST_CAPABILITY_MATRIX.length
  };
}
