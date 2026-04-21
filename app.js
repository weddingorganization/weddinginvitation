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

  const HY_WEEKDAYS = [
    "Կիրակի",
    "Երկուշաբթի",
    "Երեքշաբթի",
    "Չորեքշաբթի",
    "Հինգշաբթի",
    "Ուրբաթ",
    "Շաբաթ",
  ];

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

  function formatWeddingDateHy(d) {
    const weekday = HY_WEEKDAYS[d.getDay()];
    const day = d.getDate();
    const month = HY_MONTHS_GEN[d.getMonth()];
    const year = d.getFullYear();
    return `${weekday}, ${day} ${month}, ${year} թ.`;
  }

  function formatShortDateHy(d) {
    const day = d.getDate();
    const month = HY_MONTHS_GEN[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month}, ${year} թ.`;
  }

  function formatWeddingDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const loc = String(cfg.locale || "hy-AM").toLowerCase();
    if (loc.startsWith("hy")) {
      return formatWeddingDateHy(d);
    }
    return new Intl.DateTimeFormat(cfg.locale || "hy-AM", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  }

  function guestParam() {
    const p = new URLSearchParams(window.location.search);
    return p.get("g") || p.get("guest") || p.get("guest_id");
  }

  function greetingForGuest(name) {
    const template = cfg.guestGreetingTemplate || "Հարգելի {name},";
    const fallback = cfg.defaultGuestGreeting || "Հարգելի բարեկամ,";
    if (!name) return fallback;
    return template.replace("{name}", name);
  }

  async function loadGuestMap() {
    try {
      const res = await fetch("data/guests.json", { cache: "no-store" });
      if (!res.ok) throw new Error("guest list unavailable");
      return await res.json();
    } catch {
      return null;
    }
  }

  async function resolveGuestGreeting() {
    const el = qs("guest-greeting");
    if (!el) return;

    const param = guestParam();
    if (!param) {
      el.textContent = greetingForGuest(null);
      return;
    }

    const map = await loadGuestMap();
    if (!map) {
      el.textContent = greetingForGuest(null);
      return;
    }

    const key = Object.prototype.hasOwnProperty.call(map, param) ? param : null;
    const displayName = key ? map[key] : null;
    el.textContent = greetingForGuest(displayName);
  }

  function applyChrome() {
    const s = cfg.strings || {};
    if (cfg.locale && String(cfg.locale).toLowerCase().startsWith("hy")) {
      document.documentElement.lang = "hy";
    }
    const skip = qs("skip-link");
    if (skip) skip.textContent = s.skipToContent || "";

    const logoLink = qs("logo-link");
    const logoImg = qs("logo-img");
    if (logoLink) {
      logoLink.setAttribute("aria-label", s.monogramAria || "");
    }
    if (logoImg) {
      logoImg.alt = cfg.coupleLine || "";
    }

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
    return `${escapeHtml(parts[0].trim())}<br /><span class="hero__and">և</span><br />${escapeHtml(
      parts[1].trim()
    )}`;
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
    const sub = qs("hero-subline");
    if (sub) {
      const st = (cfg.heroSubline || "").trim();
      sub.textContent = st;
      sub.classList.toggle("hidden", !st);
    }
    const heroDateEl = qs("hero-date");
    if (heroDateEl) {
      const line = (cfg.heroDateLine || "").trim();
      heroDateEl.textContent = line || formatWeddingDate(cfg.weddingDateISO);
    }

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

    qs("welcome-reception-title").textContent = cfg.reception.title;
    const wRecIntro = qs("welcome-reception-intro");
    if (wRecIntro) wRecIntro.textContent = cfg.reception.intro || "";
    setTextOrHide(qs("welcome-reception-time"), cfg.reception.time);

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
      li.innerHTML = `${escapeHtml(c.label)}: <a href="${tel}">${escapeHtml(
        c.phone || ""
      )}</a>`;
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
    if (api) {
      return [str.rsvpSendError || "", api].filter(Boolean).join(" ");
    }
    return str.rsvpSendError || "";
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
