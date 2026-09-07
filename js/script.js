(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------
     Header: pick up a subtle background once scrolled
     ---------------------------------------------------------- */
  var header = document.getElementById("site-header");
  var lastScrolled = null;

  function updateHeader() {
    var scrolled = window.scrollY > 8;
    if (scrolled !== lastScrolled) {
      header.classList.toggle("is-scrolled", scrolled);
      lastScrolled = scrolled;
    }
  }

  if (header) {
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* ----------------------------------------------------------
     Hamburger overlay menu (used on every viewport)
     ---------------------------------------------------------- */
  var toggle = document.getElementById("menu-toggle");
  var overlay = document.getElementById("nav-overlay");

  if (toggle && overlay) {
    var lastFocus = null;

    var openMenu = function () {
      lastFocus = document.activeElement;
      document.body.classList.add("nav-open");
      overlay.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      var firstLink = overlay.querySelector("a");
      if (firstLink) firstLink.focus();
    };

    var closeMenu = function (returnFocus) {
      document.body.classList.remove("nav-open");
      overlay.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      if (returnFocus !== false && lastFocus) lastFocus.focus();
    };

    toggle.addEventListener("click", function () {
      if (overlay.classList.contains("is-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    overlay.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) closeMenu();
    });
  }

  /* ----------------------------------------------------------
     Scroll-triggered reveal animations (GSAP ScrollTrigger)

     Elements marked .reveal fade and rise into view as they enter
     the viewport. ScrollTrigger.batch groups elements that appear
     together and staggers them, replacing the old per-element
     nth-child transition delays.

     Fallback: if GSAP fails to load (e.g. CDN blocked) or the
     visitor prefers reduced motion, every .reveal is shown at once
     via the .is-visible class.
     ---------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  var gsapReady = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (reduceMotion || !gsapReady) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    gsap.registerPlugin(ScrollTrigger);
    gsap.set(revealEls, { opacity: 0, y: 24 });

    ScrollTrigger.batch(".reveal", {
      start: "top 88%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          stagger: 0.09,
          overwrite: true
        });
      }
    });

    // Recalculate trigger positions once late-loading images settle.
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
    });
  }

  /* ----------------------------------------------------------
     Testimonials slider (only runs when the section is enabled)
     ---------------------------------------------------------- */
  var testiSection = document.getElementById("testimonials");

  if (testiSection) {
    var slides = Array.prototype.slice.call(testiSection.querySelectorAll(".testi"));
    var currentEl = testiSection.querySelector("[data-testi-current]");
    var totalEl = testiSection.querySelector("[data-testi-total]");
    var barEl = testiSection.querySelector("[data-testi-bar]");
    var index = 0;

    if (slides.length) {
      var pad = function (n) {
        return (n < 10 ? "0" : "") + n;
      };

      var render = function () {
        slides.forEach(function (slide, i) {
          slide.hidden = i !== index;
        });
        if (currentEl) currentEl.textContent = pad(index + 1);
        if (totalEl) totalEl.textContent = pad(slides.length);
        if (barEl) barEl.parentNode.style.setProperty("--p", (index + 1) / slides.length);
      };

      testiSection.querySelectorAll("[data-testi-dir]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var dir = btn.getAttribute("data-testi-dir") === "next" ? 1 : -1;
          index = (index + dir + slides.length) % slides.length;
          render();
        });
      });

      render();
    }
  }

  /* ----------------------------------------------------------
     Contact form submission
     ---------------------------------------------------------- */
  var contactForm = document.getElementById("contact-form");

  if (contactForm) {
    var CONTACT_WEBHOOK_URL = "https://n8n-production-7a6e1.up.railway.app/webhook/a6bf3c28-2dbd-4050-b81e-164534b8a9df";
    var submitBtn = contactForm.querySelector(".contact-form__submit");
    var errorEl = document.getElementById("contact-form-error");
    var successEl = document.getElementById("contact-success");

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      errorEl.hidden = true;
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");

      var formData = new FormData(contactForm);
      var payload = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        message: String(formData.get("message") || "").trim(),
        source: "website"
      };

      fetch(CONTACT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("Request failed with status " + res.status);
          }
          contactForm.hidden = true;
          successEl.hidden = false;
        })
        .catch(function () {
          errorEl.textContent = "Something went wrong sending your message. Please try again, or email us directly.";
          errorEl.hidden = false;
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
        });
    });
  }

  /* ----------------------------------------------------------
     Cookie consent + gated video embeds
     Loom iframes are not loaded until the visitor accepts.
     Until then, each embed shows a "Click to load video"
     placeholder. The choice is remembered in localStorage.
     ---------------------------------------------------------- */
  var CONSENT_KEY = "avora-cookie-consent";
  var cookieBar = document.getElementById("cookie-bar");

  var readConsent = function () {
    try {
      return window.localStorage.getItem(CONSENT_KEY) === "accepted";
    } catch (e) {
      return false;
    }
  };

  var storeConsent = function () {
    try {
      window.localStorage.setItem(CONSENT_KEY, "accepted");
    } catch (e) {}
  };

  var buildEmbed = function (el) {
    var iframe = document.createElement("iframe");
    iframe.src = el.getAttribute("data-loom-src");
    iframe.title = el.getAttribute("data-loom-title") || "Embedded video";
    iframe.loading = "lazy";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("webkitallowfullscreen", "");
    iframe.setAttribute("mozallowfullscreen", "");
    el.parentNode.replaceChild(iframe, el);
  };

  var loadAllEmbeds = function () {
    document.querySelectorAll("[data-loom-src]").forEach(buildEmbed);
  };

  var hideBar = function () {
    if (cookieBar) cookieBar.hidden = true;
  };

  if (readConsent()) {
    loadAllEmbeds();
  } else {
    var acceptBtn = document.getElementById("cookie-accept");
    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        storeConsent();
        hideBar();
        loadAllEmbeds();
      });
    }

    document.querySelectorAll("[data-loom-src]").forEach(function (el) {
      var loadBtn = el.querySelector(".video-embed__load");
      if (!loadBtn) return;
      loadBtn.addEventListener("click", function () {
        storeConsent();
        hideBar();
        buildEmbed(el);
      });
    });

    if (cookieBar) cookieBar.hidden = false;
  }
})();
