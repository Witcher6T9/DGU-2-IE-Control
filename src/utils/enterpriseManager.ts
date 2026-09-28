/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Enterprise Plants & Multiple Managements Architecture Engine
 */

import { EnterprisePlant, ManagementDivision, FactoryIndustryProfile, PlantLeadershipMember } from '../types';

export const STORAGE_KEY_ENTERPRISE_PLANTS = 'debonair_enterprise_plants_v1';
export const STORAGE_KEY_ACTIVE_PLANT_ID = 'debonair_active_plant_id_v1';
export const STORAGE_KEY_MANAGEMENT_DIVISIONS = 'debonair_management_divisions_v1';
export const STORAGE_KEY_PLANT_LEADERSHIPS = 'debonair_plant_leaderships_v1';

export const INITIAL_ENTERPRISE_PLANTS: EnterprisePlant[] = [
  {
    id: 'plant_debonair_u02',
    name: 'Debonair LTD',
    unitName: 'Unit-02 (Outerwear & Padding Complex)',
    plantCode: 'DBN-U02',
    enterpriseGroup: 'Debonair Group Bangladesh',
    industrySector: 'Apparel & Garments (RMG)',
    department: 'Industrial Engineering (IE) Dept.',
    addressLocation: 'Gorai, Mirzapur, Tangail / Gazipur Industrial Belt',
    shortTag: 'DBN-02',
    brandColor: '#176f78',
    establishedYear: '2008',
    totalLinesCount: 34,
    contactEmail: 'ie.unit02@debonairgroupbd.com',
    plantHead: {
      name: 'Ashik Hossain',
      designation: 'Sr. Manager / Head of Industrial Engineering',
      email: 'ashik.hossain@debonairbd.com',
      phone: '+880 1711-002233'
    },
    shiftHours: 8,
    targetEfficiencyBenchmark: 85.0,
    status: 'active',
    isCustom: false,
    floors: [
      { id: 'fl_padma', name: 'Padma Floor', linesCount: 6, assignedLinesRange: 'Lines 01 - 06', floorColor: '#3b82f6', floorManager: 'Md. Rafiqul Islam' },
      { id: 'fl_meghna', name: 'Meghna Floor', linesCount: 6, assignedLinesRange: 'Lines 07 - 12', floorColor: '#0284c7', floorManager: 'Kazi Nazmul' },
      { id: 'fl_karnophuli', name: 'Karnophuli Floor', linesCount: 5, assignedLinesRange: 'Lines 13 - 17', floorColor: '#0d9488', floorManager: 'Sabbir Ahmed' },
      { id: 'fl_korotoya', name: 'Korotoya Floor', linesCount: 6, assignedLinesRange: 'Lines 18 - 23', floorColor: '#10b981', floorManager: 'Fahim Ahmed' },
      { id: 'fl_shitalokshya', name: 'Shitalokshya Floor', linesCount: 6, assignedLinesRange: 'Lines 24 - 29', floorColor: '#84cc16', floorManager: 'Sultan Mahmud' },
      { id: 'fl_turag', name: 'Turag Floor', linesCount: 5, assignedLinesRange: 'Lines 30 - 34', floorColor: '#eab308', floorManager: 'Rakib Hasan' }
    ],
    notes: 'Flagship production plant for heavy outerwear, padded jackets, and ski jackets. Full 34 lines operating under digital IE balancing.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plant_debonair_u01',
    name: 'Debonair LTD',
    unitName: 'Unit-01 (Knit & Casualwear)',
    plantCode: 'DBN-U01',
    enterpriseGroup: 'Debonair Group Bangladesh',
    industrySector: 'Knit & Composite Apparel',
    department: 'Operations & IE Department',
    addressLocation: 'Kashimpur, Gazipur District, Bangladesh',
    shortTag: 'DBN-01',
    brandColor: '#0284c7',
    establishedYear: '2004',
    totalLinesCount: 28,
    contactEmail: 'operations.u01@debonairgroupbd.com',
    plantHead: {
      name: 'Farhan Kabir',
      designation: 'General Manager Operations',
      email: 'f.kabir@debonairbd.com',
      phone: '+880 1712-445566'
    },
    shiftHours: 8,
    targetEfficiencyBenchmark: 82.5,
    status: 'active',
    isCustom: false,
    floors: [
      { id: 'fl_surma', name: 'Surma Floor', linesCount: 7, assignedLinesRange: 'Lines 01 - 07', floorColor: '#0ea5e9', floorManager: 'Zahid Hossain' },
      { id: 'fl_jamuna', name: 'Jamuna Floor', linesCount: 7, assignedLinesRange: 'Lines 08 - 14', floorColor: '#06b6d4', floorManager: 'Monirul Islam' },
      { id: 'fl_teesta', name: 'Teesta Floor', linesCount: 7, assignedLinesRange: 'Lines 15 - 21', floorColor: '#14b8a6', floorManager: 'Habibur Rahman' },
      { id: 'fl_buriganga', name: 'Buriganga Floor', linesCount: 7, assignedLinesRange: 'Lines 22 - 28', floorColor: '#22c55e', floorManager: 'Al-Amin Khan' }
    ],
    notes: 'High-speed knitwear facility producing polo shirts, hoodies, and activewear for European and North American buyers.',
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plant_debonair_u03',
    name: 'Debonair LTD',
    unitName: 'Unit-03 (Performance Outerwear & Technical Fabrics)',
    plantCode: 'DBN-U03',
    enterpriseGroup: 'Debonair Group Bangladesh',
    industrySector: 'Woven Outerwear & Heavy Jackets',
    department: 'Technical & Production Division',
    addressLocation: 'Bhaluka Industrial Corridor, Mymensingh',
    shortTag: 'DBN-03',
    brandColor: '#4f46e5',
    establishedYear: '2015',
    totalLinesCount: 30,
    contactEmail: 'plant.u03@debonairgroupbd.com',
    plantHead: {
      name: 'Moinuddin Chowdhury',
      designation: 'Vice President Technical & IE',
      email: 'moin.c@debonairbd.com',
      phone: '+880 1715-778899'
    },
    shiftHours: 8,
    targetEfficiencyBenchmark: 86.0,
    status: 'active',
    isCustom: false,
    floors: [
      { id: 'fl_dhaleshwari', name: 'Dhaleshwari Floor', linesCount: 6, assignedLinesRange: 'Lines 01 - 06', floorColor: '#6366f1', floorManager: 'Kamrul Ahsan' },
      { id: 'fl_brahmaputra', name: 'Brahmaputra Floor', linesCount: 6, assignedLinesRange: 'Lines 07 - 12', floorColor: '#8b5cf6', floorManager: 'Shahriar Alam' },
      { id: 'fl_kushiyara', name: 'Kushiyara Floor', linesCount: 6, assignedLinesRange: 'Lines 13 - 18', floorColor: '#a855f7', floorManager: 'Tariqul Islam' },
      { id: 'fl_madhumati', name: 'Madhumati Floor', linesCount: 6, assignedLinesRange: 'Lines 19 - 24', floorColor: '#d946ef', floorManager: 'Nazmul Haque' },
      { id: 'fl_someshwari', name: 'Someshwari Floor', linesCount: 6, assignedLinesRange: 'Lines 25 - 30', floorColor: '#ec4899', floorManager: 'Mahmudul Hoque' }
    ],
    notes: 'State-of-the-art seam-sealing, ultrasonic bonding, and down-filling line setups with automated spreading tables.',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plant_apex_footwear',
    name: 'Apex Footwear Ltd.',
    unitName: 'Unit-01 (Shoe & Upper Assembly)',
    plantCode: 'AFW-U01',
    enterpriseGroup: 'Apex Group',
    industrySector: 'Footwear & Leathercraft',
    department: 'Operations & Work Study Division',
    addressLocation: 'Haragach, Gazipur Industrial Area',
    shortTag: 'APEX-01',
    brandColor: '#0f766e',
    establishedYear: '1990',
    totalLinesCount: 24,
    contactEmail: 'ie.plant01@apexfootwearbd.com',
    plantHead: {
      name: 'Sheikh Nasir Uddin',
      designation: 'Executive Director Operations',
      email: 's.nasir@apexfootwearbd.com',
      phone: '+880 1819-223344'
    },
    shiftHours: 8,
    targetEfficiencyBenchmark: 80.0,
    status: 'active',
    isCustom: false,
    floors: [
      { id: 'fl_leather_1', name: 'Leather Upper Floor A', linesCount: 8, assignedLinesRange: 'Lines 01 - 08', floorColor: '#0d9488' },
      { id: 'fl_sole_1', name: 'Sole Stitching & Lasting B', linesCount: 8, assignedLinesRange: 'Lines 09 - 16', floorColor: '#059669' },
      { id: 'fl_finish_1', name: 'Boxing & Finishing C', linesCount: 8, assignedLinesRange: 'Lines 17 - 24', floorColor: '#10b981' }
    ],
    notes: 'Premium formal footwear, sports sneaker lasting, and Goodyear-welted construction conveyor systems.',
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'plant_hameem_denim',
    name: 'Ha-Meem Denim Mills Ltd.',
    unitName: 'Plant-04 (Woven & Denim Lines)',
    plantCode: 'HMD-P04',
    enterpriseGroup: 'Ha-Meem Group',
    industrySector: 'Textiles & Denim Manufacturing',
    department: 'IE & Productivity Cell',
    addressLocation: 'Nishat Nagar, Tongi, Gazipur',
    shortTag: 'HMD-04',
    brandColor: '#1e40af',
    establishedYear: '2004',
    totalLinesCount: 40,
    contactEmail: 'productivity@hameemgroup.com',
    plantHead: {
      name: 'Engr. Masud Rana',
      designation: 'General Manager IE & Planning',
      email: 'masud.rana@hameemgroup.com',
      phone: '+880 1911-556677'
    },
    shiftHours: 10,
    targetEfficiencyBenchmark: 84.0,
    status: 'active',
    isCustom: false,
    floors: [
      { id: 'fl_denim_a', name: 'Front & Back Pocket Assembly', linesCount: 10, assignedLinesRange: 'Lines 01 - 10', floorColor: '#2563eb' },
      { id: 'fl_denim_b', name: 'Inseam & Waistband Station', linesCount: 10, assignedLinesRange: 'Lines 11 - 20', floorColor: '#1d4ed8' },
      { id: 'fl_denim_c', name: 'Loop & Rivet Bartack Section', linesCount: 10, assignedLinesRange: 'Lines 21 - 30', floorColor: '#1e40af' },
      { id: 'fl_denim_d', name: 'Final Trimming & Wet Wash Link', linesCount: 10, assignedLinesRange: 'Lines 31 - 40', floorColor: '#172554' }
    ],
    notes: 'High-volume 5-pocket denim jeans manufacturing with synchronized twin-needle felling machines.',
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_MANAGEMENT_DIVISIONS: ManagementDivision[] = [
  {
    id: 'mgt_ie_workstudy',
    name: 'Industrial Engineering (IE) & Work Study Management',
    divisionCode: 'MGT-IE',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    lead: {
      name: 'Ashik Hossain',
      designation: 'Head of Industrial Engineering / Sr. Manager',
      email: 'ashik.hossain@debonairbd.com',
      phone: '+880 1711-002233',
      tierLevel: 'tier_1',
      avatarColor: '#176f78'
    },
    deputyLead: {
      name: 'Tanvir Ahmed',
      designation: 'IE Manager (Blue Wing Lead)'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'],
    assignedFloors: ['Padma Floor', 'Meghna Floor', 'Karnophuli Floor', 'Korotoya Floor', 'Shitalokshya Floor', 'Turag Floor'],
    cadreCount: 14,
    targetEfficiency: 85.0,
    operatingBudgetMonthly: '$38,000 / mo',
    kpiFocus: [
      'Line Balancing & Pitch Time',
      'Method Study & SMV Optimization',
      '5-Cycle Stopwatch Benchmarking',
      'Loss Pareto Analysis'
    ],
    status: 'active',
    reportingTo: 'Executive Director Operations & Group Chairman',
    colorTheme: '#176f78',
    members: [
      { id: 'm-1', name: 'Ashik Hossain', role: 'Head of IE (HOD)', lineOrFloor: 'All 34 Lines', contact: 'ashik.hossain@debonairbd.com', status: 'active', avatarColor: '#176f78' },
      { id: 'm-2', name: 'Tanvir Ahmed', role: 'Manager - Blue Wing', lineOrFloor: 'Lines 01 - 17', contact: 'tanvir.a@debonairbd.com', status: 'on_floor', avatarColor: '#2563eb' },
      { id: 'm-3', name: 'Mahmudul Hasan', role: 'Manager - Green Wing', lineOrFloor: 'Lines 18 - 34', contact: 'mahmud.h@debonairbd.com', status: 'active', avatarColor: '#059669' },
      { id: 'm-4', name: 'Md. Rafiqul Islam', role: 'IE Incharge 1', lineOrFloor: 'Padma Floor (Lines 01-06)', contact: 'rafiq.ie@debonairbd.com', status: 'on_floor', avatarColor: '#3b82f6' },
      { id: 'm-5', name: 'Kazi Nazmul', role: 'IE Incharge 2', lineOrFloor: 'Meghna Floor (Lines 07-12)', contact: 'nazmul.k@debonairbd.com', status: 'active', avatarColor: '#0284c7' },
      { id: 'm-6', name: 'Sultan Mahmud', role: 'IE Incharge 4', lineOrFloor: 'Korotoya Floor (Lines 18-23)', contact: 'sultan.m@debonairbd.com', status: 'on_floor', avatarColor: '#10b981' }
    ],
    notes: 'Central engineering governance body responsible for cycle time targets, operator loading plans, and daily efficiency sign-offs across all lines.',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mgt_blue_wing_prod',
    name: 'Blue Wing Sewing Production Management',
    divisionCode: 'MGT-BLU',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    lead: {
      name: 'Tanvir Ahmed',
      designation: 'Divisional Production Manager (Wing A)',
      email: 'tanvir.a@debonairbd.com',
      phone: '+880 1711-889900',
      tierLevel: 'tier_2',
      avatarColor: '#2563eb'
    },
    deputyLead: {
      name: 'Md. Rafiqul Islam',
      designation: 'Assistant Production Manager'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'],
    assignedFloors: ['Padma Floor', 'Meghna Floor', 'Karnophuli Floor'],
    cadreCount: 22,
    targetEfficiency: 86.0,
    operatingBudgetMonthly: '$52,000 / mo',
    kpiFocus: [
      'Hourly Output Attainment (90% Peak)',
      'Absenteeism Mitigation & Cross-Training',
      'Needle Breakage & Mechanic Takt',
      'WIP Flow < 2,500 Pcs Buffer'
    ],
    status: 'active',
    reportingTo: 'General Manager Operations / HOD IE',
    colorTheme: '#2563eb',
    members: [
      { id: 'bw-1', name: 'Tanvir Ahmed', role: 'Wing Manager', lineOrFloor: 'Lines 01 - 17', contact: 'tanvir.a@debonairbd.com', status: 'active', avatarColor: '#2563eb' },
      { id: 'bw-2', name: 'Md. Rafiqul Islam', role: 'Shift Incharge A', lineOrFloor: 'Padma Floor', contact: 'rafiq@debonairbd.com', status: 'on_floor', avatarColor: '#3b82f6' },
      { id: 'bw-3', name: 'Sabbir Ahmed', role: 'Line Production Officer', lineOrFloor: 'Line 01 & 02', contact: 'sabbir@debonairbd.com', status: 'on_floor', avatarColor: '#60a5fa' },
      { id: 'bw-4', name: 'Kazi Nazmul', role: 'Shift Incharge B', lineOrFloor: 'Meghna Floor', contact: 'nazmul@debonairbd.com', status: 'active', avatarColor: '#0284c7' }
    ],
    notes: 'Supervises 17 high-output sewing lines in Wing A producing technical waterproof ski jackets and down-insulated outerwear.',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mgt_green_wing_prod',
    name: 'Green Wing Sewing Production Management',
    divisionCode: 'MGT-GRN',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    lead: {
      name: 'Mahmudul Hasan',
      designation: 'Divisional Production Manager (Wing B)',
      email: 'mahmud.h@debonairbd.com',
      phone: '+880 1711-776655',
      tierLevel: 'tier_2',
      avatarColor: '#059669'
    },
    deputyLead: {
      name: 'Sultan Mahmud',
      designation: 'Senior IE Coordinator & Wing B Deputy'
    },
    assignedLines: ['18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'],
    assignedFloors: ['Korotoya Floor', 'Shitalokshya Floor', 'Turag Floor'],
    cadreCount: 20,
    targetEfficiency: 85.5,
    operatingBudgetMonthly: '$48,000 / mo',
    kpiFocus: [
      'Line 18 Benchmark Stability (>88%)',
      'Style Changeover SMED < 45 Mins',
      'Daily Top 5 Standup Meeting 100%',
      'Bundle Integrity & Zero Soilage'
    ],
    status: 'active',
    reportingTo: 'General Manager Operations / HOD IE',
    colorTheme: '#059669',
    members: [
      { id: 'gw-1', name: 'Mahmudul Hasan', role: 'Wing Manager', lineOrFloor: 'Lines 18 - 34', contact: 'mahmud.h@debonairbd.com', status: 'active', avatarColor: '#059669' },
      { id: 'gw-2', name: 'Fahim Ahmed', role: 'Assistant Manager', lineOrFloor: 'Korotoya Floor', contact: 'fahim@debonairbd.com', status: 'on_floor', avatarColor: '#10b981' },
      { id: 'gw-3', name: 'Sultan Mahmud', role: 'IE Incharge 4', lineOrFloor: 'Lines 18 - 20', contact: 'sultan.m@debonairbd.com', status: 'on_floor', avatarColor: '#047857' },
      { id: 'gw-4', name: 'Rakib Hasan', role: 'Floor Incharge', lineOrFloor: 'Turag Floor (Lines 30-34)', contact: 'rakib@debonairbd.com', status: 'active', avatarColor: '#84cc16' }
    ],
    notes: 'Commands 17 active production lines in Wing B including benchmark Line 18 and heavy fleece parka assembly clusters.',
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mgt_qa_compliance',
    name: 'Quality Assurance & Buyer Compliance Management',
    divisionCode: 'MGT-QA',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    lead: {
      name: 'Engr. Shahriar Alam',
      designation: 'General Manager Quality Assurance & Technical',
      email: 's.alam.qa@debonairbd.com',
      phone: '+880 1713-998877',
      tierLevel: 'tier_1',
      avatarColor: '#d97706'
    },
    deputyLead: {
      name: 'Farhana Yasmin',
      designation: 'QA Technical Manager'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'],
    assignedFloors: ['Padma Floor', 'Meghna Floor', 'Karnophuli Floor', 'Korotoya Floor', 'Shitalokshya Floor', 'Turag Floor'],
    cadreCount: 18,
    targetEfficiency: 98.8, // Quality pass target
    operatingBudgetMonthly: '$34,000 / mo',
    kpiFocus: [
      'First Pass Yield (FPY) > 98.5%',
      'Defect Per Hundred Units (DHU) < 1.2',
      'End-of-Line 100% Traffic Light Audit',
      'Zero Re-Inspection Fails by Buyer QA'
    ],
    status: 'active',
    reportingTo: 'Managing Director & VP Quality',
    colorTheme: '#d97706',
    members: [
      { id: 'qa-1', name: 'Engr. Shahriar Alam', role: 'Head of Quality', lineOrFloor: 'Enterprise Plant', contact: 's.alam.qa@debonairbd.com', status: 'active', avatarColor: '#d97706' },
      { id: 'qa-2', name: 'Farhana Yasmin', role: 'QA Manager', lineOrFloor: 'Blue Wing QA Table', contact: 'f.yasmin@debonairbd.com', status: 'on_floor', avatarColor: '#b45309' },
      { id: 'qa-3', name: 'Md. Delowar Hossain', role: 'Senior Quality Auditor', lineOrFloor: 'Green Wing QA Table', contact: 'delowar@debonairbd.com', status: 'active', avatarColor: '#92400e' }
    ],
    notes: 'Oversees in-line roving audits, end-line roving stations, metal detection security, and buyer final inspection approvals.',
    createdAt: '2026-01-12T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mgt_cutting_prep',
    name: 'Cutting & Pre-Production Flow Management',
    divisionCode: 'MGT-CUT',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    lead: {
      name: 'Kamal Uddin',
      designation: 'Senior Cutting Manager',
      email: 'kamal.cut@debonairbd.com',
      phone: '+880 1714-332211',
      tierLevel: 'tier_2',
      avatarColor: '#7c3aed'
    },
    deputyLead: {
      name: 'Zahangir Alam',
      designation: 'CAD / CAM Spreading Incharge'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'],
    assignedFloors: ['Cutting Hall Block A', 'Cutting Hall Block B', 'Fusing & Numbering Zone'],
    cadreCount: 16,
    targetEfficiency: 92.0,
    operatingBudgetMonthly: '$41,000 / mo',
    kpiFocus: [
      'Fabric Marker Utilization > 87.5%',
      'Bundle Feed 48h Advance Buffer',
      'Zero Shade Variance in Matching Bundles',
      'Automated Gerber Knife Uptime 99%'
    ],
    status: 'active',
    reportingTo: 'General Manager Operations',
    colorTheme: '#7c3aed',
    members: [
      { id: 'cut-1', name: 'Kamal Uddin', role: 'Cutting Manager', lineOrFloor: 'Cutting Floor', contact: 'kamal.cut@debonairbd.com', status: 'active', avatarColor: '#7c3aed' },
      { id: 'cut-2', name: 'Zahangir Alam', role: 'CAD Spreading Lead', lineOrFloor: 'Automated Tables 1-4', contact: 'zahangir@debonairbd.com', status: 'on_floor', avatarColor: '#6d28d9' }
    ],
    notes: 'Handles computerized pattern generation, automated fabric spreading, multi-ply vacuum cutting, bundle tagging, and bundling dispatch.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mgt_finishing_packaging',
    name: 'Finishing, Washing & Packing Management',
    divisionCode: 'MGT-FIN',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    lead: {
      name: 'Nizamul Haque',
      designation: 'Deputy General Manager - Finishing & Logistics',
      email: 'nizam.fin@debonairbd.com',
      phone: '+880 1716-112233',
      tierLevel: 'tier_2',
      avatarColor: '#0284c7'
    },
    deputyLead: {
      name: 'Belal Ahmed',
      designation: 'Ironing & Steam Tunnel Manager'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34'],
    assignedFloors: ['Finishing Hall Floor 03', 'Steam Ironing Tunnel Section', 'Warehouse Packing Dock'],
    cadreCount: 24,
    targetEfficiency: 91.5,
    operatingBudgetMonthly: '$46,000 / mo',
    kpiFocus: [
      'Same-Day Garment Output Clearance',
      'Barcode Packing Verification 100%',
      'Steam Press Temperature Consistency',
      'Carton Weight & Dimension Audit'
    ],
    status: 'active',
    reportingTo: 'General Manager Operations / Supply Chain VP',
    colorTheme: '#0284c7',
    members: [
      { id: 'fin-1', name: 'Nizamul Haque', role: 'DGM Finishing', lineOrFloor: 'Finishing Floor', contact: 'nizam.fin@debonairbd.com', status: 'active', avatarColor: '#0284c7' },
      { id: 'fin-2', name: 'Belal Ahmed', role: 'Packing Incharge', lineOrFloor: 'Packing Line 1-6', contact: 'belal@debonairbd.com', status: 'on_floor', avatarColor: '#0369a1' }
    ],
    notes: 'Final packaging, button pull strength testing, barcode scanning, carton drop tests, and container dispatch logistics.',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  // Debonair Unit-01 Dedicated Managements
  {
    id: 'mgt_u01_ie',
    name: 'Knitwear IE & Line Balancing Management',
    divisionCode: 'MGT-U01-IE',
    plantId: 'plant_debonair_u01',
    plantName: 'Debonair LTD (Unit-01)',
    lead: {
      name: 'Zahid Hossain',
      designation: 'Head of Industrial Engineering',
      email: 'zahid.ie@debonairbd.com',
      phone: '+880 1712-112233',
      tierLevel: 'tier_1',
      avatarColor: '#0ea5e9'
    },
    deputyLead: {
      name: 'Habibur Rahman',
      designation: 'Sr. Work Study Engineer'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'],
    assignedFloors: ['Surma Floor', 'Jamuna Floor', 'Teesta Floor', 'Buriganga Floor'],
    cadreCount: 16,
    targetEfficiency: 82.5,
    operatingBudgetMonthly: '$32,000 / mo',
    kpiFocus: ['Takt Time Adherence', 'Knit Stretch SMV Precision', 'Operator Cross-Skill Matrix'],
    status: 'active',
    reportingTo: 'Farhan Kabir (General Manager Operations)',
    colorTheme: '#0ea5e9',
    members: [
      { id: 'u01-ie-1', name: 'Zahid Hossain', role: 'Head of IE', lineOrFloor: 'All 28 Lines', contact: 'zahid.ie@debonairbd.com', status: 'active', avatarColor: '#0ea5e9' },
      { id: 'u01-ie-2', name: 'Habibur Rahman', role: 'IE Officer Lead', lineOrFloor: 'Surma & Jamuna', contact: 'habib.ie@debonairbd.com', status: 'on_floor', avatarColor: '#06b6d4' }
    ],
    notes: 'Autonomous IE management cell driving SMV optimization for knit polo shirts, tees, and fleece activewear.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'mgt_u01_sewing',
    name: 'Knitwear High-Speed Sewing Operations',
    divisionCode: 'MGT-U01-SEW',
    plantId: 'plant_debonair_u01',
    plantName: 'Debonair LTD (Unit-01)',
    lead: {
      name: 'Monirul Islam',
      designation: 'Production Head - Knit Sewing Lines',
      email: 'monirul.prod@debonairbd.com',
      phone: '+880 1712-334455',
      tierLevel: 'tier_2',
      avatarColor: '#0284c7'
    },
    deputyLead: {
      name: 'Al-Amin Khan',
      designation: 'Floor Production Incharge'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28'],
    assignedFloors: ['Surma Floor', 'Jamuna Floor', 'Teesta Floor', 'Buriganga Floor'],
    cadreCount: 26,
    targetEfficiency: 84.0,
    operatingBudgetMonthly: '$54,000 / mo',
    kpiFocus: ['Line Output Pacing', 'Quick Changeover SMED < 30m', 'Needle Takt Rate'],
    status: 'active',
    reportingTo: 'Farhan Kabir (General Manager Operations)',
    colorTheme: '#0284c7',
    members: [
      { id: 'u01-sew-1', name: 'Monirul Islam', role: 'Production Head', lineOrFloor: 'Unit-01 All Floors', contact: 'monirul.prod@debonairbd.com', status: 'active', avatarColor: '#0284c7' }
    ],
    notes: 'Commands 28 circular-knit sewing lines with synchronized flatlock and overlock machinery.',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  // Debonair Unit-03 Dedicated Managements
  {
    id: 'mgt_u03_tech',
    name: 'Performance Outerwear & Seam-Sealing Management',
    divisionCode: 'MGT-U03-TECH',
    plantId: 'plant_debonair_u03',
    plantName: 'Debonair LTD (Unit-03)',
    lead: {
      name: 'Kamrul Ahsan',
      designation: 'Plant Operations & Technical Sealing Lead',
      email: 'kamrul.tech@debonairbd.com',
      phone: '+880 1715-113355',
      tierLevel: 'tier_2',
      avatarColor: '#4f46e5'
    },
    deputyLead: {
      name: 'Shahriar Alam',
      designation: 'Hot-Air Seam Sealing Coordinator'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30'],
    assignedFloors: ['Dhaleshwari Floor', 'Brahmaputra Floor', 'Kushiyara Floor', 'Madhumati Floor', 'Someshwari Floor'],
    cadreCount: 22,
    targetEfficiency: 86.5,
    operatingBudgetMonthly: '$58,000 / mo',
    kpiFocus: ['Hydrostatic Waterproof 10,000mm Test', 'Ultrasonic Bonding Integrity', 'Takt Balancing'],
    status: 'active',
    reportingTo: 'Moinuddin Chowdhury (VP Technical & IE)',
    colorTheme: '#4f46e5',
    members: [
      { id: 'u03-t-1', name: 'Kamrul Ahsan', role: 'Operations Lead', lineOrFloor: 'Lines 01 - 30', contact: 'kamrul.tech@debonairbd.com', status: 'active', avatarColor: '#4f46e5' }
    ],
    notes: 'Specialized management overseeing hot-air taped seam lines, laser fabric cutting, and waterproof performance shell outerwear.',
    createdAt: '2026-02-05T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  // Apex Footwear Dedicated Managements
  {
    id: 'mgt_afw_upper',
    name: 'Shoe Upper Assembly & Stitching Management',
    divisionCode: 'MGT-AFW-UPP',
    plantId: 'plant_apex_footwear',
    plantName: 'Apex Footwear Ltd. (Unit-01)',
    lead: {
      name: 'Rehan Quadir',
      designation: 'Upper Stitching & Lasting Operations Lead',
      email: 'rehan.q@apexfootwearbd.com',
      phone: '+880 1819-334455',
      tierLevel: 'tier_2',
      avatarColor: '#0f766e'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    assignedFloors: ['Leather Upper Floor A'],
    cadreCount: 18,
    targetEfficiency: 81.0,
    operatingBudgetMonthly: '$39,000 / mo',
    kpiFocus: ['Leather Skiving Precision', 'Stitch Density 100%', 'Toe-Puff Placement'],
    status: 'active',
    reportingTo: 'Sheikh Nasir Uddin (Executive Director Operations)',
    colorTheme: '#0f766e',
    members: [
      { id: 'afw-1', name: 'Rehan Quadir', role: 'Upper Stitching Lead', lineOrFloor: 'Floor A', contact: 'rehan.q@apexfootwearbd.com', status: 'active', avatarColor: '#0f766e' }
    ],
    notes: 'Dedicated footwear assembly management overseeing leather cutting, skiving, lining cementing, and multi-needle upper closing.',
    createdAt: '2026-02-18T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  // Ha-Meem Denim Dedicated Managements
  {
    id: 'mgt_hmd_assembly',
    name: '5-Pocket Denim Felling & Assembly Management',
    divisionCode: 'MGT-HMD-DNM',
    plantId: 'plant_hameem_denim',
    plantName: 'Ha-Meem Denim Mills Ltd. (Plant-04)',
    lead: {
      name: 'Anisur Rahman',
      designation: 'Head of Denim Sewing & Assembly Lines',
      email: 'anisur.r@hameemgroup.com',
      phone: '+880 1911-667788',
      tierLevel: 'tier_2',
      avatarColor: '#1e40af'
    },
    assignedLines: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'],
    assignedFloors: ['Front & Back Pocket Assembly', 'Inseam & Waistband Station'],
    cadreCount: 28,
    targetEfficiency: 85.0,
    operatingBudgetMonthly: '$62,000 / mo',
    kpiFocus: ['Twin-Needle Felling Speed', 'Waistband Curve Consistency', 'Chainstitch Tension'],
    status: 'active',
    reportingTo: 'Engr. Masud Rana (General Manager IE & Planning)',
    colorTheme: '#1e40af',
    members: [
      { id: 'hmd-1', name: 'Anisur Rahman', role: 'Denim Assembly Head', lineOrFloor: 'Lines 01 - 20', contact: 'anisur.r@hameemgroup.com', status: 'active', avatarColor: '#1e40af' }
    ],
    notes: 'Manages high-velocity denim production cells utilizing specialized heavy-duty feed-off-the-arm sewing machines.',
    createdAt: '2026-03-02T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_PLANT_LEADERSHIPS: PlantLeadershipMember[] = [
  // ── Debonair LTD Unit-02 (Outerwear & Padding Complex) Leadership Council ──
  {
    id: 'ldr_u02_ashik',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    name: 'Ashik Hossain',
    designation: 'Sr. Manager / Head of Industrial Engineering & Work Study',
    leadershipTier: 'departmental_head',
    email: 'ashik.hossain@debonairbd.com',
    phone: '+880 1711-002233',
    avatarColor: '#176f78',
    yearsInLeadership: 14,
    directReportsCount: 22,
    delegatedAuthorities: [
      'Line Rebalancing Sign-Off',
      'SMV / SAM Override Approval',
      'Target Efficiency Benchmarks',
      'Cycle Time Stopwatch Standards',
      'IE Manpower Allocation'
    ],
    managedLinesRange: 'Lines 01 - 34 (Full Plant)',
    managedFloors: ['Padma Floor', 'Meghna Floor', 'Karnophuli Floor', 'Korotoya Floor', 'Shitalokshya Floor', 'Turag Floor'],
    kpiCommitment: '85.0%+ Target Efficiency across all 34 Outerwear Lines with zero bottle-neck stalls',
    status: 'active',
    isPlantHead: true,
    notes: 'Chief architect of digital IE line balancing and cycle time benchmarking for Debonair Group Unit-02.',
    createdAt: '2026-01-01T00:00:00Z'
  },
  {
    id: 'ldr_u02_shahriar',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    name: 'Engr. Shahriar Alam',
    designation: 'General Manager - Technical & Quality Operations',
    leadershipTier: 'plant_executive',
    email: 's.alam.gm@debonairbd.com',
    phone: '+880 1713-998877',
    avatarColor: '#d97706',
    yearsInLeadership: 18,
    directReportsCount: 35,
    delegatedAuthorities: [
      'Quality Gate Pass Sign-Off',
      'Buyer Technical Audit Clearance',
      'Machinery Relocation Approval',
      'Overtime & Shift Authorization'
    ],
    managedLinesRange: 'Lines 01 - 34 (Full Plant)',
    managedFloors: ['All Floors & Quality Audit Labs'],
    kpiCommitment: 'First Pass Yield > 98.8%, Buyer Audit Pass 100%, DHU < 1.1',
    status: 'active',
    isPlantHead: false,
    notes: 'Directs plant-level quality assurance protocols, compliance with European skiwear standards, and defect eradication.',
    createdAt: '2026-01-05T00:00:00Z'
  },
  {
    id: 'ldr_u02_tanvir',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    name: 'Tanvir Ahmed',
    designation: 'Divisional Production Manager (Blue Wing)',
    leadershipTier: 'divisional_lead',
    email: 'tanvir.a@debonairbd.com',
    phone: '+880 1711-889900',
    avatarColor: '#2563eb',
    yearsInLeadership: 9,
    directReportsCount: 18,
    delegatedAuthorities: [
      'Hourly Output Attainment Approval',
      'Floor Helper & Operator Shift Rostering',
      'Line-Level Overtime Dispatch'
    ],
    managedLinesRange: 'Lines 01 - 17 (Blue Wing)',
    managedFloors: ['Padma Floor', 'Meghna Floor', 'Karnophuli Floor'],
    kpiCommitment: '90%+ Hourly Pace Attainment on Technical Ski Jackets',
    status: 'on_floor',
    isPlantHead: false,
    notes: 'Direct floor leader overseeing 17 lines specialized in insulated winter jackets and seam-sealed coats.',
    createdAt: '2026-01-08T00:00:00Z'
  },
  {
    id: 'ldr_u02_mahmud',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    name: 'Mahmudul Hasan',
    designation: 'Divisional Production Manager (Green Wing)',
    leadershipTier: 'divisional_lead',
    email: 'mahmud.h@debonairbd.com',
    phone: '+880 1711-776655',
    avatarColor: '#059669',
    yearsInLeadership: 11,
    directReportsCount: 20,
    delegatedAuthorities: [
      'Line 18 Benchmark Stability Sign-Off',
      'Changeover SMED Timing Approval',
      'Operator Grade Balancing'
    ],
    managedLinesRange: 'Lines 18 - 34 (Green Wing)',
    managedFloors: ['Korotoya Floor', 'Shitalokshya Floor', 'Turag Floor'],
    kpiCommitment: '86.5%+ Green Wing Output with < 40-minute style changeover',
    status: 'active',
    isPlantHead: false,
    notes: 'Leads Green Wing operations including high-efficiency benchmark Line 18 and heavy down-filling lines.',
    createdAt: '2026-01-08T00:00:00Z'
  },
  {
    id: 'ldr_u02_kamal',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    name: 'Kamal Uddin',
    designation: 'Senior Cutting & Pre-Production Manager',
    leadershipTier: 'departmental_head',
    email: 'kamal.cut@debonairbd.com',
    phone: '+880 1714-332211',
    avatarColor: '#7c3aed',
    yearsInLeadership: 13,
    directReportsCount: 16,
    delegatedAuthorities: [
      'Fabric Marker Efficiency Approval',
      'Multi-Ply Vacuum Spreading Sign-Off',
      'Bundle Dispatch Authorization'
    ],
    managedLinesRange: 'Supplies Lines 01 - 34',
    managedFloors: ['Cutting Hall Block A', 'Cutting Hall Block B'],
    kpiCommitment: 'Fabric Utilization > 88.0% with 48h Advance Cut Buffer',
    status: 'active',
    isPlantHead: false,
    notes: 'Governs high-precision CNC cutting tables and bundle flow to sewing wings.',
    createdAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 'ldr_u02_tariqul',
    plantId: 'plant_debonair_u02',
    plantName: 'Debonair LTD (Unit-02)',
    name: 'Engr. Tariqul Islam',
    designation: 'Plant Maintenance & Automation Head',
    leadershipTier: 'departmental_head',
    email: 'tariqul.maint@debonairbd.com',
    phone: '+880 1715-442211',
    avatarColor: '#0d9488',
    yearsInLeadership: 12,
    directReportsCount: 14,
    delegatedAuthorities: [
      'Machine Preventative Maintenance Sign-Off',
      'Spare Parts Replacement Approval',
      'Line Mechanic Allocation'
    ],
    managedLinesRange: 'Lines 01 - 34 Machinery',
    managedFloors: ['All Floors + Central Workshop'],
    kpiCommitment: '99.2% Sewing Machine Uptime with < 7 min Breakdown MTTR',
    status: 'in_standup',
    isPlantHead: false,
    notes: 'Ensures zero mechanical downtime on automated Juki and Brother programmable tackers.',
    createdAt: '2026-01-12T00:00:00Z'
  },

  // ── Debonair LTD Unit-01 (Knit & Casualwear) Leadership Council ──
  {
    id: 'ldr_u01_farhan',
    plantId: 'plant_debonair_u01',
    plantName: 'Debonair LTD (Unit-01)',
    name: 'Farhan Kabir',
    designation: 'General Manager Operations & Plant Head',
    leadershipTier: 'plant_executive',
    email: 'f.kabir@debonairbd.com',
    phone: '+880 1712-445566',
    avatarColor: '#0284c7',
    yearsInLeadership: 16,
    directReportsCount: 42,
    delegatedAuthorities: [
      'Full Plant Autonomous Authority',
      'Production Budget Allocation',
      'Staff Promotion & Incentive Sign-Off',
      'Shipment Release Authorization'
    ],
    managedLinesRange: 'Lines 01 - 28 (Full Knitwear Plant)',
    managedFloors: ['Surma Floor', 'Jamuna Floor', 'Teesta Floor', 'Buriganga Floor'],
    kpiCommitment: '82.5%+ Monthly Efficiency with on-time shipment rating > 99%',
    status: 'active',
    isPlantHead: true,
    notes: 'Overall plant executive governing knitwear apparel operations for Debonair Group Unit-01.',
    createdAt: '2026-01-10T00:00:00Z'
  },
  {
    id: 'ldr_u01_zahid',
    plantId: 'plant_debonair_u01',
    plantName: 'Debonair LTD (Unit-01)',
    name: 'Zahid Hossain',
    designation: 'Head of Industrial Engineering & Line Balancing',
    leadershipTier: 'departmental_head',
    email: 'zahid.ie@debonairbd.com',
    phone: '+880 1712-112233',
    avatarColor: '#0ea5e9',
    yearsInLeadership: 10,
    directReportsCount: 16,
    delegatedAuthorities: [
      'SMV Calibration for Knit Fabrics',
      'Hourly Takt Sign-Off',
      'Operator Skill Grading'
    ],
    managedLinesRange: 'Lines 01 - 28',
    managedFloors: ['Surma Floor', 'Jamuna Floor', 'Teesta Floor', 'Buriganga Floor'],
    kpiCommitment: 'Eliminate line starvation and maintain 83% line balance factor',
    status: 'on_floor',
    isPlantHead: false,
    notes: 'Directs knitwear work study, operator motion economy, and ergonomic workstation setups.',
    createdAt: '2026-01-12T00:00:00Z'
  },
  {
    id: 'ldr_u01_monirul',
    plantId: 'plant_debonair_u01',
    plantName: 'Debonair LTD (Unit-01)',
    name: 'Monirul Islam',
    designation: 'Production Head - Knit Sewing Lines',
    leadershipTier: 'divisional_lead',
    email: 'monirul.prod@debonairbd.com',
    phone: '+880 1712-334455',
    avatarColor: '#0369a1',
    yearsInLeadership: 8,
    directReportsCount: 26,
    delegatedAuthorities: [
      'Floor Line Production Dispatch',
      'Overtime Allocation',
      'WIP Clearance Sign-Off'
    ],
    managedLinesRange: 'Lines 01 - 28',
    managedFloors: ['Surma Floor', 'Jamuna Floor', 'Teesta Floor', 'Buriganga Floor'],
    kpiCommitment: 'Maintain 45,000 pcs daily output across 28 circular sewing lines',
    status: 'active',
    isPlantHead: false,
    notes: 'Commands 28 active production lines producing cotton tees and hoodies.',
    createdAt: '2026-01-15T00:00:00Z'
  },

  // ── Debonair LTD Unit-03 (Performance Outerwear & Technical Fabrics) Leadership Council ──
  {
    id: 'ldr_u03_moin',
    plantId: 'plant_debonair_u03',
    plantName: 'Debonair LTD (Unit-03)',
    name: 'Moinuddin Chowdhury',
    designation: 'Vice President Technical & IE / Plant Head',
    leadershipTier: 'plant_executive',
    email: 'moin.c@debonairbd.com',
    phone: '+880 1715-778899',
    avatarColor: '#4f46e5',
    yearsInLeadership: 20,
    directReportsCount: 38,
    delegatedAuthorities: [
      'Full Plant Autonomous Authority',
      'Seam Sealing Machine Procurement Approval',
      'Technical Fabric Specification Sign-Off',
      'Executive Leadership Appointments'
    ],
    managedLinesRange: 'Lines 01 - 30 (Full Plant)',
    managedFloors: ['Dhaleshwari Floor', 'Brahmaputra Floor', 'Kushiyara Floor', 'Madhumati Floor', 'Someshwari Floor'],
    kpiCommitment: '86.0% Target Efficiency on Ultra-Technical Mountaineering Jackets',
    status: 'active',
    isPlantHead: true,
    notes: 'Heads the high-tech Bhaluka facility pioneering ultrasonic welding and robotic down-filling.',
    createdAt: '2026-02-01T00:00:00Z'
  },
  {
    id: 'ldr_u03_kamrul',
    plantId: 'plant_debonair_u03',
    plantName: 'Debonair LTD (Unit-03)',
    name: 'Kamrul Ahsan',
    designation: 'Operations Lead - Seam Sealing & Down Outerwear',
    leadershipTier: 'divisional_lead',
    email: 'kamrul.tech@debonairbd.com',
    phone: '+880 1715-113355',
    avatarColor: '#6366f1',
    yearsInLeadership: 11,
    directReportsCount: 22,
    delegatedAuthorities: [
      'Sealing Temperature & Pressure Calibration Sign-Off',
      'Down Chamber Weighing Audit',
      'Line Ramp-Up Authorization'
    ],
    managedLinesRange: 'Lines 01 - 30',
    managedFloors: ['Dhaleshwari Floor', 'Brahmaputra Floor'],
    kpiCommitment: 'Zero tape delamination and 100% waterproof seam pass',
    status: 'on_floor',
    isPlantHead: false,
    notes: 'Expert in technical membranes (GORE-TEX, eVent) and bonding parameter sign-offs.',
    createdAt: '2026-02-05T00:00:00Z'
  },

  // ── Apex Footwear Ltd. (Unit-01) Leadership Council ──
  {
    id: 'ldr_afw_nasir',
    plantId: 'plant_apex_footwear',
    plantName: 'Apex Footwear Ltd. (Unit-01)',
    name: 'Sheikh Nasir Uddin',
    designation: 'Executive Director Operations & Plant Head',
    leadershipTier: 'plant_executive',
    email: 's.nasir@apexfootwearbd.com',
    phone: '+880 1819-223344',
    avatarColor: '#0f766e',
    yearsInLeadership: 22,
    directReportsCount: 45,
    delegatedAuthorities: [
      'Full Plant Autonomous Operations',
      'Leather Procurement Sign-Off',
      'Conveyor Line Speed Adjustment',
      'Final Fit & Finish Approval'
    ],
    managedLinesRange: 'Lines 01 - 24 (Full Footwear Facility)',
    managedFloors: ['Leather Upper Floor A', 'Sole Stitching & Lasting B', 'Boxing & Finishing C'],
    kpiCommitment: '80.0% Target Efficiency with < 0.8% Sole Bond Failure',
    status: 'active',
    isPlantHead: true,
    notes: 'Leads the flagship formal and sneaker footwear manufacturing plant of Apex Group.',
    createdAt: '2026-02-15T00:00:00Z'
  },
  {
    id: 'ldr_afw_rehan',
    plantId: 'plant_apex_footwear',
    plantName: 'Apex Footwear Ltd. (Unit-01)',
    name: 'Rehan Quadir',
    designation: 'Upper Stitching & Lasting Operations Lead',
    leadershipTier: 'divisional_lead',
    email: 'rehan.q@apexfootwearbd.com',
    phone: '+880 1819-334455',
    avatarColor: '#0d9488',
    yearsInLeadership: 12,
    directReportsCount: 24,
    delegatedAuthorities: [
      'Upper Stitching Quality Sign-Off',
      'Shoe Last Allocation',
      'Thermal Heat Tunnel Speed Approval'
    ],
    managedLinesRange: 'Lines 01 - 16',
    managedFloors: ['Leather Upper Floor A', 'Sole Stitching & Lasting B'],
    kpiCommitment: '12,000 pairs daily output with zero wrinkle defects',
    status: 'on_floor',
    isPlantHead: false,
    notes: 'Manages precision stitching, edge beveling, and lasting tension adjustments.',
    createdAt: '2026-02-18T00:00:00Z'
  },

  // ── Ha-Meem Denim Mills Ltd. (Plant-04) Leadership Council ──
  {
    id: 'ldr_hmd_masud',
    plantId: 'plant_hameem_denim',
    plantName: 'Ha-Meem Denim Mills Ltd. (Plant-04)',
    name: 'Engr. Masud Rana',
    designation: 'General Manager IE & Planning / Plant Head',
    leadershipTier: 'plant_executive',
    email: 'masud.rana@hameemgroup.com',
    phone: '+880 1911-556677',
    avatarColor: '#1e40af',
    yearsInLeadership: 17,
    directReportsCount: 48,
    delegatedAuthorities: [
      'Full Plant Operations Command',
      'Production Capacity Planning Sign-Off',
      'High-Speed Twin-Needle Allocation',
      'Denim Wash Quality Approval'
    ],
    managedLinesRange: 'Lines 01 - 40 (Full Denim Complex)',
    managedFloors: ['Front & Back Pocket Assembly', 'Inseam & Waistband Station', 'Loop & Rivet Bartack Section', 'Final Trimming & Wet Wash Link'],
    kpiCommitment: '84.0% Target Efficiency across 40 synchronized lines producing 65,000 jeans/day',
    status: 'active',
    isPlantHead: true,
    notes: 'Pioneer of high-speed twin-needle felling cells and continuous Kanban feed for Ha-Meem Denim.',
    createdAt: '2026-03-01T00:00:00Z'
  },
  {
    id: 'ldr_hmd_anisur',
    plantId: 'plant_hameem_denim',
    plantName: 'Ha-Meem Denim Mills Ltd. (Plant-04)',
    name: 'Anisur Rahman',
    designation: 'Head of Denim Sewing & Assembly Lines',
    leadershipTier: 'divisional_lead',
    email: 'anisur.r@hameemgroup.com',
    phone: '+880 1911-667788',
    avatarColor: '#2563eb',
    yearsInLeadership: 13,
    directReportsCount: 30,
    delegatedAuthorities: [
      'Assembly Line Balance Sign-Off',
      'Chainstitch Tension Calibration',
      'Riveting Safety Sign-Off'
    ],
    managedLinesRange: 'Lines 01 - 25',
    managedFloors: ['Front & Back Pocket Assembly', 'Inseam & Waistband Station'],
    kpiCommitment: 'Maintain 85% efficiency on 14oz heavyweight denim jeans',
    status: 'on_floor',
    isPlantHead: false,
    notes: 'Directs heavy-duty feed-off-the-arm sewing sections and waistband attachment modules.',
    createdAt: '2026-03-02T00:00:00Z'
  }
];

// Helper to convert EnterprisePlant to FactoryIndustryProfile for seamless backward compatibility
export function plantToFactoryProfile(plant: EnterprisePlant): FactoryIndustryProfile {
  return {
    id: plant.id,
    name: plant.name,
    unitName: plant.unitName,
    industrySector: plant.industrySector,
    department: plant.department,
    factoryCode: plant.plantCode,
    addressLocation: plant.addressLocation,
    shortTag: plant.shortTag,
    brandColor: plant.brandColor,
    establishedYear: plant.establishedYear,
    totalLinesCount: plant.totalLinesCount,
    contactEmail: plant.contactEmail,
    isCustom: plant.isCustom
  };
}

// Helper to convert FactoryIndustryProfile to EnterprisePlant
export function factoryProfileToPlant(profile: FactoryIndustryProfile): EnterprisePlant {
  return {
    id: profile.id,
    name: profile.name,
    unitName: profile.unitName,
    plantCode: profile.factoryCode || 'DBN-U02',
    enterpriseGroup: profile.name.includes('Debonair') ? 'Debonair Group Bangladesh' : `${profile.name} Group`,
    industrySector: profile.industrySector,
    department: profile.department,
    addressLocation: profile.addressLocation || 'Industrial Zone, Bangladesh',
    shortTag: profile.shortTag || 'DBN-02',
    brandColor: profile.brandColor || '#176f78',
    establishedYear: profile.establishedYear || '2008',
    totalLinesCount: profile.totalLinesCount || 34,
    contactEmail: profile.contactEmail || 'ie.plant@domain.com',
    status: 'active',
    isCustom: profile.isCustom || false,
    floors: [
      { id: 'fl_default_1', name: 'Padma Floor', linesCount: 6, assignedLinesRange: 'Lines 01 - 06' },
      { id: 'fl_default_2', name: 'Meghna Floor', linesCount: 6, assignedLinesRange: 'Lines 07 - 12' },
      { id: 'fl_default_3', name: 'Karnophuli Floor', linesCount: 5, assignedLinesRange: 'Lines 13 - 17' },
      { id: 'fl_default_4', name: 'Korotoya Floor', linesCount: 6, assignedLinesRange: 'Lines 18 - 23' },
      { id: 'fl_default_5', name: 'Shitalokshya Floor', linesCount: 6, assignedLinesRange: 'Lines 24 - 29' },
      { id: 'fl_default_6', name: 'Turag Floor', linesCount: 5, assignedLinesRange: 'Lines 30 - 34' }
    ]
  };
}

// Get all stored Enterprise Plants
export function getStoredEnterprisePlants(): EnterprisePlant[] {
  if (typeof window === 'undefined') return INITIAL_ENTERPRISE_PLANTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTERPRISE_PLANTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse enterprise plants from localStorage:', e);
  }
  return INITIAL_ENTERPRISE_PLANTS;
}

// Save all Enterprise Plants
export function saveStoredEnterprisePlants(plants: EnterprisePlant[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_ENTERPRISE_PLANTS, JSON.stringify(plants));
  } catch (e) {
    console.error('Failed to save enterprise plants to localStorage:', e);
  }
}

// Get currently active plant
export function getActiveEnterprisePlant(): EnterprisePlant {
  const plants = getStoredEnterprisePlants();
  if (typeof window === 'undefined') return plants[0] || INITIAL_ENTERPRISE_PLANTS[0];
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_PLANT_ID);
    if (activeId) {
      const found = plants.find(p => p.id === activeId);
      if (found) return found;
    }
  } catch (e) {
    console.error('Failed to read active plant id:', e);
  }
  return plants[0] || INITIAL_ENTERPRISE_PLANTS[0];
}

// Set active plant
export function setActiveEnterprisePlant(plantId: string): EnterprisePlant | null {
  const plants = getStoredEnterprisePlants();
  const plant = plants.find(p => p.id === plantId);
  if (plant && typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PLANT_ID, plantId);
      // Sync with factoryProfile storage for existing components
      localStorage.setItem('ie_active_factory_profile', JSON.stringify(plantToFactoryProfile(plant)));
      window.dispatchEvent(new CustomEvent('debonair:plant_switched', { detail: plant }));
    } catch (e) {
      console.error('Failed to set active plant:', e);
    }
    return plant;
  }
  return null;
}

// Get all stored Management Divisions
export function getStoredManagementDivisions(): ManagementDivision[] {
  if (typeof window === 'undefined') return INITIAL_MANAGEMENT_DIVISIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MANAGEMENT_DIVISIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse management divisions from localStorage:', e);
  }
  return INITIAL_MANAGEMENT_DIVISIONS;
}

// Save all Management Divisions
export function saveStoredManagementDivisions(divisions: ManagementDivision[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_MANAGEMENT_DIVISIONS, JSON.stringify(divisions));
    window.dispatchEvent(new CustomEvent('debonair:managements_updated', { detail: divisions }));
  } catch (e) {
    console.error('Failed to save management divisions to localStorage:', e);
  }
}

// Get all stored Plant Leaderships
export function getStoredPlantLeaderships(): PlantLeadershipMember[] {
  if (typeof window === 'undefined') return INITIAL_PLANT_LEADERSHIPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANT_LEADERSHIPS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse plant leaderships from localStorage:', e);
  }
  return INITIAL_PLANT_LEADERSHIPS;
}

// Save all Plant Leaderships
export function saveStoredPlantLeaderships(leaderships: PlantLeadershipMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PLANT_LEADERSHIPS, JSON.stringify(leaderships));
    window.dispatchEvent(new CustomEvent('debonair:leaderships_updated', { detail: leaderships }));
  } catch (e) {
    console.error('Failed to save plant leaderships to localStorage:', e);
  }
}

// Get leaders who specifically manage their own plant
export function getLeadersForPlant(plantId: string): PlantLeadershipMember[] {
  const all = getStoredPlantLeaderships();
  if (plantId === 'all') return all;
  return all.filter(l => l.plantId === plantId);
}

// Get management divisions specifically governing their own plant
export function getManagementsForPlant(plantId: string): ManagementDivision[] {
  const all = getStoredManagementDivisions();
  if (plantId === 'all') return all;
  return all.filter(m => m.plantId === plantId || m.plantId === 'all');
}

// Save / update a plant leader
export function savePlantLeader(leader: PlantLeadershipMember): void {
  const all = getStoredPlantLeaderships();
  const existingIndex = all.findIndex(l => l.id === leader.id);
  let updated: PlantLeadershipMember[];
  if (existingIndex >= 0) {
    updated = [...all];
    updated[existingIndex] = leader;
  } else {
    updated = [leader, ...all];
  }
  saveStoredPlantLeaderships(updated);
}

// Delete a plant leader
export function deletePlantLeader(leaderId: string): void {
  const all = getStoredPlantLeaderships();
  const updated = all.filter(l => l.id !== leaderId);
  saveStoredPlantLeaderships(updated);
}

// Calculate Enterprise aggregate statistics across all plants
export function calculateEnterpriseAggregateStats(plants: EnterprisePlant[]) {
  const totalPlants = plants.length;
  const totalCapacityLines = plants.reduce((sum, p) => sum + (p.totalLinesCount || 0), 0);
  const activePlantsCount = plants.filter(p => p.status === 'active' || !p.status).length;
  const totalFloorsCount = plants.reduce((sum, p) => sum + (p.floors?.length || 0), 0);
  const averageTargetEff = totalPlants > 0
    ? Math.round((plants.reduce((sum, p) => sum + (p.targetEfficiencyBenchmark || 85), 0) / totalPlants) * 10) / 10
    : 85;

  return {
    totalPlants,
    activePlantsCount,
    totalCapacityLines,
    totalFloorsCount,
    averageTargetEff
  };
}
