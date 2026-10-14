import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar.js';
import { Sidebar, NavTab } from './components/Sidebar.js';
import { DashboardView } from './components/DashboardView.js';
import { MealsView } from './components/MealsView.js';
import { BudgetView } from './components/BudgetView.js';
import { AiSuggestionsView } from './components/AiSuggestionsView.js';
import { NutritionView } from './components/NutritionView.js';
import { ReportsView } from './components/ReportsView.js';
import { DbExplorerView } from './components/DbExplorerView.js';
import { api } from './services/api.js';
import {
  Meal,
  AnalyticsSummary,
  DailyAnalyticsItem,
  NutritionAnalytics,
  Budget,
  DbStatus,
} from './types.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyAnalyticsItem[]>([]);
  const [nutritionData, setNutritionData] = useState<NutritionAnalytics | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Calculate startDate based on filter
  const getFilterStartDate = (filter: string): string | undefined => {
    if (filter === 'all') return undefined;
    const days = filter === '7d' ? 7 : filter === '14d' ? 14 : 30;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const loadAllData = useCallback(async () => {
    try {
      const startDate = getFilterStartDate(dateFilter);
      const [mealsRes, summaryData, dailyItems, nutrData, budgetData, statusData] =
        await Promise.all([
          api.getMeals({
            startDate,
            foodCategory: categoryFilter !== 'all' ? categoryFilter : undefined,
            limit: 100,
          }),
          api.getSummary(startDate),
          api.getDailyAnalytics(startDate),
          api.getNutritionAnalytics(startDate),
          api.getBudget(),
          api.getDbStatus(),
        ]);

      setMeals(mealsRes.data);
      setSummary(summaryData);
      setDailyData(dailyItems);
      setNutritionData(nutrData);
      setBudget(budgetData);
      setDbStatus(statusData);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter, categoryFilter]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Actions
  const handleAddMeal = async (newMeal: Omit<Meal, '_id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    await api.createMeal(newMeal);
    await loadAllData();
  };

  const handleUpdateMeal = async (id: string, updates: Partial<Meal>) => {
    await api.updateMeal(id, updates);
    await loadAllData();
  };

  const handleDeleteMeal = async (id: string) => {
    await api.deleteMeal(id);
    await loadAllData();
  };

  const handleUpdateBudget = async (newBudget: { dailyBudget: number; weeklyBudget: number; monthlyBudget: number }) => {
    const updated = await api.updateBudget(newBudget);
    setBudget(updated);
    await loadAllData();
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      await api.seedDatabase();
      await loadAllData();
    } catch (err: any) {
      alert('Seeding failed: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        dbStatus={dbStatus}
        onRefreshData={loadAllData}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          summary={summary}
          totalMealsCount={meals.length}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center space-y-3">
              <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-medium">Connecting to MongoDB &amp; Aggregating Analytics...</p>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  summary={summary}
                  dailyData={dailyData}
                  recentMeals={meals}
                  onOpenAddMeal={() => setIsAddModalOpen(true)}
                  onNavigateToTab={setCurrentTab}
                  dateFilter={dateFilter}
                  setDateFilter={setDateFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                />
              )}

              {currentTab === 'meals' && (
                <MealsView
                  meals={meals}
                  onAddMeal={handleAddMeal}
                  onUpdateMeal={handleUpdateMeal}
                  onDeleteMeal={handleDeleteMeal}
                  onRefresh={loadAllData}
                  isAddModalOpen={isAddModalOpen}
                  setIsAddModalOpen={setIsAddModalOpen}
                />
              )}

              {currentTab === 'budget' && (
                <BudgetView
                  summary={summary}
                  dailyData={dailyData}
                  budget={budget}
                  onUpdateBudget={handleUpdateBudget}
                  onNavigateToTab={setCurrentTab}
                />
              )}

              {currentTab === 'ai' && (
                <AiSuggestionsView
                  onMealAdded={loadAllData}
                  userBudgetDaily={budget?.dailyBudget}
                />
              )}

              {currentTab === 'nutrition' && (
                <NutritionView
                  summary={summary}
                  nutritionData={nutritionData}
                  meals={meals}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  summary={summary}
                  dailyData={dailyData}
                  meals={meals}
                />
              )}

              {currentTab === 'db' && (
                <DbExplorerView
                  dbStatus={dbStatus}
                  onSeedData={handleSeedData}
                  isSeeding={isSeeding}
                  totalMeals={meals.length}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Food, Nutrition &amp; Meal Expense Analyzer for College Students</span>
          <span className="font-mono text-[11px] text-slate-400">
            Powered by MongoDB Atlas &amp; Gemini 3.8 Flash
          </span>
        </div>
      </footer>
    </div>
  );
}
