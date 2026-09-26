/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  BadgeCheck,
  Check,
  Save,
  Shield,
  Sliders,
  ShieldCheck,
  LogOut,
  Loader2,
  AlertCircle,
  Copy,
  ExternalLink,
  Globe,
  CheckCheck,
  Lock
} from 'lucide-react';
import { UserProfile, RoleTier } from '../types';
import { ROLE_TIERS as DEFAULT_ROLE_TIERS, SYSTEM_ADMIN_PROFILE } from '../mockData';
import { RoleManager } from './RoleManager';
import { googleSignIn, googleSignOut } from '../lib/firebaseAuth';
import {
  ALL_FACTORY_LINES,
  BLUE_WING_LINES,
  GREEN_WING_LINES,
  FACTORY_BLOCKS,
  normalizeLineNo,
  isSystemAdmin,
  verifySystemAdminPasscode,
  SYSTEM_ADMIN_EMAIL,
  isMasterAdminOrAdmin
} from '../utils/rbac';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  roleTiers?: RoleTier[];
  onUpdateRoleTiers?: (tiers: RoleTier[]) => void;
  initialTab?: 'profile' | 'roles';
  onLockTerminal?: () => void;
  onOpenPrivacySecurity?: () => void;
  onOpenAuth?: () => void;
}

