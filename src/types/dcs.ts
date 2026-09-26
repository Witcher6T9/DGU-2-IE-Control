export type StationStatus = 'running' | 'idle' | 'starved' | 'blocked' | 'faulted' | 'maintenance';

export interface StationData {
  id: string;
  name: string;
  code: string; // e.g. ST-01
  status: StationStatus;
  cycleTime: number; // in seconds
  targetCycleTime: number; // 18.0s
  oee: number; // percentage
  availability: number;
  performance: number;
  quality: number;
  unitsProduced: number;
  scrapCount: number;
  operator: string;
  currentAlert?: string;
  lastDowntimeReason?: string;
  centerlines: {
    parameter: string;
    nominal: number;
    current: number;
    min: number;
    max: number;
    unit: string;
    inSpec: boolean;
  }[];
  breakdownTime: {
    valueAdded: number; // seconds
    nonValueAdded: number; // seconds
    waste: number; // seconds
  };
}

export interface HourlyOutput {
  hourIndex: number;
  timeSlot: string; // e.g. "06:00 - 07:00"
  targetUnits: number;
  actualUnits: number;
  scrapUnits: number;
  cumulativeTarget: number;
  cumulativeActual: number;
  delta: number;
  status: 'above' | 'on_track' | 'below';
  notes?: string;
  downtimeMinutes: number;
}

export type LossCategory = 
  | 'Equipment Breakdown'
  | 'Setup & Adjustments'
  | 'Idling & Minor Stops'
  | 'Reduced Speed'
  | 'Process Defects / Rework'
  | 'Startup & Material Starvation';

export interface DowntimeIncident {
  id: string;
  timestamp: string;
  stationCode: string;
  stationName: string;
  category: LossCategory;
  durationMinutes: number;
  description: string;
  rootCause: string;
  actionTaken: string;
  reportedBy: string;
  shift: 'Shift 1' | 'Shift 2' | 'Shift 3';
}

export interface ActionItem {
  id: string;
  title: string;
  stationCode: string;
  owner: string;
  role: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Verified Closed';
  dueDate: string;
  createdDate: string;
  category: 'Safety' | 'Quality' | 'Efficiency' | '5S' | 'Maintenance';
  description: string;
  fiveWhys?: string[];
  countermeasure: string;
}

export interface FiveWhyInvestigation {
  id: string;
  problemTitle: string;
  stationCode: string;
  date: string;
  leadEngineer: string;
  whys: string[];
  rootCause: string;
  preventiveAction: string;
  actionItemId?: string;
}

export interface AuditCheckItem {
  id: string;
  zone: string;
  item: string;
  standard: string;
  status: 'pass' | 'warning' | 'fail';
  notes?: string;
}

export interface CenterlineAuditItem {
  id: string;
  stationCode: string;
  parameter: string;
  lsl: number; // lower spec limit
  target: number;
  usl: number; // upper spec limit
  currentValue: number;
  unit: string;
  status: 'in_spec' | 'warning' | 'out_of_spec';
  lastChecked: string;
}

export interface ShiftInfo {
  id: 'Shift 1' | 'Shift 2' | 'Shift 3';
  name: string;
  hours: string;
  leadSupervisor: string;
  ieEngineer: string;
  targetOutput: number;
}
