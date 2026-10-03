/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ThemeType = 'light' | 'dark' | 'forest' | 'sunset' | 'industrial' | 'nordic' | 'oled';
export type DensityType = 'normal' | 'compact';
export type SaveStatus = 'idle' | 'saving' | 'saved';

export type FontFamilyStyle = 'sans' | 'mono' | 'dyslexic' | 'grotesk' | 'serif';
export type CardRadiusMode = 'sharp' | 'modern' | 'squircle' | 'soft';
export type SurfaceStyleMode = 'opaque' | 'glass' | 'high-contrast';
export type ClickPhysicsMode = 'smooth' | 'instant';
export type FontWeightMode = 'regular' | 'crisp-contrast';

export interface DayWiseSummary {
  date: string;
  formattedDate: string;
  linesCount: number;
  totalLines: number;
  totalTargetProd: number;
  targetProd: number;
  totalAchievedProd: number;
  achievedProd: number;
  targetVariance: number;
  variancePcs: number;
  overallEfficiency: number;
  efficiencyPct: number;
  totalPresentMP: number;
  presentMP: number;
  totalAbsentMP: number;
  absentMP: number;
  attendanceRate: number;
  producedMinutes: number;
  availableMinutes: number;
  checklistCompletionPct: number;
  checklistCompliancePct: number;
  totalWip?: number;
  isDebonair?: boolean;
}

export interface DayOverDayVariance {
  hasPreviousData: boolean;
  currentDate: string;
  previousDate: string | null;
  outputDiffPcs: number;
  outputDiffPct: number;
  efficiencyDiffPts: number;
  attendanceDiffPts: number;
}

export interface DashboardLayout {
  showHero: boolean;
  showStats: boolean;
  showQuickReports?: boolean;
  showQuickActions: boolean;
  showAbsents: boolean;
  showBalancingGraph: boolean;
  showIO: boolean;
  showUpcoming: boolean;
}

export type NavBarStyle = 'bottom-cupertino' | 'floating-dock' | 'top-header' | 'kiosk-minimal';
export type FloorGridColumns = 1 | 2 | 3 | 4;
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious';
export type WorkspaceWidthMode = 'fluid' | 'maximized' | 'standard';
export type TopBarMobileStyle = 'standard' | 'compact' | 'minimal' | 'floating';
export type TopBarAccentTheme = 'brand' | 'slate' | 'emerald' | 'amber' | 'indigo' | 'dark';

export interface TopBarConfig {
  mobileStyle: TopBarMobileStyle; // 'standard' (56px), 'compact' (46px), 'minimal' (38px), 'floating' (island dock)
  sticky: boolean; // Sticky at top of viewport
  showSubHeaderOnMobile: boolean; // Mobile ergonomic sub-strip for quick Date & Floor switching
  showDateSelectorOnMobile: boolean; // Render date selector on mobile
  showFloorSelectorOnMobile: boolean; // Render floor dropdown on mobile
  showOnlinePill: boolean; // Real-time telemetry connection pill
  showScorecard: boolean; // IE Performance Scorecard badge
  showAutoSaveIndicator: boolean; // Micro save state indicator
  showNotifications: boolean; // Notifications bell
  showUserProfile: boolean; // User profile & tier avatar
  showTeamChat: boolean; // Quick floor communications launcher
  showQuickSettings: boolean; // Settings gear button
  showThemeToggle: boolean; // Dark/light mode switcher
  accentTheme: TopBarAccentTheme; // Subtle accent highlight on header borders
  brandDisplayMode: 'full' | 'compact' | 'badge-only'; // Brand identity mode on mobile
}

export type LayoutPresetId =
  | 'debonair-floor-default'
  | 'executive-attainment'
  | 'operator-tablet-kiosk'
  | 'ie-engineering-focus'
  | 'auditor-minimalist'
  | 'custom';

export interface AppPageTabConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  badge?: string;
  iconName?: string;
  allowedTiers?: string[];
}

export interface DashboardWidgetConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  columnSpan?: 'full' | 'half' | 'third';
}

export interface AppPageLayoutConfig {
  version: string;
  lastUpdated: string;
  updatedBy: string;
  presetId?: LayoutPresetId;
  presetName?: string;
  targetTier?: string; // 'all' or 'tier_0', 'tier_1', etc.
  
  // Navigation & Page Flow
  defaultLandingTab: string; // 'overview' | 'line-data' | etc.
  navBarStyle: NavBarStyle;
  tabs: AppPageTabConfig[];
  
  // Dashboard Widget Matrix
  dashboard: DashboardLayout;
  dashboardWidgets?: DashboardWidgetConfig[];
  floorGridColumns: FloorGridColumns;
  floorCardStyle: 'card' | 'row' | 'compact-chip';
  
