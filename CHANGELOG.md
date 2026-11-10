# Changelog

## 1.1.0 (2026-11-10)

- New title design on the opening page: the name set in Cormorant Garamond on a clay-coloured band, with a line of cuneiform from KBo 41.22 and the tagline "Finding a home for every Hittite fragment"; the other pages carry the name above their title.
- Carousel: the "Method pipeline" slide (five steps with KBo 41.22, written for the screen) replaces the paper's pipeline and worked-example figures; the Browse screenshot is removed.
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
