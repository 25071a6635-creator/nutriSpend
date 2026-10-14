import { GoogleGenAI, Type } from '@google/genai';

export interface AIMealSuggestionRequest {
  budget: number; // in INR
  ingredients?: string[];
  dietaryPreference?: 'all' | 'vegetarian' | 'vegan' | 'high-protein' | 'egg-based' | 'gluten-free';
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
  categoryPreference?: 'homemade' | 'canteen' | 'restaurant' | 'any';
  targetCalories?: number;
  recentMealsContext?: string;
}

export interface GeneratedMealSuggestion {
  mealName: string;
  ingredients: string[];
  estimatedCost: number; // in INR
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  cookingTimeMinutes: number;
  instructions: string[];
  budgetExplanation: string;
  nutritionHighlights: string;
  mealType: string;
  foodCategory: string;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export async function generateAIMealSuggestions(
  req: AIMealSuggestionRequest
): Promise<{ suggestions: GeneratedMealSuggestion[]; isAiGenerated: boolean; note?: string }> {
  const client = getAiClient();
  const maxBudget = req.budget > 0 ? req.budget : 100;
  const targetMealType = req.mealType && req.mealType !== 'any' ? req.mealType : 'lunch or dinner';
  const preference = req.dietaryPreference && req.dietaryPreference !== 'all' ? req.dietaryPreference : 'balanced college student food';
  const pantryIngredients = req.ingredients && req.ingredients.length > 0 ? req.ingredients.join(', ') : 'common college kitchen essentials (rice, dal, eggs, onions, spices, bread, oats)';

  if (client) {
    try {
      const prompt = `You are an expert college nutrition and budget food chef specialized in practical, highly nutritious, low-cost Indian & international student meals.
The student has an available budget of ₹${maxBudget} INR for a single meal.
Desired Meal Type: ${targetMealType}.
Dietary Preference: ${preference}.
Kitchen/Pantry items available: ${pantryIngredients}.
Preference type: ${req.categoryPreference || 'homemade or quick hostel cooking'}.
${req.recentMealsContext ? `Recent meals logged by student: ${req.recentMealsContext}` : ''}
${req.targetCalories ? `Target calories around: ${req.targetCalories} kcal` : ''}

Generate 3 distinct, nutritious, delicious, and realistic student meal options strictly within or below the ₹${maxBudget} INR budget.
Prioritize cost efficiency, wholesome ingredients, high satiety, and simple hostel/student cooking methods (induction cooker, kettle, microwave, or simple 1-pot recipes).
For each meal, calculate realistic preparation cost in Indian Rupees (INR) and estimated macronutrient values.

Return your response strictly as JSON with this exact schema:
[
  {
    "mealName": "string",
    "ingredients": ["string"],
    "estimatedCost": number (in INR, must be <= ${maxBudget}),
    "nutrition": {
      "calories": number,
      "protein": number (grams),
      "carbohydrates": number (grams),
      "fat": number (grams),
      "fiber": number (grams)
    },
    "cookingTimeMinutes": number,
    "instructions": ["Step 1...", "Step 2..."],
    "budgetExplanation": "Why this meal is super economical and cost-effective for a student",
    "nutritionHighlights": "Short explanation of macronutrient balance",
    "mealType": "${req.mealType && req.mealType !== 'any' ? req.mealType : 'lunch'}",
    "foodCategory": "homemade"
  }
]`;

      const response = await client.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert budget meal planner for college students. You always provide realistic costs in Indian Rupees (INR), honest nutritional estimates, and simple step-by-step recipes. Never exceed the user budget.',
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text?.trim() || '';
      let parsed = JSON.parse(text);
      if (!Array.isArray(parsed) && parsed.suggestions) {
        parsed = parsed.suggestions;
      }
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          suggestions: parsed,
          isAiGenerated: true,
          note: 'Generated live via Gemini 3.8 Flash based on your budget and preferences.',
        };
      }
    } catch (err: any) {
      console.warn('⚠️ [Gemini API] Call failed or timed out, using intelligent fallback suggestions:', err.message);
    }
  }

  // Fallback intelligent curated student suggestions when Gemini key is absent or offline
  const fallbackSuggestions: GeneratedMealSuggestion[] = getFallbackSuggestions(maxBudget, targetMealType, preference, req.ingredients);
  return {
    suggestions: fallbackSuggestions,
    isAiGenerated: false,
    note: 'Demo mode suggestions tailored to your budget (Connect Gemini API key in AI Studio Secrets for unlimited live AI generation).',
  };
}

