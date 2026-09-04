#!/usr/bin/env node
// Skyler White karakter analizi blog yazısını backend'e POST eder.
// Şema canlı GET /api/blogs/300 ("from-green-to-black") ve /api/blogs/23
// ("why-daenerys...") ile doğrulandı: content/contentTr AYNI TR metni
// taşır (site şu an title/content BAZ alanını gösteriyor, titleTr/contentTr
// henüz görüntülemede kullanılmıyor — bkz. BlogPost.data.js getBlogDetail).
// EN yeniden yazımı burada YOK; docs_dev/blog-drafts/skyler-white-hakliydi.md
// içinde saklı, i18n görüntüleme akışı hazır olunca taşınacak.
//
// Cover + iki eşleştirilmiş fotoğraf (Yükleme Hatası) henüz Cloudinary'ye
// yüklenmedi — bu ilk adımda imageUrl alanları NULL/TMDB URL'i ile gider,
// ikinci adımda (Cloudinary upload script'i) güncellenecek.
//
// Kullanım (PowerShell):
//   node scripts/create-skyler-blog.mjs                (dry-run)
//   node scripts/create-skyler-blog.mjs --write         (gerçek POST, DRAFT)

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
      `Bir dizinin en ilginç taraflarından biri, seyircinin bir karakteri neden sevip neden sevmediğini gözlemlemek. Çoğu zaman bu tepki karakterin yaptıklarıyla orantılıdır: iyi biri sevilir, kötü biri sevilmez. Ama Breaking Bad'de tuhaf bir şey oluyor. Dizinin en çok cinayet işleyen, en çok yalan söyleyen, bir çocuğu zehirleyip bir kadının kendi kusmuğunda boğulmasını izleyen karakteri Walter White, seyircinin gözünde bir kahramana, hatta bir ikona dönüşüyor. Buna karşılık, dizide belki de en az suç işleyen yetişkin karakter olan karısı Skyler White, televizyon tarihinin en nefret edilen isimlerinden biri oluyor. Hatta bu nefret ekranın dışına taşıyor; karakteri oynayan Anna Gunn gerçek tehditler almaya başlıyor, internette "I Hate Skyler White" adında onbinlerce üyeli bir grup kuruluyor.`,
      `Bu durum o kadar dikkat çekici ki akademik bir ilgiye bile konu oluyor. 2019'da Joke Hermes ve Linda Stoete adlı iki araştırmacı, Reddit'teki Skyler tartışmalarını inceleyen bir çalışma yayımlıyor ve seyircinin tepkisini üç gruba ayırıyor: bir kısmı kendini her şeyi görebilen akıllı bir izleyici olarak konumluyor, bir kısmı bunu ahlaki bir yargı meselesi yapıyor, bir kısmı da doğrudan kadını "haddini bilmemekle" suçlayan bir üsluba kayıyor — araştırmacılar bu üçüncü grubu açıkça mizojini olarak adlandırıyor. Yani soru artık sadece "Skyler sinir bozucu muydu" değil. Soru şu: dizideki en makul karakterlerden biri nasıl olup da en nefret edilen karaktere dönüşüyor?`
    ),
  }),

  block('SECTION_HEADING', 'scene-1', { content: 'Zemin' }),
  block('IMAGE', 'scene-1', {
    imageUrl: 'https://image.tmdb.org/t/p/original/vWcFcwMUfeBN8FZEdSSPHGQYrna.jpg',
    imageAlt: "Hamile Skyler, kız kardeşi Marie ile birlikte sokakta Walter'ın kayıp ilanlarını dağıtıyor.",
  }),
  block('SECTION_TEXT', 'scene-1', {
    content: P(
      `Bu soruyu cevaplamak için önce Skyler'ın gerçekte nereden başladığına bakmak gerekiyor, çünkü seyircinin hafızasında kalan imaj çoğu zaman gerçek başlangıç noktasıyla örtüşmüyor. Dizi başladığında Skyler ayrıcalıklı bir hayat sürmüyor. Planlamadığı bir hamileliği var, serebral palsili bir oğlu var, ailenin bütçesi zar zor dönüyor. Kocası Walter lise öğretmenliğinin yanında bir oto yıkamada ikinci bir iş yapmak zorunda, üstelik patronu onu arabaları elleriyle silmeye zorlayarak küçük düşürüyor. Sonra bu ailenin üstüne bir haber daha düşüyor: Walter'a ilerlemiş akciğer kanseri teşhisi konuyor. Yani Skyler'ın hikâyesi, uyuşturucudan, yalanlardan çok önce, kocasının öleceğini öğrenip iki çocuğunu tek başına büyütmeye hazırlanan bir kadının hikâyesi olarak başlıyor.`,
      `Sonra bu zemin de kaymaya başlıyor. Walt ona hiçbir şeyin olmadığını söylerken aslında sessizce ikinci bir hayat kuruyor: saatlerce ortadan kayboluyor, açıklayamadığı yaralarla eve dönüyor, ikinci bir telefonu çıkıyor, evdeki paranın nereden geldiğini net söyleyemiyor. Skyler'ın karşılaştığı şey gizli bir kahramanlık hikâyesi değil; ölmekte olduğunu bildiği kocasının ya bir ilişki yaşadığı ya da tamamen çöktüğü, ikisinden hangisi olduğunu bile kestiremediği bir belirsizlik.`
    ),
  }),

  block('SECTION_HEADING', 'scene-2', { content: 'Teşhis' }),
  block('IMAGE', 'scene-2', {
    imageUrl: 'https://image.tmdb.org/t/p/original/uTAPBgAah14jQbV98Sw7iqJD4W7.jpg',
    imageAlt: 'Walter ve Skyler, bir depoda önlerindeki devasa nakit yığınına bakıyor.',
  }),
  block('SECTION_TEXT', 'scene-2', {
    content: P(
      `Dizide görünen tek teşhis Walter'ınki değil aslında. Walter'ın kanseri hikâyeyi başlatan teşhis, ama ilerleyen sezonlarda ikinci, çok daha sessiz konmuş bir teşhis daha var — ve bunu koyan Skyler. Walter'ın kazandığı para ailesine belki on kişilik bir ömür boyu yetecek noktaya geldiğinde bile, Skyler ona artık bu işten çekilmesini söylüyor. Walter ise tereddüt ediyor, devam etmek istiyor. İşte Skyler'ın burada fark ettiği şey, kocasının hâlâ hayatta kalma mücadelesi verdiği değil; artık sadece bu gücün tadını çıkarmak istediği.`,
      `Walter kendi kendine anlattığı hikâyede bunu bir özgürleşme, bir erkeklik yeniden kazanma hikâyesi olarak görüyor. Skyler'ın gördüğü hikâyede ise bu bir bağımlılık. Ve bu ayrım önemli, çünkü sonunda haklı çıkan taraf Skyler oluyor — dizinin son bölümlerinde Walter'ın kendi ağzından itiraf ettiği şey, esasında Skyler'ın aylar önce sezdiği şeyin resmileşmesinden başka bir şey değil.`
    ),
  }),

  block('SECTION_HEADING', 'scene-3', { content: 'Yükleme Hatası' }),
  block('IMAGE', 'scene-3', {
    // Cloudinary'ye henüz yüklenmedi (yerel dosya: d:/İndirilenler/638470.jpg)
    // — ikinci adımda güncellenecek.
    imageUrl: null,
    imageAlt: 'Walter banyoda net odakta; hamile Skyler arka planda bulanık bir şekilde yatağın kenarında oturuyor.',
  }),
  block('IMAGE', 'scene-3', {
    // Cloudinary'ye henüz yüklenmedi (yerel dosya: d:/İndirilenler/638471.jpg)
    // — ikinci adımda güncellenecek.
    imageUrl: null,
    imageAlt: 'Skyler banyoda net odakta, karnını tutuyor; arka planda Walter bulanık şekilde yatağın kenarında oturuyor.',
  }),
  block('SECTION_TEXT', 'scene-3', {
    content: P(
      `Sosyal psikolojide adı konmuş bir eğilim var: insanlar başkalarının davranışını açıklarken, o kişinin içinde bulunduğu koşulları değil, kişiliğini suçlama eğilimindeler. Yani biri bir şey yapmışsa, bunun sebebi "öyle bir durumdaydı" değil, "öyle biri" olmasıdır diye düşünülüyor. Breaking Bad bu eğilimi seyircide neredeyse mühendislik ürünü gibi tetikliyor, çünkü hikâye baştan sona Walter'ın gözünden anlatılıyor. Walter'ın işlediği her cinayet "başka çaresi yoktu" diye okunuyor, çünkü onun korkusunu, gururunu, kanserini içeriden biliyoruz. Skyler'ın soru sorması ise sadece huyu sayılıyor, çünkü onun neden endişelendiğini içeriden hiç görmüyoruz.`,
      `Ama bunun altında daha da temel bir hikâye anlatma tercihi yatıyor. Normalde bir hikâyede kötü adam, kahramanın yoluna çıkıp onu amacından saptırmaya çalışan taraftır; seyirci o engeli aşmasını ister. Breaking Bad bu kalıbı tersine çeviriyor: burada amacına ulaşmaya çalışan taraf, yasa dışı yoldan para kazanmaya çalışan Walter, ve onun önündeki engel de karısı Skyler. Yapı aynı kalıyor, sadece roller yer değiştiriyor — ve seyirci bu kalıba o kadar alışkın ki, kimin "kahraman" kimin "engel" olduğunu sorgulamadan Walter'ın tarafında yer alıyor. Walter'ın bir sonraki satışının, bir sonraki planının başarılı olmasını istiyoruz; sanki suçu onunla birlikte biz işliyormuşuz gibi bir ortaklık kuruyoruz. Skyler'ın araya girmesi de bu yüzden bir anne kaygısı değil, planı bozan bir tehdit gibi hissettiriyor bize — tıpkı bir soygun filminde işi bozmaya çalışan bir yan karakter gibi.`,
      `Bunun küçük ama çarpıcı bir örneği dizinin ilk sezonunda var. Walter kemoterapiyi reddedince Skyler bir aile toplantısı düzenleyip onu ikna etmeye çalışıyor. Ama beklenenin aksine kız kardeşi Marie ve eniştesi Hank, Skyler'ı değil Walter'ı destekliyor; Marie radyoloji teknisyeni olarak hastanede gördüğü kanser hastalarının çoğu zaman tedaviden fayda değil acı çektiğini söylüyor. Yani Skyler bu sahnede kendi ailesi tarafından bile yalnız bırakılıyor — üstelik sonunda haklı çıkacağı bir konuda. Bu da onu bir kontrol manyağı olmaktan çok, kimsenin dinlemediği ama sonunda doğru çıkan bir sesin sahibi yapıyor.`,
      `İlginç olan şu ki dizinin yaratıcısı Vince Gilligan bile yıllar sonra bunu kabul ediyor. 2018'de katıldığı bir söyleşide, hikâyenin Walter sahnede olmadığı zamanlarda bile yine onun bakış açısından yazıldığını, yazım sürecinin baştan itibaren Walter lehine kurulduğunu itiraf ediyor. Yani seyircinin Skyler'ı değil Walter'ı haklı bulması, kadının gerçekten yanılmasından değil, hikâyenin hangi karakterin gözünden anlatıldığından kaynaklanıyor.`
    ),
  }),

  block('SECTION_HEADING', 'scene-4', { content: 'Kusur' }),
  block('IMAGE', 'scene-4', {
    imageUrl: 'https://image.tmdb.org/t/p/original/oySKXO1DAvWObqGAfrxEX7iV43L.jpg',
    imageAlt: 'Skyler, elindeki para destesine endişeyle bakıyor.',
  }),
  block('SECTION_TEXT', 'scene-4', {
    content: P(
      `Bunu söylerken Skyler'ı hatasız göstermek de doğru olmaz, çünkü dizi de böyle bir şey iddia etmiyor. Skyler, eski işvereni Ted Beneke ile bir ilişki yaşıyor. Walter'ın uyuşturucu parasının bir kısmını gizlice Ted'e ulaştırıyor. Ted'i tehdit ettirmek için adam gönderiyor, bu da adamın ağır şekilde yaralanmasına yol açıyor. Bunlar gerçek olaylar ve üstünkörü geçilmemesi gerekiyor.`,
      `Aldatma meselesine genelde intikam gözüyle bakılıyor, ama olayın geçtiği bölüme ("I.F.T.") yakından bakıldığında ortaya biraz farklı bir tablo çıkıyor. Walter uyuşturucu parasıyla eve geri döndüğünde ve bu parayla Skyler'ı yeniden kendine bağlamaya çalıştığında, Skyler'ın verdiği tepki bir aşk itirafından çok, "beni bu parayla geri satın alamazsın" demenin bir yolu gibi görünüyor. Yani bu bir aşk hikâyesi değil, köşeye sıkışmış birinin elindeki son hamle.`,
      `Ama olayın kendisinden bağımsız olarak, seyircinin buna verdiği tepkiyi de ayrıca konuşmak gerekiyor. Bir kadın karakter aldattığı anda, seyircinin zihninde otomatik olarak devreye giren hazır bir kalıp var: "aldatan kadın." Bu kalıp, aynı şeyi yapan bir erkek karakterden çok daha ağır bir ahlaki yargıyla değerlendiriliyor — sadakatsizlik neredeyse tek başına bir kadın karakteri sempatik olmaktan çıkarmaya yetiyor, oysa erkek karakterlerde bu genelde onlarca kusurdan sadece biri sayılıyor. Skyler'ın o ana kadar yaşadığı hiçbir şey (kanser, yalanlar, tehlike, çaresizlik) bu tek sahne kadar ona zarar vermiyor; sanki önceki üç sezonun tüm bağlamı bu kalıp devreye girer girmez siliniyor.`,
      `Ted'e giden para meselesi ise Skyler'ın gerçekten savunulması zor bir kararı. Saul üzerinden, Lüksemburg'da öldüğü söylenen hayali bir akrabadan miras kaldığı yalanıyla Ted'e Walter'ın parasından ciddi bir miktar gönderiliyor; amaç adamın vergi borcunu kapatması. Ama Ted bu parayla borcunu ödemek yerine yeni bir araba kiralayıp işini yeniden açıyor. Ödemeyi reddedince Skyler, Saul'un adamlarını göndererek onu çek imzalamaya zorlatıyor, adam da bu sırada düşüp ağır yaralanıyor. Bunun mazereti yok, ama bağlamı var: bu olaylar tam da Skyler'ın ailesinin bir kartel tarafından tehdit edildiği, eldeki tüm nakdin neredeyse tükendiği bir haftaya denk geliyor. Yani bu, kötü bir insanın kötü bir kararı değil, köşeye sıkışmış birinin sertleşen eli.`
    ),
  }),

  block('SECTION_HEADING', 'scene-5', { content: 'Simetri' }),
  block('IMAGE', 'scene-5', {
    imageUrl: 'https://image.tmdb.org/t/p/original/zfUECD3RhKQ72cXE3JZTpPW5lEL.jpg',
    imageAlt: 'Skyler\u0027ın kararlı ve sert bakışlı bir yakın plan portresi.',
  }),
  block('SECTION_TEXT', 'scene-5', {
    content: P(
      `Burada basit bir düşünce deneyi yapmak faydalı olabilir: rolleri tersine çevirelim. Gizlice uyuşturucu üreten, yalan söyleyen taraf koca değil karı olsaydı; şüphelenip soru soran, çocukları korumaya çalışan taraf da karı değil koca olsaydı — o adam dırdırcı, keyif kaçıran biri olarak mı görülürdü, yoksa ailesini bir arada tutmaya çalışan makul taraf olarak mı? Muhtemelen ikincisi. Bu da gösteriyor ki mesele hiçbir zaman gerçekten Skyler'ın ne yaptığı değildi, kimin bakış açısından anlatıldığıydı.`,
      `Dizinin kendi içinde bile bu çifte standardın küçük bir örneği var. Marie'nin yıllardır süregelen gerçek bir hırsızlık — kleptomani — alışkanlığı var, sahiden mağazalardan eşya çalıyor, sahiden yakalanıyor. Ama seyirci ona kızmıyor, tam tersine bunu sevimli bir kusur olarak görüyor. Skyler'ın kusurları aynı hoşgörüyle karşılanmıyor. Anna Gunn, kendisine yönelen tehditlerin ardından kaleme aldığı bir makalede benzer bir kıyası daha büyük bir ölçekte yapıyor: Skyler'ı, kocalarının çok daha ağır suçlarına göz yuman The Sopranos'taki Carmela ve Mad Men'deki Betty ile karşılaştırıyor ve bu iki karakterin Skyler'ın maruz kaldığı düzeyde bir öfkeyle karşılaşmadığını belirtiyor.`,
      `Az önce bahsettiğim akademik çalışma da benzer bir sonuca varıyor. Seyirci söylemindeki en yaygın pozisyonlardan biri, araştırmacıların doğrudan mizojini olarak adlandırdığı bir kamusal utandırma biçimi. Yani Skyler'ın asıl "suçu", belki de sessiz kalmayı ve yan karakter rolünü kabullenmeyi reddetmesiydi.`
    ),
  }),

  block('SECTION_HEADING', 'scene-6', { content: 'Kapanan Kapılar' }),
  block('IMAGE', 'scene-6', {
    imageUrl: 'https://image.tmdb.org/t/p/original/zxcf3ER2rzU9IxCxJEhCCw1MyT.jpg',
    imageAlt: "Skyler, doğum günü partisi sırasında üstü giyinik hâlde havuza giriyor.",
  }),
  block('SECTION_TEXT', 'scene-6', {
    content: P(
      `Davranışsal iktisatta bilinen bir kavram var: batık maliyet tuzağı. Bir şeye ne kadar çok yatırım yapmışsanız, ondan vazgeçmek o kadar zor görünür — mantıksızca, çünkü geçmişte harcanan şey aslında gelecekteki kararı etkilememesi gerekir, ama pratikte etkiler. Skyler'ın hikâyesinde de her sezon bir çıkış yolu daha kapanıyor. Önce hamileliği var, ayrılmayı zorlaştırıyor. Sonra evde büyük miktarda para birikiyor, bunu ele vermek ailesinin sonunu getirebilir. Sonra çok fazla şey öğreniyor, artık temiz bir şekilde çekilip gidemiyor. Sonra parayı kendi elleriyle aklamayı öğreniyor, bu da onu hukuken de suça ortak ediyor. Yani Skyler kötüye doğru kaymıyor; her seferinde elinde kalan tek seçenek, ödeyebileceğinden daha pahalı hale geldiği için kayıyor.`,
      `Dizinin havuz sahnesi de bu kapanan kapılar zincirinin bir parçası, ama genelde sanıldığından farklı bir sebeple. Skyler'ın Walter'ın doğum günü partisinde üstü giyinik hâlde havuza girmesi çoğu seyirci tarafından gerçek bir intihar girişimi olarak hatırlanır. Ama sahneye ve sonrasına yakından bakıldığında ortaya daha hesaplı bir tablo çıkıyor: Skyler'ın asıl amacı, Hank ve Marie'yi çocukları evden uzaklaştırmaya ikna etmek. Kendini gerçekten boğmaya çalışmıyor; kız kardeşiyle eniştesini harekete geçirecek kadar şok edici bir görüntü yaratıyor. Yani bu sahne bir çöküşün değil, elinden başka hiçbir araç kalmamış birinin çocuklarını tehlikeli bir evden çıkarmak için başvurduğu son derece riskli ama bilinçli bir manevranın görüntüsü.`
    ),
  }),

  block('SECTION_HEADING', 'scene-7', { content: 'İtiraf' }),
  block('IMAGE', 'scene-7', {
    imageUrl: 'https://image.tmdb.org/t/p/original/DfqmT2Gel4YPqMLiphjesPcbIU.jpg',
    imageAlt: 'Skyler telefonda dehşet dolu bir ifadeyle konuşuyor.',
  }),
  block('SECTION_TEXT', 'scene-7', {
    content: P(
      `Son sezonda dizi kendi söylediklerini iki kez doğruluyor. Önce mutfakta geçen bir sahnede, Skyler kendi evinde, oğlunun gözü önünde elinde bıçakla kocasının karşısına çıkıyor; burada müzik onu bir keyif kaçıran gibi göstermiyor, sadece gerçek korkuyu gösteriyor. Sonra bir telefon görüşmesinde, Walter polisin dinlediğini bildiği hatta Skyler'a bağırıp tüm suçu üstleniyor — çünkü asıl amacı dinleyen polise "o benden korkuyordu, başka seçeneği yoktu" mesajını vermek. Kendi ağzından çıkan bu sahte öfke, aslında dizinin baştan beri gösterdiği gerçeğin resmi kabulü.`,
      `Bunun daha erken, daha sessiz bir örneği de var. Bir akşam Skyler salona girdiğinde çocuklarını Walter'la birlikte Scarface izlerken buluyor; ekranda tam da kurduğu türden bir imparatorluğun sonunda silahlarla çöken bir adamın hikâyesi anlatılıyor. Walter gülümsüyor, çocuklar heyecanlanıyor. Ama Skyler'ın yüzündeki korku, o filmi bir eğlence değil bir uyarı olarak okuyan tek kişiye ait.`
    ),
  }),

  block('VERDICT_TEXT', 'verdict', {
    content: `Sonuçta ortaya çıkan tablo şu: Skyler White nefret edildi çünkü yanılmıştı diye değil, bir gücün büyüme fantazisinin tam ortasında hâlâ gerçekçi kalan tek kişi olduğu için. Ona duyulan öfke aslında hiçbir zaman onun hakkında bir yargı değildi — kimi sevip kimi affettiğimiz konusunda bizim kendimiz hakkında verdiğimiz bir ipucuydu.`,
  }),
];

