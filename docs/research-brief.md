# Building an Adaptive Reading Game for a 4-Year-Old — Research Synthesis

Companion files: `raw-brief-1-reading-pedagogy.md` and `raw-brief-2-adaptive-game-design.md` contain the full source-by-source research with URLs. This document is the synthesis.

**Confidence key.** Claims below are from primary sources unless marked *[secondary]* (abstracts/summaries/paywalled) or *[unverified]* (vendor or review-site claims).

---

## 0. The five things that matter most

1. **She's further along than "learning letter sounds."** Independently blending *box* and *mud* is the defining skill of Ehri's **full alphabetic phase** — the exact stage where systematic phonics has its largest measured effect. The job now is *consolidation and volume of decoding*, not more letter introduction.
2. **The single biggest lever in the app literature is the adult.** GraphoGame meta-analysis (McTigue et al. 2020, 19 studies): children playing alone, word-reading effect **g = −0.02**; with high adult interaction, **g = 0.48**. Design for co-play, not for handing over the iPad.
3. **Target ~80–85% success, adapt by *item choice and distractor similarity*, never by faking outcomes.** GraphoGame targets ~80% positive feedback; Wilson et al. (2019) "85% rule" gives ~85% as a theoretical optimum for binary tasks (with caveats).
4. **Short, frequent, spaced.** Seabrook, Brown & Solity (2005): same total phonics time, *distributed* sessions beat massed ones for 5-year-olds. 5–10 minute bursts, 1–2×/day.
5. **The math is easy.** Bayesian Knowledge Tracing per letter-sound (≈15 lines of code), a small Elo for "decode CVC words," and an off-the-shelf spaced-repetition scheduler (`ts-fsrs`) is more than enough for one learner. Don't reach for deep learning.

---

## 1. Where she is, and what comes next

**Ehri's phases** (Ehri, AFT 2023):
- *Pre-alphabetic* — reads by visual cues (golden arches → "McDonald's"). Typical of untaught 3–4-year-olds.
- *Partial alphabetic* — knows letter names and some sounds, connects *some* letters to sounds, "but they don't know enough… to decode unknown words."
- *Full alphabetic* — knows major grapheme–phoneme correspondences (GPCs) and can "sound out letters and blend the sounds to form words." Repeated decoding bonds spellings to pronunciations (orthographic mapping) → words become automatic sight words.
- *Consolidated alphabetic* — multi-letter chunks (-ing, -tion); typically 2nd grade.

**Her position:** crossing partial → full alphabetic, early for her age. This is good news: she has the two strongest school-entry predictors of reading success (letter-sound knowledge + phoneme blending; National Reading Panel 2000; NELP 2008).

**What comes next (in order):**
1. Complete the single-letter set (incl. x /ks/, qu /kw/, z, j, v, w, y); lots of CVC blending *and* segmenting; first 4–6 tricky words (*the, to, I, no, go, into*).
2. Doubled letters ff/ll/ss/zz + ck (same sound, new spelling).
3. Consonant digraphs sh, ch, th, ng — one grapheme = one sound, still CVC-shaped (*ship, chop, thin, ring*).
4. Adjacent consonants CCVC/CVCC (*stop, milk, hand*) — taught as *more phonemes to blend*, not as new "blends" to memorize.
5. Vowel digraphs/trigraphs (ai ee igh oa oo ar or ur ow oi ear air ure er); second tricky-word set (*he she we me be was you they all are my her*).
6. Split digraphs / silent-e (a-e, i-e, o-e…), alternative spellings.

This is the UK **Letters and Sounds** Phase 2 → 3 → 4 → 5 progression, which is also exactly what Teach Your Monster to Read follows — so she already knows the "feel" of it.

---

## 2. What the science of reading says (and why it matters for the design)

