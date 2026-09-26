/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LineIEMember {
  id: string;
  title: string;
  code: string;
  lineNo: string;
  lines: string[];
  floor: string;
  floorName: string;
  engineerName: string;
  section: 'blue' | 'green';
  status: 'active' | 'on_floor' | 'standby';
}

export interface InchargeNode {
  id: string;
  inchargeNo: number;
  title: string;
  name: string;
  code: string;
  managerId: string;
  section: 'blue' | 'green';
  colorHex: string;
  assignedFloors: string;
  assignedLinesRange: string;
  lineIEs: LineIEMember[];
}

export interface ManagerNode {
  id: string;
  title: string;
  name: string;
  code: string;
  section: 'blue' | 'green';
  wingName: string;
  colorHex: string;
  assignedLinesRange: string;
  assignedFloors: string;
  incharges: InchargeNode[];
}

export interface DebonairOrgChart {
  unitName: string;
  deptName: string;
  head: {
    title: string;
    name: string;
    code: string;
    designation: string;
    roleTierId: string;
    colorHex: string;
  };
  managers: ManagerNode[];
}

export const DEBONAIR_IE_ORG_CHART: DebonairOrgChart = {
  unitName: 'Debonair LTD (Unit-02)',
  deptName: 'IE Dept.',
  head: {
    title: 'Sr. Manager',
    name: 'Ashik Hossain',
    code: 'SR-MGR-01',
    designation: 'Head of Industrial Engineering Dept. - Debonair LTD (Unit-02)',
    roleTierId: 'tier_1',
    colorHex: '#475569'
  },
  managers: [
    {
      id: 'mgr_01',
      title: 'Manager',
      name: 'Tanvir Ahmed',
      code: 'MGR-01',
      section: 'blue',
      wingName: 'Section Wing A (Blue)',
      colorHex: '#2563eb',
      assignedLinesRange: 'Lines 01 - 17',
      assignedFloors: 'Padma, Meghna & Karnophuli Floors',
      incharges: [
        {
          id: 'inc_01',
          inchargeNo: 1,
          title: 'IE Incharge 1',
          name: 'Md. Rafiqul Islam',
          code: 'INC-01',
          managerId: 'mgr_01',
          section: 'blue',
          colorHex: '#3b82f6',
          assignedFloors: 'Floor 01 (Padma Floor)',
          assignedLinesRange: 'Lines 01 - 06',
          lineIEs: [
            {
              id: 'line_ie_01',
              title: 'Line IE',
              code: 'LIE-01',
              lineNo: '01 & 02',
              lines: ['01', '02'],
              floor: 'Floor 01',
              floorName: 'Padma Floor',
              engineerName: 'Sabbir Ahmed',
              section: 'blue',
              status: 'on_floor'
            },
            {
              id: 'line_ie_02',
              title: 'Line IE',
              code: 'LIE-02',
              lineNo: '03 & 04',
              lines: ['03', '04'],
              floor: 'Floor 01',
              floorName: 'Padma Floor',
              engineerName: 'Fahim Faisal',
              section: 'blue',
              status: 'active'
            },
            {
              id: 'line_ie_03',
              title: 'Line IE',
              code: 'LIE-03',
              lineNo: '05 & 06',
              lines: ['05', '06'],
              floor: 'Floor 01',
              floorName: 'Padma Floor',
              engineerName: 'Naimur Rahman',
              section: 'blue',
              status: 'on_floor'
            }
          ]
        },
        {
          id: 'inc_02',
          inchargeNo: 2,
          title: 'IE Incharge 2',
          name: 'Kazi Nazmul',
          code: 'INC-02',
          managerId: 'mgr_01',
          section: 'blue',
          colorHex: '#0284c7',
          assignedFloors: 'Floor 02 (Meghna Floor)',
          assignedLinesRange: 'Lines 07 - 12',
          lineIEs: [
            {
              id: 'line_ie_04',
              title: 'Line IE',
              code: 'LIE-04',
              lineNo: '07 & 08',
              lines: ['07', '08'],
              floor: 'Floor 02',
              floorName: 'Meghna Floor',
              engineerName: 'Mehedi Hasan',
              section: 'blue',
              status: 'active'
            },
            {
              id: 'line_ie_05',
              title: 'Line IE',
              code: 'LIE-05',
              lineNo: '09 & 10',
              lines: ['09', '10'],
              floor: 'Floor 02',
              floorName: 'Meghna Floor',
              engineerName: 'Tariqul Islam',
              section: 'blue',
              status: 'on_floor'
            },
            {
              id: 'line_ie_06',
              title: 'Line IE',
              code: 'LIE-06',
              lineNo: '11 & 12',
              lines: ['11', '12'],
              floor: 'Floor 02',
              floorName: 'Meghna Floor',
              engineerName: 'Shakil Mahmud',
              section: 'blue',
              status: 'active'
            }
          ]
        },
        {
          id: 'inc_03',
          inchargeNo: 3,
          title: 'IE Incharge 3',
          name: 'Sharif Hossain',
          code: 'INC-03',
          managerId: 'mgr_01',
          section: 'blue',
          colorHex: '#0891b2',
          assignedFloors: 'Floor 03 (Karnophuli Floor)',
          assignedLinesRange: 'Lines 13 - 17',
          lineIEs: [
            {
              id: 'line_ie_07',
              title: 'Line IE',
              code: 'LIE-07',
              lineNo: '13 & 14',
              lines: ['13', '14'],
              floor: 'Floor 03',
              floorName: 'Karnophuli Floor',
              engineerName: 'Imran Khan',
              section: 'blue',
              status: 'on_floor'
            },
            {
              id: 'line_ie_08',
              title: 'Line IE',
              code: 'LIE-08',
              lineNo: '15 & 16',
              lines: ['15', '16'],
              floor: 'Floor 03',
              floorName: 'Karnophuli Floor',
              engineerName: 'Anwarul Azim',
              section: 'blue',
              status: 'active'
            },
            {
              id: 'line_ie_09',
              title: 'Line IE',
              code: 'LIE-09',
              lineNo: '17 & Pilot',
              lines: ['17', '17B'],
              floor: 'Floor 03',
              floorName: 'Karnophuli Floor',
              engineerName: 'Rashedul Islam',
              section: 'blue',
              status: 'on_floor'
            }
          ]
        }
      ]
    },
    {
      id: 'mgr_02',
      title: 'Manager',
      name: 'Mahmudul Hasan',
      code: 'MGR-02',
      section: 'green',
      wingName: 'Section Wing B (Green)',
      colorHex: '#65a30d',
      assignedLinesRange: 'Lines 18 - 34',
      assignedFloors: 'Korotoya, Shitalokshya & Turag Floors',
      incharges: [
        {
          id: 'inc_04',
          inchargeNo: 4,
          title: 'IE Incharge 4',
          name: 'Arifur Rahman',
          code: 'INC-04',
          managerId: 'mgr_02',
          section: 'green',
          colorHex: '#84cc16',
          assignedFloors: 'Floor 04 (Korotoya Floor)',
          assignedLinesRange: 'Lines 18 - 23',
          lineIEs: [
            {
              id: 'line_ie_10',
              title: 'Line IE',
              code: 'LIE-10',
              lineNo: '18 & 19',
              lines: ['18', '19'],
              floor: 'Floor 04',
              floorName: 'Korotoya Floor',
              engineerName: 'Habibur Rahman',
              section: 'green',
              status: 'on_floor'
            },
            {
              id: 'line_ie_11',
              title: 'Line IE',
              code: 'LIE-11',
              lineNo: '20 & 21',
              lines: ['20', '21'],
              floor: 'Floor 04',
              floorName: 'Korotoya Floor',
              engineerName: 'Asaduzzaman',
              section: 'green',
              status: 'active'
            },
            {
              id: 'line_ie_12',
              title: 'Line IE',
              code: 'LIE-12',
              lineNo: '22 & 23',
              lines: ['22', '23'],
              floor: 'Floor 04',
              floorName: 'Korotoya Floor',
              engineerName: 'Mizanur Rahman',
              section: 'green',
              status: 'on_floor'
            }
          ]
        },
        {
          id: 'inc_05',
          inchargeNo: 5,
          title: 'IE Incharge 5',
          name: 'Kamrul Islam',
          code: 'INC-05',
          managerId: 'mgr_02',
          section: 'green',
          colorHex: '#65a30d',
          assignedFloors: 'Floor 05 (Shitalokshya Floor)',
          assignedLinesRange: 'Lines 24 - 29',
          lineIEs: [
            {
              id: 'line_ie_13',
              title: 'Line IE',
              code: 'LIE-13',
              lineNo: '24 & 25',
              lines: ['24', '25'],
              floor: 'Floor 05',
              floorName: 'Shitalokshya Floor',
              engineerName: 'Golam Mostafa',
              section: 'green',
              status: 'active'
            },
            {
              id: 'line_ie_14',
              title: 'Line IE',
              code: 'LIE-14',
              lineNo: '26 & 27',
              lines: ['26', '27'],
              floor: 'Floor 05',
              floorName: 'Shitalokshya Floor',
              engineerName: 'Shafiqul Islam',
              section: 'green',
              status: 'on_floor'
            },
            {
              id: 'line_ie_15',
              title: 'Line IE',
              code: 'LIE-15',
              lineNo: '28 & 29',
              lines: ['28', '29'],
              floor: 'Floor 05',
              floorName: 'Shitalokshya Floor',
              engineerName: 'Zubair Hossain',
              section: 'green',
              status: 'active'
            }
          ]
        },
        {
          id: 'inc_06',
          inchargeNo: 6,
          title: 'IE Incharge 6',
          name: 'Ziaul Haque',
          code: 'INC-06',
          managerId: 'mgr_02',
          section: 'green',
          colorHex: '#15803d',
          assignedFloors: 'Floor 06 (Turag Floor)',
          assignedLinesRange: 'Lines 30 - 34',
          lineIEs: [
            {
              id: 'line_ie_16',
              title: 'Line IE',
              code: 'LIE-16',
              lineNo: '30 & 31',
              lines: ['30', '31'],
              floor: 'Floor 06',
              floorName: 'Turag Floor',
              engineerName: 'Al-Amin Hossain',
              section: 'green',
              status: 'on_floor'
            },
            {
              id: 'line_ie_17',
              title: 'Line IE',
              code: 'LIE-17',
              lineNo: '32 & 33',
              lines: ['32', '33'],
              floor: 'Floor 06',
              floorName: 'Turag Floor',
              engineerName: 'Ruhul Amin',
              section: 'green',
              status: 'active'
            },
            {
              id: 'line_ie_18',
              title: 'Line IE',
              code: 'LIE-18',
              lineNo: '34 & Pilot',
              lines: ['34', '34B'],
              floor: 'Floor 06',
              floorName: 'Turag Floor',
              engineerName: 'Jahangir Alam',
              section: 'green',
              status: 'on_floor'
            }
          ]
        }
      ]
    }
  ]
};
