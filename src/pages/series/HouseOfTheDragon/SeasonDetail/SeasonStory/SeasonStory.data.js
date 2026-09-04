// Sezonun "derin okuma" içeriği — Breaking Bad'in SeasonStory.data.js
// formatının aynısı (felsefi/tematik deneme üslubu, editorial-voice
// skill'inin EpisodeStory şemasından BİLİNÇLİ sapması, sadece bu format
// için geçerli — bkz. BreakingBad/SeasonDetail/SeasonStory/SeasonStory.data.js
// başlığındaki not). İçerik web-researcher agent'larının doğruladığı
// sahne/replik verisine dayanır. TR yeniden yazımı ../../../../../../
// scripts/data/house-of-the-dragon-season-story-tr.json'da (çeviri değil).
//
// BB'den farkı: backend zaten storyKicker/storyTitle/storyDek/seasonBlocks
// (+Tr ikizleri) alanlarını destekliyor (bkz. scripts/seed-season-story.mjs),
// bu yüzden bu içerik BB gibi frontend-only mock DEĞİL — hem EN (bu dosya)
// hem TR (ayrı JSON) backend'e PUT edilecek gerçek kaynak metin.
//
// Sezon 1, 2 ve 3 dolu.

const SEASON_STORIES = {
  1: {
    kicker: 'DEEP READING · SEASON 1',
    title: 'The Heir for a Day',
    dek: "Viserys names an heir to end a succession crisis and dies without ever making clear, in words anyone else can verify, which child he actually meant.",
    lede: [
      "House of the Dragon's first season is usually described as the start of a war. It behaves more like the story of a king who tries to prevent one by keeping a secret, and dies having explained it to exactly one person.",
      "Viserys does not choose Rhaenyra because he loves her more than the alternative. He chooses her because a private prophecy — passed down since Aegon the Conqueror, told to no one else at court — convinces him a Targaryen must sit the throne when a great war comes. The crisis that follows isn't a fight over who deserves to rule. It's a fight over who is allowed to know why.",
    ],
    sections: [
      {
        id: 'prophecy',
        heading: 'A Secret Passed Down, Never Explained',
        photo: {
          episodeNumber: 1,
          caption: "Viserys tells young Rhaenyra of Aegon's Dream, moments after naming her his heir.",
          credit: 'HBO',
        },
        paragraphs: [
          'In private, after naming her heir, Viserys tells Rhaenyra of "the Song of Ice and Fire" — Aegon the Conqueror\'s dream of a long winter and a war for the dawn, survivable only if a Targaryen holds the Iron Throne. It is offered as a gift, the reason she matters. It functions as a burden: the one justification for her claim is a story no council, no Hightower, no Velaryon will ever be allowed to hear.',
          "Every later challenge to Rhaenyra's succession is, technically, a fair one — nobody else was given the reasoning. Viserys has not built an heir. He has built a secret with a person attached to it.",
        ],
        pullQuote: 'The heir is chosen by a story no one else is permitted to hear.',
      },
      {
        id: 'friendship',
        heading: 'Two Girls Reading the Same Book, Differently',
        photo: {
          episodeNumber: 2,
          caption: 'Rhaenyra and Alicent, before a marriage neither of them chose comes between them.',
          credit: 'HBO',
        },
        paragraphs: [
          "Rhaenyra and Alicent begin the season as the closest thing either has to a sister — trading books, covering for each other, reading the same court through two very different sets of eyes. Otto Hightower ends it by sending his daughter to comfort a grieving king, and Viserys, without consulting either girl, turns that comfort into a marriage.",
          "The friendship doesn't end in a single scene. It erodes across a decade of small betrayals neither woman is fully responsible for — his decision, her father's ambition, a court that keeps needing one of them to lose. By the time it finally breaks, at Driftmark, it breaks as violence: Alicent draws Viserys's own dagger on the girl she once read novels with.",
        ],
        pullQuote: 'The dagger that once frightened them both ends up in Alicent\'s hand.',
      },
      {
        id: 'ambition',
        heading: 'The Executioner Nobody Appointed',
        photo: {
          episodeNumber: 8,
          caption: 'Daemon, moments before beheading Vaemond Velaryon in open court.',
          credit: 'HBO',
        },
        paragraphs: [
          "Daemon spends the season auditioning for a throne no one will give him, and settling, instead, for the one job the crown actually needs done: removing whoever threatens it. He wins a war in the Stepstones the king wouldn't fund. He kills a wife who's no longer useful to him. He beheads a man who calls Rhaenyra's sons bastards in open court, a sentence Viserys wanted but couldn't bring himself to pass himself.",
          "None of it makes him king. All of it makes him load-bearing — the one person in King's Landing willing to do, without being asked twice, what everyone else only threatens.",
        ],
        pullQuote: 'He has never been given a throne. He has only ever been given the work no one else will do.',
      },
      {
        id: 'balance',
        heading: 'A Peace Signed in Betrothals',
        photo: {
          episodeNumber: 8,
          caption: 'The double betrothal — Jacaerys to Baela, Lucerys to Rhaena — announced before a divided court.',
          credit: 'HBO',
        },
        paragraphs: [
          "Two engagements — Jacaerys to Baela, Lucerys to Rhaena — are announced in the same breath Daemon uses to justify a public execution. On paper, it's a treaty: Velaryon and Targaryen blood bound together, the paternity question quietly resolved by making it irrelevant. In the room, it's a king spending the last of his strength to stage a unity that has already stopped being true.",
          "It holds for exactly as long as Viserys is alive to enforce it.",
        ],
        pullQuote: 'The realm is unified on paper for as long as one dying man can hold the room.',
      },
      {
        id: 'closing',
        heading: 'The Illusion of Control',
        photo: {
          episodeNumber: 10,
          caption: 'Vhagar and Arrax, over Storm\'s End, moments before the season\'s first death in open war.',
          credit: 'HBO',
        },
        paragraphs: [
          "Viserys warns Rhaenyra early in the season that no Targaryen truly commands a dragon — that the idea of mastery is a story the family tells itself. The finale collects on that warning with no interest in metaphor. Aemond orders Vhagar to menace, not kill; when Arrax panics and spits fire at a beast a hundred times its size, Vhagar answers on her own terms; Lucerys and his dragon die because the person on her back was never actually the one deciding.",
          "Rhaenyra learns of her father's death, her disinheritance, and her son's death in the same handful of hours. The season doesn't end on a declaration of war. It ends on proof that no one in this story — not the king, not the rider, not the prince who gave the order — was ever as in control as the throne required them to be.",
        ],
        pullQuote: "The season's last lesson is the one Viserys gave first: no one here actually commands what they ride.",
      },
    ],
    verdict: [
      "Read as a whole, season one is less a rise-of-two-factions story than a study in what silence costs. Viserys keeps a prophecy secret and calls it love. Alicent misreads a dying man's last words because no one thought to tell her what they'd once meant. Daemon fills the gap left by a king who won't say what he wants out loud. Every catastrophe in these ten episodes traces back to something someone could have said plainly and didn't.",
      "The Black Queen doesn't invent the war. It just removes the last excuse either side had for pretending peace was still on the table.",
    ],
  },
  2: {
    kicker: 'DEEP READING · SEASON 2',
    title: 'Rhaenyra the Cruel',
    dek: "The court invents a name for a murder she never ordered — and by the finale, she's grown into it anyway.",
    lede: [
      "Season one ended on proof that no one controls what they ride. Season two opens by testing whether anyone controls what they order — and the answer, across eight episodes, is no. Every act of intentional violence this season lands on the wrong target, and everyone who reaches for retaliation ends up owning a version of it they never planned.",
    ],
    sections: [
      {
        id: 'wrong-target',
        heading: 'A Retaliation That Misses',
        photo: {
          episodeNumber: 1,
          caption: 'Queen Helaena, in the moments after Blood and Cheese find the wrong child.',
          credit: 'HBO',
        },
        paragraphs: [
          "Daemon hires two men to kill Aemond in Rhaenyra's name, without her knowledge. They can't find him. They kill Aegon's toddler son instead, in front of his mother. Rhaenyra has spent the season, so far, insisting she wants justice, not war. The first act of violence done in her name gives her neither — only a dead child she'd never have chosen and a war she can no longer avoid being blamed for.",
        ],
        pullQuote: 'The crown accuses her of a killing she never ordered, of a child she never chose.',
      },
      {
        id: 'the-label',
        heading: 'The Name They Give Her',
        photo: {
          episodeNumber: 2,
          caption: "King's Landing turns a grieving mother's tragedy into a name for the enemy.",
          credit: 'HBO',
        },
        paragraphs: [
          "The court's propaganda names the episode before the history books do: Rhaenyra the Cruel. It's a lie built to be useful — Aegon's regime needs a monster to unite against, and a grieving queen thousands of miles away can't correct the record. Rhaenyra spends the season trying to out-argue the label. By the finale, offered a genuine chance at peace, she sets one condition: Aegon's execution. The label the court invented for her has stopped being false.",
        ],
        pullQuote: "By the finale, the name they gave her has stopped being a lie.",
      },
      {
        id: 'the-brother-who-waits',
        heading: 'The Brother Who Waits',
        photo: {
          episodeNumber: 4,
          caption: 'Aemond, on Vhagar, watching before he chooses to join the Battle of Rook\'s Rest.',
          credit: 'HBO',
        },
        paragraphs: [
          "At Rook's Rest, Aemond arrives on Vhagar with the numbers to end the battle instantly. He doesn't. He lets Rhaenys and Meleys engage first, watches the three-dragon collision unfold, and only then joins — in time to kill Rhaenys outright and leave his own brother, King Aegon, burned and comatose. Nothing Aemond does here is technically disobedience. He follows every order. He just follows them late enough that the outcome serves him more than it serves the king he's meant to be protecting.",
        ],
        pullQuote: "He doesn't have to strike his brother down. He only has to arrive late enough.",
      },
      {
        id: 'stops-choosing',
        heading: 'A Man Who Finally Stops Choosing',
        photo: {
          episodeNumber: 8,
          caption: "Daemon, before Harrenhal's weirwood, in the season's final vision sequence.",
          credit: 'HBO',
        },
        paragraphs: [
          "Isolated at Harrenhal, Daemon spends the season hallucinating his dead wife, suspecting poison in every cup, and drifting further from a war he once wanted to lead. At the castle's ancient weirwood, guided by Alys Rivers, he finally sees past his own lifetime — a white walker, a field of dead dragons, a woman with three hatchlings on a continent that doesn't exist on his maps. He kneels to Rhaenyra the same night. The vision doesn't tell him what to do. It tells him he was never actually choosing anything else.",
        ],
        pullQuote: "The vision doesn't hand him a decision. It shows him one he'd already made.",
      },
      {
        id: 'peace-offer',
        heading: 'The Peace Offer With One Condition',
        photo: {
          episodeNumber: 8,
          caption: 'Alicent and Rhaenyra, in the last private conversation two former friends will have as allies.',
          credit: 'HBO',
        },
        paragraphs: [
          "In the season's last private scene between them, Alicent — stripped of her regency, exhausted by a war she tried to prevent from the start — offers Rhaenyra the one thing that could end it: King's Landing, surrendered without a fight, within three days. Rhaenyra names her price. Aegon's life. Alicent, who has already lost the argument for mercy inside her own court, discovers she has lost it with her oldest friend too. Two women who once read the same books in the same room part as enemies, over a condition neither will withdraw.",
        ],
        pullQuote: "Alicent finally offers her peace. Rhaenyra, at last, is exactly cruel enough to refuse it.",
      },
    ],
    verdict: [
      "Season two rarely lets its characters do violence on purpose and get the result they intended. Blood and Cheese kill the wrong child. Aemond's restraint reads as strategy but functions as fratricide. Daemon's fealty arrives only after a vision removes his need to decide anything for himself. The one plan that works exactly as designed — Alicent's peace offer — fails because Rhaenyra, offered mercy, chooses the name the court gave her instead.",
      "The finale ends without a battle, which is the point critics called it anticlimactic for. Nothing in these eight episodes was ever really about winning a fight. It was about who was willing to become the person their enemies already said they were.",
    ],
  },
  3: {
    kicker: 'DEEP READING · SEASON 3',
    title: 'Rhaenyra Triumphant',
    dek: "The season names its own irony out loud in episode three — and spends the next five proving the crown was the easy part.",
    lede: [
      "Season two ended on the mathematics of an inevitable war. Season three is that war conducted in the open, and it structures itself around a small cruelty: nearly every episode title promises a stable state — triumph, resolve, an unbowed will — that the hour immediately dismantles. Nobody in these eight episodes gets to keep the thing their episode is named after.",
    ],
    sections: [
      {
        id: 'first-loss',
        heading: 'The Cost Before the Crown',
        photo: {
          episodeNumber: 1,
          caption: 'Jacaerys and Vermax, in the Battle of the Gullet, before the season\'s first great loss.',
          credit: 'HBO',
        },
        paragraphs: [
          "The season opens with the Battle of the Gullet — Corlys's fleet against the Triarchy, a wild dragon claimed mid-battle by young Rhaena — and closes its first hour on Jacaerys, Rhaenyra's heir and one of her most capable commanders, dead alongside his dragon Vermax. Before Rhaenyra takes a single throne room, the season has already spent one of the few things she can't replace. Everything that follows is paid for with that debt already on the ledger.",
        ],
        pullQuote: 'The season spends its own heir before it spends anything else.',
      },
      {
        id: 'triumphant',
        heading: 'Rhaenyra Triumphant',
        photo: {
          episodeNumber: 3,
          caption: "Rhaenyra learns what an empty treasury looks like, one throne room after taking the Iron Throne.",
          credit: 'HBO',
        },
        paragraphs: [
          "Alicent, holding to her word, opens King's Landing's gates without a fight. Rhaenyra sits the Iron Throne in the second episode — the fastest, cleanest version of the victory this whole war was fought for. By the third episode, titled without a trace of irony, she discovers the treasury has been emptied, the smallfolk are hungry, and the lords who claim loyalty have been hoarding grain. Holding a city, it turns out, is nothing like taking one.",
        ],
        pullQuote: 'Holding a city, it turns out, is nothing like taking one.',
      },
      {
        id: 'unbowed',
        heading: 'Unbowed, Unbent, Unspared',
        photo: {
          episodeNumber: 6,
          caption: "Ser Criston Cole, before the ambush his own side will later call the Butcher's Ball.",
          credit: 'HBO',
        },
        paragraphs: [
          "Criston Cole spends the season pushing for a suicidal frontal charge, less a strategy than a request — after everything he's done in Alicent's name and his own, he wants the war to end in a glorious death he can choose himself. Winter Wolves and Oscar Tully's army give him neither the glory nor the choice: he dies in an ambush his own side names, afterward, the Butcher's Ball. The episode is called \"Faceless Men.\" The man who wanted to be remembered for one clean, chosen death doesn't get to pick how his story ends either.",
        ],
        pullQuote: "He wanted a glorious death. The Butcher's Ball doesn't deal in glorious.",
      },
      {
        id: 'the-rider-for-sale',
        heading: 'The Rider Everyone Tries to Buy',
        photo: {
          episodeNumber: 7,
          caption: 'Lord Ormund Hightower attempts to win over one of Rhaenyra\'s dragonseeds.',
          credit: 'HBO',
        },
        paragraphs: [
          "With Vermithor, Seasmoke, and Silverwing now flying for low-born riders who owe the crown nothing but a claimed dragon, the war's real currency stops being land or gold. Ormund Hightower spends episode seven trying to win one of Rhaenyra's dragonseeds over to his side — not through force, which no longer works on a man with a dragon, but through persuasion. In a war between two Targaryen claimants, the most valuable thing left to own is a rider willing to change which throne he's loyal to.",
        ],
        pullQuote: 'The most valuable thing left in this war is a man willing to change sides.',
      },
      {
        id: 'treasons',
        heading: 'The Treasons, Plural',
        photo: {
          episodeNumber: 8,
          caption: 'Tumbleton, burning on Silverwing\'s breath, in the season\'s final act of betrayal.',
          credit: 'HBO',
        },
        paragraphs: [
          "The finale's title doesn't say treason. It says treasons — and means it literally. Ulf the White, courted for episodes by both sides, chooses the moment it costs Ormund Hightower the most: he kills the man he's meant to be serving and burns Tumbleton to the ground on Silverwing's back, on Rhaenyra's order but for reasons that look a great deal more personal than loyal. Nobody left standing in Tumbleton by the end of this season answers to a house. They answer to whichever queen still has a dragon to offer them.",
        ],
        pullQuote: "Nobody left in Tumbleton is loyal to a house anymore. They're loyal to whoever still has a dragon to spare.",
      },
    ],
    verdict: [
      "Every big word this season borrows from its own episode titles — triumphant, unbowed, faceless — turns out to describe the opposite of what happens inside the hour. Rhaenyra wins the capital and immediately learns that winning it solved nothing. Criston Cole gets the death he spent the season requesting, robbed of the one thing he actually wanted from it. The war that began, two seasons ago, as a fight over a family's bloodline ends its third year decided by men who belong to neither family at all.",
      "Nothing here resolves the war. It just proves, one betrayal at a time, that by this point almost no one fighting it is fighting for the reason it started.",
    ],
  },
};

/** Sezon numarasına göre inceleme yapısı; içerik yoksa null (component render edilmez). */
export function getSeasonStory(seasonNumber) {
  return SEASON_STORIES[seasonNumber] ?? null;
}
