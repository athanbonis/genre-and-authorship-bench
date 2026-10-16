"use strict";

/* ---------- Theme ---------- */
(function () {
  const root = document.documentElement;
  const btn = document.querySelector(".theme-toggle");
  const current = () => root.dataset.theme || "light";
  const label = () => btn.setAttribute("aria-label", current() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  btn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (_) {}
    label();
  });
  label();
})();

/* ---------- Shared 3-gram helpers ---------- */
function profile(text) {
  const clean = text.toLowerCase().replace(/\s+/g, " ").trim();
  const counts = new Map();
  for (let i = 0; i + 3 <= clean.length; i++) {
    const g = clean.slice(i, i + 3);
    counts.set(g, (counts.get(g) || 0) + 1);
  }
  return counts;
}
function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const [g, c] of a) { na += c * c; if (b.has(g)) dot += c * b.get(g); }
  for (const c of b.values()) nb += c * c;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}
function topGrams(counts, n) {
  return [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, n);
}
const show = (g) => g.replace(/ /g, "·");

/* ---------- Figure 1: fingerprint ---------- */
(function () {
  const presets = {
    same: [
      "Well, honestly, I never thought it would come to this. Honestly! We walked, and walked, and then, well, we simply sat down and laughed.",
      "Well, I suppose it was bound to happen, honestly. We talked, and talked, and then, well, we just gave up and laughed about it.",
    ],
    different: [
      "Well, honestly, I never thought it would come to this. Honestly! We walked, and walked, and then, well, we simply sat down and laughed.",
      "The committee convened at nine o'clock. Its members reviewed the quarterly figures, approved the proposed budget and adjourned without further discussion.",
    ],
  };
  const a = document.getElementById("text-a"), b = document.getElementById("text-b");
  const val = document.getElementById("sim-value"), fill = document.getElementById("sim-fill"), meter = document.getElementById("sim-meter");
  const la = document.getElementById("grams-a"), lb = document.getElementById("grams-b");
  function render(list, counts, other) {
    list.replaceChildren(...topGrams(counts, 10).map(([g, c]) => {
      const li = document.createElement("li");
      li.textContent = show(g);
      if (other.has(g)) { li.className = "shared"; li.title = "Also appears in the other text"; }
      const n = document.createElement("b"); n.textContent = "×" + c; li.append(n);
      return li;
    }));
  }
  function update() {
    const pa = profile(a.value), pb = profile(b.value);
    const pct = Math.round(cosine(pa, pb) * 100);
    val.textContent = pct + "%"; fill.style.width = pct + "%"; meter.setAttribute("aria-valuenow", String(pct));
    render(la, pa, pb); render(lb, pb, pa);
  }
  a.addEventListener("input", update); b.addEventListener("input", update);
  document.querySelectorAll("[data-preset]").forEach((btn) => btn.addEventListener("click", () => {
    [a.value, b.value] = presets[btn.dataset.preset]; update();
  }));
  update();
})();

/* ---------- Figure 2: CV grid ---------- */
(function () {
  const svg = document.getElementById("cv-svg");
  const NS = "http://www.w3.org/2000/svg";
  const left = 64, cw = 44, ch = 13, gap = 2.5, top = 4;
  let html = "";
  for (let r = 0; r < 10; r++) {
    const y = top + r * (ch + gap + 1.5);
    html += `<text x="0" y="${y + ch - 2.5}">round ${String(r + 1).padStart(2, " ")}</text>`;
    for (let f = 0; f < 10; f++) {
      html += `<rect x="${left + f * (cw + gap)}" y="${y}" width="${cw}" height="${ch}" rx="2" class="${f === r ? "cv-test" : "cv-train"}"></rect>`;
    }
  }
  svg.innerHTML = html;
})();

