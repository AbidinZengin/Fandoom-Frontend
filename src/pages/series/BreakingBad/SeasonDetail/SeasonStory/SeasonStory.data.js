// Sezonun "inceleme" içeriği — kullanıcı kararıyla (2026-08-21) Portal
// (YouTube) kanalının felsefi video-deneme üslubuna uyarlandı: soru-güdümlü
// tez, disiplinler-arası kavram ödünçleme (Heidegger/Heisenberg/Adler),
// metin-içi kanıt replik, döngüsel kapanış. Önceki "TV eleştirmeni" formatını
// (House of the Dragon referanslı, "Değişimin Kimyası") VE ondan önceki
// akademik sahne-analizi sesini YERİNE geçti — editorial-voice skill'inin
// derin-analiz sesinden BİLİNÇLİ bir sapma, sadece bu "derin okuma" formatı
// için. İçerik SADECE 1. Sezona (7 bölüm) özgü, web-researcher agent'ının
// doğruladığı sahne/replik verisine dayanır (kaynak: docs/content/
// breaking-bad-s1-felsefe-blog.tr.md — TR kaynak metin, İngilizce çeviri
// DEĞİL yeniden yazımdır, SeasonStory.source.tr.md ile senkron).
//
// Backend'de sezon-seviyesi editöryel alan YOK — bu yüzden içerik burada
// FRONTEND-ONLY mock harita olarak tutuluyor (Highlights'taki [veri]
// istisnasının aynısı). `photo.episodeNumber`, SeasonStory.jsx'te gerçek
// `episodes[]` listesinden (zaten backend'den çekiliyor) o bölümün
// stillImageUrl'ini bulmak için kullanılır — SAHTE görsel/URL yok, sadece
// zaten var olan gerçek bölüm fotoğrafları farklı bir bağlamda gösteriliyor.
// Sezon 1, 2 ve 3 dolu — diğer sezonlarda component render edilmez.
//
// DİL NOTU: Üç sürüm de İNGİLİZCE — kullanıcı talebiyle sadece EN
// canlıya alındı. TR kaynaklar docs/content/ altında:
// breaking-bad-s1-felsefe-blog.tr.md (+ SeasonStory.source.tr.md),
// breaking-bad-s2-deep-reading.md (EN+TR aynı dosyada),
// breaking-bad-s3-deep-reading.md (TR, otomatik çevrildi). Component
// henüz locale-aware değil (bkz. editorial-voice skill notu), bu yüzden
// "Sonuç" etiketi de SeasonStory.jsx içinde "Reckoning" olarak
// güncellendi — tek dilde tutarlılık için.

