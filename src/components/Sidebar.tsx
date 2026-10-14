import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Wallet,
  Sparkles,
  PieChart,
  FileSpreadsheet,
  Database,
  ArrowUpRight,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import { AnalyticsSummary } from '../types.js';

export type NavTab = 'dashboard' | 'meals' | 'budget' | 'ai' | 'nutrition' | 'reports' | 'db';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  summary: AnalyticsSummary | null;
  totalMealsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  summary,
  totalMealsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'meals' as NavTab,
      label: 'Meals Log',
      icon: UtensilsCrossed,
      badge: totalMealsCount > 0 ? totalMealsCount : null,
    },
    {
      id: 'budget' as NavTab,
      label: 'Budget & Spend',
      icon: Wallet,
      badge: summary?.budget.dailyOverBudget ? 'Alert' : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      id: 'ai' as NavTab,
      label: 'AI Meal Chef',
      icon: Sparkles,
      badge: 'Gemini',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'nutrition' as NavTab,
      label: 'Nutrition Analysis',
      icon: PieChart,
      badge: null,
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports & Stats',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'db' as NavTab,
      label: 'MongoDB Explorer',
      icon: Database,
      badge: null,
    },
  ];

  const budgetConsumed = summary?.budget?.budgetConsumedPercent ?? 0;
  const remainingBudget = summary?.budget?.remainingMonthlyBudget ?? 0;

  return (
    <aside className="w-full md:w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0">
      {/* Navigation Links */}
      <div className="p-4 space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-emerald-400 stroke-[2.2]' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* College Student Budget Mini Widget */}
      <div className="p-4 m-3 rounded-2xl bg-slate-950/70 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-300">Monthly Budget</span>
          <span className="text-xs font-bold text-emerald-400">₹{summary?.budget?.monthly || 4800}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              budgetConsumed > 90
                ? 'bg-rose-500'
                : budgetConsumed > 75
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetConsumed)}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
          <span>Spent: ₹{summary?.totalExpenditure ?? 0}</span>
          <span className={remainingBudget < 500 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
            Left: ₹{remainingBudget}
          </span>
        </div>

        {summary?.budget?.dailyOverBudget && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center space-x-1.5 text-[10px] text-amber-300">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Avg spend &gt; ₹{summary.budget.daily}/day limit</span>
          </div>
        )}
      </div>
    </aside>
  );
};
