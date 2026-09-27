#!/usr/bin/env node
// "Bir Evliliğin Otopsisi: Anatomy of a Fall" (derin okuma) — scripts/lib/
// blog-publish.mjs'i kullanan generic blog script. Kaynak: docs_dev/
// blog-drafts/anatomy-of-a-fall-evliligin-otopsisi.md (TR onaylı, EN yeniden
// yazım, kullanıcı onayı 2026-09-27).
//
// Şema notları:
//  - Şemada bölüm başına tek SECTION_HEADING ve tek IMAGE var (BlogPost.data.js
//    parseBlogBlocks). Taslaktaki "Zemin/Otopsi/Duymak/Sandra/Beraat/Sonuç"
//    üst başlıkları, görsel gelen her noktada yeni bir alt-sahne olarak açıldı
//    (black-swan-sanat-nina.mjs'deki aynı desen).
//  - GÖRSELLER HENÜZ ÇÖZÜLMEDİ: images map'indeki src alanları TODO. Kapak
//    görseli TEK istisna — filmin kendi coverImageUrl'i (zaten Cloudinary'de,
//    ayrı onay/yükleme gerektirmiyor) yeniden kullanıldı. Diğer 11 sahne
//    görseli TMDb'den araştırılıyor (web-researcher agent), kullanıcı onayı
//    sonrası buraya 'cloudinary' tipiyle işlenecek.
//  - DİKKAT: resolveImages() 'cloudinary' DIŞINDAKİ her type için GERÇEK
//    Cloudinary yüklemesi yapar — bu script --write olmadan bile çalıştırılırsa
//    src'si dolu olan görseller yüklenir. src'ler dolmadan ÇALIŞTIRMA.
//
// Kullanım (PowerShell):
//   node scripts/blogs/anatomy-of-a-fall-evliligin-otopsisi.mjs                       (dry-run, ama görselleri yükler)
//   node scripts/blogs/anatomy-of-a-fall-evliligin-otopsisi.mjs --write               (yeni POST, AYRI ONAY)
//   node scripts/blogs/anatomy-of-a-fall-evliligin-otopsisi.mjs --write --blog-id N   (PUT, blocks REPLACE-ALL)

import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const block = createBlockBuilder();

// Görseller: web-researcher'ın TMDb still araştırmasından (tümü gerçekten
// açılıp içerik doğrulandı, 2026-09-27), Cloudinary'ye TAŞINDI (bkz.
// scripts/output/anatomy-of-a-fall-evliligin-otopsisi-body.json), hepsi
// type: 'cloudinary' ile aynen geçiriliyor, tekrar yüklenmiyor.
// Bulunamayan/emin olunamayan kareler için en yakın tematik alternatif
// seçildi, alt metinler gerçekte görünenle sınırlı tutuldu (uydurma yok).
const images = {
  cover: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790507376/fandoom/home/vriuajn6zptzmlbroeke.jpg',
  },
  // Gerçek kar örtülü dış cephe TMDb'de yok; mahkemede kanıt olarak
  // gösterilen ev maketi en yakın tematik alternatif.
  house: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515211/fandoom/blog/rmimrzxysud0lr2yjey4.jpg' },
  night: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515212/fandoom/blog/pkbjapid5fuvoryiiurw.jpg' },
  tension: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515213/fandoom/blog/bhtggwgnovc9wwlgzsit.jpg' },
  jury: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515214/fandoom/blog/hzyvsybc0eauwmxsbb0r.jpg' },
  courtroom: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515215/fandoom/blog/hb4esnpispnka7ztdrro.jpg' },
  // Daniel'in ifade kürsüsü karesi bulunamadı; yakın çekim portresi kullanıldı.
  testimony: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515216/fandoom/blog/pf5ipehthkypnj7snqcv.jpg' },
  // Dış mekan yok, tek kaynak iç mekan.
  danielSnoop: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515217/fandoom/blog/azyens3dg3jjaoa4xm8k.jpg' },
  alone: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515218/fandoom/blog/yr5dyprxrizzdubvsobk.jpg' },
  closeup: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515219/fandoom/blog/g9eissfh19bf8kwprcad.jpg' },
  // Mahkeme çıkışı sahnesi filmde yok (gerçek final ev içi); karanlık bir
  // sarılma karesi "eve dönüş" temasına en yakın alternatif, kimlik net değil.
  exit: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515219/fandoom/blog/ye7vwg38gbenllfcgi0b.jpg' },
  // Kapanış: ikinci bir kar-dış-mekan karesi yok; adli röntgen görüntüsü
  // filmin "anatomi" temasıyla örtüştüğü için kapanış görseli olarak seçildi.
  houseWinter: { type: 'cloudinary', src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1790515220/fandoom/blog/p3o8xka9zdmukhoyjayr.jpg' },
};

