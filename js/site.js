// Shared page frame: the navigation and the footer with the data citation, the same on every page.
import * as V from "./data.js";
export const VERSION = "1.1.0";
export const DATA = {
  name: "TLHdig Beta 0.3",
  cite: "G. Müller, D. Prechel, E. Rieken, D. Schwemer, Thesaurus Linguarum Hethaeorum digitalis (TLHdig) Beta Version 0.3, Zenodo, 21 May 2026, CC BY 4.0",
  doi: "10.5281/zenodo.20328284",
  date: "2026-05-21",
};
const PAGES = [
  ["index.html", "Home"],
  ["browse.html", "Browse the CTH bins"],
  ["place.html", "Place a fragment"],
  ["closest.html", "Closest texts and joins"],
  ["compare.html", "Compare word by word"],
  ["about.html", "About, cite, rebuild"],
];

export function frame() {
  const here = location.pathname.split("/").pop() || "index.html";
  const h1 = document.querySelector("header:not(.hero) h1");
  if (h1) h1.insertAdjacentHTML("beforebegin", `<a class="brand" href="index.html">Orphans <span class="amp">&amp;</span> Archetypes</a>`);
  const nav = document.getElementById("nav");
  if (nav) nav.innerHTML = PAGES.map(([href, label]) =>
    `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  const foot = document.getElementById("foot");
  if (foot) foot.insertAdjacentHTML("beforeend",
    `<p>All results are computed from <b>${DATA.name}</b>, ${V.LABEL} (${DATA.cite}; Zenodo <a href="https://doi.org/${DATA.doi}">doi:${DATA.doi}</a>). ` +
    `The method is that of S. Gordin, <i>Orphans and Archetypes</i> (2026); see <a href="about.html">About, cite, rebuild</a> for how to cite this tool and how to rebuild it with newer data. ` +
    `CTH numbers and titles follow TLHdig and the Konkordanz der hethitischen Keilschrifttafeln (S. Košak, <a href="https://hethport.net">hethport.net</a>). ` +
    `Everything runs in your browser; nothing you paste is sent anywhere. Version ${VERSION}.</p>`);
}
frame();
