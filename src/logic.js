export function selectItem(mode, usedIds, random = Math.random, lastId = null) {
  const all = mode.categories.flatMap(category => category.items.map(item => ({ item, category })));
  let available = all.filter(({ item }) => !usedIds.includes(item.id));
  const reset = available.length === 0;
  if (reset) { available = all.filter(({ item }) => all.length === 1 || item.id !== lastId); }
  return { ...available[Math.floor(random() * available.length)], reset };
}
export function targetRotation(current, index, count, turns = 5) {
  const center = (index + 0.5) * 360 / count;
  const desired = (360 - center) % 360;
  return current + turns * 360 + ((desired - (current % 360) + 360) % 360);
}
