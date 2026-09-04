#!/usr/bin/env node
// "Kumların Arasında Bir Kral" / "A King Among the Sands" (Ozymandias
// derin okuma) — scripts/lib/blog-publish.mjs'i kullanan GENERİC örnek.
// Önceki create-ozymandias-blog.mjs'in YERİNE geçti: (1) content/contentTr
// artık GERÇEKTEN iki ayrı dil (base=EN, *Tr=TR — BlogPost.data.js'teki
// pickLocale kuralıyla birebir), (2) "Heykel" sahnesindeki İKİNCİ IMAGE
// bloğu kaldırıldı (parseBlogBlocks her sceneKey için TEK photo tutuyor,
// ikinci IMAGE birinciyi sessizce eziyordu — kullanıcı raporu "heykelli
// görsel neden yok"), (3) tüm görseller Cloudinary'de (kalan 2 TMDB URL'i
// de bu çalıştırmada taşınıyor), (4) imageAlt'ler literal açıklama değil,
// metnin kendi diliyle yazıldı.
//
// Kullanım (PowerShell):
//   node scripts/blogs/ozymandias.mjs --blog-id 302                (dry-run)
//   node scripts/blogs/ozymandias.mjs --blog-id 302 --write        (gerçek PUT)

import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const block = createBlockBuilder();

// Zaten Cloudinary'de olan 5 görsel (2026-09-01'de yüklendi) — tekrar
// yüklenmesin diye type: 'cloudinary' ile aynen geçiriliyor.
const images = {
  cover: {
    type: 'remote',
    src: 'https://image.tmdb.org/t/p/original/k80r5JYO4LLrPJbWDXmlg7IxRMI.jpg',
    hint: 'ozymandias-cover',
  },
  offer: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1788212741/fandoom/blog/xrhjrejhmtkzmdctegd4.jpg',
  },
  statue: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1788212743/fandoom/blog/jqlrzrdcnlghhgb9q2wf.jpg',
  },
  beetle: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1788212744/fandoom/blog/t9o6qcmwjngctem6ex51.jpg',
  },
  house: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1788212745/fandoom/blog/stoiqavptdf7c7oy5zh2.jpg',
  },
  performance: {
    type: 'remote',
    src: 'https://image.tmdb.org/t/p/original/3cEVM4peZW2r2HiKVzxDjmBLJxD.jpg',
    hint: 'ozymandias-performance',
  },
  verdict: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1788212747/fandoom/blog/ak8r2jk5hxtwghh8nyad.jpg',
  },
};

