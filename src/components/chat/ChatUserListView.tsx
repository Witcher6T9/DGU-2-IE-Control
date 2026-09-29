/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  ShieldCheck,
  MessageSquare,
  AtSign,
  Phone,
  Mail,
  Clock,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  X,
  UserCheck,
  Check,
  Calculator,
  Wrench,
  ShieldAlert,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ChatUserMember, UserProfile } from '../../types';

interface ChatUserListViewProps {
  members: ChatUserMember[];
  profile: UserProfile;
  myStatus: 'online' | 'busy' | 'on_floor' | 'offline';
  myStatusNote: string;
  onUpdateMyStatus: (status: 'online' | 'busy' | 'on_floor' | 'offline', note: string) => void;
  onSelectMemberForCard: (member: ChatUserMember) => void;
  onStartDirectMessage: (memberId: string) => void;
  onMentionMember: (memberName: string) => void;
}

export type UserStatusFilter = 'all' | 'online' | 'on_floor' | 'busy' | 'offline';
export type UserDeptFilter = 'all' | 'IE' | 'Production' | 'Maintenance' | 'Quality' | 'Floor Management';

export const ChatUserListView: React.FC<ChatUserListViewProps> = ({
  members,
  profile,
  myStatus,
  myStatusNote,
  onUpdateMyStatus,
  onSelectMemberForCard,
  onStartDirectMessage,
  onMentionMember
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all');
  const [deptFilter, setDeptFilter] = useState<UserDeptFilter>('all');
  const [isEditingMyPresence, setIsEditingMyPresence] = useState(false);
  const [tempPresenceNote, setTempPresenceNote] = useState(myStatusNote);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: members.length,
      online: members.filter(m => m.status === 'online').length,
      on_floor: members.filter(m => m.status === 'on_floor').length,
      busy: members.filter(m => m.status === 'busy').length,
      offline: members.filter(m => m.status === 'offline').length
    };
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Status filter
      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }
      // Department filter
      if (deptFilter !== 'all' && m.department !== deptFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesRole = m.role.toLowerCase().includes(q);
        const matchesDept = m.department.toLowerCase().includes(q);
        const matchesLine = m.assignedLine?.toLowerCase().includes(q);
        const matchesSpec = m.specialization?.toLowerCase().includes(q);
        const matchesBadge = m.badgeNumber?.toLowerCase().includes(q);
        const matchesStatus = m.statusMessage?.toLowerCase().includes(q);
        return matchesName || matchesRole || matchesDept || matchesLine || matchesSpec || matchesBadge || matchesStatus;
      }
      return true;
    });
  }, [members, statusFilter, deptFilter, searchQuery]);

  const copyContact = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const getStatusVisuals = (status: string) => {
    switch (status) {
      case 'online':
        return {
          label: 'Online',
          pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dotBg: 'bg-emerald-500',
          pulse: true
        };
      case 'on_floor':
        return {
          label: 'On Floor',
          pillBg: 'bg-sky-50 text-sky-800 border-sky-300',
          dotBg: 'bg-sky-500',
          pulse: false
        };
      case 'busy':
        return {
          label: 'Busy / In Study',
          pillBg: 'bg-amber-50 text-amber-900 border-amber-300',
          dotBg: 'bg-amber-500',
          pulse: false
        };
      case 'offline':
      default:
        return {
          label: 'Offline',
          pillBg: 'bg-slate-100 text-slate-600 border-slate-300',
          dotBg: 'bg-slate-400',
          pulse: false
        };
    }
  };

  const getDeptBadge = (dept: string) => {
    switch (dept) {
      case 'IE':
        return { bg: 'bg-teal-100 text-teal-800 border-teal-300', icon: Calculator, label: 'IE Dept' };
      case 'Production':
        return { bg: 'bg-blue-100 text-blue-800 border-blue-300', icon: Layers, label: 'Production' };
      case 'Maintenance':
        return { bg: 'bg-amber-100 text-amber-900 border-amber-300', icon: Wrench, label: 'Maintenance' };
      case 'Quality':
        return { bg: 'bg-purple-100 text-purple-900 border-purple-300', icon: ShieldAlert, label: 'Quality' };
      case 'Floor Management':
      default:
        return { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', icon: Users, label: 'Floor Mgmt' };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#fbfaf6] overflow-hidden">
      {/* Top Presence & Quick Stats Bar */}
      <div className="p-3 sm:p-4 bg-white border-b border-[#e7e1d5] shrink-0 space-y-3">
        {/* Self Presence Widget */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-[#dceceb]/60 via-[#f5f3ec] to-[#fbfaf6] border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={profile.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E'}
                alt={profile.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                  myStatus === 'online'
                    ? 'bg-emerald-500 animate-pulse'
                    : myStatus === 'on_floor'
                    ? 'bg-sky-500'
                    : myStatus === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-[#17343a] truncate">{profile.name || 'Ashik Hossain'}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#176f78] text-white">
                  {profile.jobTitle || 'Senior IE Lead'}
                </span>
              </div>
              <div className="text-[11px] text-[#527078] flex items-center gap-1.5 truncate">
                <span className="font-semibold capitalize text-[#176f78]">• {myStatus.replace('_', ' ')}:</span>
                <span className="italic truncate">{myStatusNote || 'Active in Cockpit'}</span>
              </div>
            </div>
          </div>

          {/* Presence Switcher Pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 self-start sm:self-auto shrink-0 flex-wrap">
            {(['online', 'on_floor', 'busy', 'offline'] as const).map(s => {
              const isActive = myStatus === s;
              const visuals = getStatusVisuals(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdateMyStatus(s, myStatusNote)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-xl text-xs sm:text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                    isActive
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'bg-white text-[#527078] border border-[#d9d2c2] hover:bg-[#f1eee6]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : visuals.dotBg}`} />
                  <span className="capitalize">{s === 'on_floor' ? 'Floor' : s}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setIsEditingMyPresence(!isEditingMyPresence)}
              className="min-h-[32px] px-2 py-1 rounded-xl text-slate-600 hover:text-[#176f78] bg-white text-xs border border-[#d9d2c2] font-semibold cursor-pointer active:scale-95 flex items-center gap-1"
              title="Edit status message"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] hidden xs:inline sm:inline">Note</span>
            </button>
          </div>
        </div>

        {/* Presence Note Editor Popover */}
        {isEditingMyPresence && (
          <div className="p-2.5 rounded-xl bg-white border border-[#d9d2c2] shadow-sm space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#17343a]">
              <span>Set Your Current Status Note</span>
              <button
                type="button"
                onClick={() => setIsEditingMyPresence(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempPresenceNote}
                onChange={e => setTempPresenceNote(e.target.value)}
                placeholder="e.g. Conducting Line 18 Takt Study..."
                className="flex-1 text-xs py-1.5 px-3 rounded-lg border border-[#d9d2c2] bg-[#fbfaf6] text-[#17343a] focus:outline-none focus:border-[#176f78]"
              />
              <button
                type="button"
                onClick={() => {
                  onUpdateMyStatus(myStatus, tempPresenceNote);
                  setIsEditingMyPresence(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#176f78] text-white text-xs font-bold cursor-pointer active:scale-95"
              >
                Save
              </button>
            </div>
            {/* Quick Status Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {[
                'Line 18 Bottleneck Study',
                'Pitch Diagram Audit',
                'In Morning Huddle',
                'DHU 7/0 Quality Check',
                'Overlock Needle Calibration'
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTempPresenceNote(preset)}
                  className="px-2 py-0.5 rounded-md bg-[#f1eee6] hover:bg-[#e5e0d3] text-[10px] text-[#17343a] whitespace-nowrap cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar & Summary Filter Chips */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search team members by name, role, line, specialization, badge..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-xs sm:text-sm bg-[#fbfaf6] border border-[#d9d2c2] text-[#17343a] placeholder:text-slate-400 focus:outline-none focus:border-[#176f78] focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Breakdown Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {[
              { id: 'all', label: 'All Members', count: statusCounts.all, dot: 'bg-slate-400' },
              { id: 'online', label: 'Online', count: statusCounts.online, dot: 'bg-emerald-500' },
              { id: 'on_floor', label: 'On Floor', count: statusCounts.on_floor, dot: 'bg-sky-500' },
              { id: 'busy', label: 'Busy / Study', count: statusCounts.busy, dot: 'bg-amber-500' },
              { id: 'offline', label: 'Offline', count: statusCounts.offline, dot: 'bg-slate-400' }
            ].map(pill => {
              const isSelected = statusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setStatusFilter(pill.id as UserStatusFilter)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'bg-white text-[#527078] hover:bg-[#f1eee6] border border-[#e7e1d5]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : pill.dot}`} />
                  <span>{pill.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono-numbers ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#e5e0d3] text-[#17343a]'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Department Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-[11px]">
            <span className="text-[10px] font-bold text-[#527078] uppercase shrink-0">Dept:</span>
            {[
              { id: 'all', label: 'All Departments' },
              { id: 'IE', label: '📐 IE Division' },
              { id: 'Production', label: '🏭 Production' },
              { id: 'Maintenance', label: '🔧 Maintenance' },
              { id: 'Quality', label: '🛡️ Quality' },
              { id: 'Floor Management', label: '📋 Floor Mgmt' }
            ].map(d => {
              const isSelected = deptFilter === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDeptFilter(d.id as UserDeptFilter)}
                  className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95 flex items-center ${
                    isSelected
                      ? 'bg-[#17343a] text-white shadow-2xs font-bold'
                      : 'bg-[#f1eee6] text-[#527078] hover:text-[#17343a]'
                  }`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Cards Scrollable Stream */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 sm:px-4 sm:py-4 min-h-0 overscroll-y-contain scroll-smooth -webkit-overflow-scrolling-touch pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {filteredMembers.length === 0 ? (
          <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-6 text-[#527078]">
            <Users className="w-10 h-10 mb-2 opacity-30 text-[#176f78]" />
            <p className="font-bold text-sm text-[#17343a]">No team members match this criteria</p>
            <p className="text-xs max-w-sm mt-1">
              Try adjusting your search query or reset the status/department filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setDeptFilter('all');
              }}
              className="mt-3 min-h-[44px] px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold cursor-pointer active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
            {filteredMembers.map(member => {
              const statusVisuals = getStatusVisuals(member.status);
              const deptVisuals = getDeptBadge(member.department);
              const DeptIcon = deptVisuals.icon;

              return (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-[#d9d2c2] p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 group relative"
                >
                  {/* Top Row: Avatar + Identity + Status Pill */}
                  <div className="flex items-start justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSelectMemberForCard(member)}
                      className="flex items-start gap-3 min-w-0 text-left flex-1 cursor-pointer"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={member.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E'}
                          alt={member.name}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-xs group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
                            statusVisuals.dotBg
                          } ${statusVisuals.pulse ? 'animate-pulse' : ''}`}
                          title={`Status: ${member.status}`}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-[#17343a] group-hover:text-[#176f78] transition-colors truncate">
                            {member.name}
                          </h4>
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        </div>
                        <p className="text-xs text-[#527078] font-medium leading-tight truncate">
                          {member.role}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${deptVisuals.bg}`}
                          >
                            <DeptIcon className="w-2.5 h-2.5" />
                            <span>{deptVisuals.label}</span>
                          </span>
                          {member.badgeNumber && (
                            <span className="text-[10px] text-slate-500 font-mono-numbers">
                              #{member.badgeNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Status Pill Badge */}
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${statusVisuals.pillBg}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusVisuals.dotBg}`} />
                        <span>{statusVisuals.label}</span>
                      </span>
                      {member.lastActive && member.status !== 'online' && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          {member.lastActive}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Row: Status Activity Note */}
                  {member.statusMessage && (
                    <div className="p-2 rounded-xl bg-teal-50/70 border border-teal-200/60 text-[11px] text-[#17343a] flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#176f78] shrink-0 mt-0.5" />
                      <span className="italic leading-snug line-clamp-2">{member.statusMessage}</span>
                    </div>
                  )}

                  {/* Details Matrix: Assigned Line + Shift + Specialization */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1 border-t border-[#e7e1d5]/60 text-[#527078]">
                    <div className="truncate">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Assigned Sector:</span>
                      <span className="font-semibold text-[#17343a] flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-[#176f78] shrink-0" />
                        <span className="truncate">{member.assignedLine || 'All Floors'}</span>
                      </span>
                    </div>
                    <div className="truncate">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Shift Timing:</span>
                      <span className="font-semibold text-[#17343a] flex items-center gap-1 truncate">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{member.shift?.split('(')[0] || 'General'}</span>
                      </span>
                    </div>
                    {member.specialization && (
                      <div className="col-span-2 truncate">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Specialization:</span>
                        <span className="font-medium text-[#17343a] text-[10px] truncate block">
                          {member.specialization}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons (44px Minimum Touch Target on Mobile) */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#e7e1d5]">
                    {/* 1. Direct Message */}
                    <button
                      type="button"
                      onClick={() => onStartDirectMessage(member.id)}
                      className="min-h-[42px] flex-1 py-2 px-3 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>

                    {/* 2. @ Mention Tag */}
                    <button
                      type="button"
                      onClick={() => onMentionMember(member.name)}
                      className="min-h-[42px] px-3 py-2 rounded-xl bg-[#dceceb] hover:bg-[#cae3e2] text-[#176f78] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title={`Mention @${member.name} in chat`}
                    >
                      <AtSign className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tag</span>
                    </button>

                    {/* 3. Phone / Intercom (if available) */}
                    {member.phone && (
                      <button
                        type="button"
                        onClick={() => copyContact(member.phone!, member.id)}
                        className="min-h-[42px] px-2.5 py-2 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-slate-600 hover:text-[#17343a] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                        title={copiedId === member.id ? 'Copied phone!' : `Copy phone: ${member.phone}`}
                      >
                        {copiedId === member.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    )}

                    {/* 4. Full Profile Modal */}
                    <button
                      type="button"
                      onClick={() => onSelectMemberForCard(member)}
                      className="min-h-[42px] px-2.5 py-2 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-slate-600 hover:text-[#17343a] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                      title="View full engineer details"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
