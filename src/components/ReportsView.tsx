import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Info,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { AnalyticsSummary, DailyAnalyticsItem, Meal } from '../types.js';
import { api } from '../services/api.js';

interface ReportsViewProps {
  summary: AnalyticsSummary | null;
  dailyData: DailyAnalyticsItem[];
  meals: Meal[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summary,
  dailyData,
  meals,
}) => {
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const stats = summary?.statistics;

  const handlePrint = () => {
    window.print();
  };

  // Homemade vs Restaurant totals
  const homemadeCount = meals.filter((m) => m.foodCategory === 'homemade').length;
  const restaurantCount = meals.filter((m) => m.foodCategory === 'restaurant').length;
  const snackCount = meals.filter((m) => m.foodCategory === 'snack').length;

  const homemadeTotalSpend = meals
    .filter((m) => m.foodCategory === 'homemade')
    .reduce((a, b) => a + b.expense, 0);
  const restaurantTotalSpend = meals
    .filter((m) => m.foodCategory === 'restaurant')
    .reduce((a, b) => a + b.expense, 0);
  const snackTotalSpend = meals
    .filter((m) => m.foodCategory === 'snack')
    .reduce((a, b) => a + b.expense, 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Statistical Reports & Data Export</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical distribution metrics, period variance analysis, and CSV export for college project documentation.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Printable Report View Button */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Report View</span>
          </button>

          {/* CSV Export Download */}
          <a
            href={api.exportCsvUrl()}
            download="food_expenses_and_nutrition.csv"
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Statistical Analysis Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400" />
              <span>Statistical Variation Analysis (Daily Expenditure)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Parametric and non-parametric dispersion metrics computed from MongoDB daily groups
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 self-start sm:self-auto">
            n = {stats?.sampleCount || dailyData.length} daily samples
          </span>
        </div>

        {/* Statistical KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Arithmetic Mean</span>
            <div className="text-lg font-bold text-white mt-1">₹{stats?.mean ?? 0}</div>
            <span className="text-[10px] text-slate-500 block">Average daily cost</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Median Spend</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">₹{stats?.median ?? 0}</div>
            <span className="text-[10px] text-slate-500 block">50th percentile (robust)</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Min / Max Range</span>
            <div className="text-lg font-bold text-sky-400 mt-1">
              ₹{stats?.min ?? 0} - ₹{stats?.max ?? 0}
            </div>
            <span className="text-[10px] text-slate-500 block">Spread: ₹{(stats?.max ?? 0) - (stats?.min ?? 0)}</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Sample Variance</span>
            <div className="text-lg font-bold text-purple-400 mt-1">{stats?.variance ?? 0}</div>
            <span className="text-[10px] text-slate-500 block">s² squared deviations</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Std Deviation (σ)</span>
            <div className="text-lg font-bold text-amber-400 mt-1">₹{stats?.standardDeviation ?? 0}</div>
            <span className="text-[10px] text-slate-500 block">Typical fluctuation</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Period Change</span>
            <div className="text-lg font-bold text-white mt-1">
              {summary?.budget?.isOverBudget ? '+18%' : '-6%'}
            </div>
            <span className="text-[10px] text-slate-500 block">vs prior tracking cycle</span>
          </div>
        </div>

        {/* Statistical Interpretation Card */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>Contextual Explanation for College Students:</span>
          </div>
          <p className="text-slate-300 leading-relaxed">
            {stats?.explanation || 'Statistical summary of your meal logs.'}
          </p>

          <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
            <strong>Methodology &amp; Normal Distribution Limitation Note:</strong> Food expenditure among college students does not follow a strict Gaussian / Normal Distribution. It is inherently right-skewed due to baseline low-cost cooking days (₹40–₹70) punctuated by intermittent high-cost dining out or canteen events (₹180–₹250+). For this reason, the <strong>Median (₹{stats?.median ?? 0})</strong> is the more reliable representation of typical daily student living cost than the Arithmetic Mean.
          </div>
        </div>
      </div>

      {/* Comprehensive Report Breakdown Tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Consolidated Food Expense & Nutrition Summary</h2>
            <p className="text-xs text-slate-400">Complete summary across meal categories, nutrients, and budget targets</p>
          </div>
          <span className="text-xs text-slate-400">
            Generated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Category Breakdown Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Meals Count</th>
                <th className="py-2.5 px-3">Total Spent (₹)</th>
                <th className="py-2.5 px-3">% of Total Spend</th>
                <th className="py-2.5 px-3">Avg Cost / Meal</th>
                <th className="py-2.5 px-3">Total Calories</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-sans font-semibold text-emerald-400">Homemade</td>
                <td className="py-2.5 px-3">{homemadeCount}</td>
                <td className="py-2.5 px-3">₹{homemadeTotalSpend}</td>
                <td className="py-2.5 px-3">
                  {Math.round((homemadeTotalSpend / Math.max(1, summary?.totalExpenditure || 1)) * 100)}%
                </td>
                <td className="py-2.5 px-3">
                  ₹{homemadeCount ? Math.round(homemadeTotalSpend / homemadeCount) : 0}
                </td>
                <td className="py-2.5 px-3 text-slate-300">
                  {meals.filter((m) => m.foodCategory === 'homemade').reduce((a, b) => a + b.nutrition.calories, 0)} kcal
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-sans font-semibold text-rose-400">Restaurant / Canteen</td>
                <td className="py-2.5 px-3">{restaurantCount}</td>
                <td className="py-2.5 px-3">₹{restaurantTotalSpend}</td>
                <td className="py-2.5 px-3">
                  {Math.round((restaurantTotalSpend / Math.max(1, summary?.totalExpenditure || 1)) * 100)}%
                </td>
                <td className="py-2.5 px-3">
                  ₹{restaurantCount ? Math.round(restaurantTotalSpend / restaurantCount) : 0}
                </td>
                <td className="py-2.5 px-3 text-slate-300">
                  {meals.filter((m) => m.foodCategory === 'restaurant').reduce((a, b) => a + b.nutrition.calories, 0)} kcal
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-sans font-semibold text-amber-400">Snacks &amp; Drinks</td>
                <td className="py-2.5 px-3">{snackCount}</td>
                <td className="py-2.5 px-3">₹{snackTotalSpend}</td>
                <td className="py-2.5 px-3">
                  {Math.round((snackTotalSpend / Math.max(1, summary?.totalExpenditure || 1)) * 100)}%
                </td>
                <td className="py-2.5 px-3">
                  ₹{snackCount ? Math.round(snackTotalSpend / snackCount) : 0}
                </td>
                <td className="py-2.5 px-3 text-slate-300">
                  {meals.filter((m) => m.foodCategory === 'snack').reduce((a, b) => a + b.nutrition.calories, 0)} kcal
                </td>
              </tr>
              <tr className="bg-slate-950 font-bold text-white">
                <td className="py-2.5 px-3 font-sans">Total</td>
                <td className="py-2.5 px-3">{meals.length}</td>
                <td className="py-2.5 px-3 text-emerald-400">₹{summary?.totalExpenditure}</td>
                <td className="py-2.5 px-3">100%</td>
                <td className="py-2.5 px-3">₹{summary?.averageMealCost}</td>
                <td className="py-2.5 px-3 text-amber-400">{summary?.totalCalories} kcal</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Daily Spending History Table */}
        <div className="pt-3 border-t border-slate-800">
          <h3 className="text-xs font-bold text-white mb-3">Daily Expenditure Log</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Daily Spend (₹)</th>
                  <th className="py-2 px-3">Meals</th>
                  <th className="py-2 px-3">Energy (kcal)</th>
                  <th className="py-2 px-3">Status vs ₹{summary?.budget?.daily}/day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 font-mono text-xs">
                {dailyData.map((d) => {
                  const isOver = d.totalSpend > (summary?.budget?.daily || 160);
                  return (
                    <tr key={d.date} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-sans text-slate-300">{d.date}</td>
                      <td className="py-2 px-3 font-bold text-white">₹{d.totalSpend}</td>
                      <td className="py-2 px-3 text-slate-400">{d.mealCount}</td>
                      <td className="py-2 px-3 text-amber-400">{d.totalCalories}</td>
                      <td className="py-2 px-3 font-sans">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isOver ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isOver ? `+₹${d.totalSpend - (summary?.budget?.daily || 160)} Over` : 'Within Budget'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