  // Visual, Typography & Ergonomics Suite
  brandColor: string; // hex color e.g. '#176f78'
  fontScalePct: number; // 85, 90, 95, 100, 105, 110, 115
  fontFamily?: FontFamilyStyle;
  fontWeightMode?: FontWeightMode;
  tabularNumerals?: boolean;
  cardRadius?: CardRadiusMode;
  surfaceStyle?: SurfaceStyleMode;
  hapticFeedback?: boolean;
  clickPhysics?: ClickPhysicsMode;
  scannerFocusRing?: boolean;
  liveAlertPulses?: boolean;
  oneHandedMobileReach?: boolean;
  density: LayoutDensity;
  workspaceWidth?: WorkspaceWidthMode; // Adjust blank workspace area on pages: 'fluid' (100% full-bleed), 'maximized' (97% wide), 'standard' (1500px boxed)
  smallAreaFeaturesEnabled?: boolean; // System-wide small area micro-footprint, collapsible strips, and condensed chips
  showAnnouncementTicker: boolean;
  tickerText?: string;
  highContrastMode: boolean;
  kioskLockEnabled: boolean;
  kioskAllowedLine?: string;
  topBar?: TopBarConfig;
}

export type UpdateCategory =
  | 'layout_push'
  | 'ota_hotfix'
  | 'operational_directive'
  | 'schema_migration'
  | 'maintenance_advisory';

export type UpdateSeverity = 'normal' | 'important' | 'mandatory';

export type UpdateTargetScope =
  | 'all_terminals'
  | 'building_a'
  | 'building_b'
  | 'tier_1_2_managers'
  | 'tier_3_4_operators';

export interface SystemUpdatePush {
  id: string;
  version: string;
  title: string;
  category: UpdateCategory;
  severity: UpdateSeverity;
  targetScope: UpdateTargetScope;
  releaseNotes: string[];
  pushedAt: string;
  pushedByEmail: string;
  pushedByName: string;
  status: 'active' | 'rolled_back' | 'delivered';
  actionLabel?: string;
  actionPayload?: {
    layoutConfig?: Partial<AppPageLayoutConfig>;
    reloadRequired?: boolean;
    clearCache?: boolean;
  };
  acknowledgedCount?: number;
  totalTerminalsTargeted?: number;
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'security' | 'operational';
  user: string;
}

export interface PrivacySecuritySettings {
  privacyModeEnabled: boolean;
  blurSensitiveProductionFigures: boolean;
  autoLockMinutes: number; // 0 = disabled, 5, 15, 30
  pinLockEnabled: boolean;
  pinCode?: string;
  isLocked: boolean;
  dataEncryptionNoticeAcknowledged: boolean;
}

export interface FactoryIndustryProfile {
  id: string;
  name: string; // Factory or Group Name, e.g. "Debonair LTD"
  unitName: string; // Unit or Facility designation, e.g. "Unit-02"
  industrySector: string; // e.g. "Apparel & Garments (RMG)", "Textiles", "Footwear", "Automotive", "Electronics", "Custom"
  department: string; // e.g. "Industrial Engineering (IE) Dept."
  factoryCode?: string; // e.g. "DBN-U02"
  addressLocation?: string; // e.g. "Gorai, Mirzapur, Tangail / Gazipur"
  shortTag?: string; // e.g. "DBN-02"
  brandColor?: string; // Hex or theme color for factory badge
  establishedYear?: string;
  totalLinesCount?: number;
  contactEmail?: string;
  isCustom?: boolean;
}

export interface ManpowerBreakdown {
  present: number;
  absent: number;
}

export interface LineManpower {
  Operator: ManpowerBreakdown;
  Helper: ManpowerBreakdown;
  'Iron Man': ManpowerBreakdown;
}

export interface BottleneckInfo {
  station: string;
  cycleTime: number; // in seconds
  targetCT: number; // in seconds
  status: 'ok' | 'high' | 'critical';
  action: string;
  notes?: string;
}

export interface Top5Meeting {
  held: 'yes' | 'no';
  attendance: number;
  items: string[];
  notes?: string;
}

export interface TimeStudy {
  done: 'yes' | 'no' | 'partial';
  type: 'time' | 'production' | 'both';
  observedRate: number;
  standardRate: number;
  findings?: string;
}

export interface BuildUpCurve {
  day: '1' | '2' | '3' | '4' | '5' | '6' | 'stable' | string;
  plannedPct: number;
  achievedPct: number;
  operators: number;
  notes?: string;
}

export type StyleNature = 'new' | 'repeat'; // Repeat = within 3 months in same line
export type SMVWeight = 'light' | 'medium' | 'heavy'; // Light: 0-30 min, Medium: 31-60 min, Heavy: >60 min

export interface LearningCurveDayRecord {
  day: number; // 1 to 6 (or up to 40)
  plannedEff: number; // % e.g. 20
  achievedEff: number; // % e.g. 22
  plannedQty: number; // pcs
  achievedQty: number; // pcs
  variancePcs?: number;
  variancePct?: number;
  notes?: string;
}

