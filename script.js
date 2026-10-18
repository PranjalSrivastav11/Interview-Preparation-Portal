// ============================================================================
// VIVA EDIT ZONE 2: CONFIGURATION (Change values here during live presentation)
// ============================================================================
const CONFIG = {
  portalTitle: "PrepPulse • Interview Portal",
  loadingSpeedMs: 360,     // Speed of initial loading bar (smaller = faster)
  passCutoff: 60,          // Change passing percentage (e.g. 60 -> 75)
  correctMarks: 4,         // Marks per correct answer in Mock Test
  negativeMarks: -1,       // Penalty per wrong answer (set 0 for no negative)
  warningSeconds: 30       // Timer turns red when <= 30 seconds remain
};

// ============================================================================
// VIVA EDIT ZONE 3: TOPIC-WISE INTERVIEW QUESTIONS DATA
// ============================================================================
const DEFAULT_QUESTIONS = [
  { id: 1, topic: "DSA", diff: "Easy", company: "TCS", q: "Worst-case time complexity of Binary Search on a sorted array?", options: ["O(N)", "O(log N)", "O(N log N)", "O(1)"], ans: 1, exp: "Binary Search halves the search space each step: O(log N)." },
  { id: 2, topic: "DSA", diff: "Medium", company: "Amazon", q: "Which data structure is used for Breadth-First Search (BFS) on a graph?", options: ["Stack", "Queue", "Heap", "Tree"], ans: 1, exp: "BFS visits nodes level-by-level using a FIFO Queue." },
  { id: 3, topic: "DSA", diff: "Hard", company: "Google", q: "Time and space complexity of Kadane's Maximum Subarray algorithm?", options: ["O(N²), O(N)", "O(N), O(1)", "O(N log N), O(1)", "O(1), O(1)"], ans: 1, exp: "Kadane's uses a single loop O(N) time and O(1) space." },
  { id: 4, topic: "AI & ML", diff: "Easy", company: "Infosys", q: "Which of the following is a Supervised Classification algorithm?", options: ["K-Means", "Logistic Regression", "PCA", "Apriori"], ans: 1, exp: "Logistic Regression predicts categorical labels from labeled data." },
  { id: 5, topic: "AI & ML", diff: "Medium", company: "Flipkart", q: "99% training accuracy but 60% test accuracy indicates:", options: ["Underfitting", "Overfitting", "Low Variance", "Normalization"], ans: 1, exp: "Overfitting occurs when a model memorizes training noise." },
  { id: 6, topic: "DBMS", diff: "Easy", company: "Wipro", q: "What does 'A' stand for in ACID database properties?", options: ["Availability", "Atomicity", "Authentication", "Action"], ans: 1, exp: "Atomicity means a transaction executes completely or not at all." },
  { id: 7, topic: "DBMS", diff: "Medium", company: "Oracle", q: "Which SQL clause filters groups created by GROUP BY?", options: ["WHERE", "HAVING", "ORDER BY", "LIMIT"], ans: 1, exp: "HAVING filters aggregated groups; WHERE filters individual rows." },
  { id: 8, topic: "OS & CN", diff: "Easy", company: "Cisco", q: "At which OSI layer do IP routers forward packets?", options: ["Layer 2 (Data Link)", "Layer 3 (Network)", "Layer 4 (Transport)", "Layer 7"], ans: 1, exp: "Routers inspect IP addresses at Layer 3 (Network Layer)." },
  { id: 9, topic: "OS & CN", diff: "Medium", company: "Qualcomm", q: "Which is NOT a condition for Deadlock in an Operating System?", options: ["Mutual Exclusion", "Hold and Wait", "Preemption", "Circular Wait"], ans: 2, exp: "Deadlock requires NO Preemption." },
  { id: 10, topic: "OOPs", diff: "Easy", company: "Capgemini", q: "Binding data and methods into a single class unit is called:", options: ["Polymorphism", "Encapsulation", "Inheritance", "Abstraction"], ans: 1, exp: "Encapsulation bundles data and methods and restricts outside access." },
  { id: 11, topic: "OOPs", diff: "Medium", company: "Microsoft", q: "Redefining a base class method inside a subclass is called:", options: ["Method Overloading", "Method Overriding", "Encapsulation", "Templates"], ans: 1, exp: "Method Overriding achieves runtime polymorphism." },
  { id: 12, topic: "Aptitude", diff: "Easy", company: "TCS NQT", q: "A 150m train passes a pole in 15 seconds. Speed in km/hr?", options: ["30 km/hr", "36 km/hr", "45 km/hr", "54 km/hr"], ans: 1, exp: "Speed = 150/15 = 10 m/s = 10 * (18/5) = 36 km/hr." }
];

