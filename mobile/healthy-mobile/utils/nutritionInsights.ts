import { MacroValues, MealType, NutritionInsight } from "@/types/nutrition";

type InsightEntry = {
  date: string;
  macros: MacroValues;
  mealType?: MealType;
};

type BuildInsightsInput = {
  selectedDate: string;
  calorieGoal: number;
  entries: InsightEntry[];
};

const EMPTY_MACRO: MacroValues = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fats: 0,
};

function addMacro(base: MacroValues, extra: MacroValues): MacroValues {
  return {
    calories: Number((base.calories + extra.calories).toFixed(1)),
    protein: Number((base.protein + extra.protein).toFixed(1)),
    carbs: Number((base.carbs + extra.carbs).toFixed(1)),
    fats: Number((base.fats + extra.fats).toFixed(1)),
  };
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, days: number) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateOnly(date);
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getLongestCurrentStreak(
  activeDates: Set<string>,
  selectedDate: string,
) {
  let streak = 0;
  let cursor = selectedDate;

  while (activeDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function buildSmartInsights({
  selectedDate,
  calorieGoal,
  entries,
}: BuildInsightsInput): NutritionInsight[] {
  const insights: NutritionInsight[] = [];

  const totalsByDate = new Map<string, MacroValues>();
  const mealTypeCount = new Map<MealType, number>();

  for (const entry of entries) {
    const current = totalsByDate.get(entry.date) ?? EMPTY_MACRO;
    totalsByDate.set(entry.date, addMacro(current, entry.macros));

    if (entry.mealType && entry.mealType !== "other") {
      mealTypeCount.set(
        entry.mealType,
        (mealTypeCount.get(entry.mealType) ?? 0) + 1,
      );
    }
  }

  const selectedTotals = totalsByDate.get(selectedDate) ?? EMPTY_MACRO;
  const selectedHasLogs = entries.some((entry) => entry.date === selectedDate);

  if (!selectedHasLogs) {
    insights.push({
      id: "start-day",
      title: "Start this day with one log",
      message:
        "No entries for this date yet. Add one product or meal to unlock deeper insights.",
      action: "Log your first item for this day",
      tone: "info",
    });
  }

  if (calorieGoal > 0 && selectedHasLogs) {
    const difference = selectedTotals.calories - calorieGoal;
    const absPercent = Math.abs(difference) / calorieGoal;

    if (absPercent <= 0.1) {
      insights.push({
        id: "calorie-goal-on-track",
        title: "Calories are on track",
        message: `You are within ${Math.round(absPercent * 100)}% of your daily goal (${Math.round(selectedTotals.calories)} / ${calorieGoal} kcal).`,
        tone: "positive",
      });
    } else if (difference > 0) {
      insights.push({
        id: "calorie-goal-over",
        title: "Calories above target",
        message: `You are ${Math.round(difference)} kcal above your goal. Consider a lighter dinner or snack tomorrow.`,
        action: "Aim for lower-calorie swaps in the next meal",
        tone: "warning",
      });
    } else {
      insights.push({
        id: "calorie-goal-under",
        title: "Calories below target",
        message: `You are ${Math.round(Math.abs(difference))} kcal below your goal. If this is not intentional, add a balanced meal.`,
        action: "Add a protein + carb snack",
        tone: "info",
      });
    }
  }

  if (selectedHasLogs) {
    const proteinTarget = Math.max(70, (Math.max(calorieGoal, 1800) * 0.2) / 4);
    if (selectedTotals.protein < proteinTarget * 0.85) {
      insights.push({
        id: "protein-low",
        title: "Protein is lower than ideal",
        message: `You logged ${selectedTotals.protein.toFixed(1)}g protein. A good target for your calories is about ${Math.round(proteinTarget)}g.`,
        action: "Add high-protein foods like yogurt, chicken, eggs, or beans",
        tone: "warning",
      });
    } else {
      insights.push({
        id: "protein-good",
        title: "Protein intake looks solid",
        message: `Great job: ${selectedTotals.protein.toFixed(1)}g protein logged for this day.`,
        tone: "positive",
      });
    }
  }

  const last7Days = Array.from({ length: 7 }, (_, index) =>
    addDays(selectedDate, -index),
  );
  const previous7Days = Array.from({ length: 7 }, (_, index) =>
    addDays(selectedDate, -(index + 7)),
  );
  const last7AverageCalories = average(
    last7Days.map((date) => totalsByDate.get(date)?.calories ?? 0),
  );
  const prev7AverageCalories = average(
    previous7Days.map((date) => totalsByDate.get(date)?.calories ?? 0),
  );

  if (last7AverageCalories > 0) {
    if (prev7AverageCalories > 0) {
      const trendDelta =
        ((last7AverageCalories - prev7AverageCalories) / prev7AverageCalories) *
        100;
      const trendUp = trendDelta > 8;
      const trendDown = trendDelta < -8;

      if (trendUp) {
        insights.push({
          id: "weekly-trend-up",
          title: "Weekly calories are trending up",
          message: `Last 7 days average: ${Math.round(last7AverageCalories)} kcal, which is ${Math.round(Math.abs(trendDelta))}% higher than the previous week.`,
          action: "Keep an eye on calorie-dense snacks",
          tone: "warning",
        });
      } else if (trendDown) {
        insights.push({
          id: "weekly-trend-down",
          title: "Weekly calories are trending down",
          message: `Last 7 days average: ${Math.round(last7AverageCalories)} kcal, down ${Math.round(Math.abs(trendDelta))}% from the previous week.`,
          tone: "positive",
        });
      } else {
        insights.push({
          id: "weekly-trend-stable",
          title: "Weekly calories are stable",
          message: `Your 7-day average is ${Math.round(last7AverageCalories)} kcal with only minor week-to-week variation.`,
          tone: "positive",
        });
      }
    } else {
      insights.push({
        id: "weekly-baseline",
        title: "Weekly baseline is forming",
        message: `Current 7-day average: ${Math.round(last7AverageCalories)} kcal. Keep logging daily to unlock stronger trend insights.`,
        tone: "info",
      });
    }
  }

  const activeDates = new Set(totalsByDate.keys());
  const streak = getLongestCurrentStreak(activeDates, selectedDate);
  if (streak >= 7) {
    insights.push({
      id: "streak-great",
      title: "Strong logging streak",
      message: `You have logged nutrition for ${streak} consecutive days.`,
      tone: "positive",
    });
  } else if (streak >= 3) {
    insights.push({
      id: "streak-building",
      title: "Consistency is improving",
      message: `${streak} days in a row logged. Keep this momentum to build more accurate insights.`,
      tone: "info",
    });
  }

  if (mealTypeCount.size > 0) {
    const sortedMealTypes = Array.from(mealTypeCount.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    const [topMealType, topCount] = sortedMealTypes[0];
    const totalTagged = sortedMealTypes.reduce((sum, item) => sum + item[1], 0);
    const topRatio = topCount / totalTagged;

    if (topRatio >= 0.65) {
      insights.push({
        id: "meal-balance",
        title: "Meal timing is concentrated",
        message: `${Math.round(topRatio * 100)}% of tagged entries are ${topMealType}. Try distributing calories more evenly across the day.`,
        action: "Add at least one smaller earlier meal",
        tone: "info",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "fallback",
      title: "Log more data for smart insights",
      message:
        "Add meals and products for a few days to unlock trend and consistency intelligence.",
      tone: "info",
    });
  }

  return insights.slice(0, 4);
}