- **National Reading Panel (2000).** Phonemic awareness (PA) and letter knowledge are "the two best school-entry predictors" of reading. PA training works best when children manipulate phonemes **with letters**, focusing on **one or two manipulations** (blending, segmenting) rather than many. Systematic phonics is "significantly more effective" than little/no phonics, and effects "were significant and substantial in kindergarten." Warning: programs "that focus too much on the teaching of letter-sound relations and not enough on putting them to use are unlikely to be very effective." *[secondary effect sizes: PA d ≈ 0.86; phonics d ≈ 0.41]*
- **Simple View of Reading** (Gough & Tunmer 1986): Reading Comprehension = Decoding × Language Comprehension. A decoding game covers only one factor. **Keep daily read-alouds** — that's where vocabulary and comprehension come from at 4.
- **Scarborough's Rope**: word recognition strands (PA, decoding, sight recognition) become *automatic*; language strands become *strategic*. Automaticity = fast + accurate, so **response latency is a legitimate signal** in your game.
- **Castles, Rastle & Nation (2018), "Ending the Reading Wars"**: systematic phonics is essential to crack the code, then instruction must move beyond phonics to fluent word recognition via print exposure, vocabulary, comprehension. *[paywalled; summary only]*
- **IES Practice Guide (K–3 Foundational Skills, 2016)** rates "awareness of speech segments linked to letters" and "decode words, analyze word parts, write and recognize words" as **strong** evidence; academic language and daily connected-text reading as **moderate**.
- **Three-cueing / picture-guessing is discouraged.** Shanahan: "Students shouldn't be taught to use pictures, meaning, context, or syntax to guess at the words. They should be taught to decode words." Context *confirms* a decoded word; it doesn't replace decoding. → In the game, pictures should appear **after** decoding (as the reward/confirmation), not before as a hint.
- **Is 4 too early?** Shanahan: no research shows harm, no research shows a 4-year-old learns *faster* than at 5–6, and an early start spreads learning over more years with less pressure. "Developmental appropriateness has more to do with how we might teach something… Keeping lessons brief and lively makes great sense." Watch "how happy and invested they seem."
- **Avoidance is the thing to prevent.** Finnish longitudinal work (Eklund et al. 2013) found avoidance of literacy activities was the most important risk factor for at-risk readers — which is why GraphoGame keeps success ≈80%.

---

## 3. Scope and sequence (concrete)

### Letter-sound orders used by major programs

| Programme | Sequence | Rationale |
|---|---|---|
| **Jolly Phonics** (42 sounds) | 1: **s a t i p n** · 2: c/k e h r m d · 3: g o u l f b · 4: ai j oa ie ee or · 5: z w ng v oo oo · 6: y x ch sh th th · 7: qu ou oi ue er ar | SATPIN chosen for "high word-blending potential (sat, pin, tip)"; confusable letters (b/d) in separate groups; sounds first, names later |
| **UK Letters and Sounds** (DfES 2007) | **Phase 2**: s a t p · i n m d · g o c k · ck e u r · h b f ff l ll ss. **Phase 3**: j v w x y z zz qu; ch sh th ng; ai ee igh oa oo ar or ur ow oi ear air ure er. **Phase 4**: no new GPCs — CCVC/CVCC. **Phase 5**: alternative spellings, split digraphs | Tricky words: Ph2 *the to I no go into*; Ph3 *he she we me be was you they all are my her*; Ph4 *said have like so do some come were there little one when out what* |
| **UFLI Foundations** | a m s t → p f i n → o d c u g b e → -s → k h r l w j y x qu v z → ck sh th ch wh ph ng nk (from ~lesson 44) | Interleaves word-reading lessons between letters; teaches plural -s early |
| **Teach Your Monster to Read** | *First Steps*: s a t p i n m d g o c k ck e u r h b f ff l ll ss j qu v w x y z zz + 6 tricky words · *Fun With Words*: 18 digraphs/trigraphs + 30 tricky words + CCVC/CVCC + sentences · *Champion Reader*: alternative spellings, mini-books | Mirrors Letters and Sounds Phases 2 → 3 → 4/5 |

Common logic: start with high-utility letters including **continuants** (/s/ /m/ /n/ /f/ — stretchable, easy to blend), get a vowel early so real words appear in week one, separate confusables, one spelling per sound first, digraphs only after single letters are solid.

### Letter names vs. sounds; pure sounds
- Lead with **sounds** (blending needs sounds). Names aren't harmful — Piasta & Wagner (2010) found teaching names *and* sounds helped for letters whose names contain their sound (b d f l m n p s t k j v z). Be careful with misleading names (h, w, y, long-vowel names).
- **Clip the stops.** Gonzalez-Frey & Ehri (2021): stop consonants "are harder to blend because of intrusion from schwa vowels." Record /t/ /p/ /k/ /b/ /d/ /g/ with **no "uh"**; stretch continuants (/sss/, /mmm/).

### Phonemic awareness — skip most of it
Developmental order is rhyme → syllables → onset-rime → first sound → blending → segmenting → manipulation, but the NRP and Brady (2020) conclude instruction should go straight to **blending and segmenting with letters**. For this child: no rhyming units. Blend, segment, isolate first/last sound — with letters visible.