/* ---------- Figure 3: results ---------- */
(function () {
  // From results/baselines/summary.md. Mean ± standard deviation over splits.
  const models = [
    { key: "pan18-baseline", name: "PAN-18 baseline (char 3-grams + SVM)", short: "PAN-18 baseline", color: "var(--series-1)" },
    { key: "char-ngram-svm", name: "Char 1–4-grams + SVM", short: "Char n-grams + SVM", color: "var(--series-2)" },
    { key: "fasttext", name: "fastText (words)", short: "fastText", color: "var(--series-3)" },
  ];
  const datasets = [
    { name: "7-genre", metric: "Accuracy · 30 splits", values: { "pan18-baseline": [94.3, 2.3], "char-ngram-svm": [97.2, 1.9], fasttext: [91.1, 2.3] } },
    { name: "KI-04", metric: "Accuracy · 30 splits", values: { "pan18-baseline": [75.9, 3.8], "char-ngram-svm": [85.0, 2.9], fasttext: [65.6, 4.1] } },
    { name: "PAN-18 authorship", metric: "Macro-F1 · 20 problems", values: { "pan18-baseline": [58.4, 12.4], "char-ngram-svm": [58.2, 12.7], fasttext: [13.4, 10.3] } },
  ];
  const NS = "http://www.w3.org/2000/svg";
  const el = (n, attrs, text) => { const e = document.createElementNS(NS, n); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; };
  const box = document.getElementById("viz"), tip = document.getElementById("tooltip");

  document.getElementById("legend").replaceChildren(...models.map((m) => {
    const li = document.createElement("li"); const i = document.createElement("i"); i.style.background = m.color; li.append(i, m.name); return li;
  }));

  const W = 250, right = 38, barH = 16, rowH = 42, top = 4;
  const H = top + models.length * rowH + 20;
  const x = (v) => (Math.min(100, Math.max(0, v)) / 100) * (W - right);
  const panels = document.getElementById("panels");

  datasets.forEach((ds) => {
    const p = document.createElement("div"); p.className = "panel";
    const h = document.createElement("h4"); h.textContent = ds.name;
    const m = document.createElement("div"); m.className = "metric"; m.textContent = ds.metric;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${ds.name}: ` + models.map((md) => `${md.short} ${ds.values[md.key][0]}`).join(", ") });
    const axisY = top + models.length * rowH;
    [0, 25, 50, 75, 100].forEach((t) => {
      svg.append(el("line", { class: "grid-line", x1: x(t), x2: x(t), y1: top, y2: axisY }));
      svg.append(el("text", { class: "tick", x: x(t), y: axisY + 14, "text-anchor": t === 0 ? "start" : t === 100 ? "end" : "middle" }, String(t)));
    });
    models.forEach((md, i) => {
      const [mean, sd] = ds.values[md.key];
      const y = top + i * rowH + 17;
      const g = el("g", { class: "row", tabindex: "0" });
      g.append(el("text", { class: "bar-label", x: 0, y: y - 5 }, md.short));
      const w = x(mean), r = Math.min(4, w);
      g.append(el("path", { class: "bar", fill: md.color, d: `M0,${y} H${w - r} Q${w},${y} ${w},${y + r} V${y + barH - r} Q${w},${y + barH} ${w - r},${y + barH} H0 Z` }));
      const lo = x(mean - sd), hi = x(mean + sd), cy = y + barH / 2;
      g.append(el("line", { class: "whisker", x1: lo, x2: hi, y1: cy, y2: cy }));
      g.append(el("line", { class: "whisker", x1: lo, x2: lo, y1: cy - 4, y2: cy + 4 }));
      g.append(el("line", { class: "whisker", x1: hi, x2: hi, y1: cy - 4, y2: cy + 4 }));
      g.append(el("text", { class: "value", x: Math.max(w, hi) + 6, y: cy + 4 }, mean.toFixed(1)));
      g.append(el("rect", { class: "hit", x: 0, y: y - 16, width: W, height: rowH - 4 }));
      const showTip = (cx, cyy) => {
        tip.replaceChildren();
        const s = document.createElement("strong"); const k = document.createElement("span"); k.className = "tt-key"; k.style.background = md.color;
        s.append(k, md.name);
        const l1 = document.createElement("div"); l1.className = "tt-line"; l1.textContent = `${ds.name}: ${mean.toFixed(1)} ± ${sd.toFixed(1)}`;
        const l2 = document.createElement("div"); l2.className = "tt-line"; l2.textContent = ds.metric;
        tip.append(s, l1, l2); tip.hidden = false;
        const b = box.getBoundingClientRect(); const tw = tip.offsetWidth;
        let px = cx - b.left + 12; if (px + tw > b.width - 8) px = cx - b.left - tw - 12;
        tip.style.left = Math.max(8, px) + "px"; tip.style.top = (cyy - b.top + 12) + "px";
      };
      g.addEventListener("pointermove", (e) => showTip(e.clientX, e.clientY));
      g.addEventListener("pointerleave", () => { tip.hidden = true; });
      g.addEventListener("focus", () => { const r2 = g.getBoundingClientRect(); showTip(r2.left + r2.width / 2, r2.top + r2.height / 2); });
      g.addEventListener("blur", () => { tip.hidden = true; });
      svg.append(g);
    });
    svg.append(el("line", { class: "baseline", x1: 0, x2: 0, y1: top, y2: axisY }));
    p.append(h, m, svg); panels.append(p);
  });

  const t = document.getElementById("results-table");
  const cap = document.createElement("caption"); cap.innerHTML = "<b>Figure 3 data.</b> Mean ± standard deviation.";
  const thead = document.createElement("thead"); const hr = document.createElement("tr");
  ["Method", ...datasets.map((d) => d.name)].forEach((s, i) => { const th = document.createElement("th"); th.textContent = s; if (i) th.className = "n"; hr.append(th); });
  thead.append(hr);
  const tb = document.createElement("tbody");
  models.forEach((md) => {
    const tr = document.createElement("tr"); const th = document.createElement("th"); th.textContent = md.name; tr.append(th);
    datasets.forEach((d) => { const [mean, sd] = d.values[md.key]; const td = document.createElement("td"); td.className = "n"; td.textContent = `${mean.toFixed(1)} ± ${sd.toFixed(1)}`; tr.append(td); });
    tb.append(tr);
  });
  t.replaceChildren(cap, thead, tb);
})();

/* ---------- Contents highlight ---------- */
(function () {
  const links = [...document.querySelectorAll(".toc a")];
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { links.forEach((l) => l.classList.remove("active")); map.get(e.target.id)?.classList.add("active"); }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
})();

/* ---------- Play mode ---------- */
(function () {
  // Every text below was written for this game. None of it comes from the research corpora.
  const GENRES = {
    blog: "Posted by Anna on Tuesday, March 4. So I finally tried the new bakery on my street and wow. I'm not even kidding, best croissant of my life. Anyway, more on that later. Leave a comment below and tell me your favourite spot! 12 comments | Permalink | Share this post",
    eshop: "Add to cart. Price: $24.99. In stock, ships within 2 business days. Free shipping on orders over $50. Customer reviews (38). Select size: S M L XL. Quantity: 1. Secure checkout. Returns accepted within 30 days. Related products",
    faq: "Frequently Asked Questions. Q: How do I reset my password? A: Click 'Forgot password' on the login page and follow the instructions. Q: Can I change my username? A: No, usernames cannot be changed after registration. Q: Who do I contact for help? A: Email our support team.",
    frontpage: "Today's top stories. Updated 10:42 AM. Markets rise as inflation slows. Storm warning issued for the coast. Local team wins final. Weather | Sport | Business | Opinion | Video. Subscribe to our newsletter. Most read. Breaking news",
    listing: "Links and resources. Directory of museums: Art museums (124), History museums (87), Science centres (52), Children's museums (31). Next page. Sort by name. See also: Galleries, Libraries, Archives. Back to top",
    php: "Welcome to my home page! My name is Peter and I study physics at the university. Here you can find my CV, my publications, some photos from my holidays and links to my friends. This page was last updated in 2003. Email me!",
    spage: "Search results 1 - 10 of about 2,340 for 'cheap flights'. Did you mean: cheap flight? Sponsored links. Advanced search. Results per page: 10 20 50. Previous 1 2 3 4 5 Next. Search within results. Your search took 0.21 seconds",
  };
  const GENRE_NAMES = { blog: "Blog", eshop: "Online shop", faq: "FAQ", frontpage: "News front page", listing: "Link listing", php: "Personal home page", spage: "Search results" };
  const SUSPECTS = [
    { id: "margo", name: "Margo", known: [
      "Whilst the sauce reduces, one ought to be patient; rushing it rather spoils the colour, and quite honestly the flavour suffers too. I generally favour a splash of wine, though I realise not everyone does.",
      "I have always rather liked baking bread on grey mornings; the kitchen fills with warmth, and one forgets the weather entirely. Do organise your flour beforehand, otherwise it becomes quite a muddle."] },
    { id: "dev", name: "Dev", known: [
      "ok so I tried the pasta thing again and it's SO good!! gonna add way more garlic next time lol. honestly don't even measure, just eyeball it!!",
      "made pancakes this morning and they're kinda burnt lol but whatever, still ate like five!! gonna get a better pan this weekend for sure"] },
    { id: "prof", name: "Dr. Okafor", known: [
      "The emulsion is stable for approximately 30 minutes (at 20 °C). Moreover, the ratio of oil to yolk is critical; thus, a ratio of 3:1 is recommended. See Table 2 for details.",
      "Fermentation proceeds in three stages (cf. Section 4). Furthermore, the dough temperature should remain between 24 and 27 °C; consequently, proofing time varies by approximately 15%."] },
    { id: "rosa", name: "Rosa", known: [
      "I chop the onions. Then I wait. The pan gets hot... and then I add everything at once. It smells like my grandmother's house. I always cry a little.",
      "I open the oven. The cake is not ready. I close it again... and then I sit and wait. The kitchen is quiet. I like it that way."] },
  ];
  const ROUNDS = [
    { kind: "genre", truth: "faq",
      text: "Q: Do you deliver on weekends? A: Yes, orders placed before noon on Friday arrive on Saturday. Q: Is gift wrapping available? A: Yes, for a small fee. Q: What if my item is damaged? A: Contact us within 14 days.",
      why: "Slices like <mark>Q: </mark> and <mark>A: </mark> repeat in a fixed rhythm. That structure is the strongest signal, even though the page talks about shopping." },
    { kind: "author", truth: "dev", topic: "a football match",
      text: "ok that game was INSANE!! we were down two goals and then boom, three in ten minutes lol. gonna be hoarse tomorrow for sure, don't even care!!",
      why: "The topic moved from cooking to football, but <mark>!! </mark>, <mark>lol</mark>, <mark>gon</mark> and the lowercase sentence starts came along. Habits travel across topics." },
    { kind: "genre", truth: "spage",
      text: "Results 11 - 20 of about 870 for 'vintage camera lens'. Previous 1 2 3 Next. Related searches: lens adapter, film camera. Search tips. Results per page 20. Showing results for camera lens.",
      why: "Boilerplate gives it away: <mark>res</mark><mark>ult</mark>, <mark>of </mark><mark>abo</mark>, <mark>per</mark> page. The model never reads the words as words. It counts the slices." },
    { kind: "author", truth: "rosa", topic: "a train journey",
      text: "I find my seat. The train starts. Fields go past... and then a river. A child sings somewhere behind me. I close my eyes for a while.",
      why: "Short present-tense sentences, <mark>...</mark> and <mark>and then</mark>. Rosa writes the same way about onions and about trains." },
    { kind: "genre", truth: "php",
      text: "Hi! I'm Maria and this is my little corner of the web. I teach maths in Athens and I love sailing. Below are my lesson notes, a few photos of my cat and links to sites I like. Thanks for visiting, sign my guestbook!",
      why: "First person (<mark>my </mark>, <mark>I l</mark>), photos and links to friends. Its second guess was Blog, and that is the classic confusion between these two genres." },
    { kind: "author", truth: "margo", topic: "a storm",
      text: "The storm arrived rather earlier than forecast; one could hardly see the garden, and quite frankly I realised the shutters were a poor investment. Whilst it raged, I organised the cupboards.",
      why: "British spellings are character n-grams too: <mark>ise</mark> in realised and organised, plus <mark>hil</mark> from whilst, <mark>rat</mark> from rather, and the semicolons." },
    { kind: "genre", truth: "blog",
      text: "New arrivals this week! I've been testing these running shoes for a month and honestly I love them. Price: $89. Read my full review below and leave a comment.",
      why: "A hybrid: a blog post that quotes a price. Real web pages often mix genres. That is one reason KI-04 (85.0%) is harder than 7-genre (97.2%)." },
    { kind: "author", truth: "prof", topic: "a holiday",
      text: "Our holiday lasted 9 days (Crete, in June). The hotel was approximately 2 km from the beach; thus, we walked there each morning. Moreover, the food was excellent.",
      why: "A near miss: Dr. Okafor scored 0.338 and Margo 0.337. Both use semicolons, and a short text gives few slices to compare. With 7 texts per author and long unknown texts, PAN-18 is easier for the model than this round, but still unsolved at 58 F1." },
  ];

  const exam = document.getElementById("exam");
  const stage = document.getElementById("stage");
  const progress = document.getElementById("progress");
  const sYou = document.getElementById("score-you"), sModel = document.getElementById("score-model");
  const closeBtn = document.getElementById("exam-close");
  let state = { i: 0, you: 0, model: 0, answered: false };
  let lastFocus = null;

  const genreProfiles = Object.fromEntries(Object.entries(GENRES).map(([k, t]) => [k, profile(t)]));
  const suspectProfiles = Object.fromEntries(SUSPECTS.map((s) => [s.id, profile(s.known.join(" "))]));

  function modelScores(r) {
    const p = profile(r.text);
    const src = r.kind === "genre" ? genreProfiles : suspectProfiles;
    return Object.entries(src).map(([k, prof]) => [k, cosine(p, prof)]).sort((a, b) => b[1] - a[1]);
  }
  const nameOf = (r, k) => r.kind === "genre" ? GENRE_NAMES[k] : SUSPECTS.find((s) => s.id === k).name;

  function renderProgress() {
    progress.replaceChildren(...ROUNDS.map((_, j) => {
      const i = document.createElement("i");
      if (j < state.i || (j === state.i && state.answered)) i.className = "done";
      else if (j === state.i) i.className = "now";
      return i;
    }));
    sYou.textContent = state.you; sModel.textContent = state.model;
  }

  function h(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs) { if (k === "html") e.innerHTML = attrs[k]; else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); }
    kids.flat().forEach((c) => e.append(c));
    return e;
  }

  function renderRound() {
    const r = ROUNDS[state.i];
    state.answered = false;
    renderProgress();
    const isG = r.kind === "genre";
    const wrap = h("div", { class: "stage fade-in" },
      h("p", { class: "round-tag" }, `Round ${state.i + 1} of ${ROUNDS.length} · ${isG ? "Web genre" : "Authorship"}`),
      h("h2", {}, isG ? "What kind of page is this text from?" : `Who wrote this text about ${r.topic}?`),
      h("p", { class: "hint" }, isG
        ? "This is the visible text of a web page with the HTML stripped, which is how the corpora store it."
        : "You have each suspect's writing about cooking. The mystery text is on a different topic, as in PAN-18."),
      h("div", { class: "specimen" + (isG ? " web" : ""), "data-label": isG ? "Page text" : "Unknown text" }, r.text)
    );
    let choices;
    if (isG) {
      choices = h("div", { class: "options", role: "group", "aria-label": "Genres" },
        Object.keys(GENRES).map((k) => h("button", { class: "opt", type: "button", "data-k": k, onclick: () => answer(k) }, GENRE_NAMES[k])));
    } else {
      choices = h("div", { class: "suspects", role: "group", "aria-label": "Suspects" },
        SUSPECTS.map((s) => h("button", { class: "suspect", type: "button", "data-k": s.id, onclick: () => answer(s.id) },
          h("span", { class: "who" }, h("i", {}, s.name.replace("Dr. ", "")[0]), s.name),
          s.known.map((t) => h("q", {}, t)))));
    }
    wrap.append(choices, h("div", { id: "verdict-slot" }));
    stage.replaceChildren(wrap);
    stage.scrollIntoView({ block: "start" });
    exam.scrollTop = 0;
    const first = choices.querySelector("button"); if (first) first.focus({ preventScroll: true });
  }

  function answer(k) {
    if (state.answered) return;
    state.answered = true;
    const r = ROUNDS[state.i];
    const scores = modelScores(r);
    const modelPick = scores[0][0];
    const youRight = k === r.truth, modelRight = modelPick === r.truth;
    if (youRight) state.you++;
    if (modelRight) state.model++;
    renderProgress();

    stage.querySelectorAll("[data-k]").forEach((b) => {
      b.disabled = true;
      if (b.dataset.k === r.truth) b.classList.add("is-right");
      else if (b.dataset.k === k) b.classList.add("is-wrong");
    });

    const max = scores[0][1] || 1;
    const shown = r.kind === "genre" ? scores.slice(0, 4) : scores;
    const sims = h("div", { class: "sims" },
      h("h4", {}, "Model's 3-gram similarity to each " + (r.kind === "genre" ? "genre example (top 4)" : "suspect")),
      shown.map(([key, v], j) => {
        const bar = h("i"); bar.style.width = "0%";
        requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = (v / max * 100).toFixed(1) + "%"; }));
        return h("div", { class: "sim" + (j === 0 ? " top" : "") + (key === r.truth ? " truth" : "") },
          h("span", { class: "lbl" }, nameOf(r, key)), h("span", { class: "track" }, bar), h("span", { class: "v" }, v.toFixed(3)));
      }));
    const nextLabel = state.i + 1 < ROUNDS.length ? "Next round" : "See the final score";
    const next = h("button", { class: "next", type: "button", onclick: () => { state.i++; state.i < ROUNDS.length ? renderRound() : renderFinal(); } }, nextLabel + " →");
    const v = h("div", { class: "verdict fade-in", role: "status" },
      h("div", { class: "verdict-line" },
        h("span", { class: youRight ? "ok" : "no" }, youRight ? "✓" : "✗", h("b", {}, "You: "), nameOf(r, k)),
        h("span", { class: modelRight ? "ok" : "no" }, modelRight ? "✓" : "✗", h("b", {}, "Model: "), nameOf(r, modelPick)),
        h("span", {}, h("b", {}, "Answer: "), nameOf(r, r.truth))),
      sims,
      h("p", { class: "why", html: r.why }),
      next);
    document.getElementById("verdict-slot").replaceWith(v);
    v.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
    next.focus({ preventScroll: true });
  }

  function renderFinal() {
    state.answered = true;
    renderProgress();
    const { you, model } = state;
    const headline = you > model ? "You beat the letter counter." : you === model ? "A draw with the letter counter." : "The letter counter wins this time.";
    const wrap = h("div", { class: "final fade-in" },
      h("p", { class: "round-tag" }, "Final score"),
      h("h2", {}, headline),
      h("div", { class: "duel" },
        h("div", { class: "you" }, h("small", {}, "You"), h("b", {}, String(you))),
        h("span", {}, "vs"),
        h("div", {}, h("small", {}, "Model"), h("b", {}, String(model)))),
      h("div", { class: "lesson" },
        h("b", {}, "What the real benchmark shows"),
        h("p", {}, "The model in this game used one example per genre and two per suspect. The research version trains an SVM on the same kind of 3-gram counts, using hundreds of pages. It sorts 97.2% of 7-genre pages correctly. On cross-topic authorship, with longer texts and up to 20 candidates, it reaches only 58 macro-F1."),
        h("p", {}, "The open question is whether pretrained models and LLMs do better. That is the next round of experiments.")),
      h("div", { class: "actions" },
        h("button", { class: "next", type: "button", onclick: () => { close(); location.hash = "results"; document.getElementById("results").scrollIntoView(); } }, "Read the results →"),
        h("button", { class: "ghost", type: "button", onclick: start }, "Play again")));
    stage.replaceChildren(wrap);
    exam.scrollTop = 0;
    wrap.querySelector("button").focus({ preventScroll: true });
  }

  function start() { state = { i: 0, you: 0, model: 0, answered: false }; renderRound(); }
  function open() {
    lastFocus = document.activeElement;
    exam.hidden = false; document.body.classList.add("exam-open");
    start();
  }
  function close() {
    exam.hidden = true; document.body.classList.remove("exam-open");
    if (location.hash === "#play") history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.querySelectorAll("[data-play]").forEach((b) => b.addEventListener("click", open));
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (exam.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "Tab") {
      const f = [...exam.querySelectorAll("button:not(:disabled), a[href]")];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  if (location.hash === "#play") open();
})();
