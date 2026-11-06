import { projects } from "./projects.js";
// Pinned scenes own chapter positioning; disable delayed browser restoration.
history.scrollRestoration = "manual";

const grid = document.querySelector("#project-grid");
const dialog = document.querySelector("#project-dialog");
const stage = document.querySelector("#gallery-stage");
const fallback = document.querySelector("#gallery-fallback");
const heroHost = document.querySelector("#hero-gallery-host");
const expandedHost = document.querySelector("#expanded-gallery-host");
const content = document.querySelector("#dialog-content");
let activeIndex = 2;
let gallery;
let journey;
let lastSelection = -1;
let lastTrigger;

grid.innerHTML = projects
  .map(
    (p) =>
      `<article class="project-card" data-type="${p.type}"><button class="project-open" data-project="${p.id}" aria-label="Explore ${p.name}${p.type === "concept" ? ", concept project" : ""}"><div class="exhibit-cover"><img src="images/exhibits/${p.id}.svg?v=red20261106" alt="" loading="lazy" width="900" height="1200"><span class="cover-enter">View in exhibition ↗</span></div><div class="project-card-heading"><h3>${p.name}</h3>${p.type === "concept" ? '<span class="concept-label">CONCEPT</span>' : `<span>${p.domain}</span>`}</div><p>${p.description}</p></button></article>`,
  )
  .join("");

const map = document.querySelector("#exhibition-map");
map.innerHTML = projects
  .map(
    (p, i) =>
      `<button data-exhibit="${i}" aria-label="Go to ${p.name}"><span>${p.number}</span><span>${p.name}</span></button>`,
  )
  .join("");

function selectExhibit(index, moveCamera = true) {
  activeIndex = (index + projects.length) % projects.length;
  if (lastSelection === activeIndex) {
    if (moveCamera) {
      gallery?.goTo(activeIndex);
      journey?.goToProject(activeIndex);
    }
    return;
  }
  lastSelection = activeIndex;
  const p = projects[activeIndex];
  fallback.src = `images/exhibits/${p.id}.svg?v=red20261106`;
  fallback.alt = `${p.name} exhibition poster`;
  document.querySelector("#hero-exhibit-number").textContent =
    `EXHIBIT ${p.number} / 05`;
  document.querySelector("#hero-exhibit-title").textContent = p.name;
  document.querySelector("#gallery-position").textContent = `${p.number} / 05`;
  content.innerHTML = `<p class="eyebrow">EXHIBIT ${p.number} / ${p.type === "concept" ? "CONCEPT" : "PROJECT"}</p><p class="exhibit-domain">${p.domain}</p><h2 id="dialog-title">${p.name}<span class="red">.</span></h2><p class="exhibit-description">${p.description}</p><div class="exhibit-story-section"><h3>The story</h3><p>${p.story}</p></div><div class="exhibit-story-section"><h3>The intention</h3><p>${p.focus}</p></div><div class="exhibit-story-section"><h3>The discipline</h3><p>${p.tools}</p></div><p class="exhibit-art-note">${p.type === "concept" ? "Concept exploration. " : ""}Original exhibition artwork; not a product screenshot.</p>`;
  map.querySelectorAll("button").forEach((button, i) => {
    button.setAttribute("aria-pressed", String(i === activeIndex));
  });
  if (dialog.open) {
    document.querySelector(".exhibit-story").scrollTop = 0;
    document.querySelector(".exhibition-layout").scrollTop = 0;
  }
  if (moveCamera) {
    gallery?.goTo(activeIndex);
    journey?.goToProject(activeIndex);
  }
}
function openExhibition(index, trigger) {
  lastTrigger = trigger;
  selectExhibit(index);
  if (!dialog.open) {
    dialog.showModal();
    journey?.pause(true);
    document.body.classList.add("dialog-open");
    expandedHost.append(stage);
    gallery?.resize();
    dialog.scrollTop = 0;
  }
}
function closeExhibition() {
  dialog.close();
}
document
  .querySelector("#enter-gallery")
  .addEventListener("click", (e) =>
    openExhibition(activeIndex, e.currentTarget),
  );
document.addEventListener("click", (e) => {
  const trigger = e.target.closest("[data-project]");
  if (trigger)
    openExhibition(
      projects.findIndex((p) => p.id === trigger.dataset.project),
      trigger,
    );
  const step = e.target.closest("[data-gallery-step]");
  if (step) selectExhibit(activeIndex + Number(step.dataset.galleryStep));
  const exhibit = e.target.closest("[data-exhibit]");
  if (exhibit) selectExhibit(Number(exhibit.dataset.exhibit));
});
document
  .querySelector("#close-dialog")
  .addEventListener("click", closeExhibition);
