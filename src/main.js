import './style.css';
import {availableCategories, selectItem, updateHistory, migratePersonalHistory, targetRotation, personalTap, spinDuration} from './logic.js';
const $ = id => document.getElementById(id);
const ns = 'http://www.w3.org/2000/svg';
const colors = ['#f2c777','#ee9987','#769ba9','#a7bf94','#ac93b4'];
const memory = {};
const movedIds = ['gizli-hoslanma-001','gizli-hoslanma-004','gizli-hoslanma-005','gizli-hoslanma-006','gizli-hoslanma-007','gizli-hoslanma-010','gizli-hoslanma-011','gizli-ilk-adim-002','gizli-ilk-adim-007','gizli-ilk-adim-008','gizli-ilk-adim-010'];
let data, mode, wheelCategories = [], rotation = 0, busy = false, selected = null, personalTapCount = 0;
const isSecret = () => mode?.id === data?.secretMode?.id;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function readHistory(id) {
  if (memory[id]) return memory[id];
  try { const value = JSON.parse(localStorage.getItem('konuyok-' + id)); if (Array.isArray(value?.used)) return value; } catch {}
  return {used:[],last:null};
}
function saveHistory(id, history) {
  memory[id] = history;
  try { localStorage.setItem('konuyok-' + id, JSON.stringify(history)); return true; } catch { return false; }
}
function migrateHistory() {
  try { if (localStorage.getItem('konuyok-v3-history-migrated')) return; } catch {}
  const merged = migratePersonalHistory(readHistory('kisisel'), readHistory('gizli-kisisel'), movedIds);
  if (saveHistory('kisisel', merged)) { try { localStorage.setItem('konuyok-v3-history-migrated','1'); } catch {} }
}
function orientLabels(duration) {
  $('wheel').querySelectorAll('text').forEach(label => {
    label.style.transition = `transform ${duration}ms cubic-bezier(.16,.7,.16,1)`;
    label.style.transform = `rotate(${-rotation}deg)`;
  });
}
function draw(categories) {
  wheelCategories = categories;
  const wheel = $('wheel'); wheel.replaceChildren();
  wheel.style.transition = 'none'; wheel.style.transform = `rotate(${rotation}deg)`;
  const count = categories.length;
  if (!count) return;
  const step = 2 * Math.PI / count;
  categories.forEach((category, i) => {
    const start = i * step - Math.PI/2, end = (i+1) * step - Math.PI/2;
    const path = document.createElementNS(ns,'path');
    if (count === 1) path.setAttribute('d','M 0 -150 A 150 150 0 1 1 0 150 A 150 150 0 1 1 0 -150 Z');
    else path.setAttribute('d',`M 0 0 L ${150*Math.cos(start)} ${150*Math.sin(start)} A 150 150 0 ${step>Math.PI?1:0} 1 ${150*Math.cos(end)} ${150*Math.sin(end)} Z`);
    path.setAttribute('fill',colors[i % colors.length]); path.setAttribute('stroke','#fffdf6'); path.setAttribute('stroke-width','2'); wheel.append(path);
    const angle=(i+.5)*step-Math.PI/2, label=document.createElementNS(ns,'text');
    label.setAttribute('x',100*Math.cos(angle)); label.setAttribute('y',100*Math.sin(angle)); label.setAttribute('text-anchor','middle'); label.setAttribute('dominant-baseline','middle'); label.setAttribute('fill','#253034'); label.setAttribute('font-size',category.label.length>12?'10':'12'); label.setAttribute('font-weight','700'); label.style.transformBox='fill-box'; label.style.transformOrigin='center'; label.textContent=category.label; wheel.append(label);
  });
  const rim=document.createElementNS(ns,'circle');rim.setAttribute('r','150');rim.setAttribute('fill','none');rim.setAttribute('stroke','#293c3e');rim.setAttribute('stroke-width','3');wheel.append(rim);
  orientLabels(0);
}
function clearResult() { selected=null; $('result').hidden=true; $('copy-status').textContent=''; $('announcement').textContent=''; }
function setMode(next) {
  const wasSecret=isSecret(); mode=next; clearResult(); $('notice').textContent=''; rotation=0;
  document.body.classList.toggle('secret-mode',isSecret());
  $('secret-banner').hidden=!isSecret();
  $('tabs').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.id === (isSecret()?'kisisel':mode.id))));
  draw(availableCategories(mode, readHistory(mode.id).used, readHistory(mode.id).last));
  if (isSecret()) $('announcement').textContent='Gizli Kişisel açık.';
  else if (wasSecret) $('announcement').textContent='Kişisel havuzuna dönüldü.';
}
function handleTab(next) {
  if (busy) return;
  const tap=personalTap(personalTapCount,next.id,isSecret()); personalTapCount=tap.count;
  if (tap.action==='secret') setMode(data.secretMode);
  else if (mode.id!==next.id) setMode(next);
}
function setBusy(value) {
  busy=value;
  $('spin').setAttribute('aria-disabled',String(value));
  $('spin').textContent=value?'Çark dönüyor…':'Çarkı çevir ↻';
  $('tabs').querySelectorAll('button').forEach(button => button.setAttribute('aria-disabled',String(value)));
  $('exit-secret').setAttribute('aria-disabled',String(value));
  $('another').setAttribute('aria-disabled',String(value));
}
function choose(animate) {
  if (busy) return;
  personalTapCount=0; $('notice').textContent=''; $('copy-status').textContent='';
  const history=readHistory(mode.id), categories=availableCategories(mode,history.used,history.last);
  const choice=selectItem(mode,history.used,Math.random,history.last);
  if(choice.empty){clearResult();$('notice').textContent='Bu havuzda henüz soru yok.';return;}
  if (categories.map(c=>c.id).join('|') !== wheelCategories.map(c=>c.id).join('|')) draw(categories);
  if(animate) clearResult();
  setBusy(true);
  const finish=()=>{
    saveHistory(mode.id,updateHistory(history,choice)); selected=choice;
    $('category').textContent=choice.category.label; $('question').textContent=choice.item.question;
    $('followups').replaceChildren();
    if(choice.item.followUps?.length){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Bir soru daha';details.append(summary);choice.item.followUps.forEach(text=>{const p=document.createElement('p');p.textContent=text;details.append(p);});$('followups').append(details);}
    $('result').hidden=false; $('notice').textContent=choice.reset?'Sorular yeniden karıştırıldı.':'';
    $('announcement').textContent=`${choice.category.label}. ${choice.item.question}`; setBusy(false);
  };
  const index=categories.findIndex(category=>category.id===choice.category.id);
  const duration=spinDuration(animate,reduceMotion());
  rotation=targetRotation(rotation,index,categories.length,duration ? 4 : 0);
  $('wheel').style.transition=`transform ${duration}ms cubic-bezier(.16,.7,.16,1)`; $('wheel').style.transform=`rotate(${rotation}deg)`; orientLabels(duration);
  if(duration) setTimeout(finish,duration); else finish();
}
async function copy() {
  if(!selected) return;
  const text=selected.item.question; let copied=false;
  try { if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);copied=true;} } catch {}
  if(!copied){const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();try{copied=document.execCommand('copy');}catch{}area.remove();$('copy').focus();}
  $('copy-status').textContent=copied?'Kopyalandı.':'Kopyalanamadı; metni seçebilirsin.';
}
async function load() {
  $('error').hidden=true;$('loading').hidden=false;
  try {
    const response=await fetch(`${import.meta.env.BASE_URL}questions.json?v=${__QUESTIONS_BUILD_VERSION__}`,{cache:'no-store'});
    if(!response.ok)throw Error(); const json=await response.json();
    if(json.schemaVersion!==1 || !json.modes?.length || !json.secretMode?.categories?.length || json.modes.some(m=>!m.categories?.length))throw Error();
    data=json; migrateHistory(); $('tabs').replaceChildren();
    data.modes.forEach(m=>{const button=document.createElement('button');button.textContent=m.label;button.dataset.id=m.id;button.onclick=()=>handleTab(m);$('tabs').append(button);});
    $('game').hidden=false;setMode(data.modes[0]);
  } catch {$('game').hidden=true;$('error').hidden=false;} finally {$('loading').hidden=true;}
}
$('spin').onclick=()=>choose(true);$('another').onclick=()=>choose(false);$('copy').onclick=copy;$('retry').onclick=load;
$('exit-secret').onclick=()=>{if(!busy){personalTapCount=0;setMode(data.modes.find(m=>m.id==='kisisel'));$('tabs').querySelector('[data-id="kisisel"]').focus();}};
load();
