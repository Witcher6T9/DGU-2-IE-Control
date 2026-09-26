/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — IE Department
 * Google Chat (Google Workspace) Enterprise Floor Hub
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  Users,
  MessageSquare,
  AlertTriangle,
  Wrench,
  Clock,
  Flame,
  Check,
  Paperclip,
  Search,
  ChevronDown,
  Layers,
  ThumbsUp,
  RefreshCw,
  Sliders,
  Tag,
  Share2,
  Maximize2,
  Minimize2,
  Trash2,
  ShieldCheck,
  AtSign,
  Hash,
  Calculator,
  Compass,
  BarChart3,
  Target,
  Info,
  Pin,
  PinOff,
  Video,
  Smile,
  Mic,
  MoreVertical,
  Plus,
  FileText,
  Image,
  ExternalLink,
  Phone,
  Radio,
  Building2,
  CheckCircle2
} from 'lucide-react';
import {
  UserProfile,
  LineEntry,
  UserChatMessage,
  ChatChannel,
  ChatUserMember
} from '../types';
import {
  DEFAULT_CHAT_MEMBERS,
  CHAT_MENTION_GROUPS,
  DEFAULT_CHAT_CHANNELS,
  INITIAL_USER_CHAT_MESSAGES,
  QUICK_SHOP_FLOOR_CHIPS
} from '../data/userChatData';

export type GoogleChatTab = 'spaces' | 'dms' | 'meet' | 'gemini';
export type UserPresenceStatus = 'active' | 'away' | 'dnd' | 'on_floor';

export interface GoogleChatHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines?: LineEntry[];
  profile: UserProfile;
  initialTab?: GoogleChatTab;
}

