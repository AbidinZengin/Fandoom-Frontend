#!/usr/bin/env node
// "Kumların Arasında Bir Kral" (Ozymandias derin okuma) blog yazısını
// backend'e POST eder. create-skyler-blog.mjs'deki AYNI desen: content/
// contentTr aynı TR metni taşır (EN yeniden yazımı backend'e gitmiyor,
// docs_dev/blog-drafts/ozymandias-kumlarin-arasinda-bir-kral.md'de saklı
// — i18n görüntüleme akışı hazır olunca taşınacak). Yerel görseller
// (Heykel-1, Teklif, Böcek, Ev, kapanış üçlü) henüz Cloudinary'de değil,
// bu adımda null gider — upload-ozymandias-blog-images.mjs ikinci adımda
// PUT ile günceller. TMDB görselleri (kapak, Heykel-2, Performans) direkt
// kullanılıyor, Cloudinary'ye taşınmaları gerekmiyor.
//
// Kullanım (PowerShell):
//   node scripts/create-ozymandias-blog.mjs                (dry-run)
//   node scripts/create-ozymandias-blog.mjs --write         (gerçek POST, DRAFT)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadDotEnvLocal() {
  const path = resolve('.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadDotEnvLocal();

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:8080/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || null;
const doWrite = process.argv.includes('--write');

if (doWrite && !AUTH_TOKEN) {
  console.error('--write için AUTH_TOKEN ortam değişkeni zorunlu.');
  process.exit(1);
}

const T = (content) => ({ content, contentTr: content });

let order = 0;
function block(blockType, sceneKey, { content = null, imageUrl = null, imageAlt = null } = {}) {
  const t = content != null ? T(content) : { content: null, contentTr: null };
  return {
    orderIndex: order++,
    blockType,
    sceneKey,
    content: t.content,
    contentTr: t.contentTr,
    imageUrl,
    imageAlt,
    imageAltTr: imageAlt,
  };
}

const P = (...paragraphs) => paragraphs.join('\n\n');

const blocks = [
  block('LEDE_TEXT', 'lede', {
    content: P(
      `Her birkaç yüzyılda bir, bir kral kendi ölümsüzlüğüne öyle bir inanır ki bunu taşa kazıtır: "Eserlerime bakın, ey güçlüler, ve umutsuzluğa kapılın." Sonra rüzgâr eser, kum birikir, ve geriye sadece o yazı kalır — okuyacak kimse, savunacak hiçbir eser olmadan. Bu fikir kendini üç kere tekrarladı: önce 1818'de bir şiirde, sonra 2013'te bir televizyon bölümünde, sonra da geçtiğimiz Şubat'ta, o bölümün kendi ününü savunan hayranların arasında. Üçü de aynı hikâyeyi anlatıyor; biz ikincisinden başlayalım.`,
      `Breaking Bad'in "Ozymandias" bölümü açılırken karşımıza çıkan ilk kare bir çatışma değil, bir flashback. Walt ve Jesse'nin ilk pişirişleri, karavanın içi; Walt telefonda Skyler'la konuşuyor, henüz doğmamış ikinci çocuklarından bahsediyorlar. Sahne kısa ama bir şey dikkat çekiyor: Walt'ın gömleği ağaçlarla, bacakları toprakla neredeyse bütünleşmiş, kamera onu bir insan değil bir manzaranın parçası gibi gösteriyor. Sonra sahne bitiyor, karavan ve Jesse görüntüden siliniyor, geriye sadece çöl kalıyor — az sonra tekrar döneceğimiz şiirin dediği tam olarak bu. Ama önce bu sessiz açılışın hemen ardından gelen çatışmaya bakalım.`
    ),
  }),

  block('SECTION_HEADING', 'scene-1', { content: 'Teklif' }),
  block('IMAGE', 'scene-1', {
    // Cloudinary'ye henüz yüklenmedi (yerel dosya) — upload script'i güncelleyecek.
    imageUrl: null,
    imageAlt: 'Hank Schrader çölde yakın planda, kararlı ve meydan okuyan bir ifadeyle kameraya bakıyor.',
  }),
  block('SECTION_TEXT', 'scene-1', {
    content: `Normal akışa döndüğümüzde karşımıza çıkan bir çatışmanın ortası. Hank bacağından vurulmuş durumda, Jack'in çetesi onu narkotik olduğunu anlayınca infaz etmeye kalkıyor. Walt araya giriyor, önce akrabalık bağını öne sürüyor, sonra elindeki en büyük kozu masaya sürüyor: seksen milyon dolar, Hank'in hayatı karşılığında. Hank'in cevabı kısa ve tam da bu teklifin neyi kaçırdığını gösteriyor: "Sen tanıdığım en zeki adamsın, ama onun on dakika önce karar verdiğini görmeyecek kadar da aptalsın." Jack'e son sözü daha da kısa:`,
  }),
  block('QUOTE', 'scene-1', { content: '"Yapacağın neyse yap."' }),
  block('SECTION_TEXT', 'scene-1', { content: 'Yalvarmadan ölüyor.' }),

  block('SECTION_HEADING', 'scene-2', { content: 'Heykel' }),
  block('IMAGE', 'scene-2', {
    imageUrl: null,
    imageAlt: 'Üstte çölde yatan kırık bir taş heykel başı, altta aynı pozda çölde yüzükoyun yatan Walter White — iki görüntü yan yana karşılaştırılıyor.',
  }),
  block('SECTION_TEXT', 'scene-2', {
    content: `Silahlar patlıyor, Hank kızıl toprağa düşerken Walt da dizlerinin üstüne çöküyor — ama bir anda değil, aşama aşama, kamera onu adım adım izliyor. Yönetmen Rian Johnson bu çöküşü bilerek bir heykelin parçalanmasına benzetiyor: bölümün adını aldığı şiire ilham veren, bir zamanlar Mısır'da devasa bir kral heykelinin şimdi çölde kırık yattığı görüntüsüne. Percy Bysshe Shelley bu şiiri 1818'de yazmış; heykelin kaidesinde hâlâ o eski uyarı duruyor:`,
  }),
  block('QUOTE', 'scene-2', { content: '"Eserlerime bakın, ey güçlüler, ve umutsuzluğa kapılın."' }),
  block('SECTION_TEXT', 'scene-2', {
    content: `Ama etrafta bakılacak hiçbir eser kalmamış, sadece "ıssız ve düz kumlar, uzağa doğru uzanıyor." Walt da tam olarak bu konumda: eserinin büyüklüğüyle ölümü satın alabileceğini sanmış, ama doğanın ve kaderin karşısında paranın hiçbir hükmü olmadığını şimdi öğreniyor. Kamera yüzüne kilitlendiğinde artık orada ne Heisenberg var ne bir aile babası — kumların arasında yarı gömülü, darmadağın bir çehre uzanıyor sadece, ve seksen milyon dolar, "titreyin" dediği o büyük eser, düşmanları tarafından topraktan bir bir çıkarılıyor.`,
  }),
  block('IMAGE', 'scene-2', {
    imageUrl: 'https://image.tmdb.org/t/p/original/AaI1F1QNQSvL98zxrRzXOCalaop.jpg',
    imageAlt: 'Walter White çölde kollarını iki yana açmış, arkasındaki kayalık manzarayı gösteriyor.',
  }),
  block('SECTION_TEXT', 'scene-2', {
    content: `Kibri yıkılırken bile Heisenberg yanına birini sürüklemek istiyor. Jesse arabaya bindirilirken Walt yanına eğiliyor, Jane'in ölümünü izlediğini itiraf ediyor — yıkılan gövdeye inen son balyoz darbesi. Walt artık sadece fiziksel değil, ahlaki olarak da bir enkaz.`,
  }),

  block('SECTION_HEADING', 'scene-3', { content: 'Böcek' }),
  block('IMAGE', 'scene-3', {
    imageUrl: null,
    imageAlt: 'Walter White alacakaranlıkta geniş bir çöl manzarasında bir varili yuvarlıyor, önde yere bırakılmış ceketi görünüyor.',
  }),
  block('SECTION_TEXT', 'scene-3', {
    content: `Çatışma sırasında bir kurşun kamyonetin benzin deposuna isabet ediyor. Walt çölün ortasında elinde kalan tek variyle baş başa kalıyor, yuvarlayarak sürüklemeye çalışıyor — bir zamanlar imparatorluklar kuran adam, şimdi kendi pisliğinden örülü bir yükü sürükleyen bir bok böceği kadar küçülmüş. Shelley'nin dev harabesi artık sadece bir varil paradan ve onu sürükleyen bir zavallıdan ibaret.`,
  }),
  block('SECTION_TEXT', 'scene-3', {
    content: `Walt çölün ortasında yaşlı bir adamdan bir kamyonet satın alıp eve doğru yola çıkıyor. Bu sırada Marie, Skyler'ın yanına zafer kazanmış bir komutan edasıyla gidiyor — Walt'ın yakalandığını sanıyor. Skyler'a yardım etmesi için tek bir şart koşuyor: itirafları yapması ve Junior'a her şeyi anlatması. Skyler anlatıyor da; Junior hayal kırıklığına uğruyor, anne babasının ona yalan söylediğine inanmak istemiyor.`,
  }),

  block('SECTION_HEADING', 'scene-4', { content: 'Ev' }),
  block('IMAGE', 'scene-4', {
    imageUrl: null,
    imageAlt: 'Skyler oturma odasının zemininde korkmuş bir hâlde otururken, oğlu Junior yanında onu korur şekilde diz çökmüş.',
  }),
  block('SECTION_TEXT', 'scene-4', {
    content: `Walter eve ulaştığında bütün eşyalarını toplayıp kaçmak için son fırsatı olduğunun farkında. Skyler ve Junior eve geldiğinde telaşla eşyalarını toplarken onlara da aynısını yapmalarını söylüyor. Skyler bir şeylerin ters gittiğini anlıyor: "Hank nerede?" Walt'ın cevabı fısıltıyla geliyor:`,
  }),
  block('QUOTE', 'scene-4', { content: '"Onu kurtarmaya çalıştım."' }),
  block('SECTION_TEXT', 'scene-4', {
    content: `Yıkılan bir imparatorluğun enkazı altında kalan son bir çırpınıştan ibaret bu cümle. Skyler için Walt artık çocuklarının babası değil, ailesine yıkım getiren tiran. Mutfaktan bir bıçak kapıyor. İkisi yerde boğuşurken Junior babasının üstüne atılıyor, annesini korumak için polisi arıyor. Kendi oğlu tarafından yere bastırılan ve bir suçlu gibi ihbar edilen Walt, o an krallığının sadece çölde değil kendi evinin salonunda da yerle bir olduğunu anlıyor.`,
  }),

  block('SECTION_HEADING', 'scene-5', { content: 'Performans' }),
  block('IMAGE', 'scene-5', {
    imageUrl: 'https://image.tmdb.org/t/p/original/3cEVM4peZW2r2HiKVzxDjmBLJxD.jpg',
    imageAlt: 'Walter White gece yol kenarında telefonda konuşuyor, ceketi kirli ve tozlu, bir eli bandajlı.',
  }),
  block('SECTION_TEXT', 'scene-5', {
    content: `Walter kızını kaçırarak evden uzaklaşıyor. Bir sahnede bebeğin "anne" diye sayıklaması Walt'ı durduruyor — o an, bu bebeğe bir annenin şefkatini, huzurunu, güvenliğini verebilecek kişi olmadığını görüyor. Hemen ardından o meşhur telefon konuşması geliyor: Walt bir yol kenarından Skyler'ı arıyor, evde polislerin dinlediğini bilerek. Her şeyin suçlusunun Skyler olduğunu haykırıyor, onu hiçbir zaman takdir etmediğini söylüyor, her şeyi tek başına yaptığını iddia ediyor.`,
  }),
  block('SECTION_TEXT', 'scene-5', {
    content: `Bu sahnenin iki okuması var. Birincisine göre gerçek bir öfke patlaması — Walt gerçekten Skyler'ı suçluyor, kibrinin enkazı altında kalırken bile bir günah keçisi arıyor. İkincisine göre bu bir performans: Walt hattın dinlendiğini biliyor, her cümleyi Skyler'ı mağdur gösterecek, onu hukuki suç ortaklığından kurtaracak şekilde seçiyor. Bize göre doğru okuma ikincisine daha yakın — konuşurken ağlıyor, ama bu sinirden köpüren bir adamın ağlaması değil, olanı kabullenmiş, kızını teslim edecek ve karısını güvende tutmaya çalışan bir adamın konuşması. O görüşmede Walt sadece Skyler'ı kurtarmıyor, kendi inşa ettiği Heisenberg efsanesini de kurban ediyor.`,
  }),

  block('SECTION_HEADING', 'scene-6', { content: 'Kumlar' }),
  block('SECTION_TEXT', 'scene-6', {
    content: `Kızı Holly'yi bir itfaiye istasyonuna, ait olduğu dünyaya bıraktığında Walt elinde kalan son hükümranlık parçasından da feragat ediyor. Evde bıraktığı satranç tahtasında beyaz şah, kasıtlı olarak asla kazanamayacağı bir dizilişte duruyor — "düşen kral" fikri setin en küçük ayrıntısına kadar işlenmiş. Kamyonetine döner, çalıştırır, uzaklaşır. Dikiz aynasına son kez baktığında gördüğü tek şey rüzgârın savurduğu boş bir çöl — Shelley'nin son mısralarının görsel karşılığı: "yalnız ve düz uzanıyor kumlar."`,
  }),

  block('SECTION_HEADING', 'scene-7', { content: 'Kum Bir Kez Daha' }),
  block('SECTION_TEXT', 'scene-7', {
    content: `Fikrin üçüncü tekrarına geldik. Bölüm 2013'te yayınlandığında IMDb'de 10 puan alan ilk TV bölümü oluyor ve bu unvanı on üç yıl boyunca kimseyle paylaşmıyor. Bu rakam aslında bölümün kendi temasına karşı garip bir ironi kuruyor: kalıcılığın yalan olduğunu anlatan bir bölüm, internetin en kalıcı unvanlarından birini yıllarca elinde tutuyor. Sonra 2026 Şubat'ında bu unvan da elinden alınıyor — ve alınış şekli, bölümün kendi hikâyesine rahatsız edici kadar benziyor.`,
  }),
  block('SECTION_TEXT', 'scene-7', {
    content: `HBO'nun Dunk & Egg hikâyelerini uyarlayan yeni spin-off'u *A Knight of the Seven Kingdoms* 2026 Ocak'ında yayına giriyor. Dizinin 15 Şubat'ta yayınlanan beşinci bölümü "In the Name of the Mother" binlerce 10/10 oyla Ozymandias'ın rekorunu tehdit etmeye başlıyor. Breaking Bad hayranları buna, hiç izlemedikleri bir diziye 1 puan vererek karşılık veriyor — bir kullanıcının kendi itirafıyla, "bu diziyi hiç izlemedim ama Breaking Bad'e sadakatimden 1 veriyorum." Knight hayranları aynı silahla Ozymandias'ı vuruyor; bölüm önce 9,9'a, sonra 9,8'e düşüyor ve on üç yıllık unvanını kaybediyor. Kavga o kadar çirkinleşiyor ki sonunda ikisiyle de hiç ilgisi olmayan üçüncü bir yapım — *Six Feet Under*'ın final bölümü "Everyone's Waiting" — kısa süreliğine IMDb zirvesine oturuyor.`,
  }),
  block('SECTION_TEXT', 'scene-7', {
    content: `İşte tam burada şiir, ekranın dışına taşıp kendini bir kez daha tekrar ediyor. İki hayran kitlesi de kendi sevdiği bölümü tarihin "en iyisi" ilan ettirmek için bir rakamı, bir unvanı, bir kaideyi savundu — ve bunu savunurken ikisi de kaybetti. Ozymandias'ın rekoru gitti, Knight'ın lansmanı bir vandalizm hikâyesine gömüldü, ortaya çıkan tek kazanan ilgisiz bir üçüncü bölüm oldu. "Eserlerime bakın, ey güçlüler, ve umutsuzluğa kapılın" diyen kral, kaidesinin çölde kırık yattığını görmüyordu; bir puanı savunmak için diğerini bombalayan hayran da savunduğu şeyin bir sayı değil bir eser olduğunu unutuyor. Bu savaşta gerçek kaybeden ne Breaking Bad ne de Knight — ikisinin arkasında duran, bir işe gerçekten hayran olabilme kapasitesi.`,
  }),
  block('IMAGE', 'verdict', {
    imageUrl: null,
    imageAlt: 'Üç karakterin (ortada Walter White) aynı yenilgiye uğramış pozda üst üste dizildiği bir kompozisyon.',
  }),
  block('VERDICT_TEXT', 'verdict', {
    content: 'Kazanan her zaman kum.',
  }),
];

const title = 'Kumların Arasında Bir Kral';
const kicker = 'DERİN OKUMA';
const axis =
  "Bir imparatorluğun çöküşünü izlemek için IMDb'nin en yüksek puanlı bölümüne ihtiyacınız yok — bir şiire ihtiyacınız var.";

const body = {
  title,
  titleTr: title,
  kicker,
  kickerTr: kicker,
  axis,
  axisTr: axis,
  imageUrl: 'https://image.tmdb.org/t/p/original/k80r5JYO4LLrPJbWDXmlg7IxRMI.jpg',
  imageUrlLarge: 'https://image.tmdb.org/t/p/original/k80r5JYO4LLrPJbWDXmlg7IxRMI.jpg',
  imageAlt: 'Walter White çölde, şaşkın bir ifadeyle kameraya bakıyor; arka planda kızıl kayalıklar ve çalılar.',
  imageAltTr: 'Walter White çölde, şaşkın bir ifadeyle kameraya bakıyor; arka planda kızıl kayalıklar ve çalılar.',
  spoilerThroughSeasonNumber: 5,
  spoilerThroughEpisodeNumber: 14,
  recommendedRank: null,
  spoilerFree: false,
  status: 'DRAFT',
  format: 'ANALYSIS',
  readingTimeMinutes: 7,
  // Breaking Bad: subjectType SERIES, subjectId 5 — create-skyler-blog.mjs'den
  // doğrulandı. Bölüme özel: seasonNumber 5, episodeNumber 14 (Ozymandias).
  tags: [{ subjectType: 'SERIES', subjectId: 5, seasonNumber: 5, episodeNumber: 14, franchiseId: null }],
  blocks,
};

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/ozymandias-blog-body.json'), JSON.stringify(body, null, 2));
  console.log(`Blok sayısı: ${blocks.length}`);
  console.log('Gövde scripts/output/ozymandias-blog-body.json dosyasına yazıldı.');

  if (!doWrite) {
    console.log('\nDRY-RUN: backend\'e yazılmadı. Onay sonrası --write ile tekrar çalıştır.');
    return;
  }

  const res = await fetch(`${BACKEND_BASE_URL}/blogs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`POST /blogs başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`\n✓ Blog oluşturuldu. id=${data.id}, slug=${data.slug}, status=${data.status}`);
  writeFileSync(resolve('scripts/output/ozymandias-blog-response.json'), JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
