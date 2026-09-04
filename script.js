const state = {
  page: 1,
  limit: 6,
  search: "",
  domain: "",
  total: 0,
  pages: 0,
  selected: null
};

const grid = document.querySelector("#internship-grid");
const loading = document.querySelector("#loading-state");
const empty = document.querySelector("#empty-state");
const errorState = document.querySelector("#error-state");
const resultsCount = document.querySelector("#results-count");
const pagination = document.querySelector("#pagination");
const domainSelect = document.querySelector("#domain");
const filterForm = document.querySelector("#filter-form");
const searchInput = document.querySelector("#search");

const detailsDialog = document.querySelector("#details-dialog");
const applicationDialog = document.querySelector("#application-dialog");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[char]));
}

function setState({ isLoading = false, isError = false, isEmpty = false } = {}) {
  loading.hidden = !isLoading;
  errorState.hidden = !isError;
  empty.hidden = !isEmpty;
  if (isLoading || isError || isEmpty) grid.innerHTML = "";
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || "Request failed.");
    error.payload = payload;
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function loadDomains() {
  try {
    const result = await fetchJSON("/api/domains");
    domainSelect.innerHTML = '<option value="">All domains</option>' +
      result.data.map(domain => `<option value="${escapeHTML(domain)}">${escapeHTML(domain)}</option>`).join("");
  } catch {
    // The board can still work if the optional domain endpoint fails.
  }
}

function renderCard(item) {
  const skills = item.skills.map(skill => `<span class="chip">${escapeHTML(skill)}</span>`).join("");
  return `
    <article class="card">
      <div class="card-top">
        <span class="badge">${escapeHTML(item.domain)}</span>
      </div>
      <h3>${escapeHTML(item.title)}</h3>
      <p class="company">${escapeHTML(item.company)}</p>
      <p class="card-description">${escapeHTML(item.description)}</p>
      <div class="meta">
        <span>📍 ${escapeHTML(item.location)}</span>
        <span>⏱ ${escapeHTML(item.duration)}</span>
        <span>💰 ${escapeHTML(item.stipend)}</span>
      </div>
      <div class="chips">${skills}</div>
      <div class="card-actions">
        <button class="button ghost details-button" data-id="${item.id}" type="button">View details</button>
        <button class="button primary apply-button" data-id="${item.id}" type="button">Apply</button>
      </div>
    </article>`;
}

function renderPagination() {
  pagination.innerHTML = "";
  if (state.pages <= 1) return;

  const makeButton = (label, page, disabled = false, current = false) => {
    const button = document.createElement("button");
    button.className = "page-button";
    button.type = "button";
    button.textContent = label;
    button.disabled = disabled;
    if (current) button.setAttribute("aria-current", "page");
    button.addEventListener("click", () => {
      state.page = page;
      loadInternships();
      document.querySelector("#internships").scrollIntoView({ behavior: "smooth" });
    });
    return button;
  };

  pagination.append(
    makeButton("Previous", state.page - 1, state.page === 1)
  );

  for (let page = 1; page <= state.pages; page++) {
    pagination.append(makeButton(String(page), page, false, page === state.page));
  }

  pagination.append(
    makeButton("Next", state.page + 1, state.page === state.pages)
  );
}

async function loadInternships() {
  setState({ isLoading: true });
  try {
    const params = new URLSearchParams({
      page: String(state.page),
      limit: String(state.limit)
    });
    if (state.search) params.set("search", state.search);
    if (state.domain) params.set("domain", state.domain);

    const result = await fetchJSON(`/api/internships?${params}`);
    const items = result.data;
    state.total = result.pagination.total;
    state.pages = result.pagination.pages;

    setState({ isEmpty: items.length === 0 });
    if (items.length) grid.innerHTML = items.map(renderCard).join("");

    resultsCount.textContent = `${state.total} internship${state.total === 1 ? "" : "s"} found`;
    document.querySelector("#hero-count").textContent = state.total;
    renderPagination();
  } catch (error) {
    console.error(error);
    setState({ isError: true });
    resultsCount.textContent = "";
    pagination.innerHTML = "";
  }
}