export const GoogleChatHubModal: React.FC<GoogleChatHubModalProps> = ({
  isOpen,
  onClose,
  lines = [],
  profile,
  initialTab = 'spaces'
}) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<GoogleChatTab>(initialTab);
  const [activeChatId, setActiveChatId] = useState<string>('ie-line-balancing');
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [showSpaceDetails, setShowSpaceDetails] = useState(false);
  const [showLeftSidebarMobile, setShowLeftSidebarMobile] = useState(true);

  // Presence Status
  const [presence, setPresence] = useState<UserPresenceStatus>('active');
  const [statusMessage, setStatusMessage] = useState('Available • Floor 2 (Lines 07–12)');

  // Meet Huddle State
  const [isMeetModalOpen, setIsMeetModalOpen] = useState(false);
  const [meetRoomId, setMeetRoomId] = useState('deb-ie-unit02-floor');
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Team Messages State (persisted to localStorage)
  const [teamMessages, setTeamMessages] = useState<UserChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ie_google_chat_messages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_USER_CHAT_MESSAGES;
  });

  // Composer Input
  const [composerText, setComposerText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<UserChatMessage | null>(null);

  // AI Gemini Bot State
  const [geminiMessages, setGeminiMessages] = useState<Array<{ id: string; role: 'user' | 'model'; content: string; timestamp: string }>>([
    {
      id: 'g_ai_1',
      role: 'model',
      content: `Hello ${profile?.name || 'Engineer'}! 👋 I am your Google Workspace Gemini Assistant for Debonair Unit-02.\n\nI can calculate Standard Allowed Minutes (SAM), assist with line balancing, optimize bottleneck stations, and draft shift recovery reports. How can I help today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [geminiInputText, setGeminiInputText] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Save messages
  useEffect(() => {
    try {
      localStorage.setItem('ie_google_chat_messages_v1', JSON.stringify(teamMessages));
    } catch {}
  }, [teamMessages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChatId, teamMessages, activeTab]);

  if (!isOpen) return null;

  // Active chat object resolution
  const activeChannel = DEFAULT_CHAT_CHANNELS.find(c => c.id === activeChatId);
  const isDirectMessage = activeChatId.startsWith('dm_');
  const targetMemberId = isDirectMessage ? activeChatId.replace('dm_', '') : null;
  const activeMember = targetMemberId ? DEFAULT_CHAT_MEMBERS.find(m => m.id === targetMemberId) : null;

  const chatTitle = activeChannel ? activeChannel.name : activeMember ? activeMember.name : 'Google Chat Space';
  const chatSubtitle = activeChannel ? activeChannel.description : activeMember ? `${activeMember.role} • ${activeMember.assignedLine}` : '';

  // Filter messages for active chat
  const currentChatMessages = useMemo(() => {
    let filtered = teamMessages.filter(m => m.channelId === activeChatId);
    if (inChatSearchQuery.trim()) {
      const q = inChatSearchQuery.toLowerCase();
      filtered = filtered.filter(m => (m.content || '').toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q));
    }
    return filtered;
  }, [teamMessages, activeChatId, inChatSearchQuery]);

  // Spaces list filtered by search
  const filteredSpaces = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_CHAT_CHANNELS;
    const q = searchQuery.toLowerCase();
    return DEFAULT_CHAT_CHANNELS.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
  }, [searchQuery]);

  // Direct messages list filtered by search
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_CHAT_MEMBERS;
    const q = searchQuery.toLowerCase();
    return DEFAULT_CHAT_MEMBERS.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
  }, [searchQuery]);

  // Send message
  const handleSendMessage = () => {
    if (!composerText.trim()) return;

    const text = composerText.trim();
    const myId = profile.email || 'user_current';
    const newMsg: UserChatMessage = {
      id: `gc_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      channelId: activeChatId,
      senderId: myId,
      senderName: profile.name || 'IE Engineer',
      senderRole: profile.jobTitle || 'Industrial Engineer',
      senderDepartment: 'IE',
      content: text,
      createdAt: Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      reactions: {},
      deliveryStatus: 'delivered',
      replyTo: replyingToMessage
        ? {
            id: replyingToMessage.id,
            senderName: replyingToMessage.senderName,
            content: replyingToMessage.content
          }
        : undefined
    };

    setTeamMessages(prev => [...prev, newMsg]);
    setComposerText('');
    setReplyingToMessage(null);

    // If message starts with @Gemini, trigger bot response
    if (text.toLowerCase().includes('@gemini') || text.toLowerCase().includes('@ai')) {
      setTimeout(() => {
        const botReply: UserChatMessage = {
          id: `gc_ai_${Date.now()}`,
          channelId: activeChatId,
          senderId: 'bot_gemini_workspace',
          senderName: 'Gemini Workspace Bot',
          senderRole: 'AI Floor Optimization Agent',
          senderDepartment: 'Google Workspace AI',
          content: `📊 **Floor Analysis:** Based on your query regarding "${text.replace(/@gemini|@ai/gi, '').trim()}", target takt time is aligned with current manpower pitch. Recommendation: Maintain continuous in-line WIP buffer and verify station 08 bottleneck cycle time.`,
          createdAt: Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: { '👍': ['bot_gemini_workspace'] }
        };
        setTeamMessages(prev => [...prev, botReply]);
      }, 900);
    }
  };

  // Add Reaction
  const handleAddReaction = (messageId: string, emoji: string) => {
    const myId = profile.email || 'user_current';
    setTeamMessages(prev =>
      prev.map(m => {
        if (m.id !== messageId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        const userList = currentReactions[emoji] || [];
        if (userList.includes(myId)) {
          currentReactions[emoji] = userList.filter(id => id !== myId);
        } else {
          currentReactions[emoji] = [...userList, myId];
        }
        return { ...m, reactions: currentReactions };
      })
    );
  };

  // Send dedicated Gemini prompt
  const handleSendGeminiPrompt = () => {
    if (!geminiInputText.trim() || geminiLoading) return;
    const prompt = geminiInputText.trim();
    const userMsg = {
      id: `g_user_${Date.now()}`,
      role: 'user' as const,
      content: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setGeminiMessages(prev => [...prev, userMsg]);
    setGeminiInputText('');
    setGeminiLoading(true);

    setTimeout(() => {
      let response = `Here is the industrial engineering evaluation for "${prompt}":\n\n1. **Theoretical Manpower:** Manpower = Total SAM / Takt Time.\n2. **Bottleneck Mitigation:** Reassign operator from low-utilization station (e.g. Ironing buffer) to assist primary stitching operation.\n3. **Line Efficiency:** Estimated +4.2% output gain upon rebalancing.`;
      if (prompt.toLowerCase().includes('bottleneck')) {
        response = `⚠️ **Bottleneck Resolution Protocol:**\n- Conduct immediate 10-cycle time study.\n- Check machine RPM & needle heat on heavy seam.\n- Implement tandem-operator assist for next 2 hours.`;
      } else if (prompt.toLowerCase().includes('smv') || prompt.toLowerCase().includes('sam')) {
        response = `📐 **SMV Benchmark:** For standard knit polo shirt, standard allowed minutes typically range from 18.5 to 22.0 min depending on placket complexity and collar construction.`;
      }

      setGeminiMessages(prev => [
        ...prev,
        {
          id: `g_model_${Date.now()}`,
          role: 'model',
          content: response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setGeminiLoading(false);
    }, 1000);
  };

  // Insert Google Meet huddle link into chat
  const handleInsertMeetLink = () => {
    const meetLink = `https://meet.google.com/deb-ie-${Math.random().toString(36).substring(2, 6)}`;
    setComposerText(prev => `${prev ? prev + ' ' : ''}Join Google Meet Floor Huddle: ${meetLink}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-200">
      <div
        className={`relative w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isExpanded ? 'h-[96vh] max-w-[96vw]' : 'h-[88vh] max-w-5xl'
        }`}
      >
        {/* =========================================================================
         * 1. GOOGLE WORKSPACE MASTER HEADER
         * ========================================================================= */}
        <div className="bg-[#1f2937] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-700/80 shrink-0">
          <div className="flex items-center gap-3">
            {/* Google Chat Logo Indicator */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-blue-600 flex items-center justify-center text-white shadow-sm ring-2 ring-white/10">
              <MessageSquare className="w-5 h-5 fill-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight font-display text-white">
                  Google Chat
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/15 text-emerald-300 font-bold uppercase tracking-wider border border-white/10">
                  Workspace
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Debonair LTD (Unit-02) &bull; Enterprise Plant Communications
              </p>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Presence Selector */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  presence === 'active'
                    ? 'bg-emerald-400'
                    : presence === 'away'
                    ? 'bg-amber-400'
                    : presence === 'dnd'
                    ? 'bg-rose-400'
                    : 'bg-blue-400'
                }`}
              />
              <select
                value={presence}
                onChange={e => setPresence(e.target.value as UserPresenceStatus)}
                className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
              >
                <option value="active" className="bg-slate-800">Active</option>
                <option value="on_floor" className="bg-slate-800">On Shop Floor</option>
                <option value="away" className="bg-slate-800">Away</option>
                <option value="dnd" className="bg-slate-800">Do Not Disturb</option>
              </select>
            </div>

            {/* Google Meet Button */}
            <button
              type="button"
              onClick={() => setIsMeetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Start instant Google Meet Floor Huddle"
            >
              <Video className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Meet Huddle</span>
            </button>

            {/* Expand / Minimize */}
            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer hidden md:flex"
              title={isExpanded ? 'Restore window size' : 'Expand window'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Google Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* =========================================================================
         * 2. MAIN WORKSPACE BODY (SIDEBAR + CHAT CONVERSATION)
         * ========================================================================= */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT SIDEBAR: Spaces & Direct Messages */}
          <div
            className={`w-full md:w-80 lg:w-88 border-r border-slate-200 dark:border-slate-800 bg-[#f8fafd] dark:bg-slate-900/60 flex flex-col shrink-0 ${
              !showLeftSidebarMobile ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search in Google Chat */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in Google Chat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1a73e8]"
                />
              </div>
            </div>

            {/* Navigation Tabs (Spaces vs DMs vs Gemini) */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('spaces')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'spaces'
                    ? 'bg-[#1a73e8]/10 text-[#1a73e8] dark:bg-[#1a73e8]/20'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Spaces</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('dms')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'dms'
                    ? 'bg-[#1a73e8]/10 text-[#1a73e8] dark:bg-[#1a73e8]/20'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Direct</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gemini')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'gemini'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Gemini AI</span>
              </button>
            </div>

            {/* List Content based on activeTab */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* SPACES LIST */}
              {activeTab === 'spaces' && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Factory Operations Spaces
                  </div>
                  {filteredSpaces.map(space => {
                    const isSelected = activeChatId === space.id;
                    return (
                      <button
                        key={space.id}
                        type="button"
                        onClick={() => {
                          setActiveChatId(space.id);
                          setShowLeftSidebarMobile(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a73e8]/10 text-[#1a73e8] dark:bg-[#1a73e8]/20 font-bold'
                            : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          #
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs truncate">{space.name}</span>
                            {(space.unreadCount ?? 0) > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#1a73e8] text-white">
                                {space.unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {space.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* DIRECT MESSAGES LIST */}
              {activeTab === 'dms' && (
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Industrial Engineering Team
                  </div>
                  {filteredMembers.map(member => {
                    const dmId = `dm_${member.id}`;
                    const isSelected = activeChatId === dmId;
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setActiveChatId(dmId);
                          setShowLeftSidebarMobile(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a73e8]/10 text-[#1a73e8] dark:bg-[#1a73e8]/20 font-bold'
                            : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                              member.status === 'online'
                                ? 'bg-emerald-500'
                                : member.status === 'busy'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs truncate">{member.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{member.role}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* GEMINI AI ASSISTANT TAB */}
              {activeTab === 'gemini' && (
                <div className="p-4 space-y-3">
                  <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                    <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Google Workspace Gemini</span>
                    </div>
                    <p className="text-[11px] text-purple-700 dark:text-purple-300 leading-relaxed">
                      AI agent embedded inside Google Chat for automated cycle time analysis, pitch balancing, and SAM guidance.
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="font-bold text-slate-600 dark:text-slate-400 text-[11px]">
                      Quick Questions:
                    </div>
                    {[
                      'How to calculate line balance efficiency?',
                      'Suggest recovery plan for 2-hour downtime',
                      'Standard SAM for knit collar attach',
                      'Formulate morning IE 5S checklist'
                    ].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => {
                          setGeminiInputText(q);
                        }}
                        className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-400 text-[11px] text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar User Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {profile.name?.charAt(0) || 'IE'}
                </div>
                <div className="truncate">
                  <div className="font-bold text-slate-900 dark:text-white truncate">
                    {profile.name || 'Lead IE'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{statusMessage}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN AREA: Conversation View */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
            {/* If user selected Gemini Tab, render dedicated AI Workspace */}
            {activeTab === 'gemini' ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Gemini Chat Top Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Gemini IE Intelligent Assistant
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Google Workspace Manufacturing Intelligence
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gemini Messages Scroll */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {geminiMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-2xl ${
                        msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          msg.role === 'user'
                            ? 'bg-[#1a73e8] text-white'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {msg.role === 'user' ? 'ME' : <Sparkles className="w-3.5 h-3.5" />}
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-[#1a73e8] text-white rounded-tr-none'
                            : 'bg-[#f1f3f4] dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none whitespace-pre-line'
                        }`}
                      >
                        {msg.content}
                        <div
                          className={`text-[9px] mt-1 ${
                            msg.role === 'user' ? 'text-white/70' : 'text-slate-400'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}

                  {geminiLoading && (
                    <div className="flex items-center gap-2 text-xs text-purple-600 animate-pulse">
                      <Sparkles className="w-4 h-4" />
                      <span>Gemini is analyzing garment operations...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Gemini Input Bar */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={geminiInputText}
                    onChange={e => setGeminiInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendGeminiPrompt()}
                    placeholder="Ask Gemini about line balancing, pitch diagram, or SAM..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendGeminiPrompt}
                    disabled={geminiLoading || !geminiInputText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Ask Gemini
                  </button>
                </div>
              </div>
            ) : (
              /* REGULAR GOOGLE CHAT CONVERSATION */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Conversation Header */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Back button for mobile view */}
                    <button
                      type="button"
                      onClick={() => setShowLeftSidebarMobile(true)}
                      className="md:hidden text-slate-500 p-1 rounded-lg hover:bg-slate-100"
                    >
                      <ChevronDown className="w-5 h-5 rotate-90" />
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                      {isDirectMessage ? activeMember?.name.charAt(0) || 'D' : '#'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                          {chatTitle}
                        </h2>
                        {!isDirectMessage && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Space
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                        {chatSubtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* In-chat search toggle */}
                    <button
                      type="button"
                      onClick={() => setShowInChatSearch(prev => !prev)}
                      className="text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Search in this space"
                    >
                      <Search className="w-4 h-4" />
                    </button>

                    {/* Instant Meet Invite */}
                    <button
                      type="button"
                      onClick={handleInsertMeetLink}
                      className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-[#1a73e8] cursor-pointer"
                      title="Insert Google Meet link into message"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Add Meet</span>
                    </button>
                  </div>
                </div>

                {/* Inline Space Search Bar */}
                {showInChatSearch && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-fadeIn">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search messages in this space..."
                      value={inChatSearchQuery}
                      onChange={e => setInChatSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowInChatSearch(false);
                        setInChatSearchQuery('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Messages List Area */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#fcfcfd] dark:bg-slate-900/40">
                  {currentChatMessages.map(msg => {
                    const isMe = msg.senderId === (profile.employeeId || profile.email || 'user_current');
                    return (
                    <div
                      key={msg.id}
                      className={`group flex items-start gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        isMe ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                        {msg.senderName?.charAt(0) || 'U'}
                      </div>

                      {/* Content Card */}
                      <div className={`max-w-[80%] ${isMe ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                        </div>

                        {/* Quoted Reply */}
                        {msg.replyTo && (
                          <div className="p-2 mb-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 border-l-2 border-[#1a73e8] text-left">
                            <span className="font-bold text-slate-800 dark:text-slate-300">
                              {msg.replyTo.senderName}:{' '}
                            </span>
                            {msg.replyTo.content}
                          </div>
                        )}

                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed inline-block text-left ${
                            isMe
                              ? 'bg-[#1a73e8] text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-2xs'
                          }`}
                        >
                          <div className="whitespace-pre-line">{msg.content}</div>
                        </div>

                        {/* Reactions Bar */}
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {Object.entries(msg.reactions || {}).map(([emoji, reactionUsers]) => {
                            const count = Array.isArray(reactionUsers) ? reactionUsers.length : (reactionUsers as any);
                            return (
                              <span
                                key={emoji}
                                className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                              >
                                <span>{emoji}</span>
                                <span className="font-bold">{count}</span>
                              </span>
                            );
                          })}

                          {/* Quick React Button on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            {['👍', '🚀', '⚠️', '🛠️'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleAddReaction(msg.id, emoji)}
                                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-xs transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Pre-canned Quick Floor Chips */}
                <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                    Floor Chips:
                  </span>
                  {[
                    '⚠️ Bottleneck at Station 08',
                    '📊 Line 04 pitch balanced @ 85%',
                    '🔄 Style changeover scheduled 2:00 PM',
                    '✅ Quality AQL 2.5 passed'
                  ].map(chip => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setComposerText(chip)}
                      className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap hover:border-[#1a73e8] cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Active Reply Banner */}
                {replyingToMessage && (
                  <div className="px-4 py-2 bg-blue-50 dark:bg-slate-800 border-t border-blue-200 flex items-center justify-between text-xs text-blue-900 dark:text-blue-300">
                    <div>
                      <span className="font-bold">Replying to {replyingToMessage.senderName}: </span>
                      <span className="truncate">{replyingToMessage.content}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="text-blue-700 hover:text-blue-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Message Input Composer */}
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-end gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-2.5 focus-within:ring-2 focus-within:ring-[#1a73e8] focus-within:bg-white transition-all">
                    <textarea
                      ref={textareaRef}
                      rows={2}
                      value={composerText}
                      onChange={e => setComposerText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Send a message to ${chatTitle}... (Tip: Mention @Gemini for AI advice)`}
                      className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 resize-none focus:outline-none"
                    />

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-400">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleInsertMeetLink}
                          className="hover:text-[#1a73e8] text-xs flex items-center gap-1 cursor-pointer"
                          title="Add Google Meet link"
                        >
                          <Video className="w-3.5 h-3.5 text-[#1a73e8]" />
                          <span className="text-[10px] font-bold text-[#1a73e8]">Meet</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setComposerText(prev => `${prev ? prev + ' ' : ''}@Gemini `)}
                          className="hover:text-purple-600 text-xs flex items-center gap-1 cursor-pointer"
                          title="Mention Gemini AI bot"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                          <span className="text-[10px] font-bold text-purple-600">@Gemini</span>
                        </button>
                      </div>

                      <span className="text-[10px]">Enter to send &bull; Shift+Enter for new line</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!composerText.trim()}
                    className="p-3 rounded-2xl bg-[#1a73e8] hover:bg-[#1557b0] text-white transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
         * 3. GOOGLE MEET FLOOR HUDDLE MODAL
         * ========================================================================= */}
        {isMeetModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 text-white rounded-3xl border border-slate-700 p-6 space-y-5 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#1a73e8] text-white flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">Google Meet Floor Huddle</h3>
                    <p className="text-xs text-slate-400">Debonair Unit-02 Instant Room</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMeetModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Meeting Room URL:</span>
                  <span className="font-mono text-emerald-400">meet.google.com/{meetRoomId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Room Ready &bull; Encrypted
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMeetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleInsertMeetLink();
                    setIsMeetModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-xs font-bold text-white flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Share in Current Space</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
