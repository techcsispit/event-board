/**
 * Validation utilities for event objects.
 */

function validateEvent(event) {
  if (!event || typeof event !== "object") {
    return { valid: false, error: "Event must be an object" };
  }

  if (typeof event.title !== "string" || event.title.trim().length === 0) {
    return { valid: false, error: "Title is required" };
  }

  if (!event.date || isNaN(Date.parse(event.date))) {
    return { valid: false, error: "Valid date (YYYY-MM-DD) is required" };
  }

  if (!event.location || typeof event.location !== "string" || event.location.trim().length === 0) {
    return { valid: false, error: "Location is required" };
  }

  if (Array.isArray(event.tags) && !event.tags.every(tag => typeof tag === "string")) {
    return { valid: false, error: "Tags must be strings" };
  }

  return { valid: true };
}

module.exports = {
  validateEvent,
};
