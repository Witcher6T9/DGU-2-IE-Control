import React, { useState, useRef, useEffect } from 'react';
import { 
  Pin, 
  Send, 
  AtSign, 
  Smile, 
  MessageSquare, 
  Hash, 
  Check, 
  AlertTriangle, 
  Users, 
  Info,
  ChevronDown,
  Bell,
  Search,
  Sliders,
  Calculator,
  Compass,
  BarChart3,
  Target,
  Wrench,
  Clock,
  ShieldAlert
} from 'lucide-react';

export interface ChatUser {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  status: 'online' | 'on_floor' | 'busy';
  assignedLine?: string;
  shift?: string;
  specialization?: string;
  email?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  iconName: string;
  memberCount: number;
  unreadCount?: number;
  category: 'ie' | 'floor' | 'urgent' | 'technical';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  channelId: string;
  content: string;
  timestamp: string;
  createdAt: number;
  taggedLine?: string;
  taggedStation?: string;
  category: 'general' | 'bottleneck' | 'kaizen' | 'quality' | 'maintenance';
  mentions?: string[]; // IDs or handles
  reactions?: Record<string, string[]>;
  isPinned?: boolean;
  pinnedBy?: string;
  pinnedAt?: number;
}

export interface UserMentionGroup {
  id: string;
  name: string;
  handle: string;
  department: string;
  description: string;
  badge: string;
}

// Default standard users from Debonair Unit-02 IE Operations
export const DEFAULT_USERS: ChatUser[] = [
  {
    id: 'user_ashik',
    name: 'Ashik Hossain',
    role: 'Senior Industrial Engineer Lead',
    department: 'IE',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    assignedLine: 'All Floors',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Work Study, Pitch Diagram & Line Setup',
    email: 'ashikhossainkr@gmail.com'
  },
  {
    id: 'user_kamrul',
    name: 'Engr. Kamrul Hasan',
    role: 'IE Specialist (Work Study & GSD)',
    department: 'IE',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    assignedLine: 'Lines 01 - 03',
    shift: 'General (08:00 - 17:00)',
    specialization: 'SMV Standard, GSD Rating & Allowances',
    email: 'kamrul.ie@textile-garments.com'
  },
  {
    id: 'user_nusrat',
    name: 'Nusrat Jahan',
    role: 'Line Balancing & Ergonomics Engineer',
    department: 'IE',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    assignedLine: 'Lines 04 - 05',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Yamazumi Balancing, Takt Time & Workplace Ergonomics',
    email: 'nusrat.ie@textile-garments.com'
  },
  {
    id: 'user_jannat',
    name: 'Jannatul Ferdous',
    role: 'Junior IE Executive',
    department: 'IE',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    assignedLine: 'Line 02 & 03',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Method Study & Video Cycle Analysis',
    email: 'jannat.ie@textile-garments.com'
  },
  {
    id: 'user_tanvir',
    name: 'Engr. Tanvir Ahmed',
    role: 'Floor Production Manager',
    department: 'Floor Management',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    assignedLine: 'Unit 01',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Daily Target & Plant Execution',
    email: 'tanvir.prod@textile-garments.com'
  },
  {
    id: 'user_rafiqul',
    name: 'Md. Rafiqul Islam',
    role: 'Line Supervisor (Line 04)',
    department: 'Production',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    status: 'on_floor',
    assignedLine: 'Line 04',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Operator Management & Bundle Flow'
  },
  {
    id: 'user_sultana',
    name: 'Sultana Begum',
    role: 'Quality In-Charge (In-Line QC)',
    department: 'Quality',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
    status: 'online',
    assignedLine: 'Lines 01-05',
    shift: 'General (08:00 - 17:00)',
    specialization: 'DHU Mitigation, SPI & Seam Integrity'
  },
  {
    id: 'user_faruk',
    name: 'Faruk Ahmed',
    role: 'Chief Maintenance Mechanic',
    department: 'Maintenance',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    status: 'busy',
    assignedLine: 'Maintenance Bay B',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Folder Jigs, Machine RPM & Gauge Adjustments'
  }
];

