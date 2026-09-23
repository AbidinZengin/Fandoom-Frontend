// Sezonun "derin okuma" içeriği — Breaking Bad/House of the Dragon
// SeasonStory.data.js formatının aynısı (felsefi/tematik deneme üslubu,
// editorial-voice skill'inin EpisodeStory şemasından BİLİNÇLİ sapma, sadece
// bu format için geçerli). İçerik web-researcher agent'larının doğruladığı
// olay örgüsü + tematik/eleştirel okuma verisine dayanır (röportaj/eleştiri
// kaynakları metne birebir alıntı olarak girmez, sadece argümanın zeminidir).
// TR yeniden yazımı ../../../../../../scripts/data/severance-season-story-tr.json'da
// (çeviri değil, House of the Dragon'daki aynı desen).
//
// Backend zaten storyKicker/storyTitle/storyDek/seasonBlocks (+Tr ikizleri)
// alanlarını destekliyor (bkz. scripts/seed-severance-season-story.mjs), bu
// yüzden bu içerik frontend-only mock DEĞİL — hem EN (bu dosya) hem TR (ayrı
// JSON) backend'e PUT edilecek gerçek kaynak metin.
//
// Sezon 1 ve 2 dolu.

const SEASON_STORIES = {
  1: {
    kicker: 'DEEP READING · SEASON 1',
    title: "The Consent of a Man Who Isn't There",
    dek: 'Every innie at Lumon works a job someone else agreed to — the contract just never asked what they thought.',
    lede: [
      "Severance's first season is usually filed under science fiction: a company can surgically split an employee's memory so the person who works and the person who lives are strangers to each other. But the actual engine of the season isn't the surgery. It's the signature. Somewhere before episode one, an outie — a person with a life, a grief, a reason to want out of both — agreed to this. The innie who then spends nine episodes trapped on the severed floor never got a vote.",
      "That single asymmetry is the load-bearing wall of the entire season. Every escalation — a forced apology, a locked elevator, an uprising planned in stolen minutes — traces back to the same unanswerable question: what do you owe a person you created by removing everything that would let them refuse you?",
    ],
    sections: [
      {
        id: 'consent',
        heading: 'A Contract Nobody in the Room Signed',
        photo: {
          episodeNumber: 4,
          caption: 'Helly watches her own outie deny, on video, that the person she is even counts as a person.',
          credit: 'Apple TV+',
        },
        paragraphs: [
          "Helly R. spends her first four episodes doing the one thing Lumon didn't design her to do: refuse. She writes resignation letters. She threatens to hurt herself in the break room until Milchick makes her recite an apology on a loop. None of it works, because none of it is actually addressed to the person with the authority to let her go — that person is her outie, and the outie has already said yes on her behalf, before she existed in any form she can remember.",
          "The season's cruelest scene isn't a punishment. It's a video. Helly's outie, informed that her innie tried to resign, refuses — and tells her, in effect, that she doesn't get an opinion, because she isn't a person in the way that matters. Lumon didn't need to build a system this brutal. The outie did it for them, for free, the moment she treated her own severed self as an inconvenience rather than a hostage.",
        ],
        pullQuote: "The one person with the power to free her has already decided she doesn't count.",
      },
      {
        id: 'religion',
        heading: 'A Company With a Saint',
        photo: {
          episodeNumber: 3,
          caption: "The Macrodata Refinement team is walked through the Perpetuity Wing, Lumon's shrine to its own founder.",
          credit: 'Apple TV+',
        },
        paragraphs: [
          "By episode three, Lumon has stopped behaving like an employer and started behaving like a church. The Perpetuity Wing isn't a break room amenity; it's a reliquary, built to enshrine Kier Eagan the way a cathedral enshrines a saint — waxworks, a life reduced to parable, a founder's temperament (grief, joy, fear, malice, in his own taxonomy) taught to employees as a kind of catechism for how to feel. Nobody at Lumon calls it worship. Everybody behaves like it is.",
          "The season's most quietly disturbing set piece isn't a threat — it's a reward. Dylan, given a waffle party for good behavior, dons a mask of the company's dead founder and dances in a recreation of his bedroom while the department watches. Nothing here is coercive in the way a locked door is coercive. It's coercive the way a hymn is: you don't notice you've been asked to believe something until you're already singing it.",
        ],
        pullQuote: "A party doesn't have to make you happy. It only has to make you compliant.",
      },
      {
        id: 'departments',
        heading: 'The Room Down the Hall',
        photo: {
          episodeNumber: 5,
          caption: 'Mark and Helly find a department that, as far as MDR was told, does not exist.',
          credit: 'Apple TV+',
        },
        paragraphs: [
          "Lumon's severed floor runs on the same trick used by every institution that wants loyalty without transparency: keep each cell of the organization ignorant of the others, and let the ignorance do the work fear would otherwise have to. Optics and Design accuses MDR of things MDR never did. MDR returns the favor. Both departments are, unknowingly, reacting to doctored evidence Lumon itself planted — a company that would rather its employees suspect each other than suspect it.",
          "When Mark and Helly finally wander into a department with no name on their org chart and a colleague nobody has ever introduced them to, the discovery isn't shocking because it's sinister. It's shocking because it's mundane — proof that the floor they've spent months mapping in their heads is a fraction of the building it sits inside, and that not-knowing was never an accident.",
        ],
        pullQuote: "Two departments spend the season suspecting each other so neither has to suspect the company running both.",
      },
      {
        id: 'reintegration',
        heading: 'The Man Who Tried to Warn Him',
        photo: {
          episodeNumber: 7,
          caption: 'Petey, reintegrated and unraveling, only has time to hand Mark half of what he needs to know.',
          credit: 'Apple TV+',
        },
        paragraphs: [
          "Petey is the season's proof of concept for what happens if the wall between innie and outie comes down without permission. Reintegration doesn't liberate him; it floods him. Both selves arrive at once, with no framework for reconciling a man who loves his daughter and a man who has never met her, and the result isn't freedom — it's a body that collapses in a convenience store parking lot, alone, having spent its last competent hours trying to warn a friend who wasn't ready to hear it.",
          "Mark's refusal to listen is the choice that defines his character for the rest of the season, and it isn't cowardice so much as arithmetic: Petey is offering him the truth in exchange for the only stability he has left. The show never punishes him for saying no. It just keeps the bill running until the finale forces him to pay it in full, at the worst possible moment, in front of everyone.",
        ],
        pullQuote: "Petey doesn't die because he broke the rule. He dies because breaking it gave him no way to survive what he learned.",
      },
      {
        id: 'finale',
        heading: 'The First Time They See Outside — and the Last',
        photo: {
          episodeNumber: 9,
          caption: "Helly, at a gala she doesn't recognize, discovers exactly whose name is on the building.",
          credit: 'Apple TV+',
        },
        paragraphs: [
          "The overtime contingency is, mechanically, a security exploit. Emotionally, it's the only real choice any innie makes all season — not because Lumon allows it, but because for once, nobody outside the severed floor is watching closely enough to stop it. For a few stolen minutes, four people who have never been trusted with their own lives get to see them. What they find isn't liberation. It's evidence: a wife everyone told Mark was dead, a benefactor gala that turns out to be thrown by Helly's own family, a company built by people who intend to sever the entire species and call it mercy.",
          "Erickson has described the moment Dylan meets his son as the season's real turning point — once you've seen your kid, he's said, a company keychain stops feeling like a prize. That's the joke Lumon never planned for. The overtime contingency was designed to prove innies could be trusted with a glimpse of the outside. Instead it proves the opposite: give a person one true minute of their own life, and no amount of waffle parties will make the other eleven hours and fifty-nine minutes feel like enough again.",
        ],
        pullQuote: "The one thing Lumon never wanted its employees to have wasn't information. It was one honest minute of their own lives.",
      },
    ],
    verdict: [
      "Take the season as a whole and it stops looking like a workplace thriller and starts looking like an argument about what consent is worth when the person consenting isn't the person living with the consequences. Every rule Lumon enforces on the severed floor — the apology loops, the wellness sessions, the founder-worship — exists to make that arrangement feel voluntary to someone who never agreed to it in any form they can remember.",
      "The finale doesn't resolve that argument. It just makes it impossible to ignore: four people who were promised a controlled, contained existence spend nine episodes discovering how much of themselves that containment was built to hide — including, in Mark's case, a wife the company insists is gone and a truth it never planned on him finding standing right in front of him.",
    ],
  },
  2: {
    kicker: 'DEEP READING · SEASON 2',
    title: 'The Logic of the Larder',
    dek: "A show about a company that farms its own employees for parts finally asks the question a farm never has to answer twice: is a life worth living if it was only ever built to be taken back?",
    lede: [
      "Season one ended on a question nobody inside Lumon wanted asked: what are we actually doing down here? Season two spends ten episodes discovering that the honest answer is worse than anyone guessed — and that knowing it doesn't actually free anyone, because the people with the power to act on the truth and the people who have to live inside it are, by design, never the same person in the same room at the same time.",
      "If the first season was about the impossibility of consent, the second is about the impossibility of trust once consent has already failed once. Nobody here believes anybody — not Mark his own outie, not Cobel her old employer, not Milchick the board that promoted him — and the season's real suspense isn't whether the severed floor will be exposed. It's whether anyone left standing on it still has a self worth trusting by the time it is.",
    ],
    sections: [
      {
        id: 'five-months',
        heading: 'A Man Who Lied to Himself First',
        photo: {
          episodeNumber: 1,
          caption: "Mark returns to a department that has spent five months rewriting what happened without him.",
          credit: 'Apple TV+',
        },
        paragraphs: [
          "Season two opens with a five-month gap the audience doesn't get to see and Mark's innie doesn't get to remember — and Lumon fills it exactly the way you'd expect an institution to fill a scandal: new faces, a stop-motion reeducation video, a strategically timed round of half-hearted reforms nobody actually has to honor. The lie isn't subtle. It doesn't need to be. The only people positioned to notice it's a lie are the ones with no way to check it against anything real.",
          "What makes the premiere sting is that Milchick, now running the floor he used to police, isn't lying out of malice. He's lying because it's the job description, and because the alternative — telling four traumatized people the truth about what they did and what it cost — would end the only stability the department has left. Betrayal, this season keeps insisting, doesn't require a villain. It just requires someone whose promotion depends on you not finding out.",
        ],
        pullQuote: "Nobody had to invent a lie sophisticated enough to fool them. A calendar and a mascot costume did the job.",
      },
      {
        id: 'outie-contempt',
        heading: "A Voice That Gets His Girlfriend's Name Wrong",
        photo: {
          episodeNumber: 2,
          caption: "Outie Mark records a message for his innie — and reveals, without meaning to, exactly how little he thinks of him.",
          credit: 'Apple TV+',
        },
        paragraphs: [
          "The season's most quietly devastating scene isn't a confrontation. It's a recording. Outie Mark, trying to reach his innie, gets Helly's name wrong — a small, almost forgivable slip that lands like a diagnosis. This is a man talking to someone he has decided doesn't need to be gotten right, because from where he's standing, the person on the other end of the message isn't quite real.",
          "That's the season's real thesis on the innie/outie divide, stated more plainly than any lecture could: the outside world doesn't hate the severed floor. It's worse than hate. It simply doesn't think about it carefully enough to bother. Every character who has spent the season insisting the two halves deserve equal standing is arguing against a system that was never built to see them as equal in the first place — not out of cruelty, just out of the ordinary carelessness people reserve for things they've already decided don't fully count.",
        ],
        pullQuote: "He isn't cruel to his innie. He's careless — which, from the inside, feels exactly the same.",
      },
      {
        id: 'cobel-milchick',
        heading: "The Woman Who Wants Back Into the House She's Trying to Burn Down",
        photo: {
          episodeNumber: 6,
          caption: "Cobel, exiled from the only institution she's ever called home, still can't fully choose to destroy it.",
          credit: 'Apple TV+',
        },
        paragraphs: [
          "Cobel spends the season as living proof that betrayal runs in both directions. Fired, humiliated, replaced by a subordinate she trained, she has every reason to want Lumon gone — and she still can't quite manage to want it, because Lumon is the only home she's ever had a place inside. Milchick, meanwhile, discovers that inheriting her old job means inheriting her old position: the person everyone above him blames the moment something goes wrong, judged on standards designed to make failure inevitable.",
          "Their arc together is the season's cleanest illustration of what a company built on loyalty actually produces: not loyal people, but people who've been taught that loyalty is the only currency they have left, spent on an employer who has never once spent it back. Cobel wants revenge and belonging in the same breath, because Lumon made sure she'd never learn to want one without the other.",
        ],
        pullQuote: "She isn't torn between destroying Lumon and saving it. She was never given the tools to want anything else.",
      },
      {
        id: 'gemma',
        heading: 'The Woman the Whole Season Was Actually About',
        photo: {
          episodeNumber: 7,
          caption: "Gemma, held on the testing floor, discovers that every 'meaningless' file MDR has ever completed was cut from a piece of her.",
          credit: 'Apple TV+',
        },
        paragraphs: [
          "For six episodes, Gemma is a grief Mark carries and a mystery the show lets the audience half-solve early. Then Chikhai Bardo recontextualizes everything that came before it: the numbers MDR spends the whole show sorting without knowing why aren't abstract. They're extracted, file by file, from a living woman's worst moments — a dental visit, a plane in turbulence, a stillbirth — each one carved into its own innie so she never has to hold more than a fragment of her own pain at once.",
          "This is the season's real escalation, and it isn't a twist for its own sake. It turns the first season's argument about meaningless labor into something much harder to sit with: the busywork was never meaningless. It was violence, laundered through corporate abstraction until it looked like a spreadsheet. Severance spent a whole season asking what the innies are actually doing down there so it could spend this one answering: something worse than anyone let themselves imagine.",
        ],
        pullQuote: "The numbers were never empty. They were a woman's pain, filed down until it fit in a folder.",
      },
      {
        id: 'cold-harbor',
        heading: 'The Logic of the Larder',
        photo: {
          episodeNumber: 10,
          caption: "Mark reaches the door with Gemma on one side and Helly on the other — and the season refuses to let both survive the choice.",
          credit: 'Apple TV+',
        },
        paragraphs: [
          "There's an old argument in animal ethics sometimes called the logic of the larder: a farmed animal that got to live, however briefly, before being slaughtered is still better off than one that was never born at all — isn't it? Cold Harbor is Severance staging that exact argument with a person standing in for the animal. Gemma's final innie is built to carry a grief so specific it can only be hers, tested, refined, and — the moment the file completes — scheduled for deletion. Whatever life that innie gets is real. It was also always going to be taken back.",
          "Mark's choice at the door isn't between love and duty. It's between the argument that a short, engineered life is still worth living and the argument that consenting to your own erasure, however comfortable the terms, is still consent extracted from someone who was never free to refuse it. He doesn't resolve the argument. He just picks a side — his own, and Helly's — and runs, leaving the season's most devastating irony intact: the first time an innie chooses for himself all season, the choice looks, to the person he loves most, exactly like abandonment.",
        ],
        pullQuote: "A life that was only ever built to be taken back is still a life. That doesn't make taking it back forgivable.",
      },
    ],
    verdict: [
      "Season two never lets its characters land a deliberate act of justice on the target they aimed it at. Blood and Cheese kill the wrong child. Milchick's promotion turns him into the very thing he used to enforce. Cobel's revenge curdles into homesickness. The only plan that works exactly as designed — Gemma's rescue — succeeds at the exact moment the show reveals that rescue and abandonment can be the same door, walked through by two different people, at the same second.",
      "What's left, after ten episodes, isn't an answer to the question the first season ended on. It's a sharper version of it: if a company can manufacture a life short enough to control and call it a kindness, the only real rebellion left isn't escaping the arrangement. It's refusing to accept that the arrangement was ever a choice at all.",
    ],
  },
};

/** Sezon numarasına göre inceleme yapısı; içerik yoksa null (component render edilmez). */
export function getSeasonStory(seasonNumber) {
  return SEASON_STORIES[seasonNumber] ?? null;
}
