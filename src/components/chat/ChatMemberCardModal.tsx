/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Mail,
  ShieldCheck,
  AtSign,
  MessageSquare,
  Layers,
  Clock,
  CheckCircle2,
  Sliders,
  Calculator,
  UserCheck,
  Phone,
  Copy,
  Check,
  MapPin,
  Sparkles
} from 'lucide-react';
import { ChatUserMember } from '../../types';

interface ChatMemberCardModalProps {
  member: ChatUserMember | null;
  onClose: () => void;
  onMentionMember: (memberName: string) => void;
  onStartDirectMessage: (memberId: string) => void;
}

export const ChatMemberCardModal: React.FC<ChatMemberCardModalProps> = ({
  member,
  onClose,
  onMentionMember,
  onStartDirectMessage
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!member) return null;

  const isIe = member.department === 'IE';

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const getStatusBadge = () => {
    switch (member.status) {
      case 'online':
        return {
          label: 'Active Online',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-500',
          ring: 'ring-emerald-400'
        };
      case 'on_floor':
        return {
          label: 'On Shop Floor',
          color: 'bg-sky-100 text-sky-800 border-sky-300',
          dot: 'bg-sky-500',
          ring: 'ring-sky-400'
        };
      case 'busy':
        return {
          label: 'In Study / Busy',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
          ring: 'ring-amber-400'
        };
      case 'offline':
      default:
        return {
          label: member.lastActive ? `Offline (${member.lastActive})` : 'Offline',
          color: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          ring: 'ring-slate-300'
        };
    }
  };

  const statusInfo = getStatusBadge();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in pb-[calc(1rem+env(safe-area-inset-bottom))]"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-[#d9d2c2] w-full max-w-sm max-h-[90dvh] overflow-y-auto overscroll-contain cockpit-shell animate-in zoom-in-95">
        {/* Header banner */}
        <div
          className={`h-24 p-4 flex items-start justify-between relative ${
            isIe
              ? 'bg-gradient-to-r from-[#176f78] to-[#208a95] text-white'
              : member.department === 'Quality'
              ? 'bg-gradient-to-r from-purple-800 to-indigo-700 text-white'
              : member.department === 'Maintenance'
              ? 'bg-gradient-to-r from-amber-700 to-orange-800 text-white'
              : 'bg-gradient-to-r from-slate-700 to-slate-800 text-white'
          }`}
        >
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-xs">
            {isIe ? <Calculator className="w-3 h-3" /> : <Layers className="w-3 h-3" />}
            <span>{member.department} Division</span>
            {member.badgeNumber && (
              <span className="opacity-80 font-mono-numbers">• #{member.badgeNumber}</span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            aria-label="Close user profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Avatar & Identity details */}
        <div className="px-5 pb-5 -mt-10 relative">
          <div className="flex items-end justify-between mb-3">
            <div className="relative">
              <img
                src={member.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E'}
                alt={member.name}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <span
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${statusInfo.dot} ${
                  member.status === 'online' ? 'animate-pulse' : ''
                }`}
                title={`Status: ${member.status}`}
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs ${statusInfo.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                <span>{statusInfo.label}</span>
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-[#17343a]">{member.name}</h3>
              <ShieldCheck className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-xs font-semibold text-[#176f78]">{member.role}</p>

            {member.statusMessage && (
              <div className="mt-2 p-2 rounded-xl bg-teal-50/80 border border-teal-200/70 text-[11px] text-[#17343a] flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span className="italic leading-snug">{member.statusMessage}</span>
              </div>
            )}
          </div>

          {/* Departmental info matrix */}
          <div className="mt-3 p-3 rounded-2xl bg-[#f8f6f0] border border-[#e7e1d5] space-y-2 text-xs">
            {member.specialization && (
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-[#527078] uppercase tracking-wider">
                  Core Specialization / Focus:
                </span>
                <p className="font-medium text-[#17343a]">{member.specialization}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#e7e1d5]/60 text-[11px]">
              <div>
                <span className="text-[10px] text-[#527078] block">Assigned Sector:</span>
                <span className="font-bold text-[#17343a] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#176f78]" />
                  <span>{member.assignedLine || 'All Floors'}</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#527078] block">Shift Schedule:</span>
                <span className="font-bold text-[#17343a] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{member.shift || '08:00 - 17:00'}</span>
                </span>
              </div>
            </div>

            {/* Contact Rows */}
            <div className="space-y-1.5 pt-1.5 border-t border-[#e7e1d5]/60 text-[11px]">
              {member.phone && (
                <div className="flex items-center justify-between text-[#527078]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono-numbers text-[#17343a] font-medium truncate">{member.phone}</span>
                    {member.extension && (
                      <span className="px-1 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                        {member.extension}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(member.phone!, 'phone')}
                    className="p-1 rounded text-[#176f78] hover:bg-[#dceceb] transition-colors cursor-pointer"
                    title="Copy phone number"
                  >
                    {copiedField === 'phone' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}

              {member.email && (
                <div className="flex items-center justify-between text-[#527078]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-[#176f78] shrink-0" />
                    <span className="truncate text-[#17343a]">{member.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(member.email!, 'email')}
                    className="p-1 rounded text-[#176f78] hover:bg-[#dceceb] transition-colors cursor-pointer"
                    title="Copy email address"
                  >
                    {copiedField === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons with touch-friendly 44px height */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onMentionMember(member.name);
                onClose();
              }}
              className="min-h-[44px] py-2.5 px-3 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <AtSign className="w-4 h-4" />
              <span>@ Mention</span>
            </button>

            <button
              onClick={() => {
                onStartDirectMessage(member.id);
                onClose();
              }}
              className="min-h-[44px] py-2.5 px-3 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            >
              <MessageSquare className="w-4 h-4 text-[#176f78]" />
              <span>Direct Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
