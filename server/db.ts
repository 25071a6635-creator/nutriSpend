import { MongoClient, Db, ObjectId } from 'mongodb';

export interface UserDoc {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
}

export interface MealDoc {
  _id: string;
  userId: string;
  mealName: string;
  date: string; // ISO date string YYYY-MM-DD or full ISO
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodCategory: 'homemade' | 'restaurant' | 'snack';
  ingredients: string[];
  nutrition: NutritionInfo;
  expense: number; // in INR
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDoc {
  _id: string;
  userId: string;
  dailyBudget: number; // INR
  weeklyBudget: number; // INR
  monthlyBudget: number; // INR
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealSuggestionDoc {
  _id: string;
  userId: string;
  mealName: string;
  ingredients: string[];
  estimatedCost: number; // INR
  nutrition: NutritionInfo;
  instructions: string[];
  budgetExplanation: string;
  mealType?: string;
  foodCategory?: string;
  createdAt: string;
}

class DatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  public isConnectedToAtlas: boolean = false;
  public connectionError: string | null = null;
  public activeDbName: string = 'food_nutrition_analyzer';

  // In-memory collections for demo mode / fallback
  private inMemoryMeals: MealDoc[] = [];
  private inMemoryBudgets: BudgetDoc[] = [];
  private inMemorySuggestions: MealSuggestionDoc[] = [];
  private inMemoryUsers: UserDoc[] = [];

  constructor() {
    this.inMemoryUsers = [
      {
        _id: 'user_student_demo',
        name: 'Aarav Sharma',
        email: 'aarav.student@college.edu',
        createdAt: new Date(),
      },
    ];
  }

  async init() {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.includes('<username>') || uri.includes('<password>')) {
      this.isConnectedToAtlas = false;
      this.connectionError = 'No valid MONGODB_URI configured in environment variables. Running in MongoDB In-Memory Demo Mode.';
      console.log('⚡ [DB]', this.connectionError);
      return;
    }

    try {
      console.log('🔄 [DB] Connecting to MongoDB Atlas...');
      this.client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 5000,
      });
      await this.client.connect();
      this.db = this.client.db(this.activeDbName);
      
      // Ping to verify
      await this.db.command({ ping: 1 });
      this.isConnectedToAtlas = true;
      this.connectionError = null;
      console.log('✅ [DB] Successfully connected to MongoDB Atlas database:', this.activeDbName);