export interface LineLearningCurve {
  periodDays: number; // default 6 days
  currentDay: number; // 1 to 6
  styleNature: StyleNature;
  smvWeight: SMVWeight;
  history: LearningCurveDayRecord[];
  isRepeatWithin3Months: boolean;
  notes?: string;
}

export interface BalancingLossAnalysis {
  tacctSeconds: number; // ΣT in seconds
  totalOperators: number; // N
  maxCTSeconds: number; // CTmax in seconds
  pitchTimeSeconds?: number;
  balancingLossPct: number; // Balancing Loss %
  balancingStatus: 'High Loss' | 'Overloaded/Verify Data' | 'Critical' | 'Stable';
  potentialPcsPerHour: number; // Potential
  estimatePcsPerHour: number; // Estimate
  minCapacityPcsPerHour: number; // Min Cap
  currentProductionPcsPerHour: number; // Current Prdn
  estimatedLossPct: number; // Estimated Loss %
  remarks?: string;
  // IE Standards from Image 2
  theoreticalBalancePct: number; // Target > 95%
  balancingErrorPct: number; // Target < 5%
  capacityEstimatePct: number; // Target > 10%
  rightManInRightProcess: boolean; // Target 100%
  rightMachineForProcess: boolean; // Target 100%
  needleDowntimeMinutes: number; // Target 18 Min
}

export interface LineIELead {
  name: string;
  level: string;
  period: string;
  weeklyNotes?: string;
  monthlyNotes?: string;
  additionalInfo?: string;
}

export interface LineTeamMember {
  id: string;
  name: string;
  role: string;
  contact?: string;
  shift?: string;
  skillGrade?: 'A+' | 'A' | 'B+' | 'B' | string;
  assignedStation?: string;
  fitScore?: number;
  rationale?: string;
  specialties?: string[];
  efficiencyRating?: number;
}

export interface CandidateTeamMember {
  id: string;
  name: string;
  primaryRole: string;
  skillGrade: 'A+' | 'A' | 'B+' | 'B';
  overallScore: number;
  experienceYears: number;
  efficiencyRatingPct: number;
  qualityPassRatePct: number;
  attendancePct: number;
  specialties: string[];
  machineCompetencies: string[];
  criticalOperations: string[];
  preferredShifts: string[];
  contact: string;
  currentLine?: string;
  status: 'Available' | 'Assigned' | 'Floater Pool';
}

export interface SuggestedTeamAssignment {
  memberId: string;
  name: string;
  role: string;
  skillGrade: string;
  assignedWorkstation: string;
  fitScore: number;
  rationale: string;
  matchedSkills: string[];
  contact: string;
  shift: string;
  efficiencyRating?: number;
}

export interface TeamAssignmentRecommendation {
  lineNo: string;
  style: string;
  recommendationTitle: string;
  predictedEfficiency: number;
  efficiencyLift: string;
  balancingScore: number;
  bottleneckStrategy: string;
  suggestedAssignments: SuggestedTeamAssignment[];
  ieAnalysisNotes: string;
  generatedAt: string;
}

export interface HourlyMinutesRecord {
  hourNumber: number; // 1 to 8
  hourLabel: string; // e.g. "Hour 1 (08:00 - 09:00)"
  timeRange: string;
  targetPcs: number;
  actualPcs: number;
  smv: number;
  availableMinutes: number; // MP * 60
  earnedMinutes: number; // actualPcs * smv
  varianceMinutes: number; // earnedMinutes - availableMinutes * (targetEff/100)
  lostMinutes: number; // Math.max(0, availableMinutes - earnedMinutes)
  efficiencyPct: number;
  status: 'Surge' | 'On Track' | 'Minor Lag' | 'Bottleneck Delay';
  notes?: string;
}

export interface WorkstationMinutesBalance {
  stationNumber: number;
  operationName: string;
  operatorName: string;
  machineType: string;
  cycleTimeSeconds: number;
  pitchTimeSeconds: number;
  taktVarianceSeconds: number; // cycleTime - pitchTime
  status: 'Bottleneck' | 'Optimal' | 'Starved' | 'Relief Active';
  availableMinutes480: number; // 480 min standard
  productiveMinutes: number;
  lostBalancingMinutes: number;
  balancingEfficiencyPct: number;
  recommendedAction: string;
}

export interface Shift8hLostMinutesBreakdown {
  lineBalancingDelayMinutes: number; // Station starvation & cycle time mismatch
  needleDowntimeMinutes: number; // Thread break, needle swap (target ~18m/worker)
  machineBreakdownMinutes: number; // Mechanic calls, motor/looper stall
  materialFeedingDelayMinutes: number; // Waiting for cut parts, fusing, labels
  reworkAndAlterationMinutes: number; // Quality DHU unpicking & re-stitching
  morningBriefingAndSetupMinutes: number; // 10-15m line startup & end tally
  otherUnaccountedMinutes: number; // Minor transit/fatigue micro-stops
}

