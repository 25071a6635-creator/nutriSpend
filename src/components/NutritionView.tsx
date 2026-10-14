import React, { useState } from 'react';
import {
  Flame,
  Dna,
  PieChart as PieIcon,
  Scale,
  Sparkles,
  Info,
  Apple,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import { AnalyticsSummary, NutritionAnalytics, Meal } from '../types.js';
import {
  NutritionMacroBars,
  CaloriesByMealTypeChart,
  CaloriesVsExpenseScatter,
} from './charts/InteractiveCharts.js';

interface NutritionViewProps {
  summary: AnalyticsSummary | null;
  nutritionData: NutritionAnalytics | null;
  meals: Meal[];
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  summary,
  nutritionData,
  meals,
}) => {
  const macros = summary?.macros || { protein: 0, carbohydrates: 0, fat: 0, fiber: 0 };
  const days = summary?.uniqueDaysTracked || 1;

  // Daily macro averages
  const avgDailyCalories = summary?.averageDailyCalories || 0;
  const avgDailyProtein = Math.round(macros.protein / days);
  const avgDailyCarbs = Math.round(macros.carbohydrates / days);
  const avgDailyFat = Math.round(macros.fat / days);
  const avgDailyFiber = Math.round(macros.fiber / days);

  // Compare homemade vs restaurant nutrition
  const homemadeMeals = meals.filter((m) => m.foodCategory === 'homemade');
  const restaurantMeals = meals.filter((m) => m.foodCategory === 'restaurant');

  const avgHomemadeCal = homemadeMeals.length
    ? Math.round(homemadeMeals.reduce((a, b) => a + b.nutrition.calories, 0) / homemadeMeals.length)
    : 0;
  const avgHomemadeProt = homemadeMeals.length
    ? Math.round((homemadeMeals.reduce((a, b) => a + b.nutrition.protein, 0) / homemadeMeals.length) * 10) / 10
    : 0;
  const avgHomemadeFat = homemadeMeals.length
    ? Math.round((homemadeMeals.reduce((a, b) => a + b.nutrition.fat, 0) / homemadeMeals.length) * 10) / 10
    : 0;
  const avgHomemadeFiber = homemadeMeals.length
    ? Math.round((homemadeMeals.reduce((a, b) => a + b.nutrition.fiber, 0) / homemadeMeals.length) * 10) / 10
    : 0;

  const avgRestCal = restaurantMeals.length
    ? Math.round(restaurantMeals.reduce((a, b) => a + b.nutrition.calories, 0) / restaurantMeals.length)
    : 0;
  const avgRestProt = restaurantMeals.length
    ? Math.round((restaurantMeals.reduce((a, b) => a + b.nutrition.protein, 0) / restaurantMeals.length) * 10) / 10
    : 0;
  const avgRestFat = restaurantMeals.length
    ? Math.round((restaurantMeals.reduce((a, b) => a + b.nutrition.fat, 0) / restaurantMeals.length) * 10) / 10
    : 0;
  const avgRestFiber = restaurantMeals.length
    ? Math.round((restaurantMeals.reduce((a, b) => a + b.nutrition.fiber, 0) / restaurantMeals.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Nutritional Health & Habits Analysis</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated macronutrients, energy distribution, and homemade vs restaurant nutritional balance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Total Tracked Energy:</span>
          <span className="text-sm font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
            {summary?.totalCalories ?? 0} kcal
          </span>
        </div>
      </div>

      {/* Daily Average Macronutrient Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Daily Avg Energy</span>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {avgDailyCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Estimated average</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Protein (Daily)</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {avgDailyProtein}g
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Muscle & repair</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Carbohydrates</span>
          <div className="text-xl font-bold text-sky-400 mt-1">
            {avgDailyCarbs}g
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Brain energy</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Healthy Fats</span>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {avgDailyFat}g
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Hormonal balance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] text-slate-400 block uppercase font-medium">Dietary Fiber</span>
          <div className="text-xl font-bold text-amber-300 mt-1">
            {avgDailyFiber}g
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Gut health</span>
        </div>
      </div>

      {/* Row 1: Macronutrient Distribution & Calories by Meal Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Macronutrient Distribution Bars */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Macronutrient Distribution</h2>
            <p className="text-xs text-slate-400">Total accumulated grams across all recorded meals</p>
          </div>

          <NutritionMacroBars
            protein={macros.protein}
            carbs={macros.carbohydrates}
            fat={macros.fat}
            fiber={macros.fiber}
          />
        </div>

        {/* Calories by Meal Type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Calories by Meal Type</h2>
            <p className="text-xs text-slate-400">Where you consume the majority of your daily calories</p>
          </div>

          <CaloriesByMealTypeChart data={nutritionData?.byMealType || []} />
        </div>
      </div>

      {/* Row 2: Homemade vs Restaurant Nutritional Head-to-Head */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Homemade vs Restaurant Meal Comparison</h2>
            <p className="text-xs text-slate-400">
              Direct comparison of nutrient density, fat content, and calories between cooking and eating out
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
            $group by foodCategory
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Homemade Column */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Apple className="w-4 h-4" /> Homemade Meals ({homemadeMeals.length})
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Avg Cost: ~₹{Math.round(homemadeMeals.reduce((a, b) => a + b.expense, 0) / Math.max(1, homemadeMeals.length))}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Avg Cals</span>
                <span className="font-bold text-white">{avgHomemadeCal} kcal</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Protein</span>
                <span className="font-bold text-emerald-400">{avgHomemadeProt}g</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Fat</span>
                <span className="font-bold text-rose-400">{avgHomemadeFat}g</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Fiber</span>
                <span className="font-bold text-amber-300">{avgHomemadeFiber}g</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              ✅ <strong>Hostel Cooking Advantage:</strong> Noticeably higher dietary fiber ({avgHomemadeFiber}g vs {avgRestFiber}g) and controlled cooking oil fat ({avgHomemadeFat}g vs {avgRestFat}g) at roughly 1/3rd of the cost.
            </p>
          </div>

          {/* Restaurant Column */}
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-4 h-4" /> Restaurant &amp; Canteen ({restaurantMeals.length})
              </span>
              <span className="text-xs font-semibold text-slate-300">
                Avg Cost: ~₹{Math.round(restaurantMeals.reduce((a, b) => a + b.expense, 0) / Math.max(1, restaurantMeals.length))}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Avg Cals</span>
                <span className="font-bold text-white">{avgRestCal} kcal</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Protein</span>
                <span className="font-bold text-emerald-400">{avgRestProt}g</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Fat</span>
                <span className="font-bold text-rose-400">{avgRestFat}g</span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Fiber</span>
                <span className="font-bold text-amber-300">{avgRestFiber}g</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              ⚠️ <strong>Canteen Observation:</strong> Restaurant meals are energy dense ({avgRestCal} kcal) with {avgRestFat}g average fat from deep-frying or butter gravies, contributing disproportionately to spending spikes.
            </p>
          </div>
        </div>
      </div>

      {/* Row 3: Scatter Plot - Calories vs Expense (Cost Efficiency) & Top Ingredients */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Scatter Plot */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Scatter Plot: Calories vs Meal Expense</h2>
              <p className="text-xs text-slate-400">
                Hover over data points to check cost-efficiency (Calories per Rupee)
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
              Scatter Plot
            </span>
          </div>

          <CaloriesVsExpenseScatter meals={meals} />
        </div>

        {/* Top Frequently Logged Ingredients (from $unwind pipeline) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white">Top Logged Ingredients</h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                $unwind: &apos;$ingredients&apos;
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Most recurring staples in your diet, extracted via MongoDB pipeline:
            </p>

            <div className="space-y-2">
              {(nutritionData?.topIngredients || []).slice(0, 7).map((ing, i) => (
                <div
                  key={ing._id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold">
                      {i + 1}
                    </span>
                    <span className="capitalize font-semibold text-slate-200">{ing._id}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400">{ing.count}</span>{' '}
                    <span className="text-[10px] text-slate-500">{ing.count === 1 ? 'meal' : 'meals'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic mt-3">
            *Aggregated from MongoDB array fields using the official aggregation framework.
          </p>
        </div>
      </div>
    </div>
  );
};
