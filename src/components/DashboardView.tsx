import React, { useState } from 'react';
import {
  IndianRupee,
  Flame,
  Calendar,
  Wallet,
  Utensils,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Tag,
} from 'lucide-react';
import { AnalyticsSummary, DailyAnalyticsItem, Meal } from '../types.js';
import {
  SpendingLineChart,
  CaloriesByMealTypeChart,
  StackedSpendChart,
  CategoryDonutChart,
} from './charts/InteractiveCharts.js';

interface DashboardViewProps {
  summary: AnalyticsSummary | null;
  dailyData: DailyAnalyticsItem[];
  recentMeals: Meal[];
  onOpenAddMeal: () => void;
  onNavigateToTab: (tab: any) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  dailyData,
  recentMeals,
  onOpenAddMeal,
  onNavigateToTab,
  dateFilter,
  setDateFilter,
  categoryFilter,
  setCategoryFilter,
}) => {
  const budget = summary?.budget;
  const budgetConsumed = budget?.budgetConsumedPercent ?? 0;
  const isOverBudget = budget?.isOverBudget ?? false;
  const isApproachingBudget = budgetConsumed >= 80 && !isOverBudget;

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Student Food & Budget Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time analytics computed directly from your MongoDB meal records.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Filter */}
          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            {['7d', '14d', '30d', 'all'].map((opt) => (
              <button
                key={opt}
                onClick={() => setDateFilter(opt)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  dateFilter === opt
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt === '7d' ? '7 Days' : opt === '14d' ? '14 Days' : opt === '30d' ? '30 Days' : 'All Time'}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Food Categories</option>
            <option value="homemade">Homemade Only</option>
            <option value="restaurant">Restaurant / Canteen</option>
            <option value="snack">Snacks Only</option>
          </select>

          {/* Quick Add Meal CTA */}
          <button
            onClick={onOpenAddMeal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Log Meal</span>
          </button>
        </div>
      </div>

      {/* Budget Warning Banner (If applicable) */}
      {isOverBudget ? (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 flex items-start space-x-3">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-rose-200">Budget Limit Exceeded!</span> You have spent ₹
            {summary?.totalExpenditure} this period, which exceeds your monthly target of ₹
            {budget?.monthly}. Consider switching more meals to homemade hostel cooking or check the{' '}
            <button
              onClick={() => onNavigateToTab('ai')}
              className="underline font-semibold hover:text-rose-100"
            >
              AI Meal Chef
            </button>{' '}
            for budget-friendly recipes under ₹40.
          </div>
        </div>
      ) : isApproachingBudget ? (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-200">Budget Warning:</span> You have consumed{' '}
            {budgetConsumed}% of your allocated monthly food budget. You have ₹
            {budget?.remainingMonthlyBudget} remaining.
          </div>
        </div>
      ) : null}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Spend */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Total Spend</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <IndianRupee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              ₹{summary?.totalExpenditure ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Avg ₹{summary?.averageMealCost ?? 0}/meal
            </div>
          </div>
        </div>

        {/* Total Calories */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Total Calories</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {summary?.totalCalories ?? 0}{' '}
              <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Est. energy intake
            </div>
          </div>
        </div>

        {/* Daily Average Spend */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Daily Avg Spend</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              ₹{summary?.averageDailySpend ?? 0}
            </div>
            <div className={`text-[10px] font-medium mt-0.5 ${summary?.budget?.dailyOverBudget ? 'text-amber-400' : 'text-emerald-400'}`}>
              Limit: ₹{budget?.daily ?? 160}/day
            </div>
          </div>
        </div>

        {/* Daily Avg Calories */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Daily Avg Cals</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {summary?.averageDailyCalories ?? 0}{' '}
              <span className="text-xs font-normal text-slate-400">kcal</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Over {summary?.uniqueDaysTracked ?? 1} tracked days
            </div>
          </div>
        </div>

        {/* Total Meals */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Meals Logged</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Utensils className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl font-bold text-white tracking-tight">
              {summary?.totalMeals ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              MongoDB documents
            </div>
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-medium">Budget Left</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className={`text-xl font-bold tracking-tight ${(budget?.remainingMonthlyBudget ?? 0) < 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
              ₹{budget?.remainingMonthlyBudget ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {budgetConsumed}% consumed
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row 1: Daily Spend Trend & Spending by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Food Expenditure vs Budget Limit */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily Food Expenditure vs Budget</h2>
              <p className="text-xs text-slate-400">Time-series expenditure plotted against daily budget limit</p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              ₹ Trend
            </span>
          </div>

          <SpendingLineChart data={dailyData} dailyBudget={budget?.daily} />
        </div>

        {/* Category Spending Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Food Spending by Category</h2>
            <p className="text-xs text-slate-400 mb-4">Homemade vs Restaurant vs Snacks breakdown</p>
          </div>

          <CategoryDonutChart categories={summary?.categoryBreakdown || []} />

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Cheapest Meal Source:</span>
            <span className="text-emerald-400 font-semibold">Homemade (~₹40/meal)</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Row 2: Calories by Meal Type & Stacked Daily Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Calories Consumed by Meal Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Calories Consumed by Meal Type</h2>
              <p className="text-xs text-slate-400">Total energy distribution across breakfast, lunch, dinner & snacks</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg font-mono">
              $group by mealType
            </span>
          </div>

          <CaloriesByMealTypeChart data={summary?.mealTypeBreakdown || []} />
        </div>

        {/* Stacked Daily Category Spending */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily Spending Composition</h2>
              <p className="text-xs text-slate-400">Stacked breakdown of homemade, canteen, and snacks per day</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-lg font-mono">
              Stacked Daily Bars
            </span>
          </div>

          <StackedSpendChart data={dailyData} />
        </div>
      </div>

      {/* Bottom Section: Recent Meals & AI Assistant CTA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Meals List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recently Recorded Meals</h2>
              <p className="text-xs text-slate-400">Latest meals entered into MongoDB</p>
            </div>
            <button
              onClick={() => onNavigateToTab('meals')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>View All Meals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentMeals.slice(0, 5).map((meal) => (
              <div
                key={meal._id}
                className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      meal.foodCategory === 'homemade'
                        ? 'bg-emerald-400'
                        : meal.foodCategory === 'restaurant'
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <h3 className="text-xs font-semibold text-slate-200">{meal.mealName}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                      <span className="capitalize">{meal.mealType}</span>
                      <span>•</span>
                      <span>{meal.date}</span>
                      <span>•</span>
                      <span className="capitalize text-slate-300">{meal.foodCategory}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-white">₹{meal.expense}</div>
                  <div className="text-[10px] text-amber-400">{meal.nutrition.calories} kcal</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Chef Quick Promo Card */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold mb-3">
              <Sparkles className="w-3 h-3" />
              <span>Gemini 3.8 Flash AI</span>
            </div>
            <h3 className="text-base font-bold text-white">Running Low on Budget?</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Tell our AI Chef what ingredients are left in your hostel room or fridge (e.g. eggs, bread, rice, dal) and your available budget in rupees.
            </p>
            <p className="text-xs text-emerald-400/90 mt-2 font-medium">
              Get 3 high-protein, delicious student recipes under ₹50 each!
            </p>
          </div>

          <div className="mt-5">
            <button
              onClick={() => onNavigateToTab('ai')}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Meal Chef</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