export interface PostShiftOtBalancing {
  target8hPcs: number;
  achieved8hPcs: number;
  deficitPcs: number;
  deficitStandardMinutes: number;
  requiresOvertime: boolean;
  recommendedOtMinutes: number; // e.g. 30, 45, 60, 90, 120
  recommendedOtManpower: number;
  rebalanceActionPlan: string[];
  estimatedOtOutputPcs: number;
  otHourlyRatePcs: number;
}

export interface Shift8hSignOff {
  isSignedOff: boolean;
  signedBy?: string;
  role?: string;
  signedAt?: string;
  shiftVerdict: 'Met Target' | 'Minor Deficit - Rebalanced' | 'OT Required' | 'Exceeded Target';
  ieNotes?: string;
}

export interface Shift8hWorkingMinutesBalance {
  shiftDurationHours: number; // 8.0 standard
  shiftMinutesPerWorker: number; // 480 min
  totalPresentMP: number;
  operatorsPresent: number;
  helpersPresent: number;
  ironManPresent: number;
  grossAvailableMinutes: number; // totalPresentMP * 480
  achievedProd8h: number;
  targetProd8h: number;
  smv: number;
  earnedStandardMinutes: number; // achievedProd8h * smv
  targetStandardMinutes: number; // targetProd8h * smv
  netVarianceMinutes: number; // earned - target
  realizedShiftEfficiencyPct: number; // (earnedStandardMinutes / grossAvailableMinutes) * 100
  minuteUtilizationPct: number;
  lostMinutes: Shift8hLostMinutesBreakdown;
  hourlyBreakdown: HourlyMinutesRecord[];
  workstations: WorkstationMinutesBalance[];
  postShiftBalancing: PostShiftOtBalancing;
  signOff: Shift8hSignOff;
  lastUpdatedAt?: string;
}

export type LineStatus = 'Active' | 'Maintenance' | 'Stopped';

export interface LiveStationCycleTime {
  stationId: string;
  operationName: string;
  operatorName: string;
  observedCycleTimeSec: number;
  standardCycleTimeSec: number;
  pitchTimeSec: number;
  status: 'optimal' | 'bottleneck' | 'starved';
  lastLoggedAt: string;
}

export interface LiveWipStation {
  stage: 'input_loading' | 'front_assembly' | 'back_assembly' | 'collar_cuff' | 'side_seam' | 'end_line_qco' | 'finishing_transfer';
  label: string;
  wipPcs: number;
  bufferHours: number;
  status: 'balanced' | 'surging' | 'critical_overflow' | 'starving';
}

export interface LiveLineTelemetry {
  lastUpdated: string;
  isLiveMonitoring: boolean;
  // Live Cycle Time Metrics
  averageCycleTimeSec: number;
  targetCycleTimeSec: number; // calculated from takt/pitch or SMV
  bottleneckCycleTimeSec: number;
  pitchTimeSec: number;
  cycleTimeStations: LiveStationCycleTime[];
  // Live Production Rates
  currentHourlyRatePcs: number; // Pieces produced in current hour
  targetHourlyRatePcs: number; // Hourly target pace
  runRatePcsPerHour: number; // Instantaneous pacing extrapolated
  pacingVariancePcs: number; // Current pacing vs target pace
  pacingStatus: 'ahead' | 'on_pace' | 'behind' | 'critical_lag';
  // Live WIP Levels
  currentWipTotalPcs: number; // Live current WIP on the line
  standardWipBufferPcs: number; // Ideal buffer e.g. 1.5 - 2 hrs production
  wipBufferHours: number; // WIP / hourly rate
  wipHealthStatus: 'lean_optimal' | 'buffer_safe' | 'high_accumulation' | 'starvation_risk';
  wipStations: LiveWipStation[];
  // Quick Floor Observation Notes
  telemetryNotes?: string;
}

export interface LineEntry {
  id: number;
  date: string; // YYYY-MM-DD
  lineNo: string;
  floor: string;
  apartment?: string;
  isActive?: boolean;
  status?: LineStatus;
  statusReason?: string;
  floorOrder?: number; // Physical shop-floor position index for IE visual floor layout
  buyer: string;
  style: string;
  smv: number; // Standard Minute Value
  plannedMP: number;
  workingHours: number;
  targetEff: number;
  targetProd: number;
  achievedProd: number;
  efficiency: number;
  remarks: string;
  orderQty: number;
  dailyInput: number;
  dailyOutput: number;
  wip: number;
  balancingGraph: 'day1' | 'day2' | 'day3' | 'day4' | 'complete';
  nextStyle: string;
  nextStyleDate: string;
  mp: LineManpower;
  balanceMethod: string;
  balanceNotes: string;
  top5: Top5Meeting;
  bottleneck: BottleneckInfo;
  timeStudy: TimeStudy;
  buildUp: BuildUpCurve;
  lineIE: LineIELead;
  learningCurve?: LineLearningCurve;
  balancingAnalysis?: BalancingLossAnalysis;
  teamMembers?: LineTeamMember[];
  machineCount?: number;
  shift8hBalancing?: Shift8hWorkingMinutesBalance;
  liveTelemetry?: LiveLineTelemetry;
}