      // Create indexes
      await this.db.collection('meals').createIndex({ userId: 1, date: -1 });
      await this.db.collection('meals').createIndex({ foodCategory: 1 });
      await this.db.collection('meals').createIndex({ mealType: 1 });
      await this.db.collection('budgets').createIndex({ userId: 1 });
    } catch (err: any) {
      this.isConnectedToAtlas = false;
      this.connectionError = err.message || 'Connection failed to MongoDB Atlas';
      console.warn('⚠️ [DB] MongoDB Atlas connection failed, falling back to In-Memory Store:', this.connectionError);
    }
  }

  getStatus() {
    return {
      connectedToAtlas: this.isConnectedToAtlas,
      connectionError: this.connectionError,
      databaseName: this.activeDbName,
      mode: this.isConnectedToAtlas ? 'MongoDB Atlas (Live Database)' : 'MongoDB In-Memory Engine (Demo Mode)',
      counts: {
        meals: this.isConnectedToAtlas ? null : this.inMemoryMeals.length,
        budgets: this.isConnectedToAtlas ? null : this.inMemoryBudgets.length,
        suggestions: this.isConnectedToAtlas ? null : this.inMemorySuggestions.length,
      },
    };
  }

  // --- Meals CRUD & Aggregation ---

  async getAllMeals(filter: {
    userId?: string;
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
    limit?: number;
  }): Promise<MealDoc[]> {
    if (this.isConnectedToAtlas && this.db) {
      const query: any = {};
      if (filter.userId) query.userId = filter.userId;
      if (filter.startDate || filter.endDate) {
        query.date = {};
        if (filter.startDate) query.date.$gte = filter.startDate;
        if (filter.endDate) query.date.$lte = filter.endDate;
      }
      if (filter.foodCategory && filter.foodCategory !== 'all') {
        query.foodCategory = filter.foodCategory;
      }
      if (filter.mealType && filter.mealType !== 'all') {
        query.mealType = filter.mealType;
      }
      if (filter.minExpense !== undefined || filter.maxExpense !== undefined) {
        query.expense = {};
        if (filter.minExpense !== undefined) query.expense.$gte = Number(filter.minExpense);
        if (filter.maxExpense !== undefined) query.expense.$lte = Number(filter.maxExpense);
      }
      if (filter.minCal !== undefined || filter.maxCal !== undefined) {
        query['nutrition.calories'] = {};
        if (filter.minCal !== undefined) query['nutrition.calories'].$gte = Number(filter.minCal);
        if (filter.maxCal !== undefined) query['nutrition.calories'].$lte = Number(filter.maxCal);
      }
      if (filter.search) {
        const regex = new RegExp(filter.search, 'i');
        query.$or = [{ mealName: regex }, { ingredients: regex }, { notes: regex }];
      }

      const sortField = filter.sortBy || 'date';
      const sortDir = filter.sortOrder === 'asc' ? 1 : -1;
      const sortObj: any = { [sortField]: sortDir };
      if (sortField !== 'createdAt') sortObj.createdAt = -1;

      let cursor = this.db.collection('meals').find(query).sort(sortObj);
      if (filter.limit) cursor = cursor.limit(filter.limit);
      return (await cursor.toArray()) as unknown as MealDoc[];
    }

    // In-memory filtering
    let results = [...this.inMemoryMeals];
    if (filter.userId) results = results.filter((m) => m.userId === filter.userId);
    if (filter.startDate) results = results.filter((m) => m.date >= filter.startDate!);
    if (filter.endDate) results = results.filter((m) => m.date <= filter.endDate!);
    if (filter.foodCategory && filter.foodCategory !== 'all') {
      results = results.filter((m) => m.foodCategory === filter.foodCategory);
    }
    if (filter.mealType && filter.mealType !== 'all') {
      results = results.filter((m) => m.mealType === filter.mealType);
    }
    if (filter.minExpense !== undefined) {
      results = results.filter((m) => m.expense >= Number(filter.minExpense));
    }
    if (filter.maxExpense !== undefined) {
      results = results.filter((m) => m.expense <= Number(filter.maxExpense));
    }
    if (filter.minCal !== undefined) {
      results = results.filter((m) => m.nutrition.calories >= Number(filter.minCal));
    }
    if (filter.maxCal !== undefined) {
      results = results.filter((m) => m.nutrition.calories <= Number(filter.maxCal));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (m) =>
          m.mealName.toLowerCase().includes(q) ||
          m.ingredients.some((ing) => ing.toLowerCase().includes(q)) ||
          (m.notes && m.notes.toLowerCase().includes(q))
      );
    }

    const sortField = filter.sortBy || 'date';
    const sortAsc = filter.sortOrder === 'asc';
    results.sort((a: any, b: any) => {
      let va = a[sortField];
      let vb = b[sortField];
      if (sortField.startsWith('nutrition.')) {
        const prop = sortField.split('.')[1];
        va = a.nutrition?.[prop];
        vb = b.nutrition?.[prop];
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    if (filter.limit) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  async getMealById(id: string): Promise<MealDoc | null> {
    if (this.isConnectedToAtlas && this.db) {
      const meal = await this.db.collection('meals').findOne({ _id: id as any });
      return meal as unknown as MealDoc | null;
    }
    return this.inMemoryMeals.find((m) => m._id === id) || null;
  }

  async createMeal(data: Omit<MealDoc, '_id' | 'createdAt' | 'updatedAt'>): Promise<MealDoc> {
    const now = new Date().toISOString();
    const doc: MealDoc = {
      _id: new ObjectId().toHexString(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    if (this.isConnectedToAtlas && this.db) {
      await this.db.collection('meals').insertOne(doc as any);
      return doc;
    }

    this.inMemoryMeals.unshift(doc);
    return doc;
  }

  async updateMeal(id: string, updates: Partial<MealDoc>): Promise<MealDoc | null> {
    const now = new Date().toISOString();
    const cleanUpdates = { ...updates, updatedAt: now };
    delete (cleanUpdates as any)._id;

    if (this.isConnectedToAtlas && this.db) {
      const res = await this.db.collection('meals').findOneAndUpdate(
        { _id: id as any },
        { $set: cleanUpdates },
        { returnDocument: 'after' }
      );
      return res as unknown as MealDoc | null;
    }

    const idx = this.inMemoryMeals.findIndex((m) => m._id === id);
    if (idx === -1) return null;
    this.inMemoryMeals[idx] = { ...this.inMemoryMeals[idx], ...cleanUpdates };
    return this.inMemoryMeals[idx];
  }

  async deleteMeal(id: string): Promise<boolean> {
    if (this.isConnectedToAtlas && this.db) {
      const res = await this.db.collection('meals').deleteOne({ _id: id as any });
      return res.deletedCount > 0;
    }
    const idx = this.inMemoryMeals.findIndex((m) => m._id === id);
    if (idx === -1) return false;
    this.inMemoryMeals.splice(idx, 1);
    return true;
  }

  // --- Budgets ---

  async getBudget(userId: string): Promise<BudgetDoc | null> {
    if (this.isConnectedToAtlas && this.db) {
      const budget = await this.db.collection('budgets').findOne({ userId });
      return budget as unknown as BudgetDoc | null;
    }
    return this.inMemoryBudgets.find((b) => b.userId === userId) || null;
  }

  async setBudget(userId: string, data: { dailyBudget: number; weeklyBudget: number; monthlyBudget: number; startDate?: string }): Promise<BudgetDoc> {
    const now = new Date().toISOString();
    const doc: BudgetDoc = {
      _id: new ObjectId().toHexString(),
      userId,
      dailyBudget: Number(data.dailyBudget),
      weeklyBudget: Number(data.weeklyBudget),
      monthlyBudget: Number(data.monthlyBudget),
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      createdAt: now,
      updatedAt: now,
    };

    if (this.isConnectedToAtlas && this.db) {
      await this.db.collection('budgets').updateOne(
        { userId },
        { $set: doc },
        { upsert: true }
      );
      return doc;
    }

    const idx = this.inMemoryBudgets.findIndex((b) => b.userId === userId);
    if (idx >= 0) {
      this.inMemoryBudgets[idx] = doc;
    } else {
      this.inMemoryBudgets.push(doc);
    }
    return doc;
  }

  // --- AI Suggestions ---

  async saveSuggestion(data: Omit<MealSuggestionDoc, '_id' | 'createdAt'>): Promise<MealSuggestionDoc> {
    const doc: MealSuggestionDoc = {
      _id: new ObjectId().toHexString(),
      ...data,
      createdAt: new Date().toISOString(),
    };

    if (this.isConnectedToAtlas && this.db) {
      await this.db.collection('meal_suggestions').insertOne(doc as any);
      return doc;
    }

    this.inMemorySuggestions.unshift(doc);
    return doc;
  }

  async getSuggestions(userId: string): Promise<MealSuggestionDoc[]> {
    if (this.isConnectedToAtlas && this.db) {
      return (await this.db.collection('meal_suggestions').find({ userId }).sort({ createdAt: -1 }).toArray()) as unknown as MealSuggestionDoc[];
    }
    return this.inMemorySuggestions.filter((s) => s.userId === userId);
  }

  // --- Seed Database ---

  async seedData(sampleMeals: MealDoc[], defaultBudget: BudgetDoc) {
    if (this.isConnectedToAtlas && this.db) {
      await this.db.collection('meals').deleteMany({});
      await this.db.collection('budgets').deleteMany({});
      if (sampleMeals.length > 0) {
        await this.db.collection('meals').insertMany(sampleMeals as any[]);
      }
      await this.db.collection('budgets').insertOne(defaultBudget as any);
      return { success: true, count: sampleMeals.length, storage: 'MongoDB Atlas' };
    }

    this.inMemoryMeals = [...sampleMeals];
    this.inMemoryBudgets = [defaultBudget];
    return { success: true, count: sampleMeals.length, storage: 'MongoDB In-Memory' };
  }

  // --- MongoDB Aggregation Pipelines ---

  /**
   * Summary Aggregation:
   * Uses $match, $group, $facet to compute total spend, total calories, meal count,
   * category breakdown, and highest/lowest spending days.
   */
  async getAnalyticsSummary(userId: string, startDate?: string, endDate?: string) {
    const matchStage: any = { userId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    if (this.isConnectedToAtlas && this.db) {
      const pipeline = [
        { $match: matchStage },
        {
          $facet: {
            overallTotals: [
              {
                $group: {
                  _id: null,
                  totalExpenditure: { $sum: '$expense' },
                  totalCalories: { $sum: '$nutrition.calories' },
                  totalProtein: { $sum: '$nutrition.protein' },
                  totalCarbs: { $sum: '$nutrition.carbohydrates' },
                  totalFat: { $sum: '$nutrition.fat' },
                  totalFiber: { $sum: '$nutrition.fiber' },
                  mealCount: { $sum: 1 },
                  avgExpensePerMeal: { $avg: '$expense' },
                  minMealExpense: { $min: '$expense' },
                  maxMealExpense: { $max: '$expense' },
                },
              },
            ],
            categoryTotals: [
              {
                $group: {
                  _id: '$foodCategory',
                  categorySpend: { $sum: '$expense' },
                  categoryCalories: { $sum: '$nutrition.calories' },
                  categoryCount: { $sum: 1 },
                },
              },
            ],
            mealTypeTotals: [
              {
                $group: {
                  _id: '$mealType',
                  typeSpend: { $sum: '$expense' },
                  typeCalories: { $sum: '$nutrition.calories' },
                  typeCount: { $sum: 1 },
                },
              },
            ],
            dailyGrouping: [
              {
                $group: {
                  _id: '$date',
                  dailySpend: { $sum: '$expense' },
                  dailyCalories: { $sum: '$nutrition.calories' },
                  dailyMeals: { $sum: 1 },
                },
              },
              { $sort: { dailySpend: -1 } },
            ],
          },
        },
      ];

      const [facetResult] = await this.db.collection('meals').aggregate(pipeline).toArray();
      return this.formatFacetSummary(facetResult, userId);
    }

    // In-memory aggregation engine fallback
    let matched = this.inMemoryMeals.filter((m) => m.userId === userId);
    if (startDate) matched = matched.filter((m) => m.date >= startDate);
    if (endDate) matched = matched.filter((m) => m.date <= endDate);

    return this.computeInMemorySummary(matched, userId);
  }

  /**
   * Daily Trend Pipeline:
   * Groups by date, calculates stacked spending by category, calorie intake, and meal count.
   */
  async getDailyAnalytics(userId: string, startDate?: string, endDate?: string) {
    const matchStage: any = { userId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    if (this.isConnectedToAtlas && this.db) {
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$date',
            totalSpend: { $sum: '$expense' },
            totalCalories: { $sum: '$nutrition.calories' },
            protein: { $sum: '$nutrition.protein' },
            carbs: { $sum: '$nutrition.carbohydrates' },
            fat: { $sum: '$nutrition.fat' },
            fiber: { $sum: '$nutrition.fiber' },
            mealCount: { $sum: 1 },
            homemadeSpend: {
              $sum: { $cond: [{ $eq: ['$foodCategory', 'homemade'] }, '$expense', 0] },
            },
            restaurantSpend: {
              $sum: { $cond: [{ $eq: ['$foodCategory', 'restaurant'] }, '$expense', 0] },
            },
            snackSpend: {
              $sum: { $cond: [{ $eq: ['$foodCategory', 'snack'] }, '$expense', 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            date: '$_id',
            totalSpend: 1,
            totalCalories: 1,
            protein: 1,
            carbs: 1,
            fat: 1,
            fiber: 1,
            mealCount: 1,
            homemadeSpend: 1,
            restaurantSpend: 1,
            snackSpend: 1,
          },
        },
      ];

      return await this.db.collection('meals').aggregate(pipeline).toArray();
    }

    // In-memory simulation of daily group
    let matched = this.inMemoryMeals.filter((m) => m.userId === userId);
    if (startDate) matched = matched.filter((m) => m.date >= startDate);
    if (endDate) matched = matched.filter((m) => m.date <= endDate);

    const map = new Map<string, any>();
    for (const m of matched) {
      const d = m.date;
      if (!map.has(d)) {
        map.set(d, {
          date: d,
          totalSpend: 0,
          totalCalories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          mealCount: 0,
          homemadeSpend: 0,
          restaurantSpend: 0,
          snackSpend: 0,
        });
      }
      const entry = map.get(d);
      entry.totalSpend += m.expense;
      entry.totalCalories += m.nutrition.calories;
      entry.protein += m.nutrition.protein;
      entry.carbs += m.nutrition.carbohydrates;
      entry.fat += m.nutrition.fat;
      entry.fiber += m.nutrition.fiber;
      entry.mealCount += 1;
      if (m.foodCategory === 'homemade') entry.homemadeSpend += m.expense;
      if (m.foodCategory === 'restaurant') entry.restaurantSpend += m.expense;
      if (m.foodCategory === 'snack') entry.snackSpend += m.expense;
    }

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Category breakdown pipeline:
   * Aggregates spending, calories, average meal cost by foodCategory.
   */
  async getCategoryAnalytics(userId: string, startDate?: string, endDate?: string) {
    const matchStage: any = { userId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    if (this.isConnectedToAtlas && this.db) {
      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$foodCategory',
            totalSpend: { $sum: '$expense' },
            totalCalories: { $sum: '$nutrition.calories' },
            avgCostPerMeal: { $avg: '$expense' },
            avgCaloriesPerMeal: { $avg: '$nutrition.calories' },
            mealCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpend: -1 } },
      ];
      return await this.db.collection('meals').aggregate(pipeline).toArray();
    }

    let matched = this.inMemoryMeals.filter((m) => m.userId === userId);
    if (startDate) matched = matched.filter((m) => m.date >= startDate);
    if (endDate) matched = matched.filter((m) => m.date <= endDate);

    const categories = ['homemade', 'restaurant', 'snack'];
    return categories.map((cat) => {
      const catMeals = matched.filter((m) => m.foodCategory === cat);
      const totalSpend = catMeals.reduce((acc, c) => acc + c.expense, 0);
      const totalCalories = catMeals.reduce((acc, c) => acc + c.nutrition.calories, 0);
      return {
        _id: cat,
        totalSpend,
        totalCalories,
        avgCostPerMeal: catMeals.length ? Math.round(totalSpend / catMeals.length) : 0,
        avgCaloriesPerMeal: catMeals.length ? Math.round(totalCalories / catMeals.length) : 0,
        mealCount: catMeals.length,
      };
    });
  }

  /**
   * Nutrition breakdown pipeline:
   * Aggregates macronutrients, calories by meal type, and nutrient totals.
   */
  async getNutritionAnalytics(userId: string, startDate?: string, endDate?: string) {
    const matchStage: any = { userId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = startDate;
      if (endDate) matchStage.date.$lte = endDate;
    }

    if (this.isConnectedToAtlas && this.db) {
      const pipeline = [
        { $match: matchStage },
        {
          $facet: {
            byMealType: [
              {
                $group: {
                  _id: '$mealType',
                  calories: { $sum: '$nutrition.calories' },
                  protein: { $sum: '$nutrition.protein' },
                  carbs: { $sum: '$nutrition.carbohydrates' },
                  fat: { $sum: '$nutrition.fat' },
                  fiber: { $sum: '$nutrition.fiber' },
                  count: { $sum: 1 },
                  avgCalories: { $avg: '$nutrition.calories' },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: '$foodCategory',
                  calories: { $sum: '$nutrition.calories' },
                  protein: { $sum: '$nutrition.protein' },
                  carbs: { $sum: '$nutrition.carbohydrates' },
                  fat: { $sum: '$nutrition.fat' },
                  fiber: { $sum: '$nutrition.fiber' },
                  count: { $sum: 1 },
                },
              },
            ],
            topIngredients: [
              { $unwind: '$ingredients' },
              {
                $group: {
                  _id: { $toLower: { $trim: { input: '$ingredients' } } },
                  count: { $sum: 1 },
                  associatedCalories: { $avg: '$nutrition.calories' },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ];
      const [res] = await this.db.collection('meals').aggregate(pipeline).toArray();
      return res;
    }

    // In-memory nutrition aggregation
    let matched = this.inMemoryMeals.filter((m) => m.userId === userId);
    if (startDate) matched = matched.filter((m) => m.date >= startDate);
    if (endDate) matched = matched.filter((m) => m.date <= endDate);

    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const byMealType = mealTypes.map((mt) => {
      const filtered = matched.filter((m) => m.mealType === mt);
      const calories = filtered.reduce((a, b) => a + b.nutrition.calories, 0);
      const protein = filtered.reduce((a, b) => a + b.nutrition.protein, 0);
      const carbs = filtered.reduce((a, b) => a + b.nutrition.carbohydrates, 0);
      const fat = filtered.reduce((a, b) => a + b.nutrition.fat, 0);
      const fiber = filtered.reduce((a, b) => a + b.nutrition.fiber, 0);
      return {
        _id: mt,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        count: filtered.length,
        avgCalories: filtered.length ? Math.round(calories / filtered.length) : 0,
      };
    });

    const categories = ['homemade', 'restaurant', 'snack'];
    const byCategory = categories.map((cat) => {
      const filtered = matched.filter((m) => m.foodCategory === cat);
      return {
        _id: cat,
        calories: filtered.reduce((a, b) => a + b.nutrition.calories, 0),
        protein: filtered.reduce((a, b) => a + b.nutrition.protein, 0),
        carbs: filtered.reduce((a, b) => a + b.nutrition.carbohydrates, 0),
        fat: filtered.reduce((a, b) => a + b.nutrition.fat, 0),
        fiber: filtered.reduce((a, b) => a + b.nutrition.fiber, 0),
        count: filtered.length,
      };
    });

    // Unwind ingredients
    const ingMap = new Map<string, { count: number; calSum: number }>();
    for (const m of matched) {
      for (const ing of m.ingredients) {
        const clean = ing.trim().toLowerCase();
        if (!clean) continue;
        const current = ingMap.get(clean) || { count: 0, calSum: 0 };
        current.count += 1;
        current.calSum += m.nutrition.calories;
        ingMap.set(clean, current);
      }
    }
    const topIngredients = Array.from(ingMap.entries())
      .map(([name, data]) => ({
        _id: name,
        count: data.count,
        associatedCalories: Math.round(data.calSum / data.count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { byMealType, byCategory, topIngredients };
  }

  /**
   * Top Spending Days pipeline:
   * Groups by date, calculates total spend, sorts descending, limits to top days.
   */
  async getTopSpendingDays(userId: string, limit: number = 7) {
    if (this.isConnectedToAtlas && this.db) {
      const pipeline = [
        { $match: { userId } },
        {
          $group: {
            _id: '$date',
            totalSpend: { $sum: '$expense' },
            totalCalories: { $sum: '$nutrition.calories' },
            mealCount: { $sum: 1 },
          },
        },
        { $sort: { totalSpend: -1 } },
        { $limit: limit },
        {
          $project: {
            date: '$_id',
            totalSpend: 1,
            totalCalories: 1,
            mealCount: 1,
          },
        },
      ];
      return await this.db.collection('meals').aggregate(pipeline).toArray();
    }

    const matched = this.inMemoryMeals.filter((m) => m.userId === userId);
    const dayMap = new Map<string, { totalSpend: number; totalCalories: number; mealCount: number }>();
    for (const m of matched) {
      const cur = dayMap.get(m.date) || { totalSpend: 0, totalCalories: 0, mealCount: 0 };
      cur.totalSpend += m.expense;
      cur.totalCalories += m.nutrition.calories;
      cur.mealCount += 1;
      dayMap.set(m.date, cur);
    }

    return Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, limit);
  }

  // --- Statistical Calculations ---

  calculateStatistics(dailyValues: number[]) {
    if (dailyValues.length === 0) {
      return {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        variance: 0,
        standardDeviation: 0,
        sampleCount: 0,
        explanation: 'No daily expense records available to compute statistical metrics.',
      };
    }

    const n = dailyValues.length;
    const sorted = [...dailyValues].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[n - 1];

    // Mean
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Median
    let median: number;
    if (n % 2 === 0) {
      median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    } else {
      median = sorted[Math.floor(n / 2)];
    }

    // Variance & Standard Deviation
    const sqDiffs = sorted.map((v) => Math.pow(v - mean, 2));
    const variance = sqDiffs.reduce((a, b) => a + b, 0) / (n > 1 ? n - 1 : 1);
    const standardDeviation = Math.sqrt(variance);

    // Contextual explanation for students
    let explanation = '';
    if (standardDeviation < 30) {
      explanation = 'Your daily food spending is remarkably steady, with low fluctuation around your daily average of ₹' + Math.round(mean) + '.';
    } else if (standardDeviation < 90) {
      explanation = 'Your spending shows typical college fluctuation (₹' + Math.round(standardDeviation) + ' std dev), driven by occasional canteen snacks or eating out.';
    } else {
      explanation = 'High spending variance detected (₹' + Math.round(standardDeviation) + ' std dev). Noticeable gap between low-cost cooking days and high-cost restaurant outings.';
    }

    return {
      mean: Math.round(mean * 10) / 10,
      median: Math.round(median * 10) / 10,
      min,
      max,
      variance: Math.round(variance * 10) / 10,
      standardDeviation: Math.round(standardDeviation * 10) / 10,
      sampleCount: n,
      explanation,
    };
  }

  private async formatFacetSummary(facetResult: any, userId: string) {
    const overall = facetResult.overallTotals?.[0] || {
      totalExpenditure: 0,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      mealCount: 0,
      avgExpensePerMeal: 0,
      minMealExpense: 0,
      maxMealExpense: 0,
    };

    const dailyGroup = facetResult.dailyGrouping || [];
    const dailySpendValues = dailyGroup.map((d: any) => d.dailySpend);
    const uniqueDays = dailyGroup.length || 1;

    const stats = this.calculateStatistics(dailySpendValues);
    const budget = await this.getBudget(userId);

    const dailyAvgSpend = Math.round(overall.totalExpenditure / uniqueDays);
    const dailyAvgCalories = Math.round(overall.totalCalories / uniqueDays);

    // Remaining budget calculation
    const monthlyBudget = budget?.monthlyBudget || 4500;
    const dailyBudget = budget?.dailyBudget || 150;
    const remainingMonthlyBudget = Math.max(0, monthlyBudget - overall.totalExpenditure);
    const budgetConsumedPercent = Math.min(100, Math.round((overall.totalExpenditure / monthlyBudget) * 100));

    // Estimated monthly expenditure based on current daily average
    const estimatedMonthlySpend = dailyAvgSpend * 30;

    return {
      totalExpenditure: overall.totalExpenditure,
      totalCalories: overall.totalCalories,
      totalMeals: overall.mealCount,
      uniqueDaysTracked: uniqueDays,
      averageDailySpend: dailyAvgSpend,
      averageDailyCalories: dailyAvgCalories,
      averageMealCost: Math.round(overall.avgExpensePerMeal || 0),
      budget: {
        daily: dailyBudget,
        weekly: budget?.weeklyBudget || 1050,
        monthly: monthlyBudget,
        remainingMonthlyBudget,
        budgetConsumedPercent,
        estimatedMonthlySpend,
        isOverBudget: overall.totalExpenditure > monthlyBudget,
        dailyOverBudget: dailyAvgSpend > dailyBudget,
      },
      categoryBreakdown: facetResult.categoryTotals || [],
      mealTypeBreakdown: facetResult.mealTypeTotals || [],
      topSpendingDay: dailyGroup[0] || null,
      lowestSpendingDay: dailyGroup[dailyGroup.length - 1] || null,
      macros: {
        protein: overall.totalProtein,
        carbohydrates: overall.totalCarbs,
        fat: overall.totalFat,
        fiber: overall.totalFiber,
      },
      statistics: stats,
    };
  }

  private async computeInMemorySummary(matched: MealDoc[], userId: string) {
    const totalExpenditure = matched.reduce((a, b) => a + b.expense, 0);
    const totalCalories = matched.reduce((a, b) => a + b.nutrition.calories, 0);
    const totalProtein = matched.reduce((a, b) => a + b.nutrition.protein, 0);
    const totalCarbs = matched.reduce((a, b) => a + b.nutrition.carbohydrates, 0);
    const totalFat = matched.reduce((a, b) => a + b.nutrition.fat, 0);
    const totalFiber = matched.reduce((a, b) => a + b.nutrition.fiber, 0);

    const dayMap = new Map<string, number>();
    for (const m of matched) {
      dayMap.set(m.date, (dayMap.get(m.date) || 0) + m.expense);
    }
    const dailySpendValues = Array.from(dayMap.values());
    const uniqueDays = dayMap.size || 1;

    const stats = this.calculateStatistics(dailySpendValues);
    const budget = await this.getBudget(userId);

    const dailyAvgSpend = Math.round(totalExpenditure / uniqueDays);
    const dailyAvgCalories = Math.round(totalCalories / uniqueDays);

    const monthlyBudget = budget?.monthlyBudget || 4500;
    const dailyBudget = budget?.dailyBudget || 150;
    const remainingMonthlyBudget = Math.max(0, monthlyBudget - totalExpenditure);
    const budgetConsumedPercent = Math.min(100, Math.round((totalExpenditure / monthlyBudget) * 100));
    const estimatedMonthlySpend = dailyAvgSpend * 30;

    // Categories
    const catMap = new Map<string, { spend: number; cals: number; count: number }>();
    for (const m of matched) {
      const c = catMap.get(m.foodCategory) || { spend: 0, cals: 0, count: 0 };
      c.spend += m.expense;
      c.cals += m.nutrition.calories;
      c.count += 1;
      catMap.set(m.foodCategory, c);
    }
    const categoryBreakdown = Array.from(catMap.entries()).map(([k, v]) => ({
      _id: k,
      categorySpend: v.spend,
      categoryCalories: v.cals,
      categoryCount: v.count,
    }));

    // Meal types
    const typeMap = new Map<string, { spend: number; cals: number; count: number }>();
    for (const m of matched) {
      const t = typeMap.get(m.mealType) || { spend: 0, cals: 0, count: 0 };
      t.spend += m.expense;
      t.cals += m.nutrition.calories;
      t.count += 1;
      typeMap.set(m.mealType, t);
    }
    const mealTypeBreakdown = Array.from(typeMap.entries()).map(([k, v]) => ({
      _id: k,
      typeSpend: v.spend,
      typeCalories: v.cals,
      typeCount: v.count,
    }));

    const sortedDays = Array.from(dayMap.entries())
      .map(([date, dailySpend]) => ({ _id: date, dailySpend }))
      .sort((a, b) => b.dailySpend - a.dailySpend);

    return {
      totalExpenditure,
      totalCalories,
      totalMeals: matched.length,
      uniqueDaysTracked: uniqueDays,
      averageDailySpend: dailyAvgSpend,
      averageDailyCalories: dailyAvgCalories,
      averageMealCost: matched.length ? Math.round(totalExpenditure / matched.length) : 0,
      budget: {
        daily: dailyBudget,
        weekly: budget?.weeklyBudget || 1050,
        monthly: monthlyBudget,
        remainingMonthlyBudget,
        budgetConsumedPercent,
        estimatedMonthlySpend,
        isOverBudget: totalExpenditure > monthlyBudget,
        dailyOverBudget: dailyAvgSpend > dailyBudget,
      },
      categoryBreakdown,
      mealTypeBreakdown,
      topSpendingDay: sortedDays[0] || null,
      lowestSpendingDay: sortedDays[sortedDays.length - 1] || null,
      macros: {
        protein: totalProtein,
        carbohydrates: totalCarbs,
        fat: totalFat,
        fiber: totalFiber,
      },
      statistics: stats,
    };
  }
}

export const dbManager = new DatabaseManager();
