import './style.css';
import { selectItem, targetRotation } from './logic.js';
const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
let data, mode, rotation = 0, busy = false, selected = null;
const memory = {};
const colors = ['#F2DACE','#D49A9A','#AA5E7A','#F2DACE','#D49A9A','#AA5E7A'];
function readHistory(id) { try { const value = JSON.parse(localStorage.getItem('konuyok-' + id)); if (value && Array.isArray(value.used)) return value; } catch {} return memory[id] || { used: [], last: null }; }
function saveHistory(id, value) { memory[id] = value; try { localStorage.setItem('konuyok-' + id, JSON.stringify(value)); } catch {} }
function draw() {
  const wheel = $('wheel'); wheel.replaceChildren(); wheel.style.transition = 'none'; rotation = 0; wheel.style.transform = 'rotate(0deg)';
  const count = mode.categories.length, step = 2 * Math.PI / count;
  mode.categories.forEach((category, i) => {
    const start = i * step - Math.PI / 2, end = (i + 1) * step - Math.PI / 2;
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', `M 0 0 L ${150*Math.cos(start)} ${150*Math.sin(start)} A 150 150 0 ${step > Math.PI ? 1 : 0} 1 ${150*Math.cos(end)} ${150*Math.sin(end)} Z`);
    path.setAttribute('fill', colors[i % colors.length]); path.setAttribute('stroke', '#7C0E44'); path.setAttribute('stroke-width', '1.5'); wheel.append(path);
    const angle = (i + .5) * step - Math.PI / 2, label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', 99 * Math.cos(angle)); label.setAttribute('y', 99 * Math.sin(angle)); label.setAttribute('text-anchor', 'middle'); label.setAttribute('dominant-baseline', 'middle'); label.setAttribute('fill', i % colors.length === 2 || i % colors.length === 5 ? '#fff8f5' : '#550b30'); label.setAttribute('font-size', category.label.length > 12 ? '11' : '13'); label.setAttribute('font-weight', '700'); label.textContent = category.label; wheel.append(label);
  });
  const rim = document.createElementNS(svgNS, 'circle'); rim.setAttribute('r','150'); rim.setAttribute('fill','none'); rim.setAttribute('stroke','#7C0E44'); rim.setAttribute('stroke-width','4'); wheel.append(rim);
}
function setMode(next) { mode = next; selected = null; $('result').hidden = true; $('notice').textContent = ''; $('tabs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === mode.id))); draw(); }
function setBusy(value) { busy = value; $('spin').disabled = value; $('again').disabled = value; $('tabs').querySelectorAll('button').forEach(b => b.disabled = value); }
function spin() {
  if (busy) return;
  setBusy(true); $('result').hidden = true; $('copy-status').textContent = ''; $('notice').textContent = '';
  const history = readHistory(mode.id); const choice = selectItem(mode, history.used, Math.random, history.last);
  const idx = mode.categories.findIndex(c => c.id === choice.category.id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  rotation = targetRotation(rotation, idx, mode.categories.length, 4 + Math.floor(Math.random() * 3));
  $('wheel').style.transition = reduce ? 'transform 0.01s linear' : 'transform 3.7s cubic-bezier(.16,.7,.16,1)'; $('wheel').style.transform = `rotate(${rotation}deg)`;
  setTimeout(() => {
    history.used = choice.reset ? [choice.item.id] : [...history.used, choice.item.id]; history.last = choice.item.id; saveHistory(mode.id, history); selected = choice;
    $('category').textContent = choice.category.label; $('topic').textContent = choice.item.topic; $('question').textContent = choice.item.question; $('result').hidden = false;
    $('notice').textContent = choice.reset ? 'Sorular baştan karıştırıldı.' : ''; $('announcement').textContent = `Kategori: ${choice.category.label}. Konu: ${choice.item.topic}. Soru: ${choice.item.question}`; setBusy(false);
    const rect = $('result').getBoundingClientRect(); if (rect.bottom > innerHeight && !reduce) $('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, reduce ? 30 : 3750);
}
async function copy() {
  if (!selected) return; const text = `Konu: ${selected.item.topic}\nSoru: ${selected.item.question}`; let success = false;
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); success = true; } } catch {}
  if (!success) { const area = document.createElement('textarea'); area.value = text; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select(); try { success = document.execCommand('copy'); } catch {} area.remove(); }
  $('copy-status').textContent = success ? 'Kopyalandı!' : 'Kopyalanamadı, metni seçip kopyalayabilirsin.';
}
async function load() {
  $('error').hidden = true; try { const response = await fetch(`${import.meta.env.BASE_URL}questions.json`); if (!response.ok) throw Error(); const json = await response.json(); if (json.schemaVersion !== 1 || !Array.isArray(json.modes) || !json.modes.length || json.modes.some(m => !m.categories?.length || m.categories.some(c => !c.items?.length))) throw Error(); data = json; $('tabs').replaceChildren(); data.modes.forEach(m => { const b = document.createElement('button'); b.textContent = m.label; b.dataset.id = m.id; b.addEventListener('click', () => { if (!busy) setMode(m); }); $('tabs').append(b); }); $('game').hidden = false; setMode(data.modes[0]); } catch { $('game').hidden = true; $('error').hidden = false; }
}
$('spin').addEventListener('click', spin); $('again').addEventListener('click', spin); $('copy').addEventListener('click', copy); $('retry').addEventListener('click', load); load();