let questions = [...DEFAULT_QUESTIONS];
let userAnswers = {};      // Stores { questionId: optionIndex }
let bookmarks = [2, 5];    // Bookmarked Question IDs
let lastMockScore = null, mockTimer = null, mockSecondsLeft = 300, loaderInterval = null;
let mockQuestions = [], mockChoices = {};

// STAGE 1 & 2: INITIAL LOADING SCREEN -> CLICKABLE START SCREEN -> MAIN PORTAL
function runLoadingScreen() {
  const overlay = document.getElementById("splash-overlay");
  const loadBox = document.getElementById("loading-box");
  const startBox = document.getElementById("start-box");
  const fill = document.getElementById("loader-fill");
  const pctText = document.getElementById("loader-pct");

  overlay.classList.remove("hidden");
  loadBox.classList.remove("hidden");
  startBox.classList.add("hidden");

  let progress = 0;
  clearInterval(loaderInterval);
  loaderInterval = setInterval(() => {
    progress += 10;
    fill.style.width = `${progress}%`;
    pctText.textContent = `${progress}%`;
    if (progress >= 100) {
      clearInterval(loaderInterval);
      loadBox.classList.add("hidden");
      startBox.classList.remove("hidden");
    }
  }, CONFIG.loadingSpeedMs);
}

function enterMainPortal() {
  document.getElementById("splash-overlay").classList.add("hidden");
}

function replayLoadingScreen() {
  runLoadingScreen();
}

function initPortal() {
  document.getElementById("portal-title").textContent = CONFIG.portalTitle;
  document.getElementById("stat-cutoff-text").textContent = `Pass Cutoff: ${CONFIG.passCutoff}%`;
  document.getElementById("mock-scheme-text").textContent =
    `Marking: +${CONFIG.correctMarks} Correct, ${CONFIG.negativeMarks} Wrong • Auto-submits on timer end`;
  populateTopics();
  renderPractice();
  runLoadingScreen();
}

function populateTopics() {
  const topics = [...new Set(questions.map(q => q.topic))];
  const select = document.getElementById("topic-filter");
  const cur = select.value || "ALL";
  select.innerHTML = `<option value="ALL">All Topics (${questions.length})</option>` +
    topics.map(t => `<option value="${t}">${t}</option>`).join("");
  select.value = cur;
}

