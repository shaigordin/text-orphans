# Orphans & Archetypes: finding a home for every Hittite fragment

Where does a Hittite fragment belong? This static website compares any fragment with the entire
digitised Hittite corpus (TLHdig), word by word and sign by sign, and shows the textual tradition, the compositions and
the manuscripts it is closest to, with a duplicate/join check for each manuscript. It
accompanies S. Gordin, *Orphans and Archetypes* (2026). Everything runs in the browser.

**Site:** <https://shaigordin.github.io/text-orphans/> · **Version:** see `VERSION` and `CHANGELOG.md`
· **Cite:** `CITATION.cff`

All results are computed from **TLHdig Beta Version 0.3** (G. Müller, D. Prechel, E. Rieken,
D. Schwemer, Zenodo, 21 May 2026, [doi:10.5281/zenodo.20328284](https://doi.org/10.5281/zenodo.20328284),
CC BY 4.0). The site is rebuilt when a new TLHdig release appears; the version used is named
on every page and in every export.

## Pages

| Page | What it shows |
|---|---|
| `index.html` | Opening page: carousel of examples, a quick check (text number, TLHdig or Konkordanz link, or transliteration), introductions to the tools. |
| `browse.html` | Every TLHdig text in its CTH number next to where the method places it; headline figures for the orphan bins. |
| `place.html` | Placement among the ten literature-defined traditions, the open-set check, and which words decide it (word classes and layers); tradition wheel, archetype barcode, similarity rose, word butterfly. |
| `closest.html` | Closest traditions, compositions and manuscripts in all of TLHdig, the duplicate/join checks, both texts side by side. |
| `compare.html` | Word-by-word tf-idf comparison of two witnesses. |
| `about.html` | The method in short, how far to trust it, data, how to cite, how to rebuild. |

Links: `place.html#id=KBo%2041.22`, `closest.html#id=HT%2049`, `browse.html#open=470`, `index.html#q=EBo%20133`.

## Data versions

`data/<version>/` holds one build per reading of the text, listed in `data/versions.json`
(written by `build/build_data.py --version`). **C** counts preserved signs plus restorations
supported by the same text (damaged and "?" signs count but are flagged): the main results.
**A** is the editor's full text, restorations included, for comparison. The settings bar offers
the versions built; the footer and every export name the one in use (`js/data.js`).

## Settings and exports

Tool pages share a settings bar, kept in the browser between visits: number of results (5, 10,
20); words and spellings (the paper's model), words only, or spellings (signs) only; all
writing, logograms only, or phonetic renderings only; and whether placements resting mostly on
common words count as placed. Only the default (words and spellings, all writing) is the
calibrated model of the paper; with other settings the pages show what is nearest without a
verdict. Every table can be exported as CSV or JSON, the wheel and the rose as SVG or PNG.

## Code

| File | What it does |
|---|---|
| `js/model.js` | Port of the experiments' `qtm`: sign splitting, features, tf-idf, nearest-centroid cosine, abstention margin, open-set check, word-class breakdown, feature filters. |
| `js/library.js` | All TLHdig texts of 5+ words as vectors; closest manuscripts and compositions; duplicate/join checks (as `run_join_candidates.py`). |
| `js/analyse.js` | One text, every result (used by the quick check and Closest texts). |
| `js/settings.js`, `js/export.js`, `js/site.js`, `js/carousel.js` | Settings bar, export buttons, navigation and data citation, carousel. |
| `js/home.js`, `js/browse.js`, `js/place.js`, `js/closest.js`, `js/compare.js` | One script per page. |
| `js/draw.js`, `js/verdict.js`, `js/portal.js` | Colours and figures, one verdict per text, links into hethport.net. |
| `build/build_data.py` | Writes `data/` from the TLHdig token table, using the experiments' model code. |
| `build/make_collages.mjs`, `build/collages.json` | The photograph collages of the carousel. |
| `build/make_screens.mjs` | The screenshots of the carousel. |
| `build/make_pipeline.mjs` | The "Method pipeline" slide of the carousel (KBo 41.22, step by step). |
| `tests/check.mjs`, `tests/check_library.mjs` | Browser model against the Python export, and closest manuscripts and join checks against the Python case study (EBo 133). |

## Rebuild

The model code lives in the experiments repository
([measuring-scribal-literacy](https://github.com/shaigordin/measuring-scribal-literacy), folder
`orphans/`). Clone both side by side (or set `ORPHANS` to its `orphans/` folder):

```
git clone https://github.com/shaigordin/text-orphans
git clone https://github.com/shaigordin/measuring-scribal-literacy
cd measuring-scribal-literacy/orphans
python3 -m pip install -r requirements.txt     # Python 3.13
bash reproduce.sh                              # TLHdig 0.3 from Zenodo (checksum-verified), token table, experiments
cd ../../text-orphans
python3 build/build_data.py ../measuring-scribal-literacy/orphans/data/tokens.csv --version A   # writes data/A/
node tests/check.mjs && node tests/check_library.mjs
python3 -m http.server                         # open http://localhost:8000
```

For a newer TLHdig release: change the Zenodo address and checksum in `reproduce.sh`, rerun the
steps, update `DATA` in `js/site.js`, `about.html`, `CITATION.cff` and this README, rebuild the
carousel images if their numbers changed, and add a version to `CHANGELOG.md`.

The carousel collages need the photographs, which are not in this repository: fetch them with
`orphans/fotarch/fetch_photos.js` (one photo per fragment, with pauses), then
`PHOTOS=<folder> node build/make_collages.mjs` (Playwright). The pairs and their ranks come from
`orphans/run_known_joins.py` (Konkordanz joins and duplicates against the closest-manuscript
ranking).

## Rights

Code: MIT licence (`LICENSE`). The fonts in `fonts/` (Cormorant Garamond, a subset of Noto Sans Cuneiform) are under the SIL Open Font License (`fonts/OFL.txt`). The files in `data/` are derived from TLHdig and shared, like it, under CC BY 4.0. The photographs in the carousel are
from the Hethitologie-Archiv Mainz (hethiter.net/: fotarch, numbers on each image; HT 49 ©
The Trustees of the British Museum) and are shown, credited, to illustrate results; the rights
stay with their holders.
