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
