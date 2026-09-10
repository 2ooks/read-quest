# Read Quest

An adaptive phonics reading game for one small reader, built as an installable web app for the iPad.

She designs a monster, then goes on short "quests" (5–10 minutes) made of tiny activities — hear a sound and tap the letter, build a word from letter tiles, tap the letters and *say it fast*, read a word or sentence to a grown-up. Behind the scenes a learner model decides what to practise next, when to bring things back for review, how confusable the wrong answers should be, and when she's ready for a new sound.

Everything lives on the device. Nothing is sent anywhere.

## Play it

**https://2ooks.github.io/read-quest/**

On the iPad: open the link in Safari, tap the Share button → **Add to Home Screen**. Then it opens full-screen, works offline, and iOS won't evict its saved progress. Turn the iPad sideways.

### First run (grown-up, ~5 minutes)

1. **Tap to start** — the first tap unlocks audio.
2. **Make your monster** — she does this bit.
3. **Sound check** — show each letter, ask *"what sound does this make?"*, tap ✓ if she says the *sound* (not the letter name). This seeds the model so the game starts where she is.
4. **Record your voice** (recommended) — hold the ⚙️ gear for a second → **Your voice** → hold each button and say the sound. Pure sounds: stretch the continuous ones (*mmmm*, *ssss*), clip the stop sounds (*t*, *p*, *k* — no "uh"). The built-in voice is a computer voice and it's fine, but a familiar voice saying clean sounds is better, and the research on screen-based reading games is blunt: the adult is the ingredient that makes them work.

Then: **Play with a grown-up** whenever you can sit with her (it adds *Read to me*, where she reads aloud and you tap ✓). **Play by myself** for the rest.

## What's in a quest

| Activity | What she does | What it teaches |
|---|---|---|
| **Sound Hunt** | Hears a sound, taps the letter | phoneme → grapheme |
| **First Sound** | Sees/hears a letter, taps the picture that starts with it | grapheme → phoneme, phonemic awareness |
| **New sound** | Big letter, cue picture, "say it with me" | one new letter-sound per quest at most |
| **Blend & Reveal** | Taps the letters in order, hears *mmmuuud*, "say it fast!", the picture pops | connected blending (modelled, unscored) |
| **Word Builder** | Hears a word, taps letter tiles into sound boxes | segmenting / spelling (Elkonin boxes) |
| **Word Match** | Hears a word, taps the written word among look-alikes | decoding |
| **Read to me** | Reads a word or short sentence aloud; grown-up taps ✓ | decoding — the strongest evidence, and co-play by design |
| **Tricky word** | Meets a heart word (*the*, *was*), heart on the part to remember; then finds it | high-frequency irregular words |

Every quest ends on a win (an unscored blend) and unlocks something for the monster to wear — a reward for *finishing*, never for a score.

## How it adapts

- **Letter-sound knowledge:** Bayesian Knowledge Tracing per grapheme–phoneme correspondence (guess = 1/choices, slip 0.15 to absorb mis-taps). *Ready* ≥ 0.80, *mastered* ≥ 0.95 **and** correct on two different days. Only the first, unaided tap counts.
- **Reading / spelling ability:** Elo (Math-Garden style) for reading aloud, building and matching words; word difficulty seeded from structure (stop-consonant onsets, digraphs, adjacent consonants, length) and nudged by play. Words are chosen so expected success ≈ 80%.
- **Difficulty knob:** how *confusable* the distractors are (b/d/p, m/n, minimal pairs like *cat/cot*), driven by a 1-up/4-down staircase per activity (≈84% success; switch to 3-down ≈79% in Settings if she's getting frustrated). Outcomes are never faked.
- **Forgetting:** expanding-interval review (1 → 2.2 → 4.8 → … days, collapses on a miss). Due items are woven into each quest.
- **Sequence:** UK *Letters and Sounds* order (the one Teach Your Monster to Read uses): `s a t p` · `i n m d` · `g o c k` · `ck e u r` · `h b f ff l ll ss` · `j v w x y z zz qu` · `ch sh th ng` · `ai ee igh oa oo` · `ar or ur ow oi` · `ear air er`. A new sound is introduced only when the previous set is solid and fewer than two sounds are still shaky. Adjacent-consonant words (*stop*, *milk*) unlock once sets 1–5 are solid.
- **Decodability:** every word in every activity is checked against what she has actually been taught (the Bob Books principle). Sentences are generated from templates using only known words and taught tricky words.
- **Errors:** no buzzer. A miss dims the tile, replays the target; after two misses the right answer pulses. She always finishes by tapping the right one. *Read to me* misses go through model → lead → test ("Let's try it together … your turn").
- **Session:** ~20 items (adjustable), one new sound max, missed items return a few turns later, activities interleaved rather than blocked.

The grown-up dashboard (hold ⚙️) shows a heat-map of every sound, tricky words, words she's worked hardest on, recent sessions, what's due, and a **Print sentences she can read** button for the sofa.

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npx vitest run       # engine tests (BKT, Elo, staircase, scheduler, decodability, composer)
npm run build
```

End-to-end smoke test (Playwright, plays a whole quest):

```bash
npx vite build && npx vite preview --port 4173   # in one terminal
python tests/e2e_smoke.py                          # in another
```

### Regenerating the built-in audio (Windows only)

The bundled clips are synthesized with the Windows speech engine using SSML `<phoneme>` tags so isolated consonants come out clipped (`t`, not "tee" or "tuh"):

```powershell
node tools/gen-manifest.ts     # every clip id + SSML → tools/manifest.json
.\tools\gen-audio.ps1          # SAPI → tools/wav/*.wav
python tools/post-audio.py     # trim, normalise, MP3 → public/audio/
```

### Layout

```
src/content/    gpcs.ts (48 letter-sounds), words.ts (~500 parsed decodable words + emoji), tricky.ts, phrases.ts, sentences.ts, wardrobe.ts
src/engine/     state.ts, bkt.ts, elo.ts, scheduler.ts, staircase.ts, decodable.ts, observe.ts, composer.ts
src/audio/      audio.ts (recorded → bundled → speech-synthesis fallback), recorder.ts, clips.ts
src/storage/    db.ts (IndexedDB)
src/ui/         screens/ (start, maker, placement, home, session, complete, wardrobe, parent) · games/ · monster.ts
tests/          engine.test.ts (vitest) · e2e_smoke.py (Playwright)
tools/          audio generation
```

### Deploying

Pushing to `main` runs tests, builds with `BASE_PATH=/read-quest/`, and deploys to GitHub Pages via `.github/workflows/deploy.yml`.

## Why it's built this way

The design follows the research summary in [docs/research-brief.md](docs/research-brief.md): systematic synthetic phonics in a high-utility letter order; phonemic awareness taught *with letters* (blending and segmenting, not rhyming units); connected blending modelled rather than choppy sound-by-sound; decodable text relative to what's taught; distributed 5–10-minute practice; retrieval and spaced review; ~80–85% success by adjusting item choice, not outcomes; rewards tied to effort rather than accuracy; co-play as a first-class mechanic because the meta-analytic evidence on GraphoGame-style games shows near-zero effect when children play alone and a substantial one with an adult involved.

Out of scope on purpose: vocabulary and comprehension — that's the bedtime book.

Fonts: [Andika](https://software.sil.org/andika/) (SIL Open Font License) — designed for beginning readers, with single-storey *a* and *g*.
