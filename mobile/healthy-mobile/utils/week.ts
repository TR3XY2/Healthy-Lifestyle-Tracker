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

export function formatWeekRange(from: Date, to: Date) {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
  };

  const start = from.toLocaleDateString("en-GB", options);

  const endDate = new Date(to);
  endDate.setDate(to.getDate() - 1);

  const end = endDate.toLocaleDateString("en-GB", options);

  return `${start} – ${end}`;
}

function toDateOnlyLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeWeekData(apiData: any[], from: Date) {
  const map = new Map(
    apiData.map((d) => [d.date, { steps: d.steps, calories: d.calories }]),
  );

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return Array.from({ length: 7 }).map((_, i) => {
    const date = new Date(from);
    date.setDate(from.getDate() + i);

    const key = toDateOnlyLocal(date);
    const day = map.get(key);

    return {
      date: key,
      label: labels[i],
      steps: day?.steps ?? 0,
      calories: day?.calories ?? 0,
      hasRecord: map.has(key),
    };
  });
}