function getFallbackSuggestions(
  budget: number,
  mealType: string,
  preference: string,
  userIngredients?: string[]
): GeneratedMealSuggestion[] {
  const options: GeneratedMealSuggestion[] = [
    {
      mealName: 'High-Protein Moong Dal Khichdi & Curd Bowl',
      ingredients: ['Yellow Moong Dal (1/2 cup)', 'White Rice (1/3 cup)', 'Onion & Cumin', 'Turmeric & Salt', 'Fresh Curd (100g)'],
      estimatedCost: Math.min(budget, 45),
      nutrition: {
        calories: 420,
        protein: 18,
        carbohydrates: 68,
        fat: 7,
        fiber: 8,
      },
      cookingTimeMinutes: 18,
      instructions: [
        'Wash moong dal and rice together in water.',
        'In a cooker or induction pot, sauté cumin seeds and chopped onion with 1 tsp oil/ghee.',
        'Add soaked dal-rice, 2.5 cups water, turmeric, and salt to taste.',
        'Cook for 3-4 whistles (or 15 mins on induction) until soft and creamy.',
        'Serve warm with a side of cold curd for complete amino acids.',
      ],
      budgetExplanation: 'Moong dal and rice bought in bulk cost under ₹30 per serving, and 100g curd costs ~₹12, making this high-protein complete meal under ₹45.',
      nutritionHighlights: 'Provides a complete complementary protein profile with gut-healthy probiotics from curd.',
      mealType: mealType === 'breakfast' ? 'breakfast' : 'dinner',
      foodCategory: 'homemade',
    },
    {
      mealName: 'Masala Egg & Veggie Scramble with Toasted Brown Bread',
      ingredients: ['3 Farm Eggs', 'Whole Wheat / Brown Bread (2 slices)', 'Chopped Tomato & Onion', 'Green Chilli & Coriander', '1 tsp Butter/Oil'],
      estimatedCost: Math.min(budget, 52),
      nutrition: {
        calories: 360,
        protein: 23,
        carbohydrates: 28,
        fat: 16,
        fiber: 4,
      },
      cookingTimeMinutes: 10,
      instructions: [
        'Finely dice onion, tomato, and green chilli.',
        'Crack 3 eggs into a bowl with salt and black pepper; whisk briskly.',
        'Heat 1 tsp oil/butter in a pan, sauté onions and tomatoes for 2 minutes.',
        'Pour beaten eggs and stir continuously on medium heat until soft curds form.',
        'Toast 2 slices of bread and serve hot.',
      ],
      budgetExplanation: '3 eggs cost approx ₹21-24, bread slices ₹8, and veggies ₹10, delivering over 20g of high biological value protein for ~₹42-52.',
      nutritionHighlights: 'Superior leucine and bioavailability for muscle maintenance and college brain focus.',
      mealType: mealType === 'dinner' ? 'dinner' : 'breakfast',
      foodCategory: 'homemade',
    },
    {
      mealName: 'Spiced Black Chana & Peanut Protein Chaat',
      ingredients: ['Boiled Black Kala Chana (1 cup)', 'Roasted Peanuts (2 tbsp)', 'Cucumber & Tomato', 'Chaat Masala & Lemon juice'],
      estimatedCost: Math.min(budget, 38),
      nutrition: {
        calories: 340,
        protein: 16,
        carbohydrates: 46,
        fat: 9,
        fiber: 11,
      },
      cookingTimeMinutes: 8,
      instructions: [
        'Boil soaked kala chana (or use pre-boiled canned/canteen chana).',
        'Toss boiled chana with diced cucumber, tomatoes, and chopped coriander.',
        'Add roasted crunchy peanuts for texture and healthy fats.',
        'Sprinkle chaat masala, rock salt, and squeeze half a fresh lemon. Mix well.',
      ],
      budgetExplanation: 'Kala chana is one of the cheapest staples in Indian grocery (under ₹20/bowl), packed with dietary fiber and sustained energy.',
      nutritionHighlights: 'Low glycemic index prevents afternoon lecture fatigue and hunger spikes.',
      mealType: mealType === 'snack' ? 'snack' : 'lunch',
      foodCategory: 'homemade',
    },
  ];

  return options;
}
