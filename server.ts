import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbManager, MealDoc } from './server/db.js';
import { sampleMeals, sampleBudgets, DEFAULT_USER_ID } from './server/seedData.js';
import { generateAIMealSuggestions } from './server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Database (Atlas or fallback In-Memory) and seed default data if empty
async function initBackend() {
  await dbManager.init();
  
  // Seed initial sample data if storage is empty
  const existingMeals = await dbManager.getAllMeals({ userId: DEFAULT_USER_ID });
  if (existingMeals.length === 0) {
    console.log('🌱 Seeding initial 24 college student meal records and budget...');
    await dbManager.seedData(sampleMeals, sampleBudgets);
  }
}

// ==========================================
// REST API ROUTES
// ==========================================

// --- Database Status & Demo Info ---
app.get('/api/db/status', (req: Request, res: Response) => {
  const status = dbManager.getStatus();
  res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString(),
  });
});

// Seed or reset sample data
app.post('/api/db/seed', async (req: Request, res: Response) => {
  try {
    const result = await dbManager.seedData(sampleMeals, sampleBudgets);
    res.json({
      success: true,
      message: `Database successfully seeded with ${result.count} realistic college meal records in INR.`,
      storage: result.storage,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Meals CRUD ---

// GET /api/meals with comprehensive filtering & sorting
app.get('/api/meals', async (req: Request, res: Response) => {
  try {
    const {
      userId = DEFAULT_USER_ID,
      startDate,
      endDate,
      foodCategory,
      mealType,
      minExpense,
      maxExpense,
      minCal,
      maxCal,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = '1',
      limit = '50',
    } = req.query;

    const meals = await dbManager.getAllMeals({
      userId: String(userId),
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      foodCategory: foodCategory ? String(foodCategory) : undefined,
      mealType: mealType ? String(mealType) : undefined,
      minExpense: minExpense ? Number(minExpense) : undefined,
      maxExpense: maxExpense ? Number(maxExpense) : undefined,
      minCal: minCal ? Number(minCal) : undefined,
      maxCal: maxCal ? Number(maxCal) : undefined,
      search: search ? String(search) : undefined,
      sortBy: String(sortBy),
      sortOrder: (sortOrder === 'asc' ? 'asc' : 'desc'),
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const totalRecords = meals.length;
    const paginated = meals.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      success: true,
      data: paginated,
      pagination: {
        total: totalRecords,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/meals/:id
app.get('/api/meals/:id', async (req: Request, res: Response) => {
  try {
    const meal = await dbManager.getMealById(req.params.id);
    if (!meal) {
      return res.status(404).json({ success: false, error: 'Meal not found' });
    }
    res.json({ success: true, data: meal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/meals
app.post('/api/meals', async (req: Request, res: Response) => {
  try {
    const {
      mealName,
      date,
      mealType,
      foodCategory,
      ingredients,
      nutrition,
      expense,
      notes,
      userId = DEFAULT_USER_ID,
    } = req.body;

    // Validation
    if (!mealName || typeof mealName !== 'string' || !mealName.trim()) {
      return res.status(400).json({ success: false, error: 'Meal name is required.' });
    }
    if (!mealType || !['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({ success: false, error: 'Invalid meal type. Must be breakfast, lunch, dinner, or snack.' });
    }
    if (!foodCategory || !['homemade', 'restaurant', 'snack'].includes(foodCategory)) {
      return res.status(400).json({ success: false, error: 'Invalid category. Must be homemade, restaurant, or snack.' });
    }
    if (expense === undefined || isNaN(Number(expense)) || Number(expense) < 0) {
      return res.status(400).json({ success: false, error: 'Valid expense in INR is required.' });
    }

    const cleanIngredients = Array.isArray(ingredients)
      ? ingredients.map((i: any) => String(i).trim()).filter(Boolean)
      : typeof ingredients === 'string'
      ? ingredients.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const cleanNutrition = {
      calories: Math.max(0, Number(nutrition?.calories || 0)),
      protein: Math.max(0, Number(nutrition?.protein || 0)),
      carbohydrates: Math.max(0, Number(nutrition?.carbohydrates || 0)),
      fat: Math.max(0, Number(nutrition?.fat || 0)),
      fiber: Math.max(0, Number(nutrition?.fiber || 0)),
    };

    const newMeal = await dbManager.createMeal({
      userId,
      mealName: mealName.trim(),
      date: date || new Date().toISOString().slice(0, 10),
      mealType,
      foodCategory,
      ingredients: cleanIngredients,
      nutrition: cleanNutrition,
      expense: Number(expense),
      notes: notes ? String(notes).trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Meal recorded successfully in MongoDB.',
      data: newMeal,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/meals/:id
app.put('/api/meals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await dbManager.getMealById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Meal document not found.' });
    }

    const updates = { ...req.body };
    if (updates.expense !== undefined) updates.expense = Number(updates.expense);
    if (updates.nutrition) {
      updates.nutrition = {
        calories: Number(updates.nutrition.calories ?? existing.nutrition.calories),
        protein: Number(updates.nutrition.protein ?? existing.nutrition.protein),
        carbohydrates: Number(updates.nutrition.carbohydrates ?? existing.nutrition.carbohydrates),
        fat: Number(updates.nutrition.fat ?? existing.nutrition.fat),
        fiber: Number(updates.nutrition.fiber ?? existing.nutrition.fiber),
      };
    }
    if (typeof updates.ingredients === 'string') {
      updates.ingredients = updates.ingredients.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    const updated = await dbManager.updateMeal(id, updates);
    res.json({
      success: true,
      message: 'Meal updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/meals/:id
app.delete('/api/meals/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await dbManager.deleteMeal(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Meal not found or already deleted.' });
    }
    res.json({ success: true, message: 'Meal document removed from database.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Budgets ---

// GET /api/budgets
app.get('/api/budgets', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    let budget = await dbManager.getBudget(userId);
    if (!budget) {
      budget = await dbManager.setBudget(userId, {
        dailyBudget: 160,
        weeklyBudget: 1100,
        monthlyBudget: 4800,
      });
    }
    res.json({ success: true, data: budget });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/budgets
app.post('/api/budgets', async (req: Request, res: Response) => {
  try {
    const { dailyBudget, weeklyBudget, monthlyBudget, startDate, userId = DEFAULT_USER_ID } = req.body;
    if (isNaN(Number(dailyBudget)) || isNaN(Number(monthlyBudget))) {
      return res.status(400).json({ success: false, error: 'Valid budget figures in INR are required.' });
    }

    const updated = await dbManager.setBudget(userId, {
      dailyBudget: Number(dailyBudget),
      weeklyBudget: Number(weeklyBudget || Number(dailyBudget) * 7),
      monthlyBudget: Number(monthlyBudget),
      startDate: startDate || new Date().toISOString().slice(0, 10),
    });

    res.json({
      success: true,
      message: 'Budget parameters updated successfully.',
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- MongoDB Aggregation Framework & Analytics ---

// GET /api/analytics/summary
app.get('/api/analytics/summary', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const summary = await dbManager.getAnalyticsSummary(userId, startDate, endDate);
    res.json({ success: true, data: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/daily
app.get('/api/analytics/daily', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const daily = await dbManager.getDailyAnalytics(userId, startDate, endDate);
    res.json({ success: true, data: daily });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/categories
app.get('/api/analytics/categories', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const categories = await dbManager.getCategoryAnalytics(userId, startDate, endDate);
    res.json({ success: true, data: categories });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/nutrition
app.get('/api/analytics/nutrition', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const startDate = req.query.startDate ? String(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? String(req.query.endDate) : undefined;

    const nutrition = await dbManager.getNutritionAnalytics(userId, startDate, endDate);
    res.json({ success: true, data: nutrition });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/top-spending-days
app.get('/api/analytics/top-spending-days', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const limit = Number(req.query.limit) || 7;
    const topDays = await dbManager.getTopSpendingDays(userId, limit);
    res.json({ success: true, data: topDays });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/analytics/statistics
app.get('/api/analytics/statistics', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const dailyRecords = await dbManager.getDailyAnalytics(userId);
    const spends = dailyRecords.map((d: any) => d.totalSpend);
    const stats = dbManager.calculateStatistics(spends);

    // Calculate percentage change between latest 3 days and previous 3 days
    let periodChange = 0;
    if (spends.length >= 6) {
      const recentSum = spends.slice(-3).reduce((a: number, b: number) => a + b, 0);
      const prevSum = spends.slice(-6, -3).reduce((a: number, b: number) => a + b, 0);
      if (prevSum > 0) {
        periodChange = Math.round(((recentSum - prevSum) / prevSum) * 100);
      }
    }

    res.json({
      success: true,
      data: {
        ...stats,
        periodOverPeriodChangePercent: periodChange,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- AI Meal Suggestions ---

// POST /api/ai/meal-suggestions
app.post('/api/ai/meal-suggestions', async (req: Request, res: Response) => {
  try {
    const {
      budget = 80,
      ingredients = [],
      dietaryPreference = 'all',
      mealType = 'any',
      categoryPreference = 'any',
      targetCalories,
      userId = DEFAULT_USER_ID,
    } = req.body;

    // Fetch recent meals for context
    const recentMeals = await dbManager.getAllMeals({ userId, limit: 5 });
    const recentContext = recentMeals.map((m) => `${m.mealName} (₹${m.expense}, ${m.nutrition.calories} kcal)`).join('; ');

    const result = await generateAIMealSuggestions({
      budget: Number(budget),
      ingredients: Array.isArray(ingredients) ? ingredients : [],
      dietaryPreference,
      mealType,
      categoryPreference,
      targetCalories: targetCalories ? Number(targetCalories) : undefined,
      recentMealsContext: recentContext,
    });

    res.json({
      success: true,
      data: result.suggestions,
      isAiGenerated: result.isAiGenerated,
      note: result.note,
      disclaimer: 'Cost and nutrition figures are AI estimates for student budgeting and should not replace clinical medical advice.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/save-suggestion
app.post('/api/ai/save-suggestion', async (req: Request, res: Response) => {
  try {
    const { suggestion, userId = DEFAULT_USER_ID } = req.body;
    if (!suggestion || !suggestion.mealName) {
      return res.status(400).json({ success: false, error: 'Suggestion object required.' });
    }

    const saved = await dbManager.saveSuggestion({
      userId,
      mealName: suggestion.mealName,
      ingredients: suggestion.ingredients || [],
      estimatedCost: Number(suggestion.estimatedCost || 0),
      nutrition: suggestion.nutrition || { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 },
      instructions: suggestion.instructions || [],
      budgetExplanation: suggestion.budgetExplanation || '',
      mealType: suggestion.mealType || 'lunch',
      foodCategory: suggestion.foodCategory || 'homemade',
    });

    res.status(201).json({
      success: true,
      message: 'Suggestion saved to MongoDB collection.',
      data: saved,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/ai/saved-suggestions
app.get('/api/ai/saved-suggestions', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const suggestions = await dbManager.getSuggestions(userId);
    res.json({ success: true, data: suggestions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ai/convert-to-meal
app.post('/api/ai/convert-to-meal', async (req: Request, res: Response) => {
  try {
    const { suggestion, date, notes, userId = DEFAULT_USER_ID } = req.body;
    if (!suggestion || !suggestion.mealName) {
      return res.status(400).json({ success: false, error: 'Suggestion object is required.' });
    }

    const meal = await dbManager.createMeal({
      userId,
      mealName: suggestion.mealName,
      date: date || new Date().toISOString().slice(0, 10),
      mealType: suggestion.mealType || 'lunch',
      foodCategory: suggestion.foodCategory || 'homemade',
      ingredients: suggestion.ingredients || [],
      nutrition: suggestion.nutrition || { calories: 350, protein: 12, carbohydrates: 50, fat: 10, fiber: 5 },
      expense: Number(suggestion.estimatedCost || 50),
      notes: notes || `Converted from AI suggestion: ${suggestion.budgetExplanation || ''}`,
    });

    res.status(201).json({
      success: true,
      message: 'AI meal suggestion logged as an actual meal record!',
      data: meal,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- CSV Export ---
app.get('/api/export/csv', async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.userId || DEFAULT_USER_ID);
    const meals = await dbManager.getAllMeals({ userId, sortBy: 'date', sortOrder: 'desc' });

    let csv = 'ID,Date,Meal Name,Type,Category,Expense (INR),Calories (kcal),Protein (g),Carbs (g),Fat (g),Fiber (g),Ingredients,Notes\n';
    for (const m of meals) {
      const ingStr = `"${m.ingredients.join('; ').replace(/"/g, '""')}"`;
      const notesStr = `"${(m.notes || '').replace(/"/g, '""')}"`;
      const nameStr = `"${m.mealName.replace(/"/g, '""')}"`;
      csv += `${m._id},${m.date},${nameStr},${m.mealType},${m.foodCategory},${m.expense},${m.nutrition.calories},${m.nutrition.protein},${m.nutrition.carbohydrates},${m.nutrition.fat},${m.nutrition.fiber},${ingStr},${notesStr}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="food_expenses_and_nutrition.csv"');
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// VITE DEV MIDDLEWARE / STATIC PRODUCTION
// ==========================================

async function startServer() {
  await initBackend();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
