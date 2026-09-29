/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Calendar,
  Clock,
  Download,
  Trash2,
  FileSpreadsheet,
  FileText,
  Pin,
  AlertTriangle,
  AtSign,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { UserChatMessage, ChatChannel, ChatUserMember } from '../../types';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: UserChatMessage[];
  channels: ChatChannel[];
  members: ChatUserMember[];
  currentChannelId: string;
  onSelectChannelAndJump: (channelId: string, messageId: string) => void;
  onClearHistory?: () => void;
  onRestoreDefaults?: () => void;
  onViewMemberProfile?: (member: ChatUserMember) => void;
}

export type HistoryDateFilter = 'all' | 'today' | 'yesterday' | 'older';

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  messages,
  channels,
  members,
  currentChannelId,
  onSelectChannelAndJump,
  onClearHistory,
  onRestoreDefaults,
  onViewMemberProfile
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<HistoryDateFilter>('all');
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedExport, setCopiedExport] = useState(false);

  if (!isOpen) return null;

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages
      .filter(m => {
        // Channel filter
        if (selectedChannelId !== 'all') {
          if (m.channelId !== selectedChannelId) return false;
        }

        // Urgent filter
        if (onlyUrgent && !m.isUrgent) return false;

        // Pinned filter
        if (onlyPinned && !m.isPinned) return false;

        // Date filter
        if (dateFilter !== 'all') {
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;
          const msgTime = m.createdAt || now;
          const diffDays = (now - msgTime) / oneDay;

          if (dateFilter === 'today' && diffDays > 1) return false;
          if (dateFilter === 'yesterday' && (diffDays <= 1 || diffDays > 2)) return false;
          if (dateFilter === 'older' && diffDays <= 2) return false;
        }

        // Search query (content, sender, tagged line, station, mentions)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchContent = m.content.toLowerCase().includes(q);
          const matchSender = m.senderName.toLowerCase().includes(q);
          const matchLine = m.taggedLine?.toLowerCase().includes(q);
          const matchStation = m.taggedStation?.toLowerCase().includes(q);
          const matchRole = m.senderRole?.toLowerCase().includes(q);
          return matchContent || matchSender || matchLine || matchStation || matchRole;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [messages, selectedChannelId, onlyUrgent, onlyPinned, dateFilter, searchQuery, sortOrder]);

  // Export handlers
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredMessages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `IE_Chat_History_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Channel', 'Sender', 'Role', 'Line', 'Station', 'Urgent', 'Pinned', 'Message'];
    const rows = filteredMessages.map(m => {
      const channelObj = channels.find(c => c.id === m.channelId);
      const chName = channelObj ? channelObj.name : m.channelId;
      return [
        `"${m.timestamp || ''}"`,
        `"${chName}"`,
        `"${m.senderName.replace(/"/g, '""')}"`,
        `"${(m.senderRole || '').replace(/"/g, '""')}"`,
        `"${m.taggedLine || ''}"`,
        `"${m.taggedStation || ''}"`,
        m.isUrgent ? 'YES' : 'NO',
        m.isPinned ? 'YES' : 'NO',
        `"${m.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `IE_Floor_Chat_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopySummary = () => {
    const summaryText = filteredMessages
      .slice(0, 30)
      .map(m => `[${m.timestamp}] [${m.senderName} - ${m.taggedLine || 'Floor'}]: ${m.content}`)
      .join('\n');

    navigator.clipboard.writeText(summaryText);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  return (
    <div
      id="chat-history-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="chat-history-modal-container"
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-[#e7e1d5] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-4 sm:px-6 py-3.5 bg-linear-to-r from-[#17343a] via-[#176f78] to-[#125860] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-teal-200">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">Shop Floor & IE Chat History</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-900/60 text-teal-200 border border-teal-500/30 font-mono-numbers">
                  {filteredMessages.length} of {messages.length} messages
                </span>
              </div>
              <p className="text-xs text-teal-100/80">
                Audit logs, cycle bottleneck dispatches, shift handovers & engineering records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
              title="Close history"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Search & Filter Toolbar */}
        <div className="p-3 sm:p-4 bg-[#f8f6f0] border-b border-[#e7e1d5] space-y-2.5 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search history by keyword, @mention, station, line, or sender..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#d9d2c2] rounded-xl text-[#17343a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176f78]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Channel Selector */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-[#527078] hidden sm:inline">Channel:</span>
              <select
                value={selectedChannelId}
                onChange={e => setSelectedChannelId(e.target.value)}
                className="text-xs bg-white border border-[#d9d2c2] rounded-xl px-2.5 py-2 text-[#17343a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#176f78]"
              >
                <option value="all">All Channels & DMs ({messages.length})</option>
                <optgroup label="IE Specialized Channels">
                  {channels
                    .filter(c => c.category === 'ie')
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        #{c.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Shop Floor Channels">
                  {channels
                    .filter(c => c.category !== 'ie' && c.category !== 'dm')
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        #{c.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Quick Filter Badges and Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-[#e7e1d5]/70">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Date Filters */}
              {(['all', 'today', 'yesterday', 'older'] as HistoryDateFilter[]).map(df => (
                <button
                  key={df}
                  type="button"
                  onClick={() => setDateFilter(df)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-colors cursor-pointer ${
                    dateFilter === df
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'bg-white border border-[#d9d2c2] text-slate-600 hover:bg-[#f1eee6]'
                  }`}
                >
                  {df === 'all' ? 'All Dates' : df}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />

              {/* Only Urgent */}
              <button
                type="button"
                onClick={() => setOnlyUrgent(!onlyUrgent)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  onlyUrgent
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-white border border-[#d9d2c2] text-slate-600 hover:text-rose-700'
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                <span>Urgent Alerts</span>
              </button>

              {/* Only Pinned */}
              <button
                type="button"
                onClick={() => setOnlyPinned(!onlyPinned)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  onlyPinned
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white border border-[#d9d2c2] text-slate-600 hover:text-amber-800'
                }`}
              >
                <Pin className="w-3 h-3 text-amber-600" />
                <span>Pinned Notices</span>
              </button>

              {/* Sort Order */}
              <button
                type="button"
                onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-white border border-[#d9d2c2] text-slate-600 hover:bg-[#f1eee6] flex items-center gap-1 cursor-pointer"
                title={`Sort by time (${sortOrder === 'desc' ? 'Newest first' : 'Oldest first'})`}
              >
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
              </button>
            </div>

            {/* Export & Actions Group */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handleCopySummary}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-[#d9d2c2] text-[#17343a] hover:bg-teal-50 hover:border-teal-400 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="Copy recent messages to clipboard"
              >
                {copiedExport ? <Check className="w-3 h-3 text-emerald-600" /> : <FileText className="w-3 h-3 text-[#176f78]" />}
                <span>{copiedExport ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#dceceb] text-[#176f78] hover:bg-[#cae3e2] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="Export as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3 h-3" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleExportJSON}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white border border-[#d9d2c2] text-[#17343a] hover:bg-slate-100 hidden sm:flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                title="Export raw JSON backup"
              >
                <Download className="w-3 h-3" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Message Log List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 min-h-[280px] bg-[#fbfaf6]">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#527078]">
              <History className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-bold text-sm text-[#17343a]">No chat records found matching filters</p>
              <p className="text-xs max-w-sm mt-1">
                Try clearing your search query or reset date and channel filters to view earlier messages.
              </p>
              {(searchQuery || selectedChannelId !== 'all' || dateFilter !== 'all' || onlyUrgent || onlyPinned) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedChannelId('all');
                    setDateFilter('all');
                    setOnlyUrgent(false);
                    setOnlyPinned(false);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#176f78] text-white hover:bg-[#125860] cursor-pointer"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            filteredMessages.map(msg => {
              const channelObj = channels.find(c => c.id === msg.channelId);
              const channelName = channelObj ? channelObj.name : msg.channelId.replace('dm_', '@');
              const isCurrentChannel = msg.channelId === currentChannelId;

              return (
                <div
                  key={msg.id}
                  id={`history-row-${msg.id}`}
                  className={`p-3 rounded-xl border transition-all hover:shadow-xs group ${
                    msg.isUrgent
                      ? 'bg-rose-50/70 border-rose-200'
                      : msg.isPinned
                      ? 'bg-amber-50/60 border-amber-200'
                      : 'bg-white border-[#e7e1d5] hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Avatar & Sender Name (Clickable to view member card) */}
                      <button
                        type="button"
                        onClick={() => {
                          const foundMember = members.find(m => m.id === msg.senderId || m.name === msg.senderName);
                          if (foundMember && onViewMemberProfile) {
                            onViewMemberProfile(foundMember);
                          }
                        }}
                        className="flex items-center gap-1.5 hover:opacity-85 cursor-pointer text-left group/sender"
                        title="View member profile"
                      >
                        {msg.senderAvatar ? (
                          <img
                            src={msg.senderAvatar}
                            alt={msg.senderName}
                            className="w-6 h-6 rounded-full object-cover border border-[#d9d2c2] group-hover/sender:ring-2 ring-teal-500"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#176f78] text-white text-[10px] font-bold flex items-center justify-center">
                            {msg.senderName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-bold text-xs text-[#17343a] group-hover/sender:underline text-left">
                          {msg.senderName}
                        </span>
                      </button>

                      {msg.senderRole && (
                        <span className="text-[10px] text-[#527078] hidden sm:inline">
                          ({msg.senderRole})
                        </span>
                      )}

                      {/* Channel Pill */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-[#17343a] border border-slate-200">
                        #{channelName}
                      </span>

                      {/* Tagged Line Badge */}
                      {msg.taggedLine && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                          {msg.taggedLine}
                        </span>
                      )}

                      {/* Station Badge */}
                      {msg.taggedStation && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 hidden md:inline">
                          {msg.taggedStation}
                        </span>
                      )}

                      {/* Urgent indicator */}
                      {msg.isUrgent && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-600 text-white uppercase tracking-wider">
                          Urgent
                        </span>
                      )}

                      {/* Pinned indicator */}
                      {msg.isPinned && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Pin className="w-2.5 h-2.5 fill-amber-600 text-amber-700" />
                          <span>Pinned</span>
                        </span>
                      )}
                    </div>

                    {/* Timestamp & Jump Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-500 font-mono-numbers">
                        {msg.timestamp}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectChannelAndJump(msg.channelId, msg.id);
                          onClose();
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-[#d9d2c2] text-[#176f78] hover:bg-[#dceceb] hover:border-teal-400 flex items-center gap-1 transition-all cursor-pointer shadow-2xs group-hover:bg-[#176f78] group-hover:text-white group-hover:border-transparent active:scale-95"
                        title="Jump to this message in channel stream"
                      >
                        <span>Jump</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="mt-2 text-xs text-[#17343a] leading-relaxed whitespace-pre-line pl-8">
                    {msg.content}
                  </div>

                  {/* Reactions summary if any */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className="mt-2 pl-8 flex items-center gap-1.5 flex-wrap">
                      {Object.entries(msg.reactions).map(([emoji, userIds]) => (
                        <span
                          key={emoji}
                          className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 border border-slate-200 text-slate-700"
                        >
                          <span>{emoji}</span>
                          <span className="font-bold">{userIds.length}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Storage and Management Info */}
        <footer className="px-4 sm:px-6 py-3 bg-[#f5f3ec] border-t border-[#e7e1d5] flex items-center justify-between text-xs text-[#527078] shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-[#17343a]">Synced to Local Cockpit Storage</span>
            <span>•</span>
            <span>Total Messages: {messages.length}</span>
          </div>

          <div className="flex items-center gap-2">
            {onRestoreDefaults && (
              <button
                type="button"
                onClick={onRestoreDefaults}
                className="text-[11px] font-bold text-[#176f78] hover:underline cursor-pointer"
                title="Reset mock sample messages to default"
              >
                Reset Default Samples
              </button>
            )}

            {onClearHistory && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear current chat history? Pinned notices and new messages will reset.')) {
                    onClearHistory();
                  }
                }}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1 ml-2"
                title="Clear local messages"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};