dialog.addEventListener("close", () => {
  heroHost.append(stage);
  journey?.pause(false);
  document.body.classList.remove("dialog-open");
  gallery?.resize();
  lastTrigger?.focus({ preventScroll: true });
});
document.addEventListener("keydown", (e) => {
  if (
    !dialog.open &&
    document.querySelector("#journey-stage").dataset.chapter !== "portfolio"
  )
    return;
  if (!dialog.open && !document.querySelector("#site-menu").hidden) return;
  if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault();
    selectExhibit(activeIndex + (e.key === "ArrowRight" ? 1 : -1));
  }
});
document.querySelectorAll("[data-filter]").forEach((button) =>
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((b) => {
      b.classList.toggle("active", b === button);
      b.setAttribute("aria-pressed", String(b === button));
    });
    grid.querySelectorAll(".project-card").forEach((card) => {
      card.hidden =
        button.dataset.filter !== "all" &&
        card.dataset.type !== button.dataset.filter;
    });
  }),
);
selectExhibit(activeIndex);

// The artwork and project stories remain available if WebGL is unavailable.
import("./gallery.js?v=toxic1")
  .then(({ createGallery }) => {
    gallery = createGallery(
      stage,
      projects,
      (index) => selectExhibit(index, false),
      activeIndex,
    );
    stage.classList.add("gallery-ready");
    document.querySelector("#gallery-loading").hidden = true;
  })
  .catch(() => {
    document.querySelector("#gallery-loading").hidden = true;
    document.querySelector("#gallery-instructions").textContent =
      "EXPLORE THE ARTWORK WITH THE ARROW BUTTONS";
    stage.classList.add("gallery-static");
  });

document.querySelector("#copy-email").addEventListener("click", async () => {
  const status = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText("sumanthnamadevaofficial@gmail.com");
    status.textContent = "Email copied. Let’s start a conversation.";
  } catch {
    status.textContent =
      "Select the email address to copy it, or click it to open your email app.";
  }
});
document.querySelector("#year").textContent = new Date().getFullYear();