const SEASON_STORIES = {
  1: {
    kicker: 'DEEP READING · SEASON 1',
    title: 'Growth, Then Decay, Then Transformation',
    dek: "Before cancer, before Heisenberg, Walter White had already written his own thesis — to a room that wasn't listening.",
    lede: [
      "Breaking Bad's first season is often described as an origin story — proof of how a good man goes bad. It behaves more like a confession that arrives out of order. Walter White does not become someone else over these episodes; the disguise simply stops being necessary.",
      "The question worth asking, then, is not how he changed, but what he agrees to stop hiding, what he refuses to accept, and what he eventually watches without looking away.",
    ],
    sections: [
      {
        id: 'death',
        heading: 'The Study of Change',
        photo: {
          episodeNumber: 1,
          caption: 'Walter White (Bryan Cranston), teaching before the diagnosis that will end his classroom life.',
          credit: 'AMC',
        },
        paragraphs: [
          "Before the diagnosis, before the desert, there is a classroom. Walter White tells his students that chemistry is the study of change — growth, then decay, then transformation — and delivers it as a throwaway lecture rather than a thesis, though it is exactly that. The show's real cold open is not the runaway RV; it is a bored teacher describing his own future to a room that isn't listening.",
          "The diagnosis arrives a few scenes later: inoperable lung cancer, two years at best. Martin Heidegger argued that an honest reckoning with one's own death does not diminish a person but frees them — there is no reputation left to protect. Death does not teach Walt anything he did not already know. It simply moves the exam forward.",
        ],
        pullQuote: 'Death teaches him nothing new. It only moves the exam forward.',
      },
      {
        id: 'potential',
        heading: 'A Grey Kind of Shame',
        photo: {
          episodeNumber: 5,
          caption: 'Walt and Skyler at the Schwartz party, in "Gray Matter".',
          credit: 'AMC',
        },
        paragraphs: [
          "In \"Gray Matter\", Walt and Skyler attend a party thrown by Elliott Schwartz, Walt's former research partner at Caltech and co-founder of the company that carries both their names folded into one — Schwartz and White, black and white, Gray. Someone asks which university Walt teaches at. The answer is one word, high school, and the room's silence does the rest.",
          "Elliott offers him a job and insurance, a way out with his dignity intact on paper if not in practice. Walt refuses it, furious that Skyler has told the Schwartzes about the cancer at all. The refusal is the tell: he has already turned down an easier version of the same rescue. What he is chasing is the feeling of being useful again, not safety.",
        ],
        pullQuote: 'He has already refused an easier rescue. What he wants is use, not money.',
      },
      {
        id: 'uncertainty',
        heading: 'The Man Who Cannot Be Measured',
        photo: {
          episodeNumber: 6,
          caption: 'Walt, newly bald, in the office of a dealer named Tuco.',
          credit: 'AMC',
        },
        paragraphs: [
          "By \"Crazy Handful of Nothin'\", chemotherapy has taken his hair, and Walt shaves the rest himself — not a loss so much as a decision, watched in a mirror. Bald, he walks into the office of a dealer named Tuco and demands fifty thousand dollars for a beating and a stolen batch. Asked his name, he offers exactly one word.",
          "\"Heisenberg\" is not a disguise so much as a diagnosis. The physicist's uncertainty principle holds that a particle's speed and position cannot both be known at once — observe one and the other blurs. From this scene on, Walt is that particle: the schoolteacher and the man in this office cannot be measured at the same time. Every inch given to one is borrowed from the other.",
        ],
        pullQuote: 'Heisenberg.',
      },
      {
        id: 'closing',
        heading: 'An Invitation, Not a Confession',
        photo: {
          episodeNumber: 7,
          caption: 'The season closes on a delivery that goes further than either of them planned.',
          credit: 'AMC',
        },
        paragraphs: [
          "The finale gives Walt one honest sentence before it takes the rest away. In the car, Skyler asks why the sex was suddenly so good. \"Because it was illegal,\" he tells her — a confession dressed as a compliment, and the only completely truthful thing he says to her all season.",
          "The season does not end there. Walt and Jesse deliver more product than Tuco asked for and collect their payment; when one of Tuco's men makes an offhand remark, Tuco beats him to death in front of them. Walt and Jesse do not run. They watch. Tuco hands over the money anyway. \"Come back next week,\" he says — and the season closes not on a reckoning but on an invitation the teacher who once described transformation as inevitable is already prepared to accept.",
        ],
        pullQuote: 'Come back next week.',
      },
    ],
    verdict: [
      "Seven episodes is not much room to build a man from scratch, and the season occasionally shows the seams — Skyler spends much of it as a device rather than a person. But the compression, forced by a writers' strike that cut the order from nine episodes to seven, suits a story about a man running out of time on purpose.",
      "What the season gets right is the order of operations. Walter White is not talked into becoming someone else. He is given permission — by a diagnosis, by a refused job offer, by a stranger's uncertainty principle — to stop pretending he was ever just the man in the classroom.",
    ],
  },
  2: {
    kicker: 'DEEP READING · SEASON 2',
    title: 'Seven Thirty-Seven, Down, Over, ABQ',
    dek: "Four episode titles spell out how the season ends before it happens — Breaking Bad's second season plants its own wreckage in plain sight.",
    lede: [
      "Season one asked what Walter White would accept once permission arrived — a diagnosis, a refused job offer, an alias. Season two asks a colder question: once he has accepted it, what does he do with the time he didn't expect to survive to see — and who is he willing to sacrifice to protect it?",
      "Thirteen episodes give the show room season one didn't have, and it spends that room tracing how a single decision — a choice not to save someone — spreads outward from Walt's closest circle to a stranger who never meets him.",
    ],
    sections: [
      {
        id: 'diagnosis',
        heading: "The Diagnosis That Wasn't",
        photo: {
          episodeNumber: 9,
          caption: 'Walt and Jesse, stranded in the desert during a marathon cook, in "4 Days Out".',
          credit: 'AMC',
        },
        paragraphs: [
          "In \"4 Days Out\", Walt misreads a scan and becomes convinced his cancer is spreading faster than his doctors think. Believing he has almost no time left, he strong-arms Jesse into a marathon cook in the desert, using a dwindling stockpile of methylamine as the excuse and mortality as the real motive.",
          "He isn't dying. Jesse leaves the keys in the ignition, the RV's battery dies, and a fire meant to keep them warm burns through their water supply. They escape only because Walt talks Jesse through building an improvised battery out of galvanised screws and brake-pad graphite. When the truth about the scan arrives — the tumour has shrunk, not grown — Walt doesn't celebrate. He locks himself in a hospital bathroom and puts his fist through a paper towel dispenser, alone. Accepting death is a one-way door; good news doesn't close it again, it only shows what Walt has already chosen to believe.",
        ],
        pullQuote: 'Acceptance of death, once granted, cannot be taken back on good news.',
      },
      {
        id: 'rival',
        heading: 'A Rival',
        photo: {
          episodeNumber: 11,
          caption: 'Jane, back on heroin and pulling Jesse with her, in "Mandala".',
          credit: 'AMC',
        },
        paragraphs: [
          "In \"Mandala\", Jane relapses after months clean — and this time she takes Jesse with her. It's the visible surface of a rivalry the season has been building quietly: Jane becomes something to Jesse that Walt can never be, an equal who tells him \"I'm your partner\" rather than a teacher who tells him what to do. For the first time, Jesse glimpses a life that doesn't require Walt's approval.",
          "That life gets a shape: Jane and Jesse plan to take their money and move to New Zealand, finishing what drugs they have left before going clean for good — a plan that requires Jesse to walk away from Walt entirely. To fund it, Jane calls Walt directly and blackmails him into paying Jesse's full share. Walt pays. From this point on, Jane isn't just Jesse's girlfriend. She is the one character in the show directly threatening Walt's business, his authority, and his hold over the person he has spent two seasons shaping.",
        ],
        pullQuote: "What Jane threatens isn't the drug business. It's Walt's ownership of Jesse.",
      },
      {
        id: 'witness',
        heading: 'The Man Who Watches',
        photo: {
          episodeNumber: 12,
          caption: 'Jesse and Jane, before the night that closes "Phoenix".',
          credit: 'AMC',
        },
        paragraphs: [
          "That same night, in \"Phoenix\", Walt arrives at the apartment to deliver Jesse's money and finds Jesse and Jane unconscious from heroin. Trying to rouse her, he rolls her onto her back — and watches her begin to choke on her own vomit. He reaches toward her. Then he stops.",
          "The season had already told us how this would happen. Two episodes earlier, in \"Over\", Jane warned Jesse never to sleep on his back in case he's sick — sleep on your side, she told him. The line returns as the exact mechanism of her death, spoken to the wrong person. The scene is weighted further by what happens just before it: earlier that night, at a bar, Walt sits beside Jane's father, Donald Margolis, and listens to him describe how he would never give up on his daughter, no matter how badly she disappointed him — not knowing whose father he's talking to. Hours later, Walt watches that same daughter die and does nothing. Critic Donna Bowman, writing for The AV Club, calls the choice \"cold-blooded murder\" outright, noting that the only thing Jane ever threatened was \"your Type A neuroses and your pocketbook.\" Walt's need to control Jesse costs a life here for the first time — a pattern the series will return to.",
        ],
        pullQuote: 'His crime is not an action. It is the absence of one — the cleanest way to remove a rival.',
      },
      {
        id: 'second-fraud',
        heading: 'A Second Kind of Fraud',
        photo: {
          episodeNumber: 7,
          caption: 'Skyler returns to work at Beneke Fabricators, in "Negro y Azul".',
          credit: 'AMC',
        },
        paragraphs: [
          "Skyler's storyline runs parallel to Walt's and quietly mirrors it. In \"Negro y Azul\" she goes back to work as a bookkeeper for her former employer, Ted Beneke, to help cover Walt's uninsured treatment. A few episodes later, in \"Mandala\", she finds irregularities in the accounts: Ted has been understating the company's income for years to keep it afloat and evading tax in the process. She quits for a day. She comes back. Like Walt, she chooses to become part of a fraud rather than expose it, because the fraud is keeping something alive.",
          "The two threads meet on the same night. While Walt watches Jane die, Skyler goes into labour; Walt, delayed by a meeting with Gus Fring, misses the birth of their daughter Holly entirely. The person who takes Skyler to hospital is Ted — her boss, nothing more, at this point in the story. Season two never crosses that line; whatever the show does with Ted and Skyler later belongs to a different season. But the scene doesn't need more than what it shows: on the same night, a child is born and a woman is left to die, and in neither room is Walt present.",
        ],
        pullQuote: "A child is born and a woman dies the same night — and Walt is absent from both rooms.",
      },
      {
        id: 'acrostic',
        heading: 'Four Titles, One Sentence',
        photo: {
          episodeNumber: 1,
          caption: 'The first black-and-white cold open of the season, months before its meaning arrives.',
          credit: 'AMC',
        },
        paragraphs: [
          "From the season's very first episode, black-and-white cold opens return again and again to a swimming pool: debris settles on the water, and among it drifts the one object still in colour — a scorched, one-eyed pink teddy bear. Across four episodes the image accumulates detail, and neither Walt nor the audience knows yet what it means.",
          "The season's structure hides the answer in plain sight. Read consecutively, the titles of those four episodes form a sentence: \"Seven Thirty-Seven\" — \"Down\" — \"Over\" — \"ABQ.\" A Boeing 737, down, over Albuquerque. The show isn't being cryptic. It's simply trusting that no one will notice until the last piece lands.",
        ],
        pullQuote: 'The season spells its own ending and dares you not to read it.',
      },
      {
        id: 'closing',
        heading: 'What Falls From the Sky Is Not a Coincidence',
        photo: {
          episodeNumber: 13,
          caption: 'The season closes over the White house, in "ABQ".',
          credit: 'AMC',
        },
        paragraphs: [
          "The wreckage has a cause, and it runs through Walt without ever touching him directly. Donald Margolis — the father from the bar, the one who said he'd never give up on his daughter — is an air traffic controller. Five weeks into grieving her, distracted at exactly the wrong moment, he lets a charter aircraft drift into the path of Wayfarer Airlines Flight 515. Two planes collide directly over the White house.",
          "In the same episode, Skyler finally learns the truth — a phone left on during Walt's cancer surgery lets his second life slip through, and she tells him to leave. He is sitting by the pool, alone, when the sky opens: burning debris rains down, and a scorched pink shape settles on the water, exactly where it has been settling, unexplained, since the season began. The season does not end with a confession. It ends with the consequence of one man's silence, delivered by the grief of a father whose warning Walt heard and ignored on the very night it mattered.",
        ],
        pullQuote: "The consequence arrives by a stranger's grief, not his own confession.",
      },
    ],
    verdict: [
      "Season two is a longer, more confident season than the first — thirteen episodes instead of seven — and it spends the extra room letting a single choice metastasise across an entire ensemble. Walt's decision not to save Jane isn't a moment of weakness; it is the direct result of his need to keep control of Jesse. Skyler's quiet partnership in Ted's fraud repeats the same mechanism at a smaller scale — both spouses now know how to look away from a lie that keeps something alive. Both threads land in the same night, the same hospital, the same absence.",
      "Nothing in the finale plays as a twist so much as an arrival. By the time the wreckage lands in his own backyard, the season has already told us, four episode titles ago, that it would — but the real warning came earlier still, on the night Walt could have saved a woman and chose not to.",
    ],
  },
  3: {
    kicker: 'DEEP READING · SEASON 3',
    title: 'Because Your Boss Is Gonna Need Me',
    dek: "By the third season, the only thing Walt has truly learned is that staying necessary is a strategy, not a talent.",
    lede: [
      "Season one gave Walt permission; season two taught him how to make other people pay for it. Season three moves on to a colder lesson still: survival in an empire isn't about being good at what you do, it's about being irreplaceable — and the surest way to guarantee that is to remove anyone who could replace you.",
      "Over thirteen episodes Walt learns this on three separate fronts at once: at home, in the lab, and in the street.",
    ],
    sections: [
      {
        id: 'ledger',
        heading: 'A Ledger, Not a Reconciliation',
        photo: {
          episodeNumber: 3,
          caption: 'Walt and Skyler, the morning after everything changes, in "I.F.T.".',
          credit: 'AMC',
        },
        paragraphs: [
          "The season opens with Walt laying his drug money on the table — the mortgage, Junior's college fund, all of it, ready. Skyler won't take it. In \"I.F.T.\", the same day, she kisses Ted Beneke in his office break room; the affair starts in that moment. That evening she tells Walt exactly what happened, in four words that give the episode its title. Walt's money hasn't bought her loyalty. It has done the opposite.",
          "By \"Green Light\", the affair continues; Ted offers to let her move in, and she refuses both the offer and the conversation about what went wrong in her marriage. This isn't romance so much as escape, and Skyler sets the limits of the escape herself. Walt, unable to be legally removed from the house, sleeps in the nursery. By \"Half Measures\", mid-season, the marriage finally gets a name — but not the name of forgiveness. If they're going to buy the car wash to launder Walt's money, they need to look, from the outside, like a reconciled couple. So they agree to four family dinners a week. By the finale, Skyler doesn't have a single line of dialogue. The arrangement still holds. It was never a pardon. It was a ledger.",
        ],
        pullQuote: "Skyler's yes was never forgiveness. It was a line item.",
      },
      {
        id: 'provider',
        heading: 'What a Man Does',
        photo: {
          episodeNumber: 6,
          caption: 'Gale Boetticher, newly hired, in "Sunset".',
          credit: 'AMC',
        },
        paragraphs: [
          "In \"Más\", Gus takes Walt beneath an industrial laundry to a hidden superlab and makes his offer. Walt refuses — the cancer diagnosis has already cost his family enough, he says; he can't afford one more wrong decision. Gus's answer is short and calculated: a man provides for his family, he says, even when he isn't appreciated, or respected, or loved for it. He simply does it, because he's a man. The line sounds like philosophy. It's a trap — Gus already knows exactly what Walt no longer gets credit for at home.",
          "That same night Walt learns about Skyler and Ted. By morning, he has taken the job. In \"Sunset\" he meets his new lab assistant: Gale Boetticher, courteous, curious, genuinely gifted at chemistry. Walt warms to him immediately — but the audience knows something Walt doesn't yet. Gus isn't training an assistant. He is quietly building an insurance policy for the day he needs to remove Walt entirely. Gale thinks he's being given an opportunity. He is being prepared to attend his own replacement's funeral.",
        ],
        pullQuote: "Gus's offer isn't philosophy. It's a trap fitted to the exact shape of what Walt no longer gets at home.",
      },
      {
        id: 'shrine',
        heading: 'A Shrine for Two Names',
        photo: {
          episodeNumber: 7,
          caption: 'The cousins close in, in "One Minute".',
          credit: 'AMC',
        },
        paragraphs: [
          "The season opens on a shrine in Mexico: a drawing of Heisenberg, left at a Santa Muerte altar by Leonel and Marco Salamanca, silent cartel enforcers hunting Walt. By \"One Minute\", the name on the shrine has changed. It's a photograph of Hank Schrader now — Walt's own actions redirected, once again, not at him but at the nearest stranger, this time his brother-in-law.",
          "The attack comes in a car park. Hank rams Leonel's car and pins it; Marco opens fire and wounds him badly. Reaching for an axe, Marco drops a stray round — Hank loads it into a gun taken off Leonel and shoots Marco through the head just in time. He survives, barely, and the episodes that follow show him relearning to use his legs, angrier and more fragile than before. Walt never fully learns why the attack happened. The shrine simply changed names, as part of a deal Gus made — the logic underneath it never changes: someone else always pays for Walt's war.",
        ],
        pullQuote: 'The name on the shrine changes. The logic underneath it never does.',
      },
      {
        id: 'half-measures',
        heading: 'No More Half Measures',
        photo: {
          episodeNumber: 12,
          caption: 'Walt intervenes, in "Half Measures".',
          credit: 'AMC',
        },
        paragraphs: [
          "When two dealers kill a child, Tomás, for having outlived his usefulness, Jesse plans to poison them with ricin, then backs out. Mike tells Walt a story from his police days: he once let an abusive husband off with a warning instead of finishing the job. The man killed his wife soon after. \"The moral of the story,\" Mike says, \"is I chose a half measure when I should have gone all the way. I'll never make that mistake again. No more half measures, Walter.\"",
          "When Jesse confronts the dealers, they draw their guns — and it isn't Jesse who intervenes. It's Walt. He drives into both men, killing one instantly and badly wounding the other; then he gets out, takes the wounded man's gun, and shoots him in the head. The only word he offers Jesse is \"Run.\" It is the first time Walt kills, in cold blood, purely to protect Jesse — and a direct rehearsal for what the finale will ask of him.",
        ],
        pullQuote: "This time it isn't a plan that saves Jesse. It's Walt's own hands — and the finale will reverse those two roles.",
      },
      {
        id: 'irreplaceable',
        heading: 'The Man Who Cannot Be Replaced',
        photo: {
          episodeNumber: 13,
          caption: 'The final phone call, in "Full Measure".',
          credit: 'AMC',
        },
        paragraphs: [
          "\"Full Measure\" ties every thread in the season to a single night. Walt confronts Gus and Mike over the dealers he killed, offering Gus a choice: kill him now, or let him keep cooking. Gus chooses the second — on the condition that Walt gets a new assistant, one Gus picks himself. It's Gale. That same night, Gus visits Gale privately, tells him about Walt's cancer, and asks him to prepare for a worst-case scenario in which he might have to run the lab alone. Gale takes it as a hypothetical.",
          "Walt finds Jesse hiding out at a laser tag arcade and lays out his real plan: as long as Gale is alive, Walt is expendable, so he intends to kill Gale himself and stage it as an accident. Jesse's only job is to find the address. That night he does — 6353 Juan Tabo Boulevard, apartment six — and reports it, just as Victor arrives to take Walt to the laundry on a fabricated \"chemical leak.\" It's the execution Gus has already ordered. As Mike prepares to shoot him, Walt panics — or seems to — and offers up Jesse's whereabouts as a betrayal. It's a performance. He calls Jesse and, loud enough for Mike and Victor to hear every word, tells him to kill Gale right now and repeats the address. Victor bolts to save Gale. He's too late. With Mike's gun still on him, Walt delivers the line the season has been building towards: \"Because your boss is gonna need me.\"",
          "Jesse reaches Gale's door and raises the gun. Gale begs — \"Please don't do this... you don't have to do this\" — and Jesse, shaking, in tears, pulls the trigger. The screen washes white with the muzzle flash before the kill itself is shown; the death is never in doubt. Walt is, once again, the one indispensable chemist. This time he hasn't achieved it with his own hands. He has achieved it with the hands of a boy who believes Walt loves him.",
        ],
        pullQuote: "The price of staying irreplaceable isn't Walt's conscience this time. It's Jesse's — and Walt chooses that on purpose.",
      },
    ],
    verdict: [
      "Season three brings back season one's theme of wasted potential, twisted into something monstrous: a man who once hated being invisible in a classroom now commits murder to avoid being replaceable in a lab. It also grows season two's theme of controlling Jesse into something worse — Jesse is no longer just kept in a partnership, he is turned into a weapon, the final proof of Walt's own indispensability. Skyler's affair with Ted, and the four-dinners-a-week arrangement that follows it, is the same logic playing out at home: not love, but the minimum appearance required to keep a system running.",
      "The same lesson repeats across three fronts — home, cartel, lab: the way to keep a relationship, an alliance, or a life going isn't to earn it, it's to eliminate the alternative. The finale's last line, \"because your boss is gonna need me\", is that lesson at its most naked — and by the time Walt says it, he is calm enough to hand his own survival strategy to a crying boy holding a gun.",
    ],
  },
  4: {
    kicker: 'DEEP READING · SEASON 4',
    title: '"Well? Get Back to Work"',
    dek: "Across season four, Gus Fring never once touches Walt himself — and that's exactly how he proves he doesn't have to.",
    lede: [
      "Season three taught Walt the price of staying necessary. Season four shows him what power actually looks like: Gus Fring never punishes Walt directly. He simply reminds him, whenever he chooses, that he could.",
    ],
    sections: [
      {
        id: 'back-to-work',
        heading: '"Well? Get Back to Work"',
        photo: {
          episodeNumber: 1,
          caption: 'Gus, unmoved, in "Box Cutter".',
          credit: 'AMC',
        },
        paragraphs: [
          "Moments after Gale's murder, Gus confronts Walt and Jesse in the lab, held by Mike and Victor. Walt launches into a long argument for his own indispensability — kill us, he says, and you have nothing. Gus says nothing back. He puts on a hazmat suit, picks up the same box cutter Gale used to open supply boxes, and cuts Victor's throat.",
          "The punishment doesn't refute the argument. It makes it irrelevant. Gus doesn't need to kill Walt or Jesse to prove his point — the man he kills is Victor, who let himself be seen at a murder scene and raised the risk to everyone. The message still reaches its intended targets. Gus changes back into his clothes and says one thing: \"Well? Get back to work.\"",
        ],
        pullQuote: "Gus proves he can punish anyone without punishing the men in front of him.",
      },
      {
        id: 'consequences',
        heading: 'The Consequences That Never Come',
        photo: {
          episodeNumber: 11,
          caption: 'Gus delivers a threat with no room for negotiation, in "Crawl Space".',
          credit: 'AMC',
        },
        paragraphs: [
          "Walt buys a gun and tries to kill Gus; Mike catches him, beats him, and lets him go. In \"Crawl Space\", Gus bars Walt from the lab entirely and spells out exactly what's keeping him alive: \"I will kill your wife. I will kill your son. I will kill your infant daughter.\" Walt scrambles for a way to disappear his family.",
          "Under that same pressure, in \"End Times\", he tells Skyler something that sounds like an admission of guilt: \"I alone should suffer the consequences of those choices, no one else.\" It plays like a rare moment of accountability — except the audience doesn't yet know Walt is already plotting to kill Gus. He isn't accepting the consequences. He's arranging for someone else to pay them.",
        ],
        pullQuote: '"I alone should suffer" — spoken while the plan is already someone else\'s to carry out.',
      },
      {
        id: 'flower',
        heading: 'A Flower With No Name',
        photo: {
          episodeNumber: 12,
          caption: "Jesse's missing cigarette, and a child in hospital, in \"End Times\".",
          credit: 'AMC',
        },
        paragraphs: [
          "When Jesse's hidden ricin cigarette goes missing and Andrea's son Brock ends up in hospital, Jesse turns his gun on Walt. Walt talks him down with a theory: Gus's men stole the cigarette and poisoned the boy. The two reunite to plan Gus's death. In \"Face Off\", the real diagnosis comes back — not ricin. Lily of the valley, an ordinary garden plant.",
          "No character ever says it out loud. The episode's final shot simply drifts to a lily of the valley growing by Walt's own pool, and the scene ends there. The only confirmation of who did it is that silence — the actual mechanism won't be explained until the following season.",
        ],
        pullQuote: 'No one names the culprit. The camera just looks at a flower.',
      },
      {
        id: 'face-off',
        heading: 'Face Off',
        photo: {
          episodeNumber: 13,
          caption: 'Gus, moments after the blast, in "Face Off".',
          credit: 'AMC',
        },
        paragraphs: [
          "Walt rigs Hector Salamanca's wheelchair with a bomb and pushes Gus toward silencing Hector himself. Hector, looking up at Gus for the first time in years, rings his bell — the trigger. Gus walks out of the blast with half his face gone, straightens his tie, takes a few steps, and falls dead — one of the show's most iconic images.",
          "When Skyler calls asking what happened, Walt's answer is two words: \"I won.\" No justification, no apology — a bare declaration of victory. The season doesn't close on the lab burning down behind him. It closes on that sentence, and on a flower no one has mentioned since.",
        ],
        pullQuote: '"I won" — the nakedest sentence Walt says all season.',
      },
    ],
    verdict: [
      "Season four is built on a single idea: real power doesn't need to touch the person it controls. Gus punishes Victor to discipline Walt, threatens a family to keep a chemist working, and lets a flower do the talking a confession never has to. Walt spends the whole season terrified of a man who barely lays a hand on him — and ends it by finally doing, to Gus, exactly what Gus has been doing to him all along.",
    ],
  },
  5: {
    kicker: 'DEEP READING · SEASON 5',
    title: 'Say My Name',
    dek: "The season that opens with a man forcing his own name out of strangers ends with that same man collapsing among lab equipment, alone.",
    lede: [
      "Season four showed Walt that power doesn't need to touch what it controls. Season five is him applying that lesson without limit — until the lesson finally lands on him.",
    ],
    sections: [
      {
        id: 'pick-yourself-up',
        heading: 'Pick Yourself Up',
        photo: {
          episodeNumber: 8,
          caption: 'The reckoning arrives in a bathroom, in "Gliding Over All".',
          credit: 'AMC',
        },
        paragraphs: [
          "In \"Gliding Over All\", Walt hires Jack Welker's crew to kill ten former associates across three prisons, simultaneously, before any of them can talk. The two-minute montage — inmates stabbed or burned in their cells to the sound of Nat King Cole's \"Pick Yourself Up\" while Walt checks his watch at home — is the coldest thing the show ever shows him do. This isn't the half measure Mike once warned him against. It's an industrial-scale execution, made with a single phone call.",
          "The episode closes on a family lunch. Hank excuses himself to the bathroom and finds, under a stack of magazines, the Walt Whitman book Gale Boetticher once gave Walt. He reads the inscription — \"To my other favorite W.W.\" — and recognises the handwriting. He closes the book. Everything the season has been building toward resolves in a single trip to the toilet.",
        ],
        pullQuote: "What exposes Walt isn't an investigation. It's a bathroom visit.",
      },
      {
        id: 'sleight-of-hand',
        heading: 'The Same Sleight of Hand',
        photo: {
          episodeNumber: 11,
          caption: 'Jesse works out what happened to his cigarette, in "Confessions".',
          credit: 'AMC',
        },
        paragraphs: [
          "In \"Confessions\", Jesse notices his weed has been lifted from his pocket while waiting at Saul's office — and realises the same thing happened to his ricin cigarette back in season four, the same \"bump\" from Huell. Huell took it, on Saul's orders, for Walt. The truth of who poisoned Brock surfaces not through a confession, but through a memory of a pickpocket's trick.",
          "An episode earlier, in \"Buried\", Skyler faces Hank across a diner table; he assumes she's an innocent victim and presses her to talk, grabbing her wrist. She shouts \"Am I under arrest?!\" loud enough to turn every head in the room, and he lets go. Both scenes make the same point: the truth doesn't arrive through power. It arrives through small, almost embarrassing moments.",
        ],
        pullQuote: 'The truth doesn\'t arrive as a confession. It arrives as a stolen cigarette.',
      },
      {
        id: 'do-what-youre-gonna-do',
        heading: "Do What You're Gonna Do",
        photo: {
          episodeNumber: 14,
          caption: 'Hank, in the desert, in "Ozymandias".',
          credit: 'AMC',
        },
        paragraphs: [
          "The title isn't decoration. Percy Bysshe Shelley's 1818 poem \"Ozymandias\" describes a shattered stone king half-buried in the desert, its pedestal still reading: \"My name is Ozymandias, king of kings: / Look on my works, ye Mighty, and despair!\" — and nothing left standing around it but \"the lone and level sands\" stretching away. The episode opens on that exact image before a line of dialogue explains why: the same desert where the man who once made strangers say his name discovers that none of the power he built can save Hank, save Jesse, or hold his family together. Like the poem's king, what's left is wreckage.",
          "Hank is captured by Jack's crew in that desert. Walt offers his own money to save him; Hank refuses and tells him: \"You're the smartest guy I ever met, and you're too stupid to see he made up his mind ten minutes ago.\" His last words to Jack are simply: \"Do what you're gonna do.\" He dies without begging.",
          "As Jesse is handed over, Walt delivers one last blow — telling him he watched Jane die and did nothing. Skyler and Walt Jr. learn the truth; Walt takes Holly and runs. After leaving her at a fire station, he calls Skyler, knowing federal agents are listening, and deliberately screams threats at her to clear her of any blame. The baby's unscripted \"Mama\" in the background got a real reaction out of Bryan Cranston — it wasn't in the script.",
        ],
        pullQuote: "The phone call isn't a breakdown. It's a performance.",
      },
      {
        id: 'i-was-alive',
        heading: 'I Was Alive',
        photo: {
          episodeNumber: 16,
          caption: 'One last look at the equipment, in "Felina".',
          credit: 'AMC',
        },
        paragraphs: [
          "In \"Felina\", Walt forces Elliott and Gretchen Schwartz to funnel his money to Flynn using a fake hitman threat — laser pointers held by Badger and Skinny Pete. Facing Skyler one last time, he cuts off her line about doing it for the family and finally drops the lie he's carried for five seasons: \"I did it for me. I liked it. I was good at it. And I was really... I was alive.\"",
          "That line collapses under the weight of five seasons, not one moment. In season one the excuse was cancer, the goal money for his family — but the same season's humiliation at the Gray Matter party (\"which university do you teach at\" — \"high school\") already showed the real motive was wasted potential. In season three, Gus's speech about a man providing for his family dressed that same lie up as philosophy, and Walt chose, again and again, to believe it. Skyler saying the same line one more time in Felina isn't what breaks him — it's that he finally admits the line was never true.",
          "He kills Jack's crew with an M60 rigged into his car boot and frees Jesse. As police lights close in, he walks into the lab, looks over the equipment one last time, and collapses from a wound caused by his own ricocheting bullet — with something close to satisfaction on his face. The one place he ever felt like a god becomes the place he dies.",
        ],
        pullQuote: 'Five seasons of the same lie collapse into one sentence: he did it to feel alive.',
      },
    ],
    verdict: [
      "Season five completes the lesson season four started: Walt no longer needs to touch what he controls, so he stops holding back at all — an industrial-scale prison hit ordered from his living room, a family destroyed with a phone call staged for federal ears. The season's two confessions, Hank's refusal to beg and Walt's admission that he did it for himself, are the only honest sentences either man says all series. Everything else was management.",
    ],
  },
};

/** Sezon numarasına göre inceleme yapısı; içerik yoksa null (component render edilmez). */
export function getSeasonStory(seasonNumber) {
  return SEASON_STORIES[seasonNumber] ?? null;
}