export type ChecklistStatus = 'yes' | 'no' | 'pending';

export interface ChecklistMap {
  [date: string]: ChecklistStatus[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  description: string;
  category: 'line_balancing' | 'time_study' | 'bottleneck_study' | 'tr_sample' | 'kaizen_ci' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  targetDate: string;
  dueTime: string;
  lineNo: string;
  assignedToRole: string;
  assignedToName: string;
  assignedByRole: string;
  assignedByName: string;
  subtasks: Subtask[];
  notes?: string;
  createdAt: string;
  completedAt?: string;
  isPointOfWork?: boolean;
  leanMethod?: string;
  stationLocation?: string;
  urgencyLevel?: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  targetDate: string;
  lineNo: string;
  category: string;
  assignedToRole: string;
  assignedToName: string;
  assignedByRole: string;
  assignedByName: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  alertMinutesBefore: number;
  locationOrFloor: string;
}

export interface LeanMethod {
  id: string;
  name?: string;
  tagline?: string;
  description?: string;
  category: string;
  garmentApplication?: string;
  steps?: string[];
  typicalBenefit?: string;
  title?: string;
  purpose?: string;
  icon?: string;
  index?: string;
  accent?: 'teal' | 'orange' | 'gold' | 'slate';
  walkTip?: string;
  focusMetric?: string;
}

export interface LeanAction {
  id: string;
  methodId: string;
  methodTitle?: string;
  methodName?: string;
  lineNo: string;
  stationOrLocation?: string;
  actionText?: string;
  title?: string;
  issue?: string;
  solution?: string;
  expectedBenefit?: string;
  assignee?: string;
  owner?: string;
  urgency?: 'immediate' | 'shift_end' | 'next_day';
  status: 'pending' | 'in_progress' | 'completed' | 'planned';
  createdAt: string;
  completedAt?: string;
}

export type LeanActionItem = LeanAction;

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'todo' | 'alert' | 'line' | 'sync' | 'warning';
  timestamp: string;
  read: boolean;
  lineNo?: string;
  targetRole?: string;
}

export interface RoleTier {
  id: string;
  level: number;
  name: string;
  shortCode: string;
  color: string;
  description: string;
  systemRole: string; // e.g. 'ADMIN', 'SR_MANAGER', 'MANAGER', 'IE_INCHARGE', 'LINE_IE'
  systemEdit: string; // 'Full', 'Assigned Wing (Write & Approve)', 'Assigned Block/Floor (Write & Approve)', 'Assigned Lines (Data Entry Only)'
  deletionReset: string; // 'Authorized', 'Restricted'
  checklistSignoff: string; // 'Authorized', 'Submit Only'
  managesTiers: string; // 'T1, T2, T3, T4', 'T2, T3, T4', 'T3, T4', 'Self Only'
  canManageLines: boolean;
  canEditLineData: boolean;
  canApproveChecklist: boolean;
  canCreateTodos: boolean;
  canExport: boolean;

  // Debonair LTD (Unit-02) — IE Department Official RBAC Fields
  tierLevelLabel?: string; // 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4'
  roleTitle?: string; // 'Sr. Manager' | 'Manager' | "IE Incharges/Assistant Manager's" | 'Line IEs'
  reportingScope?: string; // 'All Factory Lines' | 'Assigned Wing - Lines' | 'Assigned Line Blocks/Floor (5–6 Lines Each)' | "Assigned Line's"
  accessControlLevel?: string; // 'Department Administrator (Full System Access)' | 'Wing Super-User (Assigned Wing Control Write & Approve)' | 'Section Moderator (Assigned Block/Floor Write & Approve)' | 'Standard IE (Assigned Lines Data Entry Only)'
  scopeType?: 'all' | 'wing' | 'block' | 'line';
  dataEntryOnly?: boolean;
  canApprove?: boolean;
  isHidden?: boolean;

  // Enterprise Privacy & Security System Elements
  canViewSensitiveFinancials?: boolean; // Can view commercial line margins, labor cost, piece-rate figures
  canViewPii?: boolean; // Can view unmasked operator PII (phone, NID, emergency contacts)
  canManageSecuritySettings?: boolean; // Can configure system PIN, encryption, lock screen policies
  canViewAuditLogs?: boolean; // Can inspect security audit trail & authentication access logs
  canLockTerminal?: boolean; // Can trigger instant shop-floor terminal security lockout
  requiresPinConfirmation?: boolean; // High-impact actions require security PIN re-verification
  dataMaskingLevel?: 'none' | 'partial' | 'strict'; // 'none' for Executive/Admin, 'partial' for Incharges, 'strict' for Frontline/Guest
  sessionTimeoutMinutes?: number; // Custom inactivity auto-lock for this role tier (e.g. 5, 10, 15, 30, 60 min)
  privacyClearanceLevel?: 'Level 4 (Full Clearance)' | 'Level 3 (Super-User Clearance)' | 'Level 2 (Operational Clearance)' | 'Level 1 (Field Clearance)';
  
