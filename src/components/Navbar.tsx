import React, { useState } from 'react';
import { Utensils, Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { DbStatus } from '../types.js';

interface NavbarProps {
  dbStatus: DbStatus | null;
  onRefreshData: () => void;
  onSeedData: () => Promise<void>;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  dbStatus,
  onRefreshData,
  onSeedData,
  isSeeding,
}) => {
  const [showDbModal, setShowDbModal] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
            <Utensils className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">NutriSpend AI</span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full">
                Student Edition
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI Food, Nutrition & Expense Analyzer</p>
          </div>
        </div>

        {/* Action Controls & DB Status */}
        <div className="flex items-center space-x-3">
          {/* DB Status Badge */}
          <button
            onClick={() => setShowDbModal(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              dbStatus?.connectedToAtlas
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
            }`}
            title="Click to view MongoDB connection details"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {dbStatus?.connectedToAtlas ? 'MongoDB Atlas' : 'MongoDB (In-Memory Demo)'}
            </span>
            <span className="md:hidden">
              {dbStatus?.connectedToAtlas ? 'Atlas' : 'Demo DB'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                dbStatus?.connectedToAtlas ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Seed / Reset Sample Data Button */}
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-50"
            title="Seed 24 realistic college student meals in INR"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">{isSeeding ? 'Seeding...' : 'Reset Demo Data'}</span>
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
              AS
            </div>
            <div className="hidden lg:block text-left text-xs">
              <p className="font-semibold text-slate-200 leading-tight">Aarav Sharma</p>
              <p className="text-slate-400 text-[10px]">Hostel Block B</p>
            </div>
          </div>
        </div>
      </div>

      {/* Database Connection Info Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">MongoDB Connection Status</h3>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700 flex items-start space-x-3">
                {dbStatus?.connectedToAtlas ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold text-white text-sm">
                    {dbStatus?.connectedToAtlas ? 'Live MongoDB Atlas Active' : 'MongoDB In-Memory Engine Active'}
                  </p>
                  <p className="text-slate-400 mt-1">
                    {dbStatus?.connectedToAtlas
                      ? 'Connected to Atlas cluster database "food_nutrition_analyzer". All CRUD, filters, and aggregations ($facet, $group, $unwind) execute live on MongoDB.'
                      : 'Running our built-in MongoDB document engine. All document queries, CRUD operations, and aggregation pipelines are completely functional and persist in session memory.'}
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Name:</span>
                  <span className="text-emerald-400 font-semibold">{dbStatus?.databaseName || 'food_nutrition_analyzer'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Collections:</span>
                  <span className="text-slate-300">users, meals, budgets, meal_suggestions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className={dbStatus?.connectedToAtlas ? 'text-emerald-400' : 'text-amber-400'}>
                    {dbStatus?.mode}
                  </span>
                </div>
                {dbStatus?.counts && (
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-slate-300">
                    <span>Documents in Memory:</span>
                    <span>{dbStatus.counts.meals ?? 0} meals | {dbStatus.counts.budgets ?? 0} budget</span>
                  </div>
                )}
              </div>

              {!dbStatus?.connectedToAtlas && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-slate-300">
                  <p className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Connect your own MongoDB Atlas:
                  </p>
                  <p className="text-slate-400">
                    Add your connection string in <code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300">.env</code> as:
                  </p>
                  <code className="block mt-1.5 p-2 bg-slate-950 text-emerald-300 rounded text-[10px] break-all border border-slate-800">
                    MONGODB_URI="mongodb+srv://&lt;username&gt;:&lt;password&gt;@cluster0.mongodb.net/food_nutrition_analyzer"
                  </code>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowDbModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
