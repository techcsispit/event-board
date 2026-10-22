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

  // Check the required YYYY-MM-DD format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (typeof event.date !== "string" || !datePattern.test(event.date)) {
    return { valid: false, error: "Valid date (YYYY-MM-DD) is required" };
  }

  // Check whether the date exists on the calendar
  const parsedDate = new Date(`${event.date}T00:00:00.000Z`);
  if (
    event.date.startsWith("0000") ||
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== event.date
  ) {
    return {
      valid: false,
      error: "Valid date (YYYY-MM-DD) is required"
    };
  }

  if (!event.location || typeof event.location !== "string" || event.location.trim().length === 0) {
    return { valid: false, error: "Location is required" };
  }

  if (event.description !== undefined && typeof event.description !== "string") {
    return { valid: false, error: "Description must be a string" };
  }

  if (Array.isArray(event.tags) && !event.tags.every(tag => typeof tag === "string")) {
    return { valid: false, error: "Tags must be strings" };
  }

  return { valid: true };
}

module.exports = {
  validateEvent,
};
