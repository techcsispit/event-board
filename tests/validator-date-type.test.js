const { test, describe } = require("node:test");
const assert = require("node:assert");
const { validateEvent } = require("../src/validator");

// GET /events sorts with a.date.localeCompare, so a stored non-string date
// makes the whole list fail with a 500.
describe("Event Validator: date type", () => {
  const base = { title: "CSI Tech Fest", location: "Main Auditorium" };

  test("a string date passes validation", () => {
    assert.strictEqual(validateEvent({ ...base, date: "2026-10-20" }).valid, true);
  });

  test("a date that is not a string fails validation", () => {
    for (const date of [2026, ["2026-10-20"], { a: 1 }, true, null]) {
      const result = validateEvent({ ...base, date });
      assert.strictEqual(result.valid, false, JSON.stringify(date));
      assert.strictEqual(result.error, "Valid date (YYYY-MM-DD) is required");
    }
  });
});
