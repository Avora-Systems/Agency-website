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

      var hoverTargets = "a, button, .styles-track, [data-glow], [data-magnetic]";
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
     Hero image tilt (subtle 3D parallax toward the cursor)
     ---------------------------------------------------------- */
  var heroMedia = document.querySelector(".hero__media[data-tilt]");
  var heroSection = document.querySelector(".hero");

  if (heroMedia && heroSection && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    heroSection.addEventListener("mousemove", function (e) {
      var rect = heroSection.getBoundingClientRect();
      var px = (e.clientX - rect.left) / rect.width - 0.5;
      var py = (e.clientY - rect.top) / rect.height - 0.5;
      heroMedia.style.transform =
        "rotateY(" + px * 10 + "deg) rotateX(" + py * -10 + "deg)";
    });
    heroSection.addEventListener("mouseleave", function () {
      heroMedia.style.transform = "";
    });
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
