/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  Users,
  MessageSquare,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  Clock,
  Flame,
  CheckCheck,
  Check,
  Paperclip,
  Search,
  Volume2,
  VolumeX,
  ChevronDown,
  Layers,
  ThumbsUp,
  RefreshCw,
  Sliders,
  Tag,
  Share2,
  Maximize2,
  Minimize2,
  BellRing,
  Trash2,
  ShieldCheck,
  UserCheck,
  AtSign,
  Hash,
  Calculator,
  Compass,
  BarChart3,
  Target,
  Info,
  Pin,
  PinOff,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  History,
  Phone,
  Video,
  Smile,
  Mic,
  MicOff,
  MoreVertical,
  Plus,
  Circle,
  FileText,
  Image,
  BarChart2,
  Star,
  CornerUpLeft,
  Download,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed
} from 'lucide-react';
import {
  UserProfile,
  LineEntry,
  UserChatMessage,
  ChatChannel,
  ChatUserMember,
  WhatsAppStatusStory
} from '../types';
import {
  DEFAULT_CHAT_MEMBERS,
  CHAT_MENTION_GROUPS,
  ChatMentionGroup,
  DEFAULT_CHAT_CHANNELS,
  INITIAL_USER_CHAT_MESSAGES,
  QUICK_SHOP_FLOOR_CHIPS,
  DEFAULT_WHATSAPP_STATUS_STORIES
} from '../data/userChatData';
import { MentionSuggestionsMenu } from './chat/MentionSuggestionsMenu';
import { ChatMemberCardModal } from './chat/ChatMemberCardModal';
import { ChatMessageItem } from './chat/ChatMessageItem';
import { ChatUserListView } from './chat/ChatUserListView';
import { ChatHistoryModal } from './chat/ChatHistoryModal';
import { WhatsAppVoiceNotePlayer } from './chat/WhatsAppVoiceNotePlayer';
import { WhatsAppCallModal } from './chat/WhatsAppCallModal';
import { WhatsAppStatusModal } from './chat/WhatsAppStatusModal';
import { WhatsAppEmojiDrawer } from './chat/WhatsAppEmojiDrawer';
import { WhatsAppAttachMenu } from './chat/WhatsAppAttachMenu';
import { WhatsAppPollModal } from './chat/WhatsAppPollModal';
import { whatsAppAudio } from '../utils/whatsappAudio';

export type WhatsAppTab = 'chats' | 'status' | 'calls' | 'ai-assistant' | 'contacts';
export type WhatsAppFilter = 'all' | 'unread' | 'favorites' | 'groups';

interface UserChatHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines?: LineEntry[];
  profile: UserProfile;
  initialTab?: WhatsAppTab;
}

