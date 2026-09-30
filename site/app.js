"use strict";

/* ---------- Theme toggle ---------- */

(function themeToggle() {
  const root = document.documentElement;
  const button = document.querySelector(".theme-toggle");
  const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
  const current = () => root.dataset.theme || (systemDark() ? "dark" : "light");

  const label = () => {
    button.setAttribute("aria-label", current() === "dark" ? "Switch to light theme" : "Switch to dark theme");
  };
  button.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (_) {}
    label();
  });
  label();
})();

/* ---------- Fingerprint demo: character 3-grams ---------- */

(function fingerprintDemo() {
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
  const textA = document.getElementById("text-a");
  const textB = document.getElementById("text-b");
  const value = document.getElementById("similarity-value");
  const fill = document.getElementById("similarity-fill");
  const meter = document.getElementById("similarity-meter");
  const listA = document.getElementById("grams-a");
  const listB = document.getElementById("grams-b");

  function profile(text) {
    const clean = text.toLowerCase().replace(/\s+/g, " ").trim();
    const counts = new Map();
    for (let i = 0; i + 3 <= clean.length; i++) {
      const gram = clean.slice(i, i + 3);
      counts.set(gram, (counts.get(gram) || 0) + 1);
    }
    return counts;
  }

  function cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (const [g, c] of a) {
      na += c * c;
      if (b.has(g)) dot += c * b.get(g);
    }
    for (const c of b.values()) nb += c * c;
    return na && nb ? dot / Math.sqrt(na * nb) : 0;
  }

  function top(counts, n) {
    return [...counts.entries()].sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0])).slice(0, n);
  }

  function render(list, counts, other) {
    list.replaceChildren(
      ...top(counts, 10).map(([gram, count]) => {
        const li = document.createElement("li");
        li.textContent = gram.replace(/ /g, "·");
        if (other.has(gram)) {
          li.classList.add("shared");
          li.title = "Also appears in the other text";
        }
        const b = document.createElement("b");
        b.textContent = "×" + count;
        li.append(b);
        return li;
      })
    );
  }

  function update() {
    const a = profile(textA.value);
    const b = profile(textB.value);
    const pct = Math.round(cosine(a, b) * 100);
    value.textContent = pct + "%";
    fill.style.width = pct + "%";
    meter.setAttribute("aria-valuenow", String(pct));
    render(listA, a, b);
    render(listB, b, a);
  }

  textA.addEventListener("input", update);
  textB.addEventListener("input", update);
  document.querySelectorAll("[data-preset]").forEach((btn) => {
    btn.addEventListener("click", () => {
      [textA.value, textB.value] = presets[btn.dataset.preset];
      update();
    });
  });
  update();
})();

/* ---------- 10-fold cross-validation illustration ---------- */

(function folds() {
  const row = document.getElementById("fold-row");
  const caption = document.getElementById("fold-caption");
  const next = document.getElementById("fold-next");
  const cells = Array.from({ length: 10 }, (_, i) => {
    const d = document.createElement("div");
    d.className = "fold";
    d.textContent = String(i + 1);
    row.append(d);
    return d;
  });
  let round = 0;
  function show() {
    cells.forEach((c, i) => c.classList.toggle("test", i === round));
    caption.textContent = `Round ${round + 1} of 10: group ${round + 1} is the exam, the other 9 are study material.`;
  }
  next.addEventListener("click", () => {
    round = (round + 1) % 10;
    show();
  });
  show();
})();

/* ---------- Results chart: small multiples of horizontal bars ---------- */

