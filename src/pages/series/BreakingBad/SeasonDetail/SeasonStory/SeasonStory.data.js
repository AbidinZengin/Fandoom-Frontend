// Sezonun "inceleme" içeriği — kullanıcı kararıyla (2026-08) gerçek bir TV
// inceleme yazısı formatına/sesine geçti (referans: kullanıcının verdiği
// House of the Dragon S3 incelemesi örneği): giriş + alt-başlıklı bölümler +
// fotoğraf/altyazı/kredi + kapanış yargısı, oyuncu/karakter odaklı eleştirmen
// tonu. Önceki akademik/tematik sahne-analizi sesinin YERİNE geçti — bu artık
// editorial-voice skill'inin derin-analiz sesinden BİLİNÇLİ bir sapma, sadece
// bu inceleme formatı için.
//
// Backend'de sezon-seviyesi editöryel alan YOK — bu yüzden içerik burada
// FRONTEND-ONLY mock harita olarak tutuluyor (Highlights'taki [veri]
// istisnasının aynısı). `photo.episodeNumber`, SeasonStory.jsx'te gerçek
// `episodes[]` listesinden (zaten backend'den çekiliyor) o bölümün
// stillImageUrl'ini bulmak için kullanılır — SAHTE görsel/URL yok, sadece
// zaten var olan gerçek bölüm fotoğrafları farklı bir bağlamda gösteriliyor.
// Sadece Sezon 1 dolu — diğer sezonlarda component render edilmez.
//
// TASLAK NOTU: Bu, kullanıcının verdiği yön doğrultusunda hazırlanmış İLK
// yazım turu — SeasonStory.source.tr.md ve docs/content/ altındaki önceki
// (akademik sesli) taslakla senkron DEĞİL, kullanıcı onayı bekliyor.

