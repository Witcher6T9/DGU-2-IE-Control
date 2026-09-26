import React, { useState } from 'react';
import { X, CheckSquare } from 'lucide-react';
import { ActionItem } from '../types/dcs';

interface NewActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAction: (action: ActionItem) => void;
  preselectedStation?: string;
}

export const NewActionModal: React.FC<NewActionModalProps> = ({
  isOpen,
  onClose,
  onAddAction,
  preselectedStation = 'ST-03',
}) => {
  const [title, setTitle] = useState('');
  const [stationCode, setStationCode] = useState(preselectedStation);
  const [owner, setOwner] = useState('Sarah Jenkins');
  const [role, setRole] = useState('Industrial Engineer');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [category, setCategory] = useState<'Safety' | 'Quality' | 'Efficiency' | '5S' | 'Maintenance'>('Efficiency');
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [description, setDescription] = useState('');
  const [countermeasure, setCountermeasure] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newAction: ActionItem = {
      id: `act-${Date.now()}`,
      title,
      stationCode,
      owner,
      role,
      priority,
      status: 'Open',
      dueDate,
      createdDate: new Date().toISOString().split('T')[0],
      category,
      description,
      countermeasure: countermeasure || 'Root cause investigation and poke-yoke trial scheduled.',
    };

    onAddAction(newAction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">
              Create Tier 1/2 Daily Action Item (CAPA)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-mono text-slate-400 mb-1">Action Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Optimize feeder track escapement clearance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Station Code</label>
              <select
                value={stationCode}
                onChange={(e) => setStationCode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              >
                <option value="ST-01">ST-01 Infeed</option>
                <option value="ST-02">ST-02 Robotic Fastening</option>
                <option value="ST-03">ST-03 Ultrasonic Seal</option>
                <option value="ST-04">ST-04 AOI & Testing</option>
                <option value="ST-05">ST-05 Packaging</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="High">High (Immediate)</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Assigned Owner</label>
              <input
                type="text"
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Role / Function</label>
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="Efficiency">Efficiency (Cycle Time / OEE)</option>
                <option value="Quality">Quality (Scrap / Defect)</option>
                <option value="Maintenance">Maintenance & Reliability</option>
                <option value="Safety">Safety & Ergonomics</option>
                <option value="5S">5S Workplace Standards</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-slate-400 mb-1">Target Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Problem Description</label>
            <textarea
              rows={2}
              required
              placeholder="Detailed description of deviation, gap, or waste observed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Proposed Countermeasure / PDCA Action</label>
            <textarea
              rows={2}
              placeholder="Planned technical fix, calibration change, or poka-yoke installation..."
              value={countermeasure}
              onChange={(e) => setCountermeasure(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            >
              Save Action Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
