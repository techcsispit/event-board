const { test, describe } = require("node:test");
const assert = require("node:assert");
const { validateEvent } = require("../src/validator");

// The page's tag filter calls tag.toLowerCase() on every tag, so a stored
// non-string tag breaks the filter for every event.
describe("Event Validator: tags", () => {
  const base = { title: "CSI Tech Fest", date: "2025-10-15", location: "Main Auditorium" };

  test("tags that are all strings pass validation", () => {
    assert.strictEqual(validateEvent({ ...base, tags: ["Tech", "fest"] }).valid, true);
  });

  test("missing or empty tags still pass validation", () => {
    assert.strictEqual(validateEvent(base).valid, true);
    assert.strictEqual(validateEvent({ ...base, tags: [] }).valid, true);
  });

  test("a non-string tag fails validation", () => {
    for (const tags of [[2026], [null], ["Tech", {}], [["Tech"]], [true]]) {
      const result = validateEvent({ ...base, tags });
      assert.strictEqual(result.valid, false, JSON.stringify(tags));
      assert.strictEqual(result.error, "Tags must be strings");
    }
  });
});
