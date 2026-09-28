#!/usr/bin/env node
// "Kim Kime Parazit?" (Parasite derin okuma) — scripts/lib/blog-publish.mjs'i
// kullanan generic blog script. Kaynak: docs_dev/blog-drafts/parazit-kim-kime.md
// (TR onaylı, EN yeniden yazım, kullanıcı revizyonlarıyla son hâli).
//
// Şema notları:
//  - ### alt başlıklar (Merdivenler/Yağmur, Ki-taek/Ki-jung) kendi görseli
//    olduğu için ayrı SECTION_HEADING sahnesi olarak açıldı (black-swan
//    script'indeki aynı kural).
//  - Görseller TMDb'den Cloudinary'ye önceden taşındı (bkz.
//    scripts/output/parazit-kim-kime-images.json, scripts/upload-parazit-blog-images.mjs).
//  - Pull-quote yok (taslakta 0 tutuldu); Sonuç'un son paragrafı VERDICT_TEXT.
//
// Kullanım (PowerShell):
//   node scripts/blogs/parazit-kim-kime.mjs                       (dry-run)
//   node scripts/blogs/parazit-kim-kime.mjs --write               (yeni POST, PUBLISHED)

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const block = createBlockBuilder();

const uploaded = JSON.parse(readFileSync(resolve('scripts/output/parazit-kim-kime-images.json'), 'utf8'));
const images = Object.fromEntries(
  Object.entries(uploaded).map(([key, src]) => [key, { type: 'cloudinary', src }])
);

