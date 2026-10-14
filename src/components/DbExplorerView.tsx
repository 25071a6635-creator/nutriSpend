import React, { useState } from 'react';
import {
  Database,
  Server,
  Code2,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { DbStatus } from '../types.js';

interface DbExplorerViewProps {
  dbStatus: DbStatus | null;
  onSeedData: () => Promise<void>;
  isSeeding: boolean;
  totalMeals: number;
}

export const DbExplorerView: React.FC<DbExplorerViewProps> = ({
  dbStatus,
  onSeedData,
  isSeeding,
  totalMeals,
}) => {
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);
  const [activePipelineTab, setActivePipelineTab] = useState<'facet' | 'daily' | 'unwind' | 'stats'>('facet');

  const copyCode = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedQuery(key);
    setTimeout(() => setCopiedQuery(null), 2500);
  };

  const pipelines = {
    facet: {
      title: '1. Multi-Dimensional Summary ($facet & $group)',
      description: 'Used by /api/analytics/summary to compute overall totals, category groups, meal types, and daily rankings simultaneously in one single database trip.',
      code: `// MongoDB Aggregation Pipeline in food_nutrition_analyzer
db.meals.aggregate([
  { $match: { userId: "user_student_demo" } },
  {
    $facet: {
      overallTotals: [
        {
          $group: {
            _id: null,
            totalExpenditure: { $sum: "$expense" },
            totalCalories: { $sum: "$nutrition.calories" },
            mealCount: { $sum: 1 },
            avgExpensePerMeal: { $avg: "$expense" },
            minMealExpense: { $min: "$expense" },
            maxMealExpense: { $max: "$expense" }
          }
        }
      ],
      categoryTotals: [
        {
          $group: {
            _id: "$foodCategory",
            categorySpend: { $sum: "$expense" },
            categoryCalories: { $sum: "$nutrition.calories" },
            categoryCount: { $sum: 1 }
          }
        }
      ],
      mealTypeTotals: [
        {
          $group: {
            _id: "$mealType",
            typeSpend: { $sum: "$expense" },
            typeCalories: { $sum: "$nutrition.calories" },
            typeCount: { $sum: 1 }
          }
        }
      ],
      dailyGrouping: [
        {
          $group: {
            _id: "$date",
            dailySpend: { $sum: "$expense" },
            dailyCalories: { $sum: "$nutrition.calories" }
          }
        },
        { $sort: { dailySpend: -1 } }
      ]
    }
  }
]);`,
    },
    daily: {
      title: '2. Daily Categorized Trends ($group & $cond)',
      description: 'Used by /api/analytics/daily to produce stacked spending charts for homemade vs restaurant vs snacks per day.',
      code: `db.meals.aggregate([
  { $match: { userId: "user_student_demo" } },
  {
    $group: {
      _id: "$date",
      totalSpend: { $sum: "$expense" },
      totalCalories: { $sum: "$nutrition.calories" },
      mealCount: { $sum: 1 },
      homemadeSpend: {
        $sum: { $cond: [{ $eq: ["$foodCategory", "homemade"] }, "$expense", 0] }
      },
      restaurantSpend: {
        $sum: { $cond: [{ $eq: ["$foodCategory", "restaurant"] }, "$expense", 0] }
      },
      snackSpend: {
        $sum: { $cond: [{ $eq: ["$foodCategory", "snack"] }, "$expense", 0] }
      }
    }
  },
  { $sort: { _id: 1 } },
  {
    $project: {
      date: "$_id",
      totalSpend: 1,
      totalCalories: 1,
      mealCount: 1,
      homemadeSpend: 1,
      restaurantSpend: 1,
      snackSpend: 1
    }
  }
]);`,
    },
    unwind: {
      title: '3. Ingredients Frequency ($unwind & $group)',
      description: 'Used by /api/analytics/nutrition to deconstruct the ingredients array and rank student staples by occurrence and associated calories.',
      code: `db.meals.aggregate([
  { $match: { userId: "user_student_demo" } },
  { $unwind: "$ingredients" },
  {
    $group: {
      _id: { $toLower: { $trim: { input: "$ingredients" } } },
      count: { $sum: 1 },
      associatedCalories: { $avg: "$nutrition.calories" }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);`,
    },
    stats: {
      title: '4. Top Spending Days ($sort & $limit)',
      description: 'Used by /api/analytics/top-spending-days to pinpoint days of peak expenditure.',
      code: `db.meals.aggregate([
  { $match: { userId: "user_student_demo" } },
  {
    $group: {
      _id: "$date",
      totalSpend: { $sum: "$expense" },
      totalCalories: { $sum: "$nutrition.calories" },
      mealCount: { $sum: 1 }
    }
  },
  { $sort: { totalSpend: -1 } },
  { $limit: 7 },
  {
    $project: {
      date: "$_id",
      totalSpend: 1,
      totalCalories: 1,
      mealCount: 1
    }
  }
]);`,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">MongoDB Architecture & Pipeline Explorer</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Database Engineering
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Inspect live schemas, collection status, indexes, and real MongoDB aggregation pipelines.
          </p>
        </div>

        <button
          onClick={onSeedData}
          disabled={isSeeding}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Seeding MongoDB...' : 'Reset & Seed 24 Meals'}</span>
        </button>
      </div>

      {/* Connection & Database Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Database Engine Status</h2>
              <p className="text-xs text-slate-400">Target database: <code className="text-emerald-400 font-mono">food_nutrition_analyzer</code></p>
            </div>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full font-bold flex items-center space-x-1.5 border ${
              dbStatus?.connectedToAtlas
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus?.connectedToAtlas ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{dbStatus?.connectedToAtlas ? 'MongoDB Atlas Connected' : 'In-Memory MongoDB Engine Active'}</span>
          </span>
        </div>

        {/* Collections Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Collection: meals</span>
            <div className="text-lg font-bold text-white mt-1">{totalMeals} documents</div>
            <span className="text-[10px] text-emerald-400 font-mono">Indexed: userId, date, category</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Collection: budgets</span>
            <div className="text-lg font-bold text-white mt-1">1 active budget</div>
            <span className="text-[10px] text-emerald-400 font-mono">Indexed: userId (unique)</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Collection: meal_suggestions</span>
            <div className="text-lg font-bold text-white mt-1">{dbStatus?.counts.suggestions ?? 0} saved</div>
            <span className="text-[10px] text-slate-400 font-mono">Gemini AI suggestions</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase font-mono">Collection: users</span>
            <div className="text-lg font-bold text-white mt-1">1 student profile</div>
            <span className="text-[10px] text-slate-400 font-mono">Default student user</span>
          </div>
        </div>
      </div>

      {/* Interactive Aggregation Pipeline Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Real MongoDB Aggregation Pipelines in this Application</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Demonstrating genuine MongoDB operations: $facet, $group, $unwind, $project, $cond, $sort, and $limit.
          </p>
        </div>

        {/* Pipeline Selection Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-b border-slate-800 pb-3">
          {(['facet', 'daily', 'unwind', 'stats'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActivePipelineTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activePipelineTab === tab
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {tab === 'facet'
                ? '$facet Multi-Summary'
                : tab === 'daily'
                ? '$group Daily Trends'
                : tab === 'unwind'
                ? '$unwind Ingredients'
                : '$sort & $limit Top Days'}
            </button>
          ))}
        </div>

        {/* Selected Pipeline Description & Code Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-white">{pipelines[activePipelineTab].title}</h3>
              <p className="text-[11px] text-slate-400">{pipelines[activePipelineTab].description}</p>
            </div>
            <button
              onClick={() => copyCode(activePipelineTab, pipelines[activePipelineTab].code)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition"
            >
              {copiedQuery === activePipelineTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Pipeline</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-emerald-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
            {pipelines[activePipelineTab].code}
          </pre>
        </div>
      </div>

      {/* MongoDB Atlas Setup Guide */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>How to Connect Your MongoDB Atlas Cluster</span>
        </h2>
        <div className="text-xs text-slate-300 space-y-2">
          <p>
            1. Create a free cluster on{' '}
            <a
              href="https://www.mongodb.com/cloud/atlas"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline font-semibold"
            >
              MongoDB Atlas
            </a>
            .
          </p>
          <p>
            2. In <strong>Network Access</strong>, allow IP address <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-300">0.0.0.0/0</code> (or your current IP).
          </p>
          <p>
            3. Copy your Atlas connection string and set it in your environment variables:
          </p>
          <code className="block p-3 bg-slate-950 rounded-xl text-emerald-300 font-mono text-[11px] break-all border border-slate-800">
            MONGODB_URI=&quot;mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.xxxxx.mongodb.net/food_nutrition_analyzer?retryWrites=true&amp;w=majority&quot;
          </code>
          <p className="text-slate-400 text-[11px]">
            *The application automatically falls back to its built-in in-memory MongoDB replica engine if credentials are omitted or network is unreachable.
          </p>
        </div>
      </div>
    </div>
  );
};
