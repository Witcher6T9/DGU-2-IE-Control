/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function getOfflineAvatar(initials: string, color: string = "#176f78"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${color}"/><text x="50" y="55" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="36" font-weight="700">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

import { ChatChannel, ChatUserMember, UserChatMessage } from '../types';

export const DEFAULT_CHAT_MEMBERS: ChatUserMember[] = [
  {
    id: 'user_ashik',
    name: 'Ashik Hossain',
    role: 'Senior Industrial Engineer Lead',
    department: 'IE',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'online',
    assignedLine: 'All Floors (18 - 25)',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Work Study, Pitch Diagram & Line Setup',
    email: 'ashikhossainkr@gmail.com',
    phone: '+880 1712-345678',
    badgeNumber: 'IE-001',
    extension: 'Ext. 301',
    lastActive: 'Active now',
    statusMessage: 'Optimizing Line 18-20 bottleneck & takt alignment'
  },
  {
    id: 'user_kamrul',
    name: 'Engr. Kamrul Hasan',
    role: 'IE Specialist (Work Study & GSD)',
    department: 'IE',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'online',
    assignedLine: 'Lines 18 - 20',
    shift: 'General (08:00 - 17:00)',
    specialization: 'SMV Standard, GSD Rating & Allowances',
    email: 'kamrul.ie@textile-garments.com',
    phone: '+880 1819-223344',
    badgeNumber: 'IE-014',
    extension: 'Ext. 304',
    lastActive: 'Active now',
    statusMessage: 'Verifying Collar Stitch SMV on Repeat Style'
  },
  {
    id: 'user_nusrat',
    name: 'Nusrat Jahan',
    role: 'Line Balancing & Ergonomics Engineer',
    department: 'IE',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'online',
    assignedLine: 'Lines 21 - 22',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Yamazumi Balancing, Takt Time & Ergonomics',
    email: 'nusrat.ie@textile-garments.com',
    phone: '+880 1733-889900',
    badgeNumber: 'IE-022',
    extension: 'Ext. 306',
    lastActive: 'Active now',
    statusMessage: 'Yamazumi balance study at Station 08'
  },
  {
    id: 'user_jannat',
    name: 'Jannatul Ferdous',
    role: 'Junior IE Executive',
    department: 'IE',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'online',
    assignedLine: 'Lines 23 - 25',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Method Study & Video Cycle Analysis',
    email: 'jannat.ie@textile-garments.com',
    phone: '+880 1912-776655',
    badgeNumber: 'IE-035',
    extension: 'Ext. 309',
    lastActive: '5m ago',
    statusMessage: 'Logging cycle variance on cuff hem operation'
  },
  {
    id: 'user_tanvir',
    name: 'Engr. Tanvir Ahmed',
    role: 'Floor Production Manager',
    department: 'Floor Management',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'busy',
    assignedLine: 'Plant #1 (All Units)',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Daily Target, Manpower & Plant Execution',
    email: 'tanvir.prod@textile-garments.com',
    phone: '+880 1711-445566',
    badgeNumber: 'FM-101',
    extension: 'Ext. 201',
    lastActive: '12m ago',
    statusMessage: 'In morning APM huddle reviewing Line 19 targets'
  },
  {
    id: 'user_rafiqul',
    name: 'Md. Rafiqul Islam',
    role: 'Line Supervisor (Line 18)',
    department: 'Production',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'on_floor',
    assignedLine: 'Line 18 (Padma)',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Operator Management & Bundle Feeding',
    phone: '+880 1817-665544',
    badgeNumber: 'PR-204',
    extension: 'Ext. 418',
    lastActive: '2m ago',
    statusMessage: 'Stationed at Line 18 output checking WIP flow'
  },
  {
    id: 'user_salma',
    name: 'Salma Akter',
    role: 'Line Supervisor (Line 20)',
    department: 'Production',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'on_floor',
    assignedLine: 'Line 20 (Jamuna)',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Assembly Line Flow & Multiskill Operator Reallocation',
    phone: '+880 1722-114477',
    badgeNumber: 'PR-212',
    extension: 'Ext. 420',
    lastActive: 'Just now',
    statusMessage: 'On floor rebalancing Line 20 collar sub-assembly'
  },
  {
    id: 'user_sultana',
    name: 'Sultana Begum',
    role: 'Quality In-Charge (In-Line QC)',
    department: 'Quality',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'online',
    assignedLine: 'Lines 18 - 25',
    shift: 'General (08:00 - 17:00)',
    specialization: 'DHU Mitigation, 11-12 SPI & Seam Integrity',
    email: 'sultana.qc@textile-garments.com',
    phone: '+880 1915-332211',
    badgeNumber: 'QC-308',
    extension: 'Ext. 510',
    lastActive: 'Active now',
    statusMessage: 'Auditing 7/0 traffic light system on Line 18'
  },
  {
    id: 'user_shirin',
    name: 'Shirin Sultana',
    role: 'End-Line QC Auditor',
    department: 'Quality',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'offline',
    assignedLine: 'End-Line Inspection Bay 2',
    shift: 'Shift B (14:00 - 22:00)',
    specialization: 'AQL 1.5 Sampling, Measurement & Buyer Standards',
    email: 'shirin.qc@textile-garments.com',
    phone: '+880 1788-223311',
    badgeNumber: 'QC-315',
    extension: 'Ext. 515',
    lastActive: '45m ago',
    statusMessage: 'Scheduled for 2nd shift inspection'
  },
  {
    id: 'user_faruk',
    name: 'Faruk Ahmed',
    role: 'Chief Maintenance Mechanic',
    department: 'Maintenance',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'busy',
    assignedLine: 'Maintenance Bay B',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Folder Jigs, Machine RPM & Gauge Adjustments',
    phone: '+880 1611-998877',
    badgeNumber: 'MT-055',
    extension: 'Ext. 601',
    lastActive: '8m ago',
    statusMessage: 'Calibrating differential feed dog on Line 19 Overlock'
  },
  {
    id: 'user_hasan',
    name: 'Hasan Mahmud',
    role: 'Pneumatic & Automation Technician',
    department: 'Maintenance',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'online',
    assignedLine: 'Workshop & Tech Lab',
    shift: 'General (08:00 - 17:00)',
    specialization: 'Auto Foot Lifters, Sensor Trimmers & Pressure Regulators',
    email: 'hasan.tech@textile-garments.com',
    phone: '+880 1822-445588',
    badgeNumber: 'MT-062',
    extension: 'Ext. 605',
    lastActive: 'Active now',
    statusMessage: 'Testing vacuum thread trimmer pressure at 6.0 Bar'
  },
  {
    id: 'user_monir',
    name: 'Monirul Haque',
    role: 'Cutting & Bundling Section Head',
    department: 'Production',
    avatar: getOfflineAvatar("IE", "#176f78"),
    status: 'offline',
    assignedLine: 'Cutting Table 01 - 04',
    shift: 'Morning Shift (06:00 - 14:00)',
    specialization: 'Spreading Tension, Marker Efficiency & Barcode Bundling',
    email: 'monir.cut@textile-garments.com',
    phone: '+880 1714-990022',
    badgeNumber: 'CT-401',
    extension: 'Ext. 110',
    lastActive: '2h ago',
    statusMessage: 'Shift completed • Handover submitted to Shift 2'
  }
];

export interface ChatMentionGroup {
  id: string;
  name: string;
  handle: string;
  department: string;
  description: string;
  badge: string;
}

export const CHAT_MENTION_GROUPS: ChatMentionGroup[] = [
  {
    id: 'group_ie',
    name: 'IE Team',
    handle: '@IE Team',
    department: 'IE',
    description: 'Notify all Industrial Engineering specialists and work-study officers',
    badge: 'IE Division'
  },
  {
    id: 'group_supervisors',
    name: 'Supervisors',
    handle: '@Supervisors',
    department: 'Production',
    description: 'Notify all line supervisors and floor captains',
    badge: 'Production'
  },
  {
    id: 'group_maintenance',
    name: 'Maintenance',
    handle: '@Maintenance',
    department: 'Maintenance',
    description: 'Notify machine workshop and maintenance mechanics',
    badge: 'Technical'
  },
  {
    id: 'group_quality',
    name: 'Quality Team',
    handle: '@Quality',
    department: 'Quality',
    description: 'Notify in-line QA/QC inspectors and quality in-charge',
    badge: 'QC / Audit'
  },
  {
    id: 'group_all',
    name: 'All Floor',
    handle: '@All',
    department: 'Floor Management',
    description: 'Broadcast announcement to all active line personnel',
    badge: 'Broadcast'
  }
];

export const DEFAULT_CHAT_CHANNELS: ChatChannel[] = [
  // --- IE Department Specialized Channels ---
  {
    id: 'ie-line-balancing',
    name: 'ie-line-balancing',
    description: 'Bottleneck elimination, Yamazumi pitch charts, takt time sync & floater routing',
    iconName: 'Sliders',
    memberCount: 8,
    unreadCount: 1,
    category: 'ie'
  },
  {
    id: 'ie-time-study',
    name: 'ie-time-study',
    description: 'SMV benchmarking, cycle time recordings, rating factor & allowance studies',
    iconName: 'Calculator',
    memberCount: 8,
    unreadCount: 0,
    category: 'ie'
  },
  {
    id: 'ie-method-study',
    name: 'ie-method-study',
    description: 'Motion economy, folder attachments, ergonomic jigs & workstation layouts',
    iconName: 'Compass',
    memberCount: 8,
    unreadCount: 0,
    category: 'ie'
  },
  {
    id: 'ie-capacity-planning',
    name: 'ie-capacity-planning',
    description: 'Line loading, man-machine ratios, SAM calculations & operator skill matrix',
    iconName: 'BarChart3',
    memberCount: 8,
    unreadCount: 0,
    category: 'ie'
  },
  {
    id: 'ie-kaizen-ci',
    name: 'ie-kaizen-ci',
    description: 'Continuous improvement, 5S floor audits, setup reduction & Muda waste tracking',
    iconName: 'Target',
    memberCount: 8,
    unreadCount: 0,
    category: 'ie'
  },
  // --- Cross-Departmental Shop Floor Channels ---
  {
    id: 'general-floor',
    name: 'general-floor',
    description: 'Shop floor announcements, shift sync & hourly output pace',
    iconName: 'MessageSquare',
    memberCount: 28,
    unreadCount: 0,
    category: 'floor'
  },
  {
    id: 'line-bottlenecks',
    name: 'line-bottlenecks',
    description: 'Workstation cycle surges, bundle starvation & WIP balancing',
    iconName: 'AlertTriangle',
    memberCount: 16,
    unreadCount: 1,
    category: 'urgent'
  },
  {
    id: 'maintenance-alerts',
    name: 'maintenance-alerts',
    description: 'Machine breakdowns, needle jam & folder gauge adjustments',
    iconName: 'Wrench',
    memberCount: 12,
    unreadCount: 0,
    category: 'technical'
  },
  {
    id: 'quality-alerts',
    name: 'quality-alerts',
    description: 'In-line DHU spikes, seam puckering & SPI compliance',
    iconName: 'ShieldAlert',
    memberCount: 14,
    unreadCount: 0,
    category: 'floor'
  },
  {
    id: 'shift-handover',
    name: 'shift-handover',
    description: 'Daily target variances, WIP transition & line carryovers',
    iconName: 'Clock',
    memberCount: 18,
    unreadCount: 0,
    category: 'floor'
  }
];

export const INITIAL_USER_CHAT_MESSAGES: UserChatMessage[] = [
  // --- IE Line Balancing Channel Messages ---
  {
    id: 'msg_ie_201',
    senderId: 'user_ashik',
    senderName: 'Ashik Hossain',
    senderRole: 'Senior Industrial Engineer Lead',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'ie-line-balancing',
    content: 'Morning @IE Team. On Line 04 Polo run, takt time is 48.0s but Station 08 (Collar Join) is fluctuating at 61-64s. @Nusrat Jahan please inspect the Yamazumi chart and see if we can reroute notch trimming to Station 07.',
    timestamp: '08:30 AM',
    createdAt: Date.now() - 1000 * 60 * 150,
    taggedLine: 'Line 04',
    taggedStation: 'Station 08 (Collar Join)',
    category: 'bottleneck',
    mentions: ['group_ie', 'user_nusrat'],
    reactions: {
      '👍': ['user_nusrat', 'user_kamrul']
    }
  },
  {
    id: 'msg_ie_202',
    senderId: 'user_nusrat',
    senderName: 'Nusrat Jahan',
    senderRole: 'Line Balancing & Ergonomics Engineer',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'ie-line-balancing',
    content: 'Checked @Ashik Hossain! Running pitch simulation now. If we offload the 11.5s tab notch trimming to Station 07, Station 08 cycle drops to 47.2s which is safely under our 48s takt. @Md. Rafiqul Islam has been briefed on floater positioning.',
    timestamp: '08:42 AM',
    createdAt: Date.now() - 1000 * 60 * 138,
    taggedLine: 'Line 04',
    category: 'general',
    mentions: ['user_ashik', 'user_rafiqul'],
    isPinned: true,
    pinnedBy: 'Ashik Hossain',
    pinnedAt: Date.now() - 1000 * 60 * 120,
    reactions: {
      '🎯': ['user_ashik', 'user_tanvir'],
      '✅': ['user_rafiqul']
    }
  },
  // --- IE Time Study Channel Messages ---
  {
    id: 'msg_ie_203',
    senderId: 'user_kamrul',
    senderName: 'Engr. Kamrul Hasan',
    senderRole: 'IE Specialist (Work Study & GSD)',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'ie-time-study',
    content: 'Completed 15-cycle stopwatch work study for French Placket prep on Line 02. Observed cycle: 28.4s. Performance rating: 95%. Standard Allowance: 12.5%. Calculated Standard Minute Value (SMV) = 0.505 min (30.3s). GSD database updated.',
    timestamp: '09:10 AM',
    createdAt: Date.now() - 1000 * 60 * 110,
    taggedLine: 'Line 02',
    category: 'general',
    mentions: ['group_ie'],
    reactions: {
      '📊': ['user_ashik', 'user_jannat']
    }
  },
  {
    id: 'msg_ie_204',
    senderId: 'user_jannat',
    senderName: 'Jannatul Ferdous',
    senderRole: 'Junior IE Executive',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'ie-method-study',
    content: '@Faruk Ahmed @Maintenance, request for folder attachment: Line 03 bottom hem folding is currently done manually taking 16.2s. A swing-out binder folder will reduce cycle time to 9.8s (saving ~6.4s per garment). Attached jig specs to maintenance bay.',
    timestamp: '09:45 AM',
    createdAt: Date.now() - 1000 * 60 * 75,
    taggedLine: 'Line 03',
    category: 'general',
    mentions: ['user_faruk', 'group_maintenance'],
    reactions: {
      '🔧': ['user_faruk'],
      '💡': ['user_ashik']
    }
  },
  // --- Cross-Functional Operations ---
  {
    id: 'msg_101',
    senderId: 'user_tanvir',
    senderName: 'Engr. Tanvir Ahmed',
    senderRole: 'Floor Production Manager',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'general-floor',
    content: 'Good morning team. Today our factory target is 4,750 pcs across all 5 active lines. Line 04 has the new Polo style running at 58% target efficiency. Let us keep bundle flow steady. @Supervisors please watch WIP queues.',
    timestamp: '08:15 AM',
    createdAt: Date.now() - 1000 * 60 * 180,
    category: 'general',
    mentions: ['group_supervisors'],
    isPinned: true,
    pinnedBy: 'Engr. Tanvir Ahmed',
    pinnedAt: Date.now() - 1000 * 60 * 175,
    reactions: {
      '👍': ['user_ashik', 'user_rafiqul', 'user_sultana'],
      '🔥': ['user_jannat']
    }
  },
  {
    id: 'msg_102',
    senderId: 'user_rafiqul',
    senderName: 'Md. Rafiqul Islam',
    senderRole: 'Line Supervisor (Line 04)',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'line-bottlenecks',
    content: 'Alert on Line 04: Station 08 (Collar Join) is pacing at 64s vs Target 48s. WIP is piling up with 35 bundles at station buffer. @IE Team please advise on line balancing.',
    timestamp: '09:20 AM',
    createdAt: Date.now() - 1000 * 60 * 110,
    isUrgent: true,
    taggedLine: 'Line 04',
    taggedStation: 'Station 08 (Collar Join)',
    category: 'bottleneck',
    mentions: ['group_ie'],
    reactions: {
      '🚨': ['user_ashik', 'user_tanvir']
    },
    acknowledgedBy: ['user_ashik']
  },
  {
    id: 'msg_103',
    senderId: 'user_ashik',
    senderName: 'Ashik Hossain',
    senderRole: 'Senior Industrial Engineer Lead',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'line-bottlenecks',
    content: '@Md. Rafiqul Islam: Reviewing Line 04 balance. Station 08 operator is waiting on notched collar tabs. I have authorized Floater Operator (Aklima) to split collar notch trimming. That pulls station cycle to 46s.',
    timestamp: '09:28 AM',
    createdAt: Date.now() - 1000 * 60 * 95,
    taggedLine: 'Line 04',
    category: 'bottleneck',
    mentions: ['user_rafiqul'],
    reactions: {
      '✅': ['user_rafiqul', 'user_tanvir']
    }
  },
  {
    id: 'msg_104',
    senderId: 'user_faruk',
    senderName: 'Faruk Ahmed',
    senderRole: 'Chief Maintenance Mechanic',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'maintenance-alerts',
    content: '@Jannatul Ferdous @Ashik Hossain: Overlock machine #M-0412 on Line 02 has knife timing recalibrated and binder bracket installed. Tested at 4,500 RPM with zero seam puckering.',
    timestamp: '10:05 AM',
    createdAt: Date.now() - 1000 * 60 * 60,
    taggedLine: 'Line 02',
    category: 'maintenance',
    mentions: ['user_jannat', 'user_ashik'],
    reactions: {
      '🔧': ['user_ashik'],
      '👍': ['user_rafiqul']
    }
  },
  {
    id: 'msg_105',
    senderId: 'user_sultana',
    senderName: 'Sultana Begum',
    senderRole: 'Quality In-Charge (In-Line QC)',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'quality-alerts',
    content: 'Hourly in-line inspection on Line 01: 0.8% DHU achieved. Collar band SPI strictly within buyer tolerance (11-12 SPI). Clean pass for export carton packing.',
    timestamp: '10:35 AM',
    createdAt: Date.now() - 1000 * 60 * 30,
    taggedLine: 'Line 01',
    category: 'quality',
    reactions: {
      '✅': ['user_tanvir', 'user_ashik']
    }
  },
  // --- Shift Handover & Capacity Planning Channel Messages ---
  {
    id: 'msg_106',
    senderId: 'user_salma',
    senderName: 'Salma Akter',
    senderRole: 'Line Supervisor (Line 20)',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'shift-handover',
    content: 'Shift A handover report: Line 20 produced 940 pcs against 980 pcs target (95.9% achievement). 40 pcs loss due to feed-off-the-arm motor maintenance in hour 3. 240 cut pieces in sewing buffer ready for Shift B.',
    timestamp: 'Yesterday 05:15 PM',
    createdAt: Date.now() - 1000 * 60 * 60 * 18,
    taggedLine: 'Line 20',
    category: 'handover',
    mentions: ['group_supervisors'],
    reactions: {
      '👍': ['user_tanvir', 'user_ashik']
    }
  },
  {
    id: 'msg_107',
    senderId: 'user_kamrul',
    senderName: 'Engr. Kamrul Hasan',
    senderRole: 'IE Specialist (Work Study & GSD)',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'ie-capacity-planning',
    content: 'Updated Man-Machine ratio analysis for upcoming Basic Crew Neck style: With 38 sewing operators + 8 helpers, calculated SAM is 18.5 min. Target line output per hour is 120 pcs at 65% efficiency ramp up.',
    timestamp: 'Yesterday 03:40 PM',
    createdAt: Date.now() - 1000 * 60 * 60 * 20,
    category: 'general',
    mentions: ['group_ie'],
    reactions: {
      '📊': ['user_ashik', 'user_nusrat'],
      '🎯': ['user_tanvir']
    }
  },
  {
    id: 'msg_108',
    senderId: 'user_nusrat',
    senderName: 'Nusrat Jahan',
    senderRole: 'Line Balancing & Ergonomics Engineer',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'ie-kaizen-ci',
    content: 'Kaizen 5S Floor Audit completed for Lines 01-05: Red-tagging removed 14 unused folder attachments from workstation trays. Ergonomic foot pedal height adjusted on 22 lockstitch tables, reducing operator back fatigue rating by 18%.',
    timestamp: '2 days ago',
    createdAt: Date.now() - 1000 * 60 * 60 * 48,
    category: 'achievement',
    isPinned: true,
    pinnedBy: 'Nusrat Jahan',
    pinnedAt: Date.now() - 1000 * 60 * 60 * 40,
    mentions: ['group_ie', 'group_all'],
    reactions: {
      '🔥': ['user_ashik', 'user_kamrul', 'user_faruk'],
      '👏': ['user_tanvir']
    }
  },
  {
    id: 'msg_109',
    senderId: 'user_nusrat',
    senderName: 'Nusrat Jahan',
    senderRole: 'Line Balancing & Ergonomics Engineer',
    senderAvatar: getOfflineAvatar("IE", "#0f766e"),
    channelId: 'dm_user_nusrat',
    content: 'Hi @Ashik Hossain, I reviewed the pitch diagram for Line 03. If we swap operator 14 with helper 02 on bottom hem folder, balancing efficiency jumps from 68% to 81.4%. Ready for your approval in the Cockpit!',
    timestamp: '09:05 AM',
    createdAt: Date.now() - 1000 * 60 * 125,
    category: 'general',
    mentions: ['user_ashik'],
    reactions: {
      '🎯': ['user_ashik']
    }
  }
];

export const QUICK_SHOP_FLOOR_CHIPS = [
  { label: '📐 @IE Team SMV Audit', text: '@IE Team Requesting SMV and cycle time re-study for critical bottleneck station.', category: 'bottleneck', isUrgent: false },
  { label: '⚖️ @Nusrat Line Rebalance', text: '@Nusrat Jahan Station cycle time exceeds takt by >15%. Please review pitch diagram and floater sharing.', category: 'bottleneck', isUrgent: true },
  { label: '⏱️ Cycle Spike >15%', text: 'Workstation cycle time spiked past takt limit. Immediate IE balancing intervention requested.', category: 'bottleneck', isUrgent: true },
  { label: '🔧 @Maintenance Jig Adjust', text: '@Maintenance Mechanic requested to inspect folder guide and tension setting on workstation.', category: 'maintenance', isUrgent: false },
  { label: '🎯 Takt Time Synced', text: 'Hourly pace aligned with target takt time! Output pacing at 102% efficiency.', category: 'achievement', isUrgent: false },
  { label: '⚠️ WIP Overload', text: 'Workstation buffer is exceeding 25 bundles. Requesting floater operator support.', category: 'bottleneck', isUrgent: true },
  { label: '✅ QC Audit Pass', text: 'In-line inspection completed with zero major seam defects.', category: 'quality', isUrgent: false }
];

export const DEFAULT_WHATSAPP_STATUS_STORIES = [
  {
    id: 'status_ashik_1',
    authorId: 'user_ashik',
    authorName: 'Ashik Hossain',
    authorAvatar: getOfflineAvatar("IE", "#047857"),
    authorRole: 'Senior IE Lead',
    timestamp: 'Today, 08:15 AM',
    caption: '⚡ Line 18 achieved 88.4% efficiency after Station 08 pitch rebalancing! Great work team!',
    backgroundColor: '#075e54',
    viewsCount: 18
  },
  {
    id: 'status_kamrul_1',
    authorId: 'user_kamrul',
    authorName: 'Engr. Kamrul Hasan',
    authorAvatar: getOfflineAvatar("IE", "#047857"),
    authorRole: 'IE Specialist',
    timestamp: 'Today, 09:30 AM',
    caption: '⏱️ French Placket SMV verified at 0.505 min. GSD standard approved for production.',
    backgroundColor: '#128c7e',
    viewsCount: 12
  },
  {
    id: 'status_tanvir_1',
    authorId: 'user_tanvir',
    authorName: 'Engr. Tanvir Ahmed',
    authorAvatar: getOfflineAvatar("IE", "#047857"),
    authorRole: 'Production Manager',
    timestamp: 'Today, 10:00 AM',
    caption: '🏭 Factory milestone: 4,800 pieces target on track across Unit 1 & Unit 2!',
    backgroundColor: '#25d366',
    viewsCount: 24
  }
];