  // Data Loss Prevention (DLP) & Forensic Export Protection
  exportWatermarkEnabled?: boolean; // Mandates cryptographic forensic watermark with User ID & IP on all reports/exports
  canExportRawData?: boolean; // Can export un-aggregated raw telemetry & payroll records (false = aggregated summary only)
  maxExportRowsLimit?: number; // Export batch records quota limit to prevent bulk data leakage (e.g. 100, 500, 1000, 0 = unlimited)

  // Workstation, Identity & Perimeter Security
  twoFactorRequired?: boolean; // Mandatory 2FA/TOTP biometric/auth challenge for high-privilege access
  allowedNetworkScope?: 'factory_intranet' | 'vpn_secure' | 'unrestricted'; // Geofenced network policy (e.g. shop floor terminal only)
  canOverrideLocks?: boolean; // Can override emergency shop-floor terminal lockouts
  canPurgeAuditLogs?: boolean; // Exclusive permission to clear security and access logs (Root Admin only)
  ipWhitelistRequired?: boolean; // Restricts logins to whitelisted factory IP subnets
}

export interface UserProfile {
  name: string;
  jobTitle: string;
  role: 'admin' | 'sr_manager' | 'hod' | 'manager' | 'assistant_manager' | 'ie_incharge' | 'line_ie' | 'officer' | 'sr_executive' | 'executive';
  tierId: string;
  email: string;
  employeeId?: string;
  assignedUnit?: string;
  shift?: string;
  photoURL?: string;
  googleUid?: string;
  userId?: string;
  department?: string;
  phone?: string;

  // Debonair LTD (Unit-02) Scoping Fields
  assignedWing?: 'Blue Wing' | 'Green Wing' | 'All';
  assignedBlock?: string; // e.g., 'Block 1 (Floor 1 / Lines 01–06)'
  assignedLines?: string[]; // e.g. ['Line 01', 'Line 02']
}

export interface UserChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderDepartment?: string;
  senderAvatar?: string;
  senderTierId?: string;
  channelId: string; // e.g. 'general-floor' | 'line-bottlenecks' | 'maintenance' | 'quality' | 'dm_*'
  recipientId?: string; // for direct messages
  content: string;
  timestamp: string;
  createdAt: number;
  isUrgent?: boolean;
  taggedLine?: string; // e.g. 'Line 04'
  taggedStation?: string; // e.g. 'Station 08 (Collar Join)'
  category?: 'general' | 'bottleneck' | 'maintenance' | 'quality' | 'achievement' | 'handover';
  attachment?: {
    type: 'image' | 'report' | 'preset' | 'alert';
    title: string;
    url?: string;
    snippet?: string;
  };
  reactions?: Record<string, string[]>; // emoji -> array of senderIds
  acknowledgedBy?: string[]; // userIds who marked acknowledged
  mentions?: string[]; // User IDs, member names, or handle groups like '@IE Team', '@All'
  ieSpecialization?: string; // e.g. 'Work Study & SMV', 'Line Balancing', 'Method Study'
  isPinned?: boolean; // Pinned message for persistent team visibility
  pinnedBy?: string; // Name of engineer/supervisor who pinned the message
  pinnedAt?: number; // Timestamp when message was pinned
  // WhatsApp System Enhancements
  deliveryStatus?: 'sent' | 'delivered' | 'read'; // WhatsApp single tick, double grey tick, double blue tick
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  voiceNote?: {
    durationSec: number;
    audioUrl?: string;
    wavePeaks?: number[];
  };
  isStarred?: boolean;
  mediaAttachment?: {
    type: 'image' | 'document' | 'video' | 'audio';
    name: string;
    size?: string;
    url?: string;
    caption?: string;
  };
  poll?: {
    question: string;
    options: { text: string; votes: string[] }[];
    multiSelect?: boolean;
    closed?: boolean;
  };
}

export interface WhatsAppStatusStory {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole: string;
  timestamp: string;
  caption: string;
  imageUrl?: string;
  backgroundColor?: string;
  viewsCount?: number;
}

export interface ChatChannel {
  id: string;
  name: string;
  description: string;
  iconName: 'MessageSquare' | 'AlertTriangle' | 'Wrench' | 'ShieldAlert' | 'Clock' | 'Flame' | 'User' | 'Calculator' | 'Layers' | 'Sliders' | 'BarChart3' | 'Compass' | 'Target';
  isDirectMessage?: boolean;
  memberCount?: number;
  unreadCount?: number;
  category: 'ie' | 'floor' | 'technical' | 'urgent' | 'dm';
}

