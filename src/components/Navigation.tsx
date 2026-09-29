import React from 'react';
import { 
  Activity, 
  BarChart2, 
  TrendingDown, 
  Sliders, 
  CheckSquare, 
  ShieldCheck 
} from 'lucide-react';

export type ActiveTab = 'overview' | 'hourly' | 'loss_pareto' | 'balancing' | 'actions' | 'audits';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  openActionsCount: number;
  totalDowntimeMinutes: number;
  auditPassRate: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  openActionsCount,
  totalDowntimeMinutes,
  auditPassRate,
}) => {
  const tabs = [
    {
      id: 'overview' as ActiveTab,
      label: 'Line Overview & OEE',
      icon: Activity,
    },
    {
      id: 'hourly' as ActiveTab,
      label: 'Hourly Pacing (UPH)',
      icon: BarChart2,
    },
    {
      id: 'loss_pareto' as ActiveTab,
      label: 'Loss Pareto & Downtime',
      icon: TrendingDown,
      badge: `${totalDowntimeMinutes}m`,
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-800/80',
    },
    {
      id: 'balancing' as ActiveTab,
      label: 'IE Yamazumi & Balancing',
      icon: Sliders,
    },
    {
      id: 'actions' as ActiveTab,
      label: 'Daily Actions & 5-Whys',
      icon: CheckSquare,
      badge: `${openActionsCount} open`,
      badgeColor: 'text-blue-400 bg-blue-950/60 border-blue-800/80',
    },
    {
      id: 'audits' as ActiveTab,
      label: '5S & Centerlines',
      icon: ShieldCheck,
      badge: `${auditPassRate}%`,
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80',
    },
  ];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-20 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-colors border ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 text-[10px] font-mono rounded border ${tab.badgeColor}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
