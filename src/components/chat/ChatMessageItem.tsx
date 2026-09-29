/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Tag,
  AtSign,
  Check,
  CheckCheck,
  MessageSquare,
  AlertCircle,
  Pin,
  Star,
  CornerUpLeft,
  FileText,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  BarChart2
} from 'lucide-react';
import { UserChatMessage, ChatUserMember } from '../../types';
import { ChatMentionGroup } from '../../data/userChatData';
import { WhatsAppVoiceNotePlayer } from './WhatsAppVoiceNotePlayer';

interface ChatMessageItemProps {
  msg: UserChatMessage;
  isSelf: boolean;
  currentUserId: string;
  currentUserName: string;
  allMembers: ChatUserMember[];
  allGroups: ChatMentionGroup[];
  onToggleReaction: (msgId: string, emoji: string) => void;
  onAcknowledgeAlert?: (msgId: string) => void;
  onMentionUser: (name: string) => void;
  onViewMemberProfile: (member: ChatUserMember) => void;
  onTogglePin?: (msgId: string) => void;
  onReply?: (msg: UserChatMessage) => void;
  onToggleStar?: (msgId: string) => void;
  onVotePoll?: (msgId: string, optionIndex: number) => void;
  onDeleteMsg?: (msgId: string) => void;
}