// Render Dashboard Stats, Topic Bars & Filtered Questions
function renderPractice() {
  const total = questions.length;
  const attempts = Object.keys(userAnswers).length;
  const correct = Object.entries(userAnswers).filter(([id, opt]) => {
    const q = questions.find(item => item.id === Number(id));
    return q && q.ans === opt;
  }).length;
  const pct = total ? Math.round((attempts / total) * 100) : 0;
  const acc = attempts ? Math.round((correct / attempts) * 100) : 0;

  document.getElementById("stat-solved").textContent = `${attempts} / ${total} (${pct}%)`;
  document.getElementById("stat-bar").style.width = `${pct}%`;
  document.getElementById("stat-accuracy").textContent = `${acc}%`;
  document.getElementById("stat-correct-text").textContent = `${correct} of ${attempts} correct`;
  document.getElementById("stat-bookmarks").textContent = bookmarks.length;
  if (lastMockScore !== null) document.getElementById("stat-mock-score").textContent = `${lastMockScore}%`;

  const topics = [...new Set(questions.map(q => q.topic))];
  document.getElementById("topic-bars").innerHTML = topics.map(t => {
    const tQs = questions.filter(q => q.topic === t);
    const tDone = tQs.filter(q => userAnswers[q.id] !== undefined).length;
    const tPct = Math.round((tDone / tQs.length) * 100);
    return `<div onclick="filterByTopic('${t}')" style="cursor:pointer; padding:8px; border:1px solid var(--border); border-radius:8px;">
      <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700;"><span>${t}</span><span>${tDone}/${tQs.length}</span></div>
      <div class="progress-track"><div class="progress-fill" style="width:${tPct}%"></div></div>
    </div>`;
  }).join("");

  const search = document.getElementById("search-input").value.toLowerCase();
  const topicF = document.getElementById("topic-filter").value;
  const diffF = document.getElementById("diff-filter").value;
  const statusF = document.getElementById("status-filter").value;

  const filtered = questions.filter(q => {
    if (topicF !== "ALL" && q.topic !== topicF) return false;
    if (diffF !== "ALL" && q.diff !== diffF) return false;
    if (statusF === "BOOKMARKED" && !bookmarks.includes(q.id)) return false;
    if (statusF === "SOLVED" && userAnswers[q.id] === undefined) return false;
    if (statusF === "UNSOLVED" && userAnswers[q.id] !== undefined) return false;
    return !search || `${q.q} ${q.topic} ${q.company}`.toLowerCase().includes(search);
  });

  const letters = ["A", "B", "C", "D"];
  document.getElementById("question-list").innerHTML = filtered.map(q => {
    const chosen = userAnswers[q.id];
    const starred = bookmarks.includes(q.id);
    return `<div class="card">
      <div class="q-header">
        <div><span class="badge">${q.topic}</span> <span class="badge ${q.diff}">${q.diff}</span> <span class="muted">🏢 ${q.company}</span></div>
        <button type="button" onclick="toggleBookmark(${q.id})">${starred ? "★ Bookmarked" : "☆ Bookmark"}</button>
      </div>
      <h4>Q${q.id}. ${q.q}</h4>
      <div class="options-grid">
        ${q.options.map((opt, i) => {
          let cls = "option-btn";
          if (chosen !== undefined) cls += (i === q.ans) ? " correct" : (i === chosen ? " wrong" : "");
          return `<button type="button" class="${cls}" onclick="answerQuestion(${q.id},${i})"><b>${letters[i]}.</b>${opt}</button>`;
        }).join("")}
      </div>
      ${chosen !== undefined ? `<div class="explanation">💡 <b>Explanation:</b> ${q.exp}</div>` : ""}
    </div>`;
  }).join("") || `<div class="card">No matching questions found.</div>`;
}

function answerQuestion(id, optIndex) { userAnswers[id] = optIndex; renderPractice(); }
function toggleBookmark(id) { bookmarks = bookmarks.includes(id) ? bookmarks.filter(b => b !== id) : [...bookmarks, id]; renderPractice(); }
function filterByTopic(topic) { document.getElementById("topic-filter").value = topic; renderPractice(); }
function resetProgress() { userAnswers = {}; renderPractice(); }
function toggleAddForm() { document.getElementById("add-form-box").classList.toggle("hidden"); }

function clearFilters() {
  document.getElementById("search-input").value = "";
  document.getElementById("topic-filter").value = "ALL";
  document.getElementById("diff-filter").value = "ALL";
  document.getElementById("status-filter").value = "ALL";
  renderPractice();
}

function addNewQuestion() {
  const qText = document.getElementById("new-q").value.trim();
  const options = [0, 1, 2, 3].map(i => document.getElementById(`opt-${i}`).value.trim());
  if (!qText || options.some(o => !o)) return;
  questions.unshift({
    id: questions.length + 1,
    topic: document.getElementById("new-topic").value,
    diff: document.getElementById("new-diff").value,
    company: document.getElementById("new-company").value || "Campus",
    q: qText, options,
    ans: Number(document.getElementById("new-ans").value),
    exp: document.getElementById("new-exp").value || "Added during live presentation."
  });
  document.getElementById("add-form-box").classList.add("hidden");
  populateTopics();
  renderPractice();
}