### Blending technique (evidence)
- **Connected phonation beats segmented.** Gonzalez-Frey & Ehri (2021): "sssaaannn" (no breaks) beat "sss–aaa–nnn" on learning and transfer; breaking between phonemes made children forget the first sound. → Model blending as one stretched stream, then "say it fast."
- **Successive blending** (/s/+/a/ → "sa", + /t/ → "sat") is the scaffold for kids who can't hold 3 sounds in working memory.
- **Elkonin (sound) boxes** — one box per phoneme, push a counter per sound, then drop letters in — is the standard segmenting-to-spelling bridge and translates perfectly to a drag-tiles mechanic.

### Decodable text and word lists
- A word is decodable **relative to what's been taught**. Bob Books Set 1 works because Book 1 (*Mat*) uses only m, a, t, s; Book 2 (*Sam*) adds c, d; letters accumulate across 12 books.
- **Algorithm:** maintain `taughtGPCs` and `taughtTrickyWords`; parse each candidate into graphemes; word is eligible iff every grapheme is in `taughtGPCs` (or whole word is a taught tricky word). Generate CVC candidates from taught letters, filter against a real-word dictionary + a profanity list + an imageability check.
- **CVC priority words** (concrete, imageable, high frequency): from SATPIN — *sat pin tap tip pat nap sip tin pit pan ant sap*; adding m d g o c k e u r h b f l — *cat dog mom dad hot sun bed red big box mud cup bus hat run get leg top log pen fun bag*.
- **High-frequency words**: many are fully decodable early (*in on it at and can up if had not but him his*) — teach as decodable words, not flashcards. Truly irregular ones are **heart words**: decode the regular parts, highlight the irregular part (*the* → "th" regular, "e" irregular; *was* → "w" regular, "a" and "s"=/z/ irregular). First set: *the, to, I, no, go, into*. Introduce in short sentences ("Sam is in the mud") so function words get meaning from context (Ehri).

### Writing
Include **encoding** (segment-and-spell), not handwriting. Ouellette & Sénéchal (2017): kindergarten invented-spelling sophistication predicted Grade 1 reading *beyond* letter knowledge, PA and vocabulary. In the game: drag letter tiles into sound boxes. Pencil work optional.

---

## 4. Practice principles that work

| Principle | Evidence | Design implication |
|---|---|---|
| **Distributed practice** | Seabrook et al. 2005: distributed > massed for 5yo phonics, same total time. Spaced retrieval *g ≈ 0.74* (Latimier 2020) *[secondary]* | 5–10 min sessions, 1–2×/day; a scheduler that brings items back at expanding intervals |
| **Retrieval / production** | Retrieval vs. restudy *g ≈ 0.50* (Rowland 2014) *[secondary]*; Jolly Phonics: shuffle cards "to avoid memorising the order" | Have her *say* the sound/word (production), not just tap (recognition); randomize order |
| **Interleaving + cumulative review** | Interleaving *g ≈ 0.42* overall but smaller/reversed for some verbal material (Brunmair & Richter 2019) *[secondary]* | Introduce one new GPC at a time (brief, blocked), then immediately interleave with everything taught. Interleave *mechanics* (sound→letter, build-word, read-aloud) rather than randomizing every letter |
| **Explicit instruction, I do / we do / you do** | Archer & Hughes 2011; UFLI | Error correction = **model–lead–test**: "My turn: /m/ /u/ /d/, mud. Together: mud. Your turn." |
| **Errorful > errorless for preschoolers** | 3- and 5-year-olds remembered more after generate-then-correct than errorless learning, persisting at 5 weeks *[secondary]* | Let her attempt first; correct immediately and warmly; never leave an error uncorrected |
| **Multisensory / Orton-Gillingham** | WWC: no qualifying studies; Stevens et al. 2021: small, non-significant (+0.22) | The explicit/systematic core is what works. Use actions/songs as *mnemonics* for fun, not as the mechanism |
| **Read-alouds** | Simple View; IES Rec. 1 (moderate) | The game never displaces bedtime reading; add a "read together tonight" nudge |

---

## 5. Designing the adaptive engine

### 5.1 Model the curriculum as a skill graph (knowledge components)
~60 knowledge components (KCs): each GPC, each tricky word, plus skill families `blend-CVC(word)` and `segment-CVC(word)`. Prerequisite edges follow Letters and Sounds:

```
GPC s,a,t,p → GPC i,n,m,d → GPC g,o,c,k → ck,e,u,r → h,b,f,ff,l,ll,ss      (Phase 2)
all GPCs in a word ≥ 0.80  →  blend-CVC(word)  →  segment-CVC(word)
Phase 2 GPCs ≥ 0.95  →  j v w x y z zz qu, ch sh th ng, vowel digraphs …       (Phase 3)
tricky words taught as whole-word KCs in parallel
```