function buildBlocks(img) {
  return [
    block('LEDE_TEXT', 'lede', {
      en: P(
        `Every few centuries, a king believes so completely in his own immortality that he has it carved into stone: "Look on my works, ye Mighty, and despair!" Then the wind blows, the sand piles up, and all that survives is the inscription itself — with nothing left to read it, and nothing left to defend. The idea has repeated itself twice already: first in a poem, in 1818, then in a television episode, in 2013, and then again this past February, among the fans defending that episode's own reputation. All three tell the same story; let's start with the second.`,
        `The first shot of Breaking Bad's "Ozymandias" isn't a shootout — it's a flashback. Walt and Jesse's first cook, the inside of the RV; Walt's on the phone to Skyler, talking about the second child they haven't had yet. It's a short scene, but something about it lingers: Walt's shirt merges with the trees, his legs with the dirt, and the camera frames him less as a man than as part of the landscape. Then the scene ends, the RV and Jesse vanish from the picture, and only the desert is left — which is more or less what the poem we'll come back to is about. First, though, the fight that follows this quiet opening.`
      ),
      tr: P(
        `Her birkaç yüzyılda bir, bir kral kendi ölümsüzlüğüne öyle bir inanır ki bunu taşa kazıtır: "Eserlerime bakın, ey güçlüler, ve umutsuzluğa kapılın." Sonra rüzgâr eser, kum birikir, ve geriye sadece o yazı kalır — okuyacak kimse, savunacak hiçbir eser olmadan. Bu fikir kendini üç kere tekrarladı: önce 1818'de bir şiirde, sonra 2013'te bir televizyon bölümünde, sonra da geçtiğimiz Şubat'ta, o bölümün kendi ününü savunan hayranların arasında. Üçü de aynı hikâyeyi anlatıyor; biz ikincisinden başlayalım.`,
        `Breaking Bad'in "Ozymandias" bölümü açılırken karşımıza çıkan ilk kare bir çatışma değil, bir flashback. Walt ve Jesse'nin ilk pişirişleri, karavanın içi; Walt telefonda Skyler'la konuşuyor, henüz doğmamış ikinci çocuklarından bahsediyorlar. Sahne kısa ama bir şey dikkat çekiyor: Walt'ın gömleği ağaçlarla, bacakları toprakla neredeyse bütünleşmiş, kamera onu bir insan değil bir manzaranın parçası gibi gösteriyor. Sonra sahne bitiyor, karavan ve Jesse görüntüden siliniyor, geriye sadece çöl kalıyor — az sonra tekrar döneceğimiz şiirin dediği tam olarak bu. Ama önce bu sessiz açılışın hemen ardından gelen çatışmaya bakalım.`
      ),
    }),

    block('SECTION_HEADING', 'scene-1', { en: 'The Offer', tr: 'Teklif' }),
    block('IMAGE', 'scene-1', {
      imageUrl: img.offer,
      altEn: "Hank Schrader, defiant to the last, refuses the price Walt puts on his life.",
      altTr: 'Hank Schrader, sonuna kadar meydan okuyarak Walt’ın hayatına biçtiği fiyatı reddediyor.',
    }),
    block('SECTION_TEXT', 'scene-1', {
      en: `We rejoin the story mid-firefight. Hank's been shot in the leg, and once Jack's crew realise he's DEA, they move to execute him. Walt steps in — kinship first, then the only currency he has left: eighty million dollars, buried, for Hank's life. Hank's answer is short, and it names exactly what the offer misses: "You're the smartest guy I ever met, and you're too stupid to see he made up his mind ten minutes ago." His last words to Jack are shorter still:`,
      tr: `Normal akışa döndüğümüzde karşımıza çıkan bir çatışmanın ortası. Hank bacağından vurulmuş durumda, Jack'in çetesi onu narkotik olduğunu anlayınca infaz etmeye kalkıyor. Walt araya giriyor, önce akrabalık bağını öne sürüyor, sonra elindeki en büyük kozu masaya sürüyor: seksen milyon dolar, Hank'in hayatı karşılığında. Hank'in cevabı kısa ve tam da bu teklifin neyi kaçırdığını gösteriyor: "Sen tanıdığım en zeki adamsın, ama onun on dakika önce karar verdiğini görmeyecek kadar da aptalsın." Jack'e son sözü daha da kısa:`,
    }),
    block('QUOTE', 'scene-1', { en: '"Do what you\'re gonna do."', tr: '"Yapacağın neyse yap."' }),
    block('SECTION_TEXT', 'scene-1', { en: 'He dies without begging.', tr: 'Yalvarmadan ölüyor.' }),

    block('SECTION_HEADING', 'scene-2', { en: 'The Statue', tr: 'Heykel' }),
    block('IMAGE', 'scene-2', {
      imageUrl: img.statue,
      altEn: 'A broken stone king and a broken man lie in the same desert, in the same pose.',
      altTr: 'Kırık bir taş kral ile kırık bir adam, aynı çölde, aynı pozda yatıyor.',
    }),
    block('SECTION_TEXT', 'scene-2', {
      en: `The guns go off, and as Hank falls into the red dirt, Walt goes down too — not in one motion, but stage by stage, the camera tracking him the whole way. Director Rian Johnson built that collapse deliberately to echo a statue: the one that inspired the poem the episode is named after, a once-colossal king now lying broken in the desert. Percy Bysshe Shelley wrote that poem in 1818; its pedestal still carries the old warning:`,
      tr: `Silahlar patlıyor, Hank kızıl toprağa düşerken Walt da dizlerinin üstüne çöküyor — ama bir anda değil, aşama aşama, kamera onu adım adım izliyor. Yönetmen Rian Johnson bu çöküşü bilerek bir heykelin parçalanmasına benzetiyor: bölümün adını aldığı şiire ilham veren, bir zamanlar Mısır'da devasa bir kral heykelinin şimdi çölde kırık yattığı görüntüsüne. Percy Bysshe Shelley bu şiiri 1818'de yazmış; heykelin kaidesinde hâlâ o eski uyarı duruyor:`,
    }),
    block('QUOTE', 'scene-2', {
      en: '"Look on my works, ye Mighty, and despair!"',
      tr: '"Eserlerime bakın, ey güçlüler, ve umutsuzluğa kapılın."',
    }),
    block('SECTION_TEXT', 'scene-2', {
      en: `Except nothing's left to look at — only "the lone and level sands", stretching away. Walt is standing in exactly that spot: he assumed the size of his fortune could buy off death, and he's only now learning that nature and fate don't take payment. When the camera settles on his face, there's no Heisenberg left in it, and no family man either — just a wrecked expression, half-buried in sand, while eighty million dollars, the very fortune he told the world to tremble at, gets dug back out of the ground by his enemies.`,
      tr: `Ama etrafta bakılacak hiçbir eser kalmamış, sadece "ıssız ve düz kumlar, uzağa doğru uzanıyor." Walt da tam olarak bu konumda: eserinin büyüklüğüyle ölümü satın alabileceğini sanmış, ama doğanın ve kaderin karşısında paranın hiçbir hükmü olmadığını şimdi öğreniyor. Kamera yüzüne kilitlendiğinde artık orada ne Heisenberg var ne bir aile babası — kumların arasında yarı gömülü, darmadağın bir çehre uzanıyor sadece, ve seksen milyon dolar, "titreyin" dediği o büyük eser, düşmanları tarafından topraktan bir bir çıkarılıyor.`,
    }),
    block('SECTION_TEXT', 'scene-2', {
      en: `Even as his pride collapses, Heisenberg wants to take someone down with him. As Jesse's loaded into the car, Walt leans in and admits he watched Jane die — the last blow to an already-shattered body. Walt isn't just physically ruined by this point. He's morally ruined too.`,
      tr: `Kibri yıkılırken bile Heisenberg yanına birini sürüklemek istiyor. Jesse arabaya bindirilirken Walt yanına eğiliyor, Jane'in ölümünü izlediğini itiraf ediyor — yıkılan gövdeye inen son balyoz darbesi. Walt artık sadece fiziksel değil, ahlaki olarak da bir enkaz.`,
    }),

    block('SECTION_HEADING', 'scene-3', { en: 'The Beetle', tr: 'Böcek' }),
    block('IMAGE', 'scene-3', {
      imageUrl: img.beetle,
      altEn: "What's left of an empire: one barrel of cash, and a man pushing it through the sand.",
      altTr: 'Bir imparatorluktan geriye kalan: bir varil para, ve onu kumda iten bir adam.',
    }),
    block('SECTION_TEXT', 'scene-3', {
      en: `A stray bullet hits the truck's fuel tank mid-firefight, and Walt's left in the middle of the desert with the one barrel of cash he has left, rolling it across the sand — a man who once built empires, reduced to something closer to a dung beetle dragging its own filth behind it. Shelley's colossal ruin has shrunk down to a barrel of money and the wreck of a man pushing it.`,
      tr: `Çatışma sırasında bir kurşun kamyonetin benzin deposuna isabet ediyor. Walt çölün ortasında elinde kalan tek variyle baş başa kalıyor, yuvarlayarak sürüklemeye çalışıyor — bir zamanlar imparatorluklar kuran adam, şimdi kendi pisliğinden örülü bir yükü sürükleyen bir bok böceği kadar küçülmüş. Shelley'nin dev harabesi artık sadece bir varil paradan ve onu sürükleyen bir zavallıdan ibaret.`,
    }),
    block('SECTION_TEXT', 'scene-3', {
      en: `Walt buys a truck off an old man in the desert and starts driving home. Meanwhile Marie corners Skyler like a general accepting a surrender, offering help on exactly one condition: full confession, and the truth for Junior. Skyler tells him. He's devastated — he doesn't want to believe his parents lied to him.`,
      tr: `Walt çölün ortasında yaşlı bir adamdan bir kamyonet satın alıp eve doğru yola çıkıyor. Bu sırada Marie, Skyler'ın yanına zafer kazanmış bir komutan edasıyla gidiyor — Walt'ın yakalandığını sanıyor. Skyler'a yardım etmesi için tek bir şart koşuyor: itirafları yapması ve Junior'a her şeyi anlatması. Skyler anlatıyor da; Junior hayal kırıklığına uğruyor, anne babasının ona yalan söylediğine inanmak istemiyor.`,
    }),

    block('SECTION_HEADING', 'scene-4', { en: 'The House', tr: 'Ev' }),
    block('IMAGE', 'scene-4', {
      imageUrl: img.house,
      altEn: 'A family holds together on the living-room floor, in the same second it comes apart.',
      altTr: 'Bir aile, dağıldığı aynı saniyede, oturma odasının zemininde birbirine tutunuyor.',
    }),
    block('SECTION_TEXT', 'scene-4', {
      en: `By the time Walt gets home, he knows this is his last chance to grab what he can and run. Skyler and Junior walk in on him mid-packing; he tells them to do the same. Skyler senses something's wrong: "Where's Hank?" Walt's answer comes out as a whisper:`,
      tr: `Walter eve ulaştığında bütün eşyalarını toplayıp kaçmak için son fırsatı olduğunun farkında. Skyler ve Junior eve geldiğinde telaşla eşyalarını toplarken onlara da aynısını yapmalarını söylüyor. Skyler bir şeylerin ters gittiğini anlıyor: "Hank nerede?" Walt'ın cevabı fısıltıyla geliyor:`,
    }),
    block('QUOTE', 'scene-4', { en: '"I tried to save him."', tr: '"Onu kurtarmaya çalıştım."' }),
    block('SECTION_TEXT', 'scene-4', {
      en: `It's the last twitch of an empire already in the ground. For Skyler, Walt stops being her children's father in this moment and becomes the man who brought ruin down on her family. She grabs a knife from the kitchen. As the two of them fight on the floor, Junior tackles his own father and calls the police to protect his mother. Pinned down by his own son, reported like a criminal, Walt understands that his kingdom hasn't just fallen in the desert — it's fallen apart in his own living room.`,
      tr: `Yıkılan bir imparatorluğun enkazı altında kalan son bir çırpınıştan ibaret bu cümle. Skyler için Walt artık çocuklarının babası değil, ailesine yıkım getiren tiran. Mutfaktan bir bıçak kapıyor. İkisi yerde boğuşurken Junior babasının üstüne atılıyor, annesini korumak için polisi arıyor. Kendi oğlu tarafından yere bastırılan ve bir suçlu gibi ihbar edilen Walt, o an krallığının sadece çölde değil kendi evinin salonunda da yerle bir olduğunu anlıyor.`,
    }),

    block('SECTION_HEADING', 'scene-5', { en: 'The Performance', tr: 'Performans' }),
    block('IMAGE', 'scene-5', {
      imageUrl: img.performance,
      altEn: 'Every word on this call is chosen — even the ones that sound like rage.',
      altTr: 'Bu görüşmedeki her kelime seçilmiş — öfkeymiş gibi duyulanlar bile.',
    }),
    block('SECTION_TEXT', 'scene-5', {
      en: `Walt drives off with his daughter. In one shot the baby babbles "Mama" in the background, unscripted, and it stops him cold — the moment he realises he can't give this child a mother's safety, no matter what empire he's built. What follows is the phone call. Walt rings Skyler from the side of the road, knowing the police are listening in the house. He screams that everything is her fault, that she never appreciated him, that he did all of it alone.`,
      tr: `Walter kızını kaçırarak evden uzaklaşıyor. Bir sahnede bebeğin "anne" diye sayıklaması Walt'ı durduruyor — o an, bu bebeğe bir annenin şefkatini, huzurunu, güvenliğini verebilecek kişi olmadığını görüyor. Hemen ardından o meşhur telefon konuşması geliyor: Walt bir yol kenarından Skyler'ı arıyor, evde polislerin dinlediğini bilerek. Her şeyin suçlusunun Skyler olduğunu haykırıyor, onu hiçbir zaman takdir etmediğini söylüyor, her şeyi tek başına yaptığını iddia ediyor.`,
    }),
    block('SECTION_TEXT', 'scene-5', {
      en: `The scene has two readings. In the first, it's a genuine outburst — Walt really does blame Skyler, still hunting for someone to punish even as his own pride lies in ruins. In the second, it's a performance: Walt knows the line is tapped, and he chooses every word to cast Skyler as a victim and clear her of any legal complicity. We lean towards the second reading, without fully ruling out the first — he's crying as he says it, but it doesn't read as the tears of a man in a rage. It reads as a man who's accepted what's coming, who's about to hand over his daughter, and who's using his last few minutes to keep his wife safe. In that call, Walt isn't only saving Skyler. He's sacrificing the Heisenberg legend he spent five seasons building.`,
      tr: `Bu sahnenin iki okuması var. Birincisine göre gerçek bir öfke patlaması — Walt gerçekten Skyler'ı suçluyor, kibrinin enkazı altında kalırken bile bir günah keçisi arıyor. İkincisine göre bu bir performans: Walt hattın dinlendiğini biliyor, her cümleyi Skyler'ı mağdur gösterecek, onu hukuki suç ortaklığından kurtaracak şekilde seçiyor. Bize göre doğru okuma ikincisine daha yakın — konuşurken ağlıyor, ama bu sinirden köpüren bir adamın ağlaması değil, olanı kabullenmiş, kızını teslim edecek ve karısını güvende tutmaya çalışan bir adamın konuşması. O görüşmede Walt sadece Skyler'ı kurtarmıyor, kendi inşa ettiği Heisenberg efsanesini de kurban ediyor.`,
    }),

    block('SECTION_HEADING', 'scene-6', { en: 'Sands', tr: 'Kumlar' }),
    block('SECTION_TEXT', 'scene-6', {
      en: `Leaving his daughter at a fire station — back where she belongs — Walt gives up the last fragment of his authority. Back home, the chessboard he's left behind sits in a position where the white king can never win: the "fallen king" idea worked into the smallest detail of the set. He gets in the truck, starts it, drives off. The last thing he sees in the rear-view mirror is an empty desert, scoured by wind — the exact image of Shelley's closing lines: "the lone and level sands stretch far away."`,
      tr: `Kızı Holly'yi bir itfaiye istasyonuna, ait olduğu dünyaya bıraktığında Walt elinde kalan son hükümranlık parçasından da feragat ediyor. Evde bıraktığı satranç tahtasında beyaz şah, kasıtlı olarak asla kazanamayacağı bir dizilişte duruyor — "düşen kral" fikri setin en küçük ayrıntısına kadar işlenmiş. Kamyonetine döner, çalıştırır, uzaklaşır. Dikiz aynasına son kez baktığında gördüğü tek şey rüzgârın savurduğu boş bir çöl — Shelley'nin son mısralarının görsel karşılığı: "yalnız ve düz uzanıyor kumlar."`,
    }),

    block('SECTION_HEADING', 'scene-7', { en: 'Sand, Once More', tr: 'Kum Bir Kez Daha' }),
    block('SECTION_TEXT', 'scene-7', {
      en: `That brings us to the idea's third repetition. When the episode aired in 2013, it became the first TV episode ever to score a perfect 10 on IMDb, and held that title alone for thirteen years. There's a neat irony buried in that number: an episode about the lie of permanence spent over a decade holding one of the internet's most permanent titles. Then, in February 2026, the title was taken away — and the way it happened looks uncomfortably like the episode's own story.`,
      tr: `Fikrin üçüncü tekrarına geldik. Bölüm 2013'te yayınlandığında IMDb'de 10 puan alan ilk TV bölümü oluyor ve bu unvanı on üç yıl boyunca kimseyle paylaşmıyor. Bu rakam aslında bölümün kendi temasına karşı garip bir ironi kuruyor: kalıcılığın yalan olduğunu anlatan bir bölüm, internetin en kalıcı unvanlarından birini yıllarca elinde tutuyor. Sonra 2026 Şubat'ında bu unvan da elinden alınıyor — ve alınış şekli, bölümün kendi hikâyesine rahatsız edici kadar benziyor.`,
    }),
    block('SECTION_TEXT', 'scene-7', {
      en: `HBO's new Dunk and Egg spin-off, *A Knight of the Seven Kingdoms*, premiered in January 2026. Its fifth episode, "In the Name of the Mother", aired on 15 February and started pulling in thousands of 10/10 votes, threatening Ozymandias's record. Breaking Bad fans hit back by giving a show they'd never watched a 1 — one user openly admitted, "I've never seen this show, but I'm giving it a 1 out of loyalty to Breaking Bad." Knight fans returned fire on Ozymandias; the score dropped to 9.9, then 9.8, and the thirteen-year record was gone. The fight got ugly enough that a completely unrelated finale — Six Feet Under's "Everyone's Waiting" — briefly ended up sitting at the top of IMDb instead.`,
      tr: `HBO'nun Dunk & Egg hikâyelerini uyarlayan yeni spin-off'u *A Knight of the Seven Kingdoms* 2026 Ocak'ında yayına giriyor. Dizinin 15 Şubat'ta yayınlanan beşinci bölümü "In the Name of the Mother" binlerce 10/10 oyla Ozymandias'ın rekorunu tehdit etmeye başlıyor. Breaking Bad hayranları buna, hiç izlemedikleri bir diziye 1 puan vererek karşılık veriyor — bir kullanıcının kendi itirafıyla, "bu diziyi hiç izlemedim ama Breaking Bad'e sadakatimden 1 veriyorum." Knight hayranları aynı silahla Ozymandias'ı vuruyor; bölüm önce 9,9'a, sonra 9,8'e düşüyor ve on üç yıllık unvanını kaybediyor. Kavga o kadar çirkinleşiyor ki sonunda ikisiyle de hiç ilgisi olmayan üçüncü bir yapım — *Six Feet Under*'ın final bölümü "Everyone's Waiting" — kısa süreliğine IMDb zirvesine oturuyor.`,
    }),
    block('SECTION_TEXT', 'scene-7', {
      en: `And there, right there, the poem steps outside the screen and repeats itself one more time. Both fandoms tried to get their favourite episode crowned the greatest of all time by defending a number, a title, a pedestal — and in defending it, both of them lost. Ozymandias lost its record, Knight's launch got buried under a story about vandalism, and the only winner to come out of it was an unrelated third episode nobody was fighting over. The king who said "Look on my works, ye Mighty, and despair!" never saw his own pedestal lying broken in the sand; the fan bombing one show's rating to defend another's forgets, in exactly the same way, that what they're defending is a piece of art and not a number. Neither Breaking Bad nor Knight is the real loser in that fight — it's the capacity to actually be a fan of something, sitting behind both of them.`,
      tr: `İşte tam burada şiir, ekranın dışına taşıp kendini bir kez daha tekrar ediyor. İki hayran kitlesi de kendi sevdiği bölümü tarihin "en iyisi" ilan ettirmek için bir rakamı, bir unvanı, bir kaideyi savundu — ve bunu savunurken ikisi de kaybetti. Ozymandias'ın rekoru gitti, Knight'ın lansmanı bir vandalizm hikâyesine gömüldü, ortaya çıkan tek kazanan ilgisiz bir üçüncü bölüm oldu. "Eserlerime bakın, ey güçlüler, ve umutsuzluğa kapılın" diyen kral, kaidesinin çölde kırık yattığını görmüyordu; bir puanı savunmak için diğerini bombalayan hayran da savunduğu şeyin bir sayı değil bir eser olduğunu unutuyor. Bu savaşta gerçek kaybeden ne Breaking Bad ne de Knight — ikisinin arkasında duran, bir işe gerçekten hayran olabilme kapasitesi.`,
    }),
    block('IMAGE', 'verdict', {
      imageUrl: img.verdict,
      altEn: "Different names, same fall — the desert doesn't keep track of which king it was.",
      altTr: 'Farklı isimler, aynı düşüş — çöl hangi kralın olduğunu ayırt etmez.',
    }),
    block('VERDICT_TEXT', 'verdict', { en: 'The sand always wins.', tr: 'Kazanan her zaman kum.' }),
  ];
}

