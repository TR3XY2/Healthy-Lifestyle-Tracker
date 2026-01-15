export function getWeekRange(offsetWeeks: number = 0) {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day + 6) % 7;

  const monday = new Date(now);

  monday.setDate(now.getDate() - diffToMonday + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);

  const to = new Date(monday);
  to.setDate(monday.getDate() + 7);
  to.setHours(0, 0, 0, 0);

  return { from: monday, to: to };
}

export function normalizeWeekData(apiData: any[], from: Date) {
  const map = new Map(apiData.map((d) => [d.date, d.steps]));

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(from);
    date.setDate(from.getDate() + i);

    const key = date.toISOString().split("T")[0];

    return {
      label: labels[i],
      value: map.get(key) ?? 0,
    };
  });
}
