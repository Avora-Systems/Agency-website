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
    var CONTACT_WEBHOOK_URL = "https://n8n-production-7a6e1.up.railway.app/webhook/caa86be5-c643-4b5b-81df-3d7a56258cc4";
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
     Scroll progress bar
     ---------------------------------------------------------- */
  var progressBar = document.getElementById("progress-bar");

  if (progressBar) {
    var updateProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var pct = max > 0 ? (doc.scrollTop / max) * 100 : 0;
      progressBar.style.width = pct + "%";
    };
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  }

  /* ----------------------------------------------------------
     Custom cursor (desktop, fine pointer, motion allowed only)
     ---------------------------------------------------------- */
  var canUseFineCursor =
    !reduceMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (canUseFineCursor) {
    var cursorDot = document.getElementById("cursor-dot");
    var cursorRing = document.getElementById("cursor-ring");

    if (cursorDot && cursorRing) {
      document.documentElement.classList.add("has-custom-cursor");

      var ringX = 0,
        ringY = 0,
        mouseX = 0,
        mouseY = 0;

      window.addEventListener(
        "mousemove",
        function (e) {
          mouseX = e.clientX;
          mouseY = e.clientY;
          cursorDot.style.transform = "translate(" + mouseX + "px," + mouseY + "px)";
        },
        { passive: true }
      );

      var tickCursor = function () {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        cursorRing.style.transform = "translate(" + ringX + "px," + ringY + "px)";
        requestAnimationFrame(tickCursor);
      };
      requestAnimationFrame(tickCursor);

      var hoverTargets = "a, button, [data-glow], [data-magnetic], .avora-core";
      document.addEventListener("mouseover", function (e) {
        if (e.target.closest(hoverTargets)) cursorRing.classList.add("is-active");
      });
      document.addEventListener("mouseout", function (e) {
        if (e.target.closest(hoverTargets)) cursorRing.classList.remove("is-active");
      });
    }
  }

  /* ----------------------------------------------------------
     Magnetic buttons — CTA nudges toward the cursor on hover
     ---------------------------------------------------------- */
  if (!reduceMotion) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = "translate(" + x * 0.28 + "px," + y * 0.4 + "px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ----------------------------------------------------------
     Cursor-tracked glow on cards ([data-glow])
     ---------------------------------------------------------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-glow]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var rect = el.getBoundingClientRect();
        el.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
        el.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
      });
    });
  }

  /* ----------------------------------------------------------
     Hero title entrance — masked line reveal (GSAP SplitText)

     Plays once on load rather than on scroll-into-view, since the
     hero is always in view at load. Falls back to the title's
     default (fully visible, unsplit) markup if GSAP/SplitText
     didn't load or the visitor prefers reduced motion.
     ---------------------------------------------------------- */
  var heroTitle = document.querySelector("[data-split-mask]");
  var SplitTextPlugin = window.SplitText;

  if (heroTitle && gsapReady && SplitTextPlugin && !reduceMotion) {
    gsap.registerPlugin(SplitTextPlugin);
    var heroSplit = new SplitTextPlugin(heroTitle, { type: "lines", mask: "lines" });
    gsap.set(heroSplit.lines, { yPercent: 110 });
    gsap.to(heroSplit.lines, {
      yPercent: 0,
      duration: 1,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.15
    });
  }

  /* ----------------------------------------------------------
     Avora System hero: pin the hero while its scroll choreography
     plays, dispatching progress for the React island mounted in
     #avora-hero-root (see src/hero). Matches exactly the criteria
     HeroExperience uses itself to choose scroll-pin vs. autoplay
     (see useIsDesktopViewport there) — width AND a height check.

     The height check matters: ScrollTrigger pins via
     `position: fixed`, which clips to the viewport regardless of
     the pinned element's own height. On short/laptop viewports the
     hero's natural content (headline, CTA, stats) can be taller
     than the viewport, which would silently make the CTA
     unreachable for the whole pin duration. Skipping the pin there
     leaves the hero to scroll normally instead — HeroExperience
     falls back to its autoplay sequence in that case.
     ---------------------------------------------------------- */
  var heroSection = document.getElementById("top");
  var avoraHeroRoot = document.getElementById("avora-hero-root");
  var isDesktopViewport = window.matchMedia("(min-width: 921px)").matches;
  var heroFitsViewport = heroSection && heroSection.offsetHeight <= window.innerHeight;

  if (heroSection && avoraHeroRoot && gsapReady && !reduceMotion && isDesktopViewport && heroFitsViewport) {
    ScrollTrigger.create({
      trigger: heroSection,
      start: "top top",
      end: "+=100%",
      pin: true,
      pinSpacing: true,
      scrub: 0.4,
      onUpdate: function (self) {
        window.dispatchEvent(new CustomEvent("avora:hero-progress", { detail: self.progress }));
      }
    });
  }

  /* ----------------------------------------------------------
     How it works: one small system diagram, pinned and
     transformed by scroll rather than three unrelated icons —
     scattered inputs (01) -> connected (02) -> flowing (03).
     ---------------------------------------------------------- */
  var howSection = document.getElementById("how-it-works");
  var diagram = howSection && howSection.querySelector("[data-diagram]");
  var howFitsViewport = howSection && howSection.offsetHeight <= window.innerHeight;

  if (howSection && diagram && gsapReady && !reduceMotion && isDesktopViewport && howFitsViewport && window.DrawSVGPlugin) {
    gsap.registerPlugin(window.DrawSVGPlugin, window.MotionPathPlugin);

    var diagramLines = diagram.querySelectorAll("[data-diagram-line]");
    var diagramScatter = diagram.querySelectorAll("[data-diagram-scatter]");
    var diagramHubs = diagram.querySelectorAll("[data-diagram-hub]");
    var diagramFlow = diagram.querySelectorAll("[data-diagram-flow]");
    var stepEls = howSection.querySelectorAll(".step");
    var mapAndClamp = function (inMin, inMax, outMin, outMax, value) {
      var mapped = gsap.utils.mapRange(inMin, inMax, outMin, outMax, value);
      return gsap.utils.clamp(Math.min(outMin, outMax), Math.max(outMin, outMax), mapped);
    };

    gsap.set(diagramLines, { drawSVG: "0%" });
    gsap.set(diagramHubs, { opacity: 0.3 });
    gsap.set(diagramFlow, { opacity: 0 });

    var flowTl = gsap.timeline({ repeat: -1, paused: true });
    diagramFlow.forEach(function (dot, i) {
      flowTl.fromTo(
        dot,
        { motionPath: { path: diagramLines[i], align: diagramLines[i], alignOrigin: [0.5, 0.5], start: 0, end: 0 } },
        { motionPath: { path: diagramLines[i], align: diagramLines[i], alignOrigin: [0.5, 0.5], start: 0, end: 1 }, duration: 1.4, ease: "power1.inOut" },
        i * 0.35
      );
    });

    ScrollTrigger.create({
      trigger: howSection,
      start: "top top",
      end: "+=90%",
      pin: true,
      scrub: 0.5,
      onUpdate: function (self) {
        var p = self.progress;
        var activeStep = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;

        stepEls.forEach(function (el, i) {
          el.classList.toggle("is-active", i === activeStep);
        });

        var lit = mapAndClamp(0.15, 0.55, 0, 1, p);
        gsap.set(diagramScatter, { opacity: 1 - mapAndClamp(0, 0.3, 0, 1, p) });
        gsap.set(diagramLines, { drawSVG: mapAndClamp(0.22, 0.62, 0, 100, p) + "%" });
        gsap.set(diagramHubs, {
          borderColor: gsap.utils.interpolate("#d9dce2", "#2563eb", lit),
          backgroundColor: gsap.utils.interpolate("#ffffff", "#2563eb", lit)
        });

        var flowOpacity = mapAndClamp(0.62, 0.78, 0, 1, p);
        gsap.set(diagramFlow, { opacity: flowOpacity });
        if (flowOpacity > 0 && flowTl.paused()) flowTl.play();
        if (flowOpacity === 0 && !flowTl.paused()) flowTl.pause(0);
      }
    });
  }

  /* ----------------------------------------------------------
     Automation examples: one system, switched between rather
     than five unrelated cards. Progressive enhancement — the
     tabs are hidden and every example shown in full (the
     original design) until this runs.
     ---------------------------------------------------------- */
  var buildSwitcher = document.querySelector("[data-build-switcher]");

  if (buildSwitcher) {
    var buildTabs = Array.prototype.slice.call(buildSwitcher.querySelectorAll("[data-build-tab]"));
    var buildItems = Array.prototype.slice.call(buildSwitcher.querySelectorAll("[data-build-item]"));

    if (buildTabs.length && buildItems.length) {
      buildSwitcher.classList.add("is-enhanced");
      var buildTablist = buildSwitcher.querySelector(".build-switcher__tabs");
      if (buildTablist) buildTablist.setAttribute("role", "tablist");

      buildTabs.forEach(function (tab, i) {
        var panel = buildItems[i];
        tab.setAttribute("role", "tab");
        tab.setAttribute("aria-selected", tab.classList.contains("is-active") ? "true" : "false");
        if (panel) tab.setAttribute("aria-controls", panel.id);
        if (panel) panel.setAttribute("role", "tabpanel");

        tab.addEventListener("click", function (e) {
          e.preventDefault();
          buildTabs.forEach(function (t) {
            t.classList.remove("is-active");
            t.setAttribute("aria-selected", "false");
          });
          buildItems.forEach(function (item) {
            item.classList.remove("is-active");
          });
          tab.classList.add("is-active");
          tab.setAttribute("aria-selected", "true");
          if (panel) panel.classList.add("is-active");
        });
      });
    }
  }

  /* ----------------------------------------------------------
     Website design showcase: four fully coded concept sites in one
     browser frame. Two independent layers of state:
       - which CONCEPT is showing (the four tabs)
       - which PAGE within that concept is showing (the dots)
     Each concept remembers nothing between visits — switching back
     to a concept always resets it to its first page, which keeps
     the interaction simple and predictable rather than stateful.
     ---------------------------------------------------------- */
  var showcase = document.querySelector("[data-showcase]");

  if (showcase) {
    var showcaseTabs = Array.prototype.slice.call(showcase.querySelectorAll("[data-showcase-tab]"));
    var showcaseConcepts = Array.prototype.slice.call(showcase.querySelectorAll("[data-showcase-concept]"));
    var showcaseUrlEl = showcase.querySelector("[data-showcase-url]");

    // The four mockups' own nav/CTA links (href="#") are illustrative —
    // they're not real navigation. Stop them from jumping the real page
    // to the top or touching the URL hash. A single delegated listener on
    // the frame catches both mouse clicks and keyboard-triggered clicks
    // (Enter on a focused link fires the same "click" event), so this
    // doesn't change what's focusable or how tabbing through them works.
    var showcaseFrame = showcase.querySelector(".showcase-demo__frame");
    if (showcaseFrame) {
      showcaseFrame.addEventListener("click", function (e) {
        var link = e.target.closest("a");
        if (link) e.preventDefault();
      });
    }
    var showcaseAutoplayMs = 5200;
    var showcaseAutoplayTimer = null;

    var goToPage = function (concept, pageIndex) {
      var pages = Array.prototype.slice.call(concept.querySelectorAll("[data-concept-page]"));
      var dots = Array.prototype.slice.call(concept.querySelectorAll("[data-concept-dots] button"));
      pages.forEach(function (page, i) {
        page.classList.toggle("is-active", i === pageIndex);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === pageIndex);
      });
      return pages.length;
    };

    var stopAutoplay = function () {
      if (showcaseAutoplayTimer) {
        clearInterval(showcaseAutoplayTimer);
        showcaseAutoplayTimer = null;
      }
    };

    var startAutoplay = function (concept) {
      stopAutoplay();
      if (reduceMotion) return;
      var current = 0;
      showcaseAutoplayTimer = setInterval(function () {
        var dots = concept.querySelectorAll("[data-concept-dots] button");
        current = (current + 1) % dots.length;
        goToPage(concept, current);
      }, showcaseAutoplayMs);
    };

    showcaseConcepts.forEach(function (concept) {
      var dots = Array.prototype.slice.call(concept.querySelectorAll("[data-concept-dots] button"));
      dots.forEach(function (dot, i) {
        dot.addEventListener("click", function () {
          goToPage(concept, i);
          if (concept.classList.contains("is-active")) startAutoplay(concept);
        });
      });
    });

    showcaseTabs.forEach(function (tab) {
      tab.setAttribute("aria-selected", tab.classList.contains("is-active") ? "true" : "false");

      tab.addEventListener("click", function () {
        var targetId = tab.getAttribute("data-showcase-tab");
        if (tab.classList.contains("is-active")) return;

        showcaseTabs.forEach(function (t) {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");

        showcaseConcepts.forEach(function (concept) {
          var isTarget = concept.getAttribute("data-showcase-concept") === targetId;
          concept.classList.toggle("is-active", isTarget);
          concept.setAttribute("aria-hidden", isTarget ? "false" : "true");
          if (isTarget) {
            goToPage(concept, 0);
            if (showcaseUrlEl) showcaseUrlEl.textContent = concept.getAttribute("data-url") || "";
            startAutoplay(concept);
          }
        });
      });
    });

    showcaseConcepts.forEach(function (concept) {
      goToPage(concept, 0);
    });

    var activeConcept = showcase.querySelector("[data-showcase-concept].is-active");
    if (activeConcept) {
      startAutoplay(activeConcept);
      showcase.addEventListener("mouseenter", stopAutoplay);
      showcase.addEventListener("mouseleave", function () {
        var current = showcase.querySelector("[data-showcase-concept].is-active");
        if (current) startAutoplay(current);
      });
      showcase.addEventListener("focusin", stopAutoplay);
    }
  }

  /* ----------------------------------------------------------
     Illustrative animated demos (flow / chat / document / calendar)
     Play once when scrolled into view. Pure CSS/GSAP — no video,
     no third-party embeds, no cookies required.
     ---------------------------------------------------------- */
  var canAnimateDemos = gsapReady;

  var playChatDemo = function (root) {
    var lead = root.querySelector('[data-chat-el="lead"]');
    var typing = root.querySelector('[data-chat-el="typing"]');
    var reply = root.querySelector('[data-chat-el="reply"]');
    var tag = root.querySelector('[data-chat-el="tag"]');
    if (!lead) return;

    if (!canAnimateDemos) {
      [lead, typing, reply, tag].forEach(function (el) {
        if (el) {
          el.style.opacity = 1;
          el.style.transform = "none";
        }
      });
      if (typing) typing.style.display = "none";
      return;
    }

    var tl = gsap.timeline({ delay: 0.2 });
    tl.to(lead, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" })
      .to(typing, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }, "+=0.5")
      .to(typing, { opacity: 0, duration: 0.25 }, "+=0.9")
      .to(reply, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "<")
      .to(tag, { opacity: 1, duration: 0.4 }, "-=0.1");
  };

  var playDocDemo = function (root) {
    var checks = [
      root.querySelector('[data-doc-el="check1"]'),
      root.querySelector('[data-doc-el="check2"]'),
      root.querySelector('[data-doc-el="check3"]')
    ].filter(Boolean);

    if (!canAnimateDemos) {
      checks.forEach(function (el) {
        el.classList.add("is-done");
      });
      return;
    }

    var tl = gsap.timeline({ delay: 0.3 });
    checks.forEach(function (el, i) {
      tl.call(
        function () {
          el.classList.add("is-done");
        },
        null,
        i === 0 ? 0.4 : "+=0.5"
      );
    });
  };

  var playCalDemo = function (root) {
    var slot = root.querySelector('[data-cal-el="slot"]');
    var confirm = root.querySelector('[data-cal-el="confirm"]');
    if (!slot) return;

    if (!canAnimateDemos) {
      slot.classList.add("is-confirmed");
      if (confirm) {
        confirm.style.opacity = 1;
        confirm.style.transform = "none";
      }
      return;
    }

    var tl = gsap.timeline({ delay: 0.4 });
    tl.call(function () {
      slot.classList.add("is-confirmed");
    }, null, 0.6).to(confirm, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" }, "-=0.1");
  };

  var demoPlayers = { chat: playChatDemo, doc: playDocDemo, cal: playCalDemo };
  var demoEls = document.querySelectorAll("[data-demo]");

  if (demoEls.length) {
    if (gsapReady) {
      demoEls.forEach(function (el) {
        ScrollTrigger.create({
          trigger: el,
          start: "top 80%",
          once: true,
          onEnter: function () {
            var player = demoPlayers[el.getAttribute("data-demo")];
            if (player) player(el);
          }
        });
      });
    } else {
      demoEls.forEach(function (el) {
        var player = demoPlayers[el.getAttribute("data-demo")];
        if (player) player(el);
      });
    }
  }
})();
