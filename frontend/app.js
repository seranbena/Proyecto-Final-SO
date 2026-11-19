(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pad = (n) => String(n).padStart(2, "0");

  const API_BASE = (typeof API_URL === "string" ? API_URL.trim() : "").replace(/\/+$/, "");

  const DEMO_DATA = [
    { nombre: "UNIX", anio: 1969, tipo: "Tiempo compartido" },
    { nombre: "MS-DOS", anio: 1981, tipo: "Monousuario" },
    { nombre: "Mac OS", anio: 1984, tipo: "Escritorio" },
    { nombre: "Linux", anio: 1991, tipo: "Kernel monolítico" },
    { nombre: "Windows NT", anio: 1993, tipo: "Kernel híbrido" },
    { nombre: "FreeRTOS", anio: 2003, tipo: "Tiempo real" },
    { nombre: "iOS", anio: 2007, tipo: "Móvil" },
    { nombre: "Android", anio: 2008, tipo: "Móvil" }
  ];

  const NOTES = {
    "unix": "Nace en Bell Labs. El árbol que sembró casi todo lo que vino después: procesos, archivos y una filosofía de herramientas pequeñas.",
    "ms-dos": "El PC se vuelve masivo. Línea de comandos, 16 bits y una relación directa con el hierro.",
    "mac os": "La interfaz gráfica llega al escritorio. Ventanas, ratón y la metáfora del escritorio convertida en programa.",
    "linux": "Un kernel libre que creció con internet. Distribuciones, servidores y la nube pasan por aquí.",
    "windows nt": "Kernel híbrido, capas de abstracción y compatibilidad empresarial. La apuesta de Microsoft por la robustez.",
    "freertos": "Tiempo real en dispositivos diminutos. Tareas, scheduler y latencias que se miden en microsegundos.",
    "ios": "El teléfono se convierte en plataforma. Multitáctil, sandbox y una tienda que reorganizó la industria.",
    "android": "Linux en el bolsillo. Un modelo abierto, máquina virtual y una fragmentación que define su historia."
  };

  const DEFAULT_TICKER = [
    "UNIX 1969", "MS-DOS 1981", "MAC OS 1984", "LINUX 1991",
    "WINDOWS NT 1993", "FREERTOS 2003", "IOS 2007", "ANDROID 2008"
  ];

  const state = { data: [], demo: false, statsDone: false };
  let entries = [];
  let scrollTicking = false;

  const els = {
    progressBar: $("#progressBar"),
    status: $("#status"),
    statusText: $("#statusText"),
    clock: $("#clock"),
    heroApi: $("#heroApi"),
    heroRange: $("#heroRange"),
    heroCount: $("#heroCount"),
    statement: $("#statement"),
    statsGrid: $("#statsGrid"),
    estado: $("#estado"),
    archiveCount: $("#archiveCount"),
    demoBanner: $("#demoBanner"),
    timeline: $("#timeline"),
    footerApi: $("#footerApi"),
    apiLink: $("#apiLink"),
    tickerTrack: $("#tickerTrack")
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function apiHost() {
    if (!API_BASE) return "SIN CONFIG";
    try {
      return new URL(API_BASE).host || API_BASE;
    } catch {
      return API_BASE.replace(/^https?:\/\//, "").slice(0, 28);
    }
  }

  /* ---------------- revelado al hacer scroll ---------------- */

  const revealObserver = new IntersectionObserver((items) => {
    items.forEach((item) => {
      if (!item.isIntersecting) return;
      item.target.classList.add("is-in");
      revealObserver.unobserve(item.target);
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });

  const entryObserver = new IntersectionObserver((items) => {
    items.forEach((item) => {
      if (!item.isIntersecting) return;
      item.target.classList.add("is-in");
      entryObserver.unobserve(item.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

  const wordObserver = new IntersectionObserver((items) => {
    items.forEach((item) => {
      if (!item.isIntersecting) return;
      item.target.classList.add("is-in");
      wordObserver.unobserve(item.target);
    });
  }, { threshold: 0.25 });

  function splitStatement() {
    if (!els.statement) return;
    const walker = document.createTreeWalker(els.statement, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    let index = 0;
    nodes.forEach((node) => {
      const text = node.nodeValue;
      if (!text || !text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(" "));
          return;
        }
        const word = el("span", "word", part);
        word.style.setProperty("--w", index++);
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    wordObserver.observe(els.statement);
  }

  /* ---------------- métricas ---------------- */

  function setupStatsObserver() {
    if (!els.statsGrid) return;
    const observer = new IntersectionObserver((items) => {
      if (!items.some((item) => item.isIntersecting)) return;
      observer.disconnect();
      animateStats();
    }, { threshold: 0.25 });
    observer.observe(els.statsGrid);
  }

  function formatStat(value, kind) {
    if (!Number.isFinite(value)) return "—";
    return kind === "total" ? pad(value) : String(value);
  }

  function countUp(node, target, kind) {
    if (reduceMotion.matches) {
      node.textContent = formatStat(target, kind);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const frame = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = formatStat(Math.round(target * eased), kind);
      if (t < 1) requestAnimationFrame(frame);
      else node.textContent = formatStat(target, kind);
    };
    requestAnimationFrame(frame);
  }

  function animateStats() {
    state.statsDone = true;
    $$(".stat-value").forEach((node, index) => {
      const stat = node.closest(".stat");
      const target = Number(stat && stat.dataset.value);
      if (!Number.isFinite(target)) return;
      if (reduceMotion.matches) {
        node.textContent = formatStat(target, node.dataset.stat);
        return;
      }
      window.setTimeout(() => countUp(node, target, node.dataset.stat), index * 110);
    });
  }

  function updateStats(data) {
    const years = data.map((item) => item.anio).filter(Number.isFinite);
    const oldest = years.length ? Math.min(...years) : NaN;
    const newest = years.length ? Math.max(...years) : NaN;
    const values = {
      total: data.length,
      oldest,
      newest,
      span: Number.isFinite(oldest) && Number.isFinite(newest) ? newest - oldest : NaN
    };
    $$(".stat-value").forEach((node) => {
      const stat = node.closest(".stat");
      const value = values[node.dataset.stat];
      if (stat) stat.dataset.value = value;
      if (state.statsDone) node.textContent = formatStat(value, node.dataset.stat);
    });
  }

  /* ---------------- datos ---------------- */

  function noteFor(item) {
    const key = item.nombre.toLowerCase().replace(/\s+/g, " ").trim();
    return NOTES[key] || `Entrada catalogada como ${item.tipo.toLowerCase()}. Registro cronológico del año ${item.anio}.`;
  }

  function renderTicker(items) {
    if (!els.tickerTrack) return;
    els.tickerTrack.textContent = "";
    for (let groupIndex = 0; groupIndex < 2; groupIndex += 1) {
      const group = el("div", "ticker-group");
      items.forEach((text) => {
        group.appendChild(el("span", "ticker-item", text));
        group.appendChild(el("span", "ticker-sep", "✳"));
      });
      els.tickerTrack.appendChild(group);
    }
  }

  function buildEntry(item, index, total) {
    const num = pad(index + 1);
    const accent = index % 2 === 0 ? "var(--acid)" : "var(--flare)";
    const tilt = index % 2 === 0 ? "-1.1deg" : "1.1deg";

    const entry = el("article", "entry");
    entry.style.setProperty("--i", index);
    entry.style.setProperty("--accent", accent);
    entry.style.setProperty("--tilt", tilt);

    const card = el("div", "entry-card");
    card.dataset.index = num;

    const top = el("div", "entry-top");
    const numEl = el("span", "entry-num", num);
    numEl.appendChild(el("span", null, `/${pad(total)}`));
    top.append(
      numEl,
      el("span", "entry-decade", `DÉC. ${Math.floor(item.anio / 10) * 10}`),
      el("span", "entry-flag", "ORDEN CRONOLÓGICO")
    );

    const main = el("div", "entry-main");
    const yearBlock = el("div", "entry-year-block");
    const year = el("div", "entry-year", String(item.anio));
    year.setAttribute("aria-hidden", "true");
    yearBlock.append(year, el("span", "entry-year-label", "AÑO DE REGISTRO"));

    const copy = el("div", "entry-copy");
    const name = el("h3", "entry-name", item.nombre);
    name.id = `entry-title-${index}`;
    copy.appendChild(name);
    copy.appendChild(el("p", "entry-note", noteFor(item)));

    const stamp = el("div", "entry-stamp");
    stamp.append(el("span", "stamp-label", "TIPO"), el("span", "stamp-value", item.tipo));
    copy.appendChild(stamp);

    const tags = el("ul", "entry-tags");
    [
      `DÉC. ${Math.floor(item.anio / 10) * 10}`,
      `AÑO ${item.anio}`,
      state.demo ? "DATOS LOCALES" : "API / POSTGRES"
    ].forEach((text, tagIndex) => {
      tags.appendChild(el("li", tagIndex === 0 ? "tag tag--fill" : "tag", text));
    });
    copy.appendChild(tags);

    main.append(yearBlock, copy);

    const bottom = el("div", "entry-bottom");
    const barcode = el("span", "barcode");
    barcode.setAttribute("aria-hidden", "true");
    bottom.append(
      barcode,
      el("span", "entry-src", state.demo ? "FUENTE / DEMO LOCAL" : "FUENTE / API.SISTEMAS"),
      el("span", "entry-code", `SO-${item.anio}-${num}`)
    );

    const side = el("span", "entry-side", "ARCHIVO SO / SCROLL");
    side.setAttribute("aria-hidden", "true");

    card.append(top, main, bottom, side);
    entry.appendChild(card);
    entry.setAttribute("aria-labelledby", name.id);
    return entry;
  }

  function renderData(data, { demo = false } = {}) {
    const sorted = data
      .filter((item) => item && typeof item.nombre === "string" && item.nombre.trim())
      .map((item) => ({
        nombre: item.nombre.trim(),
        anio: Number(item.anio),
        tipo: String(item.tipo || "Sin clasificar").trim()
      }))
      .filter((item) => Number.isFinite(item.anio))
      .sort((a, b) => a.anio - b.anio);

    if (!sorted.length) {
      renderError(new Error("La respuesta no contiene registros válidos."));
      return;
    }

    state.data = sorted;
    state.demo = demo;

    const years = sorted.map((item) => item.anio);
    const oldest = Math.min(...years);
    const newest = Math.max(...years);

    if (els.heroRange) els.heroRange.textContent = `${oldest} → ${newest}`;
    if (els.heroCount) els.heroCount.textContent = `${pad(sorted.length)} REGISTROS`;
    if (els.archiveCount) els.archiveCount.textContent = `${pad(sorted.length)} REGISTROS`;
    if (els.heroApi) els.heroApi.textContent = demo ? "DEMO" : apiHost();
    if (els.footerApi) els.footerApi.textContent = demo ? "MODO DEMO · DATOS LOCALES" : (API_BASE || "SIN CONFIGURAR");

    if (els.apiLink) {
      if (API_BASE && !demo) {
        els.apiLink.href = `${API_BASE}/api/sistemas`;
        els.apiLink.hidden = false;
      } else {
        els.apiLink.hidden = true;
      }
    }

    if (els.demoBanner) els.demoBanner.hidden = !demo;
    updateStats(sorted);

    if (els.timeline) {
      els.timeline.setAttribute("aria-busy", "false");
      els.timeline.textContent = "";
      const fragment = document.createDocumentFragment();
      sorted.forEach((item, index) => fragment.appendChild(buildEntry(item, index, sorted.length)));
      els.timeline.appendChild(fragment);
    }

    renderTicker(sorted.map((item) => `${item.nombre} ${item.anio}`));

    entries = $$(".entry");
    entries.forEach((entry) => entryObserver.observe(entry));

    setStatus(demo ? "demo" : "ok", demo ? "MODO DEMO" : "EN LÍNEA");
    setEstado(
      demo ? "demo" : "ok",
      demo
        ? `MODO DEMO · ${sorted.length} REGISTROS LOCALES`
        : `ENLACE ESTABLECIDO · ${sorted.length} REGISTROS · ORDEN CRONOLÓGICO`
    );

    updateScrollEffects();
  }

  function renderLoading() {
    setStatus("loading", "CONECTANDO");
    setEstado("loading", `CONECTANDO CON ${API_BASE || "LA API"}…`);
    if (els.archiveCount) els.archiveCount.textContent = "— REGISTROS";
    if (els.demoBanner) els.demoBanner.hidden = true;
    if (els.timeline) {
      els.timeline.setAttribute("aria-busy", "true");
      els.timeline.textContent = "";
      for (let i = 0; i < 3; i += 1) {
        const skeleton = el("div", "skeleton");
        skeleton.setAttribute("aria-hidden", "true");
        els.timeline.appendChild(skeleton);
      }
    }
    entries = [];
  }

  function renderError(error) {
    state.data = [];
    state.demo = false;
    entries = [];
    if (els.demoBanner) els.demoBanner.hidden = true;
    if (els.archiveCount) els.archiveCount.textContent = "— REGISTROS";
    if (els.heroApi) els.heroApi.textContent = API_BASE ? apiHost() : "SIN CONFIG";
    if (els.footerApi) els.footerApi.textContent = API_BASE || "SIN CONFIGURAR";
    if (els.apiLink) {
      if (API_BASE) {
        els.apiLink.href = `${API_BASE}/api/sistemas`;
        els.apiLink.hidden = false;
      } else {
        els.apiLink.hidden = true;
      }
    }
    setStatus("error", "SIN ENLACE");
    setEstado("error", "SIN ENLACE · REVISA EL BACKEND Y CORS");

    const message = error && error.name === "AbortError"
      ? "La solicitud tardó más de 9 segundos y se canceló."
      : (error && error.message) || "Error desconocido.";

    if (els.timeline) {
      els.timeline.setAttribute("aria-busy", "false");
      els.timeline.textContent = "";
      const panel = el("div", "error-panel");

      const code = el("span", "error-code", "ERR / SIN ENLACE");
      const title = el("h3", "error-title", "LA API NO CONTESTÓ");
      const msg = el("p", "error-msg");
      msg.textContent = `${API_BASE ? `No se pudo leer ${API_BASE}/api/sistemas` : "Falta definir API_URL en config.js"} · ${message}`;

      const list = el("ul", "error-list");
      [
        `Backend: ${API_BASE || "define API_URL en frontend/config.js"}`,
        `CORS: ORIGEN_PERMITIDO debe incluir ${window.location.origin}`,
        "Detalle: abre F12 → Console / Network"
      ].forEach((text) => list.appendChild(el("li", null, text)));

      const actions = el("div", "error-actions");
      const retry = el("button", "btn", "Reintentar ↻");
      retry.type = "button";
      retry.addEventListener("click", () => loadData());
      const demo = el("button", "btn btn--ghost", "Cargar demo");
      demo.type = "button";
      demo.addEventListener("click", () => loadData({ demo: true }));

      actions.append(retry, demo);
      panel.append(code, title, msg, list, actions);
      els.timeline.appendChild(panel);
    }
  }

  async function loadData({ demo = false } = {}) {
    if (demo) {
      renderData(DEMO_DATA.map((item) => ({ ...item })), { demo: true });
      return;
    }

    if (!API_BASE) {
      renderError(new Error("API_URL está vacío."));
      return;
    }

    renderLoading();
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);

    try {
      const response = await fetch(`${API_BASE}/api/sistemas`, {
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload)) throw new Error("La API no devolvió una lista.");
      renderData(payload, { demo: false });
    } catch (error) {
      renderError(error);
    } finally {
      window.clearTimeout(timer);
    }
  }

  /* ---------------- estado y cabecera ---------------- */

  function setStatus(kind, text) {
    if (els.status) els.status.dataset.state = kind;
    if (els.statusText) els.statusText.textContent = text;
  }

  function setEstado(kind, text) {
    if (!els.estado) return;
    els.estado.dataset.state = kind;
    els.estado.textContent = text;
  }

  function updateClock() {
    if (!els.clock) return;
    els.clock.textContent = new Date().toLocaleTimeString("es-CO", { hour12: false });
  }

  /* ---------------- efectos de scroll y puntero ---------------- */

  function updateScrollEffects() {
    scrollTicking = false;
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    if (els.progressBar) els.progressBar.style.transform = `scaleX(${progress})`;

    if (reduceMotion.matches || window.innerWidth <= 860) return;
    const viewport = window.innerHeight;
    entries.forEach((entry) => {
      const rect = entry.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > viewport + 120) return;
      const center = (rect.top + rect.height / 2 - viewport / 2) / viewport;
      entry.style.setProperty("--year-y", `${(-center * 20).toFixed(1)}px`);
    });
  }

  function requestScrollUpdate() {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(updateScrollEffects);
  }

  function bindHeroParallax() {
    const hero = $(".hero");
    if (!hero) return;
    const reset = () => {
      hero.style.setProperty("--rx", "4deg");
      hero.style.setProperty("--ry", "-4deg");
      hero.style.setProperty("--mx", "0px");
      hero.style.setProperty("--my", "0px");
    };
    hero.addEventListener("pointermove", (event) => {
      if (reduceMotion.matches || event.pointerType === "touch") return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--rx", `${(4 - y * 5).toFixed(2)}deg`);
      hero.style.setProperty("--ry", `${(x * 7 - 4).toFixed(2)}deg`);
      hero.style.setProperty("--mx", `${(x * 16).toFixed(1)}px`);
      hero.style.setProperty("--my", `${(y * 16).toFixed(1)}px`);
    });
    hero.addEventListener("pointerleave", reset);
    reset();
  }

  /* ---------------- arranque ---------------- */

  function init() {
    updateClock();
    window.setInterval(updateClock, 1000);

    bindHeroParallax();
    splitStatement();
    $$(".reveal").forEach((node) => revealObserver.observe(node));
    setupStatsObserver();
    renderTicker(DEFAULT_TICKER);

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate);
    updateScrollEffects();

    const params = new URLSearchParams(window.location.search);
    loadData({ demo: params.get("demo") === "1" });
  }

  init();
})();