// Broadcast and role mention groups
export const MENTION_GROUPS: UserMentionGroup[] = [
  { id: 'group_ie', name: 'IE Team', handle: '@IE Team', department: 'IE', description: 'Notify all Industrial Engineering specialists and work-study officers', badge: 'IE Division' },
  { id: 'group_supervisors', name: 'Supervisors', handle: '@Supervisors', department: 'Production', description: 'Notify all line supervisors and floor captains', badge: 'Production' },
  { id: 'group_maintenance', name: 'Maintenance', handle: '@Maintenance', department: 'Maintenance', description: 'Notify machine workshop and maintenance mechanics', badge: 'Technical' },
  { id: 'group_quality', name: 'Quality Team', handle: '@Quality', department: 'Quality', description: 'Notify in-line QA/QC inspectors and quality in-charge', badge: 'QC / Audit' },
  { id: 'group_all', name: 'All Floor', handle: '@All', department: 'Floor Management', description: 'Broadcast announcement to all active line personnel', badge: 'Broadcast' }
];

export const CHAT_CHANNELS: ChatChannel[] = [
  { id: 'ie-line-balancing', name: 'ie-line-balancing', description: 'Bottleneck elimination, Yamazumi pitch charts, takt time sync & floater routing', iconName: 'Sliders', memberCount: 8, unreadCount: 1, category: 'ie' },
  { id: 'ie-time-study', name: 'ie-time-study', description: 'SMV benchmarking, cycle time recordings, rating factor & allowance studies', iconName: 'Calculator', memberCount: 8, unreadCount: 0, category: 'ie' },
  { id: 'ie-method-study', name: 'ie-method-study', description: 'Motion economy, folder attachments, ergonomic jigs & workstation layouts', iconName: 'Compass', memberCount: 8, unreadCount: 0, category: 'ie' },
  { id: 'ie-capacity-planning', name: 'ie-capacity-planning', description: 'Line loading, man-machine ratios, SAM calculations & operator skill matrix', iconName: 'BarChart3', memberCount: 8, unreadCount: 0, category: 'ie' },
  { id: 'ie-kaizen-ci', name: 'ie-kaizen-ci', description: 'Continuous improvement, 5S floor audits, setup reduction & Muda waste tracking', iconName: 'Target', memberCount: 8, unreadCount: 0, category: 'ie' },
  { id: 'general-floor', name: 'general-floor', description: 'Shop floor announcements, shift sync & hourly output pace', iconName: 'MessageSquare', memberCount: 28, unreadCount: 0, category: 'floor' },
  { id: 'line-bottlenecks', name: 'line-bottlenecks', description: 'Workstation cycle surges, bundle starvation & WIP balancing', iconName: 'AlertTriangle', memberCount: 16, unreadCount: 1, category: 'urgent' },
  { id: 'maintenance-alerts', name: 'maintenance-alerts', description: 'Machine breakdowns, needle jam & folder gauge adjustments', iconName: 'Wrench', memberCount: 12, unreadCount: 0, category: 'technical' },
  { id: 'quality-alerts', name: 'quality-alerts', description: 'In-line DHU spikes, seam puckering & SPI compliance', iconName: 'ShieldAlert', memberCount: 14, unreadCount: 0, category: 'floor' },
  { id: 'shift-handover', name: 'shift-handover', description: 'Daily target variances, WIP transition & line carryovers', iconName: 'Clock', memberCount: 18, unreadCount: 0, category: 'floor' }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_ie_201',
    senderId: 'user_ashik',
    senderName: 'Ashik Hossain',
    senderRole: 'Senior Industrial Engineer Lead',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    channelId: 'ie-line-balancing',
    content: 'Morning @IE Team. On Line 04 Polo run, takt time is 48.0s but Station 08 (Collar Join) is fluctuating at 61-64s. @Nusrat Jahan please inspect the Yamazumi chart and see if we can reroute notch trimming to Station 07.',
    timestamp: '08:30 AM',
    createdAt: Date.now() - 9000000,
    taggedLine: 'Line 04',
    taggedStation: 'Station 08 (Collar Join)',
    category: 'bottleneck',
    mentions: ['group_ie', 'user_nusrat'],
    reactions: { '👍': ['user_nusrat', 'user_kamrul'] }
  },
  {
    id: 'msg_ie_202',
    senderId: 'user_nusrat',
    senderName: 'Nusrat Jahan',
    senderRole: 'Line Balancing & Ergonomics Engineer',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    channelId: 'ie-line-balancing',
    content: 'Checked @Ashik Hossain! Running pitch simulation now. If we offload the 11.5s tab notch trimming to Station 07, Station 08 cycle drops to 47.2s which is safely under our 48s takt. @Md. Rafiqul Islam has been briefed on floater positioning.',
    timestamp: '08:42 AM',
    createdAt: Date.now() - 8280000,
    taggedLine: 'Line 04',
    category: 'general',
    mentions: ['user_ashik', 'user_rafiqul'],
    isPinned: true,
    pinnedBy: 'Ashik Hossain',
    pinnedAt: Date.now() - 7200000,
    reactions: { '🎯': ['user_ashik', 'user_tanvir'], '✅': ['user_rafiqul'] }
  },
  {
    id: 'msg_ie_203',
    senderId: 'user_kamrul',
    senderName: 'Engr. Kamrul Hasan',
    senderRole: 'IE Specialist (Work Study & GSD)',
    senderAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80',
    channelId: 'ie-time-study',
    content: 'Completed 15-cycle stopwatch work study for French Placket prep on Line 02. Observed cycle: 28.4s. Performance rating: 95%. Standard Allowance: 12.5%. Calculated Standard Minute Value (SMV) = 0.505 min (30.3s). GSD database updated.',
    timestamp: '09:10 AM',
    createdAt: Date.now() - 6600000,
    taggedLine: 'Line 02',
    category: 'general',
    mentions: ['group_ie'],
    reactions: { '📊': ['user_ashik'] }
  },
  {
    id: 'msg_ie_204',
    senderId: 'user_tanvir',
    senderName: 'Engr. Tanvir Ahmed',
    senderRole: 'Floor Production Manager',
    senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    channelId: 'ie-line-balancing',
    content: 'Notice to @All: Today we have buyer technical audit from H&M on Korotoya Floor (Lines 18-24). Please ensure 10-day tech packs, SPI control charts, and hourly pitch pacing monitors are fully updated by 11:00 AM.',
    timestamp: '09:30 AM',
    createdAt: Date.now() - 5400000,
    category: 'general',
    mentions: ['group_all', 'group_supervisors'],
    isPinned: true,
    pinnedBy: 'Engr. Tanvir Ahmed',
    pinnedAt: Date.now() - 5000000,
    reactions: { '👍': ['user_ashik', 'user_rafiqul', 'user_sultana'] }
  }
];

