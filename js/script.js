(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Navbar shrink/blur on scroll */
  var navbar = document.getElementById("navbar");
  var lastScrolled = null;

  function updateNavbar() {
    var scrolled = window.scrollY > 12;
    if (scrolled !== lastScrolled) {
      navbar.classList.toggle("is-scrolled", scrolled);
      lastScrolled = scrolled;
    }
  }

  updateNavbar();
  window.addEventListener("scroll", updateNavbar, { passive: true });

  /* Scroll-triggered reveal animations */
  var revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* Subtle parallax on hero background blobs */
  if (!reduceMotion) {
    var blobs = document.querySelectorAll(".blob");
    var hero = document.querySelector(".hero");
    var ticking = false;

    function applyParallax() {
      var scrollY = window.scrollY;
      var heroHeight = hero ? hero.offsetHeight : 0;

      if (scrollY < heroHeight) {
        blobs.forEach(function (blob, i) {
          var speed = 0.06 + i * 0.03;
          blob.style.transform = "translate3d(0, " + scrollY * speed + "px, 0)";
        });
      }
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(applyParallax);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* Contact form submission */
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
})();