Item selection = "pick a KC whose prerequisites are above threshold and whose own p(known) is in the learning zone."

### 5.2 Bayesian Knowledge Tracing per discrete fact (letter-sounds, tricky words)
Each KC has a hidden known/unknown state, four parameters:

| Param | Meaning | Suggested value for this project |
|---|---|---|
| **L₀** prior | p(known) before practice | 0.85 if she got it right in a 3-min placement, else 0.10 |
| **T** transit | p(unknown→known) per practice | 0.15 |
| **G** guess | p(correct \| unknown) | **1 / number of choices** (set structurally, don't fit) |
| **S** slip | p(wrong \| known) | **0.15–0.20** (higher than adult default to absorb mis-taps/distraction) |

```
after CORRECT:   P(L|obs) = P(L)(1−S) / [ P(L)(1−S) + (1−P(L))G ]
after INCORRECT: P(L|obs) = P(L)S     / [ P(L)S     + (1−P(L))(1−G) ]
then learn:      P(L') = P(L|obs) + (1 − P(L|obs))·T
predict next:    P(correct) = P(L')(1−S) + (1−P(L'))G
```

Thresholds: **"ready to build on" ≥ 0.80**; **"mastered" ≥ 0.95 AND ≥ 2 correct on separate days** (kills lucky-guess mastery). Only the **first unaided** response updates the model — a correct answer after a hint is not evidence. Vanilla BKT has no forgetting; handle that with the scheduler (§5.4).

With one learner you cannot fit parameters by EM — set them by design and tune by hand. `pyBKT` (Python) is useful later for offline sanity-checking your exported log. No maintained npm BKT library exists; write it yourself (~15 lines).

### 5.3 Elo/IRT for the continuous skill ("decode CVC words")
Math Garden (Klinkenberg, Straatemeier & van der Maas 2011) updates learner ability θ and item difficulty b after every response with no calibration phase:

```
E = 1 / (1 + exp(−(θ − b)))          # expected P(correct)
θ ← θ + K_θ · (S − E)                 # S ∈ {0,1}
b ← b + K_b · (E − S)
```

Start K ≈ 0.1–0.15, shrink as observations accumulate (`K = K₀ / (1 + n·decay)`), bound estimates ±4. Math Garden selects items so expected success ≈ 0.75 *[secondary]*. With a single child, item-difficulty updates are noisy — **seed b from a formula** (continuant vs. stop onset, word frequency, how many of its GPCs are mastered) and keep K_b small (~0.05); let θ do the moving. Duolingo's "Birdbrain" is the same idea at scale.

**Rule of thumb:** BKT for discrete facts (which letter says /s/); Elo for a graded skill where items vary in difficulty (reading words).

### 5.4 Spaced repetition for forgetting
Use **`ts-fsrs`** (maintained TypeScript FSRS; `createEmptyCard()`, `fsrs().next(card, now, Rating.Good)` returns updated card + due date). Every GPC and word is a card; map correct → `Good`, wrong → `Again` (ignore Hard/Easy). Each session pulls due cards for review. Leitner boxes would also be perfectly adequate for ~60 GPCs + ~100 words if you want zero dependencies. Duolingo's Half-Life Regression needs population data — skip, but its mental model (exponential decay, half-life grows with successes) is right.

### 5.5 The difficulty knob and the target success rate
- **Knob = distractor confusability**, exactly as GraphoGame does it: as she succeeds, distractors become more phonologically/visually similar (b/d/p, m/n, e/i); after errors, less similar. Missed items recur more often.
- **Controller = 4-down/1-up staircase** (Levitt 1971): converges to 0.5^(1/4) ≈ **84%** success without any model. Drop to 3-down/1-up (≈79%) if she gets frustrated — that matches GraphoGame's ~80%.
- **Never adjust outcomes**, only item choice. DDA pitfalls: players noticing and feeling cheated, rubber-banding that punishes success.
- **The "85% rule"** (Wilson, Shenhav, Straccia & Cohen 2019, *Nature Communications*): for gradient-descent learners on binary classification, learning rate is maximized at ≈15.87% error. Authors explicitly say extension to complex cases is "an important question for future work." Nothing in it is about children or reading. Treat 80–85% as a sensible prior, not a law.

### 5.6 Stealth assessment — what to log
Evidence-Centered Design (Mislevy) = competency model (your skill graph) + evidence model (BKT/Elo updates) + task model (mini-game templates). Signals that matter:
- **First-response correctness** — primary evidence.
- **Latency** — fast-correct (< ~2 s) is stronger evidence than slow-correct; track an `automatic` counter per KC for the dashboard (ROAR-Letter and Project LISTEN both use this).
- **Hint usage** — post-hint correct ≠ correct.
- **Self-correction** — wrong-then-right within ~1 s is a slip, not a misconception.
- **Mis-tap guard** — ignore taps within ~300 ms of a screen change.

---

## 6. Game design for a 4-year-old

### UX (Sesame Workshop 2012 tablet guidelines; NN/g) *[secondary]*
Assume a non-reader: every instruction is audio + visual. Large, well-separated targets (≥ 9–10 mm); avoid the bottom screen edge (resting wrists); **tap is easy, drag is hard under ~5** (keep drag short, snap generously); no multi-touch, swipe, long-press or double-tap; landscape; one action per screen; minimal clutter; **no timers or countdowns**; a clear "all done" moment; no autoplay loops.

### Rewards and motivation
- **Overjustification effect** (Lepper, Greene & Nisbett 1973): preschoolers promised a "Good Player Award" for drawing later drew *less* in free play. Deci et al. (1999): expected tangible rewards undermine intrinsic motivation; verbal praise doesn't. → **Reward session completion and effort, not accuracy percentage.** Monster earns a hat piece for finishing a session, not per correct answer.
- **Intrinsic integration** (Habgood & Ainsworth 2011): when the learning content *is* the core mechanic, children learned more and chose to play ~7× longer than the "sugar-coated" version. → Avoid chocolate-covered broccoli. The reading *is* the game (the letter you tap opens the door; the word you build feeds the monster).
- **Seductive details** (Sundararajan & Adesope 2020, *g ≈ −0.33*) *[secondary]*; Mayer's coherence principle. → Celebratory animations short and **after** the response, never during the decision.
- **Keep the monster.** Customization → ownership → narrative frame. That's what TYMTR gets right.
- Hirsh-Pasek et al. (2015) four pillars of a genuinely educational app: **active, engaged (no distraction), meaningful, socially interactive**.

### Feedback and error handling
Immediate, specific, encouraging. Never a buzzer or red X. On error: model the answer (play the sound, glow the correct letter), immediate retry, then re-present the item later in the session. Hint ladder: (1) replay sound → (2) dim wrong choices → (3) animate the correct one → she taps it. Score only the first attempt; still let her "win" the item. Praise the process: "You stretched the sounds and blended them!"

### Co-play is a feature, not a fallback
- McTigue et al. (2020): GraphoGame alone g = −0.02; with adult interaction g = 0.48.
- Takeuchi & Stevens (2011) *The New Coviewing*; Mathers et al. (2025) Oxford meta-analysis: features prompting adult–child talk improve interaction quality (g ≈ 0.56) *[secondary]*.
- **The "Read it to me" mechanic (she reads aloud, you tap ✓/✗) is simultaneously your best assessment signal, the only reliable "ASR," and the co-play the research demands.** Add grown-up prompts ("Ask her to say it fast!") and a parent dashboard.

---

## 7. Lessons from existing programs

| Program | What it does | What to take |
|---|---|---|
| **Teach Your Monster to Read** (Usborne Foundation, free) | Systematic synthetic phonics aligned to Letters and Sounds; 3 stages; parent picks starting stage; mini-games for sound-matching, blending, segmenting, tricky words; monster customization + island exploration | Curriculum order + monster ownership. No independent RCT found; "1.5 grade levels in 12 weeks" claim is *[unverified]*. Appears curriculum-sequenced with light adaptivity, not truly adaptive — **that's your opening** |
| **GraphoGame** (Univ. of Jyväskylä) | Hear a sound, tap the letter; adapts distractor similarity to hold ~80% success; missed items recur; new GPCs when performance stabilizes | The closest analogue to what you want. Finnish RCTs positive incl. long-term (Saine et al.); UK Kyle et al. 2013 positive; **but** EEF/NFER 2018 RCT vs. schools already doing small-group literacy: −0.06 *[secondary]*. → Works vs. nothing, not vs. good teaching. Position yours as practice between Bob Books sessions with you |
| **Bob Books** | Set 1: 2–3-letter short-vowel words, letters added a few per book; Set 2: 3–4 letters; Set 3: word families/blends; Set 4: complex; Set 5: long vowels | The model for strict decodability; your word generator should be able to reproduce Book 1's *Mat* with only {m,a,t,s} |
| **Khan Academy Kids** | Mastery-based Learning Path: letters → sounds → beginning/middle/ending sounds → vowels → CVC → sight words; skips mastered topics, scaffolds struggling ones | UMass RCT (N=49, 4–5yo, 10 wks, ~20 min/day): pre-literacy 34th → 47th percentile vs. no change in controls. Note protocol *replaced* other screen time |
| **Duolingo ABC** | Free, phonics drills aligned to NRP components | Efficacy claim is vendor-commissioned *[unverified]* |
| **Reading Eggs** | Placement test → linear 120-lesson map; heavy rewards | Publisher-sponsored research; reward-heavy = the thing §6 warns about |
| **Amira Learning** | ASR listens to oral reading, micro-interventions (from CMU Project LISTEN) | Requires child-speech ASR you can't match — see §8 |
| **Kim et al. (2021)** app meta-analysis | 36 studies: educational apps +0.31 SD, *larger* for preschoolers and for constrained skills (letters, phonics) | Your target (constrained code skills, age 4) is where apps work best |

### Mini-game mechanic → reading skill

| Mechanic | Skill | Notes |
|---|---|---|
| Hear /s/, tap the letter (3–4 choices) | phoneme → grapheme | G = 1/n; confusability knob |
| See letter, tap the picture whose name starts with it | grapheme → phoneme + PA | |
| Hear a word, tap it among 2–3 written words | decoding (recognition) | Weak unless distractors share the onset (*mud / mat / man*) — otherwise she matches on first letter |
| Drag letters into sound boxes to spell a pictured word | segmenting / encoding | Strong multi-step evidence; keep drags short |
| Tap letters in order → hear blended word → picture reveals | blending (supported) | Picture *after* decoding, per §2 |
| **Read the word aloud; parent taps ✓/✗** | decoding (production) | Strongest evidence; requires co-play |
| Tap the tricky word you hear; heart highlighted on irregular part | tricky/heart words | |

---

## 8. Technical build notes

- **Platform:** PWA on iPad Safari, installed to the home screen. Plain DOM/CSS + Svelte/React is enough for tap games; PixiJS if you want sprites; Phaser if you want a full scene/tween engine (heavier). Native buys nothing you need.
- **iOS gotchas (WebKit blog, verified):** Safari deletes all script-writable storage after 7 days without site interaction — **but home-screen web apps are exempt** ("have their own counter… we do not expect… website data to be deleted"). Still export progress weekly. Audio needs a user gesture: create/resume `AudioContext` inside the first tap ("Tap to start"), then pre-decode all clips.
- **Audio — record it yourself.** Web Speech API doesn't honor SSML `<phoneme>` in mainstream browsers; TTS renders isolated /m/ as "em" or "muh." **Record the 44 phonemes (clipped stops, stretched continuants) and every word in your own voice** — it's also a nice touch for her. Cloud TTS (Azure/Polly) can batch-render *words* acceptably if needed. Freesound "English Phonemes" pack exists but license unverified.
- **Speech recognition — don't.** Zero-shot Whisper on young children's speech: WER ≈ 25–81% depending on corpus *[secondary]*; commercial child-speech engines are proprietary. Parent ✓/✗ is more accurate and is the co-play the research wants.
- **Storage:** IndexedDB (`idb-keyval` or Dexie). Tables: KC state (p_known, FSRS card, attempts, fast-correct count) + append-only event log (timestamp, item, KCs, response, latency, hint level). JSON export button. Dashboard = GPC heatmap by p(known), "due for review" list, session summaries. No backend.
- **Privacy:** COPPA applies to commercial operators; a personal local-only app is out of scope. If it ever ships, 2025 amendments explicitly cover children's voice/audio recordings — keep everything on-device.

### Reusable resources
- **Algorithms:** `ts-fsrs` — github.com/open-spaced-repetition/ts-fsrs · `pyBKT` — github.com/CAHLR/pyBKT · Math Garden Elo reference (CRAN `meow` vignette) — cran.r-project.org/web/packages/meow/vignettes/maths-garden-update.html
- **Phonics content:** Letters and Sounds PDF — gov.uk/government/publications/letters-and-sounds · UFLI Toolbox (free scope & sequence, decodables) — ufli.education.ufl.edu/foundations/toolbox/ · UFLI word lists by lesson — spellingjoy.com/ufli · Dolch/Fry lists (public domain) · Free decodables: SPELD SA (speldsa.org.au/pages/speld-sa-phonic-books), Flyleaf e-book library, Reading Universe, right2readinitiative.com/free-decodable-texts/
- **Images for CVC words:** Mulberry Symbols (SVG, CC BY-SA 4.0, verified) — mulberrysymbols.org · OpenMoji (CC BY-SA 4.0) · Twemoji (CC-BY 4.0) · ARASAAC (CC BY-NC-SA, fine for personal use) · search across sets at opensymbols.org / globalsymbols.com
- **Audio:** Howler.js or raw Web Audio for gapless playback.

---

## 9. Recommended architecture (the MVP)

**Competency model.** ~60 KCs: Phase 2 GPCs (5 sets) → Phase 3 digraphs; `blend-CVC` and `segment-CVC` parameterized by word; tricky words as individual KCs. A word is *eligible* when every constituent GPC has p(known) ≥ 0.80.

**Evidence model.**
- BKT per GPC and tricky word (L₀ from a 3-minute parent-assisted placement: tap-the-letter for 26 letters + sh/ch/th; T = 0.15, S = 0.15, G = 1/n). Ready ≥ 0.80; Mastered ≥ 0.95 + 2 correct on different days. First unaided tap only. Latency < 2 s → `automatic` counter (display only).
- Elo θ for "CVC decoding" (later a second θ for digraph words), b seeded by formula, K_θ 0.15 → 0.05, K_b 0.05. Observation = parent ✓/✗ from "Read it to me."
- Every GPC/word is a `ts-fsrs` card: correct → Good, wrong → Again.

**Session composer** (7–10 min, ~25 items): ~55–60% *frontier* items (0.3 ≤ p < 0.95, prerequisites met) · ~25% FSRS-due review · ~10–15% *one* new GPC, introduced only when fewer than two GPCs are "in progress." Interleave mechanics, not letters. Difficulty knob = distractor confusability via 4-down/1-up staircase per mechanic (≈84%; fall back to 3-down ≈79%). Every session ends on a win and a monster reward for *finishing*.

**Feedback.** Error → model the answer → retry → re-present later. Hint ladder. No negative sounds. Short post-response celebrations.

**Co-play.** "Read it to me" and "Sound it out with me" screens require you. Grown-up prompt cards. Parent dashboard + weekly JSON export + a "read together tonight" nudge with a printable decodable mini-sentence built from her current mastered set.

**Tech.** Svelte/React PWA on iPad home screen; IndexedDB; your recorded phoneme/word audio unlocked on first tap; no ASR; no network.

**Explicitly out of scope:** vocabulary and comprehension (that's read-alouds), handwriting, rhyming units, letter names as a unit.

---

## 10. Mistakes to avoid (compiled)

1. Letter names instead of sounds, or "buh/muh" — the schwa sabotages blending.
2. Alphabetical order — delays word building; use SATPIN-style utility order.
3. Picture/context guessing — pictures confirm, they don't cue.
4. Memorizing sight words wholesale — decode the regular HF words; heart-word only the irregular part.
5. Too much letter-free PA (rhyming, clapping) — go to blending/segmenting with letters.
6. Teaching letter-sounds without applying them in words (NRP's explicit warning).
7. Handing over the tablet and walking away (g ≈ 0 alone vs. 0.48 with an adult).
8. Stopping read-alouds once decoding starts.
9. Long massed sessions — distributed bursts win.
10. Making it a test / judging her by decoding accuracy — avoidance is the risk to prevent.
11. "Sound it out!" on *said, one, was* — just tell the word, then heart-word it.
12. Rewarding accuracy with tangible prizes — overjustification; reward finishing/effort.
13. Faking outcomes to manage difficulty — adjust item choice only.
14. Decorative animation during the decision — seductive details; celebrate after.

---

## 11. Gaps and things to verify before quoting

- Castles et al. (2018) and the IES guide PDF were not machine-readable; summaries from abstracts.
- NRP effect sizes, Rowland/Brunmair/Sundararajan/Latimier/Mathers effect sizes, the EEF GraphoGame −0.06, and Whisper WER figures are from abstracts/summaries.
- GraphoGame's exact item-selection algorithm (Richardson & Lyytinen 2014) could not be opened; the ~80% target is verified from Ojanen et al. 2015.
- TYMTR has published no scope-and-sequence document or independent trial that could be found; its within-stage adaptivity is unconfirmed.
- Letters and Sounds set contents and UFLI order come from reproductions (Twinkl/DoodleLearning/teacher PDFs), not the official documents. Worth fetching the DfES PDF and UFLI official scope before finalizing your KC list.
- Duolingo ABC and Reading Eggs efficacy is vendor-sponsored.

---

## 12. Key sources

**Reading science:** NRP findings — nichd.nih.gov/publications/pubs/nrp/findings · IES K–3 guide — ies.ed.gov/ncee/wwc/PracticeGuide/21 · Ehri phases (AFT 2023) — aft.org/ae/fall2023/ehri · Castles, Rastle & Nation 2018 — journals.sagepub.com/doi/10.1177/1529100618772271 · Shanahan on three-cueing — shanahanonliteracy.com/blog/three-cueing-and-the-law · Shanahan on when to begin — shanahanonliteracy.com/blog/when-should-reading-instruction-begin-1 · Simple View / Rope — readingrockets.org/topics/about-reading/articles/simple-view-reading · NELP 2008 — readingrockets.org/resources/resource-library/developing-early-literacy-report-national-early-literacy-panel · Brady 2020 — thereadingleague.org/wp-content/uploads/2020/10/Brady-Expanded-Version-of-Alphabetics-TRLJ.pdf · Gonzalez-Frey & Ehri 2021 — eric.ed.gov/?id=EJ1295469 · Piasta & Wagner 2010 — eric.ed.gov/?id=EJ876203 · Seabrook et al. 2005 — psycnet.apa.org/psycinfo/2005-00899-009 · Ouellette & Sénéchal 2017 — readingrockets.org/resources/resource-library/invented-spelling-kindergarten-predictor-reading-and-spelling-grade-1 · OG evidence — ies.ed.gov/ncee/wwc/Intervention/737 · Elkonin boxes — readingrockets.org/classroom/classroom-strategies/elkonin-boxes · Archer & Hughes — corelearn.com/files/Archer_Handouts.pdf · Sold a Story — features.apmreports.org/sold-a-story/

**Sequences:** Jolly Phonics — jollylearning.com/resources/jolly-phonics/teachers-guide/letter-sounds-recognition · Letters and Sounds — gov.uk/government/publications/letters-and-sounds · UFLI — ufli.education.ufl.edu/foundations/ · TYMTR overview — teachyourmonster.org/teach-your-monster-to-read-overview/ · TYMTR research — help.teachyourmonster.org/en/articles/15820728 · Bob Books — bobbooks.com/product/set-1-beginning-readers-hard-cover/

**Apps & efficacy:** Ojanen et al. 2015 (GraphoGame) — frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00671/full · Kyle et al. 2013 — eric.ed.gov/?id=EJ996119 · McTigue et al. 2020 — eric.ed.gov/?id=EJ1238280 · EEF GraphoGame Rime — educationendowmentfoundation.org.uk/projects-and-evaluation/projects/graphogame-rime · Kim et al. 2021 — eric.ed.gov/?id=EJ1323865 · Khan Kids RCT — umass.edu/news/article/new-educational-app-shows-promise · Khan Kids Learning Path — khankids.zendesk.com/hc/en-us/articles/360048828572 · Hirsh-Pasek et al. 2015 — psychologicalscience.org/journals/pspi/1529100615569721/

**Adaptive algorithms:** pyBKT — arxiv.org/abs/2105.00385 · Bulut et al. 2023 BKT intro — mdpi.com/2624-8611/5/3/50 · Klinkenberg et al. 2011 — eric.ed.gov/?id=EJ925823 · Settles & Meeder 2016 HLR — aclanthology.org/P16-1174/ · Duolingo Birdbrain — blog.duolingo.com/learning-how-to-help-you-learn-introducing-birdbrain/ · Khajah et al. 2016 "How Deep is KT?" — arxiv.org/abs/1604.02416 · Wilson et al. 2019 85% rule — pmc.ncbi.nlm.nih.gov/articles/PMC6831579/ · Levitt staircase — mathematicalpsychology.com/Adaptive_Methods · Hunicke 2005 DDA — users.cs.northwestern.edu/~hunicke/pubs/Hamlet.pdf · Shute stealth assessment — myweb.fsu.edu/vshute/pdf/SA_Primer.pdf · Koedinger et al. 2012 KLI — eric.ed.gov/?id=EJ972110

**Game design for kids:** Sesame Workshop 2012 — joanganzcooneycenter.org/wp-content/uploads/2020/02/SesameWorkshop-2012.pdf · Habgood & Ainsworth 2011 — eric.ed.gov/?id=EJ922627 · Sundararajan & Adesope 2020 — doi.org/10.1007/s10648-020-09522-4 · Takeuchi & Stevens 2011 — joanganzcooneycenter.org/initiative/the-new-coviewing-initiative-investigating-and-designing-for-joint-media-engagement/ · Mathers et al. 2025 — ora.ox.ac.uk/objects/uuid:f0e456c2-c34f-4f9e-92b2-726ccfaa7e9a

**Tech:** WebKit storage policy — webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/ · Web Speech SSML gap — github.com/mdn/browser-compat-data/issues/15663 · Whisper child ASR — github.com/rishabhjain16/whisper_child_asr
