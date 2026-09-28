/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AtSign, Users, Shield, Wrench, ShieldCheck, Sparkles, Check } from 'lucide-react';
import { ChatUserMember } from '../../types';
import { ChatMentionGroup } from '../../data/userChatData';

interface MentionSuggestionsMenuProps {
  query: string;
  members: ChatUserMember[];
  groups: ChatMentionGroup[];
  selectedIndex: number;
  onSelectMention: (mentionText: string) => void;
  onClose: () => void;
}

export const MentionSuggestionsMenu: React.FC<MentionSuggestionsMenuProps> = ({
  query,
  members,
  groups,
  selectedIndex,
  onSelectMention,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanQuery = query.toLowerCase().trim();

  // Filter groups
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(cleanQuery) ||
    g.handle.toLowerCase().includes(cleanQuery) ||
    g.department.toLowerCase().includes(cleanQuery)
  );

  // Filter individual members
  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(cleanQuery) ||
    m.role.toLowerCase().includes(cleanQuery) ||
    m.department.toLowerCase().includes(cleanQuery) ||
    (m.specialization && m.specialization.toLowerCase().includes(cleanQuery))
  );

  const totalItems = filteredGroups.length + filteredMembers.length;

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (totalItems === 0) {
    return (
      <div className="absolute bottom-full left-3 right-3 sm:right-auto sm:w-80 mb-2 p-3 bg-white rounded-2xl shadow-xl border border-[#d9d2c2] z-50 text-xs text-[#527078] flex items-center justify-between animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2">
          <AtSign className="w-4 h-4 text-slate-400" />
          <span>No matching members or groups for "@{query}"</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-[#176f78] hover:underline font-semibold"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute bottom-full left-3 right-3 sm:right-auto sm:w-96 mb-2 max-h-72 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#d9d2c2] z-50 divide-y divide-[#f1eee6] no-scrollbar animate-in fade-in slide-in-from-bottom-2"
    >
      {/* Header bar */}
      <div className="px-3 py-2 bg-[#f8f6f0] flex items-center justify-between sticky top-0 z-10 border-b border-[#e7e1d5]">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#17343a]">
          <AtSign className="w-3.5 h-3.5 text-[#176f78]" />
          <span>Mention Team Member or Group</span>
        </div>
        <span className="text-[10px] text-[#527078]">
          Use ↑↓ arrows & Enter to select
        </span>
      </div>

      {/* Group broadcast section */}
      {filteredGroups.length > 0 && (
        <div className="p-1.5 bg-[#fbfaf6]">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#527078] flex items-center gap-1">
            <Users className="w-3 h-3 text-[#176f78]" />
            <span>Department Broadcast Groups</span>
          </div>
          {filteredGroups.map((grp, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <button
                key={grp.id}
                type="button"
                data-selected={isSelected}
                onClick={() => onSelectMention(grp.handle)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#176f78] text-white shadow-2xs'
                    : 'text-[#17343a] hover:bg-[#f1eee6]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : grp.department === 'IE'
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    @
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>{grp.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#e5e0d3] text-[#17343a]'
                        }`}
                      >
                        {grp.badge}
                      </span>
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-teal-100' : 'text-[#527078]'
                      }`}
                    >
                      {grp.description}
                    </div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 shrink-0 text-teal-200" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Individual members section */}
      {filteredMembers.length > 0 && (
        <div className="p-1.5">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#527078]">
            Individual Team Members ({filteredMembers.length})
          </div>
          {filteredMembers.map((m, mIdx) => {
            const itemIndex = filteredGroups.length + mIdx;
            const isSelected = selectedIndex === itemIndex;
            const isIe = m.department === 'IE';

            return (
              <button
                key={m.id}
                type="button"
                data-selected={isSelected}
                onClick={() => onSelectMention(`@${m.name}`)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#176f78] text-white shadow-2xs'
                    : 'text-[#17343a] hover:bg-[#f1eee6]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={m.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E'}
                      alt={m.name}
                      className="w-7 h-7 rounded-full object-cover border border-white/60"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                        m.status === 'online'
                          ? 'bg-emerald-500'
                          : m.status === 'busy'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                      <span>{m.name}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : isIe
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {m.department}
                      </span>
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isSelected ? 'text-teal-100' : 'text-[#527078]'
                      }`}
                    >
                      {m.specialization || m.role}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {m.assignedLine && (
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded hidden sm:inline ${
                        isSelected ? 'bg-white/10 text-white' : 'bg-[#f1eee6] text-[#527078]'
                      }`}
                    >
                      {m.assignedLine}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-teal-200" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