export const UserChatHubModal: React.FC<UserChatHubModalProps> = ({
  isOpen,
  onClose,
  lines = [],
  profile,
  initialTab = 'chats'
}) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<WhatsAppTab>(initialTab);
  const [activeChatId, setActiveChatId] = useState<string>('ie-line-balancing');
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeFilter, setActiveFilter] = useState<WhatsAppFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showInChatSearch, setShowInChatSearch] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [showLeftSidebarMobile, setShowLeftSidebarMobile] = useState(true);

  // WhatsApp Drawers & Modals
  const [isEmojiDrawerOpen, setIsEmojiDrawerOpen] = useState(false);
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusModalIndex, setStatusModalIndex] = useState(0);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isCallVideo, setIsCallVideo] = useState(false);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<ChatUserMember | null>(null);

  // Status Stories State
  const [statusStories, setStatusStories] = useState<WhatsAppStatusStory[]>(() => {
    try {
      const saved = localStorage.getItem('wa_status_stories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WHATSAPP_STATUS_STORIES;
  });

  // Call History State
  const [callHistory, setCallHistory] = useState<
    Array<{
      id: string;
      name: string;
      role: string;
      avatar?: string;
      type: 'incoming' | 'outgoing' | 'missed';
      isVideo: boolean;
      time: string;
    }>
  >([
    {
      id: 'call_1',
      name: 'Nusrat Jahan',
      role: 'Line Balancing Engineer',
      avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E',
      type: 'incoming',
      isVideo: false,
      time: 'Today, 08:45 AM'
    },
    {
      id: 'call_2',
      name: 'Faruk Ahmed',
      role: 'Chief Maintenance Mechanic',
      avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E',
      type: 'outgoing',
      isVideo: true,
      time: 'Yesterday, 04:20 PM'
    },
    {
      id: 'call_3',
      name: 'Engr. Tanvir Ahmed',
      role: 'Floor Production Manager',
      avatar: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E',
      type: 'missed',
      isVideo: false,
      time: 'Yesterday, 11:15 AM'
    }
  ]);

  // User Presence & Status state
  const [myPresence, setMyPresence] = useState<'online' | 'busy' | 'on_floor' | 'offline'>('online');
  const [myStatusText, setMyStatusText] = useState('Available • Optimizing Line 18-20 SMV');

  // Team Messages State
  const [teamMessages, setTeamMessages] = useState<UserChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ie_team_chat_messages_v3');
      if (saved) {
        const parsed: UserChatMessage[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_USER_CHAT_MESSAGES.map((m, idx) => ({
      ...m,
      deliveryStatus: idx % 2 === 0 ? 'read' : 'delivered'
    }));
  });

  // Pinned Chats List (IDs of pinned chats)
  const [pinnedChatIds, setPinnedChatIds] = useState<string[]>(['ie-line-balancing', 'general-floor']);

  // Chat Input & Voice Recording State
  const [composerText, setComposerText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<UserChatMessage | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordSeconds, setVoiceRecordSeconds] = useState(0);
  const voiceRecordTimerRef = useRef<any>(null);

  // Typing Simulation
  const [isColleagueTyping, setIsColleagueTyping] = useState(false);
  const [typingColleagueName, setTypingColleagueName] = useState('');

  // Mentions Engine
  const [mentionMenuOpen, setMentionMenuOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionTriggerPos, setMentionTriggerPos] = useState<number>(-1);

  // AI Assistant State (WhatsApp Meta/Gemini style)
  const [aiInputText, setAiInputText] = useState('');
  const [aiIsLoading, setAiIsLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; role: 'user' | 'model'; content: string; timestamp: string }>>([
    {
      id: 'wa_ai_1',
      role: 'model',
      content: `Hello ${profile?.name || 'Engineer'}! 👋 I am your WhatsApp IE AI Advisor.\n\nAsk me anything about Work Study, SMV calculation, Pitch Diagram balancing, machine breakdowns, or overtime recovery plans.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Scroll Container Ref
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ie_team_chat_messages_v3', JSON.stringify(teamMessages));
    } catch {}
  }, [teamMessages]);

  useEffect(() => {
    try {
      localStorage.setItem('wa_status_stories', JSON.stringify(statusStories));
    } catch {}
  }, [statusStories]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen && activeTab === 'chats') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeTab, activeChatId, teamMessages, isColleagueTyping]);

  // Voice note timer
  useEffect(() => {
    if (isRecordingVoice) {
      setVoiceRecordSeconds(0);
      whatsAppAudio.playMicStartBeep();
      voiceRecordTimerRef.current = setInterval(() => {
        setVoiceRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (voiceRecordTimerRef.current) {
        clearInterval(voiceRecordTimerRef.current);
        voiceRecordTimerRef.current = null;
      }
    }
    return () => {
      if (voiceRecordTimerRef.current) clearInterval(voiceRecordTimerRef.current);
    };
  }, [isRecordingVoice]);

  if (!isOpen) return null;

  // Find active chat target (group channel or member DM)
  const isDirectMessage = activeChatId.startsWith('dm_');
  const targetMemberId = isDirectMessage ? activeChatId.replace('dm_', '') : null;
  const activeMember = targetMemberId ? DEFAULT_CHAT_MEMBERS.find(m => m.id === targetMemberId) : null;
  const activeChannel = !isDirectMessage ? DEFAULT_CHAT_CHANNELS.find(c => c.id === activeChatId) : null;

  const chatTitle = activeMember ? activeMember.name : activeChannel ? activeChannel.name : 'IE Line Balancing';
  const chatSubtitle = activeMember
    ? `${activeMember.role} • ${activeMember.status.replace('_', ' ')}`
    : activeChannel
    ? `${activeChannel.memberCount || 12} participants • ${activeChannel.description}`
    : 'Floor Communications';
  const chatAvatar = activeMember?.avatar;

  // Filter messages for active chat
  const currentChatMessages = teamMessages
    .filter(m => m.channelId === activeChatId)
    .filter(m => {
      if (!inChatSearchQuery.trim()) return true;
      const q = inChatSearchQuery.toLowerCase();
      return m.content.toLowerCase().includes(q) || m.senderName.toLowerCase().includes(q);
    });

  // Calculate unread count per channel
  const getUnreadCount = (chatId: string) => {
    return teamMessages.filter(m => m.channelId === chatId && m.senderId !== 'user_self' && m.deliveryStatus !== 'read').length;
  };

  // Get last message of a chat
  const getLastMessage = (chatId: string) => {
    const msgs = teamMessages.filter(m => m.channelId === chatId);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  // Build combined chat list (Channels + Direct Messages)
  interface ChatListItem {
    id: string;
    name: string;
    subtitle: string;
    isGroup: boolean;
    avatar?: string;
    onlineStatus?: string;
    lastMsg: UserChatMessage | null;
    unread: number;
    isPinned: boolean;
  }

  const allChats: ChatListItem[] = [
    ...DEFAULT_CHAT_CHANNELS.map(ch => ({
      id: ch.id,
      name: ch.name,
      subtitle: ch.description,
      isGroup: true,
      avatar: undefined,
      onlineStatus: undefined,
      lastMsg: getLastMessage(ch.id),
      unread: getUnreadCount(ch.id),
      isPinned: pinnedChatIds.includes(ch.id)
    })),
    ...DEFAULT_CHAT_MEMBERS.map(mem => ({
      id: `dm_${mem.id}`,
      name: mem.name,
      subtitle: mem.role,
      isGroup: false,
      avatar: mem.avatar,
      onlineStatus: mem.status,
      lastMsg: getLastMessage(`dm_${mem.id}`),
      unread: getUnreadCount(`dm_${mem.id}`),
      isPinned: pinnedChatIds.includes(`dm_${mem.id}`)
    }))
  ];

  // Filter chats by search and active filter
  const filteredChatList = allChats.filter(chat => {
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = chat.name.toLowerCase().includes(q);
      const matchSub = chat.subtitle.toLowerCase().includes(q);
      const matchMsg = chat.lastMsg?.content.toLowerCase().includes(q);
      if (!matchName && !matchSub && !matchMsg) return false;
    }

    // Category filter
    if (activeFilter === 'unread') return chat.unread > 0;
    if (activeFilter === 'groups') return chat.isGroup;
    if (activeFilter === 'favorites') return chat.isPinned;
    return true;
  });

  // Sort: pinned first, then by last message time
  filteredChatList.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const timeA = a.lastMsg?.createdAt || 0;
    const timeB = b.lastMsg?.createdAt || 0;
    return timeB - timeA;
  });

  // Send new message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || composerText).trim();
    if (!text) return;

    if (soundEnabled) {
      whatsAppAudio.playSentSound();
    }

    const newMsg: UserChatMessage = {
      id: `wa_msg_${Date.now()}`,
      senderId: 'user_self',
      senderName: profile.name || 'Ashik Hossain',
      senderRole: profile.jobTitle || 'Senior IE Lead',
      senderAvatar: profile.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E',
      channelId: activeChatId,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      deliveryStatus: 'sent',
      replyTo: replyingToMessage
        ? {
            id: replyingToMessage.id,
            senderName: replyingToMessage.senderName,
            content: replyingToMessage.content
          }
        : undefined,
      reactions: {}
    };

    setTeamMessages(prev => [...prev, newMsg]);
    setComposerText('');
    setReplyingToMessage(null);
    setIsEmojiDrawerOpen(false);
    setIsAttachMenuOpen(false);

    // Simulate delivery tick transition: sent -> delivered
    setTimeout(() => {
      setTeamMessages(prev =>
        prev.map(m => (m.id === newMsg.id ? { ...m, deliveryStatus: 'delivered' } : m))
      );
    }, 1200);

    // Simulate colleague reading and response
    simulateWhatsAppResponse(activeChatId, text, newMsg.id);
  };

  // Simulate realistic WhatsApp colleague response with typing indicator & double blue tick
  const simulateWhatsAppResponse = (chatId: string, userText: string, sentMsgId: string) => {
    const lower = userText.toLowerCase();

    let responder: ChatUserMember | null = null;
    let replyText = '';

    if (chatId.includes('nusrat') || lower.includes('@nusrat') || chatId === 'ie-line-balancing') {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_nusrat')!;
      replyText = lower.includes('collar') || lower.includes('line 04')
        ? 'Got it @Ashik! I checked the Yamazumi chart. Offloading the 11.5s tab notch trimming pulls Station 08 cycle down to 47.2s, safely below the 48s takt. Floater is already repositioned! 👍'
        : 'Line Balancing update: Station 08 takt alignment is steady at 96% Pitch Efficiency. All WIP buffers clear.';
    } else if (chatId.includes('kamrul') || lower.includes('@kamrul') || chatId === 'ie-time-study') {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_kamrul')!;
      replyText = 'Work study complete: Observed 15 cycles on French Placket. 95% rating + 12.5% allowance = standard SMV 0.505 min (30.3s). GSD database updated! 📊';
    } else if (chatId.includes('faruk') || lower.includes('@faruk') || chatId === 'maintenance-alerts' || lower.includes('breakdown')) {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_faruk')!;
      replyText = '⚠️ Received alert. Heading to the workstation right now with replacement feed dog and timing gauge. Will be back running in 8 mins.';
    } else if (chatId.includes('tanvir') || lower.includes('@tanvir') || chatId === 'general-floor') {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_tanvir')!;
      replyText = 'Understood Ashik. Keep the hourly pace above 580 pcs and we will hit today’s 4,800 pcs factory target smoothly.';
    } else {
      responder = DEFAULT_CHAT_MEMBERS.find(m => m.id === 'user_kamrul')!;
      replyText = 'Message acknowledged! IE floor team is monitoring the workstation pitch variance.';
    }

    // Step 1: Colleague marks message as READ (double blue ticks!)
    setTimeout(() => {
      setTeamMessages(prev =>
        prev.map(m => (m.id === sentMsgId ? { ...m, deliveryStatus: 'read' } : m))
      );
    }, 2000);

    // Step 2: Show "typing..." indicator
    setTimeout(() => {
      setIsColleagueTyping(true);
      setTypingColleagueName(responder?.name.split(' ')[0] || 'Colleague');
    }, 2800);

    // Step 3: Deliver reply message and play incoming alert sound
    setTimeout(() => {
      setIsColleagueTyping(false);
      if (soundEnabled) {
        whatsAppAudio.playReceivedSound();
      }

      const colleagueMsg: UserChatMessage = {
        id: `wa_msg_${Date.now()}`,
        senderId: responder?.id || 'user_kamrul',
        senderName: responder?.name || 'Engr. Kamrul Hasan',
        senderRole: responder?.role || 'IE Specialist',
        senderAvatar: responder?.avatar,
        channelId: chatId,
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        createdAt: Date.now(),
        reactions: {}
      };

      setTeamMessages(prev => [...prev, colleagueMsg]);
    }, 5200);
  };

  // Send Voice Note
  const handleSendVoiceNote = () => {
    setIsRecordingVoice(false);
    const duration = Math.max(3, voiceRecordSeconds);

    if (soundEnabled) {
      whatsAppAudio.playSentSound();
    }

    const voiceMsg: UserChatMessage = {
      id: `wa_voice_${Date.now()}`,
      senderId: 'user_self',
      senderName: profile.name || 'Ashik Hossain',
      senderRole: profile.jobTitle || 'Senior IE Lead',
      senderAvatar: profile.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E',
      channelId: activeChatId,
      content: '🎤 Voice message',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      deliveryStatus: 'read',
      voiceNote: {
        durationSec: duration
      }
    };

    setTeamMessages(prev => [...prev, voiceMsg]);
  };

  // Cancel Voice Note
  const handleCancelVoiceNote = () => {
    setIsRecordingVoice(false);
  };

  // Create Poll
  const handleCreatePoll = (question: string, options: string[]) => {
    if (soundEnabled) whatsAppAudio.playSentSound();

    const pollMsg: UserChatMessage = {
      id: `wa_poll_${Date.now()}`,
      senderId: 'user_self',
      senderName: profile.name || 'Ashik Hossain',
      senderRole: profile.jobTitle || 'Senior IE Lead',
      senderAvatar: profile.photoURL,
      channelId: activeChatId,
      content: `📊 Poll: ${question}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      deliveryStatus: 'delivered',
      poll: {
        question,
        options: options.map(text => ({ text, votes: [] }))
      }
    };

    setTeamMessages(prev => [...prev, pollMsg]);
  };

  // Vote on Poll
  const handleVotePoll = (msgId: string, optionIdx: number) => {
    setTeamMessages(prev =>
      prev.map(m => {
        if (m.id !== msgId || !m.poll) return m;
        const myId = 'user_self';
        const newOptions = m.poll.options.map((opt, idx) => {
          const hasVoted = opt.votes.includes(myId);
          if (idx === optionIdx) {
            return {
              ...opt,
              votes: hasVoted ? opt.votes.filter(id => id !== myId) : [...opt.votes, myId]
            };
          } else {
            return {
              ...opt,
              votes: opt.votes.filter(id => id !== myId) // single-choice vote
            };
          }
        });
        return {
          ...m,
          poll: {
            ...m.poll,
            options: newOptions
          }
        };
      })
    );
  };

  // Attach Document
  const handleAttachDocument = () => {
    if (soundEnabled) whatsAppAudio.playSentSound();
    const docMsg: UserChatMessage = {
      id: `wa_doc_${Date.now()}`,
      senderId: 'user_self',
      senderName: profile.name || 'Ashik Hossain',
      senderRole: profile.jobTitle || 'Senior IE Lead',
      senderAvatar: profile.photoURL,
      channelId: activeChatId,
      content: '📄 Shared document: Line_18_SMV_Balancing_Report.xlsx',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      deliveryStatus: 'read',
      mediaAttachment: {
        type: 'document',
        name: 'Line_18_SMV_Balancing_Report.xlsx',
        size: '148 KB'
      }
    };
    setTeamMessages(prev => [...prev, docMsg]);
  };

  // Attach Photo
  const handleAttachPhoto = () => {
    if (soundEnabled) whatsAppAudio.playSentSound();
    const photoMsg: UserChatMessage = {
      id: `wa_photo_${Date.now()}`,
      senderId: 'user_self',
      senderName: profile.name || 'Ashik Hossain',
      senderRole: profile.jobTitle || 'Senior IE Lead',
      senderAvatar: profile.photoURL,
      channelId: activeChatId,
      content: '📷 Floor photo snapshot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      deliveryStatus: 'read',
      mediaAttachment: {
        type: 'image',
        name: 'Station_08_Folder.jpg',
        url: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E',
        caption: 'Collar placket folder jig mounted on Brother Lockstitch.'
      }
    };
    setTeamMessages(prev => [...prev, photoMsg]);
  };

  // Attach Quick Floor Alert
  const handleAttachAlert = () => {
    handleSendMessage('🚨 URGENT: Line 04 Station 08 bottleneck detected! Cycle surged to 64s vs 48s takt. Floater support requested immediately.');
  };

  // Share Contact
  const handleShareContact = () => {
    handleSendMessage('👤 Contact Card: Engr. Kamrul Hasan (IE Work Study Lead) • Phone: +880 1819-223344 • Ext. 304');
  };

  // Toggle Reaction on message
  const handleToggleReaction = (msgId: string, emoji: string) => {
    const myId = 'user_self';
    setTeamMessages(prev =>
      prev.map(m => {
        if (m.id !== msgId) return m;
        const currentReactions = { ...(m.reactions || {}) };
        const existingUsers = currentReactions[emoji] || [];

        if (existingUsers.includes(myId)) {
          currentReactions[emoji] = existingUsers.filter(id => id !== myId);
          if (currentReactions[emoji].length === 0) {
            delete currentReactions[emoji];
          }
        } else {
          currentReactions[emoji] = [...existingUsers, myId];
        }

        return { ...m, reactions: currentReactions };
      })
    );
  };

  // Toggle Starred message
  const handleToggleStar = (msgId: string) => {
    setTeamMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, isStarred: !m.isStarred } : m))
    );
  };

  // Toggle Pin message
  const handleTogglePin = (msgId: string) => {
    setTeamMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  // Delete message
  const handleDeleteMessage = (msgId: string) => {
    setTeamMessages(prev => prev.filter(m => m.id !== msgId));
  };

  // Toggle Pin Chat
  const handleTogglePinChat = (chatId: string) => {
    setPinnedChatIds(prev =>
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  };

  // Start Call Trigger
  const handleStartCall = (video: boolean) => {
    setIsCallVideo(video);
    setIsCallModalOpen(true);
  };

  // Gemini AI Chat handler
  const handleSendAiMessage = async (textToSend?: string) => {
    const text = (textToSend || aiInputText).trim();
    if (!text || aiIsLoading) return;

    if (soundEnabled) whatsAppAudio.playSentSound();

    const userMessage = {
      id: `ai_user_${Date.now()}`,
      role: 'user' as const,
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInputText('');
    setAiIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleType: 'general',
          messages: [
            ...aiMessages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text }
          ]
        })
      });

      if (!response.ok) throw new Error('API failed');
      const data = await response.json();

      if (soundEnabled) whatsAppAudio.playReceivedSound();

      setAiMessages(prev => [
        ...prev,
        {
          id: `ai_bot_${Date.now()}`,
          role: 'model',
          content: data.content || data.reply || 'Analysis completed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch {
      // Offline fallback
      setTimeout(() => {
        if (soundEnabled) whatsAppAudio.playReceivedSound();
        setAiMessages(prev => [
          ...prev,
          {
            id: `ai_bot_${Date.now()}`,
            role: 'model',
            content: `🤖 **WhatsApp IE AI Advisor Recommendation:**\n\n• **Cycle & SMV:** Ensure Station 08 cycle remains under 48.0s takt.\n• **Balancing Action:** Offload notch trimming (11.5s) to Station 07 to eliminate bottleneck.\n• **Overtime Guidance:** 45 minutes lean overtime with 78% manpower recovers today's 140 pcs variance without overstaffing.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 800);
    } finally {
      setAiIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs select-none">
      {/* WhatsApp Window Card */}
      <div
        className={`relative w-full ${
          isExpanded ? 'h-full max-w-full rounded-none' : 'h-full sm:h-[94vh] max-w-7xl sm:rounded-3xl'
        } bg-[#111b21] shadow-2xl flex flex-col overflow-hidden border border-[#222e35] text-[#e9edef]`}
      >
        {/* ========================================================================= */}
        {/* WhatsApp Brand Header Bar */}
        <div className="bg-[#008069] text-white px-3 sm:px-5 py-2.5 flex items-center justify-between z-30 shrink-0 shadow-md">
          {/* Navigation Tabs (Chats, Status, Calls, AI) */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Chats Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('chats');
                setShowLeftSidebarMobile(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'chats'
                  ? 'bg-white text-[#008069] shadow-xs'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chats</span>
              {teamMessages.filter(m => m.senderId !== 'user_self' && m.deliveryStatus !== 'read').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] flex items-center justify-center font-bold">
                  {teamMessages.filter(m => m.senderId !== 'user_self' && m.deliveryStatus !== 'read').length}
                </span>
              )}
            </button>

            {/* Status Stories Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeTab === 'status'
                  ? 'bg-white text-[#008069] shadow-xs'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Status</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </button>

            {/* Calls Tab */}
            <button
              type="button"
              onClick={() => setActiveTab('calls')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calls'
                  ? 'bg-white text-[#008069] shadow-xs'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calls</span>
            </button>

            {/* AI Advisor Tab (WhatsApp Meta/Gemini style) */}
            <button
              type="button"
              onClick={() => setActiveTab('ai-assistant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ai-assistant'
                  ? 'bg-white text-[#008069] shadow-xs'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Advisor</span>
            </button>
          </div>

          {/* Actions: Sound, Maximize, Close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSoundEnabled(prev => !prev)}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Mute WhatsApp sounds' : 'Enable WhatsApp sounds'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-200" />}
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              className="hidden sm:block p-1.5 rounded-lg hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? 'Restore window size' : 'Expand full screen'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-rose-600 text-white transition-colors cursor-pointer ml-1"
              title="Close WhatsApp"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Main Content Area: WhatsApp Layout                                        */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* --------------------------------------------------------------------- */}
          {/* TAB: STATUS STORIES                                                   */}
          {/* --------------------------------------------------------------------- */}
          {activeTab === 'status' ? (
            <div className="flex-1 flex flex-col bg-[#111b21] p-4 sm:p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Status Updates (24h)</h2>
                    <p className="text-xs text-[#8696a0]">
                      Shop floor shift announcements &amp; engineering milestones
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusModalIndex(0);
                      setIsStatusModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Post New Status</span>
                  </button>
                </div>

                {/* My Status Row */}
                <div
                  onClick={() => {
                    setStatusModalIndex(0);
                    setIsStatusModalOpen(true);
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#202c33] hover:bg-[#222e35] cursor-pointer transition-colors border border-[#2a3942]"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-800">
                      <img
                        src={profile.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E'}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#00a884] text-white flex items-center justify-center border-2 border-[#202c33]">
                      <Plus className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-white">My Factory Status</h3>
                    <p className="text-xs text-[#8696a0]">Tap to add status update or view active story</p>
                  </div>
                </div>

                {/* Recent Updates Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">
                    Recent Shop-Floor Stories
                  </h3>
                  <div className="space-y-2">
                    {statusStories.map((story, idx) => (
                      <div
                        key={story.id}
                        onClick={() => {
                          setStatusModalIndex(idx);
                          setIsStatusModalOpen(true);
                        }}
                        className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#202c33]/70 hover:bg-[#202c33] cursor-pointer transition-colors border border-[#2a3942]/60"
                      >
                        <div className="relative">
                          <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-[#00a884] p-0.5 bg-slate-800">
                            <img
                              src={story.authorAvatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E'}
                              alt={story.authorName}
                              className="w-full h-full object-cover rounded-full"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-white truncate">{story.authorName}</h4>
                          <p className="text-xs text-[#aebac1] truncate">{story.caption}</p>
                          <span className="text-[10px] text-[#8696a0]">{story.timestamp}</span>
                        </div>
                        <span className="text-xs font-bold text-[#00a884] hover:underline">View</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'calls' ? (
            /* --------------------------------------------------------------------- */
            /* TAB: CALLS LOG                                                        */
            /* --------------------------------------------------------------------- */
            <div className="flex-1 flex flex-col bg-[#111b21] p-4 sm:p-8 overflow-y-auto">
              <div className="max-w-2xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Call History</h2>
                    <p className="text-xs text-[#8696a0]">
                      Shop floor voice &amp; video calls with supervisors and engineers
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartCall(false)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
                  >
                    <Phone className="w-4 h-4" />
                    <span>New Voice Call</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {callHistory.map(call => (
                    <div
                      key={call.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-[#202c33] border border-[#2a3942] hover:bg-[#222e35] transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700">
                          {call.avatar ? (
                            <img src={call.avatar} alt={call.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-white bg-emerald-800">
                              {call.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white">{call.name}</h4>
                          <div className="flex items-center gap-1.5 text-xs text-[#8696a0] mt-0.5">
                            {call.type === 'incoming' ? (
                              <PhoneIncoming className="w-3.5 h-3.5 text-emerald-400" />
                            ) : call.type === 'outgoing' ? (
                              <PhoneOutgoing className="w-3.5 h-3.5 text-[#53bdeb]" />
                            ) : (
                              <PhoneMissed className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span>{call.time}</span>
                            <span>•</span>
                            <span className="text-[#aebac1]">{call.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartCall(false)}
                          className="p-2.5 rounded-full bg-white/10 hover:bg-[#00a884] text-white transition-colors cursor-pointer"
                          title="Voice Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartCall(true)}
                          className="p-2.5 rounded-full bg-white/10 hover:bg-[#00a884] text-white transition-colors cursor-pointer"
                          title="Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'ai-assistant' ? (
            /* --------------------------------------------------------------------- */
            /* TAB: AI ASSISTANT (WhatsApp Meta / Gemini Style)                      */
            /* --------------------------------------------------------------------- */
            <div className="flex-1 flex flex-col bg-[#0b141a]">
              {/* AI Chat Header */}
              <div className="px-4 py-3 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#008069] to-teal-400 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">WhatsApp IE AI Advisor</h3>
                    <p className="text-[11px] text-[#8696a0]">Powered by Google Gemini 2.5 Flash</p>
                  </div>
                </div>
              </div>

              {/* AI Messages Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {aiMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                          : 'bg-[#202c33] text-[#e9edef] rounded-tl-none border border-[#2a3942]'
                      }`}
                    >
                      {msg.content}
                      <span className="block text-[10px] text-[#8696a0] text-right mt-1 font-mono">
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
                {aiIsLoading && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#202c33] text-xs text-[#8696a0] max-w-xs">
                    <Sparkles className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Analyzing shop floor balancing data...</span>
                  </div>
                )}
              </div>

              {/* AI Quick Prompt Chips */}
              <div className="px-4 py-2 bg-[#111b21] border-t border-[#222e35] flex items-center gap-2 overflow-x-auto">
                {[
                  '⚖️ How to balance Line 04 Collar Join?',
                  '⏱️ Calculate SMV from 28s cycle at 95% rating',
                  '🏭 Post-shift 8h overtime recovery strategy',
                  '🔧 Folder attachment cycle time reduction'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendAiMessage(chip.substring(2).trim())}
                    className="shrink-0 px-3 py-1 rounded-full bg-[#202c33] hover:bg-[#2a3942] text-[11px] font-semibold text-[#aebac1] transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* AI Input Footer */}
              <div className="p-3 bg-[#202c33] border-t border-[#2a3942] flex items-center gap-2">
                <input
                  type="text"
                  value={aiInputText}
                  onChange={e => setAiInputText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSendAiMessage();
                  }}
                  placeholder="Ask WhatsApp IE AI about line balancing, SMV, takt time..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#111b21] text-xs text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleSendAiMessage()}
                  disabled={!aiInputText.trim() || aiIsLoading}
                  className="p-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* --------------------------------------------------------------------- */
            /* TAB: CHATS (WhatsApp 2-Column Experience)                             */
            /* --------------------------------------------------------------------- */
            <>
              {/* =================================================================== */}
              {/* LEFT SIDEBAR: WhatsApp Conversations List                           */}
              {/* =================================================================== */}
              <div
                className={`w-full sm:w-80 md:w-96 bg-[#111b21] border-r border-[#222e35] flex flex-col shrink-0 ${
                  showLeftSidebarMobile ? 'flex' : 'hidden sm:flex'
                }`}
              >
                {/* User Profile Presence Bar */}
                <div className="p-3 bg-[#202c33] flex items-center justify-between border-b border-[#2a3942]">
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 border border-white/20">
                        <img
                          src={profile.photoURL || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%230f766e"/%3E%3Ctext x="50%25" y="55%25" dominant-baseline="middle" text-anchor="middle" fill="%23ffffff" font-family="sans-serif" font-size="36" font-weight="700"%3EIE%3C/text%3E%3C/svg%3E'}
                          alt={profile.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a884] ring-2 ring-[#202c33]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-white leading-tight">
                        {profile.name || 'Ashik Hossain'}
                      </h3>
                      <span className="text-[10px] text-[#00a884] font-medium leading-none block">
                        Online • IE Floor Lead
                      </span>
                    </div>
                  </div>

                  {/* Top Action Icons */}
                  <div className="flex items-center gap-1 text-[#aebac1]">
                    <button
                      type="button"
                      onClick={() => setActiveTab('status')}
                      className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                      title="View status stories"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveChatId('ie-line-balancing')}
                      className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                      title="New Channel / Chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeamMessages(INITIAL_USER_CHAT_MESSAGES);
                      }}
                      className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                      title="Reset sample conversations"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* WhatsApp Search Bar */}
                <div className="p-2.5 bg-[#111b21] space-y-2 border-b border-[#222e35]">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-[#8696a0] absolute left-3 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search or start new chat"
                      className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-[#202c33] text-xs text-[#e9edef] placeholder-[#8696a0] border border-transparent focus:border-[#00a884] focus:outline-hidden"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 text-[#8696a0] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Chips: All, Unread, Favorites, Groups */}
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    {(['all', 'unread', 'favorites', 'groups'] as WhatsAppFilter[]).map(filter => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={`px-3 py-1 rounded-full capitalize transition-colors cursor-pointer ${
                          activeFilter === filter
                            ? 'bg-[#00a884] text-white'
                            : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#222e35]'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat List Rows */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]/50">
                  {filteredChatList.map(chat => {
                    const isSelected = activeChatId === chat.id;

                    return (
                      <div
                        key={chat.id}
                        onClick={() => {
                          setActiveChatId(chat.id);
                          setShowLeftSidebarMobile(false);
                          setShowInChatSearch(false);
                          setInChatSearchQuery('');
                        }}
                        className={`flex items-center gap-3 p-3 transition-colors cursor-pointer relative group ${
                          isSelected ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center font-bold text-white text-base">
                            {chat.avatar ? (
                              <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#008069] flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </div>
                          {chat.onlineStatus === 'online' && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00a884] ring-2 ring-[#111b21]" />
                          )}
                        </div>

                        {/* Title, Last Message snippet & Ticks */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="font-bold text-xs sm:text-sm text-white truncate">
                              {chat.name}
                            </h4>
                            <span className="text-[10px] font-mono text-[#8696a0] shrink-0 ml-1">
                              {chat.lastMsg?.timestamp || 'Today'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-[#8696a0]">
                            <div className="flex items-center gap-1 truncate max-w-[190px] sm:max-w-[210px]">
                              {chat.lastMsg?.senderId === 'user_self' && (
                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                              )}
                              <span className="truncate text-[11px] text-[#aebac1]">
                                {chat.lastMsg?.content || chat.subtitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {chat.isPinned && (
                                <Pin className="w-3.5 h-3.5 text-[#00a884] fill-[#00a884]" />
                              )}
                              {chat.unread > 0 && (
                                <span className="w-4.5 h-4.5 rounded-full bg-[#00a884] text-white font-bold text-[10px] flex items-center justify-center">
                                  {chat.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Pin Chat Quick Toggle (on hover) */}
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleTogglePinChat(chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full text-[#8696a0] hover:text-white transition-opacity"
                          title={chat.isPinned ? 'Unpin chat' : 'Pin chat'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* =================================================================== */}
              {/* RIGHT MAIN CHAT AREA: WhatsApp Conversation                         */}
              {/* =================================================================== */}
              <div
                className={`flex-1 flex flex-col bg-[#efeae2] relative ${
                  !showLeftSidebarMobile ? 'flex' : 'hidden sm:flex'
                }`}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' /%3E%3C/g%3E%3C/svg%3E")`
                }}
              >
                {/* ----------------------------------------------------------------- */}
                {/* WhatsApp Conversation Header                                      */}
                {/* ----------------------------------------------------------------- */}
                <div className="bg-[#f0f2f5] px-3 sm:px-4 py-2 flex items-center justify-between border-b border-[#d1d7db] z-20 shadow-2xs">
                  <div className="flex items-center gap-3">
                    {/* Back to sidebar on mobile */}
                    <button
                      type="button"
                      onClick={() => setShowLeftSidebarMobile(true)}
                      className="sm:hidden p-1 rounded-full text-[#54656f] hover:bg-[#d1d7db]"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div
                      onClick={() => setShowContactInfo(prev => !prev)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-300 flex items-center justify-center font-bold text-white">
                          {chatAvatar ? (
                            <img src={chatAvatar} alt={chatTitle} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-[#008069] flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        {activeMember?.status === 'online' && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00a884] ring-2 ring-white" />
                        )}
                      </div>

                      <div>
                        <h2 className="font-bold text-sm text-[#111b21] leading-tight flex items-center gap-2">
                          <span>{chatTitle}</span>
                        </h2>
                        <p className="text-[11px] text-[#54656f] leading-none mt-0.5 truncate max-w-[200px] sm:max-w-md">
                          {isColleagueTyping ? (
                            <span className="text-[#00a884] font-bold animate-pulse">
                              {typingColleagueName} is typing...
                            </span>
                          ) : (
                            chatSubtitle
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Call & Header Tools */}
                  <div className="flex items-center gap-1 text-[#54656f]">
                    <button
                      type="button"
                      onClick={() => handleStartCall(false)}
                      className="p-2 rounded-full hover:bg-[#d1d7db] hover:text-[#111b21] transition-colors cursor-pointer"
                      title="WhatsApp Voice Call"
                    >
                      <Phone className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartCall(true)}
                      className="p-2 rounded-full hover:bg-[#d1d7db] hover:text-[#111b21] transition-colors cursor-pointer"
                      title="WhatsApp Video Call"
                    >
                      <Video className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowInChatSearch(prev => !prev)}
                      className="p-2 rounded-full hover:bg-[#d1d7db] hover:text-[#111b21] transition-colors cursor-pointer"
                      title="Search in conversation"
                    >
                      <Search className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowContactInfo(prev => !prev)}
                      className="p-2 rounded-full hover:bg-[#d1d7db] hover:text-[#111b21] transition-colors cursor-pointer"
                      title="Contact details & media"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline In-Chat Search Bar (Expandable) */}
                {showInChatSearch && (
                  <div className="p-2 bg-[#f0f2f5] border-b border-[#d1d7db] flex items-center gap-2 z-20 animate-in slide-in-from-top">
                    <Search className="w-4 h-4 text-[#54656f]" />
                    <input
                      type="text"
                      autoFocus
                      value={inChatSearchQuery}
                      onChange={e => setInChatSearchQuery(e.target.value)}
                      placeholder="Search messages in this chat..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white text-xs text-[#111b21] border border-[#d1d7db] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowInChatSearch(false);
                        setInChatSearchQuery('');
                      }}
                      className="p-1 rounded-lg text-[#54656f] hover:bg-[#d1d7db]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ----------------------------------------------------------------- */}
                {/* Messages Stream Container                                         */}
                {/* ----------------------------------------------------------------- */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col justify-start">
                  {/* WhatsApp End-to-End Encryption Notice */}
                  <div className="my-2 mx-auto max-w-sm sm:max-w-md p-2 rounded-lg bg-[#ffeecd] border border-[#f7e0b5] text-[11px] text-[#54656f] text-center flex items-center justify-center gap-1.5 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Messages and calls are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
                    </span>
                  </div>

                  {/* Date Divider */}
                  <div className="my-3 flex items-center justify-center">
                    <span className="px-3 py-1 rounded-lg bg-white/90 text-[#54656f] text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                      Today
                    </span>
                  </div>

                  {/* Messages Bubble List */}
                  {currentChatMessages.map(msg => (
                    <ChatMessageItem
                      key={msg.id}
                      msg={msg}
                      isSelf={msg.senderId === 'user_self'}
                      currentUserId="user_self"
                      currentUserName={profile.name || 'Ashik Hossain'}
                      allMembers={DEFAULT_CHAT_MEMBERS}
                      allGroups={CHAT_MENTION_GROUPS}
                      onToggleReaction={handleToggleReaction}
                      onMentionUser={name => setComposerText(prev => `${prev} @${name} `)}
                      onViewMemberProfile={m => setSelectedMemberForCard(m)}
                      onTogglePin={handleTogglePin}
                      onReply={m => setReplyingToMessage(m)}
                      onToggleStar={handleToggleStar}
                      onVotePoll={handleVotePoll}
                      onDeleteMsg={handleDeleteMessage}
                    />
                  ))}

                  {/* Typing Indicator */}
                  {isColleagueTyping && (
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-white shadow-xs max-w-[120px] mb-2 animate-in fade-in">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.2s]" />
                        <span className="w-2 h-2 rounded-full bg-[#00a884] animate-bounce [animation-delay:0.4s]" />
                      </div>
                      <span className="text-[10px] text-[#54656f] font-bold">typing</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* Quoted Reply Preview Bar                                          */}
                {/* ----------------------------------------------------------------- */}
                {replyingToMessage && (
                  <div className="px-4 py-2 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center justify-between z-20 animate-in slide-in-from-bottom">
                    <div className="flex items-center gap-2 border-l-4 border-[#00a884] pl-2 min-w-0">
                      <div>
                        <span className="text-xs font-bold text-[#00a884] block">
                          Replying to {replyingToMessage.senderName}
                        </span>
                        <p className="text-xs text-[#54656f] truncate max-w-sm sm:max-w-lg">
                          {replyingToMessage.content}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="p-1 rounded-full text-[#54656f] hover:bg-[#d1d7db]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* ----------------------------------------------------------------- */}
                {/* WhatsApp Shop-Floor Quick Action Chips Slider                     */}
                {/* ----------------------------------------------------------------- */}
                <div className="px-3 py-1.5 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center gap-1.5 overflow-x-auto z-10">
                  {QUICK_SHOP_FLOOR_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(chip.text)}
                      className="shrink-0 px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 text-[#111b21] border border-[#d1d7db] text-[11px] font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* ----------------------------------------------------------------- */}
                {/* WhatsApp Bottom Input Bar                                         */}
                {/* ----------------------------------------------------------------- */}
                <div className="p-2 sm:p-3 bg-[#f0f2f5] border-t border-[#d1d7db] flex items-center gap-2 z-20 relative">
                  {/* Emoji Drawer Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmojiDrawerOpen(prev => !prev);
                      setIsAttachMenuOpen(false);
                    }}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isEmojiDrawerOpen ? 'text-[#00a884] bg-white' : 'text-[#54656f] hover:bg-[#d1d7db]'
                    }`}
                    title="Emojis & stickers"
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Attachment Menu Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAttachMenuOpen(prev => !prev);
                      setIsEmojiDrawerOpen(false);
                    }}
                    className={`p-2 rounded-full transition-colors cursor-pointer ${
                      isAttachMenuOpen ? 'text-[#00a884] bg-white' : 'text-[#54656f] hover:bg-[#d1d7db]'
                    }`}
                    title="Attach documents, photos, poll"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Live Voice Recording Bar OR Standard Text Box */}
                  {isRecordingVoice ? (
                    <div className="flex-1 flex items-center justify-between px-4 py-2 rounded-2xl bg-white border border-rose-300 shadow-xs animate-pulse">
                      <div className="flex items-center gap-2 text-rose-600">
                        <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                        <span className="font-mono text-xs font-bold">
                          Recording Voice: {Math.floor(voiceRecordSeconds / 60)}:
                          {voiceRecordSeconds % 60 < 10 ? '0' : ''}
                          {voiceRecordSeconds % 60}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelVoiceNote}
                          className="px-3 py-1 rounded-lg text-xs font-bold text-[#54656f] hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSendVoiceNote}
                          className="px-4 py-1 rounded-full bg-[#00a884] text-white text-xs font-bold hover:bg-[#008f6f] cursor-pointer"
                        >
                          Send Voice Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 relative flex items-center">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={composerText}
                        onChange={e => setComposerText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type a message"
                        className="w-full px-4 py-2 rounded-2xl bg-white text-xs sm:text-sm text-[#111b21] placeholder-[#8696a0] border border-[#d1d7db] focus:border-[#00a884] focus:outline-hidden resize-none max-h-24 shadow-2xs"
                      />
                    </div>
                  )}

                  {/* Voice Note Mic Button OR Send Paper Plane */}
                  {!composerText.trim() && !isRecordingVoice ? (
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(true)}
                      className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white transition-all cursor-pointer shadow-md"
                      title="Record Voice Message"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={!composerText.trim()}
                      className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white transition-all cursor-pointer shadow-md"
                      title="Send Message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}

                  {/* Popups & Drawers */}
                  <WhatsAppEmojiDrawer
                    onSelectEmoji={emoji => setComposerText(prev => prev + emoji)}
                    onClose={() => setIsEmojiDrawerOpen(false)}
                  />

                  <WhatsAppAttachMenu
                    isOpen={isAttachMenuOpen}
                    onClose={() => setIsAttachMenuOpen(false)}
                    onAttachDocument={handleAttachDocument}
                    onAttachPhoto={handleAttachPhoto}
                    onOpenPoll={() => setIsPollModalOpen(true)}
                    onAttachAlert={handleAttachAlert}
                    onShareContact={handleShareContact}
                  />
                </div>
              </div>

              {/* =================================================================== */}
              {/* RIGHT DRAWER: Contact / Channel Info Sidebar                        */}
              {/* =================================================================== */}
              {showContactInfo && (
                <div className="w-72 sm:w-80 bg-[#111b21] border-l border-[#222e35] p-5 flex flex-col justify-between overflow-y-auto text-[#e9edef] animate-in slide-in-from-right z-30 shrink-0">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-[#222e35]">
                      <h3 className="font-bold text-sm text-white">Contact Info</h3>
                      <button
                        type="button"
                        onClick={() => setShowContactInfo(false)}
                        className="p-1 rounded-lg text-[#8696a0] hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Avatar & Role */}
                    <div className="text-center space-y-2">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-[#00a884] bg-slate-800 shadow-xl">
                        {chatAvatar ? (
                          <img src={chatAvatar} alt={chatTitle} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-[#008069] flex items-center justify-center text-2xl font-bold text-white">
                            {chatTitle.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-white">{chatTitle}</h3>
                      <p className="text-xs text-[#8696a0]">{chatSubtitle}</p>
                    </div>

                    {/* About & Phone */}
                    <div className="p-3.5 rounded-2xl bg-[#202c33] space-y-3 border border-[#2a3942]">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#8696a0] block">
                          About &amp; Status
                        </span>
                        <p className="text-xs text-white mt-0.5">
                          {activeMember?.statusMessage || 'Shop floor engineering & line optimization'}
                        </p>
                      </div>

                      {activeMember?.phone && (
                        <div>
                          <span className="text-[10px] font-bold uppercase text-[#8696a0] block">
                            Direct Phone
                          </span>
                          <p className="text-xs text-[#00a884] font-mono mt-0.5 font-bold">
                            {activeMember.phone}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Encryption & Security */}
                    <div className="p-3.5 rounded-2xl bg-[#202c33] flex items-center gap-3 border border-[#2a3942]">
                      <ShieldCheck className="w-6 h-6 text-[#00a884]" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Encryption</h4>
                        <p className="text-[10px] text-[#8696a0]">
                          Messages and calls are end-to-end encrypted.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTeamMessages(prev => prev.filter(m => m.channelId !== activeChatId));
                      setShowContactInfo(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 font-bold text-xs border border-rose-500/30 cursor-pointer"
                  >
                    Clear Conversation
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Sub-Modals: Calls, Status Stories, Poll, Member Profile                   */}
      {/* ========================================================================= */}
      <WhatsAppCallModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        contact={activeMember}
        channel={activeChannel}
        isVideo={isCallVideo}
      />

      <WhatsAppStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        stories={statusStories}
        initialIndex={statusModalIndex}
        onSendStatusReply={(authorName, text) => {
          handleSendMessage(`Replying to ${authorName}'s status: ${text}`);
        }}
        onAddStatus={newStory => {
          setStatusStories(prev => [newStory, ...prev]);
        }}
        profile={profile}
      />

      <WhatsAppPollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onSubmitPoll={handleCreatePoll}
      />

      {selectedMemberForCard && (
        <ChatMemberCardModal
          member={selectedMemberForCard}
          onClose={() => setSelectedMemberForCard(null)}
          onMentionMember={name => setComposerText(prev => `${prev} @${name} `)}
          onStartDirectMessage={memberId => {
            setActiveChatId(`dm_${memberId}`);
            setActiveTab('chats');
            setSelectedMemberForCard(null);
          }}
        />
      )}
    </div>
  );
};