export interface ChatUserMember {
  id: string;
  name: string;
  role: string;
  department: 'IE' | 'Production' | 'Maintenance' | 'Quality' | 'Floor Management';
  avatar?: string;
  status: 'online' | 'busy' | 'on_floor' | 'offline';
  assignedLine?: string;
  shift?: string;
  specialization?: string;
  email?: string;
  phone?: string;
  lastActive?: string;
  statusMessage?: string;
  badgeNumber?: string;
  extension?: string;
}

export interface SyncState {
  status: 'live' | 'syncing' | 'idle' | 'error' | 'connected' | 'offline';
  latencyMs: number;
  lastSyncTime: string;
  cloudEndpoint?: string;
}

export interface AppStore {
  lineEntries: LineEntry[];
  checklists: ChecklistMap;
  todos: TodoItem[];
  schedules: ScheduleItem[];
  leanActions: LeanActionItem[];
  notifications: NotificationItem[];
  profile: UserProfile;
  dashboardLayout: DashboardLayout;
  theme: ThemeType;
  density: DensityType;
  syncState: SyncState;
}

export interface OperationStep {
  id: string;
  opNo: number;
  name: string;
  section: 'preparation' | 'assembly' | 'finishing';
  machineType: string;
  smvSec: number;
  operators: number;
  cycleTimeSec: number;
  pitchStatus: 'ok' | 'bottleneck' | 'underloaded';
  folderOrAttachment?: string;
  operatorGrade?: 'A' | 'B' | 'C';
}

export interface MachineRequirement {
  type: string;
  name: string;
  requiredCount: number;
  installedCount: number;
  calibratedCount: number;
  gaugeSpec?: string;
}

export interface HandoffCheckItem {
  id: string;
  category: 'machine_mechanical' | 'attachments_jigs' | 'quality_sample' | 'manpower_skill' | 'material_wip';
  item: string;
  standard: string;
  status: 'pass' | 'fail' | 'pending';
  responsible: string;
  notes?: string;
}

export interface LineHandoffSignoff {
  role: string;
  title: string;
  signedByName: string;
  status: 'approved' | 'pending' | 'flagged';
  signedAt?: string;
  comments?: string;
}

export interface IESimulatorPreset {
  id: string;
  styleName: string;
  buyer: string;
  garmentCategory: string;
  totalSMV: number; // in minutes
  recommendedOperators: number;
  recommendedHelpers: number;
  recommendedIroners: number;
  operations: OperationStep[];
  machines: MachineRequirement[];
}

export interface ScorecardPillar {
  name: string;
  weightPct: number; // e.g. 40
  scorePct: number; // 0 - 100
  weightedScore: number; // e.g. 34.5
  status: 'excellent' | 'good' | 'warning' | 'critical';
  headline: string;
  details: string;
}

export interface ScorecardResult {
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  gradeLabel: string;
  gradeColor: string;
  pillars: {
    efficiency: ScorecardPillar;
    checklist: ScorecardPillar;
    bottleneck: ScorecardPillar;
  };
  efficiencyPillar: {
    averageAchievedEff: number;
    averageTargetEff: number;
    attainmentRatio: number;
    linesOnTargetCount: number;
    linesCount: number;
    criticalLinesCount: number;
  };
  checklistPillar: {
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    notDoneTasks: number;
    completionPct: number;
  };
  bottleneckPillar: {
    totalBottlenecks: number;
    resolvedCount: number;
    highRiskCount: number;
    criticalCount: number;
    averageCycleTime: number;
    averageTargetCT: number;
    mitigationAdherencePct: number;
  };
  recommendations: string[];
}

export interface UserDailyBackupSettings {
  autoDailyBackupEnabled: boolean;
  dailyBackupTime: string; // e.g. "18:00"
  backupOnAppLaunch: boolean;
  backupRetentionDays: number;
  lastBackupDate: string | null;
  lastBackupTimestamp: number | null;
  lastBackupStatus?: 'success' | 'failed' | null;
  lastBackupSummary?: string | null;
}

export interface DailyBackupRecord {
  id: string;
  date: string;
  timestamp: number;
  timeStr: string;
  triggerType: 'scheduled' | 'manual' | 'startup';
  appVersion: string;
  stats: {
    linesCount: number;
    checklistsDaysCount: number;
    todosCount: number;
    leanActionsCount: number;
    sizeBytes: number;
    sizeFormatted: string;
  };
  data: {
    lines: LineEntry[];
    checklists: ChecklistMap;
    todos: TodoItem[];
    leanActions?: LeanActionItem[];
    metadata?: any;
  };
}

