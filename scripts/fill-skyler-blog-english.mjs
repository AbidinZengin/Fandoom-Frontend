#!/usr/bin/env node
// Skyler White blogunun (id 301) BASE (EN) alanlarını gerçek İngilizce
// metinle doldurur — TR alanlar (titleTr/contentTr/vb.) HİÇ dokunulmuyor,
// sadece title/kicker/axis/imageAlt/blocks[].content/imageAlt güncelleniyor.
// BlogPost.data.js artık i18n.language'a göre bu ikisi arasında seçim
// yapıyor (bu oturumda eklendi) — bu script mekanizmayı gerçek EN içerikle
// tamamlıyor. Mevcut sceneKey/orderIndex/imageUrl/Tr alanları KORUNUR.
//
// Kullanım: node scripts/fill-skyler-blog-english.mjs --write

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const BLOG_ID = 301;
const doWrite = process.argv.includes('--write');

if (doWrite && !AUTH_TOKEN) {
  console.error('--write için AUTH_TOKEN zorunlu.');
  process.exit(1);
}

const P = (...paragraphs) => paragraphs.join('\n\n');

// orderIndex -> İngilizce content/heading/imageAlt eşlemesi.
const EN = {
  0: P(
    `One of the more interesting things about watching a show is noticing why an audience loves one character and can't stand another. Usually the reaction lines up with what the character actually does: the good ones get liked, the bad ones don't. Breaking Bad breaks that rule. The character who kills the most people, tells the most lies, poisons a child and watches a woman choke to death on her own vomit without lifting a finger — Walter White — turns into a hero to most of the audience, even an icon. His wife Skyler, arguably the adult character who commits the fewest actual crimes in the whole show, becomes one of the most hated figures in television history. The hatred didn't stay on screen either: Anna Gunn, the actress who played her, started receiving real threats, and an online group called "I Hate Skyler White" picked up tens of thousands of members.`,
    `The gap is strange enough that it's drawn academic attention. In 2019, researchers Joke Hermes and Linda Stoete published a study of Reddit discussions about Skyler and sorted the audience's reactions into three camps: some viewers positioned themselves as the clever ones who saw through everything, some turned it into a straightforward moral judgement, and a third group slid into something closer to publicly shaming her — a mode the researchers call, without hedging, misogynistic. So the real question isn't "was Skyler annoying." It's this: how does one of the most reasonable characters on the show end up as the most hated one?`
  ),
  1: 'Ground',
  2: 'A pregnant Skyler, with her sister Marie, hands out missing-person flyers for Walter on the street.',
  3: P(
    `Answering that means going back to where Skyler actually starts, because the image most viewers carry around doesn't match it. When the show opens, she isn't living a comfortable life. She's pregnant with a baby she didn't plan, she's raising a teenage son with cerebral palsy, and the household budget barely holds together. Her husband is teaching high school and working a second job at a car wash, where his boss humiliates him by making him scrub cars by hand. Then the family gets hit with one more piece of news: Walter has advanced lung cancer. Long before the meth, long before the lying, Skyler's story starts as the story of a woman finding out her husband is dying and preparing to raise two children alone.`,
    `Then even that ground starts to shift. While Walt keeps telling her he's fine, he's quietly building a second life she knows nothing about — vanishing for hours, coming home with injuries he won't explain, carrying a second phone, unable to account for where the money is coming from. What Skyler is looking at isn't a secret-hero story. It's a dying man who might be having an affair, or might be falling apart completely, and she can't even tell which.`
  ),
  4: 'Diagnosis',
  5: 'Walter and Skyler stand in a storage unit, looking at an enormous pile of cash.',
  6: P(
    `Walter's isn't the only diagnosis in this show. His cancer is the one that starts the story, but there's a second, much quieter diagnosis further in — and Skyler is the one who makes it. By the point Walt has made enough money to set his family up for ten lifetimes, and Skyler tells him it's time to stop, he hesitates. He wants to keep going. What Skyler has clocked isn't a man still fighting to survive. It's a man who's developed a taste for the thing itself.`,
    `In the story Walt tells himself, this is liberation — a way of getting his manhood back. In the story Skyler is living, it's an addiction. That distinction matters, because she's the one who turns out to be right. When Walt finally admits the truth out loud near the end, all he's really doing is making official what she'd already worked out months earlier.`
  ),
  7: 'The Attribution Error',
  8: "Skyler's face in sharp focus in the bathroom, holding her belly; Walter sits blurred in the background, on the edge of the bed.",
  10: "Walter in sharp focus in the bathroom; a pregnant Skyler sits blurred in the background, on the edge of the bed.",
  9: `Social psychology has a name for a very specific bias: when we explain someone's behaviour, we tend to blame their character rather than the situation they're in. Something they did gets read as "that's just who they are" rather than "that's the position they were in." Breaking Bad triggers this bias in its audience almost mechanically, because the whole story is told from Walt's point of view. Every killing gets read as "he had no choice," because we're inside his fear, his pride, his cancer. Skyler asking questions gets read as nagging, because we're never given the same access to what she's actually afraid of.`,
  11: P(
    `Underneath that sits an even more basic storytelling choice. In most stories, the villain is the one standing in the hero's way, and the audience wants to see that obstacle cleared. Breaking Bad flips the arrangement: the one trying to reach his goal — Walt, making money the illegal way — is the "protagonist," and the person in his way is his own wife. The shape of the story stays the same; only the casting changes. And audiences are so used to that shape that they end up rooting for Walt without ever questioning who's actually playing the hero and who's playing the obstacle. We want his next deal to go through, his next plan to work — as if we're committing the crime alongside him. Which is exactly why Skyler stepping in doesn't read as a mother's fear. It reads as a threat to the plan, the way a supporting character who keeps getting in the way of a heist reads in a heist film.`,
    `There's a small, telling example of this in the first season. When Walt refuses chemotherapy, Skyler organises a family intervention to talk him round. Her sister Marie and brother-in-law Hank, though, don't back her — Marie, who works as a radiology technician, tells the room that most of the cancer patients she sees at the hospital suffer more from treatment than they're helped by it. So Skyler is left alone in that scene by her own family, on a question she'll eventually be proven right about. That doesn't make her a control freak; it makes her the one voice nobody was listening to that turned out to be correct.`,
    `What's telling is that even the show's creator has admitted as much. In a 2018 interview, Vince Gilligan acknowledged that the story was written from Walt's perspective even in scenes he wasn't in — that the writing had been skewed his way from the start. Which means the audience siding with Walt over Skyler isn't really about her being wrong. It's about whose eyes the camera was sitting behind.`
  ),
  12: 'The Flaw',
  13: 'Skyler looks anxiously at a stack of cash in her hands.',
  14: P(
    `None of this makes Skyler a saint, and the show never pretends it does. She has an affair with her old boss, Ted Beneke. She quietly funnels some of Walt's drug money to him. She sends men to intimidate him, and he ends up badly hurt as a result. These are real, and they deserve more than a passing mention.`,
    `The affair usually gets read as revenge. But the episode where it comes out ("I.F.T.") tells a slightly different story. Walt has just forced his way back into the house with drug money, trying to buy his way back into Skyler's life, and what she does next reads less like a declaration of love than a way of saying you can't buy me back. Not romance — the last move left to someone who's been backed into a corner.`,
    `Separate from the act itself, it's worth talking about how the audience reacted to it. The moment a female character cheats, there's a ready-made script that clicks into place: the unfaithful wife. That script gets judged far more harshly than the same behaviour from a male character — infidelity alone is often enough to sink a woman's likeability, while for men it usually reads as just one flaw among many. Nothing that happened to Skyler before this point — the cancer, the lies, the danger, the desperation — costs her as much goodwill as this single scene. It's as though three seasons of context get switched off the moment the script kicks in.`,
    `The money she sends Ted is genuinely harder to defend. Through Saul, using a fabricated story about a dead relative in Luxembourg, a sizeable chunk of Walt's cash is funnelled to Ted to cover a tax debt. Instead of paying it, Ted leases a new car and reopens his business. When he refuses to pay up afterwards, Skyler sends Saul's men to intimidate him into signing a cheque, and he falls and is badly injured in the process. There's no excusing that. But there's context: it happens in the same week a cartel is threatening her family and the cash they've stashed away is nearly gone. It isn't a bad person making a bad choice. It's someone with no room left to manoeuvre, and a hand that's hardened because of it.`
  ),
  15: 'Symmetry',
  16: 'A close-up portrait of Skyler, resolute and hard-eyed.',
  17: P(
    `A simple thought experiment is useful here. Swap the roles. If it were the husband secretly cooking drugs and lying, and the wife who grew suspicious and tried to protect the kids — would that man read as naggy and joyless, or as the reasonable one holding the family together? Probably the second. Which tells you the issue was never really what Skyler did. It was whose perspective the story was told from.`,
    `There's a small demonstration of the same double standard inside the show itself. Marie has a real, years-long shoplifting habit — a genuine kleptomania, actual theft, actual getting caught. The audience doesn't turn on her for it; if anything, they find it endearing. Skyler's flaws don't get the same grace. Anna Gunn, writing after the threats against her started, drew a similar comparison on a larger scale — comparing Skyler to Carmela Soprano and Betty Draper, two characters who tolerated far worse from their husbands and never drew anywhere near the same level of audience fury.`,
    `The academic study mentioned earlier lands in the same place. One of the most common positions in the audience discourse is a form of public shaming the researchers describe, plainly, as misogynistic. Which suggests Skyler's real "crime" might simply have been refusing to play the quiet supporting role she was handed.`
  ),
  18: 'Closing Doors',
  19: "Skyler wades fully clothed into a swimming pool during Walter's birthday party.",
  20: P(
    `Behavioural economics has a well-known trap called the sunk cost fallacy: the more you've already invested in something, the harder it feels to walk away from it — irrationally, since past investment shouldn't affect a future decision, but in practice it does. Skyler's story bricks up one more exit every season. First there's the pregnancy, which makes leaving harder. Then there's the cash piling up in the house, and giving it up could end her family. Then she knows too much to walk away clean. Then she learns to launder the money herself, which makes her legally complicit too. She isn't sliding into darkness — every time, the "no" option left to her has simply become more expensive than she can afford.`,
    `The pool scene belongs to that same chain of closing doors, though usually for a different reason than people assume. Most viewers remember Skyler wading fully clothed into the pool at Walt's birthday party as a genuine suicide attempt. Look closer at the scene and what follows, though, and a more calculated picture emerges: what Skyler is actually after is getting Hank and Marie to take the children out of the house. She isn't really trying to drown herself — she's creating a moment shocking enough to force her sister and brother-in-law into action. It isn't a breakdown. It's a deliberate, highly risky manoeuvre from someone who has run out of any other way to get her kids somewhere safe.`
  ),
  21: 'Confession',
  22: 'Skyler speaks on the phone with a look of sheer dread on her face.',
  23: P(
    `By the final season, the show backs up its own argument twice. First in the kitchen, where Skyler stands across from her husband with a knife in her hand, in her own home, in front of her son — and the music doesn't code her as a killjoy here, it just shows real fear. Then on the phone, where Walt, knowing the police are listening, screams at her and takes all the blame himself — because what he's actually doing is telling the officers on the line that she was frightened of him, that she had no choice. That performance of cruelty, coming out of his own mouth, is the show formally admitting what it had been showing all along.`,
    `There's an earlier, quieter version of the same moment. One evening Skyler walks into the living room to find her children watching Scarface with Walt — on screen, a man collapses in gunfire at the end of exactly the kind of empire Walt has been building. Walt smiles. The kids are thrilled. Skyler's the only one whose face shows dread, because she's the only one reading the film as a warning rather than entertainment.`
  ),
  24: `What all of this adds up to is this: Skyler White wasn't hated for being wrong. She was hated for being the one person still standing in reality in the middle of someone else's power fantasy. The anger aimed at her was never really a verdict on her — it was a confession about who we forgive, and why.`,
};