// Compact chapter navigation, following the same structure as the page.
const menuToggle = document.querySelector("#menu-toggle");
const menu = document.querySelector("#site-menu");
function closeMenu(restoreFocus = false) {
  menu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
  if (restoreFocus) menuToggle.focus();
}
menuToggle.addEventListener("click", () => {
  const open = menu.hidden;
  menu.hidden = !open;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
document.addEventListener("click", (e) => {
  if (!menu.hidden && !e.target.closest("#site-menu,#menu-toggle")) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !menu.hidden) closeMenu(true);
});

const steps = [
  {
    title: "Find the idea.",
    copy: "A conversation before a canvas. Understand the people, the problem, and what a better experience could feel like.",
    image: "process-drawing.svg",
  },
  {
    title: "Make it tangible.",
    copy: "Give the idea a structure. Build an early version you can explore, question, and improve together.",
    image: "process-frame.svg",
  },
  {
    title: "Give it character.",
    copy: "Find the right balance of typography, composition, light, and movement. Make every choice belong to the same world.",
    image: "process-material.svg",
  },
  {
    title: "Refine the experience.",
    copy: "Test the details that shape how it feels: the pacing, the interactions, the small screens, and the unexpected paths.",
    image: "process-detail.svg",
  },
  {
    title: "Put it in the world.",
    copy: "Bring the pieces together, check the experience, and make the idea ready for the people it was built for.",
    image: "process-final.svg",
  },
];

const process = document.querySelector("#process");
const journeyHost = document.querySelector("#journey-stage");
let processStep = -1;
let activeChapter = "";
const panels = Array.from(document.querySelectorAll(".journey-panel"));
const navLinks = document.querySelectorAll("#site-menu a");
function setProcess(index) {
  if (index === processStep) return;
  processStep = index;
  const step = steps[index];
  document.querySelector("#process-number").textContent =
    String(index + 1).padStart(2, "0") + " / 05";
  document.querySelector("#process-step-title").textContent = step.title;
  document.querySelector("#process-step-copy").textContent = step.copy;
  document
    .querySelectorAll("[data-process]")
    .forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
}
function updateJourneyUI({
  id,
  p,
  mode,
  processIndex = 0,
  introOpacity = 1,
  workOpacity = 1,
  studioOpacity = 1,
  contactPoints = null,
}) {
  if (id !== activeChapter) {
    activeChapter = id;
    panels.forEach((panel) => {
      const active = panel.closest("section").id === id;
      panel.classList.toggle("is-active", active);
      panel.inert = !active;
    });
    navLinks.forEach((link) => {
      if (link.hash === "#" + id) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }
  document.body.classList.toggle("light-header", mode === "light");
  document.querySelector(".hero-panel").inert =
    id !== "home" || introOpacity < 0.05;
  document.querySelector(".work-panel").inert =
    id !== "portfolio" || workOpacity < 0.05;
  document.querySelector(".studio-panel").inert =
    id !== "about" || studioOpacity < 0.05;

  document
    .querySelector(".hero-panel")
    .style.setProperty("--intro-opacity", introOpacity);
  document
    .querySelector(".hero-panel")
    .style.setProperty("--intro-y", -p * 50 + "px");
  document
    .querySelector(".work-panel")
    .style.setProperty("--work-opacity", workOpacity);
  document
    .querySelector(".studio-panel")
    .style.setProperty("--studio-opacity", studioOpacity);
  if (id === "process") {
    setProcess(processIndex);
    const enter = Math.max(0, Math.min(1, (p - 0.025) / 0.055));
    const exit = 1 - Math.max(0, Math.min(1, (p - 0.88) / 0.06));
    document.querySelector(".process-sticky").style.opacity = enter * exit;
  }
  if (id === "contact") {
    const reveal = Math.max(0, Math.min(1, (p - 0.3) / 0.25));
    document.querySelector(".contact-orbit").style.opacity = reveal;
    document.querySelector(".contact-orbit").inert = reveal < 0.1;
  }
  if (contactPoints) {
    const small = innerWidth < 600;
    document.querySelectorAll("[data-contact-node]").forEach((node, i) => {
      const point = contactPoints[i];
      const radius = point.radius || 15;
      const x = small
        ? Math.max(60, Math.min(innerWidth - 60, point.x))
        : point.x + (i % 2 === 0 ? -1 : 1) * (radius + 12);
      const y = small ? point.y + (i < 2 ? -1 : 1) * (radius + 20) : point.y;
      node.style.left = x + "px";
      node.style.top = y + "px";
    });
  }
}
document.querySelectorAll("[data-process]").forEach((button) =>
  button.addEventListener("click", () => {
    const index = Number(button.dataset.process);
    const start = process.offsetTop;
    window.scrollTo({
      top:
        start +
        process.offsetHeight * (index === 0 ? 0.09 : (index + 0.18) / 5.15),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }),
);
updateJourneyUI({ id: "home", p: 0, mode: "dark" });
import("./journey.js?v=sweep1")
  .then(({ createJourney }) => {
    journey = createJourney(journeyHost, projects, updateJourneyUI, (index) =>
      selectExhibit(index, false),
    );
  })
  .catch(() => {
    // Static chapter artwork remains available if WebGL cannot initialize.
    const image = document.querySelector("#journey-fallback-image");
    function fallbackScroll() {
      let section = document.querySelector("#home");
      document.querySelectorAll(".journey-chapter").forEach((el) => {
        if (scrollY >= el.offsetTop - 1) section = el;
      });
      const p = Math.max(
        0,
        Math.min(
          1,
          (scrollY - section.offsetTop) / Math.max(section.offsetHeight, 1),
        ),
      );
      const index = Math.min(4, Math.floor(p * 5));
      const id = section.id;
      image.hidden = id === "home";
      document.querySelector("#journey-fallback>span").hidden = id !== "home";
      image.src =
        id === "process"
          ? "images/" + steps[index].image
          : id === "portfolio"
            ? "images/exhibits/" + projects[activeIndex].id + ".svg?v=red20261106"
            : "images/process-final.svg";
      journeyHost.dataset.chapter = id;
      updateJourneyUI({
        id,
        p,
        mode: id === "portfolio" || id === "contact" ? "light" : "dark",
        processIndex: index,
      });
    }
    addEventListener("scroll", fallbackScroll, { passive: true });
    fallbackScroll();
  });

// Resolve chapter anchors explicitly because their interfaces are viewport-pinned.
const chapterIds = new Set([
  "home",
  "portfolio",
  "process",
  "about",
  "contact",
]);
function chapterTop(id) {
  const section = document.getElementById(id);
  let top = section.offsetTop;
  if (id === "process") top += section.offsetHeight * 0.09;
  if (id === "contact") top += (section.offsetHeight - innerHeight) * 0.7;
  return top;
}
function goToChapter(id, instant = false) {
  if (!chapterIds.has(id)) return;
  closeMenu();
  window.scrollTo({
    top: chapterTop(id),
    behavior:
      instant || matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
  });
  if (instant) journey?.refresh();
}
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !chapterIds.has(link.hash.slice(1))) return;
  event.preventDefault();
  history.replaceState(null, "", link.hash);
  goToChapter(link.hash.slice(1));
});
addEventListener("hashchange", () => goToChapter(location.hash.slice(1), true));
requestAnimationFrame(() =>
  goToChapter(
    chapterIds.has(location.hash.slice(1)) ? location.hash.slice(1) : "home",
    true,
  ),
);
