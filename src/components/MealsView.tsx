import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Calendar,
  Utensils,
  IndianRupee,
  Flame,
  LayoutGrid,
  List,
  AlertCircle,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Meal } from '../types.js';

interface MealsViewProps {
  meals: Meal[];
  onAddMeal: (meal: Omit<Meal, '_id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  onUpdateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
  onDeleteMeal: (id: string) => Promise<void>;
  onRefresh: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const MealsView: React.FC<MealsViewProps> = ({
  meals,
  onAddMeal,
  onUpdateMeal,
  onDeleteMeal,
  onRefresh,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Edit / Delete states
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [deletingMealId, setDeletingMealId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    mealName: '',
    date: new Date().toISOString().slice(0, 10),
    mealType: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    foodCategory: 'homemade' as 'homemade' | 'restaurant' | 'snack',
    ingredients: '',
    calories: 400,
    protein: 15,
    carbohydrates: 60,
    fat: 10,
    fiber: 6,
    expense: 50,
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Add modal with fresh defaults
  const handleOpenAdd = () => {
    setFormData({
      mealName: '',
      date: new Date().toISOString().slice(0, 10),
      mealType: 'lunch',
      foodCategory: 'homemade',
      ingredients: '',
      calories: 400,
      protein: 15,
      carbohydrates: 60,
      fat: 10,
      fiber: 6,
      expense: 50,
      notes: '',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setFormData({
      mealName: meal.mealName,
      date: meal.date,
      mealType: meal.mealType,
      foodCategory: meal.foodCategory,
      ingredients: meal.ingredients.join(', '),
      calories: meal.nutrition.calories,
      protein: meal.nutrition.protein,
      carbohydrates: meal.nutrition.carbohydrates,
      fat: meal.nutrition.fat,
      fiber: meal.nutrition.fiber,
      expense: meal.expense,
      notes: meal.notes || '',
    });
    setFormError(null);
  };

  // Submit Add or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mealName.trim()) {
      setFormError('Please provide a meal name.');
      return;
    }
    if (isNaN(Number(formData.expense)) || Number(formData.expense) < 0) {
      setFormError('Please enter a valid expense in INR.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const ingList = formData.ingredients
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const nutritionPayload = {
      calories: Number(formData.calories) || 0,
      protein: Number(formData.protein) || 0,
      carbohydrates: Number(formData.carbohydrates) || 0,
      fat: Number(formData.fat) || 0,
      fiber: Number(formData.fiber) || 0,
    };

    try {
      if (editingMeal) {
        await onUpdateMeal(editingMeal._id, {
          mealName: formData.mealName.trim(),
          date: formData.date,
          mealType: formData.mealType,
          foodCategory: formData.foodCategory,
          ingredients: ingList,
          nutrition: nutritionPayload,
          expense: Number(formData.expense),
          notes: formData.notes.trim(),
        });
        setEditingMeal(null);
      } else {
        await onAddMeal({
          mealName: formData.mealName.trim(),
          date: formData.date,
          mealType: formData.mealType,
          foodCategory: formData.foodCategory,
          ingredients: ingList,
          nutrition: nutritionPayload,
          expense: Number(formData.expense),
          notes: formData.notes.trim(),
        });
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingMealId) return;
    try {
      await onDeleteMeal(deletingMealId);
      setDeletingMealId(null);
    } catch (err: any) {
      alert('Failed to delete meal: ' + err.message);
    }
  };

  // Filtered & Sorted Meals
  const filteredMeals = meals
    .filter((m) => {
      if (selectedCategory !== 'all' && m.foodCategory !== selectedCategory) return false;
      if (selectedMealType !== 'all' && m.mealType !== selectedMealType) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = m.mealName.toLowerCase().includes(q);
        const matchesIng = m.ingredients.some((ing) => ing.toLowerCase().includes(q));
        const matchesNotes = m.notes?.toLowerCase().includes(q);
        return matchesName || matchesIng || matchesNotes;
      }
      return true;
    })
    .sort((a: any, b: any) => {
      let va = a[sortBy];
      let vb = b[sortBy];
      if (sortBy === 'calories') {
        va = a.nutrition.calories;
        vb = b.nutrition.calories;
      }
      if (sortBy === 'protein') {
        va = a.nutrition.protein;
        vb = b.nutrition.protein;
      }
      if (va < vb) return sortOrder === 'asc' ? -1 : 1;
      if (va > vb) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Calculate quick summary metrics for current filtered view
  const filteredSpend = filteredMeals.reduce((acc, m) => acc + m.expense, 0);
  const filteredCalories = filteredMeals.reduce((acc, m) => acc + m.nutrition.calories, 0);

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Meal Records & Expense Log</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full CRUD management with MongoDB document validation and real-time nutritional tracking.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Record New Meal</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by meal name, ingredients (e.g. oats, eggs)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="homemade">Homemade Only</option>
              <option value="restaurant">Restaurant / Canteen</option>
              <option value="snack">Snacks Only</option>
            </select>
          </div>

          {/* Meal Type Filter */}
          <div>
            <select
              value={selectedMealType}
              onChange={(e) => setSelectedMealType(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Meal Types</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center space-x-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="date">Sort: Date</option>
              <option value="expense">Sort: Expense (₹)</option>
              <option value="calories">Sort: Calories</option>
              <option value="protein">Sort: Protein</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 hover:text-white"
              title={`Sorting ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* View Toggle & Filter Stats Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>
              Showing <strong className="text-white">{filteredMeals.length}</strong> of {meals.length} meals
            </span>
            <span className="hidden sm:inline">
              Filtered Spend: <strong className="text-emerald-400">₹{filteredSpend}</strong>
            </span>
            <span className="hidden sm:inline">
              Total Cals: <strong className="text-amber-400">{filteredCalories} kcal</strong>
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md ${
                viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Meals Table / Grid */}
      {filteredMeals.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Utensils className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-white">No meals match your filter criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting different categories, or record a new meal.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition"
          >
            Record a Meal Now
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Meal Details</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Calories</th>
                  <th className="py-3 px-3">Macros (P / C / F)</th>
                  <th className="py-3 px-4 text-right">Expense</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredMeals.map((meal) => (
                  <tr key={meal._id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{meal.mealName}</div>
                      {meal.ingredients.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {meal.ingredients.slice(0, 3).map((ing, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400"
                            >
                              {ing}
                            </span>
                          ))}
                          {meal.ingredients.length > 3 && (
                            <span className="text-[10px] text-slate-500 self-center">
                              +{meal.ingredients.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                      {meal.notes && (
                        <p className="text-[10px] text-slate-400 mt-0.5 italic">{meal.notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-400">{meal.date}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                        {meal.mealType}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          meal.foodCategory === 'homemade'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : meal.foodCategory === 'restaurant'
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}
                      >
                        {meal.foodCategory}
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-amber-400">
                      {meal.nutrition.calories} kcal
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-400">
                      <span className="text-emerald-400 font-medium">{meal.nutrition.protein}g</span> /{' '}
                      <span className="text-sky-400">{meal.nutrition.carbohydrates}g</span> /{' '}
                      <span className="text-rose-400">{meal.nutrition.fat}g</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-white text-sm">
                      ₹{meal.expense}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenEdit(meal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="Edit Meal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMealId(meal._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                          title="Delete Meal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMeals.map((meal) => (
            <div
              key={meal._id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white line-clamp-1">{meal.mealName}</h3>
                  <span className="text-sm font-bold text-emerald-400 shrink-0">₹{meal.expense}</span>
                </div>

                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
                  <span>{meal.date}</span>
                  <span>•</span>
                  <span className="capitalize">{meal.mealType}</span>
                  <span>•</span>
                  <span
                    className={`capitalize font-medium ${
                      meal.foodCategory === 'homemade'
                        ? 'text-emerald-400'
                        : meal.foodCategory === 'restaurant'
                        ? 'text-rose-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {meal.foodCategory}
                  </span>
                </div>

                {/* Nutrition Pills */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 py-2 bg-slate-950 rounded-xl text-center text-[10px]">
                  <div>
                    <span className="text-slate-500 block">Energy</span>
                    <span className="font-bold text-amber-400">{meal.nutrition.calories}k</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Protein</span>
                    <span className="font-bold text-emerald-400">{meal.nutrition.protein}g</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Carbs</span>
                    <span className="font-bold text-sky-400">{meal.nutrition.carbohydrates}g</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Fat</span>
                    <span className="font-bold text-rose-400">{meal.nutrition.fat}g</span>
                  </div>
                </div>

                {/* Ingredients */}
                {meal.ingredients.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {meal.ingredients.map((ing, i) => (
                      <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {ing}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">ID: {meal._id.slice(-6)}</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(meal)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingMealId(meal._id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add or Edit Meal */}
      {(isAddModalOpen || editingMeal) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingMeal ? 'Edit Meal Record' : 'Record New Meal in MongoDB'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMeal(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Meal Name */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Meal Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masala Dosa, Dal Tadka with Roti, Boiled Eggs"
                  value={formData.mealName}
                  onChange={(e) => setFormData({ ...formData, mealName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Date & Expense */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Expense (₹ INR) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.expense}
                    onChange={(e) => setFormData({ ...formData, expense: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Meal Type & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Meal Type</label>
                  <select
                    value={formData.mealType}
                    onChange={(e) => setFormData({ ...formData, mealType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Food Category</label>
                  <select
                    value={formData.foodCategory}
                    onChange={(e) => setFormData({ ...formData, foodCategory: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="homemade">Homemade Meal</option>
                    <option value="restaurant">Restaurant / Canteen</option>
                    <option value="snack">Snack & Refreshment</option>
                  </select>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Ingredients (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rice, Yellow Dal, Ghee, Onions, Tomatoes"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Nutritional Estimates */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-300 block text-[11px] uppercase tracking-wider">
                  Nutritional Breakdown
                </span>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Calories</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-center text-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Protein (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-center text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Carbs (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.carbohydrates}
                      onChange={(e) => setFormData({ ...formData, carbohydrates: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-center text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Fat (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.fat}
                      onChange={(e) => setFormData({ ...formData, fat: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-center text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Fiber (g)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.fiber}
                      onChange={(e) => setFormData({ ...formData, fiber: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-center text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Notes / Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Cooked on hostel induction, canteen thali, post-exam treat"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Form Controls */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMeal(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingMeal ? 'Update Meal' : 'Save Meal to MongoDB'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deletingMealId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-slate-200">
            <h3 className="text-sm font-bold text-white">Delete Meal Record?</h3>
            <p className="text-xs text-slate-400 mt-2">
              Are you sure you want to delete this meal document from the database? This action cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeletingMealId(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