function buildBlocks(img) {
  return [
    block('LEDE_TEXT', 'lede', {
      en: P(
        "The Kims spend the film's opening minutes hunting for a signal. They wave their phones near the ceiling and pace every corner of the flat, chasing the one spot where they can still borrow the café next door's unsecured wifi. It is a small rehearsal for everything that follows: a family staying afloat by quietly tapping into somebody else's supply. As the film goes on, though, the question starts running the other way. Who is the parasite here, the one stealing the signal, or the one who left it unlocked?",
        "Bong Joon-ho has always moved easily between genres, and Parasite folds comedy, family drama and thriller into the same scene, often into the same line. That blending is tied directly to the film's real question, because the more the categories overlap, the harder the parasite question gets to answer. The label passes in turn from the Kims to the Parks, and eventually to a third family hidden in the basement. Maybe the real issue is this: why does the relationship keep having to be built as a parasitic one at all?"
      ),
      tr: P(
        "Filmin ilk sahnesinde Kim ailesi bir sinyal arıyor. Telefonlarını tavana doğru kaldırıp evin her köşesini dolaşıyorlar, komşu kafenin şifresiz kalmış wifi'sine bağlanabilecekleri tek noktayı bulana kadar. Bu görüntü, önümüzdeki iki saat boyunca izleyeceğimiz her şeyin küçük bir provası: bir aile, başkasının kaynağına gizlice sızarak ayakta kalıyor. Ama film ilerledikçe aynı soru tersinden de sorulmaya başlıyor. Sinyali çalan mı asalak, yoksa şifresini korumadan bırakan mı?",
        "Bong Joon-ho'nun kariyeri zaten türler arasında rahatça dolaşan bir kariyer; Parasite de komedi, aile dramı ve gerilimi aynı sahnede, çoğu zaman aynı repliğin içinde birleştiriyor. Bu tür karışıklığı doğrudan filmin sorusuyla bağlantılı, çünkü kategoriler iç içe geçtikçe parazit kim sorusunun cevabı da karmaşıklaşır. Film boyunca bu unvan sırayla Kim ailesine, Park ailesine, hatta evin bodrumunda saklanan üçüncü bir aileye geçiyor. Asıl mesele belki de şu: ilişkinin kendisi neden hep parazitçe kurulmak zorunda kalıyor?"
      ),
    }),
    block('IMAGE', 'lede', {
      imageUrl: img.wifi,
      altEn: 'Ki-jung and Ki-woo searching for a wifi signal in their cramped bathroom.',
      altTr: "Ki-jung ve Ki-woo, dar banyoda wifi sinyali arıyor.",
    }),

    block('SECTION_HEADING', 'scene-1', { en: 'Two Houses', tr: 'İki Ev' }),
    block('IMAGE', 'scene-1', {
      imageUrl: img.parkEvi,
      altEn: "The Park family's architect-designed house at dusk.",
      altTr: 'Park ailesinin mimar imzalı evi, alacakaranlıkta.',
    }),
    block('SECTION_TEXT', 'scene-1', {
      en: P(
        "The Kims live in a semi-basement flat: from the window you can see feet passing at street level, a drunk man relieves himself against the wall at night, and folding pizza boxes brings in the day's income.",
        "The Parks live higher up the city, in a house with an architect's signature on it, a garden, a ride-on mower, a bespoke camping tent for their son. The house itself behaves almost like a character: wide glass, a tidy garden, and beneath it a shelter not even its owner fully knows about. The two families share a city but hardly share an orbit.",
        'The overlap starts with a tip from Ki-woo\'s friend Min: the Parks need someone to tutor their daughter in English. Ki-woo, who has never actually enrolled at university, gets the job on a forged certificate, then brings his sister Ki-jung into the house as "Jessica," an art therapist. Four people slip into one house under four separate identities.'
      ),
      tr: P(
        'Kim ailesi bir yarı bodrumda yaşıyor: pencereden sokak seviyesindeki ayaklar görünüyor, geceleri bir sarhoş gelip duvara işiyor, pizza kutusu katlayarak günlük kazanç çıkarıyorlar.',
        'Park ailesi ise şehrin daha yüksek bir noktasında, mimarının imzasını taşıyan bir evde yaşıyor; bahçesi, çim biçme makinesi, oğulları için özel bir kamp çadırı var. Evin kendisi neredeyse bir karakter gibi davranıyor: geniş camları, düzenli bahçesi ve altında kimsenin bilmediği bir sığınağıyla, sahibinin bile tam olarak tanımadığı bir yapı. İki aile aynı şehirde yaşıyor ama neredeyse hiç kesişmeyen iki yörüngede dönüyorlar.',
        'Kesişme, Ki-woo\'nun arkadaşı Min\'in ona bıraktığı bir referansla başlıyor: Park ailesinin kızına İngilizce dersi verecek birine ihtiyaçları var. Ki-woo, üniversiteye hiç kayıt olmamış olsa da sahte bir belgeyle işe giriyor, ardından kardeşi Ki-jung\'u "sanat terapisti Jessica" kimliğiyle eve sokuyor. Dört kişilik aile, dört ayrı kimlikle aynı eve sızıyor.'
      ),
    }),
    block('IMAGE', 'scene-1', {
      imageUrl: img.seftali,
      altEn: "Ki-jung holding a peach, the prop behind the housekeeper's staged allergy.",
      altTr: 'Ki-jung elinde bir şeftaliyle, hizmetçinin sahte alerjisinde kullanılan nesne.',
    }),
    block('SECTION_TEXT', 'scene-1', {
      en: P(
        "The methods for getting rid of the driver and the housekeeper show how deliberate this infiltration is. The driver Yoon is discredited with a planted clue; the housekeeper Moon-gwang gets a darker exit, her peach allergy staged to look like tuberculosis and shown to Yeon-kyo, who fires her the same day out of fear for her son's health. Neither of them has actually done anything; they simply stop suiting the day's need. This is where the Kims' real skill shows: reading exactly what a household will believe, what it fears, and building the one scene that triggers that fear.",
        "It is not hard to see why Yeon-kyo never notices the infiltration. Her trust in her family is so complete that it never crosses her mind that four strangers walking into her house might know each other. That naivety produces some of the film's funniest moments, but it also sharpens the question underneath: if the Parks are this exposed, is the family that has taken on the job of protecting them a threat, or is it filling a gap the house never noticed it had? Without the Kims, the therapy, the tutoring, the driving would all be missing. A parasite is a creature that weakens its host; is this house instead one that has grown too dependent on that same family to survive without being fed?"
      ),
      tr: P(
        'Şoförle hizmetçiyi işten çıkartma yöntemleri de bu sızmanın ne kadar sistemli düşünüldüğünü gösteriyor. Şoför Yoon, sahte bir ipucuyla gözden düşürülüyor; hizmetçi Moon-gwang içinse daha karanlık bir yol seçiliyor: şeftali alerjisi keşfedilip verem belirtisiymiş gibi sahnelenip Yeon-kyo\'ya gösteriliyor, çocuğun sağlığından korkan anne kadını aynı gün kapı dışarı ediyor. İkisinde de kurban, gerçekten bir şey yapmamış, sadece o günkü ihtiyaca uygun düşmemiş insanlar. Kim ailesinin becerisi burada ortaya çıkıyor: bir evin neye inanacağını, neyden korkacağını önceden okuyup tam o korkuyu tetikleyecek sahneyi kurmak.',
        'Yeon-kyo\'nun bu sızmayı fark etmemesinin nedeni açık. Ailesine dair güveni öyle mutlak ki, evine giren dört yabancının birbirini tanıdığını aklının ucundan bile geçirmiyor. Bu saflık bazen filmin en komik anlarını üretiyor, ama aynı zamanda soruyu da güçlendiriyor: Park ailesi bu kadar savunmasızsa, koruyucusu olmayı üstlenen Kim ailesi gerçekten bir tehdit mi, yoksa evin zaten göremediği bir boşluğu mu dolduruyor? Kim ailesi olmadan bu ev, çocuğun terapisi, kızın dersi, kocanın şoförlüğü, hepsi eksik kalırdı. Parazit, konağını zayıflatan canlıdır; ama bu ev, konağı beslemeden yaşayamayacak kadar ona bağımlı hale gelmiş bir aileye mi ev sahipliği yapıyor?'
      ),
    }),

    block('SECTION_HEADING', 'scene-2', { en: 'Smell', tr: 'Koku' }),
    block('SECTION_TEXT', 'scene-2', {
      en: P(
        'Mr. Park\'s nose functions almost like a character in its own right. He mentions Ki-taek\'s smell in the car, calls it "the smell of people who ride the subway," and says it as though stating a plain fact. Yeon-kyo is more guarded about it: she wrinkles her nose but never puts a name to it.',
        'George Orwell makes a striking admission in The Road to Wigan Pier: one of the things drilled into him as a child was the belief that the lower classes genuinely smelled, and he writes that this idea cut deeper than any other class prejudice he was taught. Wealth, education, accent, all of these can change; smell feels as if it clings to the body itself, something almost impossible to shed. Parasite stages the same observation sixty years later, on another continent, with the same crudeness.',
        "Where does the Kims' smell actually come from? The damp air of the semi-basement, the insecticide sprayed on the street, the detergent soaked into their clothes. The smell, in other words, is a mark the place they live leaves on the body. To Mr. Park that distinction is beside the point; for him, smell is a matter of identity, full stop."
      ),
      tr: P(
        'Bay Park\'ın burnu, filmde neredeyse ayrı bir karakter gibi çalışıyor. Arabada Ki-taek\'in kokusundan söz ediyor, "metroya binenlerin kokusu" diyor, bunu düz bir gerçeklik gibi telaffuz eder. Yeon-kyo ise daha örtük davranıyor: burnunu kırıştırıyor, ama adını hiç koymuyor.',
        'George Orwell, İngiliz sınıf sistemini anlattığı The Road to Wigan Pier\'de çarpıcı bir itirafta bulunur: kendi çocukluğunda ona öğretilen şeylerden biri, alt sınıfların gerçekten koktuğu inancıydı, ve bu inancın diğer tüm sınıf önyargılarından daha derine işlediğini yazar. Çünkü zenginlik, eğitim, aksan, hepsi değişebilir; ama koku bedenin kendisine yapışıyormuş gibi hissettiriyor, ondan kurtulmak neredeyse imkansız görünüyor. Parasite bu gözlemi altmış yıl sonra, başka bir kıtada, aynı ilkellikte tekrar sahneye koyuyor.',
        'Kim ailesinin kokusu aslında nereden geliyor? Yarı bodrumun nemli havasından, sokakta ilaçlanan haşerelerden, üstlerine sinen deterjandan. Yani koku, yaşadıkları yerin bedene bıraktığı bir iz. Ama Bay Park için bu ayrım önemsiz; ona göre koku doğrudan bir kimlik meselesi.'
      ),
    }),
    block('IMAGE', 'scene-2', {
      imageUrl: img.hayalet,
      altEn: 'The figure young Da-song once saw peering out from the kitchen shelves.',
      altTr: "Küçük Da-song'un bir zamanlar mutfak dolabından gördüğü figür.",
    }),
    block('SECTION_TEXT', 'scene-2', {
      en: P(
        'Young Da-song carries the same motif somewhere else entirely. Years earlier the boy saw a "ghost" in the dark kitchen and went into shock, and the family has told the story ever since as a trauma case. At his birthday party, Da-song notices how similar the new driver smells to the former housekeeper and says so out loud, and nobody in the room understands what he means. The audience does: the ghost he saw was the housekeeper\'s husband, sneaking up from the basement into the kitchen. The boy\'s nose makes a connection the adults\' eyes cannot, that the same poverty leaves the same smell, whatever body happens to be carrying it.',
        "By the film's end that observation turns into a fatal trigger. The moment Mr. Park wrinkles his nose is the moment years of swallowed humiliation finally erupt in Ki-taek. Smell becomes the one mark of class the film refuses to let anyone hide."
      ),
      tr: P(
        'Filmin küçük Da-song\'u bu motifi bambaşka bir yere taşıyor. Çocuk yıllar önce mutfakta karanlıkta bir "hayalet" görüp şoka girmiş, o günden beri aile bunu bir travma vakası olarak anlatır. Doğum günü partisinde Da-song, yeni şoförle eski hizmetçinin kokusunun birbirine ne kadar benzediğini fark edip bunu yüksek sesle söylüyor, kimse ne demek istediğini o an anlamıyor. Oysa izleyici biliyor: gördüğü hayalet, hizmetçinin kocasıydı, bodrumdan gizlice çıkıp mutfağa inmişti. Çocuğun burnu, yetişkinlerin gözünün göremediği bağlantıyı kuruyor; aynı yoksulluğun aynı kokuyu bıraktığını, hangi bedenin taşıdığından bağımsız olarak fark ediyor.',
        'Filmin sonuna doğru bu tespit, tam da bu yüzden ölümcül bir tetiğe dönüşüyor: Bay Park\'ın burnunu kırıştırdığı o son an, Ki-taek\'in yıllarca yutkunduğu bir aşağılanmanın patladığı andır. Koku burada sınıfın kendini gizleyemeyen tek işaretine dönüşüyor.'
      ),
    }),

    block('SECTION_HEADING', 'scene-3', { en: 'The Stone', tr: 'Taş' }),
    block('IMAGE', 'scene-3', {
      imageUrl: img.tas,
      altEn: 'Ki-taek holding the suseok stone at the family table.',
      altTr: 'Ki-taek, aile masasında suseok taşını tutuyor.',
    }),
    block('SECTION_TEXT', 'scene-3', {
      en: P(
        'Min brings the Kims a suseok, a "scholar\'s stone" said to bring good fortune, and hands it over laughing. The stone looks heavy, but the ease with which Ki-woo carries it one-handed gives something away: it does not carry the weight of a genuine suseok, and is probably an imitation, something manufactured on a production line. The hope walking into the family\'s home is exactly that, something that resembles the real thing without ever carrying its actual worth.',
        'As the film goes on, the stone flips its own job. Ki-woo barely lets it out of his sight, and when he runs into the man hidden in the basement he grabs it like a weapon. The stone gets taken from him and used against him instead, brought down on his own head; it does not kill him, perhaps precisely because of that same fakeness, because it never carried a real rock\'s weight. When the flood submerges the family\'s home, it is telling that the one thing Ki-woo saves is this stone: the one object pulled from a drowning house is a symbol of wealth that will never actually make them rich.',
        "Near the end Ki-woo leaves the stone in a stream, trying to be rid of it. But it keeps resurfacing on the water, as if refusing to let him go. If an object can cling to a person this stubbornly, can what it promises turn out to be just as hard to shake? Hope itself sometimes becomes a weight nobody can put down; Ki-woo's stone is that possibility made small enough to carry."
      ),
      tr: P(
        'Min, Kim ailesine bir suseok, bir "şans taşı" getiriyor. Ailenin maddi bereket görmesini dilediğini söylüyor, gülerek. Taş ağır görünüyor ama Ki-woo\'nun onu tek elle bu kadar rahat taşıması bir şeyi ele veriyor: gerçek bir suseok\'un ağırlığını taşımıyor bu taş, muhtemelen taklit, imal edilmiş bir şey. Ailenin evine giren umut da tam olarak bu: gerçeğe benzeyen ama asıl değerini hiç taşımayan bir maket.',
        'Ama film ilerledikçe bu taş görevini tersine çevirir. Ki-woo evden neredeyse hiç ayırmıyor onu, bodrumdaki gizli sakinle karşılaştığında da onu bir silah gibi kavrıyor. Taş elinden alınıp tam da ona karşı kullanılıyor, kafasına indiriliyor; ama onu öldürmüyor, belki de tam bu sahteliği sayesinde, gerçek bir kayanın ağırlığını hiç taşımadığı için. Sel gecesi ailenin evi sular altında kaldığında Ki-woo\'nun kurtardığı tek eşyanın bu taş olması manidar: batan evden çıkarılan tek şey, onları asla zengin etmeyecek bir umut sembolü.',
        'Sonda Ki-woo taşı bir derede bırakıyor, kurtulmaya çalışıyor ondan. Ama taş suyun üstünde belirmeye devam ediyor, sanki peşini bırakmıyor. Bir nesne insana bu kadar sıkı yapışabiliyorsa, o nesnenin vaat ettiği şey de aynı ölçüde yapışkan olabilir mi? Umudun kendisi bazen bırakılamayan bir yüke dönüşüyor; Ki-woo\'nun taşı, tam da bu ihtimalin küçük ve taşınabilir bir hali.'
      ),
    }),

    block('SECTION_HEADING', 'scene-4', { en: 'Stairs', tr: 'Merdivenler' }),
    block('IMAGE', 'scene-4', {
      imageUrl: img.merdiven,
      altEn: 'A long outdoor staircase in the pouring rain, on the night of the flood.',
      altTr: 'Sel gecesi, yağmur altında uzun bir dış merdiven.',
    }),
    block('SECTION_TEXT', 'scene-4', {
      en: P(
        "The film's geography runs on a vertical axis. Reaching the Parks' house means climbing, step by step; reaching the Kims' neighbourhood is always a downward motion. On the night of the flood this direction has never been clearer: the Kims leave the Parks' house and, in the pouring rain, cross stairwells, streets and underpasses, dropping to a lower level at every turn until they reach home. The camera never once lets them rise.",
        'That descent proves just as unbroken during the escape itself: as they cross the upper layers of the city they never stop anywhere, because there is no middle tier left for them to stop on. Is class really a staircase? The film seems to accept the metaphor, with one condition: the staircase only runs one way, and the steps that fall to this family are built to make going down easier than going up.'
      ),
      tr: P(
        'Filmin coğrafyası dikey kuruluyor. Park ailesinin evine adım adım tırmanılıyor, Kim ailesinin mahallesine ulaşmaksa hep bir alçalma hareketi. Sel gecesi bu yön hiç bu kadar net görülmemişti: Kim ailesi Park evinden çıkıp yağmurun altında merdivenleri, sokakları, tünelleri geçerek kendi mahallelerine varana kadar sürekli daha alt bir kotaya geçiyor. Kamera onları hiçbir noktada yükselirken göstermiyor.',
        'Sel gecesi bu inişin ne kadar kesintisiz olduğu daha da netleşiyor: şehrin üst katmanlarından geçerken hiçbir yerde durmuyorlar, çünkü durabilecekleri hiçbir ara kat yok. Sınıf gerçekten bir merdiven mi? Film bu benzetmeyi kabul ediyor gibi görünüyor ama bir şartla: merdiven tek yönlü çalışmıyor, bu ailenin payına düşen basamaklar hep inişi kolaylaştıracak şekilde kurulu.'
      ),
    }),

    block('SECTION_HEADING', 'scene-5', { en: 'Rain', tr: 'Yağmur' }),
    block('IMAGE', 'scene-5', {
      imageUrl: img.firtina,
      altEn: "The Park family watches the storm from the comfort of their living room.",
      altTr: 'Park ailesi, fırtınayı salonlarının konforundan izliyor.',
    }),
    block('SECTION_TEXT', 'scene-5', {
      en: P(
        "The same night, the same rain, means something entirely different to each family. For the Parks, the cancelled camping trip turns into an unexpected evening on a warm sofa. For the Kims, the same rain floods their home with sewage and swallows their belongings, their beds, nearly everything they own."
      ),
      tr: P(
        'Aynı gece, aynı yağmur, iki aile için tamamen farklı bir şey ifade ediyor. Park ailesi için kamp iptal olur ve bu, evin sıcacık kanepesinde geçirilecek beklenmedik bir akşama dönüşür. Kim ailesi için ise aynı yağmur, evlerini tuvalet suyuyla dolduran, eşyalarını, yataklarını, hayatlarının neredeyse tamamını yutan bir sel oluyor.'
      ),
    }),
    block('IMAGE', 'scene-5', {
      imageUrl: img.banyo,
      altEn: "The Kims' bathroom submerged by the flood, Ki-jung perched on the toilet.",
      altTr: 'Sel basmış Kim ailesi banyosu, Ki-jung klozetin üstünde.',
    }),
    block('SECTION_TEXT', 'scene-5', {
      en: P(
        "The next morning Yeon-kyo mentions, in a voice utterly unbothered, that the rain has made the weather so lovely she is moving her son's birthday party into the garden. At that same moment the Kims are lying on a gym floor under borrowed blankets, having lost everything. The same event turns into two different stories depending on which class it lands in, a weather report for one, a matter of survival for the other. The climate itself may behave equally toward everyone; inequality is what distributes it so differently."
      ),
      tr: P(
        'Yeon-kyo ertesi sabah, "yağmur sayesinde hava öyle güzel ki" diyerek oğlunun doğum günü partisini bahçeye taşımaktan söz ediyor, tamamen kayıtsız bir sesle. O sırada Kim ailesi, bir spor salonunun zemininde battaniyeyle uyumuş, her şeylerini kaybetmiş halde bulunuyor. Aynı olay iki farklı sınıfa girdiğinde iki farklı hikâyeye dönüşüyor: biri için hava durumu haberi, diğeri için hayatta kalma meselesi. İklimin kendisi eşit davranıyor olabilir, ama eşitsizlik onu farklı şekillerde dağıtıyor.'
      ),
    }),
    block('IMAGE', 'scene-5', {
      imageUrl: img.yagmurMerdiven,
      altEn: "Ki-jung, soaked, on the stairs during the family's escape through the rain.",
      altTr: 'Yağmurda ıslanmış Ki-jung, ailenin kaçış merdiveninde.',
    }),
    block('SECTION_TEXT', 'scene-5', {
      en: P(
        'This compression of time carries its own comment. Less than twenty-four hours separate the Kims losing everything overnight from the Parks throwing a sunlit garden party the following afternoon. That short distance between disaster and celebration shows two worlds sharing a calendar without ever moving at the same speed.'
      ),
      tr: P(
        'Zaman çizelgesindeki bu sıkışma da kendi başına bir yorum taşıyor. Kim ailesinin bir gecede her şeyini kaybetmesiyle Park ailesinin ertesi öğlen güneşli bir bahçe partisi vermesi arasında yirmi dört saatten az bir süre var. Felaket ile kutlama arasında geçen bu kısa mesafe, iki dünyanın aynı takvimde ama hiç aynı hızda yaşamadığını gösteriyor.'
      ),
    }),

    block('SECTION_HEADING', 'scene-6', { en: 'The Iron', tr: 'Ütü' }),
    block('IMAGE', 'scene-6', {
      imageUrl: img.utu,
      altEn: "The Kim family drinking in the Parks' living room on the night of the flood.",
      altTr: 'Sel gecesi, Kim ailesi Park evinin salonunda içki içiyor.',
    }),
    block('SECTION_TEXT', 'scene-6', {
      en: P(
        'There is a line from the film people tend to remember. Sitting alone in the Parks\' house on the night of the flood, Chung-sook watches Yeon-kyo and remarks that she is rich and still so genuinely nice. Ki-taek corrects her: the woman is this relaxed and kind because she is rich, money works like an iron, smoothing out every crease in a person. The line is memorable, but the film disproves it with its own hands that same night. Once the Kims catch Moon-gwang and her husband in the basement, they show no solidarity at all toward a couple even poorer than themselves: they film them on a phone to use as blackmail, tie them up to keep them quiet, and the moment power lands in their hands they do exactly what the Parks did to them, only harder.',
        'The question also works in reverse: if the Kims had been the rich ones, would they really have behaved any better? The film answers this one directly too. In the few hours they hold money, power and control, the Kims do exactly what the Parks do; their treatment of Moon-gwang and her husband is harsher still, because this time their own survival depends on that harshness. Change the position and the behaviour changes with it, instantly, whichever family happens to hold it. Kindness, here, looks like a luxury available to whoever holds power, one the rich have simply never needed to spend.'
      ),
      tr: P(
        'Filmin sık hatırlanan bir cümlesi var. Kim ailesi sel gecesi Park evinde tek başlarına otururken Chung-sook, Yeon-kyo\'yu izleyip "zengin ama hâlâ bu kadar saf, iyi biri" der. Ki-taek bunu düzeltir: kadının bu kadar rahat ve nazik olmasının sebebi zengin olması, para tam bir ütü gibi çalışıp insandaki bütün kırışıklıkları düzeltiyor. Cümle akılda kalıcı, ama film bunu aynı gece kendi eliyle çürütür. Moon-gwang\'ı ve kocasını bodrumda yakalayan Kim ailesi, kendilerinden bile daha yoksul bu çifte hiçbir dayanışma göstermiyor: telefonla çekim yapıp bunu tehdit malzemesi olarak kullanıyor, ikisini bağlayıp susturuyor, güç ellerine geçer geçmez tam da Park ailesinin onlara yaptığını, hatta daha sertini, uyguluyorlar. Yani kırışıklıkları asıl düzelten şey gücün kendisi: onu kim elinde tutarsa tutsun aynı sertliği üretiyor.',
        'Soruyu tersine çevirmek de mümkün: zengin olan Kim ailesi olsaydı, gerçekten daha iyi mi davranırlardı? Film bu soruyu da doğrudan cevaplıyor. Parayı, gücü, kontrolü ellerine aldıkları o birkaç saatte Kim ailesi tam olarak Park ailesinin yaptığını yapıyor; Moon-gwang\'la kocasına gösterdikleri tavır bundan da sert, çünkü bu sefer kendi hayatta kalmaları tam da o sertliğe bağlı. Konum değişince davranış da anında değişiyor, hangi aile olursa olsun. İyilik burada, güçlünün elinde bulunan ve henüz kullanmasına hiç gerek duymadığı bir lüks gibi görünüyor.'
      ),
    }),

    block('SECTION_HEADING', 'scene-7', { en: 'Two Acceptances', tr: 'İki Kabul' }),
    block('IMAGE', 'scene-7', {
      imageUrl: img.kan,
      altEn: "Blood spatters across the food at Da-song's birthday party.",
      altTr: 'Da-song\'un doğum günü partisinde, yemeğe sıçramış kan damlaları.',
    }),
    block('SECTION_TEXT', 'scene-7', {
      en: P(
        'The birthday party is the scene where two members of the Kim family pay, on the same afternoon, for the road each of them chose. Left alone in the basement after Moon-gwang\'s death, Geun-sae finally stops hiding and climbs the stairs into the middle of the garden crowd. Two siblings who had adapted to the system in two entirely different ways find themselves inside the same explosion within minutes of each other.'
      ),
      tr: P(
        'Doğum günü partisi, Kim ailesinin iki üyesinin de kendi seçtiği yolun bedelini aynı öğleden sonra ödediği sahne. Moon-gwang\'ın ölümünden sonra bodrumda tek başına kalan Geun-sae, artık saklanmayı bırakıp merdivenlerden yukarı, bahçedeki kalabalığın ortasına çıkıyor. O ana kadar iki farklı biçimde sisteme uyum sağlamış iki kardeş, aynı dakikalar içinde bu patlamanın içinde buluyor kendini.'
      ),
    }),

    block('SECTION_HEADING', 'scene-8', { en: 'Ki-taek', tr: 'Ki-taek' }),
    block('IMAGE', 'scene-8', {
      imageUrl: img.masaAlti,
      altEn: 'Ki-taek hiding beneath the coffee table, looking out.',
      altTr: 'Ki-taek, sehpanın altına saklanmış, dışarı bakıyor.',
    }),
    block('SECTION_TEXT', 'scene-8', {
      en: P(
        'The father is also the most passive member of the family. During the fumigation he never suggests shutting the windows, telling himself it is free pest control. Even when he cannot fold the pizza boxes properly, he learns without shame and adapts to the system. While the rest of the family calculates and schemes, Ki-taek mostly just watches, and accepts.',
        'That acceptance is punished by the end, in a strange reversal of what it seemed to buy him. Ki-taek snaps the moment Mr. Park wrinkles his nose, crossing a line he can never step back over. Then, even while hiding from the police, he returns to the exact basement he had spent years fleeing, to the shelter itself. Given a way out, he deliberately chooses the deepest hole instead. There is not much real distance between the Ki-taek at the start of the film and the one at the end; both carry the same silence, only in the first it is a way of surviving and in the second a way of hiding. When a person accepts their position this quietly, does that acceptance protect them, or is it exactly what traps them there?'
      ),
      tr: P(
        'Ailenin babası, aynı zamanda en pasif üyesi. Böcek ilaçlaması sırasında pencereleri kapatmayı önermiyor, "bedava ilaçlama" diye rahatlar. Pizza kutusu katlama işini düzgün yapamayınca bile utanmadan öğreniyor, sisteme adapte oluyor. Diğer aile fertleri hesap yaparken, plan kurarken, Ki-taek çoğu zaman sadece izler, kabul eder.',
        'Bu kabul filmin sonunda garip bir şekilde ödüllendirilmez, cezalandırılır. Ki-taek, Bay Park\'ın burnunu kırıştırdığı o anda patlıyor ve bir daha geri dönemeyeceği bir eşiği geçiyor. Sonra polisten saklanırken bile tam da yıllarca kaçtığı o bodruma, sığınağın kendisine geri döner. Kaçabileceği bir yol varken bilerek en dipteki deliği seçiyor. Filmin başındaki Ki-taek\'le sonundaki Ki-taek arasında aslında büyük bir fark yok; ikisi de aynı sessizliği taşıyor, sadece ilkinde bu sessizlik hayatta kalma, ikincisinde saklanma biçimine dönüşüyor. Bir insan kendi konumunu bu kadar sessizce kabullenirse, o kabul onu koruyor mu, yoksa tam da onu oraya hapseden şey mi oluyor?'
      ),
    }),

    block('SECTION_HEADING', 'scene-9', { en: 'Ki-jung', tr: 'Ki-jung' }),
    block('IMAGE', 'scene-9', {
      imageUrl: img.kiJungMerdiven,
      altEn: 'Ki-jung, tense, glancing back near the staircase.',
      altTr: 'Ki-jung, gergin bir ifadeyle merdiven yakınında arkasına bakıyor.',
    }),
    block('SECTION_TEXT', 'scene-9', {
      en: P(
        'The sister takes the opposite path. As "Jessica" she is the fastest, most skilled infiltrator of the four, forging her own documents and turning the art therapist role into the family\'s most convincing performance. In the first session she rattles off invented psychology terms about Da-song\'s childhood drawing with such total confidence that Yeon-kyo starts taking notes, though Ki-jung had only read and memorised them online minutes earlier. Even smoking in the bathroom, catching her own eye in the mirror, she never once breaks character.',
        "Yet the one who adapts best is also the one who dies first. When Geun-sae's knife goes into her, Ki-jung becomes the person who went deepest into the system and met its hardest recoil. Ki-taek's acceptance protects him up to a point; Ki-jung's skill never protects her at all. Does adapting to a system, past a certain point, stop being a safeguard and become a risk in itself?"
      ),
      tr: P(
        'Kız kardeş ise tam tersi bir yol izliyor. "Jessica" kimliğiyle sisteme en hızlı, en ustaca sızan o; sahte belgeyi kendisi hazırlıyor, sanat terapisti rolünü ailenin en inandırıcı performansına dönüştürüyor. İlk görüşmede Da-song\'un çocukluk çiziminden yola çıkıp uydurduğu psikoloji terimlerini o kadar kendinden emin sıralıyor ki, Yeon-kyo not almaya başlıyor; oysa Ki-jung o terimleri az önce internetten okuyup ezberlemiş. Bir sahnede tuvalette sigara içip aynadan kendine bakarken bile rolünün dışına hiç çıkmıyor.',
        'Ama en iyi adapte olan, filmde en erken ölen de o oluyor. Bodrumdan çıkan Geun-sae\'nin bıçağı ona saplandığında, Ki-jung sisteme en derin giren ve sistemin en sert geri tepmesiyle karşılaşan kişi haline gelir. Ki-taek\'in kabullenmesi onu bir yere kadar koruyor, Ki-jung\'un ustalığı ise onu hiç korumuyor. Sisteme uyum sağlamanın kendisi, bir noktadan sonra bir güvence olmaktan çıkıp bizzat riske mi dönüşüyor?'
      ),
    }),

    block('SECTION_HEADING', 'scene-10', { en: 'The Plan', tr: 'Plan' }),
    block('IMAGE', 'scene-10', {
      imageUrl: img.pencere,
      altEn: 'The barred semi-basement window, the same shot the film opened with.',
      altTr: 'Parmaklıklı yarı bodrum penceresi, filmin açılışıyla aynı kare.',
    }),
    block('SECTION_TEXT', 'scene-10', {
      en: P(
        "Ki-taek disappears after killing Mr. Park, and the police never find him. Months later Ki-woo notices the motion-sensor lights in the garden of what is now a different family's house blinking in a strange pattern at night; once he works it out, he realises it is Morse code from his father, that Ki-taek has been hiding in the same house's shelter the entire time. In one of the film's final scenes Ki-woo answers the message with a letter: he will make a great deal of money, buy the house, and all his father will have to do to walk free is climb the stairs.",
        "But the image confesses from the start that this plan will never happen. The camera cuts from the letter back to reality: Ki-woo is still in the same semi-basement, looking out through the same window, on a salary that could never save up that kind of money. The same boy who spent years, without ever actually enrolling, saying \"I'll try again next year\" is now building the same sentence on a far larger, far more desperate scale. The idea of climbing out of your class under capitalism lives in exactly this doubleness: offered to everyone as a door standing open, while staying a door that never opens for most of them. Is what fills that gap hope, or something that only resembles hope?"
      ),
      tr: P(
        'Ki-taek, Bay Park\'ı öldürdükten sonra ortadan kaybolur, polis onu bulamaz. Aylar sonra Ki-woo, evin artık başka bir aileye ait bahçesindeki hareket sensörlü lambaların geceleri tuhaf bir düzende yanıp söndüğünü fark ediyor; çözdüğünde bunun babasının Mors alfabesiyle gönderdiği bir mesaj olduğunu anlıyor, Ki-taek bütün bu süre boyunca aynı evin bodrumundaki sığınakta saklanmaktaymış. Filmin son sahnelerinden birinde Ki-woo bu mesaja bir mektupla cevap yazıyor: çok para kazanacağını, o evi satın alacağını, bodrumdan çıkması için tek yapması gerekenin merdivenlerden yukarı yürümek olacağını anlatıyor.',
        'Ama görüntü, bu planın hiçbir zaman gerçekleşmeyeceğini baştan itiraf ediyor. Kamera mektuptan gerçeğe dönüyor: Ki-woo hâlâ aynı yarı bodrumda, aynı pencereden aynı sokağı izliyor, o kadar para biriktirmesi hiç mümkün olmayan bir maaşla. Üniversiteye hiç kayıt olmadan yıllarca "gelecek sene deneyeceğim" diyen aynı çocuk şimdi aynı cümleyi daha büyük, daha çaresiz bir ölçekte kuruyor. Kapitalist bir toplumda sınıf atlama fikri tam da bu ikilikte yaşıyor: bir yandan herkese açık bir kapı gibi sunuluyor, öte yandan çoğu için hiç açılmayacak bir kapı olarak kalıyor. Bu boşluğu dolduran şey umut mu, yoksa umuda benzeyen bir teselli mi?'
      ),
    }),

    block('SECTION_TEXT', 'scene-11', {
      en: P(
        'In the end, the house Parasite shows us is simply the walls separating those who pay rent from those who do not. Smell, stone, stairs, rain, all of them are marks left along the same line. The film never lays the blame for that line on any one person, because we all keep redrawing it together, every day, without noticing.'
      ),
      tr: P(
        'Sonuçta Parasite\'ın gösterdiği ev, kirayı ödeyenle ödemeyeni ayıran duvarların kendisi. Koku, taş, merdiven, yağmur, hepsi aynı çizginin farklı yerlerinden geçen izler. Film bu çizgiyi kimin çizdiğini hiçbir zaman tek bir kişiye yüklemiyor, çünkü çizgiyi hep birlikte, fark etmeden, her gün yeniden çiziyoruz.'
      ),
    }),
    block('VERDICT_TEXT', 'verdict', {
      en: 'Both families stay dependent on each other throughout the film, neither able to stand entirely alone; but that mutual dependence never becomes an equal partnership, because one side can always choose not to notice the other exists. Maybe the real question is this: why can this relationship still only ever be built as a parasitic one?',
      tr: 'Film boyunca hem Kim hem Park ailesi birbirine muhtaç kalıyor, ikisi de yalnız başına ayakta duramıyor; ama bu karşılıklı bağımlılık hiçbir zaman eşit bir ortaklığa dönüşmüyor, çünkü taraflardan biri her zaman diğerinin varlığını fark etmemeyi seçebiliyor. Asıl soru belki de şu: bu ilişki neden hâlâ ancak parazitçe kurulabiliyor?',
    }),
  ];
}