const AUTHOR_COLORS = [
  '#00a884',
  '#25d366',
  '#128c7e',
  '#34b7f1',
  '#e542a3',
  '#9c27b0',
  '#ff7a00',
  '#d32f2f'
];

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  isSelf,
  currentUserId,
  currentUserName,
  allMembers,
  allGroups,
  onToggleReaction,
  onAcknowledgeAlert,
  onMentionUser,
  onViewMemberProfile,
  onTogglePin,
  onReply,
  onToggleStar,
  onVotePoll,
  onDeleteMsg
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickReactions, setShowQuickReactions] = useState(false);

  // Check if current user is mentioned
  const normalizedContent = msg.content.toLowerCase();
  const isDirectlyMentioned =
    !isSelf &&
    (normalizedContent.includes(`@${currentUserName.toLowerCase()}`) ||
      (currentUserName.toLowerCase().includes('ashik') && normalizedContent.includes('@ashik')) ||
      normalizedContent.includes('@ie team') ||
      normalizedContent.includes('@all'));

  // Get consistent author name color for group chats
  const getAuthorColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AUTHOR_COLORS.length;
    return AUTHOR_COLORS[index];
  };

  // Parse text to identify mentions and format them into interactive badges
  const renderFormattedContent = (content: string) => {
    const mentionRegex = /(@[A-Za-z0-9. _-]+(?:\b|\s|$))/g;
    const parts = content.split(mentionRegex);

    return parts.map((part, index) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('@')) {
        const handleWithoutAt = trimmed.slice(1).trim();

        const matchedGroup = allGroups.find(
          g =>
            g.handle.toLowerCase() === trimmed.toLowerCase() ||
            g.name.toLowerCase() === handleWithoutAt.toLowerCase()
        );

        if (matchedGroup) {
          return (
            <span
              key={index}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold ${
                isSelf
                  ? 'bg-emerald-700/20 text-emerald-900 border border-emerald-500/30'
                  : 'bg-emerald-50 text-[#008069] border border-emerald-200'
              }`}
            >
              <AtSign className="w-2.5 h-2.5" />
              <span>{matchedGroup.name}</span>
            </span>
          );
        }

        const matchedMember = allMembers.find(
          m =>
            m.name.toLowerCase() === handleWithoutAt.toLowerCase() ||
            m.name.toLowerCase().startsWith(handleWithoutAt.toLowerCase())
        );

        if (matchedMember) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onViewMemberProfile(matchedMember)}
              title={`View ${matchedMember.name} profile`}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md text-[11px] font-bold cursor-pointer transition-transform hover:scale-105 ${
                isSelf
                  ? 'bg-emerald-800/15 text-emerald-900 border border-emerald-400/30'
                  : 'bg-teal-50 text-[#00a884] border border-teal-200 hover:bg-teal-100'
              }`}
            >
              <AtSign className="w-2.5 h-2.5" />
              <span>{matchedMember.name}</span>
            </button>
          );
        }

        return (
          <span
            key={index}
            className={`inline-flex items-center gap-0.5 px-1 py-0.2 mx-0.5 rounded font-bold ${
              isSelf ? 'bg-emerald-900/10 text-emerald-900' : 'bg-slate-100 text-[#008069]'
            }`}
          >
            {part}
          </span>
        );
      }

      return <span key={index}>{part}</span>;
    });
  };

  const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🎯', '🔥'];

  // Check reactions count
  const reactionEntries = Object.entries(msg.reactions || {}).filter(([_, ids]) => ids.length > 0);

  return (
    <div
      className={`relative group flex flex-col mb-1.5 px-2 sm:px-4 ${
        isSelf ? 'items-end' : 'items-start'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowQuickReactions(false);
      }}
    >
      {/* WhatsApp Message Bubble Container */}
      <div className="relative max-w-[85%] sm:max-w-[70%]">
        {/* WhatsApp Bubble Tail SVG */}
        {isSelf ? (
          <svg
            viewBox="0 0 8 13"
            width="8"
            height="13"
            className="absolute -right-2 top-0 text-[#d9fdd3] fill-current drop-shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          >
            <path d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 8 13"
            width="8"
            height="13"
            className="absolute -left-2 top-0 text-white fill-current drop-shadow-[0_1px_0.5px_rgba(11,20,26,0.13)]"
          >
            <path d="M1.533 3.568L8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z" />
          </svg>
        )}

        {/* Bubble Body */}
        <div
          className={`relative rounded-2xl px-3 pt-2 pb-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] transition-all ${
            isSelf
              ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
              : 'bg-white text-[#111b21] rounded-tl-none'
          } ${isDirectlyMentioned ? 'ring-2 ring-emerald-500' : ''}`}
        >
          {/* Author Name in Group Chats (for incoming messages) */}
          {!isSelf && (
            <div className="flex items-center justify-between gap-3 mb-1">
              <button
                type="button"
                onClick={() => {
                  const member = allMembers.find(m => m.id === msg.senderId);
                  if (member) onViewMemberProfile(member);
                }}
                style={{ color: getAuthorColor(msg.senderName) }}
                className="font-bold text-xs hover:underline text-left cursor-pointer flex items-center gap-1.5"
              >
                <span>{msg.senderName}</span>
                {msg.senderRole && (
                  <span className="text-[10px] text-[#667781] font-normal">
                    • {msg.senderRole}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Quoted Reply Preview Block */}
          {msg.replyTo && (
            <div
              className={`mb-2 p-2 rounded-xl text-xs flex flex-col border-l-4 ${
                isSelf
                  ? 'bg-emerald-800/10 border-emerald-600'
                  : 'bg-slate-100 border-[#00a884]'
              }`}
            >
              <span className="font-bold text-[11px] text-[#00a884]">
                {msg.replyTo.senderName}
              </span>
              <p className="text-[11px] text-[#54656f] truncate mt-0.5">
                {msg.replyTo.content}
              </p>
            </div>
          )}

          {/* Tagged Shop Floor Line Badge */}
          {msg.taggedLine && (
            <div className="mb-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
              <Tag className="w-3 h-3 text-amber-700" />
              <span>{msg.taggedLine}</span>
              {msg.taggedStation && <span className="opacity-80">• {msg.taggedStation}</span>}
            </div>
          )}

          {/* Voice Note Audio Player */}
          {msg.voiceNote ? (
            <WhatsAppVoiceNotePlayer
              durationSec={msg.voiceNote.durationSec}
              wavePeaks={msg.voiceNote.wavePeaks}
              senderAvatar={msg.senderAvatar}
              isSelf={isSelf}
            />
          ) : null}

          {/* Media Attachment (Photo or Document) */}
          {msg.mediaAttachment && (
            <div className="my-1.5">
              {msg.mediaAttachment.type === 'image' ? (
                <div className="rounded-xl overflow-hidden max-w-[280px] bg-slate-100 border border-black/10">
                  <img
                    src={msg.mediaAttachment.url}
                    alt={msg.mediaAttachment.name}
                    className="w-full max-h-56 object-cover"
                  />
                  {msg.mediaAttachment.caption && (
                    <p className="p-2 text-xs text-[#111b21]">
                      {msg.mediaAttachment.caption}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-black/5 hover:bg-black/10 border border-black/10 transition-colors">
                  <div className="p-2 rounded-lg bg-[#00a884] text-white">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold text-[#111b21] truncate">
                      {msg.mediaAttachment.name}
                    </p>
                    <p className="text-[10px] text-[#667781]">
                      {msg.mediaAttachment.size || 'Document'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-black/10 text-[#54656f] cursor-pointer"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Interactive Shop-Floor Poll */}
          {msg.poll && (
            <div className="my-2 p-3 rounded-2xl bg-white/80 border border-black/10 shadow-2xs space-y-2.5 min-w-[220px]">
              <div className="flex items-center gap-1.5 text-[#008069] font-bold text-xs">
                <BarChart2 className="w-4 h-4" />
                <span>{msg.poll.question}</span>
              </div>

              <div className="space-y-1.5">
                {msg.poll.options.map((opt, optIdx) => {
                  const totalVotes = msg.poll?.options.reduce((sum, o) => sum + o.votes.length, 0) || 0;
                  const votePct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                  const hasVoted = opt.votes.includes(currentUserId);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => onVotePoll && onVotePoll(msg.id, optIdx)}
                      className={`w-full text-left p-2 rounded-xl border relative overflow-hidden transition-all cursor-pointer ${
                        hasVoted
                          ? 'border-[#00a884] bg-emerald-50/60 font-bold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {/* Fill percentage bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-[#25d366]/20 transition-all duration-300"
                        style={{ width: `${votePct}%` }}
                      />
                      <div className="relative z-10 flex items-center justify-between text-xs">
                        <span className="text-[#111b21]">{opt.text}</span>
                        <span className="text-[11px] text-[#667781] font-mono">
                          {votePct}% ({opt.votes.length})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Standard Text Content (if not just voice note) */}
          {(!msg.voiceNote || msg.content !== '🎤 Voice message') && (
            <div className="text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap">
              {renderFormattedContent(msg.content)}
            </div>
          )}

          {/* Message Footer: Timestamp, Star, Delivery Status Ticks */}
          <div className="flex items-center justify-end gap-1 mt-1 text-[11px] text-[#667781] select-none">
            {msg.isPinned && (
              <span title="Pinned message">
                <Pin className="w-3 h-3 text-[#008069] fill-[#008069]" />
              </span>
            )}

            {msg.isStarred && (
              <span title="Starred message">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              </span>
            )}

            <span className="text-[10px] font-mono leading-none tracking-tight">
              {msg.timestamp}
            </span>

            {/* WhatsApp Blue Delivery Double-Ticks for Self */}
            {isSelf && (
              <span className="inline-flex items-center ml-0.5" title="Read by team">
                {msg.deliveryStatus === 'sent' ? (
                  <Check className="w-3.5 h-3.5 text-[#8696a0]" />
                ) : msg.deliveryStatus === 'delivered' ? (
                  <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* WhatsApp Floating Reactions Pill at bottom edge */}
        {reactionEntries.length > 0 && (
          <div
            className={`absolute -bottom-2.5 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full shadow-md border border-[#e9edef] text-[11px] z-10 ${
              isSelf ? 'right-2' : 'left-2'
            }`}
          >
            {reactionEntries.map(([emoji, ids]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onToggleReaction(msg.id, emoji)}
                className="hover:scale-125 transition-transform flex items-center gap-0.5 cursor-pointer"
                title={`${ids.length} reaction`}
              >
                <span>{emoji}</span>
                {ids.length > 1 && <span className="text-[9px] font-bold text-[#667781]">{ids.length}</span>}
              </button>
            ))}
          </div>
        )}

        {/* WhatsApp Hover Action Toolbar */}
        {isHovered && (
          <div
            className={`absolute -top-4.5 z-20 flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-lg border border-[#e9edef] text-[#54656f] animate-in fade-in zoom-in-95 ${
              isSelf ? 'right-4' : 'left-4'
            }`}
          >
            {/* Quick Reactions */}
            <div className="flex items-center gap-0.5 pr-1 border-r border-[#e9edef]">
              {QUICK_REACTION_EMOJIS.slice(0, 4).map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction(msg.id, emoji)}
                  className="hover:scale-130 transition-transform p-0.5 text-xs cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Reply */}
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(msg)}
                className="p-1 hover:text-[#00a884] hover:bg-[#f0f2f5] rounded-full transition-colors cursor-pointer"
                title="Reply"
              >
                <CornerUpLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Star */}
            {onToggleStar && (
              <button
                type="button"
                onClick={() => onToggleStar(msg.id)}
                className={`p-1 hover:bg-[#f0f2f5] rounded-full transition-colors cursor-pointer ${
                  msg.isStarred ? 'text-amber-500 fill-amber-500' : 'hover:text-amber-500'
                }`}
                title={msg.isStarred ? 'Unstar' : 'Star'}
              >
                <Star className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Pin */}
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(msg.id)}
                className={`p-1 hover:bg-[#f0f2f5] rounded-full transition-colors cursor-pointer ${
                  msg.isPinned ? 'text-[#00a884]' : 'hover:text-[#00a884]'
                }`}
                title={msg.isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Delete */}
            {onDeleteMsg && (
              <button
                type="button"
                onClick={() => onDeleteMsg(msg.id)}
                className="p-1 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                title="Delete message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