const meta = {
  titleEn: 'A King Among the Sands',
  titleTr: 'Kumların Arasında Bir Kral',
  kickerEn: 'DEEP READING',
  kickerTr: 'DERİN OKUMA',
  axisEn:
    "You don't need television's highest-rated episode to watch an empire fall — you need a poem.",
  axisTr:
    "Bir imparatorluğun çöküşünü izlemek için IMDb'nin en yüksek puanlı bölümüne ihtiyacınız yok — bir şiire ihtiyacınız var.",
  imageUrlLarge: null, // resolveImages sonrası cover ile dolduruluyor (aşağıda)
  imageAltEn: 'Walter White stands in the desert, stunned, the ruin of his empire only just beginning to register.',
  imageAltTr: 'Walter White çölde, imparatorluğunun çöküşünü henüz kavrayamamış şaşkın bir ifadeyle duruyor.',
  spoilerThroughSeasonNumber: 5,
  spoilerThroughEpisodeNumber: 14,
  recommendedRank: null,
  status: 'DRAFT',
  format: 'ANALYSIS',
  readingTimeMinutes: 7,
  imageKey: 'cover',
  tags: [{ subjectType: 'SERIES', subjectId: 5, seasonNumber: 5, episodeNumber: 14, franchiseId: null }],
};

await publishBlog({ outputName: 'ozymandias', meta, buildBlocks, images });