const meta = {
  titleEn: "Who's the Parasite, and to Whom?",
  titleTr: 'Kim Kime Parazit?',
  kickerEn: 'DEEP READING',
  kickerTr: 'DERİN OKUMA',
  axisEn: "Who's the parasite in Parasite and who's the host? The film never settles on one answer, it keeps swapping the roles.",
  axisTr: "Parasite'ta kim asalak, kim ev sahibi? Film bu soruyu tek bir cevapta bırakmıyor, sürekli el değiştirtiyor.",
  imageUrl: null,
  imageUrlLarge: null,
  imageAltEn: 'The Kim family, together in their semi-basement flat, folding pizza boxes.',
  imageAltTr: 'Kim ailesi, yarı bodrum dairelerinde bir arada, pizza kutusu katlıyor.',
  // Film: sezon/bölüm kavramı yok. null => spoilerFree=true.
  spoilerThroughSeasonNumber: null,
  spoilerThroughEpisodeNumber: null,
  recommendedRank: null,
  status: 'PUBLISHED',
  format: 'ANALYSIS',
  readingTimeMinutes: 12,
  imageKey: 'cover',
  tags: [{ subjectType: 'MOVIE', subjectId: 8, seasonNumber: null, episodeNumber: null, franchiseId: null }],
};

await publishBlog({ outputName: 'parazit-kim-kime', meta, buildBlocks, images });
