# Magic Math Kids 🪄✨ (Math LDK)

A playful math game for a first-grader, made for a small phone screen.

It started as a single HTML page where a grown-up typed a few sums and the
child typed the answers. Version 4 turns it into a game she can open and play
on her own: levels that make their own sums, a big number pad to tap, stars
and records, a road to a castle and a sticker album. Version 4 keeps the
"write your own sums" box from the first version as **Homework**.

No installation, no frameworks, no dependencies, no tracking. Plain HTML, CSS
and JavaScript that also work offline from `file://`.

**Live:** https://cvera08.github.io/magic-math-kids/

---

## What she plays

### Levels (the road to the castle 🏰)

| Level | Example | Limits |
|---|---|---|
| 🌸 Sums to 10 | 3 + 4 | total ≤ 10 |
| 🐞 Take away to 10 | 9 − 5 | never below zero |
| 🦋 Sums to 20 | 8 + 7 | crosses ten, total 11–20 |
| 🐠 Take away to 20 | 20 − 7 | from the teens down |
| 🧱 Tens | 30 + 20 · 24 + 10 | up to 100 |
| 🦄 Big sums | 15 + 13 | two digits, written one above the other, no carrying yet |
| 🍬 Sweets for everyone | 4 × 2 | factors 2–5, up to 20 |
| 🍭 Share the sweets | 8 ÷ 2 | exact, up to 8 ÷ 2 / 8 ÷ 4 |
| 🎯 A bit of everything | | a mix of all of the above |

Nothing is locked. The road suggests the next stop (the first level without
two stars), and two stars on every level lights up the castle.

### Question types

Every round mixes the types, so it never turns into a worksheet:

- **Type the answer** on a big on-screen number pad
- **Tap the answer** out of three believable choices (one or two off, or what the other operation would give)
- **Find the missing number**: 3 + ? = 7
- **Right or wrong?** 5 + 3 = 9. Wrong claims are only one or two off, so she has to work them out.
- **Bigger, smaller or the same**: 7 + 2 ◯ 8
- **Fill the sequence**: 10, 20, 30, ?, or counting by 2s, by 5s, or backwards
- **Which number is it?** Tens drawn as bars and ones as dots
- **Story problems**: "There are 4 kids and each one gets 2 sweets. How many sweets do I need?" This is how she practises multiplying and sharing at home.

### When she gets one wrong

There is no fail state and no countdown. After a miss, the app draws the sum as
things she can count: strawberries for a sum, cookies crossed out for a
subtraction, tens bars for big numbers, bags of sweets for × and ÷. After three
misses on the number pad it shows the answer and moves on.

### What keeps her coming back

- ⭐ Stars per round (based on answers right on the first try) and a best score per level
- 🔥 A streak flame after three right in a row, and a unicorn that trots along the progress bar
- 🏰 The road to the castle
- ⭐ A 24-sticker album: every round with two or three stars earns a new sticker
- 💪 **The tricky ones**: the app remembers the sums she keeps missing and offers a round of just those. A sum leaves the list after two first-try answers in a row.
- 🔊 A button that reads the sum or the story aloud, in Spanish or English
- 🔔 Soft sound effects and 🎵 the calm music bed from Memory LDK (off by default)

### Homework

A grown-up writes one sum per line (`15+13`, `20-7`, `4x5`, `8/2`) and the app
turns them into a round, in that order. Lines it can't use are listed under the
box: a sum it doesn't understand, a division that isn't exact, or a result
below zero (the pad has no minus key). The box remembers its text.

---

## Design goals

- **Phone first.** It is played mostly on an iPhone SE, so every question and its number pad fit on one 375 × 667 screen.
- **Tap only.** Answers are tapped on a pad that stays in the same place under the card, never typed with the system keyboard.
- **Maximum engagement, minimum distraction.** Same brief as [Memory LDK](https://github.com/cvera08/memory-ldk). Rewards come from effort, a miss never costs anything, and there are no timers.
- Spanish (Rioplatense) and English, switchable live, remembered, and guessed from the browser on a first visit
- Offline-first, no login, no ads, no tracking. Progress lives in `localStorage` on her device only.

---

## Project layout

```
index.html        page skeleton
styles.css        all styles
js/content.js     levels, story problems, stickers, version
js/engine.js      pure math: generators, question builders, parser (no DOM)
js/hints.js       the "count it" drawings shown after a miss
js/i18n.js        Spanish and English copy
js/audio.js       sound effects and read-aloud
js/music.js       calm background music (shared with Memory LDK)
js/storage.js     scores, tricky sums, stickers, settings
js/ui.js          screens, number pad, answering flow
tests/check.js    no-browser sanity check
```

## Tests

```bash
node tests/check.js
```

The check plays thousands of generated rounds per level and confirms that:

- every answer is right and stays inside its level's limits
- each multiple-choice question has exactly one right option and no repeated options
- true/false claims are balanced and never too obvious
- sequences step evenly
- the homework parser accepts and rejects the right lines
- Spanish and English contain the same set of texts

## Running locally

Open `index.html` in a browser, or:

```bash
python3 -m http.server 8000
```

---

## Releases

- v1.0.0: initial release
- v2.0.0: UX improvements and keyboard navigation
- v3.0.0: English and Spanish
- v4.0.0: the game (levels, number pad, question types, hints, stars, the road to the castle, stickers, the tricky ones, sound)

## Motivation

This started as a small learning tool for my daughter. Her sister apps,
[English LDK](https://github.com/cvera08/english-ldk) and
[Memory LDK](https://github.com/cvera08/memory-ldk), became the ones she asks
for, so Math LDK borrowed what made them work: one tap at a time, a reason to
come back tomorrow, and no punishment for a wrong answer.
