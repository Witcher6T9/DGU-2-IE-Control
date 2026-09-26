import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  HelpCircle,
  ShieldCheck,
  User,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { ActionItem, FiveWhyInvestigation } from '../types/dcs';

interface ActionTrackerTabProps {
  actions: ActionItem[];
  fiveWhys: FiveWhyInvestigation[];
  onOpenNewAction: () => void;
  onUpdateActionStatus: (id: string, newStatus: 'Open' | 'In Progress' | 'Verified Closed') => void;
  onAddNewFiveWhy: (newWhy: FiveWhyInvestigation) => void;
}

export const ActionTrackerTab: React.FC<ActionTrackerTabProps> = ({
  actions,
  fiveWhys,
  onOpenNewAction,
  onUpdateActionStatus,
  onAddNewFiveWhy,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'actions' | 'fiveWhys'>('actions');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 5-Whys Modal state
  const [isAddingWhy, setIsAddingWhy] = useState(false);
  const [whyProblem, setWhyProblem] = useState('');
  const [whyStation, setWhyStation] = useState('ST-03');
  const [whyLead, setWhyLead] = useState('Sarah Jenkins, PE');
  const [whyInputs, setWhyInputs] = useState<string[]>([
    'Why is the issue occurring in production?',
    '',
    '',
    '',
    '',
  ]);
  const [whyRootCause, setWhyRootCause] = useState('');
  const [whyPreventive, setWhyPreventive] = useState('');

  const openCount = actions.filter((a) => a.status === 'Open').length;
  const inProgressCount = actions.filter((a) => a.status === 'In Progress').length;
  const closedCount = actions.filter((a) => a.status === 'Verified Closed').length;

  const filteredActions = actions.filter((a) => {
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.stationCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleSaveWhy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whyProblem || !whyRootCause) return;

    const newObj: FiveWhyInvestigation = {
      id: `5w-${Date.now()}`,
      problemTitle: whyProblem,
      stationCode: whyStation,
      date: new Date().toISOString().split('T')[0],
      leadEngineer: whyLead,
      whys: whyInputs.filter(w => w.trim().length > 0),
      rootCause: whyRootCause,
      preventiveAction: whyPreventive,
    };

    onAddNewFiveWhy(newObj);
    setIsAddingWhy(false);
    setWhyProblem('');
    setWhyRootCause('');
    setWhyPreventive('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              Daily Tier Management · CAPA & Problem Solving
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Closed-loop countermeasures for DGU-2 line deviations and chronic stoppages
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSubTab === 'actions' ? (
              <button
                onClick={onOpenNewAction}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Action Item</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddingWhy(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New 5-Whys Root Cause</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Switcher (Actions vs 5-Whys) */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('actions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                activeSubTab === 'actions'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              Action Items Tracker ({actions.length})
            </button>
            <button
              onClick={() => setActiveSubTab('fiveWhys')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                activeSubTab === 'fiveWhys'
                  ? 'bg-slate-800 text-white border-slate-700'
                  : 'text-slate-400 hover:text-white border-transparent'
              }`}
            >
              5-Whys Investigations ({fiveWhys.length})
            </button>
          </div>

          {/* Quick Status Count Badges */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-amber-400">{openCount} Open</span>
            <span className="text-slate-600">·</span>
            <span className="text-blue-400">{inProgressCount} In Progress</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400">{closedCount} Verified</span>
          </div>
        </div>
      </div>

      {activeSubTab === 'actions' ? (
        /* Action Items Table & Filter View */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Action Items ({filteredActions.length})
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search actions..."
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Verified Closed">Verified Closed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Priority</th>
                  <th className="py-3 px-3 font-semibold">Station</th>
                  <th className="py-3 px-3 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Action Title & Description</th>
                  <th className="py-3 px-4 font-semibold">Owner & Role</th>
                  <th className="py-3 px-3 font-semibold">Due Date</th>
                  <th className="py-3 px-4 font-semibold">Countermeasure / Resolution</th>
                  <th className="py-3 px-4 font-semibold text-right">Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredActions.map((act) => {
                  const isHigh = act.priority === 'High';
                  const isClosed = act.status === 'Verified Closed';
                  const isInProgress = act.status === 'In Progress';

                  return (
                    <tr key={act.id} className="hover:bg-slate-800/30 transition-colors font-sans">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                          isHigh
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800/80'
                            : act.priority === 'Medium'
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800/80'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {act.priority}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs font-bold text-blue-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {act.stationCode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-xs">
                        {act.category}
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-semibold text-white text-xs">{act.title}</div>
                        <div className="text-slate-400 text-xs mt-0.5 line-clamp-2">{act.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white text-xs font-medium">{act.owner}</div>
                        <div className="text-slate-500 text-[11px] font-mono">{act.role}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-300">
                        {act.dueDate}
                      </td>
                      <td className="py-3 px-4 max-w-xs text-xs text-emerald-300/90 font-mono">
                        {act.countermeasure}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <select
                          value={act.status}
                          onChange={(e) => onUpdateActionStatus(act.id, e.target.value as any)}
                          className={`text-xs font-mono font-semibold rounded-lg px-2.5 py-1 border transition-colors focus:outline-none ${
                            isClosed
                              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                              : isInProgress
                              ? 'bg-blue-950/80 text-blue-400 border-blue-800'
                              : 'bg-amber-950/80 text-amber-400 border-amber-800'
                          }`}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Verified Closed">Verified Closed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 5-Whys Investigations View */
        <div className="space-y-4">
          {fiveWhys.map((fw) => (
            <div key={fw.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                    {fw.stationCode}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{fw.problemTitle}</h3>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Lead: <strong className="text-slate-200 font-normal">{fw.leadEngineer}</strong> · Date: {fw.date}
                </div>
              </div>

              {/* The 5 Whys Chain */}
              <div className="mt-4 space-y-2.5 pl-2">
                {fw.whys.map((w, index) => (
                  <div key={index} className="flex items-start gap-3 text-xs">
                    <span className="font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 shrink-0">
                      Why {index + 1}
                    </span>
                    <span className="text-slate-300 mt-0.5 font-sans">{w}</span>
                  </div>
                ))}
              </div>

              {/* Root Cause & Countermeasure Callouts */}
              <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/60">
                  <div className="font-semibold text-rose-300 uppercase tracking-wider text-[11px] mb-1">
                    Validated Root Cause:
                  </div>
                  <div className="text-slate-200 font-mono">{fw.rootCause}</div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/60">
                  <div className="font-semibold text-emerald-300 uppercase tracking-wider text-[11px] mb-1">
                    Permanent Preventive Action (Poka-Yoke):
                  </div>
                  <div className="text-slate-200 font-mono">{fw.preventiveAction}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New 5-Whys Modal */}
      {isAddingWhy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-xl w-full p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-semibold text-white border-b border-slate-800 pb-3">
              Initiate New 5-Whys Root Cause Investigation
            </h3>

            <form onSubmit={handleSaveWhy} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-mono text-slate-400 mb-1">Problem Statement</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ST-04 Hi-Pot false tripping on grounding terminal"
                  value={whyProblem}
                  onChange={(e) => setWhyProblem(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 mb-1">Station Code</label>
                  <select
                    value={whyStation}
                    onChange={(e) => setWhyStation(e.target.value)}
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
                  <label className="block font-mono text-slate-400 mb-1">Lead Investigator</label>
                  <input
                    type="text"
                    required
                    value={whyLead}
                    onChange={(e) => setWhyLead(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-slate-400">Sequential Whys Chain</label>
                {whyInputs.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 w-12 text-right">Why {idx + 1}:</span>
                    <input
                      type="text"
                      placeholder={`Why did step ${idx === 0 ? 'the problem' : idx} happen?`}
                      value={val}
                      onChange={(e) => {
                        const copy = [...whyInputs];
                        copy[idx] = e.target.value;
                        setWhyInputs(copy);
                      }}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Root Cause</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Underlying systemic or mechanical root cause identified..."
                  value={whyRootCause}
                  onChange={(e) => setWhyRootCause(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Preventive Countermeasure</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Poka-yoke, redesign, or standard operating procedure change..."
                  value={whyPreventive}
                  onChange={(e) => setWhyPreventive(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingWhy(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Save Investigation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