// Timed Mock Test & Score Calculation
function switchTab(tab) {
  document.getElementById("practice-section").classList.toggle("hidden", tab !== "practice");
  document.getElementById("mock-section").classList.toggle("hidden", tab !== "mock");
  document.getElementById("tab-practice").classList.toggle("active", tab === "practice");
  document.getElementById("tab-mock").classList.toggle("active", tab === "mock");
}

function startMockTest() {
  const topic = document.getElementById("mock-topic").value;
  const mins = Number(document.getElementById("mock-mins").value) || 5;
  mockQuestions = (topic === "ALL" ? questions : questions.filter(q => q.topic === topic)).slice(0, 6);
  mockChoices = {};
  mockSecondsLeft = mins * 60;
  document.getElementById("mock-result-box").classList.add("hidden");
  document.getElementById("submit-mock-btn").classList.remove("hidden");
  renderMockQuestions();
  updateTimerUI();
  clearInterval(mockTimer);
  mockTimer = setInterval(() => { mockSecondsLeft--; updateTimerUI(); if (mockSecondsLeft <= 0) submitMockTest(); }, 1000);
}

function updateTimerUI() {
  const m = String(Math.floor(Math.max(0, mockSecondsLeft) / 60)).padStart(2, "0");
  const s = String(Math.max(0, mockSecondsLeft) % 60).padStart(2, "0");
  const el = document.getElementById("timer-display");
  el.textContent = `${m}:${s}`;
  el.classList.toggle("low", mockSecondsLeft <= CONFIG.warningSeconds);
}

function renderMockQuestions() {
  const letters = ["A", "B", "C", "D"];
  document.getElementById("mock-questions-list").innerHTML = mockQuestions.map((q, idx) => `
    <div class="card">
      <div class="q-header"><span class="badge">Q${idx + 1} • ${q.topic}</span><span class="badge ${q.diff}">${q.diff}</span></div>
      <h4>${q.q}</h4>
      <div class="options-grid">
        ${q.options.map((opt, i) => `<button type="button" class="option-btn ${mockChoices[q.id] === i ? "selected" : ""}" onclick="selectMockOption(${q.id},${i})"><b>${letters[i]}.</b>${opt}</button>`).join("")}
      </div>
    </div>`).join("");
}

function selectMockOption(qId, optIdx) { mockChoices[qId] = optIdx; renderMockQuestions(); }

function submitMockTest() {
  clearInterval(mockTimer);
  document.getElementById("submit-mock-btn").classList.add("hidden");
  let score = 0, right = 0, wrong = 0;
  mockQuestions.forEach(q => {
    if (mockChoices[q.id] === undefined) return;
    if (mockChoices[q.id] === q.ans) { score += CONFIG.correctMarks; right++; userAnswers[q.id] = q.ans; }
    else { score += CONFIG.negativeMarks; wrong++; }
  });
  const maxScore = mockQuestions.length * CONFIG.correctMarks;
  const pct = maxScore ? Math.max(0, Math.round((score / maxScore) * 100)) : 0;
  lastMockScore = pct;
  const passed = pct >= CONFIG.passCutoff;
  const box = document.getElementById("mock-result-box");
  box.classList.remove("hidden");
  box.innerHTML = `<h3>${passed ? "✅ PASSED MOCK TEST" : "⚠️ NEEDS PRACTICE"} — Score: ${score} / ${maxScore} (${pct}%)</h3>
    <p class="muted">Correct: ${right} (+${right * CONFIG.correctMarks}) | Wrong: ${wrong} (${wrong * CONFIG.negativeMarks}) | Skipped: ${mockQuestions.length - right - wrong}</p>`;
  renderPractice();
}

function toggleTheme() { document.body.classList.toggle("dark"); }
window.addEventListener("DOMContentLoaded", initPortal);

