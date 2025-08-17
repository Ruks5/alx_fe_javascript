// =====================
// Stage 1: DOM Handling
// =====================
let quotes = [];
let pendingConflict = null; // store conflict info

// Fake server state (simulated)
let serverQuotes = [
  { text: "Success is not final, failure is not fatal.", category: "Wisdom" },
  { text: "Courage is one step ahead of fear.", category: "Motivation" }
];

// Load quotes from localStorage on page load
window.onload = function() {
  const savedQuotes = localStorage.getItem("quotes");
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Don’t let yesterday take up too much of today.", category: "Wisdom" },
      { text: "It’s not whether you get knocked down, it’s whether you get up.", category: "Perseverance" }
    ];
    saveQuotes();
  }

  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    document.getElementById("quoteDisplay").innerHTML = lastQuote;
  }

  populateCategories();

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
// Stage 4: Syncing & Conflicts
// =====================

// Manual Sync Button Handler
async function syncQuotes() {
  document.getElementById("syncStatus").innerText = "⏳ Syncing with server...";

  try {
    // Simulate fetching from server
    let newServerData = [...serverQuotes];

    // Check for conflicts: same text but different category
    for (let localQuote of quotes) {
      let serverMatch = newServerData.find(q => q.text === localQuote.text);
      if (serverMatch && serverMatch.category !== localQuote.category) {
        // Conflict detected → ask user
        pendingConflict = { local: localQuote, server: serverMatch };
        document.getElementById("conflictMessage").innerText =
          `Quote: "${localQuote.text}"\nLocal category: ${localQuote.category}, Server category: ${serverMatch.category}`;
        document.getElementById("conflictModal").style.display = "flex";
        return;
      }
    }

    // Merge (server wins by default)
    const mergedQuotes = [...quotes, ...newServerData];
    quotes = mergedQuotes.filter(
      (q, index, self) =>
        index === self.findIndex(t => t.text === q.text) // dedupe
    );

    saveQuotes();
    populateCategories();

    document.getElementById("syncStatus").innerText =
      "✅ Synced successfully (server data merged)";

    // Simulate POSTing local quotes to server
    serverQuotes = [...quotes];
    console.log("Local quotes sent to server:", serverQuotes);

  } catch (error) {
    console.error("Error syncing with server:", error);
    document.getElementById("syncStatus").innerText = "❌ Failed to sync with server";
  }
}

// Conflict resolution handler
function resolveConflict(choice) {
  if (!pendingConflict) return;

  if (choice === "server") {
    // Keep server version
    quotes = quotes.map(q =>
      q.text === pendingConflict.local.text ? pendingConflict.server : q
    );
  } else {
    // Keep local version (overwrite server)
    serverQuotes = serverQuotes.map(q =>
      q.text === pendingConflict.server.text ? pendingConflict.local : q
    );
  }

  saveQuotes();
  populateCategories();
  document.getElementById("syncStatus").innerText =
    `⚠️ Conflict resolved manually: ${choice.toUpperCase()} version kept`;

  pendingConflict = null;
  document.getElementById("conflictModal").style.display = "none";
}
// =====================
// Stage 5: Testing Utility
// =====================
function createTestConflict() {
  if (quotes.length === 0) {
    alert("No quotes available to test with.");
    return;
  }

  // Pick first quote and create a conflicting version on the server
  const testQuote = quotes[0];
  const serverVersion = { text: testQuote.text, category: "ServerConflict" };

  // Insert/update serverQuotes with conflicting category
  const index = serverQuotes.findIndex(q => q.text === testQuote.text);
  if (index !== -1) {
    serverQuotes[index] = serverVersion;
  } else {
    serverQuotes.push(serverVersion);
  }

  document.getElementById("syncStatus").innerText =
    `⚠️ Test conflict created for quote: "${testQuote.text}"`;

  // Immediately try to sync → should trigger modal
  syncQuotes();
}


// Periodic Sync (every 1 minute)
setInterval(syncQuotes, 60000);
