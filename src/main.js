import './style.css';
import {
  historyKey, intensityAvailability, intensityFilter, personalDefault, personalTap,
  selectItem, targetRotation, updateHistory
} from './logic.js';
import { guesses, stories, nextGuess, nextStory } from './games.js';
const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
const colors = ['#f3d4bd','#dc9c91','#a85069','#f8e5cc','#ca7c82','#873f5c','#efc0ae','#93445b'];
const levelNames = ['Hafif', 'Meraklı', 'Kişisel', 'Derin', 'Cesur'];
let data, mode, rotation = 0, busy = false, selected = null, personalTapCount = 0, view = 'wheel';
let entertainmentIntensity = '';
let guess = {index:0, player:'A', stage:'predict'}, prediction = '', answer = '', story = {index:0, step:0};
const memory = {};
const secret = () => mode?.id === data?.secretMode?.id;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function readHistory(id) {
  const key = historyKey(id);
  if (memory[key]) return memory[key];
  try {
    const value = JSON.parse(localStorage.getItem(key));
    if (value && Array.isArray(value.used)) return value;
  } catch {}
  return { used: [], last: null };
}
function saveHistory(id, value) {
  const key = historyKey(id);
  try {
    localStorage.setItem(key, JSON.stringify(value));
    delete memory[key];
  } catch { memory[key] = value; }
}
function clearResult() { selected = null; $('result').hidden = true; $('copy-status').textContent = ''; $('announcement').textContent = ''; }
function draw() {
  const wheel = $('wheel'); wheel.replaceChildren(); wheel.style.transition = 'none'; rotation = 0; wheel.style.transform = 'rotate(0deg)';
  const count = mode.categories.length, step = 2 * Math.PI / count;
  mode.categories.forEach((category, i) => {
    const start = i * step - Math.PI / 2, end = (i + 1) * step - Math.PI / 2;
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('d', `M 0 0 L ${150*Math.cos(start)} ${150*Math.sin(start)} A 150 150 0 ${step > Math.PI ? 1 : 0} 1 ${150*Math.cos(end)} ${150*Math.sin(end)} Z`);
    path.setAttribute('fill', colors[i % colors.length]); path.setAttribute('stroke', '#fff8f2'); path.setAttribute('stroke-width', '2'); wheel.append(path);
    const angle = (i + .5) * step - Math.PI / 2, label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', 101 * Math.cos(angle)); label.setAttribute('y', 101 * Math.sin(angle)); label.setAttribute('text-anchor', 'middle'); label.setAttribute('dominant-baseline', 'middle'); label.setAttribute('fill', [2,5,7].includes(i % 8) ? '#fff' : '#4d1c2c'); label.setAttribute('font-size', category.label.length > 12 ? '10' : '12'); label.setAttribute('font-weight', '700'); label.style.transformBox = 'fill-box'; label.style.transformOrigin = 'center'; label.textContent = category.label; wheel.append(label);
  });
  const rim = document.createElementNS(svgNS, 'circle'); rim.setAttribute('r','150'); rim.setAttribute('fill','none'); rim.setAttribute('stroke','#6d3045'); rim.setAttribute('stroke-width','3'); wheel.append(rim);
}
function orientLabels(duration) {
  $('wheel').querySelectorAll('text').forEach(label => {
    label.style.transition = `transform ${duration}ms cubic-bezier(.16,.7,.16,1)`;
    label.style.transform = `rotate(${-rotation}deg)`;
  });
}
function setMode(next) {
  mode = next; clearResult();
  const filter = $('intensity');
  const defaultValue = personalDefault(mode.id);
  const { available, selected: availableIntensity } = intensityAvailability(mode, entertainmentIntensity);
  filter.replaceChildren();
  if (defaultValue) filter.add(new Option(`Rahat · ${defaultValue.replace('-', '–')} (varsayılan)`, defaultValue));
  filter.add(new Option(defaultValue ? 'Tüm seviyeler · 5 dahil' : 'Hepsi', ''));
  levelNames.forEach((label, index) => {
    const level = index + 1;
    const disabled = !available.has(level);
    const option = new Option(`${level} · ${label}${disabled ? ' (bu modda yok)' : ''}`, level);
    option.disabled = disabled;
    filter.add(option);
  });
  filter.value = defaultValue || availableIntensity;
  $('wheel-view').classList.toggle('personal-wheel', Boolean(defaultValue));
  if (defaultValue) $('question').setAttribute('aria-describedby', 'category level topic');
  else $('question').removeAttribute('aria-describedby');
  $('notice').textContent = secret() ? 'Gizli Kişisel açıldı.' : '';

  document.body.classList.toggle('secret-mode', secret());
  $('tabs').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.id === (secret() ? 'kisisel' : mode.id)))); draw();
}
function renderFollowUps(followUps, personal) {
  const panel = $('followups');
  panel.replaceChildren();
  if (!followUps?.length) return;

  if (!personal) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = 'Ek sorular';
    details.append(summary);
    followUps.forEach(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      details.append(paragraph);
    });
    panel.append(details);
    return;
  }

  const prompt = document.createElement('p');
  prompt.className = 'followup-prompt';
  prompt.tabIndex = -1;
  prompt.hidden = true;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'followup-button';
  button.textContent = 'Biraz daha derine in';
  let index = 0;
  button.onclick = () => {
    prompt.hidden = false;
    prompt.textContent = followUps[index++];
    if (index === followUps.length) {
      button.hidden = true;
      prompt.focus();
    } else {
      button.textContent = 'Sonraki ek soru';
      $('announcement').textContent = prompt.textContent;
    }
  };
  panel.append(prompt, button);
}
function handleTab(next) {
  if (busy) return;
  const result = personalTap(personalTapCount, next.id, secret()); personalTapCount = result.count;
  if (result.action === 'secret') setMode(data.secretMode);
  else if (mode.id !== next.id) setMode(next);
}
function setBusy(value) { busy = value; $('spin').disabled = value; $('intensity').disabled = value; $('tabs').querySelectorAll('button').forEach(b => b.disabled = value); document.querySelectorAll('.experience button').forEach(b => b.disabled = value); }
function choose(animate) {
  if (busy) return;
  personalTapCount = 0; clearResult(); $('notice').textContent = '';
  const history = readHistory(mode.id), value = $('intensity').value;
  const choice = selectItem(mode, history.used, Math.random, history.last, intensityFilter(value));
  if (choice.empty) { $('notice').textContent = 'Bu yoğunlukta soru yok. Başka bir yoğunluk seçebilirsin.'; return; }
  const personal = Boolean(personalDefault(mode.id));
  setBusy(true);
  const finish = () => {
    saveHistory(mode.id, updateHistory(history, choice)); selected = choice;
    const level = choice.item.intensity ?? 2;
    $('category').textContent = choice.category.label;
    $('level').textContent = personal ? `${level} · ${levelNames[level - 1]}` : `YOĞUNLUK ${level}/5`;
    $('topic').textContent = choice.item.topic; $('question').textContent = choice.item.question;
    renderFollowUps(choice.item.followUps, personal);
    const result = $('result');
    result.classList.toggle('bold-result', personal && level === 5);
    result.hidden = false;
    $('notice').textContent = choice.reset ? 'Bu seçimdeki sorular baştan karıştırıldı.' : '';
    if (!personal) $('announcement').textContent = `${choice.category.label}. ${choice.item.question}`;
    setBusy(false); $('question').focus();
  };
  const index = mode.categories.indexOf(choice.category);
  if (!animate) { rotation = targetRotation(rotation, index, mode.categories.length, 0); $('wheel').style.transition = 'none'; $('wheel').style.transform = `rotate(${rotation}deg)`; orientLabels(0); finish(); return; }
  rotation = targetRotation(rotation, index, mode.categories.length, 3 + Math.floor(Math.random() * 2));
  const duration = reduceMotion() ? 0 : 2200;
  $('wheel').style.transition = `transform ${duration}ms cubic-bezier(.16,.7,.16,1)`; $('wheel').style.transform = `rotate(${rotation}deg)`; orientLabels(duration);
  setTimeout(finish, duration);
}
async function copy() {
  if (!selected) return;
  const copiedChoice = selected;
  const text = `Konu: ${copiedChoice.item.topic}\nSoru: ${copiedChoice.item.question}`;
  let copied = false;
  try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); copied = true; } } catch {}
  if (selected !== copiedChoice) return;
  if (!copied) {
    const area = document.createElement('textarea'); area.value = text; area.setAttribute('readonly', '');
    area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select();
    try { copied = document.execCommand('copy'); } catch {} area.remove(); $('copy').focus();
  }
  $('copy-status').textContent = copied ? 'Kopyalandı!' : 'Kopyalanamadı; soruyu seçip kopyalayabilirsin.';
}
function showView(next) {
  if (busy || next === view) return;
  view = next; personalTapCount = 0; clearResult(); $('notice').textContent = ''; prediction = ''; answer = ''; guess = {index:guess.index, player:'A', stage:'predict'}; story = {index:story.index,step:0};
  ['wheel','guess','story'].forEach(name => { $(name + '-view').hidden = name !== view; document.querySelector(`[data-view="${name}"]`).setAttribute('aria-pressed', String(name === view)); });
  if (view === 'guess') renderGuess(); if (view === 'story') renderStory();
}
function renderGuess() {
  const card = $('guess-card'); card.replaceChildren();
  const badge = document.createElement('p'); badge.className = 'eyebrow'; badge.textContent = guess.stage === 'compare' ? 'YAN YANA' : guess.stage === 'predict' ? `OYUNCU ${guess.player} · TAHMİN ET` : `OYUNCU ${guess.player === 'A' ? 'B' : 'A'} · SIRA SENDE`;
  const title = document.createElement('h3'); title.textContent = guesses[guess.index]; title.tabIndex = -1; card.append(badge,title);
  if (guess.stage === 'compare') {
    for (const [label, value] of [['Tahmin',prediction],['Gerçek cevap',answer]]) { const box = document.createElement('div'); box.className = 'answer-box'; const strong = document.createElement('strong'); strong.textContent = label; const p = document.createElement('p'); p.textContent = value || 'Paylaşılmadı'; box.append(strong,p); card.append(box); }
    const button = document.createElement('button'); button.className='primary wide'; button.textContent='Rolleri değiştir ve devam et'; button.onclick=()=>{guess=nextGuess(guess,'next');prediction='';answer='';renderGuess(); $('guess-card').querySelector('h3').focus();}; card.append(button); return;
  }
  const hint = document.createElement('p'); hint.textContent = guess.stage === 'predict' ? 'Tahminini yaz, ardından cihazı diğer oyuncuya ver. İstersen boş bırakabilirsin.' : 'Tahmine bakmadan kendi cevabını yaz; istersen boş bırakabilirsin.'; card.append(hint);
  const label = document.createElement('label'); label.textContent = guess.stage === 'predict' ? 'Tahminin' : 'Cevabın'; const input = document.createElement('textarea'); input.rows=3; input.maxLength=500; input.value = guess.stage === 'predict' ? prediction : answer; label.append(input); card.append(label);
  const button = document.createElement('button'); button.className='primary wide'; button.textContent = guess.stage === 'predict' ? 'Gizle ve cihazı ver' : 'Cevapları karşılaştır'; button.onclick=()=>{ if(guess.stage === 'predict'){prediction=input.value;guess=nextGuess(guess,'reveal');} else {answer=input.value;guess=nextGuess(guess,'compare');} renderGuess(); $('guess-card').querySelector('h3').focus(); }; card.append(button);
  if (guess.stage === 'answer') { const back = document.createElement('button'); back.className='secondary wide'; back.textContent='Tahmine dön'; back.onclick=()=>{answer=input.value; guess={...guess,stage:'predict'}; renderGuess(); $('guess-card').querySelector('h3').focus();}; card.append(back); }
}
function renderStory() {
  const card=$('story-card'); card.replaceChildren(); const badge=document.createElement('p'); badge.className='eyebrow'; badge.textContent=story.step < 3 ? `ADIM ${story.step+1} / 3 · ${story.step % 2 === 0 ? 'A' : 'B'} BAŞLASIN` : 'HİKÂYE TAMAM'; const title=document.createElement('h3'); title.textContent=stories[story.index][0]; title.tabIndex=-1; const prompt=document.createElement('p'); prompt.className='story-prompt'; prompt.textContent=story.step < 3 ? stories[story.index][story.step+1] : 'Birlikte kurduğunuz dünyaya bir isim verin ve hikâyenizi anlatın.'; const hint=document.createElement('p'); hint.textContent='Sırayla sözlü katkıda bulunun; cevaplar kaydedilmez.'; const button=document.createElement('button'); button.className='primary wide'; button.textContent=story.step < 3 ? 'Sonraki adım' : 'Yeni bir dünya kur'; button.onclick=()=>{story=story.step < 3 ? nextStory(story) : {index:(story.index+1)%stories.length,step:0};renderStory(); $('story-card').querySelector('h3').focus();}; card.append(badge,title,prompt,hint,button); if (story.step > 0 && story.step < 3) { const back=document.createElement('button'); back.className='secondary wide'; back.textContent='Önceki adım'; back.onclick=()=>{story={...story,step:story.step-1}; renderStory(); $('story-card').querySelector('h3').focus();}; card.append(back); }
}
async function load() {
  $('error').hidden=true; $('loading').hidden=false;
  try { const response=await fetch(`${import.meta.env.BASE_URL}questions.json?v=${__QUESTIONS_BUILD_VERSION__}`,{cache:'no-store'}); if(!response.ok) throw Error(); const json=await response.json(); if(json.schemaVersion!==1 || !json.modes?.length || !json.secretMode?.categories?.length || json.modes.some(m=>!m.categories?.length)) throw Error(); data=json; $('tabs').replaceChildren(); data.modes.forEach(m=>{const b=document.createElement('button');b.textContent=m.label;b.dataset.id=m.id;b.onclick=()=>handleTab(m);$('tabs').append(b);}); $('app-content').hidden=false; setMode(data.modes[0]); }
  catch { $('app-content').hidden=true; $('error').hidden=false; } finally { $('loading').hidden=true; }
}
$('spin').onclick=()=>choose(true); $('another').onclick=()=>choose(false); $('copy').onclick=copy; $('retry').onclick=load;
$('intensity').onchange = event => {
  if (mode.id === 'eglence') entertainmentIntensity = event.target.value;
  clearResult();
  $('notice').textContent = '';
};
document.querySelectorAll('.experience button').forEach(b=>b.onclick=()=>showView(b.dataset.view)); load();
