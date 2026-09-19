#!/usr/bin/env node
// "Gömülü Gerçek" (Pluribus derin okuma) — scripts/lib/blog-publish.mjs'i
// kullanan generic blog script. Görseller TMDb'den önceden Cloudinary'e
// taşındı (bkz. scripts/output/pluribus-gomulu-gercek-images.json), bu
// yüzden hepsi type: 'cloudinary' ile aynen geçiriliyor, tekrar yüklenmiyor.
//
// Kullanım (PowerShell):
//   node scripts/blogs/pluribus-gomulu-gercek.mjs                 (dry-run)
//   node scripts/blogs/pluribus-gomulu-gercek.mjs --write         (gerçek POST)

import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const block = createBlockBuilder();

const images = {
  cover: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1789682265/fandoom/blog/gbmg3pnnjgjvspo1kypj.jpg',
  },
  sahne: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1789682276/fandoom/blog/ilrytxf2vjgap8emkvpr.jpg',
  },
  teklif: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1789682285/fandoom/blog/j8w8dxm6gh7q1wmyz1n1.jpg',
  },
  ret: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1789682305/fandoom/blog/nl7dnyeykhtpeipnyluh.jpg',
  },
  sessizlik: {
    type: 'cloudinary',
    src: 'https://res.cloudinary.com/b0bc5njd/image/upload/v1789682319/fandoom/blog/iar6i5wrpnbbcpbyupke.jpg',
  },
};

