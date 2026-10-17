let currentEvents = [];

const eventsGrid = document.getElementById("events-grid");
const eventCount = document.getElementById("event-count");
const tagFilter = document.getElementById("tag-filter");
const clearFilterBtn = document.getElementById("clear-filter-btn");
const toggleFormBtn = document.getElementById("toggle-form-btn");
const cancelFormBtn = document.getElementById("cancel-form-btn");
const formContainer = document.getElementById("form-container");
const eventForm = document.getElementById("event-form");
const adminTokenInput = document.getElementById("admin-token");
const formTitle = document.getElementById("form-title");
const submitFormBtn = document.getElementById("submit-form-btn");
const eventIdInput = document.getElementById("event-id");
const mainTitle = document.getElementById("main-title");
const adminAuthDiv = document.querySelector(".admin-auth");
const adminLoginBtn = document.getElementById("admin-login-btn");

let adminToken = localStorage.getItem("adminToken") || "";
adminTokenInput.value = adminToken;

async function verifyToken(token) {
  if (!token) return false;
  try {
    const res = await fetch("/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

async function checkAuthOnLoad() {
  if (adminToken) {
    const isValid = await verifyToken(adminToken);
    if (isValid) {
      adminAuthDiv.classList.add("visible");
      renderCards(currentEvents); // Renders with buttons since adminToken is true
    } else {
      adminToken = "";
      localStorage.removeItem("adminToken");
      adminTokenInput.value = "";
    }
  }
}
checkAuthOnLoad();

mainTitle.addEventListener("dblclick", () => {
  const isVisible = adminAuthDiv.classList.toggle("visible");
  
  if (!isVisible) {
    adminToken = "";
    adminTokenInput.value = "";
    localStorage.removeItem("adminToken");
    renderCards(currentEvents);
  }

  if (window.getSelection) {
    window.getSelection().removeAllRanges();
  }
});

adminLoginBtn.addEventListener("click", async () => {
  const tokenToTest = adminTokenInput.value;
  const isValid = await verifyToken(tokenToTest);
  
  if (isValid) {
    adminToken = tokenToTest;
    localStorage.setItem("adminToken", adminToken);
    renderCards(currentEvents);
    alert("Logged in successfully! You can now edit and delete events.");
  } else {
    alert("Invalid Admin Token!");
    adminToken = "";
    localStorage.removeItem("adminToken");
    renderCards(currentEvents);
  }
});

async function fetchEvents() {
  try {
    const res = await fetch("/events");
    const data = await res.json();
    currentEvents = data;
    renderCards(currentEvents);
  } catch (err) {
    console.error("Failed to load events:", err);
    eventsGrid.innerHTML = `<p class="error-msg">Could not load events.</p>`;
  }
}

function filterEvents(query) {
  if (!query || query.trim() === "") {
    renderCards(currentEvents);
    return;
  }

  const q = query.trim().toLowerCase();
  const filtered = currentEvents.filter(event => {
    const matchTitle = typeof event.title === "string" && event.title.toLowerCase().includes(q);
    const matchLocation = typeof event.location === "string" && event.location.toLowerCase().includes(q);
    const matchDesc = typeof event.description === "string" && event.description.toLowerCase().includes(q);
    const matchTags = Array.isArray(event.tags) && event.tags.some(tag => typeof tag === "string" && tag.toLowerCase().includes(q));

    return Boolean(matchTitle || matchLocation || matchDesc || matchTags);
  });

  renderCards(filtered);
}

function filterByTag(query) {
  return filterEvents(query);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderCards(eventsToRender) {
  eventCount.textContent = `Showing ${eventsToRender.length} event${eventsToRender.length === 1 ? '' : 's'}`;

  if (eventsToRender.length === 0) {
    eventsGrid.innerHTML = `<div class="empty-state"><p>No events found.</p></div>`;
    return;
  }

  eventsGrid.innerHTML = eventsToRender.map(event => {
    const tagsHtml = (event.tags || [])
      .map(tag => `<span class="tag-badge" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</span>`)
      .join("");

    const safeId = Number(event.id);

    return `
      <article class="card event-card" data-id="${escapeHtml(event.id)}">
        <div class="card-top">
          <span class="event-date-badge">${escapeHtml(event.date)}</span>
          <h3 class="card-title">${escapeHtml(event.title)}</h3>
          <div class="card-location">📍 ${escapeHtml(event.location)}</div>
          <p class="card-desc">${escapeHtml(event.description || "")}</p>
        </div>
        <div class="card-footer">
          <div class="tags-list">${tagsHtml}</div>
          ${adminToken ? `
            <div class="card-actions">
              <button class="btn btn-primary edit-btn" onclick="openEditEvent(${safeId})">Edit</button>
              <button class="btn btn-danger delete-btn" onclick="deleteEvent(${safeId})">Delete</button>
            </div>
          ` : ""}
        </div>
      </article>
    `;
  }).join("");
}

async function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    const res = await fetch(`/events/${id}`, { 
      method: "DELETE",
      headers: { "Authorization": `Bearer ${adminToken}` }
    });
    if (res.ok) {
      currentEvents = currentEvents.filter(e => e.id !== id);
      renderCards(currentEvents);
    } else {
      const data = await res.json();
      alert(`Failed to delete event: ${data.error}`);
    }
  } catch (err) {
    console.error("Error deleting event:", err);
  }
}

function openEditEvent(id) {
  const event = currentEvents.find(e => e.id === id);
  if (!event) return;
  
  formTitle.textContent = "Edit Event";
  submitFormBtn.textContent = "Save Changes";
  eventIdInput.value = event.id;
  
  document.getElementById("event-title").value = event.title;
  document.getElementById("event-date").value = event.date;
  document.getElementById("event-location").value = event.location;
  document.getElementById("event-tags").value = (event.tags || []).join(", ");
  document.getElementById("event-desc").value = event.description || "";
  
  formContainer.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function handleCreateEvent(e) {
  e.preventDefault();

  const title = document.getElementById("event-title").value;
  const date = document.getElementById("event-date").value;
  const location = document.getElementById("event-location").value;
  const rawTags = document.getElementById("event-tags").value;
  const description = document.getElementById("event-desc").value;

  const tags = rawTags
    .split(",")
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const payload = { title, date, location, description, tags };
  const id = eventIdInput.value;
  
  const url = id ? `/events/${id}` : "/events";
  const method = id ? "PUT" : "POST";
  const headers = { "Content-Type": "application/json" };
  if (id) headers["Authorization"] = `Bearer ${adminToken}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const saved = await res.json();
      if (id) {
        const index = currentEvents.findIndex(e => e.id === parseInt(id));
        if (index !== -1) currentEvents[index] = saved;
      } else {
        currentEvents.push(saved);
      }
      currentEvents.sort((a, b) => a.date.localeCompare(b.date));
      renderCards(currentEvents);
      eventForm.reset();
      eventIdInput.value = "";
      formContainer.classList.add("hidden");
    } else {
      const errData = await res.json();
      alert(`Error: ${errData.error || 'Failed to save event'}`);
    }
  } catch (err) {
    console.error("Failed to create event:", err);
  }
}

tagFilter.addEventListener("input", (e) => {
  filterEvents(e.target.value);
});

clearFilterBtn.addEventListener("click", () => {
  tagFilter.value = "";
  filterEvents("");
});

eventsGrid.addEventListener("click", (e) => {
  const target = e.target;
  if (!target) return;
  const badge = target.closest ? target.closest(".tag-badge") : (target.classList && target.classList.contains("tag-badge") ? target : null);
  if (!badge) return;
  const tag = (badge.getAttribute && badge.getAttribute("data-tag")) || (badge.dataset && badge.dataset.tag) || (badge.textContent || "").replace(/^#/, "").trim();
  tagFilter.value = tag;
  filterEvents(tag);
});

toggleFormBtn.addEventListener("click", () => {
  formTitle.textContent = "Submit an Event";
  submitFormBtn.textContent = "Create Event";
  eventIdInput.value = "";
  eventForm.reset();
  formContainer.classList.toggle("hidden");
});

cancelFormBtn.addEventListener("click", () => {
  formContainer.classList.add("hidden");
  eventForm.reset();
});

eventForm.addEventListener("submit", handleCreateEvent);

document.addEventListener("DOMContentLoaded", fetchEvents);