(function resultsChart() {
  // From results/baselines/summary.md. Mean ± standard deviation over splits.
  const models = [
    { key: "pan18-baseline", name: "PAN-18 baseline (letter 3-grams)", short: "PAN-18 baseline", color: "var(--series-1)" },
    { key: "char-ngram-svm", name: "Letter 1–4-grams + SVM", short: "Letter n-grams + SVM", color: "var(--series-2)" },
    { key: "fasttext", name: "fastText (words)", short: "fastText", color: "var(--series-3)" },
  ];
  const datasets = [
    {
      name: "Web genres: 7-genre", metric: "Accuracy, 10-fold CV × 3 seeds",
      values: { "pan18-baseline": [94.3, 2.3], "char-ngram-svm": [97.2, 1.9], fasttext: [91.1, 2.3] },
    },
    {
      name: "Web genres: KI-04", metric: "Accuracy, 10-fold CV × 3 seeds",
      values: { "pan18-baseline": [75.9, 3.8], "char-ngram-svm": [85.0, 2.9], fasttext: [65.6, 4.1] },
    },
    {
      name: "Authorship: PAN-18", metric: "Macro-F1, 20 problems in 5 languages",
      values: { "pan18-baseline": [58.4, 12.4], "char-ngram-svm": [58.2, 12.7], fasttext: [13.4, 10.3] },
    },
  ];

  const svgNS = "http://www.w3.org/2000/svg";
  const el = (name, attrs, text) => {
    const node = document.createElementNS(svgNS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const figure = document.querySelector(".viz-root");
  const tooltip = document.getElementById("chart-tooltip");

  // Legend
  document.getElementById("chart-legend").replaceChildren(
    ...models.map((m) => {
      const li = document.createElement("li");
      const sw = document.createElement("i");
      sw.style.background = m.color;
      li.append(sw, m.name);
      return li;
    })
  );

  // Panels
  const W = 300, left = 0, right = 36, barH = 18, rowH = 44, top = 4;
  const H = top + models.length * rowH + 22;
  const x = (v) => left + (v / 100) * (W - left - right);

  const panels = document.getElementById("chart-panels");
  datasets.forEach((ds) => {
    const panel = document.createElement("div");
    panel.className = "panel";
    const h = document.createElement("h4");
    h.textContent = ds.name;
    const metric = document.createElement("div");
    metric.className = "metric";
    metric.textContent = ds.metric;
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${ds.name}: ${models.map((m) => `${m.short} ${ds.values[m.key][0]}`).join(", ")}` });

    const axisY = top + models.length * rowH;
    [0, 25, 50, 75, 100].forEach((t) => {
      svg.append(el("line", { class: "grid-line", x1: x(t), x2: x(t), y1: top, y2: axisY }));
      svg.append(el("text", { class: "tick", x: x(t), y: axisY + 16, "text-anchor": t === 0 ? "start" : t === 100 ? "end" : "middle" }, String(t)));
    });

    models.forEach((m, i) => {
      const [mean, std] = ds.values[m.key];
      const y = top + i * rowH + 18;
      const g = el("g", { class: "row", tabindex: "0" });
      g.append(el("text", { class: "bar-label", x: left, y: y - 5 }, m.short));
      const w = x(mean) - left;
      const r = Math.min(4, w);
      // Square at the baseline, 4px rounded data end.
      g.append(el("path", {
        class: "bar",
        fill: m.color,
        d: `M${left},${y} H${left + w - r} Q${left + w},${y} ${left + w},${y + r} V${y + barH - r} Q${left + w},${y + barH} ${left + w - r},${y + barH} H${left} Z`,
      }));
      g.append(el("text", { class: "value", x: left + w + 6, y: y + barH / 2 + 4 }, mean.toFixed(1)));
      g.append(el("rect", { class: "hit", x: left, y: y - 16, width: W - left, height: rowH - 4 }));

      const show = (clientX, clientY) => {
        tooltip.innerHTML = "";
        const key = document.createElement("span");
        key.className = "tt-key";
        key.style.background = m.color;
        const title = document.createElement("strong");
        title.textContent = m.name;
        const line = document.createElement("div");
        line.textContent = `${ds.name}: ${mean.toFixed(1)} ± ${std.toFixed(1)}`;
        tooltip.append(key, title, line);
        tooltip.hidden = false;
        const box = figure.getBoundingClientRect();
        const tw = tooltip.offsetWidth;
        let px = clientX - box.left + 12;
        if (px + tw > box.width - 8) px = clientX - box.left - tw - 12;
        tooltip.style.left = Math.max(8, px) + "px";
        tooltip.style.top = clientY - box.top + 12 + "px";
      };
      g.addEventListener("pointermove", (e) => show(e.clientX, e.clientY));
      g.addEventListener("pointerleave", () => { tooltip.hidden = true; });
      g.addEventListener("focus", () => {
        const r = g.getBoundingClientRect();
        show(r.left + r.width / 2, r.top + r.height / 2);
      });
      g.addEventListener("blur", () => { tooltip.hidden = true; });
      svg.append(g);
    });

    svg.append(el("line", { class: "baseline", x1: left, x2: left, y1: top, y2: axisY }));
    panel.append(h, metric, svg);
    panels.append(panel);
  });

  // Table view
  const table = document.getElementById("chart-table");
  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  ["Method", ...datasets.map((d) => d.name)].forEach((t) => {
    const th = document.createElement("th");
    th.textContent = t;
    hr.append(th);
  });
  thead.append(hr);
  const tbody = document.createElement("tbody");
  models.forEach((m) => {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = m.name;
    tr.append(th);
    datasets.forEach((d) => {
      const [mean, std] = d.values[m.key];
      const td = document.createElement("td");
      td.className = "num";
      td.textContent = `${mean.toFixed(1)} ± ${std.toFixed(1)}`;
      tr.append(td);
    });
    tbody.append(tr);
  });
  table.replaceChildren(thead, tbody);
})();