async function showDetails(id) {
  try {
    const result = await fetchJSON(`/api/internships/${id}`);
    state.selected = result.data;

    document.querySelector("#details-domain").textContent = result.data.domain;
    document.querySelector("#details-title").textContent = result.data.title;
    document.querySelector("#details-company").textContent = result.data.company;
    document.querySelector("#details-description").textContent = result.data.description;
    document.querySelector("#details-meta").innerHTML = `
      <div><strong>Location</strong>${escapeHTML(result.data.location)}</div>
      <div><strong>Type</strong>${escapeHTML(result.data.type)}</div>
      <div><strong>Duration</strong>${escapeHTML(result.data.duration)}</div>
      <div><strong>Stipend</strong>${escapeHTML(result.data.stipend)}</div>`;
    document.querySelector("#details-skills").innerHTML =
      result.data.skills.map(skill => `<span class="chip">${escapeHTML(skill)}</span>`).join("");

    detailsDialog.showModal();
  } catch {
    alert("Unable to load internship details.");
  }
}

function openApplication(item) {
  state.selected = item;
  detailsDialog.close();
  document.querySelector("#application-title").textContent = "Apply now";
  document.querySelector("#application-role").textContent = `${item.title} · ${item.company}`;
  document.querySelector("#application-internship-id").value = item.id;
  document.querySelector("#application-form").reset();
  document.querySelector("#application-internship-id").value = item.id;
  clearFormErrors();
  showMessage("", false);
  applicationDialog.showModal();
  setTimeout(() => document.querySelector("#app-name").focus(), 0);
}

function clearFormErrors() {
  document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
  document.querySelectorAll("#application-form input, #application-form textarea")
    .forEach(el => el.removeAttribute("aria-invalid"));
}

function showMessage(message, success) {
  const el = document.querySelector("#application-message");
  el.hidden = !message;
  el.textContent = message;
  el.className = `form-message ${success ? "success" : "error"}`;
}

document.addEventListener("click", event => {
  const detailsButton = event.target.closest(".details-button");
  const applyButton = event.target.closest(".apply-button");

  if (detailsButton) showDetails(Number(detailsButton.dataset.id));
  if (applyButton) {
    const card = applyButton.closest(".card");
    const title = card.querySelector("h3").textContent;
    const company = card.querySelector(".company").textContent;
    openApplication({ id: Number(applyButton.dataset.id), title, company });
  }
});

filterForm.addEventListener("submit", event => {
  event.preventDefault();
  state.search = searchInput.value.trim();
  state.domain = domainSelect.value;
  state.page = 1;
  loadInternships();
});

document.querySelector("#clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  domainSelect.value = "";
  state.search = "";
  state.domain = "";
  state.page = 1;
  loadInternships();
  searchInput.focus();
});

document.querySelector("#retry").addEventListener("click", loadInternships);
document.querySelector("#close-details").addEventListener("click", () => detailsDialog.close());
document.querySelector("#close-application").addEventListener("click", () => applicationDialog.close());

document.querySelector("#open-application").addEventListener("click", () => {
  if (state.selected) openApplication(state.selected);
});

[detailsDialog, applicationDialog].forEach(dialog => {
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
});

document.querySelector("#application-form").addEventListener("submit", async event => {
  event.preventDefault();
  clearFormErrors();
  showMessage("", false);

  const form = new FormData(event.currentTarget);
  const payload = Object.fromEntries(form.entries());

  try {
    const result = await fetchJSON("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    showMessage(result.data.message, true);
    event.currentTarget.reset();
    document.querySelector("#application-internship-id").value = state.selected?.id || "";
  } catch (error) {
    const fields = error.payload?.error?.fields || {};
    Object.entries(fields).forEach(([field, message]) => {
      const errorElement = document.querySelector(`#error-${field}`);
      const input = document.querySelector(`[name="${field}"]`);
      if (errorElement) errorElement.textContent = message;
      if (input) input.setAttribute("aria-invalid", "true");
    });
    showMessage(error.message, false);
  }
});

loadDomains();
loadInternships();