function buildBlocks(img) {
  return [
    block('LEDE_TEXT', 'lede', {
      en: P(
        "Every trailer for Anatomy of a Fall asks the same question: who killed Samuel, his wife, himself, or nobody at all? The question never closes over the length of the film, and that is no accident, because Justine Triet's camera is really watching the years that lead up to the death. In a mountain house in the French Alps, with barely a neighbour in sight, a single body found in the snow becomes the starting point, yet what the case opens up is every layer of a marriage. The house's own isolation works as a clue in itself: a place too remote for any outside witness to reach, leaving what happened inside to four people and a dog. What ends up laid out in the middle of the courtroom is ten years of life between Sandra and Samuel. The word \"anatomy\" in the title fits for the same reason: what it dissects, layer by layer, right up to the fall, is a body, and in this case that body is a marriage."
      ),
      tr: P(
        "Anatomy of a Fall'ı tanıtan her fragman aynı soruyu sorar: Samuel'i kim öldürdü, karısı mı, kendisi mi, yoksa bir kaza mı? Film boyunca bu soru hiç kapanmaz ve kapanmaması da bir tesadüf sayılmaz, çünkü Justine Triet'nin kamerası esas olarak ölüme kadar geçen yılları izliyor. Fransız Alpleri'nde, dışarıdan neredeyse hiç komşusu görünmeyen bir dağ evinde, kar üstünde bulunan tek bir bedenden yola çıkılıyor ama açılan dosya bir evliliğin bütün katmanlarını gün yüzüne çıkarıyor. Evin kendi izolasyonu bile bir ipucu gibi duruyor: dışarıdan hiçbir tanığın ulaşamayacağı kadar uzak bir yer, içeride olanı yalnızca evin dört kişisine ve bir köpeğe bırakıyor. Mahkeme salonunun ortasına serilen, Sandra ile Samuel'in on yıllık birlikteliği. Filmin adındaki \"anatomi\" kelimesi de bu yüzden o düşüşe kadar katman katman açılan bir bedeni, bu durumda bir evliliği tarif ediyor."
      ),
    }),

    block('SECTION_HEADING', 'zemin-1', { en: 'Ground', tr: 'Zemin' }),
    block('IMAGE', 'zemin-1', {
      imageUrl: img.house,
      altEn: "A model of the family's mountain house, shown as evidence in court.",
      altTr: 'Ailenin dağ evini gösteren, mahkemede kanıt olarak sunulan maket.',
    }),
    block('SECTION_TEXT', 'zemin-1', {
      en: P(
        "Sandra Voyter is German, a successful novelist who feeds her fiction on her own life. Samuel Maleski is French, unable to finish the book he keeps meaning to write, earning his living as a teacher instead. The imbalance surfaces before a single word is exchanged, in the film's opening scene: a student comes to interview Sandra, and Samuel starts blasting the same instrumental track on loop from upstairs. The volume climbs until it cuts the interview short. Without a line of dialogue, Samuel has already thrown his first punch, straight through the floorboards.",
        "The argument that breaks this resentment wide open happens the day before he dies. In the recording Samuel secretly makes on his phone, he accuses Sandra of taking an idea he once told her, a piece of his own life, and folding it into one of her books. Watching the story he could never write succeed in someone else's hands, his own wife's hands of all people, feels to Samuel like being erased as a writer. Underneath the anger he directs at Sandra sits the plainer despair of a man who cannot build his own sentences."
      ),
      tr: P(
        "Sandra Voyter Alman, başarılı bir yazar, kendi hayatından beslenerek kurgu üretiyor. Samuel Maleski Fransız, yazmak istediği kitabı bir türlü bitiremiyor, geçimini öğretmenlikle sağlıyor. Bu dengesizlik daha kimse tek kelime etmeden filmin ilk sahnesinde ortaya çıkıyor: eve gelen bir öğrenci Sandra'yla röportaj yapmaya çalışırken Samuel üst kattan aniden yüksek sesle bir enstrümantal parçayı tekrar tekrar çalmaya başlıyor. Ses röportajı yarıda kestirecek kadar yükseliyor. Samuel hiçbir replik söylemeden, evin içine gönderdiği bu gürültüyle ilk yumruğunu atmış oluyor.",
        "Ölümünden bir gün önceki kavga bu kırgınlığın patladığı yer. Samuel, telefonuna gizlice kaydettiği bu tartışmada Sandra'yı kendisine anlattığı bir fikri, kendi hayatından bir parçayı alıp kitaplarından birine taşımakla suçluyor. Kendi yazamadığı hikâyenin bir başkasının elinde, üstelik en yakınındaki kişinin elinde başarıya dönüşmesi, Samuel için bir yazar olarak silinmek gibi bir şey. Sandra'ya duyduğu öfkenin altında aslında kendi cümlelerini bir türlü kuramamanın verdiği çaresizlik yatıyor."
      ),
    }),

    block('SECTION_HEADING', 'zemin-2', { en: 'Guilt', tr: 'Suçluluk' }),
    block('IMAGE', 'zemin-2', {
      imageUrl: img.night,
      altEn: 'Sandra crying, a dark, close frame.',
      altTr: 'Ağlayan Sandra, karanlık ve yakın bir kare.',
    }),
    block('SECTION_TEXT', 'zemin-2', {
      en: P(
        "Daniel's accident lands on top of that despair. On the day Samuel is meant to collect his son from school, he puts it off to the last minute rather than lose his writing time, arrives distracted and late, and Daniel loses his sight that afternoon. Samuel never manages to put the responsibility down; he sees himself as a failed writer and a neglectful father in the same breath. Can guilt hold a marriage together longer than love does? A good part of the anger Samuel turns on Sandra is this account with himself that never closes.",
        "It is Samuel's decision that moves the family to France, a wish to return to his own part of the world. Yet the one who gives up a settled life in England to move into this mountain house is also the one whose career keeps growing, while the fresh start Samuel was hoping for never quite arrives. Whoever makes the decision to relocate in a marriage, what ends up mattering is usually measured by who gave up more to get there.",
        "On top of that, the couple do not even share a native language. Sandra's French covers daily life but cannot carry an argument, while Samuel's English is a compromise learnt for the marriage's sake. Switching to English at home grows out of necessity, since neither of their own languages does any work in this house. If two people cannot reach each other in the same bed, raising the same child, without borrowing a language neither of them was born into, what translation could ever close the real distance between them?"
      ),
      tr: P(
        "Bu çaresizliğin üstüne bir de Daniel'in kazası biniyor. Oğlunu okuldan alması gereken gün kendi yazma saatini kaybetmemek için son ana bırakıyor, dikkati dağılmış halde geç kalıyor ve Daniel o gün gözünü kaybediyor. Samuel bu kazanın sorumluluğunu hiçbir zaman üzerinden atamıyor, kendini hem başarısız bir yazar hem ihmalkar bir baba olarak görüyor. Bir evlilikte suçluluk sevgiden daha kalıcı bir yapıştırıcı olabilir mi? Samuel'in Sandra'ya dönük öfkesinin önemli bir kısmı, kendi kendine kapanmayan bu hesabın dışa vurumu.",
        "Aileyi Fransa'ya taşıyan da Samuel'in kararı, kendi memleketine dönme isteği. Ama İngiltere'de kurulu bir hayatı bırakıp bu dağ evine yerleşen taraf yine kendi kariyerini büyütmeyi başarıyor, Samuel'in umduğu yeniden başlangıç ise bir türlü gerçekleşmiyor. Bir evlilikte taşınma kararını kim verirse versin, sonunda kimin kazandığı çoğu zaman kimin daha fazla vazgeçtiğiyle ölçülüyor.",
        "İkisinin ortak bir dili de yok üstelik. Sandra'nın Fransızcası günlük ihtiyacı karşılıyor ama bir tartışmayı taşımaya yetmiyor, Samuel'in İngilizcesi ise evlilik uğruna sonradan öğrenilmiş bir uzlaşma dili. Aile içi konuşmalarda İngilizceye geçmeleri bir mecburiyetten doğuyor, çünkü ikisinin de anadili bu evde işe yaramıyor. İki insan aynı yatakta, aynı çocuğu büyütürken bile birbirine ancak öğrenilmiş bir dille ulaşabiliyorsa, aralarındaki asıl mesafeyi hangi çeviri kapatabilir?"
      ),
    }),

    block('SECTION_HEADING', 'otopsi-1', { en: 'Autopsy', tr: 'Otopsi' }),
    block('IMAGE', 'otopsi-1', {
      imageUrl: img.tension,
      altEn: 'Sandra with her husband in the mountains, not looking at each other.',
      altTr: 'Sandra ve kocası dağlarda, birbirlerine bakmadan.',
    }),
    block('SECTION_TEXT', 'otopsi-1', {
      en: P(
        "By the time the trial opens, the prosecutor's real interest is what kind of woman Sandra is, and the question of how Samuel died barely gets a look in. Her sexuality, her relationships with women, a row caught on a therapy recording, the way her novels turn her own life into fiction, all of it gets laid out piece by piece. At one point the prosecutor reads Sandra's books almost as though they were a confession, treating fiction and fact as the same currency. Can a writer's imagination turn into evidence against her in a courtroom? Remember the scene where the prosecutor reads a violent passage from a novel she wrote years earlier out loud and asks her why she wrote it. A piece of fiction starts to count as proof of a real accusation.",
        "The forensic reports carry the same uncertainty. The angle of the blow to the head, the distance of the fall, the pattern the blood leaves behind, each gets read differently by the defence's experts and the prosecution's, and both sides can pull their own script out of the same physical data. Science, which is meant to settle things, turns instead into material that gets shaped in the lawyers' hands.",
        "The heaviest piece of evidence in the case is the recording of that argument. Played over and over in court, it leaves the audience unable to settle on whether they are hearing coldness in Sandra's voice or despair in Samuel's. Can the worst ten minutes a couple ever has stand in for their whole decade together? For the prosecutor the answer is obvious, but the film never lets us forget that even this recording is a scene someone chose to make and shaped by making it."
      ),
      tr: P(
        "Mahkemeye geldiğimizde savcının asıl merakı Sandra'nın nasıl bir kadın olduğu, Samuel'in nasıl öldüğü sorusu neredeyse ikinci planda kalıyor. Cinselliği, kadınlarla yaşadığı ilişkiler, terapi seansında kaydedilmiş bir kavga, romanlarında gerçek hayatını nasıl kurguya çevirdiği, hepsi tek tek masaya yatırılıyor. Savcı bir noktada Sandra'nın kitaplarını neredeyse itirafname gibi okuyor, kurguyla gerçeği aynı kefeye koyuyor. Bir yazarın hayal gücü, mahkeme salonunda aleyhine dönen bir delile dönüşebilir mi? Şu sahneyi hatırlayın: savcı, yıllar önce yazılmış bir romandaki şiddet sahnesini yüksek sesle okuyup Sandra'ya \"bunu neden yazdınız\" diye sorar. Kurmaca metin, gerçek bir suçlamanın kanıtı sayılmaya başlar.",
        "Adli tabip raporları da aynı belirsizliği taşıyor. Kafadaki darbenin açısı, düşme mesafesi, kanın yayılma şekli, hem savunmanın hem iddia makamının kendi uzmanlarınca ayrı ayrı yorumlanıyor ve iki taraf da aynı fiziksel veriden kendi senaryosunu çıkarabiliyor. Bilim burada bir kesinlik kaynağı olması gerekirken avukatların elinde şekillenen bir malzemeye dönüşüyor.",
        "Davanın en ağır delili, o kavganın kaydı. Mahkemede tekrar tekrar dinletilirken, izleyici Sandra'nın sesindeki soğukluğu mu, Samuel'in çaresizliğini mi izlediğine karar veremiyor. Bir çift arasındaki en kötü on dakika, o çiftin bütün on yılını temsil edebilir mi? Savcı için cevap açık, ama film bu kaydın kendisinin bile seçilmiş, düzenlenmiş bir sahne olduğunu unutturmuyor."
      ),
    }),

    block('SECTION_HEADING', 'otopsi-2', { en: 'Persuasion', tr: 'İkna' }),
    block('IMAGE', 'otopsi-2', {
      imageUrl: img.jury,
      altEn: 'Sandra standing in court, the audience seen from behind.',
      altTr: 'Sandra mahkemede ayakta, arkadan görünen izleyiciler.',
    }),
    block('SECTION_TEXT', 'otopsi-2', {
      en: P(
        "What the law is really after is whichever account wins the room over. The same mechanism shows up in any breakup where both sides describe the same night: there is no single \"what happened\" out there, only the separate version each person builds from their own memory. This is what makes Anatomy of a Fall a courtroom drama in the first place: watching the same piece of evidence serve two entirely different stories with equal force.",
        "The prosecutor also has Sandra's relationships with women to work with, and puts them to the room directly as a possible motive for murder. Being bisexual inside a marriage can suddenly turn, inside a courtroom, into the hunt for a hidden motive. Vincent steps in to point out that the prosecutor is presenting a guess as though it were evidence, but once the room's mood has shifted it never quite settles back.",
        "The language barrier returns here too. Sandra can only express herself with real ease in English, yet the French court expects her to speak its own language. In the moments she has to fall back on the interpreter, a woman already regarded with suspicion also becomes a foreign one; the jury can no longer tell whether they are watching hesitation on her face or a delay in translation. Can someone who cannot defend themselves in their own language really be judged on equal terms? Here the courtroom works less like a mechanism for justice and more like a device that turns the never fully visible inside of a marriage into a public display."
      ),
      tr: P(
        "Hukukun asıl aradığı şey, salonu en çok ikna eden anlatı. Bu mekanizma iki tarafın da aynı geceyi anlattığı her ayrılıkta karşımıza çıkıyor: ortada tek bir \"ne oldu\" yok, herkesin kendi hafızasına göre kurduğu ayrı bir versiyon var. Anatomy of a Fall'ı bir mahkeme draması yapan da bu: aynı kanıtın iki farklı hikâyeye nasıl eşit güçte hizmet edebildiği.",
        "Savcının elinde bir de Sandra'nın kadınlarla yaşadığı ilişkilere dair iddialar var, bunlar salonda doğrudan bir cinayet güdüsü ihtimali olarak sunuluyor. Bir evlilikte biseksüel olmak, bir mahkemede aniden gizli bir motif arayışına dönüşebiliyor. Vincent bu noktada araya girip savcının bir varsayımı delil gibi sunduğunu hatırlatsa da, salonun havası bir kez bozulduktan sonra düzelmiyor.",
        "Dil bariyeri de mahkemede yeniden sahneye çıkıyor. Sandra kendini en rahat İngilizce ile anlatabiliyor, ama Fransız mahkemesi ondan kendi diliyle konuşmasını bekliyor. Zaman zaman tercümana geçmek zorunda kaldığı anlarda, zaten şüpheyle bakılan bir kadın bir de yabancı bir kadına dönüşüyor; jüri onun yüzündeki tereddüdü mü, yoksa çeviri gecikmesini mi izlediğini artık ayırt edemiyor. Kendi dilinde savunma yapamayan biri, gerçekten eşit koşullarda yargılanabilir mi? Mahkeme salonu burada evliliğin dışarıdan hiçbir zaman tam görülemeyen içini herkese açık bir teşhir alanına çeviren bir alet gibi işliyor."
      ),
    }),

    block('SECTION_HEADING', 'duymak-1', { en: 'Hearing', tr: 'Duymak' }),
    block('IMAGE', 'duymak-1', {
      imageUrl: img.courtroom,
      altEn: 'A wide shot of the courtroom, a lawyer standing before the audience.',
      altTr: 'Mahkeme salonu genel planı, izleyicilerin önünde ayakta bir avukat.',
    }),
    block('SECTION_TEXT', 'duymak-1', {
      en: P(
        "Daniel has not been able to see since his accident. He was home the day his father died but did not see what happened, only heard it, and watched how their dog Snoop reacted. It is Snoop who finds Samuel's body and leads Daniel to it; while the people in this house are all capable of lying to each other, a dog startling or staying calm carries no calculation of its own. The court both trusts and distrusts Daniel's evidence for exactly this reason: how much weight can you put on the account of a child who cannot bear witness with his eyes, and whose only real anchor is how a dog reacted? The film sets up a neat trap here, because anyone who can see has already seen or failed to see something according to their own interest, while Daniel has no interest in the matter at all, only what he heard to pass on. The truth can sometimes be understood more reliably through an ear, or through how an animal behaves, than the eye ever manages."
      ),
      tr: P(
        "Daniel, kazadan beri görmüyor. Olay günü evdeydi ama olanı görmedi, yalnızca duydu ve köpekleri Snoop'un tepkisini izledi. Samuel'in cesedini bulup Daniel'i olay yerine yönlendiren de Snoop; evin içindeki insanlar birbirine yalan söyleyebilirken bir köpeğin ürkmesi ya da sakin kalması hiçbir çıkar hesabı yapmıyor. Mahkeme Daniel'in ifadesine bu yüzden hem güveniyor hem güvenmiyor: gözüyle tanıklık edemeyen, üstelik tek dayanağı bir köpeğin tepkisi olan bir çocuğun anlattığı şey ne kadar sağlam sayılabilir? Film burada ustaca bir tuzak kuruyor, çünkü gören herkes zaten kendi çıkarına göre bir şey görmüş ya da görmemiş olabiliyor, oysa Daniel'in ortada bir çıkarı yok, sadece duyduğunu aktarıyor. Gerçek, kulakla ya da bir hayvanın davranışıyla bazen gözün yakalayamadığı kadar güvenilir biçimde anlaşılabiliyor."
      ),
    }),

    block('SECTION_HEADING', 'duymak-2', { en: 'Doubt', tr: 'Şüphe' }),
    block('IMAGE', 'duymak-2', {
      imageUrl: img.testimony,
      altEn: 'A close-up of Daniel.',
      altTr: 'Daniel, yakın çekim.',
    }),
    block('SECTION_TEXT', 'duymak-2', {
      en: P(
        "Vincent, Sandra's lawyer and old friend, puts exactly this uncertainty to work in court, reminding the room that sight alone is not sufficient testimony, and that anyone who believes they saw something is also interpreting it. The harder the film tries to present Daniel's blindness as a deficiency, the more it pushes the audience towards the opposite conclusion. He may well be the one person in that house who is a more honest witness than any of the sighted adults.",
        "At one point Daniel tries to test his own memory, working out again which sounds he heard that day and which floor the footsteps came from, and he cannot be certain. He adds his own doubt onto the end of every sentence he gives in court. A child being this unsure of his own testimony is a kind of honesty none of the adults in the courtroom manage. Nobody taught him to doubt himself like that; he worked it out on his own."
      ),
      tr: P(
        "Vincent, Sandra'nın avukatı ve eski dostu, bu belirsizliği mahkemede tam da böyle kullanıyor: görmenin tek başına yeterli bir tanıklık olmadığını, gördüğünü sananların da yorumladığını hatırlatıyor. Daniel'in kör oluşu bir eksiklik olarak sunulmaya çalışıldıkça, film izleyiciye tersini düşündürüyor. Belki de evdeki tek kişi, gördüğünü sanan yetişkinlerden daha dürüst bir tanık.",
        "Daniel bir noktada kendi hafızasını sınamaya kalkıyor: o gün duyduğu sesleri, adımların hangi katta olduğunu yeniden kurmaya çalışıyor ve emin olamıyor. Mahkemede söylediği her cümlenin üstüne kendi şüphesini de ekliyor. Bir çocuğun kendi tanıklığından bu kadar emin olamaması, mahkemedeki hiçbir yetişkinin göstermediği bir dürüstlük. Kimse ona bu şüpheyi öğretmedi, kendisi fark etti."
      ),
    }),

    block('SECTION_HEADING', 'sandra-1', { en: 'Sandra', tr: 'Sandra' }),
    block('IMAGE', 'sandra-1', {
      imageUrl: img.danielSnoop,
      altEn: 'Daniel and his dog Snoop, indoors.',
      altTr: 'Daniel ve köpeği Snoop, iç mekanda.',
    }),
    block('SECTION_TEXT', 'sandra-1', {
      en: P(
        "Sandra is a widow and a defendant at once, expected to grieve and defend herself in the same breath. Painted in court as cold, controlling, an unfeeling mother, she is a woman the audience judges even as it finds itself drawn close to her. Is it really a coincidence that a successful woman gets branded cold this quickly inside her own marriage? The anger we hear on Samuel's therapy recording carries a real pain, but that same anger does not automatically turn Sandra's silence into guilt.",
        "The film leaves us exactly in that uncertain place. It does not clear Sandra outright, nor does it convict her outright; her tragedy lies in the fact that every detail of her life can count as evidence even while she is defending it. When a marriage falls apart, why is it always the surviving party who ends up owing an account of the one who is gone?"
      ),
      tr: P(
        "Sandra hem dul hem sanık, hem yasını tutması hem kendini savunması gereken bir kadın. Mahkemede soğuk, kontrolcü, duygusuz bir anne olarak resmedilirken izleyici onu hem yargılıyor hem de kendini ona yakın buluyor. Başarılı bir kadının evliliğinde bu kadar çabuk soğuk damgası yemesi bir rastlantı mı? Samuel'in terapi kaydında duyduğumuz öfke gerçek bir acıyı taşısa da, aynı öfke Sandra'nın sessizliğini otomatik bir suça çevirmiyor.",
        "Film bizi tam da bu ikircikli yerde bırakıyor. Sandra'yı toptan aklamıyor, toptan mahkûm da etmiyor; onun trajedisi, kendini savunurken bile hayatının her ayrıntısının delil sayılabilmesinde saklı. Bir evlilik dağıldığında, hayatta kalan taraf neden hep geride kalanın hesabını vermek zorunda kalıyor?"
      ),
    }),

    block('SECTION_HEADING', 'sandra-2', { en: 'Double Standard', tr: 'Çifte Standart' }),
    block('IMAGE', 'sandra-2', {
      imageUrl: img.alone,
      altEn: 'Sandra alone, caught in a thoughtful moment.',
      altTr: 'Sandra tek başına, düşünceli bir anda.',
    }),
    block('SECTION_TEXT', 'sandra-2', {
      en: P(
        "Would the mood in that courtroom be the same if a male writer faced the same indictment? Samuel has his own jealousy, his own anger, his own unfinished book, yet none of it gets presented as character evidence against him, because he is already dead and is not the one on trial. Sandra's success, meanwhile, can be turned into grounds for suspicion while she is still alive to answer for it.",
        "Sandra's German identity feeds this same perception. What the French courtroom expects of her is a display of feeling, tears, collapse, grief announced out loud, while Sandra keeps her pain to herself and weighs each sentence before she says it. That composure is nothing more than a cultural habit, yet the room reads it as a confession. Nobody has a written list of how a woman is supposed to mourn, but everyone carries one in their head, and Sandra fails to tick a single box on it.",
        "The case reaches the press too, and reporters gather at the courthouse door. Public opinion reaches its own verdict long before the official one is read out: the question of how a woman can talk about her husband's death this calmly has already hardened, in the corridors, into an accusation. While Sandra is still working to win over the room inside, an entirely different court outside has already made up its mind about her."
      ),
      tr: P(
        "Bir erkek yazar aynı iddianameyle karşılaşsaydı mahkeme salonunun havası aynı olur muydu? Samuel'in de kıskançlığı, öfkesi, tamamlanmamış kitabı var ama bunlar ona karşı bir karakter delili gibi sunulmuyor, çünkü o zaten ölü ve yargılanan taraf değil. Sandra'nın başarısı ise hayattayken bile ona karşı kullanılabilecek bir suç unsuruna dönüşebiliyor.",
        "Sandra'nın Alman kimliği de bu algıyı besliyor. Fransız salonunda ondan beklenen duygu gösterisi, ağlaması, çökmesi, çaresizliğini yüksek sesle ilan etmesi; Sandra ise acısını dışa vurmuyor, cümlelerini tarttıktan sonra kuruyor. Bu ölçülülük bir kültürel alışkanlıktan ibaretken salon onu bir itiraf gibi okuyor. Bir kadının yasını nasıl tutması gerektiğine dair kimsenin yazılı olmayan bir listesi yok, ama herkesin kafasında bir tane var ve Sandra o listenin hiçbir maddesine tam uymuyor.",
        "Dava basına da düşüyor, muhabirler mahkeme kapısında birikiyor. Kamuoyunun kendi hükmü, resmi karar açıklanmadan çoktan şekilleniyor: bir kadın kocasının ölümünden nasıl bu kadar sakin bahsedebiliyor sorusu, koridorlarda çoktan bir suçlamaya dönüşmüş oluyor. Sandra salonun içinde bir tarafı ikna etmeye çalışırken, salonun dışında bambaşka bir mahkeme onu çoktan hükme bağlamış oluyor."
      ),
    }),

    block('SECTION_HEADING', 'beraat-1', { en: 'Acquittal', tr: 'Beraat' }),
    block('IMAGE', 'beraat-1', {
      imageUrl: img.closeup,
      altEn: 'A close-up of Sandra in the courtroom.',
      altTr: 'Sandra\'nın mahkemedeki yakın çekimi.',
    }),
    block('SECTION_TEXT', 'beraat-1', {
      en: P(
        "Sandra is acquitted in the end, but the victory does not taste the way anyone expects. What tips the verdict in her favour is a scene Daniel gives in court that sits right on the border between memory and invention: he says he remembers a sentence his father once said about his own life, in one of their last conversations. The jury finds the detail strange enough for a child to have made up, and believable for exactly that reason. The film stays deliberately unresolved here: is Daniel really remembering, or is he building his own story to save his mother? The one child in the house who could see becomes, in the end, the one who does the most interpreting."
      ),
      tr: P(
        "Sandra sonunda beraat ediyor, ama bu zaferin tadı beklendiği gibi çıkmıyor. Daniel'in mahkemede anlattığı, hatırlamayla kurgunun sınırında duran bir sahne, kararı onun lehine çeviriyor: babasıyla son sohbetlerinden birinde Samuel'in kendi hayatına dair söylediği bir cümleyi hatırladığını söylüyor. Jüri bu ayrıntıyı bir çocuğun uydurabileceği kadar tuhaf ve bu yüzden inandırıcı buluyor. Film burada bilerek belirsiz kalıyor: Daniel gerçekten hatırlıyor mu, yoksa annesini kurtarmak için kendi hikâyesini mi kuruyor? Evin içindeki tek gören çocuk, en çok yorumlayan kişiye dönüşüyor."
      ),
    }),

    block('SECTION_HEADING', 'beraat-2', { en: 'Homecoming', tr: 'Eve Dönüş' }),
    block('IMAGE', 'beraat-2', {
      imageUrl: img.exit,
      altEn: 'Two figures embracing in the dark.',
      altTr: 'Karanlıkta birbirine sarılan iki figür.',
    }),
    block('SECTION_TEXT', 'beraat-2', {
      en: P(
        "After the acquittal Sandra goes home but finds no family waiting there, only herself and Daniel, with a question still hanging between them that nobody has answered. In one of the last scenes Daniel looks his mother in the eye and tells her he trusts her, though the line lands less like evidence and more like the confession of a child who has accepted he cannot live any other way now. Can a court's ruling ever confirm the truth of a marriage, or does it simply make one side's story official? Sandra looks like the one who won, yet the weight of what she has lost outweighs the acquittal she has gained. The film never says whether she will turn this case into a book of her own one day, but given her profession that possibility is just as unsettling as the trial itself: even the most private pain she has lived through might one day become material, for somebody else's fiction, or perhaps her own."
      ),
      tr: P(
        "Beraat kararından sonra Sandra eve dönüyor ama karşısında bir aile bulamıyor, yalnızca kendisiyle Daniel kalıyor ve aralarında hâlâ cevaplanmamış bir soru asılı duruyor. Son sahnelerden birinde Daniel, annesinin gözlerinin içine bakıp ona güvendiğini söylüyor, ama bu cümle artık başka türlü yaşayamayacağını kabullenmiş bir çocuğun itirafı gibi duyuluyor. Bir mahkeme kararı, bir evliliğin gerçeğini onaylayabilir mi, yoksa yalnızca bir tarafın anlattığı hikâyeyi resmi kılıyor? Sandra kazanmış görünüyor, ama kaybettiği şeyin ağırlığı elde ettiği beraatten fazla. Bir yazar olarak bu davayı bir gün kendi kitabına taşıyıp taşımayacağını film hiç söylemiyor, ama Sandra'nın mesleği düşünüldüğünde bu ihtimal de mahkeme kadar rahatsız edici: yaşadığı en özel acı bile bir gün başka birinin, belki kendisinin kurgusuna malzeme olabilir."
      ),
    }),

    block('SECTION_HEADING', 'sonuc-1', { en: 'Conclusion', tr: 'Sonuç' }),
    block('SECTION_TEXT', 'sonuc-1', {
      en: P(
        "Anatomy of a Fall is an autopsy of a marriage wearing the costume of a murder mystery. The film never explains the cause of death with any certainty, because what it is really after is how two people living together can quietly rot over the years. The gap between Sandra and Samuel's languages, the imbalance of power between them, the jealousy and the guilt, are all pieces of a collapse that began years before anyone died. The legal language spoken in the corridors of the court can only paper roughly over everything that went unsaid inside that house."
      ),
      tr: P(
        "Anatomy of a Fall bir cinayet gizemi kılığına girmiş bir evlilik otopsisi. Film ölüm nedenini hiçbir zaman kesin biçimde açıklamıyor, çünkü asıl peşinde olduğu şey bir arada yaşamanın yıllar içinde nasıl sessizce çürüyebileceği. Sandra ile Samuel arasındaki dil farkı, güç dengesizliği, kıskançlık ve suçluluk, hepsi cinayetten yıllar önce başlamış bir çöküşün parçaları. Mahkeme koridorunda konuşulan hukuk dili, evin içinde konuşulmayan onca şeyin üstünü ancak kabaca örtebiliyor."
      ),
    }),

    block('IMAGE', 'sonuc-1', {
      imageUrl: img.houseWinter,
      altEn: "An X-ray, part of the case's forensic evidence.",
      altTr: 'Davanın adli kanıtlarından biri olan bir röntgen görüntüsü.',
    }),
    block('VERDICT_TEXT', 'verdict', {
      en: "The court reached its judgment, but the real question the film leaves us with is still standing: can anyone outside a marriage ever fully reach the truth of it, when even the people inside cannot quite agree on what that truth is? The same question holds outside the courtroom too. A group of friends, a family, a workplace can each tell the same event as two entirely different stories, and both versions are true for the people telling them. Think of your own marriage, your own relationship, or the person closest to you: if someone from the outside tried to tell your story, which detail would they get wrong?",
      tr: "Mahkeme bir karar verdi, ama filmin bize bıraktığı asıl soru hâlâ orada duruyor: bir evliliğin gerçeğine, o evliliğin içindekiler dışında kimse tam olarak ulaşabilir mi? Aynı soru mahkeme salonunun dışında da geçerli. Bir arkadaş grubu, bir aile, bir iş yeri de bazen aynı olayı anlatırken birbirinden tamamen farklı iki hikâye kurar ve ikisi de o anlatanlar için gerçektir. Kendi evliliğinizi, ilişkinizi ya da en yakın olduğunuz kişiyi düşünün, dışarıdan biri onu anlatmaya kalksa hangi ayrıntıyı yanlış okurdu?",
    }),
  ];
}

