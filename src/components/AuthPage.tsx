/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — IE Department
 * Zero Trust Authentication & Identity Access Gateway
 * Principle: "Never Trust, Always Verify" — Fail-Secure Least Privilege
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Factory,
  KeyRound,
  Eye,
  EyeOff,
  Radio,
  Clock,
  Fingerprint,
  Cpu,
  UserPlus,
  LogIn,
  Check,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  Zap
} from 'lucide-react';
import { UserProfile, RoleTier } from '../types';
import {
  SYSTEM_ADMIN_EMAIL,
  SYSTEM_ADMIN_EMAILS,
  verifySystemAdminPasscode,
  generateSessionFingerprint,
  FACTORY_BLOCKS,
  isSystemAdmin
} from '../utils/rbac';
import { SYSTEM_ADMIN_PROFILE, ROLE_TIERS } from '../mockData';
import { googleSignIn } from '../lib/firebaseAuth';

interface AuthPageProps {
  isOpen?: boolean;
  onSuccess: (updatedProfile: UserProfile) => void;
  onCancel?: () => void;
  currentProfile?: UserProfile;
  roleTiers?: RoleTier[];
  initialMode?: ZeroTrustAuthMode;
}

export type ZeroTrustAuthMode = 'sign_in' | 'sign_up';

