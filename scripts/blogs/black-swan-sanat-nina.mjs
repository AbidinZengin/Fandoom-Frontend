#!/usr/bin/env node
// "Sanat, Sanat İçindir; Nina, Nina İçin Değil" (Black Swan derin okuma) —
// scripts/lib/blog-publish.mjs'i kullanan generic blog script. Kaynak:
// docs_dev/blog-drafts/black-swan-sanat-nina.md (TR onaylı, EN yeniden yazım).
//
// Şema notları:
//  - Şemada bölüm başına tek SECTION_HEADING ve tek IMAGE var (BlogPost.data.js
//    parseBlogBlocks). Taslaktaki ### alt başlıklar bu yüzden yalnız görsel gelen
//    yerlerde yeni bölüm olarak açıldı, diğerleri önceki bölüme katıldı. Beyaz/
//    Siyah Kuğu tablosu düz metin paragrafına çevrildi.
//  - Görseller TMDb'den Cloudinary'ye önceden taşındı (bkz.
//    scripts/output/black-swan-sanat-nina-images.json), hepsi type: 'cloudinary'
//    ile aynen geçiriliyor, tekrar yüklenmiyor.
//  - Pull-quote 2 adet (Erica bölümü, Final bölümü); Sonuç'un son paragrafı
//    VERDICT_TEXT.
//
// Kullanım (PowerShell):
//   node scripts/blogs/black-swan-sanat-nina.mjs                       (dry-run)
//   node scripts/blogs/black-swan-sanat-nina.mjs --write               (yeni POST, AYRI ONAY)
//   node scripts/blogs/black-swan-sanat-nina.mjs --write --blog-id 954 (PUT, blocks REPLACE-ALL)

import { createBlockBuilder, P, publishBlog } from '../lib/blog-publish.mjs';

const block = createBlockBuilder();

const images = {
  cover: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461238/fandoom/blog/ozgtttule3bjisxizv4g.jpg",
  },
  ayna: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461239/fandoom/blog/wilcqitccov3vpebvtfw.jpg",
  },
  kugular: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461240/fandoom/blog/pwoncggcyimlrilguqko.jpg",
  },
  thomas: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461242/fandoom/blog/ukjktvahe9mbudlba4fq.jpg",
  },
  final: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461242/fandoom/blog/bu8caqv5wavgqk48emkw.jpg",
  },
  erica: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461739/fandoom/blog/rssg1tdnbddmh7qciiya.jpg",
  },
  donusum: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461740/fandoom/blog/jxtuhekckqolsyvuzg60.jpg",
  },
  beth: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461741/fandoom/blog/qodly95h9l0g5zufo3t8.jpg",
  },
  lilyOda: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461742/fandoom/blog/dgib0auoxcrumxtgmvjz.jpg",
  },
  lilyKulup: {
    type: 'cloudinary',
    src: "https://res.cloudinary.com/b0bc5njd/image/upload/v1790461743/fandoom/blog/y30k3x2vku5r4unjyrkm.jpg",
  },
};