export const IEDepartmentalChat: React.FC = () => {
  const [activeChannelId, setActiveChannelId] = useState<string>('ie-line-balancing');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('ie_team_chat_messages_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_MESSAGES;
  });

  const [currentUser] = useState<ChatUser>(DEFAULT_USERS[0]); // Current user: Ashik Hossain
  const [inputText, setInputText] = useState<string>('');
  const [taggedLine, setTaggedLine] = useState<string>('');
  const [taggedStation, setTaggedStation] = useState<string>('');
  const [showMentionPopup, setShowMentionPopup] = useState<boolean>(false);
  const [mentionFilter, setMentionFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyPinned, setOnlyPinned] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ie_team_chat_messages_v2', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChannelId, messages]);

  // Current channel info
  const activeChannel = CHAT_CHANNELS.find(c => c.id === activeChannelId) || CHAT_CHANNELS[0];

  // Channel messages with filter
  const channelMessages = messages.filter(m => {
    if (m.channelId !== activeChannelId) return false;
    if (onlyPinned && !m.isPinned) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesContent = m.content.toLowerCase().includes(q);
      const matchesSender = m.senderName.toLowerCase().includes(q);
      const matchesLine = m.taggedLine?.toLowerCase().includes(q);
      if (!matchesContent && !matchesSender && !matchesLine) return false;
    }
    return true;
  });

  // Pinned notices for top pinned alert bar
  const pinnedNotices = messages.filter(m => m.channelId === activeChannelId && m.isPinned);

  // Toggle pin
  const handleTogglePin = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const nextPinned = !msg.isPinned;
        return {
          ...msg,
          isPinned: nextPinned,
          pinnedBy: nextPinned ? currentUser.name : undefined,
          pinnedAt: nextPinned ? Date.now() : undefined
        };
      }
      return msg;
    }));
  };

  // Add reaction
  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const currentReactions = { ...(msg.reactions || {}) };
        const users = currentReactions[emoji] ? [...currentReactions[emoji]] : [];
        if (users.includes(currentUser.id)) {
          // Remove reaction
          const nextUsers = users.filter(u => u !== currentUser.id);
          if (nextUsers.length === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = nextUsers;
          }
        } else {
          // Add reaction
          currentReactions[emoji] = [...users, currentUser.id];
        }
        return { ...msg, reactions: currentReactions };
      }
      return msg;
    }));
  };

  // Handle send
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // Detect mentions in text
    const detectedMentions: string[] = [];
    MENTION_GROUPS.forEach(g => {
      if (inputText.includes(g.handle)) detectedMentions.push(g.id);
    });
    DEFAULT_USERS.forEach(u => {
      if (inputText.includes(`@${u.name}`)) detectedMentions.push(u.id);
    });

    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: `msg_ie_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      channelId: activeChannelId,
      content: inputText.trim(),
      timestamp: timeString,
      createdAt: Date.now(),
      taggedLine: taggedLine.trim() ? taggedLine.trim() : undefined,
      taggedStation: taggedStation.trim() ? taggedStation.trim() : undefined,
      category: taggedStation ? 'bottleneck' : 'general',
      mentions: detectedMentions.length > 0 ? detectedMentions : undefined,
      reactions: {}
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setTaggedLine('');
    setTaggedStation('');
    setShowMentionPopup(false);
  };

  // Handle typing input and trigger mention popup
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1 && !textBefore.slice(lastAt).includes(' ')) {
      setMentionFilter(textBefore.slice(lastAt + 1).toLowerCase());
      setShowMentionPopup(true);
    } else {
      setShowMentionPopup(false);
    }
  };

  // Insert mention into input
  const insertMention = (handleOrName: string) => {
    if (!inputRef.current) return;
    const cursor = inputRef.current.selectionStart;
    const textBefore = inputText.slice(0, cursor);
    const lastAt = textBefore.lastIndexOf('@');
    const textAfter = inputText.slice(cursor);

    const prefix = lastAt !== -1 ? inputText.slice(0, lastAt) : inputText;
    const mentionText = `@${handleOrName} `;
    setInputText(`${prefix}${mentionText}${textAfter}`);
    setShowMentionPopup(false);
    inputRef.current.focus();
  };

  // Highlight mentions in content text
  const renderMessageContent = (content: string) => {
    const words = content.split(/(\s+)/);
    return words.map((word, i) => {
      if (word.startsWith('@')) {
        return (
          <span 
            key={i} 
            className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60"
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const getChannelIcon = (name: string) => {
    switch (name) {
      case 'Sliders': return <Sliders className="w-3.5 h-3.5" />;
      case 'Calculator': return <Calculator className="w-3.5 h-3.5" />;
      case 'Compass': return <Compass className="w-3.5 h-3.5" />;
      case 'BarChart3': return <BarChart3 className="w-3.5 h-3.5" />;
      case 'Target': return <Target className="w-3.5 h-3.5" />;
      case 'Wrench': return <Wrench className="w-3.5 h-3.5" />;
      case 'Clock': return <Clock className="w-3.5 h-3.5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'AlertTriangle': return <AlertTriangle className="w-3.5 h-3.5" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Top Banner */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-800 text-white">
              Industrial Engineering Channel
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-teal-50 text-teal-800 border border-teal-200">
              Real-time Field Comms
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            IE Departmental Chat &amp; Operational Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Pin critical workstation notices, broadcast work-study protocols, and tag floor IE engineers with instant user mentions.
          </p>
        </div>

        {/* Current Active User Profile Pill */}
        <div className="flex items-center gap-3 p-2 bg-stone-50 rounded-xl border border-stone-200">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-10 h-10 rounded-full object-cover border border-teal-700" 
          />
          <div className="text-left text-xs">
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <span>{currentUser.name}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
            </div>
            <div className="text-[11px] text-teal-800 font-medium">{currentUser.role}</div>
            <div className="text-[10px] text-stone-400 font-mono-numbers">{currentUser.assignedLine}</div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Chat Layout: Channels List (Left) + Active Channel Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Channels & Online IE Personnel (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Channel Selector */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
                Floor Channels ({CHAT_CHANNELS.length})
              </span>
              <span className="text-[10px] font-mono-numbers bg-stone-100 px-1.5 py-0.5 rounded text-stone-600">
                Unit-02
              </span>
            </div>

            <div className="space-y-1">
              {CHAT_CHANNELS.map(ch => {
                const isActive = ch.id === activeChannelId;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-teal-800 text-white font-bold shadow-xs' 
                        : 'hover:bg-stone-50 text-stone-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-white' : 'text-stone-400'}>
                        {getChannelIcon(ch.iconName)}
                      </span>
                      <div className="truncate">
                        <div className="truncate font-mono">#{ch.name}</div>
                        <div className={`text-[10px] truncate ${isActive ? 'text-teal-200' : 'text-stone-400'}`}>
                          {ch.description}
                        </div>
                      </div>
                    </div>

                    {ch.unreadCount && ch.unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-500 text-white font-mono-numbers">
                        {ch.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Directory / Quick Mentions */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-teal-800" />
                <span>IE Field Officers ({DEFAULT_USERS.length})</span>
              </span>
            </div>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {DEFAULT_USERS.map(user => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-7 h-7 rounded-full object-cover border border-stone-200" 
                      />
                      <span 
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white ${
                          user.status === 'online' ? 'bg-emerald-500' : user.status === 'on_floor' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} 
                      />
                    </div>
                    <div>
                      <div className="font-bold text-stone-900 leading-tight flex items-center gap-1">
                        <span>{user.name}</span>
                      </div>
                      <div className="text-[10px] text-stone-400">{user.role}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => insertMention(user.name)}
                    className="px-2 py-1 rounded bg-stone-100 hover:bg-teal-50 hover:text-teal-800 text-[10px] font-mono font-bold text-stone-600 transition-colors cursor-pointer"
                    title={`Mention ${user.name}`}
                  >
                    @{user.name.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Tag Groups */}
            <div className="pt-2 border-t border-stone-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                Quick Role Tagging:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MENTION_GROUPS.map(grp => (
                  <button
                    key={grp.id}
                    onClick={() => insertMention(grp.name)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
                  >
                    {grp.handle}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Feed, Pinned Notices & Composer (8 Cols) */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col min-h-[640px]">
          {/* Active Channel Header */}
          <div className="p-4 border-b border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-teal-800">{getChannelIcon(activeChannel.iconName)}</span>
                <h2 className="text-base font-bold text-stone-900 font-mono">
                  #{activeChannel.name}
                </h2>
                <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                  {activeChannel.memberCount} Participants
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {activeChannel.description}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-7 pr-3 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-teal-700 w-36 sm:w-44"
                />
              </div>

              <button
                onClick={() => setOnlyPinned(!onlyPinned)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  onlyPinned 
                    ? 'bg-amber-100 border-amber-300 text-amber-900' 
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
                title="Toggle Pinned Notices Only"
              >
                <Pin className={`w-3.5 h-3.5 ${onlyPinned ? 'fill-amber-700 text-amber-700' : ''}`} />
                <span>{onlyPinned ? 'Pinned Only' : 'Filter Pinned'}</span>
              </button>
            </div>
          </div>

          {/* Pinned Notices Header Ribbon (if channel has pinned notices) */}
          {pinnedNotices.length > 0 && !onlyPinned && (
            <div className="bg-amber-50/70 border-b border-amber-200/80 p-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <Pin className="w-3.5 h-3.5 text-amber-700 fill-amber-700" />
                <span>Pinned Floor Notices ({pinnedNotices.length})</span>
              </div>

              <div className="space-y-1.5">
                {pinnedNotices.map(pin => (
                  <div 
                    key={`pin-${pin.id}`} 
                    className="p-2 bg-white rounded-lg border border-amber-200 text-xs text-stone-800 flex items-start justify-between gap-3 shadow-2xs"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5 text-[11px] mb-0.5">
                        <span className="font-bold text-stone-900">{pin.senderName}</span>
                        <span className="text-stone-400">·</span>
                        <span className="text-amber-800 font-medium">Pinned by {pin.pinnedBy}</span>
                        {pin.taggedLine && (
                          <span className="px-1.5 py-0.2 rounded bg-teal-50 text-teal-800 text-[10px] font-mono font-bold">
                            {pin.taggedLine}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-stone-700">{pin.content}</p>
                    </div>

                    <button
                      onClick={() => handleTogglePin(pin.id)}
                      className="text-stone-400 hover:text-amber-800 text-[11px] shrink-0 font-medium cursor-pointer"
                      title="Unpin notice"
                    >
                      Unpin
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages Feed Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[460px] bg-stone-50/30">
            {channelMessages.length === 0 ? (
              <div className="text-center py-16 text-stone-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-stone-600">No messages found in #{activeChannel.name}</p>
                <p className="text-[11px] mt-0.5">Be the first to post a pitch notice or mention a line engineer below.</p>
              </div>
            ) : (
              channelMessages.map(msg => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div 
                    key={msg.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      msg.isPinned 
                        ? 'bg-amber-50/40 border-amber-200/90 shadow-xs' 
                        : 'bg-white border-stone-200/80 shadow-2xs'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={msg.senderAvatar} 
                          alt={msg.senderName} 
                          className="w-8 h-8 rounded-full object-cover border border-stone-200" 
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">{msg.senderName}</span>
                            <span className="text-[10px] text-stone-400 font-mono-numbers">{msg.timestamp}</span>
                            {isMe && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-teal-100 text-teal-800 font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 font-medium">{msg.senderRole}</div>
                        </div>
                      </div>

                      {/* Top Action Tags & Pin Button */}
                      <div className="flex items-center gap-2">
                        {msg.taggedLine && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-teal-50 text-teal-900 border border-teal-200">
                            {msg.taggedLine}
                          </span>
                        )}
                        {msg.taggedStation && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                            {msg.taggedStation}
                          </span>
                        )}

                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className={`p-1.5 rounded hover:bg-stone-100 transition-colors cursor-pointer ${
                            msg.isPinned ? 'text-amber-700' : 'text-stone-400 hover:text-stone-700'
                          }`}
                          title={msg.isPinned ? `Pinned by ${msg.pinnedBy || 'User'}` : 'Pin this notice'}
                        >
                          <Pin className={`w-3.5 h-3.5 ${msg.isPinned ? 'fill-amber-700' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Message Body with Tag Rendering */}
                    <p className="text-xs text-stone-800 leading-relaxed pl-10 whitespace-pre-line font-normal">
                      {renderMessageContent(msg.content)}
                    </p>

                    {/* Footer: Reactions & Pin Badge */}
                    <div className="pl-10 mt-2.5 flex items-center justify-between gap-2">
                      {/* Reaction Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {['👍', '🎯', '✅', '⚠️', '📊'].map(emoji => {
                          const users = msg.reactions?.[emoji] || [];
                          const hasReacted = users.includes(currentUser.id);
                          return (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`px-1.5 py-0.5 rounded-md text-[11px] font-mono-numbers flex items-center gap-1 transition-colors cursor-pointer border ${
                                hasReacted 
                                  ? 'bg-teal-50 border-teal-300 text-teal-900 font-bold' 
                                  : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                              }`}
                            >
                              <span>{emoji}</span>
                              {users.length > 0 && <span className="text-[10px]">{users.length}</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Pinned Info Marker */}
                      {msg.isPinned && (
                        <div className="text-[10px] text-amber-800 flex items-center gap-1 font-medium">
                          <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                          <span>Pinned Notice by {msg.pinnedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User Mentions Autocomplete Floating Box */}
          {showMentionPopup && (
            <div className="mx-4 mb-2 p-2 bg-white border border-teal-300 rounded-xl shadow-lg space-y-1 max-h-48 overflow-y-auto text-xs z-20 animate-fadeIn">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-800 px-2 py-1 border-b border-stone-100">
                Mention Team Members or Roles
              </div>

              {/* Mention groups */}
              {MENTION_GROUPS.filter(g => g.name.toLowerCase().includes(mentionFilter) || g.handle.toLowerCase().includes(mentionFilter)).map(grp => (
                <button
                  key={grp.id}
                  onClick={() => insertMention(grp.name)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-teal-50 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-900">{grp.handle}</span>
                    <span className="text-stone-400 text-[10px]">({grp.description})</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-mono">
                    {grp.badge}
                  </span>
                </button>
              ))}

              {/* Individual Users */}
              {DEFAULT_USERS.filter(u => u.name.toLowerCase().includes(mentionFilter)).map(u => (
                <button
                  key={u.id}
                  onClick={() => insertMention(u.name)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-stone-50 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover" />
                    <span className="font-medium text-stone-900">@{u.name}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">{u.role}</span>
                </button>
              ))}
            </div>
          )}

          {/* Message Composer Footer */}
          <div className="p-4 border-t border-stone-200 bg-white space-y-3">
            {/* Quick Metadata Tags Row: Line & Station */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700">
                <span className="font-semibold text-stone-500">Line:</span>
                <input
                  type="text"
                  placeholder="e.g. Line 04"
                  value={taggedLine}
                  onChange={(e) => setTaggedLine(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-mono font-bold text-stone-900 w-24"
                />
              </div>

              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-stone-700">
                <span className="font-semibold text-stone-500">Station / Op:</span>
                <input
                  type="text"
                  placeholder="e.g. Station 08 (Collar Join)"
                  value={taggedStation}
                  onChange={(e) => setTaggedStation(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-stone-900 w-44"
                />
              </div>

              <button
                type="button"
                onClick={() => insertMention('IE Team')}
                className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                + Tag @IE Team
              </button>

              <button
                type="button"
                onClick={() => insertMention('Supervisors')}
                className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                + Tag @Supervisors
              </button>
            </div>

            {/* Input form */}
            <form onSubmit={handleSendMessage} className="relative">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={2}
                placeholder={`Post update to #${activeChannel.name}... Type @ to mention engineers or role teams.`}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3 pr-24 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-700 resize-none"
              />

              <div className="absolute right-2 bottom-2.5 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = !showMentionPopup;
                    setShowMentionPopup(next);
                    if (next) setMentionFilter('');
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-teal-800 hover:bg-stone-100 transition-colors cursor-pointer"
                  title="Tag user or role"
                >
                  <AtSign className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    inputText.trim() 
                      ? 'bg-teal-800 hover:bg-teal-900 text-white shadow-xs' 
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                  title="Send message (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