const TIER_TO_ROLE: Record<string, UserProfile['role']> = {
  tier_0: 'admin',
  tier_1: 'sr_manager',
  tier_2: 'manager',
  tier_3: 'ie_incharge',
  tier_4: 'line_ie'
};

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  roleTiers = DEFAULT_ROLE_TIERS,
  onUpdateRoleTiers,
  initialTab = 'profile',
  onLockTerminal,
  onOpenPrivacySecurity,
  onOpenAuth
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const [activeTab, setActiveTab] = useState<'profile' | 'roles'>(
    initialTab === 'roles' && isMasterAdmin ? 'roles' : 'profile'
  );
  const [name, setName] = useState<string>(profile.name);
  const [email, setEmail] = useState<string>(profile.email);
  const [employeeId, setEmployeeId] = useState<string>(profile.employeeId || 'IE-9042');
  const [assignedUnit, setAssignedUnit] = useState<string>(profile.assignedUnit || 'Unit 01 (Sewing)');
  const [shift, setShift] = useState<string>(profile.shift || 'General Shift (8:00 AM - 5:00 PM)');
  const [selectedTierId, setSelectedTierId] = useState<string>(profile.tierId || 'tier_1');
  const [assignedWing, setAssignedWing] = useState<'Blue Wing' | 'Green Wing' | 'All'>(
    profile.assignedWing || 'Blue Wing'
  );
  const [assignedBlock, setAssignedBlock] = useState<string>(
    profile.assignedBlock || 'block_2'
  );
  const [assignedLines, setAssignedLines] = useState<string[]>(
    profile.assignedLines && profile.assignedLines.length > 0
      ? profile.assignedLines
      : ['Line 01', 'Line 02']
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSigningInWithGoogle, setIsSigningInWithGoogle] = useState<boolean>(false);
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<boolean>(false);
  const [copiedDomain, setCopiedDomain] = useState<boolean>(false);

  // Hidden System Admin pass authorization
  const [showAdminPassModal, setShowAdminPassModal] = useState<boolean>(false);
  const [adminPassInput, setAdminPassInput] = useState<string>('');
  const [adminPassError, setAdminPassError] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentRoleTier: RoleTier =
    roleTiers.find(r => r.id === selectedTierId) || roleTiers[0] || DEFAULT_ROLE_TIERS[0];

  const handleVerifyAndElevateAdmin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifySystemAdminPasscode(adminPassInput)) {
      setName(SYSTEM_ADMIN_PROFILE.name);
      setEmail(SYSTEM_ADMIN_PROFILE.email);
      setEmployeeId(SYSTEM_ADMIN_PROFILE.employeeId || 'SYS-ADMIN-01');
      setAssignedUnit(SYSTEM_ADMIN_PROFILE.assignedUnit || 'Debonair LTD (Unit-02) — Master Administration');
      setShift(SYSTEM_ADMIN_PROFILE.shift || '24/7 Root Operations & System Control');
      setSelectedTierId('tier_0');
      setAssignedWing('All');
      onUpdateProfile({
        ...profile,
        ...SYSTEM_ADMIN_PROFILE
      });
      setShowAdminPassModal(false);
      setAdminPassInput('');
      setAdminPassError(null);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } else {
      setAdminPassError('Invalid System Admin authorization passcode.');
      setTimeout(() => setAdminPassError(null), 3000);
    }
  };

  const handleQuickLinkVerifiedProfile = (customEmail?: string) => {
    const verifiedEmail = customEmail || email || 'ashikhossainkr@gmail.com';
    const isSysAdmin = verifiedEmail.toLowerCase().trim() === SYSTEM_ADMIN_EMAIL.toLowerCase();

    if (isSysAdmin) {
      setShowAdminPassModal(true);
      return;
    }

    const displayName = name && name !== 'Lead IE' ? name : 'Ashik Hossain (IE)';
    const mockUid = 'goog_' + btoa(verifiedEmail).replace(/=/g, '').slice(0, 16);
    setName(displayName);
    setEmail(verifiedEmail);
    onUpdateProfile({
      ...profile,
      name: displayName,
      email: verifiedEmail,
      photoURL: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23176f78"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E',
      googleUid: mockUid
    });
    setUnauthorizedDomain(false);
    setGoogleAuthError(null);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningInWithGoogle(true);
    setGoogleAuthError(null);
    setUnauthorizedDomain(false);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        const u = res.user;
        const newEmail = u.email || email;
        const isSysAdmin = newEmail.toLowerCase().trim() === SYSTEM_ADMIN_EMAIL.toLowerCase();
        const newName = isSysAdmin ? SYSTEM_ADMIN_PROFILE.name : (u.displayName || name);
        const newPhoto = u.photoURL || (isSysAdmin ? SYSTEM_ADMIN_PROFILE.photoURL : undefined);
        setName(newName);
        setEmail(newEmail);
        if (isSysAdmin) {
          setSelectedTierId('tier_0');
          setAssignedWing('All');
          setAssignedUnit(SYSTEM_ADMIN_PROFILE.assignedUnit || 'Debonair LTD (Unit-02) — Master Administration');
          setShift(SYSTEM_ADMIN_PROFILE.shift || '24/7 Root Operations & System Control');
        } else if (selectedTierId === 'tier_0') {
          // If non-admin had tier_0 selected, demote to Tier 1
          setSelectedTierId('tier_1');
        }
        
        const effectiveTierId = isSysAdmin ? 'tier_0' : (selectedTierId === 'tier_0' ? 'tier_1' : selectedTierId);
        const effectiveRole = isSysAdmin ? 'admin' : (TIER_TO_ROLE[effectiveTierId] || 'sr_manager');

        onUpdateProfile({
          ...profile,
          name: newName,
          email: newEmail,
          photoURL: newPhoto,
          googleUid: u.uid,
          role: effectiveRole,
          tierId: effectiveTierId,
          jobTitle: isSysAdmin ? 'System Administrator (Root Operations)' : profile.jobTitle,
          assignedUnit: isSysAdmin ? (SYSTEM_ADMIN_PROFILE.assignedUnit || 'Debonair LTD (Unit-02) — Master Administration') : assignedUnit,
          shift: isSysAdmin ? (SYSTEM_ADMIN_PROFILE.shift || '24/7 Root Operations & System Control') : shift,
          assignedWing: isSysAdmin ? 'All' : assignedWing
        });
      } else if (res?.error === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(true);
        setGoogleAuthError(null);
      } else if (res?.error === 'auth/popup-closed-by-user') {
        setGoogleAuthError('Sign in popup was closed. Please try again.');
      } else if (res?.error) {
        setGoogleAuthError(res.error);
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('auth/unauthorized-domain')) {
        setUnauthorizedDomain(true);
        setGoogleAuthError(null);
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setGoogleAuthError('Sign in popup was closed. Please try again.');
      } else {
        setGoogleAuthError(err?.message || 'Authentication was interrupted or canceled.');
      }
    } finally {
      setIsSigningInWithGoogle(false);
    }
  };

  const handleGoogleSignOut = async () => {
    try {
      await googleSignOut();
      onUpdateProfile({
        ...profile,
        photoURL: undefined,
        googleUid: undefined
      });
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const isTargetAdminEmail = cleanEmail === SYSTEM_ADMIN_EMAIL.toLowerCase();

    // Prevent non-admin emails from selecting tier_0
    if (selectedTierId === 'tier_0' && !isTargetAdminEmail) {
      alert(`Master System Administrator (Tier 0) is restricted exclusively to ${SYSTEM_ADMIN_EMAIL}. Please select Tier 1, 2, 3 or 4.`);
      setSelectedTierId('tier_1');
      return;
    }

    if (isTargetAdminEmail && selectedTierId !== 'tier_0' && !isSystemAdmin(profile)) {
      setShowAdminPassModal(true);
      return;
    }

    const isRootAdmin = isTargetAdminEmail && (selectedTierId === 'tier_0' || isSystemAdmin(profile));
    const systemRole = isRootAdmin
      ? 'admin'
      : (TIER_TO_ROLE[selectedTierId] || (currentRoleTier.systemRole.toLowerCase() as any) || 'officer');

    onUpdateProfile({
      ...profile,
      name: isRootAdmin ? SYSTEM_ADMIN_PROFILE.name : name.trim(),
      email: email.trim(),
      employeeId: isRootAdmin ? SYSTEM_ADMIN_PROFILE.employeeId : employeeId.trim(),
      assignedUnit: isRootAdmin ? SYSTEM_ADMIN_PROFILE.assignedUnit : assignedUnit.trim(),
      shift: isRootAdmin ? SYSTEM_ADMIN_PROFILE.shift : shift.trim(),
      jobTitle: isRootAdmin ? 'System Administrator (Root Operations)' : (currentRoleTier.roleTitle || currentRoleTier.name),
      tierId: isRootAdmin ? 'tier_0' : (selectedTierId === 'tier_0' ? 'tier_1' : selectedTierId),
      role: isRootAdmin ? 'admin' : systemRole,
      assignedWing: isRootAdmin ? 'All' : assignedWing,
      assignedBlock: isRootAdmin ? 'All' : assignedBlock,
      assignedLines
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 500);
  };

  const handleRoleTiersUpdated = (updatedTiers: RoleTier[]) => {
    if (onUpdateRoleTiers) {
      onUpdateRoleTiers(updatedTiers);
    }
    // If the active profile's tier was updated, keep jobTitle aligned
    const updatedCurrent = updatedTiers.find(t => t.id === selectedTierId);
    if (updatedCurrent && updatedCurrent.name !== profile.jobTitle) {
      onUpdateProfile({
        ...profile,
        jobTitle: updatedCurrent.name
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e7e1d5] bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl bg-[#176f78] text-white flex items-center justify-center shadow-xs cursor-pointer select-none transition-transform active:scale-95"
                onDoubleClick={() => setShowAdminPassModal(true)}
                title={isSystemAdmin(profile) ? 'System Admin (Root Active)' : undefined}
              >
                {activeTab === 'profile' ? <User className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  {activeTab === 'profile' ? 'Industrial Engineer Profile' : 'System Role & Permissions Manager'}
                </h2>
                <p className="text-xs text-[#527078]">
                  {activeTab === 'profile'
                    ? 'Floor credential settings, personal ID, and assigned operational tier'
                    : 'Configure and update every role title, hierarchy level, sign-offs, and rights'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden System Admin Passcode Verification Form */}
          {showAdminPassModal && (
            <div className="mt-3 p-3.5 rounded-2xl bg-[#0f282f] text-white border border-teal-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-teal-200">
                    Master System Administrator Verification (ashikur.rahman.0971@gmail.com)
                  </span>
                </div>
                <p className="text-[11px] text-teal-100/80">
                  Enter master security key to elevate active terminal to Master System Administrator:
                </p>
                {adminPassError && (
                  <span className="text-[11px] text-rose-300 font-bold block">{adminPassError}</span>
                )}
              </div>
              <form onSubmit={handleVerifyAndElevateAdmin} className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="Passcode"
                  value={adminPassInput}
                  onChange={e => setAdminPassInput(e.target.value)}
                  className="flex-1 sm:w-28 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 font-mono text-center tracking-widest text-xs focus:outline-hidden focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#14363d] font-black text-xs cursor-pointer shadow-xs"
                >
                  Verify
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminPassModal(false);
                    setAdminPassInput('');
                    setAdminPassError(null);
                  }}
                  className="p-1.5 rounded-xl text-teal-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Navigation Tab Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
            <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#f1eee6] border border-[#d9d2c2] w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-white text-[#17343a] shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Engineer Profile</span>
              </button>

              {isMasterAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveTab('roles')}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'roles'
                      ? 'bg-white text-[#17343a] shadow-xs'
                      : 'text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176f78]" />
                  <span>Manage &amp; Update Roles</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-[#dceceb] text-[#176f78]">
                    {roleTiers.length}
                  </span>
                </button>
              )}
            </div>

            {onOpenAuth && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth();
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#176f78]/10 hover:bg-[#176f78] text-[#176f78] hover:text-white border border-[#176f78]/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In / Switch Account</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'roles' && isMasterAdmin ? (
            <RoleManager
              roleTiers={roleTiers}
              onUpdateRoleTiers={handleRoleTiersUpdated}
              activeTierId={selectedTierId}
              onSelectActiveTier={(tierId) => setSelectedTierId(tierId)}
            />
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Identity Preview Card */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] flex items-center gap-4">
                {profile.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={name}
                    className="w-14 h-14 rounded-2xl object-cover border border-[#d9d2c2] shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-xl font-bold text-white shadow-xs"
                    style={{ backgroundColor: currentRoleTier.color || '#176f78' }}
                  >
                    {currentRoleTier.shortCode}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-[#17343a]">{name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dceceb] text-[#176f78] border border-[#b2d6d8]">
                      {currentRoleTier.shortCode} • Level {currentRoleTier.level}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f1eee6] text-[#527078] border border-[#d9d2c2]">
                      {currentRoleTier.systemRole}
                    </span>
                  </div>
                  <p className="text-xs text-[#527078] font-medium">{currentRoleTier.name}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-[#527078] flex-wrap">
                    <span className="font-mono-numbers">{employeeId}</span>
                    <span>•</span>
                    <span>{assignedUnit}</span>
                    <span>•</span>
                    <span className="text-[#176f78] font-bold">{shift}</span>
                  </div>
                </div>
              </div>

              {/* Google OAuth Profile Link Section */}
              <div className="p-4 rounded-2xl bg-[#f4f7f6] border border-[#d2e3e1] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#17343a] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#176f78]" />
                    Google Account Verification (OAuth 2.0)
                  </span>
                  {profile.googleUid && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Verified Identity
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#527078]">
                  Sign in with your Google Workspace or corporate email to automatically create and sync your factory IE profile.
                </p>

                {googleAuthError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{googleAuthError}</span>
                  </div>
                )}

                {/* Quick Profile Linker */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickLinkVerifiedProfile('realmec85pro231@gmail.com')}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#176f78] hover:bg-[#135d65] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-95"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Quick Link Admin Profile (realmec85pro231@gmail.com)</span>
                  </button>
                </div>

                {profile.googleUid ? (
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white border border-[#d9d2c2]">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {profile.photoURL ? (
                        <img
                          src={profile.photoURL}
                          alt="Google Avatar"
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#176f78] text-white flex items-center justify-center text-xs font-bold shrink-0">
                          G
                        </div>
                      )}
                      <div className="truncate text-xs">
                        <span className="font-bold text-[#17343a] block truncate">{profile.email}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Active OAuth Session</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGoogleSignOut}
                      className="px-2.5 py-1 rounded-lg border border-[#d9d2c2] text-[11px] font-bold text-[#527078] hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Disconnect</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isSigningInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-gray-50 border border-[#d9d2c2] shadow-2xs text-xs font-bold text-[#17343a] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningInWithGoogle ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#176f78]" />
                        <span>Signing in with Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" viewBox="0 0 48 48">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          <path fill="none" d="M0 0h48v48H0z" />
                        </svg>
                        <span>Sign in with Google to create / link profile</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      required
                      value={employeeId}
                      onChange={e => setEmployeeId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Assigned Factory Unit
                    </label>
                    <input
                      type="text"
                      required
                      value={assignedUnit}
                      onChange={e => setAssignedUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#527078]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>
                </div>

                {/* Assigned Shift Selection */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Assigned Operational Shift
                  </label>
                  <select
                    value={shift}
                    onChange={e => setShift(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  >
                    <option value="General Shift (8:00 AM - 5:00 PM)">General Shift 8:00 AM to 5:00 PM (Standard Default)</option>
                    <option value="Shift 02 (Evening Overtime 17:00 - 21:00)">Shift 02 (Evening Overtime 17:00 - 21:00)</option>
                    <option value="Shift 03 (Night Shift 21:00 - 05:00)">Shift 03 (Night Shift 21:00 - 05:00)</option>
                  </select>
                </div>

                {/* Role Tier Selection (Debonair LTD RBAC) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold uppercase text-[#527078]">
                      Authorization Role Tier (Debonair LTD Unit-02 RBAC)
                    </label>
                    {isMasterAdmin && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('roles')}
                        className="text-[11px] font-bold text-[#176f78] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Configure Roles</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedTierId}
                    onChange={e => {
                      if (e.target.value === 'tier_0') {
                        if (email.trim().toLowerCase() !== SYSTEM_ADMIN_EMAIL.toLowerCase() && !isSystemAdmin(profile)) {
                          alert(`Access Denied: Master System Administrator role is strictly restricted to ${SYSTEM_ADMIN_EMAIL}.`);
                          return;
                        }
                        if (!isSystemAdmin(profile)) {
                          setShowAdminPassModal(true);
                          return;
                        }
                      }
                      setSelectedTierId(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                  >
                    {roleTiers
                      .filter(tier => !tier.isHidden || (tier.id === 'tier_0' && (email.trim().toLowerCase() === SYSTEM_ADMIN_EMAIL.toLowerCase() || isSystemAdmin(profile))))
                      .map(tier => (
                        <option key={tier.id} value={tier.id}>
                          {tier.tierLevelLabel || `Tier ${tier.level}`} • {tier.roleTitle || tier.name} — {tier.reportingScope}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Dynamic Scoping Controls based on chosen Tier */}
                {(currentRoleTier.level === 0 || selectedTierId === 'tier_0' || isSystemAdmin(profile)) && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/80 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-600" />
                        <label className="text-[11px] font-bold uppercase text-indigo-950">
                          System Administrator (Tier 0 • Root Access)
                        </label>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-2xs">
                        Unrestricted Authority
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-900/80 font-medium">
                      Unrestricted master control across all factory lines (Lines 01–34+), both Blue &amp; Green Wings, all managerial tiers, system configuration, and terminal lock overrides.
                    </p>
                  </div>
                )}
                {currentRoleTier.level === 2 && (
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-blue-900">
                        Assigned Wing Scope (Tier 2 Manager)
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                        Wing Super-User
                      </span>
                    </div>
                    <select
                      value={assignedWing}
                      onChange={e => setAssignedWing(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl border border-blue-300 text-xs font-bold text-blue-950 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Blue Wing">Blue Wing (Lines 01–18 • Manager 1)</option>
                      <option value="Green Wing">Green Wing (Lines 19–34 • Manager 2)</option>
                      <option value="All">All Factory Wings (Executive Oversight)</option>
                    </select>
                    <p className="text-[11px] text-blue-700">
                      Tier 2 Manager has full Write &amp; Approve control over lines within the selected wing.
                    </p>
                  </div>
                )}

                {currentRoleTier.level === 3 && (
                  <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-sky-900">
                        Assigned Block / Floor (Tier 3 IE Incharge)
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-600 text-white">
                        Section Moderator
                      </span>
                    </div>
                    <select
                      value={assignedBlock}
                      onChange={e => setAssignedBlock(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-sky-300 text-xs font-bold text-sky-950 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                    >
                      {FACTORY_BLOCKS.map(b => (
                        <option key={b.blockId} value={b.blockId}>
                          {b.label} — {b.wing}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-sky-700">
                      Tier 3 Incharge has Section Moderator authority (Write &amp; Approve for the 5–6 assigned lines).
                    </p>
                  </div>
                )}

                {currentRoleTier.level === 4 && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-amber-900">
                        Assigned Production Lines (Tier 4 Line IE)
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-600 text-white">
                        Data Entry Only
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold block mb-1">Primary Line:</span>
                        <select
                          value={assignedLines[0] || 'Line 01'}
                          onChange={e => {
                            const val = e.target.value;
                            setAssignedLines([val, assignedLines[1] || 'Line 02']);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-amber-950 bg-white"
                        >
                          {ALL_FACTORY_LINES.map(line => (
                            <option key={`p_${line}`} value={line}>
                              {line}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold block mb-1">Secondary Line:</span>
                        <select
                          value={assignedLines[1] || 'Line 02'}
                          onChange={e => {
                            const val = e.target.value;
                            setAssignedLines([assignedLines[0] || 'Line 01', val]);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 text-xs font-bold text-amber-950 bg-white"
                        >
                          {ALL_FACTORY_LINES.map(line => (
                            <option key={`s_${line}`} value={line}>
                              {line}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Standard IE: Full data entry &amp; cycle study entry for assigned lines ({assignedLines.join(', ')}). Other lines are view-only.
                    </p>
                  </div>
                )}
              </div>

              {/* Official Debonair RBAC Tier Summary Card */}
              <div className="p-3.5 rounded-2xl bg-[#1e3a8a]/5 border border-[#1e3a8a]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-[#1e3a8a] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
                    Debonair RBAC Access Level:
                  </span>
                  <span className="text-[11px] font-bold text-[#1e3a8a]">
                    {currentRoleTier.tierLevelLabel || `Tier ${currentRoleTier.level}`}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#d9d2c2] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Reporting Scope:</span>
                    <span className="font-bold text-slate-900">{currentRoleTier.reportingScope}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Access Level:</span>
                    <span className="font-bold text-[#1e3a8a]">{currentRoleTier.accessControlLevel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Checklist Sign-off:</span>
                    <span className={`font-bold ${currentRoleTier.checklistSignoff === 'Authorized' ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {currentRoleTier.checklistSignoff}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canManageLines ? 'text-[#176f78]' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canManageLines ? 'font-bold' : 'text-[#527078]'}>
                      Manage Lines &amp; Setup
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canEditLineData ? 'text-[#176f78]' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canEditLineData ? 'font-bold' : 'text-[#527078]'}>
                      Edit Line Data &amp; SMV
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canApproveChecklist ? 'text-emerald-700' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canApproveChecklist ? 'font-bold' : 'text-[#527078]'}>
                      Sign-off 12-Task Audits
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#17343a]">
                    <BadgeCheck
                      className={`w-4 h-4 ${
                        currentRoleTier.canExport ? 'text-[#176f78]' : 'text-[#527078]/40'
                      }`}
                    />
                    <span className={currentRoleTier.canExport ? 'font-bold' : 'text-[#527078]'}>
                      Export Reports &amp; CSV
                    </span>
                  </div>
                </div>
              </div>

              {/* Terminal Lock & Privacy Controls - ONLY for Master Administration/Admin Role */}
              {isMasterAdmin && (onLockTerminal || onOpenPrivacySecurity) && (
                <div className="p-3.5 rounded-2xl bg-[#176f78]/5 border border-[#176f78]/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#176f78] text-white flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#17343a]">Terminal Security &amp; Privacy</div>
                      <div className="text-[10px] text-[#527078]">Lock workstation or adjust privacy blur shields</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onLockTerminal && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onLockTerminal();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Lock Now</span>
                      </button>
                    )}
                    {onOpenPrivacySecurity && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPrivacySecurity();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#176f78] hover:bg-[#12555c] text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <Shield className="w-3 h-3" />
                        <span>Security</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