function buildBlocks(img) {
  return [
    block('LEDE_TEXT', 'lede', {
      en: P(
        `Almost every piece written about Pluribus opens with the same compliment: this is an invasion story in which nobody dies. The collective doesn't kill anyone, doesn't threaten anyone, and there isn't a mass grave anywhere in sight. Critics treat this as the show's most original move, a bloodless version of the apocalypse. But that compliment quietly skips over one scene. In the very first episode, while the virus is still spreading across the planet, Carol Sturka's wife, Helen Umstead, dies. Nobody kills her, at least not on screen. But she dies, and Carol buries her with her own hands in the back garden. Pluribus's line about nobody dying is really a way of avoiding the question of whose hands the first death passed through.`
      ),
      tr: P(
        `Pluribus üzerine yazılan hemen her metin aynı övgüyle açılıyor: bu bir istila hikâyesi ama kimse ölmüyor. Kolektif kimseyi öldürmüyor, kimseyi tehdit etmiyor, ortada tek bir toplu mezar yok. Eleştirmenler bunu dizinin en özgün hamlesi sayıyor, şiddetsiz bir kıyamet fikri. Ama bu övgü tek bir sahneyi sessizce atlıyor. Dizinin daha ilk bölümünde, virüs gezegene yayılırken, Carol Sturka'nın eşi Helen Umstead ölüyor. Kimse onu öldürmüyor, en azından ekranda kimse. Ama o ölüyor, ve Carol onu kendi elleriyle arka bahçeye gömüyor. Pluribus'un "kimse ölmüyor" cümlesi, aslında ilk ölümün kimin elinden çıktığını sormaktan kaçınan bir cümle.`
      ),
    }),

    block('SECTION_HEADING', 'scene-1', { en: 'The Scene', tr: 'Sahne' }),
    block('IMAGE', 'scene-1', {
      imageUrl: img.sahne,
      altEn: 'Carol reaches for the phone in the dark, the night the Joining begins.',
      altTr: 'Carol karanlıkta telefona uzanıyor, Joining’in başladığı gece.',
    }),
    block('SECTION_TEXT', 'scene-1', {
      en: `The scene itself is brief and chaotic. As the virus spreads across the world within seconds, Helen starts convulsing too, caught by the Joining. Everyone around her collapses at once, and Carol scrambles to reach her in a panic. Vince Gilligan, who directs the episode himself, builds the opening as a calm, almost gentle science fiction apocalypse, and places this particular death at the edge of the frame. The camera never catches the moment itself, only the aftermath. Even the episode's own plot summary is written with the same caution: Helen dies of head trauma shortly after joining. The sentence is deliberately passive. It leaves the source of the trauma open.`,
      tr: `Sahne kısa ve kaotik. Virüs saniyeler içinde dünyaya yayılırken Helen de titremeye başlıyor, "Join" süreci onu da yakalıyor. Etrafındaki herkes aynı anda çöküyor, ve Carol panik hâlde eşine ulaşmaya çalışıyor. Sahneyi bizzat yöneten Vince Gilligan, açılışı sakin bir bilimkurgu kıyametiyle kurarken bu ölümü hikâyenin kıyısına yerleştiriyor: kamera olayı yakalamıyor, sadece sonucunu gösteriyor. Wikipedia'nın bölüm özeti bile aynı temkinle yazılmış: Helen, katılımdan kısa süre sonra kafa travmasıyla ölüyor. Cümle kasıtlı olarak edilgen; travmanın kaynağını açık bırakıyor.`,
    }),

    block('SECTION_HEADING', 'scene-2', { en: 'The Theory', tr: 'Teori' }),
    block('SECTION_TEXT', 'scene-2', {
      en: `Screen Rant, The Direct and Yahoo Entertainment have each floated the same possibility: that the trauma came from Carol's own panic as she tried to carry her. Moving a body hurriedly, without proper support, can push an already fragile neck past the point of no return. The show neither confirms nor denies this; it keeps the moment out of frame and shows only the result. That gap flips the question we usually ask about the collective: is its real project doing something to Carol, or hiding from her something she did to herself?`,
      tr: `Screen Rant, The Direct ve Yahoo Entertainment ayrı ayrı aynı olasılığı işliyor: travma virüsten gelmemiş, Carol'ın paniğinden gelmiş olabilir. Bir bedeni telaşla, doğru desteklemeden taşımak, zaten kırılgan bir boynu geri dönüşü olmayan bir noktaya götürebilir. Dizi bu olasılığı ne doğruluyor ne çürütüyor; sahneyi kadraj dışında bırakıp sadece sonucu gösteriyor. Bu boşluk, kolektif hakkında genelde sorulan soruyu tersine çeviriyor: kolektifin asıl işi Carol'a bir şey yapmak mı, yoksa Carol'ın kendine yaptığı bir şeyi ondan saklamak mı?`,
    }),

    block('SECTION_HEADING', 'scene-3', { en: 'The Offer', tr: 'Teklif' }),
    block('IMAGE', 'scene-3', {
      imageUrl: img.teklif,
      altEn: 'Five newly joined minds move through an airport in perfect, unsettling unison.',
      altTr: 'Yeni katılmış beş kişi bir havalimanında tekinsi bir uyumla aynı anda hareket ediyor.',
    }),
    block('SECTION_TEXT', 'scene-3', {
      en: `Joining the collective erases exactly one thing: separate memory. Whoever joins opens their entire past to the shared consciousness, and the weight a single person carries becomes information spread across billions of minds. For Carol, the stakes are concrete. Whatever part she played in Helen's death stops being a fact she alone carries and becomes one nobody carries alone. The pain doesn't end, it disperses; a guilt spread across billions of minds feels far lighter than the same guilt sitting on one woman's shoulders. What the collective is really offering Carol is exactly that dilution.`,
      tr: `Kolektife katılmak tek bir şeyi siliyor: ayrı hafıza. Katılan biri kendi geçmişini ortak bilince açıyor, ve tekil bir insanın taşıdığı ağırlık orada milyarlarca zihne dağılan bir bilgi hâline geliyor. Carol için bunun karşılığı çok somut: Helen'in ölümünde kendisinin oynadığı rol, artık kimsenin tek başına taşımadığı bir gerçeğe dönüşür. Acı bitmiyor, dağılıyor; milyarlarca zihne yayılan bir suç, tek bir kadının omuzlarındaki bir suçtan çok daha hafif hissettiriyor kendini. Kolektifin Carol'a asıl teklifi tam olarak bu seyrelme.`,
    }),

    block('SECTION_HEADING', 'scene-4', { en: 'The Refusal', tr: 'Ret' }),
    block('IMAGE', 'scene-4', {
      imageUrl: img.ret,
      altEn: 'Carol keeps watch over something wrapped and hidden, alone in the dark.',
      altTr: 'Carol karanlıkta, sarılı ve saklı bir şeyin başında tek başına nöbet tutuyor.',
    }),
    block('SECTION_TEXT', 'scene-4', {
      en: `Carol's resistance to the collective usually gets read as bad temper, as cynicism for its own sake. Helen's death gives that resistance a far sharper logic. If Carol assimilates, whatever role she played in Helen's death dissolves into a detail lost inside the collective's vast memory. Forgetting her guilt would also mean giving up being the last person who remembers Helen alone. The grave Carol digs in the back garden is the only private property the show ever shows us. The only patch of earth nobody else has a share in. Guarding it is the most direct answer she ever gives the collective.`,
      tr: `Carol'ın kolektife direnci genelde bir huysuzluk, bir alaycılık meselesi olarak okunuyor. Helen'in ölümü bu direncin altına çok daha keskin bir mantık yerleştiriyor. Carol asimile olursa, Helen'in ölümündeki kendi payı da kolektifin devasa hafızasında sulanıp giden bir ayrıntıya döner. Suçunu unutmak, aynı zamanda Helen'i tek başına hatırlayan son kişi olmaktan vazgeçmek anlamına geliyor. Carol'ın arka bahçeye kazdığı mezar, dizide gösterilen tek özel mülk. Kimsenin ortaklaşmadığı tek toprak parçası. Onu koruması, kolektife verdiği en dolaysız cevap.`,
    }),

    block('SECTION_HEADING', 'scene-5', { en: 'Silence', tr: 'Sessizlik' }),
    block('IMAGE', 'scene-5', {
      imageUrl: img.sessizlik,
      altEn: 'Carol lies alone on the sofa, in a house that has gone completely quiet.',
      altTr: 'Carol, artık tamamen sessizleşmiş bir evde kanepede tek başına uzanıyor.',
    }),
    block('SECTION_TEXT', 'scene-5', {
      en: `Sound designers Kathryn Madsen and Nick Forshager, working with re-recording mixer Larry Benjamin, built a technique meant to make Carol feel sonically abandoned: one key sound, followed by a long silence. Because the collective communicates telepathically, the world is naturally quiet already, and that quiet makes the big sonic moments land harder. But after Helen's death, the same silence takes on another job. Guilt needs speech. Nobody is left for Carol to confess to, argue with, or ask forgiveness from. The collective doesn't talk. It only listens, and waits. The silence around Carol is the sound of a trial that never opens.`,
      tr: `Ses tasarımcıları Kathryn Madsen ve Nick Forshager, miksaj yönetmeni Larry Benjamin'le birlikte Carol'ı sonik olarak terk edilmiş hissettirecek bir teknik kurmuş: tek bir anahtar ses, ardından uzun bir sessizlik. Kolektif telepatik konuştuğu için dünya zaten doğal olarak sessizleşiyor, ve bu sessizlik büyük anları daha da güçlendiriyor. Ama aynı sessizlik, Helen'in ölümünden sonra başka bir işlev kazanıyor: Carol'ın itiraf edebileceği, tartışabileceği, af dileyebileceği kimse kalmıyor. Suçluluk konuşmayı gerektirir. Kolektif konuşmuyor, sadece dinliyor ve bekliyor. Carol'ın etrafındaki sessizlik, hiç açılmamış bir mahkemenin sesi.`,
    }),

    block('SECTION_HEADING', 'scene-6', { en: 'Punishment', tr: 'Ceza' }),
    block('SECTION_TEXT', 'scene-6', {
      en: `In Dostoyevsky's Crime and Punishment, Raskolnikov is torn apart by his own conscience long before any outside force catches up with him; the novel is a record of a mind punishing itself. Pluribus's collective offers the exact opposite arrangement. There is no outside force here, and the inside one can be switched off too. If Carol wants, she can escape the inner court Raskolnikov never manages to leave, simply by joining. Her refusal means she is choosing to serve the sentence. At the very least, that sentence is proof Helen still means something to her.`,
      tr: `Dostoyevski'nin Suç ve Ceza'sında Raskolnikov, işlediği cinayetten sonra hiçbir dış güç tarafından yakalanmadan önce kendi vicdanı tarafından paramparça olur; roman, bir zihnin kendi kendini nasıl cezalandırdığının kaydıdır. Pluribus'un kolektifi bu romanın tam tersi bir teklif sunuyor: dış güç yok, iç güç de silinebilir. Carol isterse, Raskolnikov'un asla kaçamadığı o iç mahkemeden kolektife katılarak kurtulabilir. Reddetmesi, ceza çekmeyi göze aldığını gösteriyor. En azından ceza, Helen'in onun için hâlâ bir anlam ifade ettiğinin kanıtı.`,
    }),

    block('SECTION_HEADING', 'scene-7', { en: 'The Flaw', tr: 'Kusur' }),
    block('SECTION_TEXT', 'scene-7', {
      en: `The ground this reading stands on isn't entirely solid; this is a theory, not the show's own account. Pluribus never shows, in any scene, exactly how Helen died, and that vagueness could be a deliberate choice as easily as an unfilled gap. Given how thoroughly Gilligan tended to explain almost everything by the end of Breaking Bad, Pluribus staying quiet here reads either as real confidence or as a writers' room that hasn't made up its mind yet. With season two not yet in production, that question isn't getting answered any time soon. For now, what we have is a grave, a silence, and a woman refusing to give up either one.`,
      tr: `Bu okumanın dayandığı zemin sağlam değil; bu bir teori, dizinin resmi bir açıklaması değil. Pluribus, Helen'in ölüm nedenini hiçbir sahnede net biçimde göstermiyor, ve bu belirsizlik bilinçli bir anlatım tercihi de olabilir, doldurulmamış bir boşluk da. Gilligan'ın Breaking Bad'de neredeyse her ayrıntıyı sonunda açıkladığı düşünülürse, Pluribus'un bu noktada sessiz kalması ya cesur bir güven, ya da henüz kararını vermemiş bir yazım odasının izi. İkinci sezon çekimlerinin daha başlamamış olması, bu sorunun yakın zamanda cevaplanmayacağı anlamına geliyor. Şimdilik elimizde sadece bir mezar, bir sessizlik ve bunlardan hiçbirinden vazgeçmeyi reddeden bir kadın var.`,
    }),
    block('SECTION_TEXT', 'scene-7', {
      en: `The collective is offering Carol the same thing it offers the rest of the world: a peace where no memory is carried alone. Carol turning it down is the quiet insistence of a woman who has decided not to leave Helen by herself.`,
      tr: `Kolektif Carol'a da dünyanın geri kalanına verdiğini teklif ediyor: hiçbir hafızanın tek başına taşınmadığı bir huzur. Carol'ın bunu reddetmesi, Helen'i yalnız bırakmamaya karar vermiş bir kadının sessiz ısrarı.`,
    }),
    block('VERDICT_TEXT', 'scene-7', {
      en: `It's the least showy, most convincing moment the show has given us so far.`,
      tr: `Dizinin bugüne kadar sunduğu en az gösterişli, en inandırıcı anı da bu.`,
    }),
  ];
}

