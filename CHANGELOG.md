# Changelog

## 1.2.0 (2026-11-13)

- New page, Check a join from photos (`join.html`, `js/join.js`, `js/joinfit.js`): load two photographs, scale each by the ruler's 1 cm blocks (or a typed distance), cut the pieces out of the background, measure line spacing (marked by hand, or an automatic estimate shown as check lines), then arrange both at true scale: drag, rotate, align edges, move until they touch. Exports a PNG with legend and caveat and the measurements as JSON. A port of the measuring steps of `orphans/run_joinfit.py` (measuring-scribal-literacy); on the KBo 44.140 and EBo 133 photographs it gives the same px per cm. Photos stay in the browser.
- A short tour of each page on the first visit (kept per page in the browser), a Tour button to see it again, and a "What does this do?" button that labels the parts of the page.

## 1.1.0 (2026-11-10)

- Data versions: `data/` is now `data/<version>/` with `data/versions.json`; a "Broken and restored signs" setting chooses the version (C: preserved signs and supported restorations, the main results; A: the editor's full text). C is built from the damage-aware token table (measuring-scribal-literacy c9a1cfa) and is the default; A has the same numbers as 1.0. Footer and exports name the version.
- Transliterations follow the conventions of the paper: phonetic Hittite in italics, Akkadograms in italics and larger, Sumerograms upright, determinatives in { }; [ ] (restored, grey), ⸢ ⸣ (damaged), ⟨ ⟩, ? and ! are rebuilt from TLHdig's sign status and flags and never italic. Words that do not count are pale. Join checks treat signs off the tablet as matching anything (as run_join_candidates.py).
- Carousel: collages ranked from the signs on the tablet (C); the KBo 59.124 join slide is dropped (rank 18 in C); new slide on KBo 41.22, placed only through restored words. About gives the C figures, with A for comparison.

- New title design on the opening page: the name set in Cormorant Garamond on a clay-coloured band and the tagline "Finding a home for every Hittite fragment"; the other pages carry the name above their title.
- Carousel: the "Method pipeline" slide (five steps with KBo 44.52, written for the screen) replaces the paper's pipeline and worked-example figures; the Browse screenshot is removed.
- Opening text: "the entire digitised Hittite corpus" instead of "the whole of TLHdig".
- Fonts are self-hosted (`fonts/`, SIL Open Font License).

## 1.0.0 (2026-11-10)

First release on its own, with the paper (repository moved from
`measuring-scribal-literacy/playground`; versions up to 0.4.2 are listed below).

- New opening page: a carousel of examples (photographs of duplicates and a proposed join from the
  Konkordanz, set beside how the method ranks them; the tool's views; the method diagram and the
  worked example), a quick check that takes a text number, a TLHdig or Konkordanz link, or a
  transliteration, and short introductions to each tool.
- New page, Closest texts and joins: the closest traditions, compositions (CTH numbers) and
  manuscripts in all of TLHdig, with the duplicate/join checks (half the words, same spellings, a
  shared phrase) and both texts side by side with the shared words marked. Computed in the
  browser from TLHdig's own word forms (`data/forms.json`), identical to the experiments'
  `run_join_candidates.py` (`tests/check_library.mjs`).
- Settings on every tool page, kept between visits: how many results, words and spellings / words
  only / spellings only, all writing / logograms only / phonetic renderings only, and whether to
  treat placements resting mostly on common words as unplaced. Settings other than the paper's
  show the nearest tradition without a verdict, as the thresholds were calibrated on the full model.
- Export buttons: tables as CSV or JSON, the tradition wheel and the rose as SVG or PNG; every file
  names the data version and the settings.
- About, cite, rebuild: the method in short, how far to trust it (including the new check against
  212 Konkordanz duplicates: median rank 2), the TLHdig 0.3 citation, and how to rebuild.
- "Browse by CTH" is now `browse.html`; "Place a fragment" scores TLHdig texts with TLHdig's own
  word forms.

## 0.4.2 (2026-10-17)

- Ten word categories (realia split into realia, places, animals/body/nature, abstract nouns
  and adjectives), following the experiments' audited scheme; placements unchanged.

## 0.4.1 (2026-10-17)

- Rebuilt on the corrected word-class annotation (prepositions split from their nouns): 847 of
  2,026 orphans assigned, margin 0.018.
- Word tags show the class confidence; low-confidence classes have a dashed tag.
- The E11 numbers on the page come from the experiment report instead of the page text.
- Word-class shading rebuilt after the word-class fixes (syllabic Akkadian prepositions are
  function words; logograms in foreign-language lines keep their own class).

## 0.4.0 (2026-10-17)

- New opening page, Browse by CTH: every TLHdig text in its original CTH bin against the
  model's classification, with headline tiles for the orphan pools and links to TLHdig and the
  Konkordanz.
- Place a fragment loads any TLHdig text by siglum or by a TLHdig or Konkordanz link, and links
  back to both.
- Code split into modules (`js/`, `css/`, `build/`), with a version number, this changelog and
  a consistency check (`tests/check.mjs`).

## 0.3.0 (2026-10-17)

- What the score rests on: word classes and layers, by default for the decision margin, with a
  warning when a placement rests mostly on features common to all traditions.

## 0.2.0 (2026-10-17)

- Ten literature-defined traditions, the E9 open-set check, the similarity rose and the word
  butterfly.

## 0.1.0 (2026-10-16)

- First version: place a fragment, tradition wheel, archetype barcode, word-by-word comparison.
