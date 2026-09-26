import React, { useState } from 'react';
import { X, AlertTriangle, Clock, Wrench } from 'lucide-react';
import { DowntimeIncident, LossCategory } from '../types/dcs';

interface NewDowntimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDowntime: (incident: DowntimeIncident) => void;
  preselectedStation?: string;
}

export const NewDowntimeModal: React.FC<NewDowntimeModalProps> = ({
  isOpen,
  onClose,
  onAddDowntime,
  preselectedStation = 'ST-02',
}) => {
  const [stationCode, setStationCode] = useState(preselectedStation);
  const [category, setCategory] = useState<LossCategory>('Equipment Breakdown');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [description, setDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [reportedBy, setReportedBy] = useState('Priya Patel (Op) / Dave Chen (Tech)');

  if (!isOpen) return null;

  const stationMap: Record<string, string> = {
    'ST-01': 'Auto Infeed & De-nesting',
    'ST-02': 'Robotic Fastening Cell',
    'ST-03': 'Ultrasonic Seal & Dispense',
    'ST-04': 'AOI Vision & Hi-Pot Testing',
    'ST-05': 'Laser Labelling & Auto Packout',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newIncident: DowntimeIncident = {
      id: `dt-${Date.now()}`,
      timestamp: timeStr,
      stationCode,
      stationName: stationMap[stationCode] || 'DGU-2 Station',
      category,
      durationMinutes,
      description,
      rootCause: rootCause || 'Investigation in progress',
      actionTaken: actionTaken || 'Reset fault and restarted line',
      reportedBy,
      shift: 'Shift 1',
    };

    onAddDowntime(newIncident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">
              Log Line Downtime / Stoppage Event
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-slate-400 mb-1">Station Affected</label>
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
              <label className="block font-mono text-slate-400 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                min="1"
                max="180"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Loss Classification (Six Big Losses)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as LossCategory)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            >
              <option value="Equipment Breakdown">Equipment Breakdown (Unplanned)</option>
              <option value="Setup & Adjustments">Setup & Adjustments / Changeover</option>
              <option value="Idling & Minor Stops">Idling & Minor Stops (&lt;5 min)</option>
              <option value="Reduced Speed">Reduced Speed / Takt Loss</option>
              <option value="Process Defects / Rework">Process Defects / Scrap Rejects</option>
              <option value="Startup & Material Starvation">Startup & Material Starvation</option>
            </select>
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Failure Symptom / Problem Description</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Robot axis 4 torque limit tripped due to mechanical binding in guide rail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Initial Root Cause</label>
            <input
              type="text"
              placeholder="e.g. Debris accumulated in linear bearing carriage"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Containment & Immediate Action Taken</label>
            <input
              type="text"
              placeholder="e.g. Cleaned and lubricated rail; verified axis repeatability test"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">Reported By</label>
            <input
              type="text"
              required
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
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
              className="px-4 py-1.5 font-medium rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
            >
              Log Downtime Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
