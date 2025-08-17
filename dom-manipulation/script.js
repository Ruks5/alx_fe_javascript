// ===== Storage Keys =====
const STORAGE_KEY = "dqg_quotes";
const LAST_QUOTE_KEY = "dqg_last_quote_idx"; // sessionStorage demo

// ===== Default Quotes (used if localStorage is empty/invalid) =====
const defaultQuotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Inspiration" },
];

// ===== App State =====
let quotes = [];

// ===== Persistence Helpers (Local Storage) =====
function loadQuotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      quotes = defaultQuotes.slice();
      saveQuotes();
      return;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Basic validation: must have text & category strings
      quotes = parsed.filter(
        (q) => q && typeof q.text === "string" && typeof q.category === "string"
      );
      if (quotes.length === 0) {
        quotes = defaultQuotes.slice();
        saveQuotes();
      }
    } else {
      quotes = defaultQuotes.slice();
      saveQuotes();
    }
  } catch (e) {
    // If anything goes wrong, fall back to defaults
    quotes = defaultQuotes.slice();
    saveQuotes();
  }
}

function saveQuotes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
}

// ===== Rendering =====
function renderQuoteByIndex(idx) {
  const quoteDisplay = document.getElementById("quoteDisplay");
  if (!quotes.length) {
    quoteDisplay.innerHTML = "No quotes available. <strong>Add one!</strong>";
    return;
  }
  const q = quotes[idx];
  quoteDisplay.innerHTML = `"${q.text}" — <em>(${q.category})</em>`;

  // Session storage demo: remember last viewed quote index
  sessionStorage.setItem(LAST_QUOTE_KEY, String(idx));
}

function showRandomQuote() {
  if (!quotes.length) {
    document.getElementById("quoteDisplay").innerHTML =
      "No quotes available. <strong>Add one!</strong>";
    return;
  }
  const idx = Math.floor(Math.random() * quotes.length);
  renderQuoteByIndex(idx);
}

// ===== Adding Quotes (Form generated dynamically) =====
function addQuote() {
  const newQuoteText = document.getElementById("newQuoteText").value.trim();
  const newQuoteCategory = document.getElementById("newQuoteCategory").value.trim();

  if (newQuoteText === "" || newQuoteCategory === "") {
    alert("Please enter both a quote and a category.");
    return;
  }

  quotes.push({ text: newQuoteText, category: newQuoteCategory });
  saveQuotes();

  // Clear inputs
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  // Show the newly added quote
  renderQuoteByIndex(quotes.length - 1);
  alert("New quote added successfully!");
}

function createAddQuoteForm() {
  const formContainer = document.getElementById("formContainer");

  // Quote input
  const quoteInput = document.createElement("input");
  quoteInput.id = "newQuoteText";
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.style.marginRight = ".5rem";

  // Category input
  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.style.marginRight = ".5rem";

  // Add button
  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);
}

// ===== Export / Import (JSON) =====
function exportToJsonFile() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// Exposed globally so the inline onchange handler works
function importFromJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);

      if (!Array.isArray(imported)) {
        alert("Invalid file format: expected an array of quotes.");
        return;
      }

      // Validate structure & merge
      const cleaned = imported.filter(
        (q) => q && typeof q.text === "string" && typeof q.category === "string"
      );

      if (cleaned.length === 0) {
        alert("No valid quotes found in the file.");
        return;
      }

      quotes.push(...cleaned);
      saveQuotes();
      showRandomQuote();
      alert("Quotes imported successfully!");
    } catch (err) {
      alert("Failed to parse JSON file. Please check the file format.");
    } finally {
      // Reset the input so the same file can be selected again if needed
      event.target.value = "";
    }
  };

  fileReader.readAsText(file);
}

window.importFromJsonFile = importFromJsonFile; // make it global for inline handler

// ===== Event Listeners =====
document.getElementById("newQuote").addEventListener("click", showRandomQuote);
document.getElementById("exportJson").addEventListener("click", exportToJsonFile);

// ===== Init =====
window.onload = function () {
  loadQuotes();
  createAddQuoteForm();

  // If we have a last-viewed index in sessionStorage, prefer it
  const lastIdxRaw = sessionStorage.getItem(LAST_QUOTE_KEY);
  const lastIdx = lastIdxRaw !== null ? parseInt(lastIdxRaw, 10) : NaN;

  if (!Number.isNaN(lastIdx) && lastIdx >= 0 && lastIdx < quotes.length) {
    renderQuoteByIndex(lastIdx);
  } else {
    showRandomQuote();
  }
};
