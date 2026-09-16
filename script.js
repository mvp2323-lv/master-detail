const CSV_PATH = "iowa-warblers.csv";
const BIRD_THUMBNAIL_EXTENSION = ".jpg";
const FOOD_IMAGE_EXTENSION = ".jpg";

const gridView = document.querySelector("#grid-view");
const grid = document.querySelector("#warbler-grid");
const detailView = document.querySelector("#detail-view");
const detailContent = document.querySelector("#detail-content");
const backButton = document.querySelector("#back-button");
const statusMessage = document.querySelector("#status-message");

let warblers = [];
let lastSelectedButton = null;

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, "-");
}

function splitCommaList(value) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function capitalize(value) {
  const text = String(value ?? "").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatCredit(value) {
  const credit = String(value ?? "").trim();
  if (!credit) return "Photo credit not provided";

  const match = credit.match(/^(.*?)\s*<((?:https?:\/\/)[^>]+)>\s*$/);
  if (!match) return escapeHTML(credit);

  const [, text, url] = match;
  return `${escapeHTML(text.trim())} <a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">License</a>`;
}

function showError(message) {
  statusMessage.textContent = message;
  gridView.hidden = true;
  detailView.hidden = true;
}

function renderGrid() {
  grid.replaceChildren();

  warblers.forEach((bird, index) => {
    const card = document.createElement("div");
    card.className = "warbler-card";

    const button = document.createElement("button");
    button.className = "warbler-button";
    button.type = "button";
    button.dataset.index = index;
    button.setAttribute("aria-label", `View ${bird.name}`);

    const image = document.createElement("img");
    image.src = `images/thumbnails/${slugify(bird.name)}${BIRD_THUMBNAIL_EXTENSION}`;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";

    const tooltip = document.createElement("span");
    tooltip.className = "tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.textContent = bird.name;

    button.append(image);
    card.append(button, tooltip);
    grid.append(card);
  });

  statusMessage.textContent = "";
  gridView.hidden = false;
}

function renderStatusChip(status) {
  const normalized = normalize(status);
  const allowed = ["common", "uncommon", "rare"];
  const className = allowed.includes(normalized) ? normalized : "uncommon";
  return `<span class="chip chip--${className}">${escapeHTML(capitalize(status))}</span>`;
}

function renderBreedingChip(value) {
  const yes = normalize(value) === "yes";
  return `<span class="chip chip--${yes ? "yes" : "no"}">${yes ? "Yes" : "No"}</span>`;
}

function renderFoodItems(value) {
  const foods = splitCommaList(value);
  if (!foods.length) return "<p>Not provided.</p>";

  return `
    <ul class="food-list">
      ${foods.map((food) => `
        <li class="food-item">
          <img
            class="food-image"
            src="images/food/${slugify(food)}${FOOD_IMAGE_EXTENSION}"
            alt=""
            loading="lazy"
            decoding="async"
          >
          <span class="food-name">${escapeHTML(food)}</span>
        </li>
      `).join("")}
    </ul>
  `;
}

function renderDetail(bird) {
  const name = escapeHTML(bird.name);
  const scientificName = escapeHTML(bird["scientific name"]);
  const image = escapeHTML(bird.image);
  const range = escapeHTML(bird.range);
  const habitat = escapeHTML(bird.habitat);
  const nesting = escapeHTML(bird["nesting information"]);
  const months = escapeHTML(bird["months you can see them"]);

  detailContent.innerHTML = `
    <div class="detail-card">
      <header class="detail-header">
        <figure class="bird-figure">
          <img class="bird-image" src="${image}" alt="${name}" fetchpriority="high">
          <figcaption class="photo-credit">Photo: ${formatCredit(bird["image credit"])}</figcaption>
        </figure>

        <div class="bird-heading">
          <h2 id="detail-name" tabindex="-1">${name}</h2>
          <p class="scientific-name">${scientificName}</p>
        </div>
      </header>

      <div class="detail-body">
        <section class="info-section" aria-labelledby="iowa-information-heading">
          <h3 id="iowa-information-heading">Iowa Information</h3>
          <div class="iowa-grid">
            <div>
              <span class="label">Status</span>
              ${renderStatusChip(bird.status)}
            </div>
            <div>
              <span class="label">Breeds in Iowa</span>
              ${renderBreedingChip(bird["breeds in Iowa"])}
            </div>
            <div>
              <span class="label">Months you can see them</span>
              <p class="months">${months || "Not provided."}</p>
            </div>
          </div>
        </section>

        <section class="info-section" aria-labelledby="general-information-heading">
          <h3 id="general-information-heading">General Information</h3>
          <div class="general-layout">
            <div class="general-copy">
              <div class="fact">
                <h4>Range</h4>
                <p>${range || "Not provided."}</p>
              </div>
              <div class="fact">
                <h4>Habitat</h4>
                <p>${habitat || "Not provided."}</p>
              </div>
              <div class="fact">
                <h4>Nesting information</h4>
                <p>${nesting || "Not provided."}</p>
              </div>
            </div>

            <aside class="food-panel" aria-labelledby="food-heading">
              <h4 id="food-heading">Preferred food sources</h4>
              ${renderFoodItems(bird["preferred food sources"])}
            </aside>
          </div>
        </section>

        <p class="source-note">Information has been summarized from the Cornell Lab of Ornithology.</p>
      </div>
    </div>
  `;

  gridView.hidden = true;
  detailView.hidden = false;

  requestAnimationFrame(() => {
    document.querySelector("#detail-name")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}

function openBird(index, triggeringButton) {
  const bird = warblers[index];
  if (!bird) return;
  lastSelectedButton = triggeringButton;
  renderDetail(bird);
}

function closeDetail() {
  detailView.hidden = true;
  gridView.hidden = false;
  detailContent.replaceChildren();

  requestAnimationFrame(() => {
    lastSelectedButton?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}

grid.addEventListener("click", (event) => {
  const button = event.target.closest(".warbler-button");
  if (!button) return;
  openBird(Number(button.dataset.index), button);
});

backButton.addEventListener("click", closeDetail);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detailView.hidden) closeDetail();
});

Papa.parse(CSV_PATH, {
  download: true,
  header: true,
  skipEmptyLines: "greedy",
  transformHeader: (header) => header.trim(),
  complete(results) {
    if (results.errors.length) console.warn("CSV parsing warnings:", results.errors);
    warblers = results.data.filter((row) => String(row.name ?? "").trim());
    if (!warblers.length) {
      showError("No warbler records were found in the CSV.");
      return;
    }
    renderGrid();
  },
  error(error) {
    console.error(error);
    showError("The warbler data could not be loaded. Check that data/iowa-warblers.csv exists and that the page is being served through a web server.");
  }
});
