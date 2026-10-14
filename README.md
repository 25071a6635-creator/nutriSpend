# AI Food, Nutrition and Meal Expense Analyzer
**Smart Meal Logging, Nutritional Analytics, and Gemini AI-Powered Budget Meal Suggestions for College Students**

---

## 1. Executive Summary & Objective

College and university students face a universal challenge: **eating wholesome, nutritious meals while living on a constrained daily or monthly pocket budget**. Traditional fitness apps focus exclusively on calories without factoring in grocery or canteen costs in Indian Rupees (₹), while expense managers track money without understanding macronutrients or nutritional density.

The **AI Food, Nutrition and Meal Expense Analyzer** bridges this gap as a full-stack, database-driven system that combines:
1. **Full CRUD Meal Tracking** with ingredients, macronutrients (protein, carbs, fat, fiber), and meal categories (homemade, restaurant/canteen, snacks).
2. **Flexible Budgeting in INR (₹)** with daily limits, burn rate tracking, and budget health alerts.
3. **Genuine MongoDB Aggregation Pipelines** (`$facet`, `$group`, `$unwind`, `$project`, `$cond`, `$sort`, `$limit`) calculating multi-dimensional summaries, stacked time-series, and ingredient distributions.
4. **Statistical Dispersion Analysis** (mean, median, variance, standard deviation, and right-skewness examination).
5. **Server-Side Gemini 3.8 Flash AI Integration** generating realistic budget recipes based on real pantry staples and remaining funds.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          React 19 SPA (Vite)                           │
│  - Interactive SVG Charts (Spending Trend, Macros, Category Donut)     │
│  - Full CRUD Modals & Filters (Date, Category, Price, Calorie Range)   │
│  - AI Meal Chef Generator with Custom Sliders & Pantry Tags            │
│  - Printable Report View & Live CSV Export                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST API (/api/*)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Express.js Backend Server                        │
│  - Middleware: CORS, JSON Parser, Vite Development Middleware          │
│  - Validation & Sanitization                                           │
│  - Statistical Calculations (Mean, Median, Std Dev, Variance)          │
└───────────────────────┬────────────────────────┬───────────────────────┘
                        │                        │
     @google/genai SDK  │                        │  mongodb Node Driver
     (gemini-3.8-flash) │                        │  (Native Aggregations)
                        ▼                        ▼
         ┌────────────────────────┐    ┌──────────────────────────────────┐
         │     Google Gemini      │    │         MongoDB Database         │
         │   Interactions & AI    │    │    (food_nutrition_analyzer)     │
         │      Meal Chef         │    │  - meals                         │
         │  (INR-Constrained)     │    │  - budgets                       │
         └────────────────────────┘    │  - meal_suggestions              │
                                       │  - users                         │
                                       └──────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide React icons, Motion.
- **Backend:** Node.js, Express.js (v4), TypeScript (`tsx`).
- **Database:** MongoDB Atlas via the official `mongodb` Node.js driver (with fallback in-memory replica engine if Atlas URI is omitted).
- **AI Service:** Google GenAI SDK (`@google/genai` v2.4+) utilizing `gemini-3.8-flash`.
- **Visualization:** Interactive pure SVG chart components (responsive viewboxes, tooltips, gradients).
- **Exporting:** Direct CSV streaming with RFC 4180 escaping and browser print stylesheets.

---

## 4. MongoDB Database Design & Collections

Database Name: `food_nutrition_analyzer`

### 4.1 Collection: `meals`
Stores granular meal documents with nested nutritional sub-documents and ingredient arrays.
```json
{
  "_id": "670c5b3e9a1b2c3d4e5f6a7b",
  "userId": "user_student_demo",
  "mealName": "Homemade Dal Tadka, 3 Phulkas & Jeera Rice",
  "date": "2026-10-12",
  "mealType": "lunch",
  "foodCategory": "homemade",
  "ingredients": [
    "Toor dal",
    "Whole wheat flour",
    "Basmati rice",
    "Ghee",
    "Cumin",
    "Tomatoes"
  ],
  "nutrition": {
    "calories": 530,
    "protein": 18,
    "carbohydrates": 88,
    "fat": 12,
    "fiber": 9
  },
  "expense": 50,
  "notes": "Wholesome nutritious hostel meal cooked with roommate.",
  "createdAt": "2026-10-12T07:30:00.000Z",
  "updatedAt": "2026-10-12T07:30:00.000Z"
}
```
**Indexes:**
- `{ userId: 1, date: -1 }` (compound index for fast date-range queries)
- `{ foodCategory: 1 }` (for category aggregations)
- `{ mealType: 1 }` (for meal type groupings)

### 4.2 Collection: `budgets`
Stores student budget targets.
```json
{
  "_id": "670c5b3e9a1b2c3d4e5f6a7c",
  "userId": "user_student_demo",
  "dailyBudget": 160,
  "weeklyBudget": 1100,
  "monthlyBudget": 4800,
  "startDate": "2026-09-15",
  "createdAt": "2026-09-15T00:00:00.000Z",
  "updatedAt": "2026-10-13T23:00:00.000Z"
}
```

### 4.3 Collection: `meal_suggestions`
Stores Gemini AI generated recipes saved by the student.
```json
{
  "_id": "670c5b3e9a1b2c3d4e5f6a7d",
  "userId": "user_student_demo",
  "mealName": "High-Protein Moong Dal Khichdi & Curd Bowl",
  "ingredients": ["Yellow Moong Dal", "White Rice", "Curd", "Cumin"],
  "estimatedCost": 45,
  "nutrition": {
    "calories": 420,
    "protein": 18,
    "carbohydrates": 68,
    "fat": 7,
    "fiber": 8
  },
  "instructions": [
    "Wash moong dal and rice together.",
    "Sauté cumin in 1 tsp oil.",
    "Add 2.5 cups water and cook for 3 whistles.",
    "Serve hot with a side of cold curd."
  ],
  "budgetExplanation": "Moong dal and rice bought in bulk cost under ₹30 per serving, and 100g curd costs ~₹12.",
  "createdAt": "2026-10-13T23:30:00.000Z"
}
```

---

## 5. MongoDB Aggregation Pipelines

### 5.1 Multi-Dimensional Summary Pipeline (`$facet`)
Computes overall totals, category spend, meal type distribution, and daily spend ranking in a single query:
```javascript
db.meals.aggregate([
  { $match: { userId: "user_student_demo" } },
  {
    $facet: {
      overallTotals: [
        {
          $group: {
            _id: null,
            totalExpenditure: { $sum: "$expense" },
            totalCalories: { $sum: "$nutrition.calories" },
            mealCount: { $sum: 1 },
            avgExpensePerMeal: { $avg: "$expense" }
          }
        }
      ],
      categoryTotals: [
        {
          $group: {
            _id: "$foodCategory",
            categorySpend: { $sum: "$expense" },
            categoryCalories: { $sum: "$nutrition.calories" },
            categoryCount: { $sum: 1 }
          }
        }
      ],
      mealTypeTotals: [
        {
          $group: {
            _id: "$mealType",
            typeSpend: { $sum: "$expense" },
            typeCalories: { $sum: "$nutrition.calories" }
          }
        }
      ],
      dailyGrouping: [
        {
          $group: {
            _id: "$date",
            dailySpend: { $sum: "$expense" }
          }
        },
        { $sort: { dailySpend: -1 } }
      ]
    }
  }
]);
```

### 5.2 Ingredient Unwind Pipeline (`$unwind`)
Unwinds ingredient arrays across documents to compute occurrence count and average associated meal calories:
```javascript
db.meals.aggregate([
  { $match: { userId: "user_student_demo" } },
  { $unwind: "$ingredients" },
  {
    $group: {
      _id: { $toLower: { $trim: { input: "$ingredients" } } },
      count: { $sum: 1 },
      associatedCalories: { $avg: "$nutrition.calories" }
    }
  },
  { $sort: { count: -1 } },
  { $limit: 10 }
]);
```

---

## 6. Statistical Analysis & Limitations

The application computes core statistical indicators on daily food expenditure:
1. **Mean ($\mu$):** $\frac{\sum x_i}{n}$ — Average daily expenditure.
2. **Median (50th Percentile):** Middle value of sorted daily expenditures.
3. **Variance ($s^2$):** $\frac{\sum (x_i - \mu)^2}{n - 1}$ — Dispersion of spending.
4. **Standard Deviation ($s$):** $\sqrt{s^2}$ — Typical fluctuation around the average.

### Normal Distribution Limitations in Student Budgets:
Standard financial models often assume a normal (Gaussian) distribution. In student food habits, **data is distinctly right-skewed** (positive skew):
- Baseline days consist of economical hostel cooking (₹35 to ₹65).
- Sporadic weekend restaurant meals, food deliveries, or treats introduce asymmetric outliers (₹180 to ₹250+).
- Therefore, the **Median** is highlighted as the primary measure of central tendency because it resists distortion from high-expense outlier days.

---

## 7. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/meals` | Filter, search, and paginate meals (`startDate`, `foodCategory`, `mealType`, `sortBy`) |
| `POST` | `/api/meals` | Record a new meal document with input validation |
| `GET` | `/api/meals/:id` | Retrieve single meal document |
| `PUT` | `/api/meals/:id` | Update meal fields and nutrition |
| `DELETE` | `/api/meals/:id` | Remove meal record from MongoDB |
| `GET` | `/api/budgets` | Fetch active user budget targets |
| `POST` | `/api/budgets` | Upsert daily, weekly, and monthly budget parameters |
| `GET` | `/api/analytics/summary` | Run `$facet` aggregation summary |
| `GET` | `/api/analytics/daily` | Run daily time-series aggregation pipeline |
| `GET` | `/api/analytics/categories` | Run food category aggregation pipeline |
| `GET` | `/api/analytics/nutrition` | Run macronutrient breakdown and `$unwind` ingredients pipeline |
| `GET` | `/api/analytics/statistics` | Return Mean, Median, Variance, Std Dev, and skew analysis |
| `POST` | `/api/ai/meal-suggestions` | Gemini 3.8 Flash AI generation constrained to INR budget |
| `POST` | `/api/ai/save-suggestion` | Save AI recipe to `meal_suggestions` collection |
| `POST` | `/api/ai/convert-to-meal` | Convert AI recipe into a logged meal record |
| `POST` | `/api/db/seed` | Seed database with 24 realistic college student meal records |
| `GET` | `/api/db/status` | MongoDB connection status and collection counts |
| `GET` | `/api/export/csv` | Download CSV export of all meals with full headers |

---

## 8. Installation & Setup Instructions

### Prerequisites
- Node.js 18+ or 20+
- (Optional) MongoDB Atlas Cluster or local MongoDB instance

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Configure your variables:
```env
GEMINI_API_KEY="your_gemini_api_key"
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/food_nutrition_analyzer?retryWrites=true&w=majority"
```
*(Note: If `MONGODB_URI` is omitted or left as placeholder, the app automatically runs in the built-in MongoDB In-Memory Engine).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 9. Academic Project Demonstration Highlights

When presenting this application for a university or college software engineering viva:
1. **Database Rigor:** Open the **MongoDB Explorer** tab in the app to display live collection statistics, schema indexes, and interactive copies of the aggregation queries (`$facet`, `$group`, `$unwind`).
2. **AI & Financial Engineering:** Use the **AI Meal Chef** tab to demonstrate budget constraint enforcement—show how specifying a ₹50 budget triggers Gemini 3.8 Flash to return recipes priced strictly at or below ₹50 with step-by-step cooking instructions.
3. **Data Science & Statistics:** Present the **Reports & Stats** tab to discuss why the median daily spend (₹115) offers a more representative metric for student life than the arithmetic mean due to positive skewness from occasional dining out.
4. **Resilience & Reliability:** The backend gracefully transitions between MongoDB Atlas and an in-memory replica store, ensuring zero downtime even during intermittent network interruptions.
