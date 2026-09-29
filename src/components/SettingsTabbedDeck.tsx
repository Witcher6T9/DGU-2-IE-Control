/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Factory,
  Sun,
  Volume2,
  Database,
  Lock,
  Smartphone,
  Layers,
  Search,
  X,
  ChevronRight,
  ShieldCheck,
  LucideIcon
} from 'lucide-react';
import type { SettingsCategory, SettingsPageSection } from './SettingsControlCenterPage';

interface TabCategoryItem {
  id: SettingsCategory;
  section: string;
  index: string;
  label: string;
  description: string;
  badge: string;
  icon: LucideIcon;
}

interface SettingsTabbedDeckProps {
  categories: TabCategoryItem[];
  activeCategory: SettingsCategory;
  onSelectCategory: (cat: SettingsCategory) => void;
  isSysAdmin: boolean;
  onNavigateToSection: (section: SettingsPageSection) => void;
  children: React.ReactNode;
}

export const SettingsTabbedDeck: React.FC<SettingsTabbedDeckProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
  isSysAdmin,
  onNavigateToSection,
  children
}) => {
  const [tabFilter, setTabFilter] = useState('');

  const filteredCategories = categories.filter(c =>
    !tabFilter.trim() ||
    c.label.toLowerCase().includes(tabFilter.toLowerCase()) ||
    c.badge.toLowerCase().includes(tabFilter.toLowerCase())
  );

  const activeCategoryObj = categories.find(c => c.id === activeCategory);

  return (
    <div className="space-y-4">
      {/* Top Horizontal Deck Tab Rail */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-2 sm:p-3 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 mb-2 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#176f78] dark:bg-teal-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200">
              Workspace Deck Modules
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4efe4] dark:bg-[#252e3b] text-[#527078] dark:text-slate-400">
              {categories.length} Available
            </span>
          </div>

          {/* Quick Deck Search */}
          <div className="relative w-full md:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={tabFilter}
              onChange={e => setTabFilter(e.target.value)}
              placeholder="Search tabs..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-xl bg-[#f8f6f0] dark:bg-[#141920] border border-[#d9d2c2] dark:border-[#2e3846] text-[#17343a] dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
            />
            {tabFilter && (
              <button
                type="button"
                onClick={() => setTabFilter('')}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Cards Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          {filteredCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className={`snap-start shrink-0 px-3.5 py-2.5 rounded-xl border text-left transition-all duration-150 cursor-pointer min-w-[170px] max-w-[210px] select-none ${
                  isActive
                    ? 'border-[#176f78] bg-[#176f78] text-white shadow-xs'
                    : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#171c23] hover:bg-white dark:hover:bg-[#202732] text-[#17343a] dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#ede7da] dark:bg-[#273240] text-[#176f78] dark:text-teal-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#e9e3d5] dark:bg-[#252f3d] text-[#527078] dark:text-slate-400'
                    }`}
                  >
                    {cat.badge}
                  </span>
                </div>
                <div className="text-xs font-bold truncate leading-tight">
                  {cat.label}
                </div>
                <p
                  className={`text-[10px] truncate mt-0.5 ${
                    isActive ? 'text-teal-100' : 'text-[#527078] dark:text-slate-400'
                  }`}
                >
                  {cat.description}
                </p>
              </button>
            );
          })}

          {isSysAdmin && (
            <button
              type="button"
              onClick={() => onNavigateToSection('tier_0')}
              className="snap-start shrink-0 px-3.5 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 transition-all text-left cursor-pointer min-w-[150px]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <span className="text-xs font-bold">Tier_0 Root</span>
              </div>
              <p className="text-[10px] text-amber-800/80 dark:text-amber-300/80 truncate">
                Privileged Infra
              </p>
            </button>
          )}
        </div>
      </div>

      {/* Active Stage Breadcrumb & Context Header */}
      {activeCategoryObj && (
        <div className="bg-[#f8f6f0] dark:bg-[#161b23] border border-[#e4decfa0] dark:border-[#273240] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#527078] dark:text-slate-500 font-bold">{activeCategoryObj.index}</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="font-bold text-[#17343a] dark:text-slate-100">{activeCategoryObj.label}</span>
            <span className="text-slate-400 dark:text-slate-600">·</span>
            <span className="text-[#527078] dark:text-slate-400 text-[11px] hidden sm:inline">{activeCategoryObj.description}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
            Deck Stage Active
          </span>
        </div>
      )}

      {/* Full-Width Workspace Deck Stage */}
      <main className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs">
        {children}
      </main>
    </div>
  );
};
