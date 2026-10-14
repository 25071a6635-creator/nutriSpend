import {
  Meal,
  Budget,
  AnalyticsSummary,
  DailyAnalyticsItem,
  CategoryAnalyticsItem,
  NutritionAnalytics,
  TopSpendingDay,
  AISuggestion,
  DbStatus,
} from '../types.js';

export const api = {
  // DB status & Seeding
  async getDbStatus(): Promise<DbStatus> {
    const res = await fetch('/api/db/status');
    const json = await res.json();
    return json.data;
  },

  async seedDatabase(): Promise<{ success: boolean; message: string; storage: string }> {
    const res = await fetch('/api/db/seed', { method: 'POST' });
    return await res.json();
  },

  // Meals
  async getMeals(params?: {
    startDate?: string;
    endDate?: string;
    foodCategory?: string;
    mealType?: string;
    minExpense?: number;
    maxExpense?: number;
    minCal?: number;
    maxCal?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{ data: Meal[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'all') {
          query.append(k, String(v));
        }
      });
    }
    const res = await fetch(`/api/meals?${query.toString()}`);
    const json = await res.json();
    return { data: json.data || [], pagination: json.pagination };
  },

  async getMealById(id: string): Promise<Meal> {
    const res = await fetch(`/api/meals/${id}`);
    const json = await res.json();
    return json.data;
  },

  async createMeal(meal: Omit<Meal, '_id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<Meal> {
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meal),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create meal');
    return json.data;
  },

  async updateMeal(id: string, updates: Partial<Meal>): Promise<Meal> {
    const res = await fetch(`/api/meals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update meal');
    return json.data;
  },

  async deleteMeal(id: string): Promise<boolean> {
    const res = await fetch(`/api/meals/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete meal');
    return json.success;
  },

  // Budgets
  async getBudget(): Promise<Budget> {
    const res = await fetch('/api/budgets');
    const json = await res.json();
    return json.data;
  },

  async updateBudget(budget: { dailyBudget: number; weeklyBudget: number; monthlyBudget: number }): Promise<Budget> {
    const res = await fetch('/api/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budget),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update budget');
    return json.data;
  },

  // Analytics Aggregations
  async getSummary(startDate?: string, endDate?: string): Promise<AnalyticsSummary> {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    const res = await fetch(`/api/analytics/summary?${query.toString()}`);
    const json = await res.json();
    return json.data;
  },

  async getDailyAnalytics(startDate?: string, endDate?: string): Promise<DailyAnalyticsItem[]> {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    const res = await fetch(`/api/analytics/daily?${query.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  async getCategoryAnalytics(startDate?: string, endDate?: string): Promise<CategoryAnalyticsItem[]> {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    const res = await fetch(`/api/analytics/categories?${query.toString()}`);
    const json = await res.json();
    return json.data || [];
  },

  async getNutritionAnalytics(startDate?: string, endDate?: string): Promise<NutritionAnalytics> {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    const res = await fetch(`/api/analytics/nutrition?${query.toString()}`);
    const json = await res.json();
    return json.data || { byMealType: [], byCategory: [], topIngredients: [] };
  },

  async getTopSpendingDays(limit = 7): Promise<TopSpendingDay[]> {
    const res = await fetch(`/api/analytics/top-spending-days?limit=${limit}`);
    const json = await res.json();
    return json.data || [];
  },

  async getStatistics(): Promise<any> {
    const res = await fetch('/api/analytics/statistics');
    const json = await res.json();
    return json.data;
  },

  // AI Meal Suggestions
  async getAiMealSuggestions(params: {
    budget: number;
    ingredients?: string[];
    dietaryPreference?: string;
    mealType?: string;
    categoryPreference?: string;
    targetCalories?: number;
  }): Promise<{ suggestions: AISuggestion[]; isAiGenerated: boolean; note?: string; disclaimer?: string }> {
    const res = await fetch('/api/ai/meal-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to generate suggestions');
    return {
      suggestions: json.data || [],
      isAiGenerated: json.isAiGenerated,
      note: json.note,
      disclaimer: json.disclaimer,
    };
  },

  async saveSuggestion(suggestion: AISuggestion): Promise<any> {
    const res = await fetch('/api/ai/save-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion }),
    });
    const json = await res.json();
    return json.data;
  },

  async getSavedSuggestions(): Promise<AISuggestion[]> {
    const res = await fetch('/api/ai/saved-suggestions');
    const json = await res.json();
    return json.data || [];
  },

  async convertSuggestionToMeal(suggestion: AISuggestion, date?: string): Promise<Meal> {
    const res = await fetch('/api/ai/convert-to-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestion, date }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to convert suggestion to meal');
    return json.data;
  },

  exportCsvUrl(): string {
    return '/api/export/csv';
  },
};