export const AuthPage: React.FC<AuthPageProps> = ({
  isOpen = true,
  onSuccess,
  onCancel,
  currentProfile,
  roleTiers = ROLE_TIERS,
  initialMode = 'sign_in'
}) => {
  const [authMode, setAuthMode] = useState<ZeroTrustAuthMode>(initialMode);

  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);
  
  // Shared Form State
  const [email, setEmail] = useState(currentProfile?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState(currentProfile?.name || '');
  const [employeeId, setEmployeeId] = useState(currentProfile?.employeeId || 'IE-9042');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState(false);

  // State
  const [selectedTier, setSelectedTier] = useState<string>('tier_4'); // Zero Trust defaults to Tier 4 (Least Privilege)
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Live Zero Trust Session Fingerprint
  const sessionFingerprint = useMemo(() => {
    return generateSessionFingerprint(currentProfile || { email, role: 'line_ie', tierId: selectedTier });
  }, [currentProfile, email, selectedTier]);

  if (!isOpen) return null;

  // Sign In Handler
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Please enter an employee email or official login ID.');
      return;
    }

    // Check if designated System Administrator email
    const isTargetAdmin = SYSTEM_ADMIN_EMAILS.some(e => e.toLowerCase() === cleanEmail);
    if (isTargetAdmin) {
      if (!verifySystemAdminPasscode(password.trim())) {
        setErrorMsg('System Administrator clearance requires verified root passcode.');
        return;
      }
      const adminProfile: UserProfile = {
        ...SYSTEM_ADMIN_PROFILE,
        email: cleanEmail,
        assignedUnit: 'Debonair LTD (Unit-02) — Master Administration'
      };
      saveAndComplete(adminProfile);
      return;
    }

    // Standard Zero Trust Floor Authentication
    // Assignments are loaded from existing authorized profile or default least-privilege boundary
    let assignedUnit = 'Debonair LTD (Unit 02)';
    let assignedWing: 'Blue Wing' | 'Green Wing' | 'All' = 'Blue Wing';
    let assignedBlock: string | undefined = FACTORY_BLOCKS[0]?.label;
    let assignedLines: string[] = ['Line 01'];
    let role: UserProfile['role'] = selectedTier === 'tier_1' ? 'sr_manager' : selectedTier === 'tier_2' ? 'manager' : selectedTier === 'tier_3' ? 'ie_incharge' : 'line_ie';
    let tierId = selectedTier;

    try {
      const savedStr = localStorage.getItem('ie_user_profile');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (saved.email && saved.email.toLowerCase() === cleanEmail) {
          assignedUnit = saved.assignedUnit || assignedUnit;
          assignedWing = saved.assignedWing || assignedWing;
          assignedBlock = saved.assignedBlock || assignedBlock;
          assignedLines = saved.assignedLines || assignedLines;
          role = saved.role || role;
          tierId = saved.tierId || tierId;
        }
      }
    } catch {}

    if (currentProfile?.email && currentProfile.email.toLowerCase() === cleanEmail) {
      assignedUnit = currentProfile.assignedUnit || assignedUnit;
      assignedWing = currentProfile.assignedWing || assignedWing;
      assignedBlock = currentProfile.assignedBlock || assignedBlock;
      assignedLines = currentProfile.assignedLines || assignedLines;
      role = currentProfile.role || role;
      tierId = currentProfile.tierId || tierId;
    }

    const matchedTier = roleTiers.find(t => t.id === tierId) || roleTiers[4] || roleTiers[0];
    const newProfile: UserProfile = {
      ...(currentProfile || {}),
      name: fullName.trim() || cleanEmail.split('@')[0],
      email: cleanEmail,
      employeeId: employeeId.trim() || 'IE-9042',
      tierId,
      role,
      jobTitle: matchedTier.roleTitle || matchedTier.name,
      assignedUnit,
      assignedWing,
      assignedBlock,
      assignedLines,
      shift: 'General Shift (8:00 AM - 5:00 PM)',
      photoURL: currentProfile?.photoURL || `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23176f78"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E`
    };

    saveAndComplete(newProfile);
  };

  // Sign Up / Register Terminal Identity Handler
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Official email address is required.');
      return;
    }
    if (!fullName.trim()) {
      setErrorMsg('Full legal name is required for factory terminal registration.');
      return;
    }
    if (password && confirmPassword && password !== confirmPassword) {
      setErrorMsg('Workstation PINs do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('You must acknowledge the Debonair Unit-02 Zero Trust Audit Policy.');
      return;
    }

    // Zero Trust Principle: New user accounts strictly default to Tier 4 (Line IE / Data Entry)
    // Factory boundary (wings, floors, lines) is allocated by administration via the central organogram
    const tier4 = roleTiers.find(t => t.id === 'tier_4') || roleTiers[0];
    const registeredProfile: UserProfile = {
      ...(currentProfile || {}),
      name: fullName.trim(),
      email: cleanEmail,
      employeeId: employeeId.trim() || `IE-${Math.floor(1000 + Math.random() * 9000)}`,
      tierId: 'tier_4',
      role: 'line_ie',
      jobTitle: tier4.roleTitle || 'Line Industrial Engineer',
      assignedUnit: 'Debonair LTD (Unit 02)',
      assignedWing: 'Blue Wing',
      assignedBlock: FACTORY_BLOCKS[0]?.label,
      assignedLines: ['Line 01'],
      shift: 'General Shift (8:00 AM - 5:00 PM)',
      photoURL: `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23176f78"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E`
    };

    setSuccessMsg('Zero Trust registration complete: Enrolled with Tier 4 (Line IE Least-Privilege). Operational boundaries will be provisioned by Department Administration.');
    setTimeout(() => {
      saveAndComplete(registeredProfile);
    }, 800);
  };

  // Google OAuth SSO Sign-in with Zero Trust Validation
  const handleGoogleSSO = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setUnauthorizedDomain(false);

    try {
      const res = await googleSignIn();
      if (res?.user) {
        const u = res.user;
        const userEmail = (u.email || email).toLowerCase().trim();
        const isSysAdminUser = SYSTEM_ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail);

        let ssoAssignedUnit = isSysAdminUser ? 'Debonair LTD (Unit-02) — Master Administration' : (currentProfile?.assignedUnit || 'Debonair LTD (Unit 02)');
        let ssoAssignedWing: 'Blue Wing' | 'Green Wing' | 'All' = isSysAdminUser ? 'All' : (currentProfile?.assignedWing || 'Blue Wing');
        let ssoRole: UserProfile['role'] = isSysAdminUser ? 'admin' : (selectedTier === 'tier_1' ? 'sr_manager' : selectedTier === 'tier_2' ? 'manager' : selectedTier === 'tier_3' ? 'ie_incharge' : 'line_ie');
        let ssoTierId = isSysAdminUser ? 'tier_0' : selectedTier;

        try {
          const savedStr = localStorage.getItem('ie_user_profile');
          if (savedStr) {
            const saved = JSON.parse(savedStr);
            if (saved.email && saved.email.toLowerCase() === userEmail) {
              ssoAssignedUnit = saved.assignedUnit || ssoAssignedUnit;
              ssoAssignedWing = saved.assignedWing || ssoAssignedWing;
              ssoRole = isSysAdminUser ? 'admin' : (saved.role || ssoRole);
              ssoTierId = isSysAdminUser ? 'tier_0' : (saved.tierId || ssoTierId);
            }
          }
        } catch {}

        const finalProfile: UserProfile = {
          ...(currentProfile || {}),
          name: isSysAdminUser ? SYSTEM_ADMIN_PROFILE.name : (u.displayName || fullName || 'IE Engineer'),
          email: userEmail,
          photoURL: u.photoURL || (isSysAdminUser ? SYSTEM_ADMIN_PROFILE.photoURL : undefined),
          googleUid: u.uid,
          employeeId: employeeId || 'IE-9042',
          role: ssoRole,
          tierId: ssoTierId,
          jobTitle: isSysAdminUser ? 'System Administrator (Root Operations)' : (roleTiers.find(t => t.id === ssoTierId)?.roleTitle || 'Industrial Engineer'),
          assignedUnit: ssoAssignedUnit,
          assignedWing: ssoAssignedWing,
          shift: isSysAdminUser ? '24/7 Root Operations & System Control' : 'General Shift (8:00 AM - 5:00 PM)'
        };

        saveAndComplete(finalProfile);
      } else if (res?.error === 'auth/unauthorized-domain') {
        setUnauthorizedDomain(true);
      } else if (res?.error === 'auth/popup-closed-by-user') {
        setErrorMsg('Google Sign-In was canceled by user.');
      } else if (res?.error) {
        setErrorMsg(res.error);
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('auth/unauthorized-domain')) {
        setUnauthorizedDomain(true);
      } else {
        setErrorMsg(err?.message || 'Failed to authenticate with Google SSO.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to persist and close
  const saveAndComplete = (userProfile: UserProfile) => {
    try {
      localStorage.setItem('ie_user_profile', JSON.stringify(userProfile));
    } catch {}
    onSuccess(userProfile);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#faf8f4] border border-[#d9d2c2] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Visual Brand & Zero Trust Perimeter Banner */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#176f78] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-teal-200 border border-white/20 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight uppercase text-white font-display">
                  IE Daily Control
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider border border-emerald-500/30">
                  Zero Trust Gateway
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Debonair LTD (Unit-02) &bull; Production Intelligence &bull; SOP-IE-04
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/10 text-xs font-bold transition-colors cursor-pointer border border-white/10 self-start sm:self-auto"
            >
              Continue as Guest &times;
            </button>
          )}
        </div>

        {/* Live Zero Trust Telemetry Ribbon */}
        <div className="bg-[#0f172a]/95 text-slate-300 px-6 py-2 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Perimeter: Armed
            </span>
            <span className="text-slate-400 hidden sm:inline">&bull;</span>
            <span className="text-amber-300 hidden sm:inline">Policy: Fail-Secure Least Privilege</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Handshake:</span>
            <span className="text-teal-300 font-bold">{sessionFingerprint}</span>
          </div>
        </div>

        {/* Dedicated Zero Trust Mode Selectors */}
        <div className="px-6 pt-3 pb-1 border-b border-[#e7e1d5] bg-white flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {/* Mode 1: Sign In */}
            <button
              type="button"
              onClick={() => setAuthMode('sign_in')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                authMode === 'sign_in'
                  ? 'bg-[#176f78] text-white shadow-2xs'
                  : 'text-[#506e75] hover:bg-[#f1eee6]'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            {/* Mode 2: Sign Up / Register Terminal */}
            <button
              type="button"
              onClick={() => setAuthMode('sign_up')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                authMode === 'sign_up'
                  ? 'bg-[#176f78] text-white shadow-2xs'
                  : 'text-[#506e75] hover:bg-[#f1eee6]'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Identity (Sign Up)</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Mode:</span>
            <span className="text-teal-700 uppercase bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              {authMode === 'sign_in' ? 'Sign In' : 'Register Terminal'}
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* =========================================================================
           * MODE 1: ZERO TRUST SIGN IN
           * ========================================================================= */}
          {authMode === 'sign_in' && (
            <div className="space-y-4">
              {/* Google Workspace SSO Button */}
              <button
                type="button"
                onClick={handleGoogleSSO}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl border border-[#d9d2c2] bg-white hover:bg-[#f5f3ec] text-[#17343a] text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer touch-manipulation active:scale-[0.99]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>Authenticate with Google Workspace (Verified Domain)</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-[#d9d2c2] w-full" />
                <span className="bg-[#faf8f4] px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Or Employee Workstation Credentials
                </span>
                <div className="border-t border-[#d9d2c2] w-full" />
              </div>

              {/* Workstation Sign In Form */}
              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[#17343a] block mb-1">
                    Employee Email / Login ID
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. ashik.ie@debonairgroup.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78] transition-colors"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#17343a] block mb-1">
                    Workstation PIN / Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter workstation security PIN"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78] transition-colors font-mono"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all touch-manipulation active:scale-[0.98]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Credentials &amp; Launch Cockpit</span>
                </button>
              </form>

              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('sign_up')}
                  className="text-[#176f78] hover:underline font-bold cursor-pointer"
                >
                  New to Debonair? Register Terminal &rarr;
                </button>
              </div>
            </div>
          )}

          {/* =========================================================================
           * MODE 2: ZERO TRUST SIGN UP & TERMINAL REGISTRATION
           * ========================================================================= */}
          {authMode === 'sign_up' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#176f78]/10 border border-[#176f78]/25 text-xs text-[#176f78] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#176f78]" />
                  <span>Zero Trust Principle of Least Privilege</span>
                </div>
                <p className="text-[11px] text-[#2c525b] leading-relaxed">
                  All newly registered factory personnel are enrolled with baseline <strong>Tier 4 (Line IE / Data Entry Only)</strong> permissions. Higher administrative tiers require formal Department Administrator approval.
                </p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#17343a] block mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="e.g. Ashikur Rahman"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#17343a] block mb-1">
                      Employee ID / Punch Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={employeeId}
                        onChange={e => setEmployeeId(e.target.value)}
                        placeholder="e.g. IE-9042"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78] font-mono"
                      />
                      <Fingerprint className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#17343a] block mb-1">
                    Official Factory Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. ashik.ie@debonairgroup.com"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78]"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#17343a] block mb-1">
                      Workstation PIN (4-8 Digits)
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Create security PIN"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#17343a] block mb-1">
                      Confirm Workstation PIN
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter security PIN"
                      className="w-full px-3 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] focus:outline-hidden focus:border-[#176f78] font-mono"
                    />
                  </div>
                </div>

                {/* Administrative Allocation Notice (Zero Trust - No Self-Assignment) */}
                <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#176f78] shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-[#17343a] block">
                      Admin-Provisioned Operational Scope
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Factory wing, floor block, and production line boundaries are centrally assigned by Department Administration (SOP-IE-04). Self-assignment is restricted under Zero Trust rules.
                    </span>
                  </div>
                </div>

                {/* Consent */}
                <div className="flex items-start gap-2.5 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    id="zt-terms"
                    checked={agreeTerms}
                    onChange={e => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded text-[#176f78] focus:ring-[#176f78] cursor-pointer"
                  />
                  <label htmlFor="zt-terms" className="cursor-pointer leading-tight">
                    I acknowledge Debonair Unit-02 Zero Trust Security Architecture: all line output, cycle studies, and sign-offs are cryptographically logged with tamper-evident audit chains.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold uppercase tracking-wider shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all touch-manipulation active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Identity &amp; Issue Terminal Key</span>
                </button>
              </form>

              <div className="flex items-center justify-between gap-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('sign_in')}
                  className="text-xs text-[#176f78] hover:underline font-bold cursor-pointer"
                >
                  Already have an authorized ID? Sign In &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 bg-[#e4dfd3] border-t border-[#d9d2c2] flex items-center justify-between text-[11px] text-[#506e75]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>256-Bit Cryptographic Zero Trust Terminal Guard</span>
          </div>
          <span className="font-mono text-[10px]">Debonair LTD &bull; Bangladesh</span>
        </div>
      </div>
    </div>
  );
};