const title = 'Skyler White Aslında Neden Haklıydı?';
const kicker = 'DERİN OKUMA';
const axis =
  "Skyler White'ı seyirci yanlış bulduğu için sevmedi — hikâyenin ona haklı olma izni vermediği bir anda haklı çıktığı için sevmedi.";

const body = {
  title,
  titleTr: title,
  kicker,
  kickerTr: kicker,
  axis,
  axisTr: axis,
  // Kapak henüz Cloudinary'de değil — ikinci adımda güncellenecek (Anna Gunn
  // stüdyo portresi, d:/İndirilenler/...pin-id-478226054155762872.jpg).
  imageUrl: null,
  imageUrlLarge: null,
  imageAlt: 'Anna Gunn, Skyler White rolünde stüdyo portresinde.',
  imageAltTr: 'Anna Gunn, Skyler White rolünde stüdyo portresinde.',
  spoilerThroughSeasonNumber: null,
  spoilerThroughEpisodeNumber: null,
  recommendedRank: null,
  spoilerFree: true,
  status: 'PUBLISHED',
  publishedAt: new Date().toISOString(),
  format: 'CHARACTER',
  readingTimeMinutes: 9,
  // Breaking Bad: subjectType SERIES, subjectId 5, franchiseId 2 — canlı
  // /api/blogs/300 ("from-green-to-black") kaydından doğrulandı.
  tags: [{ subjectType: 'SERIES', subjectId: 5, seasonNumber: null, episodeNumber: null, franchiseId: null }],
  blocks,
};

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  writeFileSync(resolve('scripts/output/skyler-blog-body.json'), JSON.stringify(body, null, 2));
  console.log(`Blok sayısı: ${blocks.length}`);
  console.log('Gövde scripts/output/skyler-blog-body.json dosyasına yazıldı.');

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
  writeFileSync(resolve('scripts/output/skyler-blog-response.json'), JSON.stringify(data, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
