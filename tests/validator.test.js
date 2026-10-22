const { test, describe } = require("node:test");
const assert = require("node:assert");
const { validateEvent } = require("../src/validator");

describe("Event Validator", () => {
  test("valid event object passes validation", () => {
    const event = {
      title: "CSI Tech Fest",
      date: "2025-10-15",
      location: "Main Auditorium",
      description: "Annual technology festival",
      tags: ["tech", "fest"]
    };
    const result = validateEvent(event);
    assert.strictEqual(result.valid, true);
  });

  test("missing title fails validation", () => {
    const event = {
      title: "",
      date: "2025-10-15",
      location: "Main Auditorium"
    };
    const result = validateEvent(event);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "Title is required");
  });

  test("invalid or missing date fails validation", () => {
    const event = {
      title: "Workshop",
      date: "not-a-date",
      location: "Lab 1"
    };
    const result = validateEvent(event);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "Valid date (YYYY-MM-DD) is required");
  });

  test("missing location fails validation", () => {
    const event = {
      title: "Workshop",
      date: "2025-10-15",
      location: ""
    };
    const result = validateEvent(event);
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error, "Location is required");
  });

  test("non-object input fails validation", () => {
    const result = validateEvent(null);
    assert.strictEqual(result.valid, false);
  });

  // New date-validation regression tests

  test("rejects dates outside YYYY-MM-DD format", () => {
    const result = validateEvent({
      title: "Test Event",
      date: "10/20/2026",
      location: "Mumbai"
    });
    assert.strictEqual(result.valid, false);
  });

  test("rejects impossible calendar dates", () => {
    const result = validateEvent({
      title: "Test Event",
      date: "2026-02-31",
      location: "Mumbai"
    });
    assert.strictEqual(result.valid, false);
  });

  test("accepts valid YYYY-MM-DD dates", () => {
    const result = validateEvent({
      title: "Test Event",
      date: "2026-10-20",
      location: "Mumbai"
    });
    assert.strictEqual(result.valid, true);
  });

  test("accepts valid leap-year dates", () => {
    const result = validateEvent({
      title: "Test Event",
      date: "2024-02-29",
      location: "Mumbai"
    });
    assert.strictEqual(result.valid, true);
  });

  test("rejects non-string date types (issue #19)", () => {
    for (const badDate of [2026, ["2026-10-20"], { year: 2026 }, true, false, null]) {
      const result = validateEvent({
        title: "Test Event",
        date: badDate,
        location: "Mumbai"
      });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Valid date (YYYY-MM-DD) is required");
    }
  });

  test("rejects non-string description types", () => {
    for (const badDesc of [12345, true, false, ["not", "string"], { text: "description" }]) {
      const result = validateEvent({
        title: "Test Event",
        date: "2026-10-20",
        location: "Mumbai",
        description: badDesc
      });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "Description must be a string");
    }
  });

  test("accepts missing, empty, or string descriptions", () => {
    for (const goodDesc of [undefined, "", "A valid event description"]) {
      const result = validateEvent({
        title: "Test Event",
        date: "2026-10-20",
        location: "Mumbai",
        description: goodDesc
      });
      assert.strictEqual(result.valid, true);
    }
  });
});
