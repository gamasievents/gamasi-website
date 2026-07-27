(() => {
  const STORAGE_KEY = "gamasi_cookie_consent_v1";

  function getStoredConsent() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.preferences) return null;
      return parsed;
    } catch (error) {
      return null;
    }
  }

  function saveConsent(preferences) {
    const payload = {
      preferences: {
        necessary: true,
        analytics: !!preferences.analytics,
        marketing: !!preferences.marketing,
      },
      updatedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  function canRunCategory(category, preferences) {
    if (category === "necessary") return true;
    if (category === "analytics") return !!preferences.analytics;
    if (category === "marketing") return !!preferences.marketing;
    return false;
  }

  function activateBlockedScripts(preferences) {
    const blocked = document.querySelectorAll("script[type='text/plain'][data-cookie-category]");

    blocked.forEach((node) => {
      if (node.dataset.cookieExecuted === "true") return;

      const category = node.dataset.cookieCategory;
      if (!canRunCategory(category, preferences)) return;

      const script = document.createElement("script");
      if (node.dataset.cookieSrc) {
        script.src = node.dataset.cookieSrc;
        script.async = true;
      } else {
        script.textContent = node.textContent;
      }

      node.dataset.cookieExecuted = "true";
      node.parentNode.insertBefore(script, node.nextSibling);
    });
  }

  function buildBanner() {
    const wrap = document.createElement("div");
    wrap.className = "cookie-banner";
    wrap.innerHTML =
      '<div class="cookie-banner__content">' +
      '<button type="button" class="cookie-banner__close" data-cookie-action="close" aria-label="Chiudi banner cookie">&times;</button>' +
      '<p class="cookie-banner__title">Gestione cookie</p>' +
      '<p class="cookie-banner__text">Usiamo cookie tecnici necessari e, con il tuo consenso, cookie di analytics/marketing (Google e Meta) per misurare campagne e migliorare il servizio.</p>' +
      '<p class="cookie-banner__links"><a href="privacy-policy.html">Privacy Policy</a> · <a href="cookie-policy.html">Cookie Policy</a></p>' +
      '<div class="cookie-banner__prefs">' +
      '<label><input type="checkbox" checked disabled /> Tecnici necessari (sempre attivi)</label>' +
      '<label><input type="checkbox" id="cookie-analytics" /> Analytics</label>' +
      '<label><input type="checkbox" id="cookie-marketing" /> Marketing</label>' +
      "</div>" +
      '<div class="cookie-banner__actions">' +
      '<button type="button" class="btn btn-secondary" data-cookie-action="reject">Rifiuta</button>' +
      '<button type="button" class="btn btn-secondary" data-cookie-action="save">Salva preferenze</button>' +
      '<button type="button" class="btn btn-primary" data-cookie-action="accept">Accetta tutti</button>' +
      "</div>" +
      "</div>";

    return wrap;
  }

  function ensurePreferencesButton(onClick) {
    let button = document.querySelector(".cookie-manage-btn");
    if (button) {
      button.onclick = onClick;
      return;
    }

    button = document.createElement("button");
    button.type = "button";
    button.className = "cookie-manage-btn";
    button.textContent = "Cookie";
    button.onclick = onClick;
    document.body.appendChild(button);
  }

  function init() {
    const stored = getStoredConsent();
    if (stored) {
      activateBlockedScripts(stored.preferences);
      ensurePreferencesButton(openBanner);
      return;
    }

    openBanner();
  }

  function openBanner() {
    let banner = document.querySelector(".cookie-banner");
    if (!banner) {
      banner = buildBanner();
      document.body.appendChild(banner);
    }

    const analyticsInput = banner.querySelector("#cookie-analytics");
    const marketingInput = banner.querySelector("#cookie-marketing");
    const stored = getStoredConsent();

    analyticsInput.checked = !!(stored && stored.preferences.analytics);
    marketingInput.checked = !!(stored && stored.preferences.marketing);

    banner.classList.add("is-visible");
    ensurePreferencesButton(openBanner);

    banner.querySelector("[data-cookie-action='reject']").onclick = () => {
      const consent = saveConsent({ analytics: false, marketing: false });
      banner.classList.remove("is-visible");
      activateBlockedScripts(consent.preferences);
    };

    banner.querySelector("[data-cookie-action='close']").onclick = () => {
      const consent = saveConsent({ analytics: false, marketing: false });
      banner.classList.remove("is-visible");
      activateBlockedScripts(consent.preferences);
    };

    banner.querySelector("[data-cookie-action='accept']").onclick = () => {
      const consent = saveConsent({ analytics: true, marketing: true });
      banner.classList.remove("is-visible");
      activateBlockedScripts(consent.preferences);
    };

    banner.querySelector("[data-cookie-action='save']").onclick = () => {
      const consent = saveConsent({
        analytics: analyticsInput.checked,
        marketing: marketingInput.checked,
      });

      banner.classList.remove("is-visible");
      activateBlockedScripts(consent.preferences);
    };
  }

  document.addEventListener("DOMContentLoaded", init);
})();
