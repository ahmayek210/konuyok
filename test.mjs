import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {availableCategories,selectItem,updateHistory,migratePersonalHistory,targetRotation,personalTap,spinDuration} from './src/logic.js';
const data=JSON.parse(await readFile(new URL('./public/questions.json',import.meta.url),'utf8'));
assert.equal(data.schemaVersion,1);
assert.deepEqual(data.modes.map(m=>m.id),['eglence','kisisel']);
assert.equal(data.secretMode.id,'gizli-kisisel');
assert.deepEqual(data.modes[0].categories.map(c=>c.id),['rastgele','ikilem','tartisma','senaryo','meydan-okuma']);
assert.deepEqual(data.modes[1].categories.map(c=>c.id),['gunluk-hayat','anilar','dusunceler','biraz-derin']);
const allModes=[...data.modes,data.secretMode], ids=new Set(), questions=new Set();
for (const mode of allModes) {
  const categoryIds=new Set();
  for (const category of mode.categories) {
    assert.ok(category.id && category.label && category.items.length); assert.ok(!categoryIds.has(category.id)); categoryIds.add(category.id);
    for (const item of category.items) {
      assert.ok(item.id && item.topic && item.question); assert.ok(!ids.has(item.id), item.id); ids.add(item.id);
      const normalized=item.question.toLocaleLowerCase('tr').replace(/\s+/g,' ').trim(); assert.ok(!questions.has(normalized),item.question); questions.add(normalized);
      assert.ok(item.weight===undefined || Number.isFinite(item.weight) && item.weight>0);
      assert.ok(item.intensity===undefined || Number.isInteger(item.intensity) && item.intensity>=1 && item.intensity<=5);
      if (item.followUps) assert.ok(Array.isArray(item.followUps) && item.followUps.every(s=>typeof s==='string'&&s.trim()));
    }
  }
  const all=mode.categories.flatMap(c=>c.items); let history={used:[],last:null};
  for(let i=0;i<all.length;i++){
    const categories=availableCategories(mode,history.used,history.last), choice=selectItem(mode,history.used,()=>.42,history.last);
    assert.ok(!choice.empty&&!choice.reset&&!history.used.includes(choice.item.id));
    const index=categories.indexOf(choice.category); assert.ok(index>=0);
    const rotation=targetRotation(i*1700,index,categories.length); const angle=(rotation+(index+.5)*360/categories.length)%360;
    assert.ok(Math.min(Math.abs(angle),Math.abs(360-angle))<1e-8);
    history=updateHistory(history,choice);
  }
  const choice=selectItem(mode,history.used,()=>0,history.last);assert.ok(choice.reset);if(all.length>1)assert.notEqual(choice.item.id,history.last);
  assert.equal(updateHistory(history,choice).used.length,1);
}
assert.ok(data.secretMode.categories.flatMap(c=>c.items).length>=100);
assert.ok(ids.size>304);
const example={categories:[{id:'a',items:[{id:'a1'},{id:'a2'},{id:'a3'}]},{id:'b',items:[{id:'b1'}]},{id:'empty',items:[]}]};
assert.deepEqual(availableCategories(example,['b1']).map(c=>c.id),['a']);
assert.equal(selectItem({categories:[]}).empty,true);
assert.equal(selectItem({categories:[{id:'empty',items:[]}]}).empty,true);
assert.equal(selectItem({categories:[{id:'one',items:[{id:'x'}]}]},['x'],()=>0,'x').item.id,'x');
const migrated=migratePersonalHistory({used:['old','removed'],last:'old'},{used:['moved','unrelated','removed']},['moved']);
assert.deepEqual(migrated,{used:['old','removed','moved'],last:'old'});
assert.deepEqual(migratePersonalHistory(migrated,{used:['moved']},['moved']),migrated);
let count=0;for(let i=0;i<7;i++){const tap=personalTap(count,'kisisel',false);count=tap.count;assert.equal(tap.action,i===6?'secret':'normal');}
assert.equal(personalTap(5,'eglence',false).count,0);assert.equal(personalTap(6,'kisisel',true).action,'normal');
assert.equal(spinDuration(true,true),0);assert.equal(spinDuration(false,false),0);assert.ok(spinDuration(true,false)>0);
let seed=1234567,counts={a:0,b:0};const random=()=>((seed=seed*16807%2147483647)-1)/2147483646;
for(let i=0;i<10000;i++)counts[selectItem(example,[],random).category.id]++;
assert.ok(Math.abs(counts.a-counts.b)<400,JSON.stringify(counts));
console.log(`${ids.size} benzersiz soru, havuzlar, geçmiş, çark, gizli mod ve hareket doğrulandı.`,counts);

const exhausted={categories:[{id:'a',items:[{id:'a'}]},{id:'b',items:[{id:'b'}]}]};
assert.deepEqual(availableCategories(exhausted,['a','b'],'a').map(c=>c.id),['b']);
const resetChoice=selectItem(exhausted,['a','b'],()=>0,'a'); assert.equal(resetChoice.category.id,'b');
assert.deepEqual(new Set(resetChoice.resetIds),new Set(['a','b']));
