/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enterprise Workspace Switcher Header Component
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Factory,
  ChevronDown,
  Crown,
  Check,
  Plus,
  Shield,
  Users,
  Settings,
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { EnterpriseWorkspace, UserProfile } from '../../types';
import {
  getStoredEnterpriseWorkspaces,
  getActiveEnterpriseWorkspace,
  setActiveEnterpriseWorkspace,
  isCurrentUserWorkspaceOwner,
  getUserWorkspaceRole
} from '../../utils/enterpriseWorkspaceManager';

interface EnterpriseWorkspaceSwitcherProps {
  profile?: UserProfile;
  onOpenWorkspaceManager?: (initialTab?: 'registry' | 'ownership' | 'members' | 'create') => void;
  className?: string;
}

export const EnterpriseWorkspaceSwitcher: React.FC<EnterpriseWorkspaceSwitcherProps> = ({
  profile,
  onOpenWorkspaceManager,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<EnterpriseWorkspace[]>(() => getStoredEnterpriseWorkspaces());
  const [activeWorkspace, setActiveWorkspace] = useState<EnterpriseWorkspace>(() => getActiveEnterpriseWorkspace());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state on workspace changes
  useEffect(() => {
    const handleUpdate = () => {
      setWorkspaces(getStoredEnterpriseWorkspaces());
      setActiveWorkspace(getActiveEnterpriseWorkspace());
    };

    window.addEventListener('debonair:workspaces_updated', handleUpdate);
    window.addEventListener('debonair:workspace_switched', handleUpdate);

    return () => {
      window.removeEventListener('debonair:workspaces_updated', handleUpdate);
      window.removeEventListener('debonair:workspace_switched', handleUpdate);
    };
  }, []);

  // Dismiss on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectWorkspace = (ws: EnterpriseWorkspace) => {
    setActiveEnterpriseWorkspace(ws.id);
    setActiveWorkspace(ws);
    setIsOpen(false);
  };

  const isOwner = isCurrentUserWorkspaceOwner(activeWorkspace, profile);
  const userRole = getUserWorkspaceRole(activeWorkspace, profile);

  return (
    <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        id="top-workspace-switcher-btn"
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Enterprise Workspace: ${activeWorkspace.name}\nOwner: ${activeWorkspace.ownerName} (${activeWorkspace.ownerEmail})\nClick to switch enterprise or manage ownership`}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#176f78]/30 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 hover:border-[#176f78] shadow-2xs hover:shadow-xs transition-all cursor-pointer group touch-manipulation active:scale-[0.98]"
      >
        {/* Brand Dot / Icon */}
        <div
          className="w-6 h-6 rounded-lg text-white flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105"
          style={{ backgroundColor: activeWorkspace.brandColor || '#176f78' }}
        >
          {activeWorkspace.logoIcon === 'Building2' ? (
            <Building2 className="w-3.5 h-3.5" />
          ) : activeWorkspace.logoIcon === 'Layers' ? (
            <Layers className="w-3.5 h-3.5" />
          ) : (
            <Factory className="w-3.5 h-3.5" />
          )}
        </div>

        {/* Text Details */}
        <div className="flex flex-col text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-none">
              Enterprise
            </span>
            {isOwner ? (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300 leading-none">
                <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                <span>Owner</span>
              </span>
            ) : (
              <span className="text-[9px] font-bold text-[#176f78] dark:text-teal-400 capitalize leading-none">
                {userRole.replace('_', ' ')}
              </span>
            )}
          </div>
          <span className="font-bold text-xs text-[#17343a] dark:text-slate-100 group-hover:text-[#176f78] dark:group-hover:text-teal-300 transition-colors max-w-[120px] sm:max-w-[170px] truncate leading-tight mt-0.5">
            {activeWorkspace.name}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#176f78]' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="top-workspace-switcher-dropdown"
          className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#18202b] border border-[#d9d2c2] dark:border-[#2e3b4d] shadow-[0_16px_40px_rgba(0,0,0,0.18)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 select-none"
        >
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
              <Building2 className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
              <span>Enterprise Workspaces</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {workspaces.length} Registered
            </span>
          </div>

          {/* List of Workspaces */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {workspaces.map(ws => {
              const isActive = ws.id === activeWorkspace.id;
              const userIsOwnerOfThis = isCurrentUserWorkspaceOwner(ws, profile);
              const roleInThis = getUserWorkspaceRole(ws, profile);

              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2.5 cursor-pointer touch-manipulation border ${
                    isActive
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-[#176f78]/30 ring-1 ring-[#176f78]/20'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                      style={{ backgroundColor: ws.brandColor || '#176f78' }}
                    >
                      {ws.logoIcon === 'Building2' ? (
                        <Building2 className="w-4 h-4" />
                      ) : ws.logoIcon === 'Layers' ? (
                        <Layers className="w-4 h-4" />
                      ) : (
                        <Factory className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {ws.name}
                        </span>
                        {userIsOwnerOfThis ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                            <Crown className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                            <span>Owner</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-500 capitalize">
                            {roleInThis.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {ws.industrySector} · {ws.plants?.length || 0} Plants · Owner: {ws.ownerName}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="w-5 h-5 rounded-full bg-[#176f78] text-white flex items-center justify-center shrink-0 mt-1">
                      <Check className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Actions Footer */}
          <div className="pt-2 mt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 px-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenWorkspaceManager?.('create');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-[#176f78] dark:text-teal-400 hover:text-[#125860] dark:hover:text-teal-300 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>New Enterprise</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenWorkspaceManager?.('ownership');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Ownership &amp; Hub</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
