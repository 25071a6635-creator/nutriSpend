import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  IndianRupee,
  Utensils,
  Flame,
  Clock,
  BookmarkPlus,
  CheckCircle,
  PlusCircle,
  Info,
  ChefHat,
  Tag,
  AlertCircle,
  RefreshCw,
  FolderHeart,
} from 'lucide-react';
import { AISuggestion, Meal } from '../types.js';
import { api } from '../services/api.js';

interface AiSuggestionsViewProps {
  onMealAdded: () => void;
  userBudgetDaily?: number;
}

export const AiSuggestionsView: React.FC<AiSuggestionsViewProps> = ({
  onMealAdded,
  userBudgetDaily = 160,
}) => {
  // Form input state
  const [budgetVal, setBudgetVal] = useState<number>(60);
  const [mealType, setMealType] = useState<string>('lunch');
  const [dietaryPref, setDietaryPref] = useState<string>('all');
  const [categoryPref, setCategoryPref] = useState<string>('homemade');
  const [targetCals, setTargetCals] = useState<string>('450');

  // Ingredients tags
  const [ingredientInput, setIngredientInput] = useState<string>('');
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([
    'Eggs',
    'Brown Bread',
    'Yellow Moong Dal',
    'Rice',
    'Onions',
    'Peanuts',
  ]);

  // Results state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [savedSuggestions, setSavedSuggestions] = useState<AISuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'saved'>('generate');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(true);
  const [disclaimer, setDisclaimer] = useState<string>(
    'Cost and nutrition figures are AI estimates for student budgeting and should not replace clinical medical advice.'
  );

  // Status message for converting/saving
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load saved suggestions on mount
  useEffect(() => {
    loadSavedSuggestions();
  }, []);

  const loadSavedSuggestions = async () => {
    try {
      const saved = await api.getSavedSuggestions();
      setSavedSuggestions(saved);
    } catch (err) {
      console.error('Failed to load saved suggestions', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add ingredient tag
  const handleAddIngredient = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const clean = ingredientInput.trim();
    if (clean && !pantryIngredients.includes(clean)) {
      setPantryIngredients([...pantryIngredients, clean]);
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (ing: string) => {
    setPantryIngredients(pantryIngredients.filter((i) => i !== ing));
  };

  // Generate suggestions via Gemini API
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setAiNote(null);

    try {
      const res = await api.getAiMealSuggestions({
        budget: budgetVal,
        ingredients: pantryIngredients,
        dietaryPreference: dietaryPref,
        mealType: mealType,
        categoryPreference: categoryPref,
        targetCalories: targetCals ? Number(targetCals) : undefined,
      });

      setSuggestions(res.suggestions);
      setIsAiGenerated(res.isAiGenerated);
      if (res.note) setAiNote(res.note);
      if (res.disclaimer) setDisclaimer(res.disclaimer);
      setActiveTab('generate');
    } catch (err: any) {
      alert('Failed to generate suggestions: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save suggestion to MongoDB collection
  const handleSaveToMongo = async (item: AISuggestion) => {
    try {
      await api.saveSuggestion(item);
      await loadSavedSuggestions();
      showToast(`Saved "${item.mealName}" to your MongoDB meal suggestions collection!`);
    } catch (err: any) {
      alert('Failed to save suggestion: ' + err.message);
    }
  };

  // Convert suggestion to an actual logged meal document
  const handleConvertToMeal = async (item: AISuggestion) => {
    try {
      await api.convertSuggestionToMeal(item);
      onMealAdded();
      showToast(`Logged "${item.mealName}" (₹${item.estimatedCost}) to your meals history!`);
    } catch (err: any) {
      alert('Failed to log meal: ' + err.message);
    }
  };

  // Quick preset ingredient buttons
  const commonPresets = ['Oats', 'Milk', 'Poha', 'Paneer', 'Bananas', 'Potatoes', 'Chickpeas', 'Sattu'];

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center space-x-2 text-xs animate-bounce">
          <CheckCircle className="w-4 h-4 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white tracking-tight">AI Meal Chef & Smart Planner</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Generate affordable, high-nutrition recipes tailored strictly to your remaining student budget and pantry ingredients.
          </p>
        </div>

        {/* Tab switcher: Generate vs Saved */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'generate'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Meals</span>
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === 'saved'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Saved Suggestions ({savedSuggestions.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Form: Inputs for Gemini */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-white font-semibold text-sm">
              <ChefHat className="w-4 h-4 text-emerald-400" />
              <span>Customize Meal Parameters</span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              {/* Available Budget Slider / Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-300">Max Budget for this Meal</label>
                  <span className="font-bold text-emerald-400 text-sm">₹{budgetVal}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="250"
                  step="5"
                  value={budgetVal}
                  onChange={(e) => setBudgetVal(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>₹20 (Ultra budget)</span>
                  <span>₹100 (Canteen)</span>
                  <span>₹250 (Treat)</span>
                </div>
              </div>

              {/* Meal Type & Dietary Preference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Meal Type</label>
                  <select
                    value={mealType}
                    onChange={(e) => setMealType(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="any">Any Meal</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Diet Preference</label>
                  <select
                    value={dietaryPref}
                    onChange={(e) => setDietaryPref(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">Any / Flexitarian</option>
                    <option value="vegetarian">Vegetarian</option>
                    <option value="high-protein">High-Protein</option>
                    <option value="egg-based">Egg-based</option>
                    <option value="vegan">Vegan</option>
                  </select>
                </div>
              </div>

              {/* Target Calories */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Calories (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 400 - 600 kcal"
                  value={targetCals}
                  onChange={(e) => setTargetCals(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Pantry Ingredients Available */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Available Pantry / Fridge Items
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add ingredient (e.g. Tomato, Paneer)..."
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyDown={handleAddIngredient}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold"
                  >
                    Add
                  </button>
                </div>

                {/* Active Ingredient Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2.5 max-h-24 overflow-y-auto">
                  {pantryIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center space-x-1"
                    >
                      <span>{ing}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(ing)}
                        className="text-slate-400 hover:text-rose-400 text-xs ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                {/* Quick Add Presets */}
                <div className="mt-2 text-[10px] text-slate-400">
                  <span>Quick Add: </span>
                  {commonPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        if (!pantryIngredients.includes(p)) {
                          setPantryIngredients([...pantryIngredients, p]);
                        }
                      }}
                      className="text-emerald-400 hover:underline mr-1.5"
                    >
                      +{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini is Crafting Recipes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 stroke-[2.5]" />
                    <span>Generate 3 Budget Meals</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Section: AI Meal Cards */}
          <div className="lg:col-span-2 space-y-4">
            {aiNote && (
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center space-x-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{aiNote}</span>
              </div>
            )}

            {suggestions.length === 0 && !isLoading && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <ChefHat className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Ready to plan your next meal?</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Click the <strong>Generate 3 Budget Meals</strong> button to let Gemini AI analyze your remaining budget of ₹{budgetVal} and suggest realistic, delicious hostel-friendly recipes with full nutritional breakdowns!
                </p>
                <button
                  onClick={() => handleGenerate()}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition"
                >
                  Generate First Suggestion
                </button>
              </div>
            )}

            {isLoading && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-4">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="text-sm font-semibold text-white">
                  Consulting Gemini 3.8 Flash AI Model...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Calculating Indian Rupee grocery costs, balancing protein and carbs, and formulating simple step-by-step induction cooking instructions.
                </p>
              </div>
            )}

            {/* Generated Suggestions List */}
            {suggestions.map((meal, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 hover:border-emerald-500/40 transition"
              >
                {/* Meal Title & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Option #{index + 1}
                      </span>
                      <h3 className="text-base font-bold text-white">{meal.mealName}</h3>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {meal.cookingTimeMinutes || 15} mins
                      </span>
                      <span>•</span>
                      <span className="capitalize">{meal.mealType || 'Meal'}</span>
                    </div>
                  </div>

                  {/* Price Badge */}
                  <div className="text-right sm:text-right shrink-0">
                    <div className="text-lg font-extrabold text-emerald-400">
                      ₹{meal.estimatedCost}
                    </div>
                    <span className="text-[10px] text-slate-400">Estimated cost</span>
                  </div>
                </div>

                {/* Macro summary pills */}
                <div className="grid grid-cols-5 gap-2 p-2.5 bg-slate-950 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Energy</span>
                    <span className="font-bold text-amber-400">{meal.nutrition?.calories} kcal</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Protein</span>
                    <span className="font-bold text-emerald-400">{meal.nutrition?.protein}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Carbs</span>
                    <span className="font-bold text-sky-400">{meal.nutrition?.carbohydrates}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fat</span>
                    <span className="font-bold text-rose-400">{meal.nutrition?.fat}g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Fiber</span>
                    <span className="font-bold text-amber-300">{meal.nutrition?.fiber}g</span>
                  </div>
                </div>

                {/* Budget Explanation */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5" />
                    <span>Why this fits your ₹{budgetVal} budget:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{meal.budgetExplanation}</p>
                </div>

                {/* Ingredients list */}
                {meal.ingredients && meal.ingredients.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Required Ingredients:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {meal.ingredients.map((ing, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step by Step Instructions */}
                {meal.instructions && meal.instructions.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Simple Instructions:
                    </span>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300 pl-1">
                      {meal.instructions.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2.5">
                  <button
                    onClick={() => handleSaveToMongo(meal)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save to Collection</span>
                  </button>

                  <button
                    onClick={() => handleConvertToMeal(meal)}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Log as Planned Meal</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Medical / Estimation Disclaimer */}
            {suggestions.length > 0 && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-slate-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  <strong>Disclaimer:</strong> {disclaimer}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Saved Suggestions View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Saved AI Meal Suggestions in MongoDB ({savedSuggestions.length})
            </h2>
            <button
              onClick={loadSavedSuggestions}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {savedSuggestions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
              No saved meal suggestions in your MongoDB collection yet. Generate recipes and click &quot;Save to Collection&quot;.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedSuggestions.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-bold text-white line-clamp-1">{item.mealName}</h3>
                      <span className="text-sm font-bold text-emerald-400">₹{item.estimatedCost}</span>
                    </div>

                    <div className="text-[11px] text-amber-400 mt-1">
                      {item.nutrition?.calories} kcal • {item.nutrition?.protein}g protein
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {item.budgetExplanation}
                    </p>

                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {item.ingredients.slice(0, 3).map((ing, i) => (
                          <span key={i} className="text-[10px] bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded">
                            {ing}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleConvertToMeal(item)}
                      className="w-full py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Log this Meal Now</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
