export const guesses = [
'Boş bir pazar gününü nasıl geçirmek ister?', 'Hangi küçük şey gününü hemen güzelleştirir?',
'Bir kafede menüden ilk neye bakar?', 'Hangi mevsimde kendini daha iyi hisseder?',
'Bir yolculukta pencere kenarını mı koridoru mu seçer?', 'Yeni bir şehri gezerken ilk nereye gider?',
'Hangi yemek ona çocukluğunu hatırlatır?', 'Bir akşam için film mi oyun mu seçer?',
'Hangi hayvanın bir günlüğüne hayatını deneyimlemek ister?', 'Bir süper güç seçse hangisini ister?',
'Bir dükkân açsa ne satardı?', 'Hangi sesi dinlemek onu rahatlatır?',
'Bir masaya hangi üç atıştırmalığı koyardı?', 'En sevdiği hava nasıl olurdu?',
'Bir hobiye hemen başlayabilse hangisini seçerdi?', 'Plansız bir yolculukta yanına ilk ne alırdı?',
'Bir şarkıyı tekrar tekrar dinleyecek olsa nasıl bir şarkı seçerdi?', 'Hangi kurmaca dünyayı gezmek isterdi?',
'Bir günü yeniden yaşayabilse nasıl bir gün seçerdi?', 'Bir kutlama düzenlese nasıl bir ortam kurardı?'
];
export const stories = [
['Gizli bir ada', 'Adanın beklenmedik bir özelliği ne?', 'Orada kimler yaşıyor ve neyle uğraşıyor?', 'Adaya gelen bir misafiri hangi sürpriz bekliyor?'],
['Tuhaf bir restoran', 'Restoran nerede ve adı ne?', 'Menüdeki en şaşırtıcı yemek nasıl hazırlanıyor?', 'Bir müşteri beklenmedik ne sipariş ediyor?'],
['Hayali bir kahraman', 'Kahramanın adı ve tuhaf yeteneği ne?', 'Günlük hayatında hangi küçük sorunla uğraşıyor?', 'Yeteneği bu sorunu nasıl daha da karıştırıyor?'],
['Bulutların üzerindeki kasaba', 'Kasabaya nasıl gidiliyor?', 'Orada herkesin uyduğu tuhaf bir gelenek ne?', 'Bir gün bu gelenek neden değişiyor?'],
['Konuşan bir nesne', 'Hangi nesne konuşmaya başlıyor?', 'İlk söylediği sıradan ama şaşırtıcı söz ne?', 'Onunla birlikte nereye gidiyorsunuz?'],
['Gece açık müze', 'Müzede neler sergileniyor?', 'Gece olunca hangi eser canlanıyor?', 'Sabah olmadan çözmeniz gereken küçük mesele ne?'],
['Zaman yolculuğu bürosu', 'Büronun en sıra dışı kuralı ne?', 'İlk müşteriniz nereye gitmek istiyor?', 'Yolculukta hangi komik aksilik yaşanıyor?'],
['Yeni bir bayram', 'Bayram neyi kutluyor ve adı ne?', 'İnsanlar o gün ne giyiyor veya ne yiyor?', 'Bayramın en eğlenceli ritüeli nasıl başladı?'],
['Kayıp eşya gezegeni', 'Gezegende en çok hangi kayıp eşya var?', 'Bu eşyalar kendilerine nasıl bir düzen kurmuş?', 'Dünyadan gelen bir ziyaretçiye ne teklif ediyorlar?'],
['Sıra dışı bir otobüs', 'Otobüsün rotası nereden nereye?', 'Yolculardan biri hangi ilginç eşyayı taşıyor?', 'Son durakta herkes ne keşfediyor?']
];
export function nextGuess(state, action) {
  if (action === 'reveal' && state.stage === 'predict') return {...state, stage:'answer'};
  if (action === 'compare' && state.stage === 'answer') return {...state, stage:'compare'};
  if (action === 'next' && state.stage === 'compare') return {index:(state.index + 1) % guesses.length, player:state.player === 'A' ? 'B' : 'A', stage:'predict'};
  return state;
}
export function nextStory(state) { return state.step < 2 ? {...state, step:state.step+1} : {...state, step:3}; }
