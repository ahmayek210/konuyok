export function selectItem(mode, usedIds = [], random = Math.random, lastId = null, intensity = null) {
  const categories = (mode?.categories || []).map(category => ({
    category, items: (category.items || []).filter(item => intensity == null || (item.intensity ?? 2) === intensity)
  })).filter(group => group.items.length);
  if (!categories.length) return { empty: true, reset: false };
  const used = new Set(usedIds);
  let available = categories.map(group => ({ ...group, items: group.items.filter(item => !used.has(item.id)) })).filter(group => group.items.length);
  const reset = !available.length;
  if (reset) {
    const total = categories.reduce((sum, group) => sum + group.items.length, 0);
    available = categories.map(group => ({ ...group, items: group.items.filter(item => total === 1 || item.id !== lastId) })).filter(group => group.items.length);
  }
  const group = available[Math.min(available.length - 1, Math.floor(random() * available.length))];
  const totalWeight = group.items.reduce((sum, item) => sum + (item.weight > 0 ? item.weight : 1), 0);
  let roll = random() * totalWeight;
  const item = group.items.find(item => (roll -= item.weight > 0 ? item.weight : 1) < 0) || group.items.at(-1);
  return { item, category: group.category, reset, resetIds: reset ? categories.flatMap(group => group.items.map(item => item.id)) : [] };
}
export function updateHistory(history, choice) {
  const resetIds = new Set(choice.resetIds || []);
  return { ...history, used: [...(history.used || []).filter(id => !resetIds.has(id) && id !== choice.item.id), choice.item.id], last: choice.item.id };
}
export function targetRotation(current, index, count, turns = 5) {
  const center = (index + 0.5) * 360 / count;
  const desired = (360 - center) % 360;
  return current + turns * 360 + ((desired - (current % 360) + 360) % 360);
}
export function personalTap(state, target, secretActive) {
  if (target !== 'kisisel') return { count: 0, action: 'normal' };
  if (secretActive) return { count: 0, action: 'normal' };
  const count = state + 1;
  return count >= 7 ? { count: 0, action: 'secret' } : { count, action: 'normal' };
}

export function intensityAvailability(mode, selected = '') {
  const available = new Set((mode?.categories || []).flatMap(category => (category.items || []).map(item => item.intensity ?? 2)));
  const changed = selected !== '' && !available.has(Number(selected));
  return { available, selected: changed ? '' : selected, changed };
}
