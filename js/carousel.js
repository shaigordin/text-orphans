// The image carousel of the opening page. Slides are listed in img/carousel/slides.json:
// { "src", "alt", "title", "caption" (HTML), "credit" (HTML, with links to the photo sources),
//   "link" (where "See it in the tool" goes) }
const el = document.getElementById("carousel");
const slides = await (await fetch("img/carousel/slides.json")).json();
let i = 0, timer = null;
el.innerHTML = `<div class="track">${slides.map((s, k) => `
  <figure class="slide" role="group" aria-roledescription="slide" aria-label="${k + 1} of ${slides.length}" ${k ? "hidden" : ""}>
    <img src="img/carousel/${s.src}" alt="${s.alt}" loading="${k ? "lazy" : "eager"}">
    <figcaption><b>${s.title}</b> ${s.caption}${s.link ? ` <a href="${s.link}">See it in the tool →</a>` : ""}
      ${s.credit ? `<span class="credit">${s.credit}</span>` : ""}</figcaption>
  </figure>`).join("")}</div>
  <button class="prev" aria-label="Previous slide">‹</button><button class="next" aria-label="Next slide">›</button>
  <div class="dots">${slides.map((_, k) => `<button aria-label="Slide ${k + 1}"></button>`).join("")}</div>`;
const figs = el.querySelectorAll(".slide"), dots = el.querySelectorAll(".dots button");
function show(k) {
  i = (k + slides.length) % slides.length;
  figs.forEach((f, n) => (f.hidden = n !== i));
  dots.forEach((d, n) => d.setAttribute("aria-current", n === i));
}
const play = () => { clearInterval(timer); if (!matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(() => show(i + 1), 8000); };
el.querySelector(".prev").onclick = () => { show(i - 1); play(); };
el.querySelector(".next").onclick = () => { show(i + 1); play(); };
dots.forEach((d, n) => (d.onclick = () => { show(n); play(); }));
el.addEventListener("mouseenter", () => clearInterval(timer));
el.addEventListener("mouseleave", play);
el.addEventListener("focusin", () => clearInterval(timer));
el.tabIndex = 0;
el.addEventListener("keydown", e => { if (e.key === "ArrowLeft") show(i - 1); if (e.key === "ArrowRight") show(i + 1); });
show(0);
play();
