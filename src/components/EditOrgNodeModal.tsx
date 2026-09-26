/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Save, User, Layers, Building, Tag, CheckCircle2, Sliders, AlertCircle } from 'lucide-react';

export interface EditNodeData {
  type: 'head' | 'manager' | 'incharge' | 'line_ie';
  id: string;
  name: string;
  title: string;
  code: string;
  lines?: string[];
  floor?: string;
  floorName?: string;
  status?: 'active' | 'on_floor' | 'standby';
  assignedLinesRange?: string;
  assignedFloors?: string;
  wingName?: string;
  inchargeId?: string;
  managerId?: string;
}

interface InchargeOption {
  id: string;
  title: string;
  name: string;
  floorName: string;
  wing: 'blue' | 'green';
}

interface EditOrgNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: EditNodeData | null;
  onSave: (updated: EditNodeData) => void;
  availableIncharges: InchargeOption[];
}

export const EditOrgNodeModal: React.FC<EditOrgNodeModalProps> = ({
  isOpen,
  onClose,
  nodeData,
  onSave,
  availableIncharges
}) => {
  const [formData, setFormData] = useState<EditNodeData | null>(null);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (nodeData) {
      setFormData({ ...nodeData });
      if (nodeData.lines && nodeData.lines.length >= 2) {
        setLine1(nodeData.lines[0]);
        setLine2(nodeData.lines[1]);
      } else if (nodeData.lines && nodeData.lines.length === 1) {
        setLine1(nodeData.lines[0]);
        setLine2('');
      } else {
        setLine1('');
        setLine2('');
      }
      setValidationError('');
    }
  }, [nodeData]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setValidationError('Personnel Name is required.');
      return;
    }

    if (formData.type === 'line_ie') {
      const cleanL1 = line1.trim().replace(/^0+/, '').padStart(2, '0');
      const cleanL2 = line2.trim().replace(/^0+/, '').padStart(2, '0');
      if (!cleanL1 || !cleanL2) {
        setValidationError('Both assigned production lines must be specified.');
        return;
      }
      onSave({
        ...formData,
        lines: [cleanL1, cleanL2]
      });
    } else {
      onSave(formData);
    }
    onClose();
  };

  const getRoleBadge = () => {
    switch (formData.type) {
      case 'head':
        return { label: 'Tier 1 • Head of IE', bg: 'bg-slate-800 text-white' };
      case 'manager':
        return { label: 'Tier 2 • Section Manager', bg: 'bg-blue-700 text-white' };
      case 'incharge':
        return { label: 'Tier 3 • IE Incharge', bg: 'bg-teal-700 text-white' };
      case 'line_ie':
        return { label: 'Tier 4 • Line IE (2 Lines)', bg: 'bg-emerald-700 text-white' };
      default:
        return { label: 'Personnel', bg: 'bg-slate-700 text-white' };
    }
  };

  const badge = getRoleBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-[#fcfbf9] rounded-3xl border border-[#d9d2c2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e0d2] bg-[#f5f1e8]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-[#d2c9b6] text-[#176f78] shadow-2xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-[#17343a]">
                  Edit Operational Role
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-xs text-[#527078] mt-0.5">
                Debonair LTD (Unit-02) • Code: <span className="font-mono font-bold text-[#17343a]">{formData.code}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#e8e2d4] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {validationError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Name Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#527078] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Assigned Engineer / Manager Name</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs sm:text-sm text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
              placeholder="e.g. Engr. Md. Asif Khan"
              required
            />
          </div>

          {/* Role Title / Designation */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#527078] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Title / Role Designation</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs sm:text-sm text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
              placeholder="e.g. Line IE • Padma Floor"
              required
            />
          </div>

          {/* Specific Fields for Line IE */}
          {formData.type === 'line_ie' && (
            <>
              {/* 2 Assigned Lines */}
              <div className="p-3.5 rounded-2xl bg-[#f4f1e8] border border-[#dcd4c3] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#17343a] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Assigned Sewing Lines (2 Lines Per IE)</span>
                  </label>
                  <span className="text-[10px] font-mono font-bold text-[#176f78] bg-white px-2 py-0.5 rounded-md border border-[#d0c7b3]">
                    L-{line1 || '??'} & L-{line2 || '??'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-[#527078] font-semibold block mb-1">
                      Line 1 (e.g. 01)
                    </span>
                    <input
                      type="text"
                      value={line1}
                      onChange={e => setLine1(e.target.value)}
                      placeholder="01"
                      maxLength={4}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white text-xs font-mono font-bold text-[#17343a] text-center focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                      required
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#527078] font-semibold block mb-1">
                      Line 2 (e.g. 02)
                    </span>
                    <input
                      type="text"
                      value={line2}
                      onChange={e => setLine2(e.target.value)}
                      placeholder="02"
                      maxLength={4}
                      className="w-full px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-white text-xs font-mono font-bold text-[#17343a] text-center focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Status and Floor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                    Floor Assignment
                  </label>
                  <input
                    type="text"
                    value={formData.floorName || ''}
                    onChange={e => setFormData({ ...formData, floorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                    placeholder="e.g. Padma Floor"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                    Floor Duty Status
                  </label>
                  <select
                    value={formData.status || 'on_floor'}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'active' | 'on_floor' | 'standby'
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78] cursor-pointer"
                  >
                    <option value="on_floor">Active On Floor (Green)</option>
                    <option value="active">Active Monitoring (Blue)</option>
                    <option value="standby">Standby / Reliever (Amber)</option>
                  </select>
                </div>
              </div>

              {/* Transfer to Different Incharge */}
              {availableIncharges.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#527078] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Supervising IE Incharge (Transfer Floor)</span>
                  </label>
                  <select
                    value={formData.inchargeId || ''}
                    onChange={e => setFormData({ ...formData, inchargeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78] cursor-pointer"
                  >
                    {availableIncharges.map(inc => (
                      <option key={inc.id} value={inc.id}>
                        {inc.title} - {inc.floorName} ({inc.name}) [{inc.wing.toUpperCase()} WING]
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Specific Fields for Incharge */}
          {formData.type === 'incharge' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                  Assigned Lines Range
                </label>
                <input
                  type="text"
                  value={formData.assignedLinesRange || ''}
                  onChange={e => setFormData({ ...formData, assignedLinesRange: e.target.value })}
                  placeholder="e.g. Lines 01 - 06"
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                  Assigned Floor
                </label>
                <input
                  type="text"
                  value={formData.assignedFloors || ''}
                  onChange={e => setFormData({ ...formData, assignedFloors: e.target.value })}
                  placeholder="e.g. Padma Floor (4th Floor)"
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>
            </div>
          )}

          {/* Specific Fields for Manager */}
          {formData.type === 'manager' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                  Wing Name / Section
                </label>
                <input
                  type="text"
                  value={formData.wingName || ''}
                  onChange={e => setFormData({ ...formData, wingName: e.target.value })}
                  placeholder="e.g. Section Wing A (Blue)"
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                  Assigned Lines Coverage
                </label>
                <input
                  type="text"
                  value={formData.assignedLinesRange || ''}
                  onChange={e => setFormData({ ...formData, assignedLinesRange: e.target.value })}
                  placeholder="e.g. Lines 01 - 17"
                  className="w-full px-3 py-2 rounded-xl border border-[#d9d2c2] bg-white text-xs text-[#17343a] font-medium focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#e6e0d2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#527078] hover:text-[#17343a] hover:bg-[#e8e2d4] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply Updates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
