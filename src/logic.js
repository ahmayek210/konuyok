export function availableCategories(mode, usedIds = [], lastId = null) {
  const categories = (mode?.categories || []).filter(category => category.items?.length);
  const used = new Set(usedIds);
  const remaining = categories.filter(category => category.items.some(item => !used.has(item.id)));
  if (remaining.length) return remaining;
  const total = categories.reduce((sum, category) => sum + category.items.length, 0);
  return categories.filter(category => category.items.some(item => total === 1 || item.id !== lastId));
}
export function selectItem(mode, usedIds = [], random = Math.random, lastId = null) {
  const all = (mode?.categories || []).flatMap(category => category.items || []);
  const categories = availableCategories(mode, usedIds, lastId);
  if (!categories.length) return {empty:true, reset:false};
  const used = new Set(usedIds);
  const reset = all.every(item => used.has(item.id));
  const groups = categories.map(category => ({category, items:category.items.filter(item => reset ? all.length === 1 || item.id !== lastId : !used.has(item.id))})).filter(group => group.items.length);
  const group = groups[Math.min(groups.length - 1, Math.floor(random() * groups.length))];
  const total = group.items.reduce((sum,item) => sum + (Number.isFinite(item.weight) && item.weight > 0 ? item.weight : 1), 0);
  let roll = random() * total;
  const item = group.items.find(item => (roll -= Number.isFinite(item.weight) && item.weight > 0 ? item.weight : 1) < 0) || group.items.at(-1);
  return {item, category:group.category, reset, resetIds:reset ? all.map(item => item.id) : []};
}
export function updateHistory(history, choice) {
  const reset = new Set(choice.resetIds || []);
  return {...history, used:[...(history.used || []).filter(id => !reset.has(id) && id !== choice.item.id),choice.item.id],last:choice.item.id};
}
export function migratePersonalHistory(personal, secret, movedIds) {
  const moved = new Set(movedIds);
  return {...personal, used:[...new Set([...(personal.used || []), ...(secret.used || []).filter(id => moved.has(id))])]};
}
export function targetRotation(current, index, count, turns = 5) {
  const center = (index + .5) * 360 / count;
  const desired = (360 - center) % 360;
  return current + turns * 360 + ((desired - current % 360 + 360) % 360);
}
export function personalTap(count, target, secretActive) {
  if (target !== 'kisisel' || secretActive) return {count:0,action:'normal'};
  return count + 1 >= 7 ? {count:0,action:'secret'} : {count:count + 1,action:'normal'};
}
export function spinDuration(animate, prefersReducedMotion) { return animate && !prefersReducedMotion ? 2200 : 0; }
