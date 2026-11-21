const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".nav");

if (menuButton && navigation) {
  menuButton.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navigation.classList.contains("open")) {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
      menuButton.focus();
    }
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open navigation");
    });
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

// Reveal content as it enters the viewport, with a gentle stagger per section.
const revealItems = document.querySelectorAll(".reveal");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

  revealItems.forEach((item) => {
    const siblings = [...item.parentElement.querySelectorAll(":scope > .reveal")];
    const index = Math.max(0, siblings.indexOf(item));
    item.style.setProperty("--reveal-delay", `${Math.min(index * 90, 270)}ms`);
    observer.observe(item);
  });
}


// Keep a quiet progress cue and identify the section currently in view.
const progressBar = document.querySelector(".reading-progress span");
let progressFrame = 0;

function updateReadingProgress(){
  progressFrame = 0;
  if (!progressBar) return;
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  progressBar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
}

function requestProgressUpdate(){
  if (!progressFrame) progressFrame = window.requestAnimationFrame(updateReadingProgress);
}

window.addEventListener("scroll", requestProgressUpdate, { passive: true });
window.addEventListener("resize", requestProgressUpdate, { passive: true });
updateReadingProgress();

const sectionLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
const linkedSections = sectionLinks
  .map((link) => ({ link, section: document.querySelector(link.getAttribute("href")) }))
  .filter((item) => item.section);

if ("IntersectionObserver" in window && linkedSections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    linkedSections.forEach(({ link, section }) => {
      if (section === visible.target) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }, { rootMargin: "-22% 0px -58% 0px", threshold: [0, .15, .35, .6] });

  linkedSections.forEach(({ section }) => sectionObserver.observe(section));
}


// Pointer-responsive hero lighting is limited to fine pointers and respects reduced motion.
const heroComposition = document.querySelector(".hero-composition");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
if (heroComposition && finePointer && !reduceMotion) {
  heroComposition.addEventListener("pointermove", (event) => {
    const bounds = heroComposition.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const tiltX = (0.5 - y) * 3.2;
    const tiltY = (x - 0.5) * 3.2;
    heroComposition.style.setProperty("--pointer-x", `${(x * 100).toFixed(1)}%`);
    heroComposition.style.setProperty("--pointer-y", `${(y * 100).toFixed(1)}%`);
    heroComposition.style.setProperty("--tilt-x", `${tiltY.toFixed(2)}deg`);
    heroComposition.style.setProperty("--tilt-y", `${tiltX.toFixed(2)}deg`);
  });
  heroComposition.addEventListener("pointerleave", () => {
    heroComposition.style.setProperty("--pointer-x", "50%");
    heroComposition.style.setProperty("--pointer-y", "50%");
    heroComposition.style.setProperty("--tilt-x", "0deg");
    heroComposition.style.setProperty("--tilt-y", "0deg");
  });
}


// V14 — accessible project filters; the full portfolio remains visible by default.
const workFilters = [...document.querySelectorAll(".work-filter")];
const projectCards = [...document.querySelectorAll(".project-card[data-category]")];
const workFilterStatus = document.querySelector(".work-filter-status");
if (workFilters.length && projectCards.length) {
  workFilters.forEach((button) => {
    button.addEventListener("click", () => {
      const selected = button.dataset.filter;
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const show = selected === "all" || card.dataset.category === selected;
        card.hidden = !show;
        if (show) visibleCount += 1;
      });
      workFilters.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      if (workFilterStatus) {
        const label = button.childNodes[0].textContent.trim();
        workFilterStatus.textContent = selected === "all"
          ? "Showing all 3 projects"
          : `Showing ${visibleCount} project in ${label}`;
      }
    });
  });
}


// V15 — prepare a visitor-controlled email; no form data is sent to a server.
const enquiryForm = document.querySelector("#enquiry-form");
if (enquiryForm) {
  enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!enquiryForm.reportValidity()) return;

    const formData = new FormData(enquiryForm);
    const interest = String(formData.get("interest") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const replyEmail = String(formData.get("replyEmail") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const subject = `CE Technologies enquiry — ${interest}`;
    const body = [
      `Topic: ${interest}`,
      name ? `Name: ${name}` : "",
      replyEmail ? `Reply email: ${replyEmail}` : "",
      "",
      message
    ].filter((line, index, lines) => line !== "" || (index > 0 && lines[index - 1] !== "")).join("\\n");

    const mailto = `mailto:contact.cetechnologies@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const note = document.querySelector("#enquiry-note");
    if (note) note.textContent = "Your email app should open with your draft. Review it and choose Send there; this website has not sent or stored your message.";
    window.location.href = mailto;
  });
}
