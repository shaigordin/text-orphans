// The genres of the Hittite corpus as the Catalogue of Hittite Texts (CTH) itself divides it:
// E. Laroche, continued by S. Košak and G.G.W. Müller, with S. Görke and Ch.W. Steitler,
// hethiter.net/: CTH (2026-07-22), https://hethport.net/CTH/index.php?lang=EN.
// Each genre is one of the catalogue's main sections, each subgenre one of its lettered
// subsections, with the first and last CTH number it covers. The ranges follow the catalogue's
// headings; nothing here is the method's own grouping.
export const SOURCE = "S. Košak, G.G.W. Müller, S. Görke, Ch.W. Steitler, hethiter.net/: CTH (2026-07-22)";
export const SOURCE_URL = "https://hethport.net/CTH/index.php?lang=EN";

export const GENRES = [
  ["I", "Historical texts", 1, 220, [
    ["A", "Pre-empire period", 1, 39], ["B", "Empire period", 40, 130], ["C", "Uncertain periods", 131, 150],
    ["D", "Letters", 151, 210], ["E", "Historical fragments", 211, 220]]],
  ["II", "Administrative and technical texts", 221, 290, [
    ["A", "Royal land donations", 221, 229], ["B", "Inventories", 230, 250], ["C", "Instructions and protocols", 251, 275],
    ["D", "Libraries: tablet catalogues and labels", 276, 283], ["E", "Hippology", 284, 288], ["F", "Recipes", 289, 290]]],
  ["III", "Legal texts", 291, 298, [["A", "Laws", 291, 292], ["B", "Depositions", 293, 298]]],
  ["IV", "Scholarly texts", 299, 320, [["A", "Vocabularies", 299, 309], ["B", "Translated literary texts", 310, 320]]],
  ["V", "Mythology", 321, 370, [
    ["A", "Anatolian mythology", 321, 340], ["B", "Mythology of extra-Anatolian origin", 341, 359], ["C", "Diverse mythological texts", 360, 370]]],
  ["VI", "Hymns and prayers", 371, 389, []],
  ["VII", "Rituals", 390, 500, [["A", "Anatolian magic", 390, 470], ["B", "Kizzuwatnean rituals", 471, 500]]],
  ["VIII", "Cult inventories", 501, 530, []],
  ["IX", "Divination", 531, 590, [["A", "Series", 531, 560], ["B", "Practice: oracle reports, dreams and vows", 561, 590]]],
  ["X", "Festivals and cults", 591, 724, [
    ["A", "Calendar", 591, 603], ["B", "AN.DAḪ.ŠUM festival", 604, 625], ["C", "Various festivals", 626, 670],
    ["D", "Cult of Nerik", 671, 680], ["E", "Cult of the Protective deity (ᴰKAL)", 681, 689], ["F", "Cult of Ḫuwaššanna of Ḫubešna", 690, 694],
    ["G", "Cults of Teššub and Ḫebat", 695, 709], ["H", "Cults of Ištar", 710, 724]]],
  ["XI", "Texts in other languages", 725, 791, [
    ["A", "Hattian", 725, 749], ["B", "Palaic", 750, 755], ["C", "Luwian", 756, 773], ["D", "Hurrian", 774, 791]]],
  ["XII", "Sumerian and Akkadian literature", 792, 819, [["A", "Religion", 792, 799], ["B", "Magic", 800, 813], ["C", "Miscellaneous", 814, 819]]],
  ["XIII", "Varia", 820, 9999, []],
].map(([n, name, from, to, subs]) => ({ n, name, from, to, subs: subs.map(([s, sname, f, t]) => ({ n: s, name: sname, from: f, to: t })) }));

// Laroche's residual bins: fragments he could not give to a composition
export const BINS = { 470: "fragments of rituals", 500: "fragments of Kizzuwatna rituals", 670: "fragments of festivals", 832: "fragments of various content" };

export const genreOf = cth => GENRES.find(g => cth >= g.from && cth <= g.to);
export const subOf = (g, cth) => g?.subs.find(s => cth >= s.from && cth <= s.to);
export const range = x => x.to >= 9999 ? `CTH ${x.from}–` : x.from === x.to ? `CTH ${x.from}` : `CTH ${x.from}–${x.to}`;