function buildBlocks(img) {
  return [
    block('LEDE_TEXT', 'lede', {
      en: P(
        "Art for art's sake. The phrase is usually offered as a defence: a work of art owes society no usefulness, no moral lesson and no commercial success, and has the right to exist on its own terms. It sounds good and it is largely true. But the phrase has another side, and Black Swan looks straight at it: if art exists only for itself, who exists for the artist who makes it?",
        "Nina Sayers is the young ballerina at the centre of the film. She lives with her mother, and her days are built from rehearsal, discipline and the pursuit of flawlessness. Thomas, the company's director, is staging Swan Lake this season and gives the lead, both the White Swan and the Black Swan, to Nina. He gives it with a condition: technique is enough for the White Swan, but the Black Swan demands that Nina lose control. And control is the one thing Nina has ever been taught.",
        "The whole tension of the film grows out of that clash, and it is the question this piece keeps returning to: does perfection require an artist to destroy herself? While reading, keep your own perfectionism close by. When did you last manage to say \"that will do\"?"
      ),
      tr: P(
        "Sanat, sanat içindir. Bu söz çoğunlukla bir savunma olarak kullanılır: bir eserin topluma faydası, bir ahlak dersi ya da bir satış başarısı olması gerekmez, kendi başına var olma hakkı vardır. Kulağa hoş geliyor ve büyük ölçüde doğru. Ama cümlenin bir öbür yüzü var ve Black Swan tam oraya bakıyor: sanat yalnızca kendisi için varsa, onu üreten insan kimin için var?",
        "Nina Sayers, filmin merkezindeki genç balerin. Annesiyle aynı evde yaşıyor, günleri prova, disiplin ve kusursuzluk üzerine kurulu. Şirketin yönetmeni Thomas bu sezon Kuğu Gölü'nü yeniden sahneliyor ve başrolü, yani hem Beyaz Kuğu'yu hem Siyah Kuğu'yu Nina'ya veriyor. Verirken de şartını söylüyor: Beyaz Kuğu için Nina'nın tekniği yeter, Siyah Kuğu için kontrolü bırakması gerekir. Nina ise hayatı boyunca yalnızca kontrol etmeyi öğrenmiş biri.",
        "Filmin bütün gerilimi bu çatışmadan çıkıyor ve bize göre yazının ana sorusu da orada duruyor: mükemmellik, sanatçının kendini yok etmesini gerektirir mi? Bu satırları okurken kendi mükemmeliyetçiliğinizi de yanınızda tutmanızı öneririz. En son ne zaman \"bu kadarı yeter\" diyebildiniz?"
      ),
    }),

    block('SECTION_HEADING', 'scene-1', { en: "Nina's Mind: Is Perfectionism an Illness?", tr: "Nina'nın Psikolojisi: Mükemmeliyetçilik Bir Hastalık mı?" }),
    block('IMAGE', 'scene-1', {
      imageUrl: img.ayna,
      altEn: "Nina's reflection multiplied across mirrors.",
      altTr: "Aynalarda çoğalan Nina yansımaları.",
    }),
    block('SECTION_TEXT', 'scene-1', {
      en: P(
        "From the opening minutes, Nina's body tries to tell her something. She tears at the skin beside her fingernail, scratches her back until it bleeds and never quite rests, even in sleep. Remember the scene where Erica clips her daughter's nails down to the quick while Nina watches in silence. Nobody instructs her to hurt herself. The marks come from a pressure that lives inside her.",
        "In another scene Nina's reflection fails to move in time with her. On a first viewing we take it for a visual effect. Then it dawns on us that the film is showing how Nina sees herself: there is no familiar face left in the glass, only a stranger walking around outside her own body."
      ),
      tr: P(
        "Nina'nın bedeni filmin ilk dakikalarından itibaren ona bir şey anlatmaya çalışır. Parmağının kenarındaki deriyi koparır, sırtındaki kaşıntıyı kanayana kadar kaşır, uykusunda bile rahat edemez. Şu sahneyi hatırlayın: Erica, kızının tırnaklarını kısacık keser, Nina ise sessizce izler. Kimse ona kendini yaralamasını söylemiyor. Bu, içeriden gelen bir baskının bedene bıraktığı iz.",
        "Bir başka sahnede Nina'nın yansıması, kendisiyle aynı anda hareket etmez. Bunu ilk seyrettiğimizde bir görüntü efekti sanırız. Sonra fark ederiz ki film bize Nina'nın kendini nasıl gördüğünü gösteriyor: aynada artık tanıdık biri yok, kendi bedeninin dışında dolaşan bir yabancı var."
      ),
    }),

    block('SECTION_HEADING', 'scene-2', { en: "The night with Lily", tr: "Lily ile geçen gece" }),
    block('IMAGE', 'scene-2', {
      imageUrl: img.lilyKulup,
      altEn: "Lily and Nina close together on the night out.",
      altTr: "Lily ile Nina, dışarı çıktıkları gece birbirine çok yakın.",
    }),
    block('SECTION_TEXT', 'scene-2', {
      en: P(
        "From the start Lily is drawn as Nina's opposite: relaxed, careless, never straining to be liked for her dancing. The two go out one night. Nina comes home, quarrels with her mother and shuts herself in her room, and what happens there with Lily becomes one of the most discussed scenes in the film. The next morning Nina wakes alone, and when she asks Lily, Lily says she went home with someone else. Whether what we saw was real or a hallucination, the film never says outright.",
        "To us, whether it happened matters less. What matters is that Nina has come close enough to a desire she spent years treating as forbidden, and can only live it inside her own head, wearing someone else's face.",
        "Nails, mirrors, the night with Lily: what they share is a perfectionism that never lets her draw breath. Is that a virtue? Perhaps up to a point. The discipline that keeps an artist standing can also be the thing that eats her from within, and in Nina's case nobody can draw the line between the two.",
        "Natalie Portman has described ballet as an intensely obsessive art: the same barre work every day, the shoes prepared with the same ritual. Aronofsky, for his part, has spoken of dancers wearing through their shoes and saving the blood. Nina's obsessions are the ordinary habits of that world pushed to their limit. The detail chills the first half of the film and raises a question: how much of a discipline is healthy and how much sick? If the stage itself cannot tell, how could we expect Nina to?"
      ),
      tr: P(
        "Lily filmin başından beri Nina'nın tam tersi olarak çizilir: rahat, kayıtsız, dansını beğendirmek için kendini yormayan biri. İkisi bir gece dışarı çıkar. Nina eve döndüğünde annesiyle tartışır, odasına kapanır ve Lily ile yaşadığı gece filmin en çok konuşulan sahnelerinden birine dönüşür. Ertesi sabah Nina yalnız uyanır ve Lily'ye sorduğunda Lily o gece başka biriyle gittiğini söyler. Yani gördüğümüz şeyin gerçek mi halüsinasyon mu olduğunu film bize hiçbir zaman açıkça söylemez.",
        "Bize kalırsa sahnenin gerçek olup olmaması ikinci planda kalıyor. Asıl önemli olan, Nina'nın yıllarca yasak saydığı bir arzuya yaklaşabilmesi ve bunu ancak zihninin içinde, başka birinin yüzüyle yaşayabilmesi.",
        "Tırnak, aynalar, Lily gecesi: hepsinin ortak noktası, kendine hiç nefes aldırmayan bir mükemmeliyetçilik. Peki bu bir erdem mi? Belki bir noktaya kadar. Bir sanatçıyı ayakta tutan disiplin, aynı zamanda onu içeriden yiyen şeyin de kendisi olabilir. Nina örneğinde ikisini birbirinden ayıran çizgiyi kimse çizemiyor.",
        "Natalie Portman, balenin çok takıntılı bir sanat olduğunu söylemiş: her gün aynı barre çalışması, ayakkabıların hep aynı ritüelle hazırlanması. Aronofsky de balerinlerin ayakkabıları deldiğini ve kanı biriktirdiğini anlatmış. Yani Nina'nın takıntıları o dünyanın dışından gelen bir sapma sayılmaz, olağan halinin uç noktasıdır. Bu ayrıntı filmin ilk yarısında insanın sırtını ürpertirken bir soruyu da akla getiriyor: bir disiplinin ne kadarı sağlıklı, ne kadarı hastalıklı? Bunu sahnenin kendisi bile ayırt edemiyorsa Nina'dan ayırt etmesini nasıl bekleriz?"
      ),
    }),

    block('SECTION_HEADING', 'scene-3', { en: "White Swan, Black Swan: Two Ninas", tr: "Beyaz Kuğu vs. Siyah Kuğu: İki Farklı Nina" }),
    block('IMAGE', 'scene-3', {
      imageUrl: img.kugular,
      altEn: "Nina as the Black Swan, with white swans blurred behind her.",
      altTr: "Siyah Kuğu kostümüyle Nina, arkasında bulanık beyaz kuğular.",
    }),
    block('SECTION_TEXT', 'scene-3', {
      en: P(
        "Having one dancer play both roles in Swan Lake is the central idea of the film. Aronofsky has said the pairing reminded him of Dostoevsky's The Double.",
        "The White Swan asks for control and correctness. Her dance glides and is graceful, her feeling on stage is innocence and fragility, and it is what Nina has done for years. The Black Swan asks for desire and daring. Her dance is sharp and provocative, her feeling on stage is seduction and power, and it is what Nina has never allowed herself."
      ),
      tr: P(
        "Kuğu Gölü'nde aynı dansçının iki rolü birden oynaması, filmin merkezindeki fikir. Aronofsky bu ikiliği görünce aklına Dostoyevski'nin Çift'inin geldiğini anlatmış.",
        "Beyaz Kuğu kontrol ve doğruluk ister. Dansı süzülen ve zariftir, sahnedeki duygusu masumiyet ve kırılganlıktır, Nina yıllardır yalnızca bunu yapmıştır. Siyah Kuğu ise arzu ve cüret ister. Dansı keskin ve kışkırtıcıdır, sahnedeki duygusu baştan çıkarma ve güçtür, Nina bunun için kendine hiç izin vermemiştir."
      ),
    }),

    block('SECTION_HEADING', 'scene-4', { en: "The transformation that will not come", tr: "Yapılamayan dönüşüm" }),
    block('IMAGE', 'scene-4', {
      imageUrl: img.donusum,
      altEn: "Nina in the White Swan headdress, a hand pressed to her face.",
      altTr: "Beyaz Kuğu başlığıyla Nina, eli yüzünde.",
    }),
    block('SECTION_TEXT', 'scene-4', {
      en: P(
        "At the start Nina can only dance the White Swan. Thomas sees this in the first rehearsals and turns up the pressure: he tells her the biggest obstacle in her path is herself and asks her to let go of control. The harder she tries, the more she struggles, because letting go is a movement nobody ever taught her.",
        "The costumes make the duality visible. Nina wears pink and white at the start while Lily wears black and grey, and as the film goes on the colours begin to bleed into each other. Someone forced to house two characters in one body was always going to blur for everyone watching, too.",
        "From here the film becomes the story of Nina facing her own suppressed side. She borrows from everyone, from Beth, from Lily, even from Thomas, until on stage her wings finally open fully. To us this is the most moving moment in the film: Nina dances for the first time without waiting for anyone's approval. But there is a price, and it is everything stored behind each of her movements being set free at once.",
        "So we are left asking: does facing the darker side make an artist perfect, or drive her mad? The film brings the two so close together that the answer depends on the viewer's own tolerance."
      ),
      tr: P(
        "Nina başlangıçta yalnızca Beyaz Kuğu'yu oynayabiliyor. Thomas bunu ilk provalarda görüyor ve baskıyı artırıyor: Nina'nın önündeki en büyük engelin kendisi olduğunu söylüyor, kontrolü bırakmasını istiyor. Nina denedikçe daha fazla zorlanıyor, çünkü kontrolü bırakmak ona hiç öğretilmemiş bir hareket.",
        "Kostümlere bakınca bu ikilik gözle görülür hale geliyor: Nina filmin başında pembe ve beyaz giyerken Lily siyah ve gri giyer. Film ilerledikçe renkler birbirine sızmaya başlar. Tek bir bedenin içinde iki karakteri yaşatmak zorunda kalan birinin, dışarıdan bakan herkes için de bir karışıklık kaynağına dönüşmesi kaçınılmazdı.",
        "Bu noktadan sonra film, Nina'nın kendi bastırılmış tarafıyla yüzleşme hikâyesine dönüşüyor. Kullandığı her şeyi Beth'ten, Lily'den, hatta Thomas'tan alıyor ve sonunda sahnede kanatları tamamen açılıyor. Bize göre filmin en etkileyici anı tam da bu: Nina ilk kez kimsenin onayını beklemeden dans ediyor. Ama bunun bedeli, her bir hareketinin arkasında birikmiş olan şeylerin bir anda serbest kalması.",
        "Gerçekten de sormak gerekiyor: karanlık tarafla yüzleşmek bir sanatçıyı mükemmelleştirir mi, yoksa delirtir mi? Film ikisini birbirine o kadar yaklaştırıyor ki cevap, izleyenin kendi tahammülüne kalıyor."
      ),
    }),

    block('SECTION_HEADING', 'scene-5', { en: "Mother and Daughter: Control and Sexuality", tr: "Anne-Kız İlişkisi: Kontrol ve Cinsellik" }),
    block('IMAGE', 'scene-5', {
      imageUrl: img.erica,
      altEn: "Erica at the kitchen table with Nina in the foreground.",
      altTr: "Mutfak masasında Erica, önde Nina.",
    }),
    block('SECTION_TEXT', 'scene-5', {
      en: P(
        "Erica was once a ballerina, and her career ended when she became pregnant with Nina. We hear it several times and it always leads to the same sentence: she gave up everything for her daughter. She knows every development backstage. The day Nina wins the role she brings a cake, and when Nina turns it down she throws it in the bin. Love and punishment sit in the same hand."
      ),
      tr: P(
        "Erica bir zamanlar balerinmiş ve kariyeri, Nina'ya hamile kalınca bitmiş. Filmde bunu birkaç kez duyuyoruz ve her seferinde aynı cümleye çıkıyor: kızı için her şeyden vazgeçti. Sahne arkasındaki her gelişmeyi Erica bilir, Nina'nın rolü aldığı gün pasta getirir, Nina istemeyince pastayı çöpe atar. Sevgi ile ceza aynı elde duruyor."
      ),
    }),
    block('QUOTE', 'scene-5', { en: "Love and punishment sit in the same hand.", tr: "Sevgi ile ceza aynı elde duruyor." }),

    block('SECTION_HEADING', 'scene-6', { en: "Pink walls and soft toys", tr: "Pembe duvarlar ve peluş oyuncaklar" }),
    block('IMAGE', 'scene-6', {
      imageUrl: img.lilyOda,
      altEn: "Lily standing in Nina's pink bedroom.",
      altTr: "Nina'nın pembe odasında duran Lily.",
    }),
    block('SECTION_TEXT', 'scene-6', {
      en: P(
        "Nina's room looks as if it belongs to a child: pink walls, soft toys, a music box. Erica allows no locks on the doors. When Nina tries at night to have a moment that belongs only to her, she finds her mother dozing in the armchair in her room. This part of the film tells us that everything about Nina's sexuality has to remain under her mother's eye.",
        "Erica's gaze never leaves Nina. The portraits on the walls of the flat turn, as Nina's tension rises, into eyes that watch her. The mother may believe the watching is protection, but never being out of sight also closes the road to Nina becoming a person of her own.",
        "That is why Thomas's \"let go of control\" does not reach Nina as an ordinary piece of artistic direction. Telling a body that has been restricted for years to \"be free\" means teaching it a language from scratch. Erica knows this, and her opposition has a reason.",
        "Is Erica trying to protect Nina, or taking revenge for her own failure? To us the two are intertwined, and Erica herself could probably not say which weighs more. There is an Erica in all our lives: a mother, a teacher, an elder in the family, someone who decided what we should become before we did. What makes Erica so unnerving is that she is a narcissistic mother who treats her daughter as an extension of her own unfinished life. Every success of Nina's is written into Erica's story, and every fall becomes a loss she claims as her own."
      ),
      tr: P(
        "Nina'nın odası bir çocuğa aitmiş gibi duruyor: pembe duvarlar, peluş oyuncaklar, müzik kutusu. Erica kapılara kilit koydurmaz. Nina geceleri bir an kendine ait olmaya çalıştığında, annesini odasında koltukta uyuklarken bulur. Filmin bu kısmı bize şunu anlatıyor: Nina'nın cinselliğine dair her şey, annesinin gözü altında kalmak zorunda.",
        "Erica'nın gözü Nina'nın üzerinden hiç ayrılmaz. Evin duvarlarındaki portreler, Nina'nın gerginliği arttıkça ona bakan gözlere dönüşür. Anne bu bakışın bir koruma olduğunu düşünüyor olabilir, ama Nina'nın hiçbir zaman gözden uzak kalamaması, kendi başına bir kişiliğe dönüşmesinin önünü de kapatıyor.",
        "Bu yüzden Thomas'ın \"kontrolü bırak\" talebi Nina'ya sıradan bir sanat talimatı gibi ulaşmıyor. Yıllardır sınırlanmış bir bedene \"özgür ol\" demek, ona bir dili baştan öğretmek demek. Erica bunun farkında ve karşı çıkmasının bir gerekçesi var.",
        "Peki Erica, Nina'yı korumaya mı çalışıyor, yoksa kendi başarısızlığının intikamını mı alıyor? Bize kalırsa ikisi iç içe geçmiş durumda ve Erica'nın kendisi de hangisinin ağır bastığını bilmiyor. Hepimizin hayatında bir Erica vardır: bir anne, bir öğretmen, bir aile büyüğü, bize ne olmamız gerektiğini bizden önce karar vermiş biri. Erica'yı bu kadar ürkütücü kılan da narsist bir anne olması: kızını kendi yarım kalmış hayatının uzantısı olarak görüyor. Nina'nın her başarısı Erica'nın kendi hikâyesine yazılıyor, her düşüşü de onun sahiplendiği bir kayıp oluyor."
      ),
    }),

    block('SECTION_HEADING', 'scene-7', { en: "Thomas: Art Director or Manipulator?", tr: "Thomas: Sanat Yönetmeni mi, Manipülatör mü?" }),
    block('IMAGE', 'scene-7', {
      imageUrl: img.thomas,
      altEn: "Nina in white make-up, with Thomas leaning in behind her.",
      altTr: "Beyaz makyajlı Nina, arkasında ona eğilen Thomas.",
    }),
    block('SECTION_TEXT', 'scene-7', {
      en: P(
        "Thomas is the man who casts Nina in the lead, yet he keeps breaking her down and rebuilding her at the next step. In rehearsal he tells her the only obstacle is herself; then he kisses her, and when Nina bites him he treats it as a gesture. For Thomas, Nina breaking is a stage the art requires.",
        "The Swan Lake story Thomas tells early in the film is in fact the map of the road ahead of Nina: a girl trapped inside a swan, a black swan who seduces the prince, and death as the only way to end the pain. Nina plays this script on stage and lives it in her own life. The story the art director tells becomes the draft of what will happen to his dancer."
      ),
      tr: P(
        "Thomas, Nina'yı başrole seçen adam, ama bunu yaparken onu sürekli kırıyor ve bir sonraki adımda yeniden kuruyor. Provada \"önündeki tek engel sensin\" der, sonra Nina'yı öper ve Nina onu ısırdığında bunu bir jest olarak kabul eder. Thomas için Nina'nın kırılması, sanatın gerektirdiği bir aşama.",
        "Thomas'ın filmin başında anlattığı Kuğu Gölü hikâyesi, aslında Nina'nın önündeki yolun haritası: kuğuya hapsolmuş bir kız, onu baştan çıkaran bir siyah kuğu ve bu acıyı bitirmenin tek yolu olarak ölüm. Nina bu senaryoyu bir oyuncu olarak canlandırmakla kalmıyor, rolü kendi hayatında yaşıyor. Sanat yönetmeninin anlattığı hikâye, oyuncusunun başına gelecek şeyin taslağına dönüşüyor."
      ),
    }),

    block('SECTION_HEADING', 'scene-8', { en: "Beth's shadow", tr: "Beth'in gölgesi" }),
    block('IMAGE', 'scene-8', {
      imageUrl: img.beth,
      altEn: "Beth raising a glass at a party, with Nina turned away in the foreground.",
      altTr: "Bir davette kadeh tutan Beth, önde arkası dönük Nina.",
    }),
    block('SECTION_TEXT', 'scene-8', {
      en: P(
        "Beth is Thomas's previous star, pushed out of the company. Nina takes her belongings, then Beth ends up in hospital after being hit by a car. Was it an accident or an attempted suicide? The film leaves it open, and the uncertainty serves Thomas: Beth stands in front of Nina as both a warning and a future. Anyone who remembers what Beth does to herself in the hospital scene will understand why Nina is more determined from that moment on."
      ),
      tr: P(
        "Beth, Thomas'ın önceki yıldızı ve şirketten zorla ayrılan isim. Nina onun eşyalarını alıyor, sonra Beth bir araba çarpmasıyla hastanelik oluyor. Kaza mıydı, yoksa bir intihar girişimi mi? Film bunu net bırakmıyor ve bu belirsizlik Thomas'ın işine yarıyor: Nina'nın karşısında hem bir uyarı hem bir gelecek olarak duruyor. Hastane sahnesinde Beth'in kendine ne yaptığını hatırlayanlar, Nina'nın neden o andan sonra daha da kararlı olduğunu anlayacaktır."
      ),
    }),

    block('SECTION_HEADING', 'scene-9', { en: "The admiration at the end", tr: "Finaldeki hayranlık" }),
    block('SECTION_TEXT', 'scene-9', {
      en: P(
        "As the curtain falls Thomas runs to Nina. His face is that of a director who has just won the greatest victory of his art. The moment before he sees the blood is among the most unsettling in the film, because the audience knows what has happened while Thomas sees only the performance.",
        "What disturbs us in this scene is that we can never fully read Thomas's intent. Before he registers the blood he is already in awe of the performance. The moment a director who puts art before people is at his best is also the moment he is most dangerous. It has an everyday counterpart: a manager who, when a team that has worked past midnight for weeks hands over the job, says \"great, let's do the next one like this\" and never asks what the work took from whom.",
        "To us Thomas is so devoted to his art that he has grown used to seeing the person in front of him as material. The question is this: is Thomas preparing Nina for art, or consuming her for his own ego? Bosses in working life are familiar too: those who add \"this job is done with passion\" to overtime, who raise the bar after every finished task and offer neither promotion nor rest in return."
      ),
      tr: P(
        "Finalde perde kapanırken Thomas, Nina'nın yanına koşar. Yüzünde, sanatının en büyük zaferini kazanmış bir yönetmenin ifadesi var. Kanı görmeden önceki o an, filmin en rahatsız edici anlarından biri, çünkü izleyici ne olduğunu bilirken Thomas yalnızca performansı görüyor.",
        "Bu sahnenin rahatsız edici yanı, Thomas'ın niyetini tam olarak çözememiz. Kanı görüp durmuyor, önce performansa hayran kalıyor. Sanatı insanın önüne koyan bir yönetmenin en iyi olduğu an ile en tehlikeli olduğu an aynı ana denk geliyor. Bunun gündelik bir karşılığı var: haftalarca gece yarısına kadar çalışan bir ekibin teslim ettiği işe \"harika, bir sonrakini de böyle yapalım\" diyen ama o işin kimden neyi götürdüğünü hiç sormayan bir yönetici.",
        "Bize kalırsa Thomas kendi sanatına o kadar bağlı ki karşısındaki insanı bir malzeme olarak görmeye alışmış. Soru şu: Thomas, Nina'yı sanata mı hazırlıyor, yoksa kendi egosu için mi tüketiyor? İş hayatındaki Thomas'lar da tanıdık: fazla mesaiye \"bu iş tutkuyla yapılır\" gerekçesini ekleyen, her tamamlanan işin ardından çıtayı yükselten ama karşılığında ne terfi ne dinlenme sunan patronlar."
      ),
    }),

    block('SECTION_HEADING', 'scene-10', { en: "Ending: \"Perfect\", Triumph or Tragedy?", tr: "Final: \"Perfect\": Zafer mi, Trajedi mi?" }),
    block('IMAGE', 'scene-10', {
      imageUrl: img.final,
      altEn: "Nina on the mattress after the final fall, seen from above, surrounded by dancers.",
      altTr: "Finaldeki düşüşün ardından şiltede Nina, çevresinde dansçılar, üstten çekim.",
    }),
    block('SECTION_TEXT', 'scene-10', {
      en: P(
        "After the Black Swan performance, in the dressing room, Nina believes she has wounded Lily with a shard of mirror. Moments later Lily walks in to congratulate her, and Nina sees that the wound is in her own stomach. She goes on for the last scene, the death of the White Swan, and finishes the dance bleeding. As the swan leaps from the cliff Nina lets herself fall onto the mattress behind her, the audience rises and Thomas notices the blood. Nina says one sentence: \"I felt it. Perfect. It was perfect.\"",
        "Aronofsky has described the film as a retelling of Swan Lake. That helps with the ending: in Swan Lake, too, the swan princess dies at the close, and in ballet's own language that death is a release. The film takes the traditional ending and carries it into a dancer's real body, lifting the curtain between stage and life. Nina goes beyond playing the ending of the role and lives it.",
        "One reading says Nina finally made it. She lost herself to reach the place she had been trying to reach all her life, the moment an artist gives everything, and that moment became a performance no audience will forget. This reading takes Nina's last words at face value: she finds the moment perfect, and we have no right to take that judgement from her. On this view her death is a chosen ending.",
        "The other reading argues the opposite. Nina is the victim of an art system: her mother limited her for years, Thomas broke her, the company put her in a previous star's place, and the myth called perfection came to look more valuable to her than her own life. In this reading \"Perfect\" sounds like the last breath of exhaustion. As the screen turns white we remember that nobody ever told Nina \"enough\".",
        "To us both readings carry equal weight inside the film, and being able to defend both is what makes it so unsettling."
      ),
      tr: P(
        "Siyah Kuğu performansından sonra soyunma odasında Nina, Lily'yi kırık bir ayna parçasıyla yaraladığını sanır. Az sonra Lily içeri girip onu tebrik eder ve Nina, yaranın aslında kendi karnında olduğunu görür. Yine de son sahneye, Beyaz Kuğu'nun ölümüne çıkar ve dansı kanayarak bitirir. Kuğu kayalıklardan atlarken Nina arkadaki şilteye kendini bırakır, seyirci ayağa kalkar, Thomas kanı fark eder. Nina ise tek bir cümle söyler: \"I felt it. Perfect. It was perfect.\"",
        "Aronofsky filmi bir Kuğu Gölü yeniden anlatımı olarak tarif etmiş. Bu tarif, finali okurken işimize yarıyor: Kuğu Gölü'nde de kuğu prenses hikâyenin sonunda ölür ve bu ölüm balenin kendi dilinde bir kurtuluş sayılır. Film bu geleneksel sonu alıp bir balerinin gerçek bedenine taşıyor ve sahne ile hayat arasındaki perdeyi kaldırıyor. Nina rolün sonunu oynamaktan öteye geçip yaşıyor.",
        "Bir okumaya göre Nina sonunda başardı. Hayatı boyunca ulaşmaya çalıştığı yere, bir sanatçının kendini bütünüyle verdiği ana varmak için kendini kaybetti ve o an, hiçbir seyircinin unutmayacağı bir performansa dönüştü. Bu okuma Nina'nın son sözünü kelimesi kelimesine ciddiye alır: Nina yaşadığı anı mükemmel buluyor ve bu yargıyı ondan almaya hakkımız yok. Buna göre ölüm bir kayıp sayılmaz, seçilmiş bir bitiştir.",
        "Diğer okuma tersini savunuyor. Nina bir sanat sisteminin kurbanı: annesi onu yıllarca sınırladı, Thomas onu kırdı, şirket onu bir önceki yıldızın yerine koydu ve mükemmellik denen mit, ona kendi hayatından daha değerli göründü. Bu okumada \"Perfect\" bir tükenişin son nefesi gibi duyuluyor. Ekran beyaza dönerken kimsenin Nina'ya \"yeter\" demediğini hatırlıyoruz.",
        "Bize göre iki okuma da filmin içinde eşit ağırlıkla duruyor ve ikisini birden savunabilmek, filmi bu kadar rahatsız edici kılan şey."
      ),
    }),
    block('QUOTE', 'scene-10', { en: "As the screen turns white we remember that nobody ever told Nina \"enough\".", tr: "Ekran beyaza dönerken kimsenin Nina'ya \"yeter\" demediğini hatırlıyoruz." }),

    block('SECTION_HEADING', 'scene-11', { en: "Today: Are We All Nina?", tr: "Güncel Dünya: Hepimiz Birer Nina mıyız?" }),
    block('SECTION_TEXT', 'scene-11', {
      en: P(
        "Since Black Swan came out the world has moved a little closer to Nina's. On social media everyone runs a shop window: flawless holidays, tidy homes, faces that are always smiling. The rehearsal, the itching and the bleeding fingertips behind that window never make it into the frame.",
        "The oddest thing about the window is that everyone takes everyone else's for real. Nina, trying to step into Beth's place, takes her belongings as if flawlessness were something to be inherited like a lipstick or a pair of earrings. We too set someone else's life in front of us as \"how it should be\" and weigh our own by its measure.",
        "Fitness, diets and cosmetic procedures have turned the body from a place to rest into a project always awaiting improvement. The discipline Nina applies to her body every day we file, under the heading of \"healthy living\", as ordinary. The line between healthy living and punishing the body rarely sits where anyone is looking.",
        "For content creators and influencers the picture is sharper still: the performance shown today must be surpassed tomorrow, and a pause means vanishing. Imagine Thomas's demand for \"more\" being renewed constantly by an algorithm. We too have sometimes edited a photograph over and over before posting it, and told ourselves before publishing a piece that it still was not enough.",
        "Are we all Nina Sayers today? Saying no is easy, but think for a moment about where in your own life you hold yourself this tightly. The answer may surprise you."
      ),
      tr: P(
        "Black Swan çıktığından beri dünya, Nina'nın dünyasına biraz daha yaklaştı. Sosyal medyada herkes bir vitrin işletiyor: kusursuz tatiller, düzenli evler, hep gülen yüzler. O vitrinin arkasındaki prova, kaşıntı ve kanayan parmak uçları ise kadraja girmiyor.",
        "Fitness, diyet ve estetik uygulamalar, bedeni bir dinlenme alanı olmaktan çıkarıp sürekli iyileştirilmesi gereken bir projeye çevirdi. Nina'nın bedenine her gün uyguladığı disiplini biz de \"sağlıklı yaşam\" başlığı altında sıradan sayıyoruz. Sağlıklı yaşam ile bedeni cezalandırma arasındaki çizgi ise çoğu zaman kimsenin baktığı yerde durmuyor.",
        "Bu vitrinin en tuhaf yanı, herkesin ötekinin vitrinini gerçek sanmasıdır. Nina da Beth'in yerine geçmeye çalışırken onun eşyalarını alıyor, sanki kusursuzluk bir ruj ya da küpe gibi devralınabilecek bir şeymiş gibi. Biz de bir başkasının hayatını \"böyle olmalı\" diye önümüze koyup kendi hayatımızı onun ölçüsüyle tartıyoruz.",
        "İçerik üreticileri ve influencer'lar için tablo daha da keskin: bugün gösterilen performans yarın aşılmak zorunda, ara vermek görünmez olmak anlamına geliyor. Thomas'ın \"daha fazlası\" talebinin bir algoritma tarafından sürekli yenilendiğini düşünün. Biz de bazen bir fotoğrafı yüklemeden önce defalarca düzenledik, bir yazıyı yayımlamadan önce hâlâ yetmiyor dedik.",
        "Bugün hepimiz birer Nina Sayers mıyız? Hayır demek kolay, ama kendi hayatınızda hangi konuda kendinizi bu kadar sıkı tuttuğunuzu bir kez düşünün. Cevap sizi şaşırtabilir."
      ),
    }),

    block('SECTION_HEADING', 'scene-12', { en: "Conclusion", tr: "Sonuç" }),
    block('SECTION_TEXT', 'scene-12', {
      en: P(
        "Art for art's sake. Black Swan carries the sentence somewhere else: if art exists only for itself, the person who has to give herself to that art is often the artist. Nina's story is the story of a woman wrestling with a perfection that would not fit inside her.",
        "In this piece we looked at everyone in Nina's life: her own body, her mother, her director, her rival. They shared one thing: each put a higher value on the idea of perfection than on Nina. Beth's fate was the previous chapter and Nina's ending the sequel. The system the film shows is ready to put a new dancer in place the moment one believes she is indispensable."
      ),
      tr: P(
        "Sanat, sanat içindir. Black Swan bu cümleyi başka bir yere taşıyor: sanat yalnızca kendisi için varsa, o sanatın kendini vermesi gereken kişi, çoğu zaman sanatçının kendisi oluyor. Nina'nın hikâyesi bir kadının performansının, bir kadının kendisine sığmayan bir mükemmellik fikriyle nasıl boğuştuğunun hikâyesi.",
        "Bu yazıda Nina'nın hayatındaki herkese baktık: kendi bedeni, annesi, yönetmeni, rakibi. Hepsinin ortak bir noktası vardı, mükemmellik fikrine Nina'dan daha büyük bir değer biçmişlerdi. Beth'in kaderi bunun bir önceki bölümüydü, Nina'nın finali ise devamı. Filmin bize gösterdiği sistem, bir kişinin vazgeçilmez olduğunu sandığı anda onun yerine yenisini koymaya hazır bir sistem."
      ),
    }),
    block('VERDICT_TEXT', 'verdict', {
      en: "The question the film leaves us is still standing: can an artist stay human and be perfect? The answer is waiting somewhere in the everyday life of each of us, in the place where we forgot to say \"enough\".",
      tr: "Filmin bize bıraktığı soru hâlâ yerinde duruyor: bir sanatçı insan kalarak mükemmel olabilir mi? Bu sorunun cevabı hepimizin gündelik hayatında bir yerde, \"yeter\" demeyi unuttuğumuz alanda bekliyor.",
    }),
  ];
}

