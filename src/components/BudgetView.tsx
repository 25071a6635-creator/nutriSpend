import React, { useState } from 'react';
import {
  Wallet,
  IndianRupee,
  Calendar,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  PiggyBank,
  Coffee,
  HelpCircle,
} from 'lucide-react';
import { AnalyticsSummary, DailyAnalyticsItem, Budget } from '../types.js';

interface BudgetViewProps {
  summary: AnalyticsSummary | null;
  dailyData: DailyAnalyticsItem[];
  budget: Budget | null;
  onUpdateBudget: (newBudget: { dailyBudget: number; weeklyBudget: number; monthlyBudget: number }) => Promise<void>;
  onNavigateToTab: (tab: any) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  summary,
  dailyData,
  budget,
  onUpdateBudget,
  onNavigateToTab,
}) => {
  const [dailyVal, setDailyVal] = useState(budget?.dailyBudget || 160);
  const [weeklyVal, setWeeklyVal] = useState(budget?.weeklyBudget || 1100);
  const [monthlyVal, setMonthlyVal] = useState(budget?.monthlyBudget || 4800);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state if budget loads/updates
  React.useEffect(() => {
    if (budget) {
      setDailyVal(budget.dailyBudget);
      setWeeklyVal(budget.weeklyBudget);
      setMonthlyVal(budget.monthlyBudget);
    }
  }, [budget]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateBudget({
        dailyBudget: Number(dailyVal),
        weeklyBudget: Number(weeklyVal),
        monthlyBudget: Number(monthlyVal),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert('Error updating budget: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const totalSpent = summary?.totalExpenditure ?? 0;
  const budgetConsumed = summary?.budget?.budgetConsumedPercent ?? 0;
  const remaining = summary?.budget?.remainingMonthlyBudget ?? 0;
  const isOverBudget = summary?.budget?.isOverBudget ?? false;
  const estimatedMonthlySpend = summary?.budget?.estimatedMonthlySpend ?? 0;

  // Highest and lowest spending days
  const sortedDays = [...dailyData].sort((a, b) => b.totalSpend - a.totalSpend);
  const highestDay = sortedDays[0];
  const lowestDay = sortedDays[sortedDays.length - 1];

  // Category spending comparison
  const homemadeSpend = dailyData.reduce((acc, d) => acc + d.homemadeSpend, 0);
  const restaurantSpend = dailyData.reduce((acc, d) => acc + d.restaurantSpend, 0);
  const snackSpend = dailyData.reduce((acc, d) => acc + d.snackSpend, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Food Expense & Budget Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure student budgets, monitor burn rates, and analyze restaurant versus home cooking expenditures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Current Monthly Target:</span>
          <span className="text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
            ₹{monthlyVal} / month
          </span>
        </div>
      </div>

      {/* Budget Status Alert Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          isOverBudget
            ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            : budgetConsumed >= 80
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div
              className={`p-2 rounded-xl mt-0.5 ${
                isOverBudget
                  ? 'bg-rose-500/20 text-rose-400'
                  : budgetConsumed >= 80
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {isOverBudget ? (
                <AlertTriangle className="w-5 h-5" />
              ) : budgetConsumed >= 80 ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-white">
                {isOverBudget
                  ? 'Budget Limit Exceeded'
                  : budgetConsumed >= 80
                  ? 'Approaching Monthly Budget Limit'
                  : 'Budget Health: On Track!'}
              </h2>
              <p className="text-xs mt-1 text-slate-300">
                You have spent <strong className="text-white">₹{totalSpent}</strong> ({budgetConsumed}% of your ₹
                {monthlyVal} target). Remaining balance:{' '}
                <strong className={remaining < 400 ? 'text-amber-400' : 'text-emerald-400'}>
                  ₹{remaining}
                </strong>
                .
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center space-x-2">
            <button
              onClick={() => onNavigateToTab('ai')}
              className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-xl text-xs font-semibold text-white transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Budget AI Meals</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-slate-900/90 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-rose-500' : budgetConsumed >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetConsumed)}%` }}
          />
        </div>
      </div>

      {/* Grid: Budget Settings Form + Projections Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Set Budget Form */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 mb-3">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Configure Student Budgets</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Adjust your daily, weekly, and monthly targets. Saves directly to the MongoDB <code className="text-emerald-400">budgets</code> collection.
          </p>

          <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
            {saveSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Budget updated successfully in MongoDB!</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Daily Budget (₹ INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="20"
                  step="5"
                  required
                  value={dailyVal}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setDailyVal(d);
                    setWeeklyVal(d * 7);
                    setMonthlyVal(d * 30);
                  }}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Typical student range: ₹120 - ₹200 / day</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Weekly Budget (₹ INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={weeklyVal}
                  onChange={(e) => setWeeklyVal(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Monthly Target Budget (₹ INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="500"
                  step="100"
                  required
                  value={monthlyVal}
                  onChange={(e) => setMonthlyVal(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSaving ? 'Updating...' : 'Save Budget Parameters'}
            </button>
          </form>
        </div>

        {/* Financial Projections & Statistics */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Expenditure Metrics & Projections</h2>
              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                Estimated Forecast
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Daily Spend Rate
                </span>
                <div className="text-lg font-bold text-white mt-1">
                  ₹{summary?.averageDailySpend ?? 0}{' '}
                  <span className="text-xs font-normal text-slate-500">/ day</span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Target: ₹{dailyVal}/day
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Projected Monthly
                </span>
                <div className="text-lg font-bold text-white mt-1">
                  ₹{estimatedMonthlySpend}
                </div>
                <span
                  className={`text-[10px] font-medium ${
                    estimatedMonthlySpend > monthlyVal ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {estimatedMonthlySpend > monthlyVal
                    ? `+₹${estimatedMonthlySpend - monthlyVal} over target`
                    : `-₹${monthlyVal - estimatedMonthlySpend} under target`}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Cost Per Meal (Avg)
                </span>
                <div className="text-lg font-bold text-white mt-1">
                  ₹{summary?.averageMealCost ?? 0}
                </div>
                <span className="text-[10px] text-slate-400">
                  Across {summary?.totalMeals ?? 0} meals
                </span>
              </div>
            </div>
          </div>

          {/* Homemade vs Restaurant Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-300">
              Where is your money going? (Cooked vs Bought)
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-400 block font-medium">Homemade</span>
                <span className="text-base font-bold text-white">₹{homemadeSpend}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ~₹{Math.round(homemadeSpend / Math.max(1, dailyData.filter((d) => d.homemadeSpend > 0).length))} / day
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <span className="text-[10px] text-rose-400 block font-medium">Restaurant / Canteen</span>
                <span className="text-base font-bold text-white">₹{restaurantSpend}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ~₹{Math.round(restaurantSpend / Math.max(1, dailyData.filter((d) => d.restaurantSpend > 0).length))} / day
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20">
                <span className="text-[10px] text-amber-400 block font-medium">Snacks & Tea</span>
                <span className="text-base font-bold text-white">₹{snackSpend}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ~₹{Math.round(snackSpend / Math.max(1, dailyData.filter((d) => d.snackSpend > 0).length))} / day
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>College Insight:</strong> Restaurant meals account for{' '}
              {Math.round((restaurantSpend / Math.max(1, totalSpent)) * 100)}% of your expenses. Preparing just 2 more meals in your hostel room per week saves approximately ₹350–₹500 weekly!
            </p>
          </div>
        </div>
      </div>

      {/* Highest-Spending and Lowest-Spending Days Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Daily Spending Ranking & Extremes</h2>
            <p className="text-xs text-slate-400">
              Generated by MongoDB aggregation pipeline sorting daily records by total expenditure
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
            $sort: &#123; totalSpend: -1 &#125;
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Highest Day Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold block">
                Highest Spending Day
              </span>
              <div className="text-lg font-bold text-white mt-0.5">
                {highestDay ? `₹${highestDay.totalSpend}` : 'N/A'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Date: <strong className="text-slate-200">{highestDay?.date || '-'}</strong> •{' '}
                {highestDay?.mealCount || 0} meals • {highestDay?.totalCalories || 0} kcal
              </p>
            </div>
          </div>

          {/* Lowest Day Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                Most Economical Day
              </span>
              <div className="text-lg font-bold text-white mt-0.5">
                {lowestDay ? `₹${lowestDay.totalSpend}` : 'N/A'}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Date: <strong className="text-slate-200">{lowestDay?.date || '-'}</strong> •{' '}
                {lowestDay?.mealCount || 0} meals • {lowestDay?.totalCalories || 0} kcal
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