export interface PlantFloorConfig {
  id: string;
  name: string;
  linesCount: number;
  assignedLinesRange?: string;
  floorColor?: string;
  floorManager?: string;
}

export interface EnterprisePlant {
  id: string;
  name: string;
  unitName: string;
  plantCode: string;
  enterpriseGroup?: string;
  industrySector: string;
  department: string;
  addressLocation: string;
  shortTag: string;
  brandColor?: string;
  establishedYear?: string;
  totalLinesCount: number;
  contactEmail?: string;
  plantHead?: {
    name: string;
    designation: string;
    email: string;
    phone: string;
  };
  shiftHours?: number;
  targetEfficiencyBenchmark?: number;
  status: 'active' | 'maintenance' | 'standby';
  isCustom?: boolean;
  floors?: PlantFloorConfig[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkspaceRole = 'owner' | 'co_owner' | 'admin' | 'ie_manager' | 'line_supervisor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  userId?: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  department?: string;
  designation?: string;
  phone?: string;
  avatarColor?: string;
  addedAt?: string;
  joinedAt?: string;
  status?: 'active' | 'pending' | 'suspended';
  invitedBy?: string;
}

export interface EnterpriseWorkspace {
  id: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  tier?: 'enterprise_free' | 'enterprise_pro' | 'enterprise_sovereign';
  status: 'active' | 'archived';
  members: WorkspaceMember[];
  plants: EnterprisePlant[];
  defaultPlantId?: string;
  storageNamespace: string;
  createdAt: string;
  updatedAt: string;
  brandColor?: string;
  logoIcon?: string;
  industrySector?: string;
  headquarters?: string;
  country?: string;
  contactEmail?: string;
  establishedYear?: string;
  subscriptionTier?: string;
  isCustom?: boolean;
  ownershipTransferredAt?: string;
  previousOwners?: {
    ownerEmail: string;
    ownerName: string;
    transferredAt: string;
    actionTaken: string;
    userId?: string;
    name?: string;
    email?: string;
  }[];
  accessPolicy?: 'domain_matched' | 'domain_restricted' | 'invite_only' | 'open' | 'open_organization';
  allowedDomains?: string[];
}

export interface ManagementMember {
  id: string;
  name: string;
  role: string;
  lineOrFloor: string;
  contact: string;
  status: 'active' | 'on_floor' | 'in_standup' | 'leave';
  avatarColor?: string;
}

export interface ManagementDivision {
  id: string;
  name: string;
  divisionCode: string;
  plantId: string;
  plantName: string;
  lead: {
    name: string;
    designation: string;
    email: string;
    phone: string;
    tierLevel?: string;
    avatarColor?: string;
  };
  deputyLead?: {
    name: string;
    designation: string;
  };
  assignedLines: string[];
  assignedFloors: string[];
  cadreCount: number;
  targetEfficiency: number;
  operatingBudgetMonthly?: string;
  kpiFocus: string[];
  status: 'active' | 'restructuring' | 'standby';
  reportingTo?: string;
  colorTheme?: string;
  members: ManagementMember[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlantLeadershipMember {
  id: string;
  plantId: string;
  plantName: string;
  name: string;
  designation: string;
  leadershipTier: 'plant_executive' | 'departmental_head' | 'divisional_lead' | 'floor_commander';
  email: string;
  phone: string;
  avatarColor?: string;
  yearsInLeadership: number;
  directReportsCount: number;
  delegatedAuthorities: string[];
  managedLinesRange: string;
  managedFloors: string[];
  kpiCommitment: string;
  status: 'active' | 'on_floor' | 'in_standup' | 'leave';
  isPlantHead?: boolean;
  notes?: string;
  createdAt?: string;
}

// Line Booking for Upcoming Styles
export interface LineBookingRecord {
  id: string;
  lineNo: string;
  floor: string;
  style: string;
  buyer: string;
  orderQty: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  sam: number; // Standard Allowed Minutes
  plannedOperators: number;
  plannedHelpers: number;
  targetEfficiency: number; // % e.g. 72
  dailyTarget: number;
  totalTarget: number;
  trSampleStatus: 'Ready' | 'In Development' | 'Pending Approval' | 'Revision Required';
  trimsStatus: 'In House' | 'Partial' | 'Pending Shipment' | 'Delayed';
  bookingStatus: 'Confirmed' | 'Tentative' | 'In Production' | 'Completed';
  notes?: string;
  updatedAt?: string;
}

// Monthly Operating Budget
export interface MonthlyBudgetRecord {
  id: string;
  month: string; // e.g. '2026-10' or 'October 2026'
  category: string;
  department: string;
  floor?: string;
  allocatedBudget: number; // in USD
  actualSpend: number; // in USD
  variance: number; // allocatedBudget - actualSpend
  variancePercent: number; // percentage variance
  status: 'Within Budget' | 'Warning' | 'Over Budget';
  responsiblePerson?: string;
  notes?: string;
  updatedAt?: string;
}