const meta = {
  titleEn: 'The Autopsy of a Marriage: Anatomy of a Fall',
  titleTr: 'Bir Evliliğin Otopsisi: Anatomy of a Fall',
  kickerEn: 'DEEP READING',
  kickerTr: 'DERİN OKUMA',
  axisEn: "In Justine Triet's courtroom drama, the thing really being dissected is a marriage.",
  axisTr: "Justine Triet'in mahkeme dramasında masaya yatırılan asıl şey bir evlilik.",
  imageUrl: null,
  imageUrlLarge: null,
  imageAltEn: 'Sandra Voyter in the courtroom, on trial for her husband\'s death.',
  imageAltTr: 'Sandra Voyter, kocasının ölümü davasında mahkeme salonunda.',
  // Film: sezon/bölüm kavramı yok. null => spoilerFree=true olur (yanlış
  // etiket riski, bkz. black-swan-sanat-nina.mjs aynı not) — bu yazı finali
  // ve beraat kararını açıkça anlatıyor, spoilerFree=true YANLIŞ ama backend'de
  // film için ayrı bir spoiler alanı yok. Bilinen sınırlama, kullanıcıya bildirildi.
  spoilerThroughSeasonNumber: null,
  spoilerThroughEpisodeNumber: null,
  recommendedRank: null,
  status: 'PUBLISHED',
  format: 'ANALYSIS',
  readingTimeMinutes: 9,
  imageKey: 'cover',
  tags: [{ subjectType: 'MOVIE', subjectId: 11, seasonNumber: null, episodeNumber: null, franchiseId: null }],
};

await publishBlog({ outputName: 'anatomy-of-a-fall-evliligin-otopsisi', meta, buildBlocks, images });
