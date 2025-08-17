// =====================
// Stage 1: DOM Handling
// =====================
let quotes = [];

// Load quotes from localStorage on page load
window.onload = function() {
  const savedQuotes = localStorage.getItem("quotes");
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    // default quotes
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
      { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Perseverance" }
    ];
    saveQuotes();
  }

  // Restore last viewed quote (sessionStorage)
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    document.getElementById("quoteDisplay").innerHTML = lastQuote;
  }

  populateCategories();

  // Restore last selected category filter
  const lastFilter = localStorage.getItem("lastFilter");
  if (lastFilter) {
    document.getElementById("categoryFilter").value = lastFilter;
    filterQuotes();
  }
};

// Display a random quote
function displayRandomQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  const displayText = `"${quote.text}" - <em>${quote.category}</em>`;
  document.getElementById("quoteDisplay").innerHTML = displayText;

  // Save last viewed quote to sessionStorage
  sessionStorage.setItem("lastQuote", displayText);
}

// Add a new quote
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    alert("Quote added successfully!");
  } else {
    alert("Please enter both a quote and a category.");
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// =====================
// Stage 2: JSON Import/Export
// =====================
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      alert("Quotes imported successfully!");
    } catch (error) {
      alert("Invalid JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// =====================
// Stage 3: Filtering System
// =====================
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  categoryFilter.innerHTML = categories
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join("");

  // Keep last filter if exists
  const lastFilter = localStorage.getItem("lastFilter");
  if (lastFilter) {
    categoryFilter.value = lastFilter;
  }
}

function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("lastFilter", selectedCategory);

  let filtered = quotes;
  if (selectedCategory !== "all") {
    filtered = quotes.filter(q => q.category === selectedCategory);
  }

  const displayArea = document.getElementById("quoteDisplay");
  if (filtered.length > 0) {
    displayArea.innerHTML = filtered
      .map(q => `"${q.text}" - <em>${q.category}</em>`)
      .join("<br><br>");
  } else {
    displayArea.innerHTML = "No quotes available for this category.";
  }
}

// =====================
// Stage 4: Server Sync (with async/await)
// =====================
const serverUrl = "https://jsonplaceholder.typicode.com/posts";

// Manual Sync Button Handler
async function syncQuo() {
  document.getElementById("syncStatus").innerText = "⏳ Syncing with server...";

  try {
    // 1. Fetch server quotes (simulate)
    const response = await fetch(serverUrl);
    const serverData = await response.json();

    // Simulate server quotes
    const serverQuotes = serverData.slice(0, 5).map(item => ({
      text: item.title,
      category: "Server"
    }));

    // Conflict resolution: server takes precedence
    const mergedQuotes = [...quotes, ...serverQuotes];
    quotes = mergedQuotes.filter(
      (q, index, self) =>
        index === self.findIndex(t => t.text === q.text) // avoid duplicates
    );

    saveQuotes();
    populateCategories();

    document.getElementById("syncStatus").innerText =
      "✅ Synced with server (server data took precedence)";

    // 2. Push local quotes (simulate POST)
    await fetch(serverUrl, {
      method: "POST",
      body: JSON.stringify(quotes),
      headers: {
      "Content-Type": "application/json; charset=UTF-8",
      },
    });
    console.log("Local quotes sent to server (simulation)");

  } catch (error) {
    console.error("Error syncing with server:", error);
    document.getElementById("syncStatus").innerText = "❌ Failed to sync with server";
  }
}

// Periodic Sync (every 1 minute)
setInterval(fetchQuotesFromServer, 60000);
