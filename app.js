(function () {
  const cfg = window.WEDDING_CONFIG;
  if (!cfg) return;

  if (cfg.backgroundImage) {
    document.documentElement.style.setProperty(
      "--invite-bg-image",
      `url("${cfg.backgroundImage}")`
    );
  }

  function qs(id) {
    return document.getElementById(id);
  }

  const HY_MONTHS_GEN = [
    "հունվարի",
    "փետրվարի",
    "մարտի",
    "ապրիլի",
    "մայիսի",
    "հունիսի",
    "հուլիսի",
    "օգոստոսի",
    "սեպտեմբերի",
    "հոկտեմբերի",
    "նոյեմբերի",
    "դեկտեմբերի",
  ];

  function formatShortDateHy(d) {
    const day = d.getDate();
    const month = HY_MONTHS_GEN[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month}, ${year} թ.`;
  }

  function guestParam() {
    const p = new URLSearchParams(window.location.search);
    const raw = p.get("g") || p.get("guest") || p.get("guest_id");
    if (raw == null || raw === "") return null;
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return String(raw).trim();
    }
  }

  function greetingForGuest(name) {
    const template = cfg.guestGreetingTemplate || "Հարգելի {name},";
    const fallback = cfg.defaultGuestGreeting || "Հարգելի բարեկամ,";
    if (!name) return fallback;
    return template.replace("{name}", name);
  }

  function displayNameFromGuestEntry(entry) {
    if (entry == null) return null;
    if (typeof entry === "string") {
      const t = entry.trim();
      return t || null;
    }
    if (typeof entry === "object") {
      const n =
        entry.name ||
        entry.displayName ||
        entry.display ||
        entry.fullName ||
        "";
      const t = String(n).trim();
      return t || null;
    }
    return null;
  }

  function parseCsvToMatrix(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    const s = String(text).replace(/^\uFEFF/, "");
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQuotes) {
        if (c === '"') {
          if (s[i + 1] === '"') {
            field += '"';
            i++;
            continue;
          }
          inQuotes = false;
          continue;
        }
        field += c;
        continue;
      }
      if (c === '"') {
        inQuotes = true;
        continue;
      }
      if (c === ",") {
        row.push(field);
        field = "";
        continue;
      }
      if (c === "\n" || c === "\r") {
        if (c === "\r" && s[i + 1] === "\n") i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
        continue;
      }
      field += c;
    }
    row.push(field);
    if (row.some((cell) => String(cell).length)) rows.push(row);
    return rows;
  }

  function guestsMapFromCsvText(text) {
    const matrix = parseCsvToMatrix(text);
    if (!matrix.length) return null;
    const headers = matrix[0].map((h) =>
      String(h || "")
        .trim()
        .toLowerCase()
    );
    const idIdx = headers.findIndex((h) =>
      [
        "id",
        "guest_id",
        "slug",
        "key",
        "code",
        "կոդ",
        "ծածկանուն",
      ].includes(h)
    );
    const nameIdx = headers.findIndex((h) =>
      [
        "name",
        "display_name",
        "displayname",
        "full_name",
        "fullname",
        "guest",
        "անուն",
      ].includes(h)
    );
    let headerRow = 1;
    let useId = idIdx;
    let useName = nameIdx;
    if (idIdx < 0 || nameIdx < 0) {
      if (matrix[0].length < 2) return null;
      useId = 0;
      useName = 1;
      headerRow = 0;
    } else if (matrix.length < 2) {
      return null;
    }
    const noteIdx =
      headerRow === 1
        ? headers.findIndex((h) =>
            ["note", "notes", "info", "comment", "նշում"].includes(h)
          )
        : -1;
    const out = {};
    for (let r = headerRow; r < matrix.length; r++) {
      const cells = matrix[r];
      const id = String(cells[useId] ?? "").trim();
      if (!id) continue;
      const name = String(cells[useName] ?? "").trim();
      const noteRaw =
        noteIdx >= 0 ? String(cells[noteIdx] ?? "").trim() : "";
      if (noteRaw) {
        out[id] = { name, note: noteRaw };
      } else if (name) {
        out[id] = name;
      }
    }
    return Object.keys(out).length ? out : null;
  }

  async function loadGuestMap() {
    const jsonUrl = String(cfg.guestListJsonUrl || "").trim();
    const csvUrl = String(cfg.guestListCsvUrl || "").trim();
    const fallback = String(
      cfg.guestListFallbackPath || "data/guests.json"
    ).trim();

    const fetchJsonObject = async (url) => {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || typeof data !== "object" || Array.isArray(data)) return null;
      return data;
    };

    const looksLikeHtml = (t) =>
      /^\s*</.test(t) || /<!doctype\s+html/i.test(t);

    const fetchCsvMap = async (url) => {
      const tryParse = (text) => {
        if (!text || looksLikeHtml(text)) return null;
        let m = guestsMapFromCsvText(text);
        if (m) return m;
        if (text.includes(";") && !text.includes(",")) {
          const alt = text.split(/\r?\n/).map((line) => line.split(";"));
          if (alt.length >= 2) {
            m = guestsMapFromCsvText(
              alt.map((row) => row.join(",")).join("\n")
            );
          }
        }
        return m;
      };

      const proxyTpl = String(cfg.guestListCsvProxy || "").trim();
      const urlsToTry = [url];
      if (proxyTpl) {
        urlsToTry.push(
          proxyTpl.includes("{url}")
            ? proxyTpl.replace("{url}", encodeURIComponent(url))
            : proxyTpl + encodeURIComponent(url)
        );
      }

      for (const u of urlsToTry) {
        try {
          const res = await fetch(u, { cache: "no-store" });
          if (!res.ok) continue;
          const text = await res.text();
          const m = tryParse(text);
          if (m) return m;
        } catch {
          /* next */
        }
      }
      return null;
    };

    try {
      if (jsonUrl) {
        const m = await fetchJsonObject(jsonUrl);
        if (m && Object.keys(m).length > 0) return m;
      }
      if (csvUrl) {
        const m = await fetchCsvMap(csvUrl);
        if (m && Object.keys(m).length > 0) return m;
      }
      if (fallback) {
        const m = await fetchJsonObject(fallback);
        if (m) return m;
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  async function resolveGuestGreeting() {
    const el = qs("guest-greeting");
    if (!el) return;

    const param = guestParam();
    el.textContent = greetingForGuest(null);

    if (!param) return;

    const map = await loadGuestMap();
    if (!map) {
      el.textContent = greetingForGuest(null);
      return;
    }

    const key = Object.prototype.hasOwnProperty.call(map, param) ? param : null;
    const rawEntry = key ? map[key] : null;
    const displayName = displayNameFromGuestEntry(rawEntry);
    el.textContent = greetingForGuest(displayName);
  }

  function applyChrome() {
    const s = cfg.strings || {};
    if (cfg.locale && String(cfg.locale).toLowerCase().startsWith("hy")) {
      document.documentElement.lang = "hy";
    }
    const skip = qs("skip-link");
    if (skip) skip.textContent = s.skipToContent || "";

    const nav = qs("site-nav");
    if (nav) {
      nav.setAttribute("aria-label", s.navAria || "");
      nav.innerHTML = `
        <a href="#welcome">${escapeHtml(s.navWelcome || "")}</a>
        <a href="#when-where">${escapeHtml(s.navDetails || "")}</a>
        <a href="#maps">${escapeHtml(s.navMaps || "")}</a>
      `;
    }

    const cd = qs("countdown");
    if (cd) cd.setAttribute("aria-label", s.countdownAria || "");

    const ld = qs("cd-l-day");
    const lh = qs("cd-l-hour");
    const lm = qs("cd-l-minute");
    const ls = qs("cd-l-second");
    if (ld) ld.textContent = s.countdownDay || "";
    if (lh) lh.textContent = s.countdownHour || "";
    if (lm) lm.textContent = s.countdownMinute || "";
    if (ls) ls.textContent = s.countdownSecond || "";

    const done = qs("countdown-done");
    if (done) done.textContent = s.countdownDone || "";

    const wwt = qs("welcome-whenwhere-title");
    const td = qs("title-directions");
    const ts = qs("special-day-title");
    const whenWhere = s.sectionWhenWhere || "";
    if (wwt) wwt.textContent = whenWhere;
    if (td) td.textContent = s.sectionDirections || "";
    if (ts) ts.textContent = s.rsvpFormLead || "";

    const fq = qs("footer-questions");
    if (fq) fq.textContent = s.footerQuestions || "";

    const m1 = qs("map-church");
    const m2 = qs("map-reception");
    if (m1) m1.setAttribute("aria-label", s.mapChurchAria || "");
    if (m2) m2.setAttribute("aria-label", s.mapReceptionAria || "");
  }

  function setAddress(el, lines) {
    if (!el) return;
    const list = lines || [];
    if (!list.length) {
      el.innerHTML = "";
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    el.innerHTML = list
      .map((line) => `<span class="addr-line">${escapeHtml(line)}</span>`)
      .join("<br />");
  }

  function setTextOrHide(el, text) {
    if (!el) return;
    const t = (text || "").trim();
    if (!t) {
      el.textContent = "";
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    el.textContent = t;
  }

  function formatCoupleTitleHtml(line) {
    const raw = String(line || "").trim();
    const parts = raw.split(" և ");
    if (parts.length !== 2) {
      return escapeHtml(raw);
    }
    return `<span class="hero__couple-part">${escapeHtml(
      parts[0].trim()
    )}</span><span class="hero__couple-joiner">և</span><span class="hero__couple-part">${escapeHtml(
      parts[1].trim()
    )}</span>`;
  }

  function applyContent() {
    applyChrome();
    document.title = cfg.pageTitle || cfg.coupleLine;
    const kick = qs("hero-eyebrow");
    if (kick) {
      const kt = (cfg.tagline || "").trim();
      kick.textContent = kt;
      kick.classList.toggle("hidden", !kt);
    }
    const heroTitle = qs("hero-title");
    if (heroTitle) heroTitle.innerHTML = formatCoupleTitleHtml(cfg.coupleLine);

    const d = new Date(cfg.weddingDateISO);
    const wDate = qs("welcome-date-line");
    if (wDate && !Number.isNaN(d.getTime())) {
      wDate.textContent = formatShortDateHy(d);
    }
    const wInvite = qs("welcome-invite-line");
    if (wInvite) wInvite.textContent = cfg.welcomeInviteLine || "";

    qs("welcome-church-title").textContent = cfg.church.title;
    const wChIntro = qs("welcome-church-intro");
    if (wChIntro) wChIntro.textContent = cfg.church.intro || "";
    setTextOrHide(qs("welcome-church-time"), cfg.church.time);
    setAddress(qs("welcome-church-address"), cfg.church.addressLines);

    qs("welcome-reception-title").textContent = cfg.reception.title;
    const wRecIntro = qs("welcome-reception-intro");
    if (wRecIntro) wRecIntro.textContent = cfg.reception.intro || "";
    setTextOrHide(qs("welcome-reception-time"), cfg.reception.time);
    setAddress(qs("welcome-reception-address"), cfg.reception.addressLines);

    const sf = cfg.strings || {};
    const ln = qs("label-full-name");
    if (ln) ln.textContent = sf.rsvpFullName || "";
    const ly = qs("label-attend-yes");
    if (ly) ly.textContent = sf.rsvpAttendYes || "";
    const lno = qs("label-attend-no");
    if (lno) lno.textContent = sf.rsvpAttendNo || "";
    const lg = qs("label-guest-count");
    if (lg) lg.textContent = sf.rsvpGuestCount || "";
    const lc = qs("label-comment");
    if (lc) lc.textContent = sf.rsvpComment || "";
    const subBtn = qs("rsvp-form-submit");
    if (subBtn) subBtn.textContent = sf.rsvpSubmit || "";
    const afs = qs("rsvp-attendance-fieldset");
    if (afs) afs.setAttribute("aria-label", sf.rsvpAttendanceAria || "");

    qs("map-church-heading").textContent = cfg.church.mapLabel || cfg.church.name;
    qs("map-reception-heading").textContent =
      cfg.reception.mapLabel || cfg.reception.name;

    const s = sf;
    const churchExt = (cfg.church.mapsAppUrl || "").trim();
    const recExt = (cfg.reception.mapsAppUrl || "").trim();
    const churchWrap = qs("map-church-external-wrap");
    const churchLink = qs("map-church-external");
    if (churchWrap && churchLink) {
      if (churchExt) {
        churchWrap.classList.remove("hidden");
        churchLink.href = churchExt;
        churchLink.textContent = s.mapOpenExternal || "";
      } else {
        churchWrap.classList.add("hidden");
      }
    }
    const recWrap = qs("map-reception-external-wrap");
    const recLink = qs("map-reception-external");
    if (recWrap && recLink) {
      if (recExt) {
        recWrap.classList.remove("hidden");
        recLink.href = recExt;
        recLink.textContent = s.mapOpenExternal || "";
      } else {
        recWrap.classList.add("hidden");
      }
    }

    qs("closing-line").textContent = cfg.closingLine || "";

    const rsvpText = qs("rsvp-intro");
    if (rsvpText) rsvpText.textContent = cfg.rsvpIntro || "";
    const rsvpWrap = qs("rsvp-email-wrap");
    const rsvpLink = qs("rsvp-email-link");
    const em = (cfg.rsvpEmail || "").trim();
    if (rsvpWrap && rsvpLink) {
      if (em) {
        rsvpWrap.classList.remove("hidden");
        rsvpLink.href = `mailto:${em}`;
        rsvpLink.textContent = em;
      } else {
        rsvpWrap.classList.add("hidden");
      }
    }

    const contact = qs("contact-list");
    contact.innerHTML = "";
    (cfg.contact || []).forEach((c) => {
      const li = document.createElement("li");
      const phone = (c.phone || "").replace(/\s+/g, "");
      const tel = phone ? `tel:${phone}` : "#";
      li.innerHTML = `<span class="contact-list__label">${escapeHtml(
        c.label
      )}</span><span class="contact-list__phone"><a href="${tel}">${escapeHtml(
        c.phone || ""
      )}</a></span>`;
      contact.appendChild(li);
    });

    const y = new Date().getFullYear();
    qs("footer-year").textContent = `${cfg.coupleLine} · ${y}`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function rsvpEmailPlainLine(label, value) {
    return `${String(label || "").trim()}: ${String(value ?? "").trim()}`;
  }

  function rsvpEmailSanitizeMultiline(s) {
    return String(s || "")
      .replace(/\r\n|\r|\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildRsvpEmailBody(str, attendYes, name, guestCount, comment) {
    const attendance = attendYes
      ? `\u2713 ${str.rsvpAttendYes || ""}`
      : `\u2715 ${str.rsvpAttendNo || ""}`;
    const commentOut = rsvpEmailSanitizeMultiline(comment);
    return [
      rsvpEmailPlainLine(str.rsvpFullName, rsvpEmailSanitizeMultiline(name)),
      attendance,
      rsvpEmailPlainLine(str.rsvpGuestCount, String(guestCount)),
      rsvpEmailPlainLine(str.rsvpComment, commentOut || "—"),
    ].join("\n\n");
  }

  function googleMapsEmbedSrc(venue) {
    const custom = (venue.googleMapsEmbedUrl || "").trim();
    if (custom) return custom;

    const key = (cfg.googleMapsApiKey || "").trim();
    const query = (venue.mapSearchQuery || "").trim();
    const q =
      query ||
      (typeof venue.lat === "number" && typeof venue.lng === "number"
        ? `${venue.lat},${venue.lng}`
        : venue.name || "");

    if (key) {
      const params = new URLSearchParams({
        key,
        q,
        zoom: "15",
        maptype: "roadmap",
      });
      const loc = cfg.locale || "";
      if (String(loc).toLowerCase().startsWith("hy")) {
        params.set("language", "hy");
      }
      return `https://www.google.com/maps/embed/v1/place?${params.toString()}`;
    }

    const ll =
      typeof venue.lat === "number" && typeof venue.lng === "number"
        ? `${venue.lat},${venue.lng}`
        : q;
    return `https://maps.google.com/maps?hl=hy&q=${encodeURIComponent(ll)}&z=15&output=embed`;
  }

  function initMaps() {
    const church = cfg.church;
    const reception = cfg.reception;
    const ic = qs("iframe-church");
    const ir = qs("iframe-reception");
    if (ic) {
      ic.src = googleMapsEmbedSrc(church);
      ic.title = church.name || "";
    }
    if (ir) {
      ir.src = googleMapsEmbedSrc(reception);
      ir.title = reception.name || "";
    }
  }

  function initCountdown() {
    const target = new Date(cfg.weddingDateISO).getTime();
    const box = qs("countdown");
    const done = qs("countdown-done");
    const els = {
      d: qs("cd-days"),
      h: qs("cd-hours"),
      m: qs("cd-minutes"),
      s: qs("cd-seconds"),
    };

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) {
        if (box) box.classList.add("hidden");
        if (done) done.classList.remove("hidden");
        return false;
      }
      const s = Math.floor(diff / 1000);
      els.d.textContent = String(Math.floor(s / 86400));
      els.h.textContent = String(Math.floor((s % 86400) / 3600));
      els.m.textContent = String(Math.floor((s % 3600) / 60));
      els.s.textContent = String(s % 60);
      return true;
    }

    if (!tick()) return;
    const id = window.setInterval(() => {
      if (!tick()) window.clearInterval(id);
    }, 1000);
  }

  function initReveal() {
    const nodes = document.querySelectorAll(".reveal");
    if (!nodes.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    nodes.forEach((n) => io.observe(n));
  }

  function showRsvpFormError(message) {
    const err = qs("rsvp-form-error");
    if (!err) return;
    if (!message) {
      err.textContent = "";
      err.classList.add("hidden");
      return;
    }
    err.textContent = message;
    err.classList.remove("hidden");
  }

  function showRsvpFormSuccess() {
    const el = qs("rsvp-form-success");
    const str = cfg.strings || {};
    if (el) {
      el.textContent = str.rsvpSuccess || "";
      el.classList.remove("hidden");
    }
    showRsvpFormError("");
  }

  function hideRsvpFormSuccess() {
    const el = qs("rsvp-form-success");
    if (el) {
      el.textContent = "";
      el.classList.add("hidden");
    }
  }

  function rsvpFailureReason(data) {
    const str = cfg.strings || {};
    const api =
      data && typeof data.message === "string" ? data.message.trim() : "";
    if (window.location.protocol === "file:") {
      return str.rsvpLocalFile || str.rsvpSendError || "";
    }
    if (api && /html files|web server|file:\/\//i.test(api)) {
      return str.rsvpLocalFile || api;
    }
    if (api && /activation|activate form|needs activation/i.test(api)) {
      return str.rsvpFormSubmitActivate || api;
    }
    if (api) {
      return [str.rsvpSendError || "", api].filter(Boolean).join(" ");
    }
    return str.rsvpSendError || "";
  }

  function appendRsvpSheetLog(row) {
    const logUrl = String(cfg.rsvpSheetLogUrl || "").trim();
    if (!logUrl) return;
    const secret = String(cfg.rsvpSheetLogSecret || "").trim();
    const payload = {
      secret,
      name_surname: row.name,
      yes_no: row.attendYes ? "yes" : "no",
      guest_number: String(row.guestCount ?? "0").trim() || "0",
      comment: row.comment || "",
    };
    const body = JSON.stringify(payload);
    fetch(logUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
    }).catch(() => {});
  }

  function initRsvpNoteForm() {
    const form = qs("rsvp-note-form");
    if (!form) return;
    const yes = qs("rsvp-attend-yes");
    const no = qs("rsvp-attend-no");
    const guestEl = qs("rsvp-guest-count");
    if (yes && no) {
      yes.addEventListener("change", () => {
        if (yes.checked) {
          no.checked = false;
          if (guestEl) {
            guestEl.disabled = false;
            if (guestEl.value === "0") guestEl.value = "1";
          }
        }
      });
      no.addEventListener("change", () => {
        if (no.checked) {
          yes.checked = false;
          if (guestEl) {
            guestEl.value = "0";
            guestEl.disabled = true;
          }
        }
      });
    }
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const str = cfg.strings || {};
      hideRsvpFormSuccess();
      showRsvpFormError("");
      const nameEl = qs("rsvp-full-name");
      const name = nameEl ? nameEl.value.trim() : "";
      if (!name) {
        showRsvpFormError(str.rsvpErrorName || "");
        return;
      }
      const attendYes = yes && yes.checked;
      const attendNo = no && no.checked;
      if (!attendYes && !attendNo) {
        showRsvpFormError(str.rsvpErrorAttendance || "");
        return;
      }
      const to = (cfg.rsvpEmail || "").trim();
      if (!to) {
        showRsvpFormError(str.rsvpErrorEmail || "");
        return;
      }
      const guestSelect = qs("rsvp-guest-count");
      const guestCount = attendNo
        ? "0"
        : guestSelect
          ? guestSelect.value
          : "";
      const commentEl = qs("rsvp-comment");
      const comment = commentEl ? commentEl.value.trim() : "";
      const subject = `Հարսանիք · հաստատում · ${cfg.coupleLine || ""}`;
      const message = buildRsvpEmailBody(
        str,
        attendYes,
        name,
        guestCount,
        comment
      );

      const submitBtn = qs("rsvp-form-submit");
      if (submitBtn) submitBtn.disabled = true;

      if (window.location.protocol === "file:") {
        showRsvpFormError(rsvpFailureReason(null));
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      const url = `https://formsubmit.co/ajax/${encodeURIComponent(to)}`;
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          message,
          _subject: subject,
          _template: "table",
        }),
      })
        .then(async (r) => {
          let data = {};
          try {
            data = await r.json();
          } catch {
            /* ignore */
          }
          const ok =
            r.ok &&
            (data.success === true ||
              data.success === "true" ||
              (typeof data.message === "string" &&
                data.message.toLowerCase().includes("success")));
          if (ok) {
            appendRsvpSheetLog({
              name,
              attendYes,
              guestCount,
              comment,
            });
            showRsvpFormSuccess();
            form.reset();
            const gs = qs("rsvp-guest-count");
            if (gs) gs.disabled = false;
          } else {
            showRsvpFormError(rsvpFailureReason(data));
          }
        })
        .catch(() => {
          showRsvpFormError(rsvpFailureReason(null));
        })
        .finally(() => {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }

  applyContent();
  resolveGuestGreeting();
  initCountdown();
  initMaps();
  initRsvpNoteForm();
  initReveal();
})();
