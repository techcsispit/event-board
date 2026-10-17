const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadSearchPage(events) {
  const elements = {};
  const listeners = {};

  const makeElement = (id) => ({
    id,
    value: "",
    textContent: "",
    innerHTML: "",
    classList: {
      add() {},
      remove() {},
      toggle() { return true; }
    },
    addEventListener(event, fn) {
      listeners[id] = listeners[id] || {};
      listeners[id][event] = listeners[id][event] || [];
      listeners[id][event].push(fn);
    },
    reset() {}
  });

  const ctx = {
    document: {
      getElementById: (id) => (elements[id] ||= makeElement(id)),
      querySelector: () => makeElement("query"),
      addEventListener() {}
    },
    window: {
      getSelection: () => null,
      scrollTo() {}
    },
    localStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {}
    },
    fetch: async () => ({ ok: true, json: async () => events }),
    alert() {},
    confirm: () => true,
    console,
    parseInt,
    Number
  };

  vm.createContext(ctx);
  vm.runInContext(
    fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf-8"),
    ctx
  );
  ctx.events = events;
  vm.runInContext("currentEvents = events", ctx);

  const trigger = (id, event, evtObj = {}) => {
    const fns = (listeners[id] && listeners[id][event]) || [];
    for (const fn of fns) {
      fn(evtObj);
    }
  };

  return {
    ctx,
    elements,
    trigger,
    renderedHtml: () => elements["events-grid"]?.innerHTML || "",
    renderedCount: () => elements["event-count"]?.textContent || ""
  };
}

const sampleEvents = () => [
  {
    id: 1,
    title: "AI & Robotics Summit",
    date: "2026-10-20",
    location: "Main Auditorium",
    description: "Keynote talks on deep learning.",
    tags: ["Tech", "AI"]
  },
  {
    id: 2,
    title: "Web Dev Hackathon",
    date: "2026-10-22",
    location: "Computer Lab 2",
    description: "Build fullstack web apps overnight.",
    tags: ["Coding", "Hackathon"]
  },
  {
    id: 3,
    title: "Design Systems Workshop",
    date: "2026-10-25",
    location: "Seminar Hall B",
    description: "Figma components and design tokens.",
    tags: ["Design", "UI/UX"]
  }
];

test("search matches event title case-insensitively", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterEvents("robotics");
  assert(page.renderedHtml().includes("AI &amp; Robotics Summit"));
  assert(!page.renderedHtml().includes("Web Dev Hackathon"));
  assert.strictEqual(page.renderedCount(), "Showing 1 event");
});

test("search matches event location case-insensitively", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterEvents("LAB 2");
  assert(page.renderedHtml().includes("Web Dev Hackathon"));
  assert(!page.renderedHtml().includes("AI &amp; Robotics Summit"));
  assert.strictEqual(page.renderedCount(), "Showing 1 event");
});

test("search matches event description case-insensitively", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterEvents("figma");
  assert(page.renderedHtml().includes("Design Systems Workshop"));
  assert(!page.renderedHtml().includes("AI &amp; Robotics Summit"));
  assert.strictEqual(page.renderedCount(), "Showing 1 event");
});

test("search matches event tags case-insensitively", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterEvents("TECH");
  assert(page.renderedHtml().includes("AI &amp; Robotics Summit"));
  assert(!page.renderedHtml().includes("Design Systems Workshop"));
  assert.strictEqual(page.renderedCount(), "Showing 1 event");
});

test("empty search query restores all events", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterEvents("tech");
  assert.strictEqual(page.renderedCount(), "Showing 1 event");

  page.ctx.filterEvents("   ");
  assert.strictEqual(page.renderedCount(), "Showing 3 events");
  assert(page.renderedHtml().includes("AI &amp; Robotics Summit"));
  assert(page.renderedHtml().includes("Web Dev Hackathon"));
  assert(page.renderedHtml().includes("Design Systems Workshop"));
});

test("query with no matches displays empty state message", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterEvents("Unknown Keyword 12345");
  assert.strictEqual(page.renderedCount(), "Showing 0 events");
  assert(page.renderedHtml().includes("No events found."));
});

test("filterByTag remains available as an alias for filterEvents", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterByTag("Auditorium");
  assert(page.renderedHtml().includes("AI &amp; Robotics Summit"));
  assert.strictEqual(page.renderedCount(), "Showing 1 event");
});

test("clicking a tag badge sets search input value and filters events", () => {
  const page = loadSearchPage(sampleEvents());
  // Initially render all cards
  page.ctx.renderCards(sampleEvents());

  const mockBadge = {
    closest: (selector) => (selector === ".tag-badge" ? mockBadge : null),
    getAttribute: (attr) => (attr === "data-tag" ? "Hackathon" : null),
    textContent: "#Hackathon"
  };

  page.trigger("events-grid", "click", { target: mockBadge });
  assert.strictEqual(page.elements["tag-filter"].value, "Hackathon");
  assert.strictEqual(page.renderedCount(), "Showing 1 event");
  assert(page.renderedHtml().includes("Web Dev Hackathon"));
  assert(!page.renderedHtml().includes("AI &amp; Robotics Summit"));
});

test("clicking clear button resets search input and restores all events", () => {
  const page = loadSearchPage(sampleEvents());
  page.ctx.filterEvents("Hackathon");
  page.elements["tag-filter"].value = "Hackathon";
  assert.strictEqual(page.renderedCount(), "Showing 1 event");

  page.trigger("clear-filter-btn", "click");
  assert.strictEqual(page.elements["tag-filter"].value, "");
  assert.strictEqual(page.renderedCount(), "Showing 3 events");
  assert(page.renderedHtml().includes("AI &amp; Robotics Summit"));
  assert(page.renderedHtml().includes("Web Dev Hackathon"));
  assert(page.renderedHtml().includes("Design Systems Workshop"));
});

test("tag-filter input event triggers filterEvents", () => {
  const page = loadSearchPage(sampleEvents());
  page.trigger("tag-filter", "input", { target: { value: "Design" } });
  assert.strictEqual(page.renderedCount(), "Showing 1 event");
  assert(page.renderedHtml().includes("Design Systems Workshop"));
});