const SEASON_STORIES = {
  1: {
    kicker: 'İNCELEME · SEZON 1',
    title: 'Değişimin Kimyası',
    dek: "Orta yaşlı, hayal kırıklığına uğramış bir kimya öğretmeni; ölümcül bir teşhis; ve elinde kalan zamanı ailesine bırakacağı parayla ölçme kararı. Breaking Bad'in yedi bölümlük ilk sezonu Walter White'ı sınıfın flüoresan ışığından çölün hazmat sarısına taşıyor — bu bir kaza değil, bir seçim, ve dizinin geri kalanı bu seçimin faturasını ödeyecek.",
    lede: [
      "Breaking Bad, Ocak 2008'de AMC ekranlarına düştüğünde arkasında ne bir sadakat ne de bir beklenti vardı — dizi kanalın ilk orijinal dramı bile değildi, o unvanı Mad Men çoktan almıştı. Vince Gilligan'ın kendi tabiriyle \"Bay Chips'ten Scarface'e\" formülü kağıt üzerinde bir slogan gibi duruyordu: bir kimya öğretmenini birkaç bölümde bir uyuşturucu baronuna çevirmek. Ekranda bu kadar hızlı olmuyor — ama tam da bu yüzden işe yarıyor.",
      "2007-2008 yazar grevi sezonu dokuz bölümden yediye indirdi ve bu kesinti hikâyeyi hem yoğunlaştırdı hem zorladı: pilot bölümle final arasında hiç boş sahne yok, ama bazı ilişkiler — özellikle aile hattı — nefes alacak yer bulamadan sezon bitiyor.",
    ],
    sections: [
      {
        id: 'strong-start',
        heading: 'Breaking Bad Sağlam Bir Girişle Başlıyor',
        photo: {
          episodeNumber: 1,
          caption: 'Walter White (Bryan Cranston), pilot bölümün açılışında New Mexico çölünde.',
          credit: 'AMC',
        },
        paragraphs: [
          "Pilot bölüm, Walter White'ı bir laboratuvarda değil bir sınıfta tanıtıyor ve bu sıralama tesadüf değil. Bryan Cranston, kanser teşhisinden önceki Walt'ı o kadar küçük, o kadar bastırılmış oynuyor ki karakterin patlaması bir dönüşüm değil bir rahatlama gibi hissettiriyor.",
          "Kurgusal açılış — çölde savrulan bir pantolon, gaz maskeli, iç çamaşırlı bir sürücü — diziye ton sözleşmesini daha ilk dakikada imzalatıyor: bu, trajedi kadar kara komedi de olacak. Sahnenin gücü, izleyicinin bunu bir kaza sanmasından geliyor; oysa maskenin ardındaki adam bir itiraf kaydediyor.",
        ],
        pullQuote: 'Sınıf onu küçültür; kanser onu yalnızca haklı çıkarır.',
      },
      {
        id: 'jesse-and-walt',
        heading: 'Jesse ve Walt, Tehlikeli Bir Ortaklık Kuruyor',
        photo: {
          episodeNumber: 2,
          caption: "Jesse Pinkman (Aaron Paul), RV'nin dar iç mekânında, hazmat takımıyla.",
          credit: 'AMC',
        },
        paragraphs: [
          "Aaron Paul'un Jesse'si sezonun en büyük sürprizi. \"Cap'n Cook\" lakaplı sokak kimyacısı bir maske; performansın asıl işi bu maskeyi bölüm bölüm indirmek. Walt'ın karşısında Jesse hâlâ bir öğrenci — sadece artık sınıfta değil, karavanda.",
          "Krazy-8'in bodrumda zincirlenmesi sezonun etik dönüm noktası, ve Cranston bu sahnede kariyerinin en soğukkanlı anlarından birini veriyor: sarı bir not defterine artı-eksi yazan bir adam, vicdanını değil bir mühendislik problemini çözüyor gibi.",
        ],
        pullQuote: 'Liste bir vicdan rahatlatma değil, bir mühendislik belgesidir.',
      },
      {
        id: 'family-front',
        heading: 'Aile Cephesinde Eksik Kalan',
        photo: {
          episodeNumber: 5,
          caption: 'Skyler (Anna Gunn) ve Walt (Bryan Cranston), doğum günü partisinde.',
          credit: 'AMC',
        },
        paragraphs: [
          "Anna Gunn'ın Skyler'ı, yedi bölümün verdiği dar alanda bir karakterden çok bir engel gibi yazılmış — Walt'ın gizlediği gerçeğin ne zaman patlayacağını ölçen bir saat. Gunn elinden geleni yapıyor ama malzeme onu geriden takip ediyor.",
          "Dean Norris'in Hank'i kendinden emin bir DEA maçoluğuyla komik bir rahatlama sağlıyor, RJ Mitte'nin Walt Jr.'ı ise neredeyse dekor; yemek masası sahneleri, Walt'ın çölde bıraktığı adamın hâlâ hayatta olduğunu kanıtlamaktan başka bir işe yaramıyor gibi.",
        ],
        pullQuote: 'Skyler ilk bölümlerde bir karakter değil, bir engeldir.',
      },
      {
        id: 'birth-of-heisenberg',
        heading: "Heisenberg'in Doğuşu",
        photo: {
          episodeNumber: 6,
          caption: 'Walt, saçını tıraş ettikten sonra — sezonun görsel dönüm noktası.',
          credit: 'AMC',
        },
        paragraphs: [
          "\"Crazy Handful of Nothin'\", sezonun menteşe bölümü. Cranston, Walt'ın dökülen saçlarını tıraş ederken bunu bir kayıp değil neredeyse törensel bir seçim gibi oynuyor — ayna karşısında, kontrollü.",
          "Tuco'nun ofisindeki patlamanın ardından Cranston sesini bir oktav indiriyor, omuzları genişliyor; Heisenberg burada ilk kez bir kostüm değil bir performans olarak sahneye çıkıyor, ve dizi izleyiciyi bu dönüşümün cazibesine ortak ediyor.",
        ],
        pullQuote: 'Kel kafa bir kayıp değil, bir seçimdir.',
      },
    ],
    verdict: [
      "Yedi bölüm bazen aceleci hissettiriyor — aile hattı özellikle bunun bedelini ödüyor — ama Breaking Bad'in ilk sezonu bir amatörün ilk denemesi gibi değil, tam olarak ne olduğunu bilen bir serinin kendinden emin girişi gibi kapanıyor. Cranston'ın performansı tek başına izlemeye değer; geri kalanı — kara mizah, çöl fotoğrafçılığı, Walt'ın kimya dersi kadar soğukkanlı ahlaki matematiği — onu tamamlıyor.",
      "Sezon finali bir hesaplaşmayla değil bir gecikmeyle bitiyor: Walt ailesine tedaviyi kabul edeceğini söylüyor, ama izleyici bunun son bir yalan olduğunu çoktan biliyor. Bu gecikme, dizinin geri kalanının besleneceği asıl kaynak — ve ikinci sezona güvenle geçilebileceğinin garantisi.",
    ],
  },
};

/** Sezon numarasına göre inceleme yapısı; içerik yoksa null (component render edilmez). */
export function getSeasonStory(seasonNumber) {
  return SEASON_STORIES[seasonNumber] ?? null;
}
