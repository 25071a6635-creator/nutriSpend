import React, { useState } from 'react';
import { DailyAnalyticsItem, Meal } from '../../types.js';

// --- 1. Daily Expenditure Over Time Line Chart ---
interface SpendingLineChartProps {
  data: DailyAnalyticsItem[];
  dailyBudget?: number;
}

export const SpendingLineChart: React.FC<SpendingLineChartProps> = ({ data, dailyBudget = 160 }) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500 text-xs">No daily spending data available.</div>;
  }

  const padding = { top: 25, right: 30, bottom: 40, left: 45 };
  const width = 640;
  const height = 240;

  const maxSpend = Math.max(...data.map((d) => d.totalSpend), dailyBudget * 1.25, 200);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => padding.left + (index / (data.length - 1 || 1)) * chartWidth;
  const getY = (val: number) => padding.top + chartHeight - (val / maxSpend) * chartHeight;

  // Path generator for line
  const points = data.map((d, i) => `${getX(i)},${getY(d.totalSpend)}`).join(' ');
  const areaPoints = `${getX(0)},${padding.top + chartHeight} ${points} ${getX(data.length - 1)},${padding.top + chartHeight}`;

  const budgetY = getY(dailyBudget);

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none overflow-visible">
        <defs>
          <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + chartHeight * (1 - pct);
          const val = Math.round(maxSpend * pct);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text x={padding.left - 8} y={y + 3} fill="#64748b" fontSize="10" textAnchor="end">
                ₹{val}
              </text>
            </g>
          );
        })}

        {/* Daily Budget Reference Line */}
        <line
          x1={padding.left}
          y1={budgetY}
          x2={width - padding.right}
          y2={budgetY}
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <text
          x={width - padding.right}
          y={budgetY - 5}
          fill="#f59e0b"
          fontSize="9"
          fontWeight="600"
          textAnchor="end"
        >
          Budget Limit: ₹{dailyBudget}
        </text>

        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#spendGradient)" />

        {/* Line */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const cx = getX(i);
          const cy = getY(d.totalSpend);
          const isHovered = hoverIndex === i;
          const isOver = d.totalSpend > dailyBudget;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 4}
                fill={isOver ? '#f43f5e' : '#10b981'}
                stroke="#0f172a"
                strokeWidth="2"
              />
              {/* X axis labels for subset of dates */}
              {(data.length <= 8 || i % Math.ceil(data.length / 6) === 0 || i === data.length - 1) && (
                <text
                  x={cx}
                  y={height - padding.bottom + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {d.date.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip on hover */}
      {hoverIndex !== null && data[hoverIndex] && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl text-xs text-white"
          style={{
            left: `${Math.min(85, Math.max(15, (getX(hoverIndex) / width) * 100))}%`,
            top: '15px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-emerald-400">{data[hoverIndex].date}</div>
          <div className="flex items-center justify-between space-x-3 mt-1">
            <span className="text-slate-400">Total Spent:</span>
            <span className="font-bold text-white">₹{data[hoverIndex].totalSpend}</span>
          </div>
          <div className="flex items-center justify-between space-x-3 text-[11px]">
            <span className="text-slate-400">Calories:</span>
            <span className="text-amber-400 font-medium">{data[hoverIndex].totalCalories} kcal</span>
          </div>
          <div className="flex items-center justify-between space-x-3 text-[11px]">
            <span className="text-slate-400">Meals logged:</span>
            <span className="text-slate-300">{data[hoverIndex].mealCount}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. Calories Consumed by Meal Type Bar Chart ---
interface CaloriesByMealTypeProps {
  data: Array<{
    _id: string;
    calories?: number;
    count?: number;
    typeCalories?: number;
    typeCount?: number;
    avgCalories?: number;
  }>;
}

export const CaloriesByMealTypeChart: React.FC<CaloriesByMealTypeProps> = ({ data }) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const colors: Record<string, string> = {
    breakfast: '#38bdf8', // sky
    lunch: '#34d399',     // emerald
    dinner: '#818cf8',    // indigo
    snack: '#fbbf24',     // amber
  };

  const types = ['breakfast', 'lunch', 'dinner', 'snack'];
  const fullData = types.map((t) => {
    const found = data.find((d) => d._id === t);
    return {
      type: t,
      calories: found ? (found.calories ?? found.typeCalories ?? 0) : 0,
      count: found ? (found.count ?? found.typeCount ?? 0) : 0,
    };
  });

  const maxCal = Math.max(...fullData.map((d) => d.calories), 500);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 pt-2">
        {fullData.map((item) => {
          const color = colors[item.type] || '#94a3b8';
          const heightPct = Math.max(8, Math.round((item.calories / maxCal) * 100));
          return (
            <div
              key={item.type}
              className="flex flex-col items-center group cursor-pointer"
              onMouseEnter={() => setHovered(item.type)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Value on top */}
              <span className="text-[11px] font-bold text-slate-300 mb-1">
                {item.calories} <span className="text-[9px] font-normal text-slate-500">kcal</span>
              </span>

              {/* Bar container */}
              <div className="w-full bg-slate-800/80 rounded-t-xl h-36 flex items-end p-1 overflow-hidden">
                <div
                  className="w-full rounded-t-lg transition-all duration-300 group-hover:brightness-125"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              {/* Label */}
              <div className="mt-2 text-center">
                <span className="text-xs font-semibold capitalize text-slate-300 block">
                  {item.type}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {item.count} {item.count === 1 ? 'meal' : 'meals'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 3. Stacked Bar Chart: Homemade vs Restaurant vs Snack Spending per Day ---
interface StackedSpendChartProps {
  data: DailyAnalyticsItem[];
}

export const StackedSpendChart: React.FC<StackedSpendChartProps> = ({ data }) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  if (!data || data.length === 0) {
    return <div className="h-48 flex items-center justify-center text-slate-500 text-xs">No spending data to stack.</div>;
  }

  const recent = data.slice(-10);
  const maxTotal = Math.max(...recent.map((d) => d.totalSpend), 150);

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-end space-x-4 text-[11px] text-slate-400 pb-1">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /> Homemade
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Restaurant
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" /> Snack
        </span>
      </div>

      <div className="grid grid-flow-col auto-cols-fr gap-2 h-44 items-end bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
        {recent.map((d) => {
          const homePct = (d.homemadeSpend / maxTotal) * 100;
          const restPct = (d.restaurantSpend / maxTotal) * 100;
          const snackPct = (d.snackSpend / maxTotal) * 100;

          return (
            <div
              key={d.date}
              className="flex flex-col items-center h-full justify-end group cursor-pointer relative"
              onMouseEnter={() => setHoveredDate(d.date)}
              onMouseLeave={() => setHoveredDate(null)}
            >
              {/* Stacked bar */}
              <div className="w-full max-w-[28px] flex flex-col-reverse rounded-t overflow-hidden bg-slate-800/40">
                <div style={{ height: `${homePct}%` }} className="w-full bg-emerald-400 transition-all" />
                <div style={{ height: `${restPct}%` }} className="w-full bg-rose-400 transition-all" />
                <div style={{ height: `${snackPct}%` }} className="w-full bg-amber-400 transition-all" />
              </div>

              {/* Date label */}
              <span className="text-[10px] text-slate-400 mt-1.5 whitespace-nowrap">
                {d.date.slice(5)}
              </span>

              {/* Tooltip */}
              {hoveredDate === d.date && (
                <div className="absolute bottom-full mb-2 z-30 bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl text-[11px] text-white whitespace-nowrap">
                  <div className="font-semibold text-emerald-400">{d.date}</div>
                  <div className="text-slate-300">Total: ₹{d.totalSpend}</div>
                  <div className="text-emerald-400">Homemade: ₹{d.homemadeSpend}</div>
                  <div className="text-rose-400">Restaurant: ₹{d.restaurantSpend}</div>
                  <div className="text-amber-400">Snacks: ₹{d.snackSpend}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 4. Food Spending Distribution Donut / Pie Chart ---
interface CategoryDonutChartProps {
  categories: Array<{ _id: string; totalSpend?: number; categorySpend?: number; categoryCount?: number; totalCalories?: number }>;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ categories }) => {
  const colors: Record<string, string> = {
    homemade: '#10b981', // emerald
    restaurant: '#f43f5e', // rose
    snack: '#f59e0b',     // amber
  };

  const labels: Record<string, string> = {
    homemade: 'Homemade Meals',
    restaurant: 'Restaurant / Canteen',
    snack: 'Quick Snacks & Drinks',
  };

  const total = categories.reduce((sum, c) => sum + (c.totalSpend || c.categorySpend || 0), 0) || 1;

  let currentAngle = 0;
  const radius = 42;
  const strokeWidth = 14;
  const center = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
      {/* SVG Donut */}
      <div className="relative w-36 h-36 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
          />
          {categories.map((c) => {
            const spend = c.totalSpend || c.categorySpend || 0;
            const fraction = spend / total;
            const dashLength = fraction * circumference;
            const strokeDasharray = `${dashLength} ${circumference}`;
            const strokeDashoffset = -currentAngle * circumference;
            currentAngle += fraction;

            return (
              <circle
                key={c._id}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={colors[c._id] || '#94a3b8'}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 hover:opacity-85"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-[10px] uppercase tracking-wider text-slate-400">Total</span>
          <span className="text-sm font-bold text-white">₹{total}</span>
        </div>
      </div>

      {/* Legend & Breakdown */}
      <div className="space-y-2.5 w-full max-w-xs">
        {categories.map((c) => {
          const spend = c.totalSpend || c.categorySpend || 0;
          const pct = Math.round((spend / total) * 100) || 0;
          return (
            <div key={c._id} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span
                  className="w-3 h-3 rounded-md shrink-0"
                  style={{ backgroundColor: colors[c._id] || '#94a3b8' }}
                />
                <span className="text-slate-300 font-medium">{labels[c._id] || c._id}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-white">₹{spend}</span>
                <span className="text-slate-500 text-[10px] ml-1.5">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- 5. Scatter Plot: Estimated Calories vs Meal Expense ---
interface CaloriesVsExpenseScatterProps {
  meals: Meal[];
}

export const CaloriesVsExpenseScatter: React.FC<CaloriesVsExpenseScatterProps> = ({ meals }) => {
  const [hoveredMeal, setHoveredMeal] = useState<Meal | null>(null);

  if (!meals || meals.length === 0) {
    return <div className="h-56 flex items-center justify-center text-slate-500 text-xs">No meals logged yet.</div>;
  }

  const padding = { top: 20, right: 25, bottom: 35, left: 45 };
  const width = 560;
  const height = 220;

  const maxExpense = Math.max(...meals.map((m) => m.expense), 150);
  const maxCalories = Math.max(...meals.map((m) => m.nutrition.calories), 800);

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (expense: number) => padding.left + (expense / maxExpense) * chartW;
  const getY = (cal: number) => padding.top + chartH - (cal / maxCalories) * chartH;

  const categoryColors: Record<string, string> = {
    homemade: '#10b981',
    restaurant: '#f43f5e',
    snack: '#f59e0b',
  };

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible select-none">
        {/* Y Axis Grid (Calories) */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + chartH * (1 - pct);
          const val = Math.round(maxCalories * pct);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#334155"
                strokeDasharray="2 2"
                strokeWidth="0.8"
              />
              <text x={padding.left - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end">
                {val} kcal
              </text>
            </g>
          );
        })}

        {/* X Axis Labels (Expense INR) */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const x = padding.left + chartW * pct;
          const val = Math.round(maxExpense * pct);
          return (
            <text
              key={i}
              x={x}
              y={height - padding.bottom + 16}
              fill="#64748b"
              fontSize="9"
              textAnchor="middle"
            >
              ₹{val}
            </text>
          );
        })}

        {/* Scatter Points */}
        {meals.map((m) => {
          const cx = getX(m.expense);
          const cy = getY(m.nutrition.calories);
          const isSelected = hoveredMeal?._id === m._id;
          return (
            <circle
              key={m._id}
              cx={cx}
              cy={cy}
              r={isSelected ? 6 : 4}
              fill={categoryColors[m.foodCategory] || '#94a3b8'}
              fillOpacity={0.85}
              stroke="#0f172a"
              strokeWidth="1.5"
              className="cursor-pointer transition-transform hover:scale-125"
              onMouseEnter={() => setHoveredMeal(m)}
              onMouseLeave={() => setHoveredMeal(null)}
            />
          );
        })}
      </svg>

      {/* Hover Card */}
      {hoveredMeal && (
        <div
          className="absolute z-20 pointer-events-none bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs text-white max-w-xs"
          style={{
            left: `${Math.min(80, Math.max(20, (getX(hoveredMeal.expense) / width) * 100))}%`,
            top: '10px',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-semibold text-emerald-400">{hoveredMeal.mealName}</div>
          <div className="flex justify-between text-slate-300 mt-1">
            <span>Price: ₹{hoveredMeal.expense}</span>
            <span className="text-amber-400">{hoveredMeal.nutrition.calories} kcal</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Value: {Math.round((hoveredMeal.nutrition.calories / Math.max(1, hoveredMeal.expense)) * 10) / 10} kcal per Rupee
          </div>
        </div>
      )}
    </div>
  );
};

// --- 6. Nutritional Breakdown Macro Bars ---
interface NutritionMacroBarsProps {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export const NutritionMacroBars: React.FC<NutritionMacroBarsProps> = ({
  protein,
  carbs,
  fat,
  fiber,
}) => {
  const macros = [
    { label: 'Protein', grams: protein, color: 'bg-emerald-400', target: '50-80g/day' },
    { label: 'Carbohydrates', grams: carbs, color: 'bg-sky-400', target: '200-300g/day' },
    { label: 'Healthy Fats', grams: fat, color: 'bg-rose-400', target: '40-65g/day' },
    { label: 'Dietary Fiber', grams: fiber, color: 'bg-amber-400', target: '25-35g/day' },
  ];

  const totalGrams = protein + carbs + fat + fiber || 1;

  return (
    <div className="space-y-3.5">
      {macros.map((m) => {
        const pct = Math.round((m.grams / totalGrams) * 100) || 0;
        return (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">{m.label}</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white">{m.grams}g</span>
                <span className="text-slate-500 text-[10px]">({pct}%)</span>
              </div>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
            </div>
            <div className="text-[10px] text-slate-500 text-right">Student guideline: {m.target}</div>
          </div>
        );
      })}
    </div>
  );
};
