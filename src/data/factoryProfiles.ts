/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FactoryIndustryProfile } from '../types';

export const DEFAULT_FACTORY_PROFILE: FactoryIndustryProfile = {
  id: 'factory_debonair_u02',
  name: 'Debonair LTD',
  unitName: 'Unit-02',
  industrySector: 'Apparel & Garments (RMG)',
  department: 'Industrial Engineering (IE) Dept.',
  factoryCode: 'DBN-U02',
  addressLocation: 'Gorai, Mirzapur, Tangail / Gazipur',
  shortTag: 'DBN-02',
  brandColor: '#176f78',
  establishedYear: '2008',
  totalLinesCount: 34,
  contactEmail: 'ie.unit02@debonairgroupbd.com',
  isCustom: false
};

export const PRESET_FACTORIES: FactoryIndustryProfile[] = [
  DEFAULT_FACTORY_PROFILE,
  {
    id: 'factory_apex_footwear',
    name: 'Apex Footwear Ltd.',
    unitName: 'Unit-01 (Assembly)',
    industrySector: 'Footwear & Leathercraft',
    department: 'Operations & Work Study Division',
    factoryCode: 'AFW-U01',
    addressLocation: 'Haragach, Gazipur Industrial Area',
    shortTag: 'APEX-01',
    brandColor: '#0f766e',
    establishedYear: '1990',
    totalLinesCount: 24,
    contactEmail: 'ie.plant01@apexfootwearbd.com',
    isCustom: false
  },
  {
    id: 'factory_hameem_denim',
    name: 'Ha-Meem Denim Mills Ltd.',
    unitName: 'Plant-04 (Woven & Denim)',
    industrySector: 'Textiles & Denim Manufacturing',
    department: 'IE & Productivity Cell',
    factoryCode: 'HMD-P04',
    addressLocation: 'Nishat Nagar, Tongi, Gazipur',
    shortTag: 'HMD-04',
    brandColor: '#1e40af',
    establishedYear: '2004',
    totalLinesCount: 40,
    contactEmail: 'productivity@hameemgroup.com',
    isCustom: false
  },
  {
    id: 'factory_square_fashions',
    name: 'Square Fashions & Textiles Ltd.',
    unitName: 'Unit-03 (Knitwear)',
    industrySector: 'Knit & Composite Apparel',
    department: 'Lean Manufacturing & IE Dept.',
    factoryCode: 'SFL-U03',
    addressLocation: 'Bhaluka, Mymensingh / Valuka Plant',
    shortTag: 'SFL-03',
    brandColor: '#047857',
    establishedYear: '2001',
    totalLinesCount: 28,
    contactEmail: 'ie.valuka@squaretextilesbd.com',
    isCustom: false
  },
  {
    id: 'factory_pacific_jeans',
    name: 'Pacific Jeans Ltd.',
    unitName: 'Universal Plant-02',
    industrySector: 'Denim & Premium Casualwear',
    department: 'Industrial Engineering Center of Excellence',
    factoryCode: 'PJL-UP02',
    addressLocation: 'CEPZ, Chattogram, Bangladesh',
    shortTag: 'PJL-02',
    brandColor: '#0369a1',
    establishedYear: '1984',
    totalLinesCount: 36,
    contactEmail: 'operations@pacificjeans.com',
    isCustom: false
  }
];

export const INDUSTRY_SECTORS = [
  'Apparel & Garments (RMG)',
  'Textiles & Denim Manufacturing',
  'Footwear & Leathercraft',
  'Knit & Composite Apparel',
  'Woven Outerwear & Heavy Jackets',
  'Automotive & Vehicle Assembly',
  'Electronics & High-Tech Hardware',
  'FMCG & Packaging Line',
  'Sporting Goods & Accessories',
  'Custom Industrial Manufacturing'
];

const ACTIVE_FACTORY_STORAGE_KEY = 'ie_active_factory_profile';
const SAVED_FACTORIES_STORAGE_KEY = 'ie_saved_factory_list';

export function getStoredActiveFactory(): FactoryIndustryProfile {
  if (typeof window === 'undefined') return DEFAULT_FACTORY_PROFILE;
  try {
    const raw = localStorage.getItem(ACTIVE_FACTORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse active factory profile from localStorage:', e);
  }
  return DEFAULT_FACTORY_PROFILE;
}

export function setStoredActiveFactory(profile: FactoryIndustryProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_FACTORY_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save active factory profile to localStorage:', e);
  }
}

export function getStoredSavedFactories(): FactoryIndustryProfile[] {
  if (typeof window === 'undefined') return PRESET_FACTORIES;
  try {
    const raw = localStorage.getItem(SAVED_FACTORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse saved factories from localStorage:', e);
  }
  return PRESET_FACTORIES;
}

export function setStoredSavedFactories(list: FactoryIndustryProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_FACTORIES_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save factories list to localStorage:', e);
  }
}
