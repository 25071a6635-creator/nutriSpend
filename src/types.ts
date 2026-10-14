export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}

export interface Meal {
  _id: string;
  userId: string;
  mealName: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodCategory: 'homemade' | 'restaurant' | 'snack';
  ingredients: string[];
  nutrition: NutritionInfo;
  expense: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  _id: string;
  userId: string;
  dailyBudget: number;
  weeklyBudget: number;
  monthlyBudget: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsSummary {
  totalExpenditure: number;
  totalCalories: number;
  totalMeals: number;
  uniqueDaysTracked: number;
  averageDailySpend: number;
  averageDailyCalories: number;
  averageMealCost: number;
  budget: {
    daily: number;
    weekly: number;
    monthly: number;
    remainingMonthlyBudget: number;
    budgetConsumedPercent: number;
    estimatedMonthlySpend: number;
    isOverBudget: boolean;
    dailyOverBudget: boolean;
  };
  categoryBreakdown: Array<{
    _id: string;
    categorySpend: number;
    categoryCalories: number;
    categoryCount: number;
  }>;
  mealTypeBreakdown: Array<{
    _id: string;
    typeSpend: number;
    typeCalories: number;
    typeCount: number;
  }>;
  topSpendingDay: {
    _id: string;
    dailySpend: number;
  } | null;
  lowestSpendingDay: {
    _id: string;
    dailySpend: number;
  } | null;
  macros: {
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  statistics: {
    mean: number;
    median: number;
    min: number;
    max: number;
    variance: number;
    standardDeviation: number;
    sampleCount: number;
    explanation: string;
  };
}

export interface DailyAnalyticsItem {
  date: string;
  totalSpend: number;
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  mealCount: number;
  homemadeSpend: number;
  restaurantSpend: number;
  snackSpend: number;
}

export interface CategoryAnalyticsItem {
  _id: string;
  totalSpend: number;
  totalCalories: number;
  avgCostPerMeal: number;
  avgCaloriesPerMeal: number;
  mealCount: number;
}

export interface NutritionAnalytics {
  byMealType: Array<{
    _id: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    count: number;
    avgCalories: number;
  }>;
  byCategory: Array<{
    _id: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    count: number;
  }>;
  topIngredients: Array<{
    _id: string;
    count: number;
    associatedCalories: number;
  }>;
}

export interface TopSpendingDay {
  date: string;
  totalSpend: number;
  totalCalories: number;
  mealCount: number;
}

export interface AISuggestion {
  _id?: string;
  mealName: string;
  ingredients: string[];
  estimatedCost: number;
  nutrition: NutritionInfo;
  cookingTimeMinutes: number;
  instructions: string[];
  budgetExplanation: string;
  nutritionHighlights: string;
  mealType: string;
  foodCategory: string;
  createdAt?: string;
}

export interface DbStatus {
  connectedToAtlas: boolean;
  connectionError: string | null;
  databaseName: string;
  mode: string;
  counts: {
    meals: number | null;
    budgets: number | null;
    suggestions: number | null;
  };
}