const meta = {
  titleEn: "Art for Art's Sake, Nothing Left for Nina",
  titleTr: 'Sanat, Sanat İçindir; Nina, Nina İçin Değil',
  kickerEn: 'DEEP READING',
  kickerTr: 'DERİN OKUMA',
  axisEn: "Perfectionism, the darker self and an artist's self-destruction in Black Swan.",
  axisTr: "Black Swan'da mükemmeliyetçilik, karanlık taraf ve sanatçının kendini yok etmesi.",
  imageUrl: null,
  imageUrlLarge: null,
  imageAltEn: 'Nina Sayers as the Black Swan, in a crown and dark eye make-up.',
  imageAltTr: 'Siyah Kuğu kostümü, taç ve koyu göz makyajıyla Nina Sayers.',
  // Film: sezon/bölüm kavramı yok. null => spoilerFree=true olur (yanlış etiket
  // riski), backend'de film için spoiler alanı kararı bekleniyor.
  spoilerThroughSeasonNumber: null,
  spoilerThroughEpisodeNumber: null,
  recommendedRank: null,
  status: 'PUBLISHED',
  format: 'ANALYSIS',
  // Sabit: canlı kayıttaki (id 954) yayın zamanı, PUT'ta değişmesin diye.
  publishedAt: '2026-09-26T22:22:36.809Z',
  readingTimeMinutes: 12,
  imageKey: 'cover',
  tags: [{ subjectType: 'MOVIE', subjectId: 3, seasonNumber: null, episodeNumber: null, franchiseId: null }],
};

await publishBlog({ outputName: 'black-swan-sanat-nina', meta, buildBlocks, images });
