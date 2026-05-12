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
      titleKey: "insights.startDay.title",
      messageKey: "insights.startDay.message",
      actionKey: "insights.startDay.action",
      tone: "info",
    });
  }

  if (calorieGoal > 0 && selectedHasLogs) {
    const difference = selectedTotals.calories - calorieGoal;
    const absPercent = Math.abs(difference) / calorieGoal;

    if (absPercent <= 0.1) {
      insights.push({
        id: "calorie-goal-on-track",
        titleKey: "insights.calorieOnTrack.title",
        messageKey: "insights.calorieOnTrack.message",
        params: {
          percent: Math.round(absPercent * 100),
          calories: Math.round(selectedTotals.calories),
          goal: calorieGoal,
        },
        tone: "positive",
      });
    } else if (difference > 0) {
      insights.push({
        id: "calorie-goal-over",
        titleKey: "insights.calorieOver.title",
        messageKey: "insights.calorieOver.message",
        actionKey: "insights.calorieOver.action",
        params: { diff: Math.round(difference) },
        tone: "warning",
      });
    } else {
      insights.push({
        id: "calorie-goal-under",
        titleKey: "insights.calorieUnder.title",
        messageKey: "insights.calorieUnder.message",
        actionKey: "insights.calorieUnder.action",
        params: { diff: Math.round(Math.abs(difference)) },
        tone: "info",
      });
    }
  }

  if (selectedHasLogs) {
    const proteinTarget = Math.max(70, (Math.max(calorieGoal, 1800) * 0.2) / 4);
    if (selectedTotals.protein < proteinTarget * 0.85) {
      insights.push({
        id: "protein-low",
        titleKey: "insights.proteinLow.title",
        messageKey: "insights.proteinLow.message",
        actionKey: "insights.proteinLow.action",
        params: {
          protein: selectedTotals.protein.toFixed(1),
          target: Math.round(proteinTarget),
        },
        tone: "warning",
      });
    } else {
      insights.push({
        id: "protein-good",
        titleKey: "insights.proteinGood.title",
        messageKey: "insights.proteinGood.message",
        params: { protein: selectedTotals.protein.toFixed(1) },
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
          titleKey: "insights.weeklyTrendUp.title",
          messageKey: "insights.weeklyTrendUp.message",
          params: {
            avg: Math.round(last7AverageCalories),
            percent: Math.round(Math.abs(trendDelta)),
          },
          actionKey: "insights.weeklyTrendUp.action",
          tone: "warning",
        });
      } else if (trendDown) {
        insights.push({
          id: "weekly-trend-down",
          titleKey: "insights.weeklyTrendDown.title",
          messageKey: "insights.weeklyTrendDown.message",
          params: {
            avg: Math.round(last7AverageCalories),
            percent: Math.round(Math.abs(trendDelta)),
          },
          tone: "positive",
        });
      } else {
        insights.push({
          id: "weekly-trend-stable",
          titleKey: "insights.weeklyTrendStable.title",
          messageKey: "insights.weeklyTrendStable.message",
          params: { avg: Math.round(last7AverageCalories) },
          tone: "positive",
        });
      }
    } else {
      insights.push({
        id: "weekly-baseline",
        titleKey: "insights.weeklyBaseline.title",
        messageKey: "insights.weeklyBaseline.message",
        params: { avg: Math.round(last7AverageCalories) },
        tone: "info",
      });
    }
  }

  const activeDates = new Set(totalsByDate.keys());
  const streak = getLongestCurrentStreak(activeDates, selectedDate);
  if (streak >= 7) {
    insights.push({
      id: "streak-great",
      titleKey: "insights.streakGreat.title",
      messageKey: "insights.streakGreat.message",
      params: { streak },
      tone: "positive",
    });
  } else if (streak >= 3) {
    insights.push({
      id: "streak-building",
      titleKey: "insights.streakBuilding.title",
      messageKey: "insights.streakBuilding.message",
      params: { streak },
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
        titleKey: "insights.mealBalance.title",
        messageKey: "insights.mealBalance.message",
        actionKey: "insights.mealBalance.action",
        params: { percent: Math.round(topRatio * 100), topMealType },
        tone: "info",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      id: "fallback",
      titleKey: "insights.fallback.title",
      messageKey: "insights.fallback.message",
      tone: "info",
    });
  }

  return insights.slice(0, 4);
}