const meta = {
  titleEn: 'Nobody Dies in Pluribus. Someone Already Has.',
  titleTr: "Pluribus'ta Kimse Ölmüyor, Ama Biri Zaten Öldü",
  kickerEn: 'BURIED TRUTH',
  kickerTr: 'GÖMÜLÜ GERÇEK',
  axisEn: "The collective offers Carol a way to forget; what she's hiding is the memory of a guilt.",
  axisTr: "Kolektif Carol'a acıyı unutturmayı teklif ediyor; Carol'ın sakladığı şeyse bir suçun hatırasıdır.",
  imageUrlLarge: null,
  imageAltEn: 'Carol Sturka stands before a crowd that no longer sees her as one of them.',
  imageAltTr: "Carol Sturka, artık kendisi gibi görmeyen bir kalabalığın önünde duruyor.",
  spoilerThroughSeasonNumber: 1,
  spoilerThroughEpisodeNumber: 9,
  recommendedRank: null,
  status: 'PUBLISHED',
  format: 'ANALYSIS',
  publishedAt: new Date().toISOString(),
  readingTimeMinutes: 7,
  imageKey: 'cover',
  tags: [{ subjectType: 'SERIES', subjectId: 8, seasonNumber: null, episodeNumber: null, franchiseId: null }],
};

await publishBlog({ outputName: 'pluribus-gomulu-gercek', meta, buildBlocks, images });