const TITLE = 'Was Skyler White Right All Along?';
const KICKER = 'DEEP READING';
const AXIS =
  "Skyler White wasn't hated for being wrong — she was hated for being right at a moment the story had no room for her to be right.";
const COVER_ALT = 'Anna Gunn in a studio portrait as Skyler White.';

function buildPutBody(current) {
  const blocks = current.blocks.map((b) => {
    const en = EN[b.orderIndex];
    const isImage = b.blockType === 'IMAGE';
    return {
      blockType: b.blockType,
      sceneKey: b.sceneKey,
      content: isImage ? null : en ?? b.content,
      contentTr: b.contentTr,
      imageUrl: b.imageUrl,
      imageAlt: isImage ? en ?? b.imageAlt : b.imageAlt,
      imageAltTr: b.imageAltTr,
    };
  });

  return {
    title: TITLE,
    titleTr: current.titleTr,
    kicker: KICKER,
    kickerTr: current.kickerTr,
    axis: AXIS,
    axisTr: current.axisTr,
    imageUrl: current.imageUrl,
    imageUrlLarge: current.imageUrlLarge,
    imageAlt: COVER_ALT,
    imageAltTr: current.imageAltTr,
    spoilerThroughSeasonNumber: current.spoilerThroughSeasonNumber,
    spoilerThroughEpisodeNumber: current.spoilerThroughEpisodeNumber,
    recommendedRank: current.recommendedRank,
    spoilerFree: current.spoilerFree,
    status: current.status,
    format: current.format,
    publishedAt: current.publishedAt,
    readingTimeMinutes: current.readingTimeMinutes,
    tags: (current.tags || []).map((tag) => {
      const hasSubject = tag.subjectType != null && tag.subjectId != null;
      return {
        subjectType: tag.subjectType,
        subjectId: tag.subjectId,
        seasonNumber: tag.seasonNumber,
        episodeNumber: tag.episodeNumber,
        franchiseId: hasSubject ? null : tag.franchiseId,
      };
    }),
    blocks,
  };
}

async function main() {
  mkdirSync(resolve('scripts/output'), { recursive: true });
  const current = await fetch(`${BACKEND_BASE_URL}/blogs/${BLOG_ID}`).then((r) => r.json());
  const body = buildPutBody(current);
  writeFileSync(resolve('scripts/output/skyler-blog-en-body.json'), JSON.stringify(body, null, 2));
  console.log(`Blok sayısı: ${body.blocks.length}`);

  if (!doWrite) {
    console.log('\nDRY-RUN: backend’e yazılmadı. Onay sonrası --write ile tekrar çalıştır.');
    return;
  }

  const res = await fetch(`${BACKEND_BASE_URL}/blogs/${BLOG_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${AUTH_TOKEN}` },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`PUT /blogs/${BLOG_ID} başarısız (${res.status}): ${data?.message || JSON.stringify(data?.fieldErrors) || res.statusText}`);
  }
  console.log(`\n✓ EN içerik yazıldı. title=${data.title}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
