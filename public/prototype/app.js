const profiles = [
  {
    id: "nate-morales",
    name: "Nate Morales",
    role: "operator",
    industry: "plumbing",
    city: "Cleveland, OH",
    capitalNeeded: 45000,
    capitalAvailable: 5000,
    years: 12,
    skills: ["field", "license", "estimating", "customers"],
    needs: ["sales", "admin", "books", "capital"],
    goals: ["leave", "start", "partner"],
    verified: ["identity", "history", "license", "references"],
    summary: "Licensed service plumber with a repeat customer list. Wants a partner who can sell, schedule, and help fund the first trucks."
  },
  {
    id: "dana-cole",
    name: "Dana Cole",
    role: "worker",
    industry: "logistics",
    city: "Akron, OH",
    capitalNeeded: 20000,
    capitalAvailable: 0,
    years: 9,
    skills: ["ops", "hiring", "admin", "field"],
    needs: ["capital", "sales", "books"],
    goals: ["leave", "equity", "partner"],
    verified: ["identity", "history", "references"],
    summary: "Warehouse floor lead who trains crews, fixes broken processes, and wants an equity path instead of another promotion promise."
  },
  {
    id: "imara-singh",
    name: "Imara Singh",
    role: "worker",
    industry: "hvac",
    city: "Cleveland, OH",
    capitalNeeded: 15000,
    capitalAvailable: 8000,
    years: 7,
    skills: ["sales", "admin", "customers", "estimating"],
    needs: ["license", "field", "capital"],
    goals: ["start", "partner", "equity"],
    verified: ["identity", "history"],
    summary: "HVAC dispatcher and inside sales closer. Knows the seasonal call flow and wants to pair with a licensed tech."
  },
  {
    id: "victor-price",
    name: "Victor Price",
    role: "operator",
    industry: "electrical",
    city: "Toledo, OH",
    capitalNeeded: 70000,
    capitalAvailable: 15000,
    years: 15,
    skills: ["field", "license", "estimating", "equipment"],
    needs: ["sales", "admin", "capital"],
    goals: ["buy", "scale", "partner"],
    verified: ["identity", "funds", "history", "license"],
    summary: "Master electrician looking at a retiring owner's book of small commercial accounts. Needs closing capital and back-office help."
  },
  {
    id: "mayra-lopez",
    name: "Mayra Lopez",
    role: "worker",
    industry: "services",
    city: "Detroit, MI",
    capitalNeeded: 10000,
    capitalAvailable: 10000,
    years: 11,
    skills: ["books", "admin", "ops", "hiring"],
    needs: ["field", "sales", "license"],
    goals: ["equity", "partner", "scale"],
    verified: ["identity", "funds", "history", "references"],
    summary: "Back-office manager for a local services company. Can clean up books, payroll, permits, scheduling, and vendor chaos."
  },
  {
    id: "sean-brooks",
    name: "Sean Brooks",
    role: "capital",
    industry: "contracting",
    city: "Cincinnati, OH",
    capitalNeeded: 0,
    capitalAvailable: 85000,
    years: 6,
    skills: ["capital", "sales", "books", "admin"],
    needs: ["field", "license", "estimating"],
    goals: ["start", "buy", "partner"],
    verified: ["identity", "funds", "references"],
    summary: "Small investor with home-service sales experience. Wants a real operator, not a passive paper deal."
  },
  {
    id: "anton-bell",
    name: "Anton Bell",
    role: "operator",
    industry: "auto",
    city: "Youngstown, OH",
    capitalNeeded: 35000,
    capitalAvailable: 4000,
    years: 13,
    skills: ["field", "equipment", "customers", "estimating"],
    needs: ["capital", "books", "admin"],
    goals: ["leave", "start", "partner"],
    verified: ["identity", "history", "references"],
    summary: "Diesel mechanic with fleet contacts and diagnostic equipment. Wants a shop partner who can handle billing and startup cash."
  },
  {
    id: "erica-henson",
    name: "Erica Henson",
    role: "hybrid",
    industry: "contracting",
    city: "Columbus, OH",
    capitalNeeded: 30000,
    capitalAvailable: 40000,
    years: 14,
    skills: ["ops", "hiring", "sales", "admin", "capital"],
    needs: ["license", "field", "estimating"],
    goals: ["scale", "buy", "partner"],
    verified: ["identity", "funds", "history", "references"],
    summary: "Former regional contractor exec with capital and systems experience. Looking for overlooked crews ready to own more of the upside."
  },
  {
    id: "malik-porter",
    name: "Malik Porter",
    role: "worker",
    industry: "plumbing",
    city: "Canton, OH",
    capitalNeeded: 12000,
    capitalAvailable: 2000,
    years: 5,
    skills: ["field", "customers", "equipment"],
    needs: ["license", "capital", "admin"],
    goals: ["leave", "equity", "partner"],
    verified: ["identity", "history"],
    summary: "Service tech with weekend side jobs and a loyal neighborhood customer base. Wants to level up without getting buried by debt."
  }
];

const roleLabels = {
  worker: "Worker / builder",
  operator: "Trade operator",
  capital: "Capital partner",
  hybrid: "Hybrid"
};

const industryLabels = {
  plumbing: "Plumbing",
  hvac: "HVAC",
  electrical: "Electrical",
  contracting: "Contracting",
  logistics: "Logistics",
  auto: "Auto / diesel",
  services: "Local services"
};

const skillLabels = {
  field: "field work",
  license: "license",
  sales: "sales",
  ops: "operations",
  admin: "admin",
  hiring: "hiring",
  books: "books",
  estimating: "estimating",
  customers: "customer base",
  equipment: "equipment",
  capital: "capital"
};

const state = {
  view: "matches",
  filter: "all",
  search: "",
  shortlist: new Set(),
  intros: new Set(),
  apiConnected: false,
  billingMode: "offline",
};

const api = window.WerklesApi;
const loginButton = document.querySelector("#loginButton");

function applyWorkspace(workspace) {
  if (!workspace) return;

  state.shortlist = new Set(workspace.shortlist || []);
  state.intros = new Set(workspace.intros || []);

  if (workspace.profile) {
    roleInput.value = workspace.profile.role || roleInput.value;
    industryInput.value = workspace.profile.industry || industryInput.value;
    locationInput.value = workspace.profile.city || locationInput.value;
    radiusInput.value = workspace.profile.radius ?? radiusInput.value;
    capitalAvailableInput.value = workspace.profile.capitalAvailable ?? capitalAvailableInput.value;
    capitalNeededInput.value = workspace.profile.capitalNeeded ?? capitalNeededInput.value;

    document.querySelectorAll('input[name="skills"]').forEach((input) => {
      input.checked = (workspace.profile.skills || []).includes(input.value);
    });
    document.querySelectorAll('input[name="goals"]').forEach((input) => {
      input.checked = (workspace.profile.goals || []).includes(input.value);
    });
  }

  if (workspace.proofChecks) {
    document.querySelectorAll('input[name="verify"]').forEach((input) => {
      input.checked = workspace.proofChecks.includes(input.value);
    });
  }
}

function renderAuthChip() {
  if (!loginButton) return;

  if (state.apiConnected && api.user) {
    loginButton.textContent = api.user.name || api.user.email;
    loginButton.classList.add("is-connected");
    loginButton.title = "Connected to local Werkles API";
    return;
  }

  loginButton.textContent = "Sign in";
  loginButton.classList.remove("is-connected");
  loginButton.title = "Connect to local Werkles API";
}

async function syncProfileToApi() {
  if (!state.apiConnected) return;
  await api.updateProfile(getUserProfile());
}

async function refreshFromApi() {
  if (!state.apiConnected) return;

  const snapshot = await api.getMatchingSnapshot({
    filter: state.filter,
    search: state.search,
  });

  applyWorkspace({
    shortlist: snapshot.user.shortlist,
    intros: snapshot.user.intros,
    proofChecks: snapshot.user.verified,
    profile: snapshot.user,
  });

  return snapshot;
}

async function bootstrapApi() {
  try {
    await api.connect();
    if (api.token) {
      await api.restoreSession();
    } else {
      await api.login("demo@werkles.local");
    }
    state.apiConnected = true;
    await refreshFromApi();
    renderAuthChip();
    render();
  } catch (_error) {
    state.apiConnected = false;
    renderAuthChip();
  }
}
const form = document.querySelector("#profileForm");
const roleInput = document.querySelector("#role");
const industryInput = document.querySelector("#industry");
const locationInput = document.querySelector("#location");
const radiusInput = document.querySelector("#radius");
const capitalAvailableInput = document.querySelector("#capitalAvailable");
const capitalNeededInput = document.querySelector("#capitalNeeded");
const capitalAvailableValue = document.querySelector("#capitalAvailableValue");
const capitalNeededValue = document.querySelector("#capitalNeededValue");
const matchList = document.querySelector("#matchList");
const introQueue = document.querySelector("#introQueue");
const trustFill = document.querySelector("#trustFill");
const trustPercent = document.querySelector("#trustPercent");
const verifiedCount = document.querySelector("#verifiedCount");
const searchInput = document.querySelector("#searchInput");
const graph = document.querySelector("#matchGraph");
const graphContext = graph.getContext("2d");
const navButtons = document.querySelectorAll("[data-view]");
const matchEyebrow = document.querySelector("#matchEyebrow");
const matchTitle = document.querySelector("#matchTitle");
const toolbarActions = document.querySelector("#toolbarActions");
const metricStrip = document.querySelector("#metricStrip");
const viewBrief = document.querySelector("#viewBrief");

const verificationTasks = [
  {
    id: "identity",
    title: "Identity",
    detail: "Confirm the person is real before intros move past a first conversation."
  },
  {
    id: "funds",
    title: "Funds / capital",
    detail: "Confirm available capital claims before money becomes part of the plan."
  },
  {
    id: "history",
    title: "Work history",
    detail: "Validate role, years, and relevant operating experience."
  },
  {
    id: "license",
    title: "Licenses",
    detail: "Check trade licenses before matching around regulated work."
  },
  {
    id: "references",
    title: "References",
    detail: "Collect reference signals before moving toward diligence."
  }
];

function money(value) {
  if (value === 0) return "$0";
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

function selectedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
}

function getUserProfile() {
  return {
    id: "you",
    name: "You",
    role: roleInput.value,
    industry: industryInput.value,
    city: locationInput.value.trim(),
    radius: Number(radiusInput.value || 0),
    capitalAvailable: Number(capitalAvailableInput.value),
    capitalNeeded: Number(capitalNeededInput.value),
    skills: selectedValues("skills"),
    goals: selectedValues("goals"),
    verified: selectedValues("verify")
  };
}

function sameState(left, right) {
  const leftState = left.split(",").pop()?.trim().toLowerCase();
  const rightState = right.split(",").pop()?.trim().toLowerCase();
  return Boolean(leftState && rightState && leftState === rightState);
}

function complementaryRoles(userRole, candidateRole) {
  if (userRole === "hybrid" || candidateRole === "hybrid") return 17;
  if (userRole === candidateRole) return userRole === "worker" ? 8 : 6;
  const pair = [userRole, candidateRole].sort().join(":");
  const weights = {
    "capital:operator": 20,
    "capital:worker": 16,
    "operator:worker": 14
  };
  return weights[pair] || 8;
}

function sharedCount(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

function scoreProfile(user, candidate) {
  const reasons = [];
  let score = 18;

  const roleScore = complementaryRoles(user.role, candidate.role);
  score += roleScore;
  if (roleScore >= 14) reasons.push(`${roleLabels[user.role]} fits ${roleLabels[candidate.role].toLowerCase()}`);

  if (user.industry === candidate.industry) {
    score += 18;
    reasons.push(`same arena: ${industryLabels[user.industry]}`);
  }

  if (sameState(user.city, candidate.city)) {
    score += 10;
    reasons.push("same-state reach");
  }

  const userCoversNeeds = sharedCount(user.skills, candidate.needs);
  if (userCoversNeeds > 0) {
    score += Math.min(22, userCoversNeeds * 7);
    reasons.push(`you cover ${userCoversNeeds} need${userCoversNeeds > 1 ? "s" : ""}`);
  }

  const candidateCoversNeeds = sharedCount(candidate.skills, ["field", "license", "ops", "sales", "books", "admin"].filter((skill) => !user.skills.includes(skill)));
  if (candidateCoversNeeds > 0) {
    score += Math.min(12, candidateCoversNeeds * 4);
    reasons.push("complementary skill stack");
  }

  const sharedGoals = sharedCount(user.goals, candidate.goals);
  if (sharedGoals > 0) {
    score += Math.min(12, sharedGoals * 4);
    reasons.push(`${sharedGoals} shared outcome${sharedGoals > 1 ? "s" : ""}`);
  }

  if (candidate.capitalNeeded > 0 && user.capitalAvailable >= candidate.capitalNeeded) {
    score += 16;
    reasons.push(`your ${money(user.capitalAvailable)} can fund the ask`);
  } else if (candidate.capitalNeeded > 0 && user.capitalAvailable >= candidate.capitalNeeded * 0.5) {
    score += 8;
    reasons.push("partial capital fit");
  }

  if (user.capitalNeeded > 0 && candidate.capitalAvailable >= user.capitalNeeded) {
    score += 14;
    reasons.push("candidate can fund your ask");
  }

  if (candidate.verified.length >= 4) {
    score += 7;
    reasons.push("strong verification");
  } else if (candidate.verified.length >= 2) {
    score += 4;
    reasons.push("basic verification");
  }

  return {
    ...candidate,
    score: Math.max(1, Math.min(99, Math.round(score))),
    reasons: reasons.slice(0, 5)
  };
}

function getFilteredMatches() {
  const user = getUserProfile();
  const search = state.search.toLowerCase();

  return profiles
    .map((profile) => scoreProfile(user, profile))
    .filter((profile) => state.filter === "all" || profile.role === state.filter)
    .filter((profile) => {
      if (!search) return true;
      const haystack = [
        profile.name,
        profile.city,
        roleLabels[profile.role],
        industryLabels[profile.industry],
        profile.summary,
        ...profile.skills.map((skill) => skillLabels[skill] || skill),
        ...profile.needs.map((skill) => skillLabels[skill] || skill)
      ].join(" ").toLowerCase();
      return haystack.includes(search);
    })
    .sort((left, right) => right.score - left.score);
}

function initials(name) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function renderMatches() {
  const matches = getFilteredMatches();

  matchList.innerHTML = matches
    .map((profile) => {
      const shortlisted = state.shortlist.has(profile.id);
      const queued = state.intros.has(profile.id);
      const visibleSkills = profile.skills.slice(0, 4).map((skill) => `<span class="tag">${skillLabels[skill] || skill}</span>`).join("");
      const verified = profile.verified.length >= 3 ? `<span class="verified-tag">${profile.verified.length} checks</span>` : "";
      const reasons = profile.reasons.map((reason) => `<li>${reason}</li>`).join("");

      return `
        <article class="match-card" data-role="${profile.role}">
          <div>
            <div class="match-header">
              <span class="avatar ${profile.role}" aria-hidden="true">${initials(profile.name)}</span>
              <div>
                <h3>${profile.name}</h3>
                <div class="profile-meta">
                  <span class="tag">${roleLabels[profile.role]}</span>
                  <span class="tag">${industryLabels[profile.industry]}</span>
                  <span class="tag">${profile.city}</span>
                  ${verified}
                </div>
              </div>
            </div>
            <p class="match-summary">${profile.summary}</p>
            <div class="profile-meta">${visibleSkills}</div>
            <ul class="reason-list">${reasons}</ul>
          </div>
          <div class="score-box">
            <span class="score">${profile.score}%</span>
            <div class="card-actions">
              <button class="save-button ${shortlisted ? "is-added" : ""}" type="button" data-save="${profile.id}" title="Shortlist ${profile.name}" aria-label="Shortlist ${profile.name}">${shortlisted ? "Saved" : "+"}</button>
              <button class="intro-button ${queued ? "is-added" : ""}" type="button" data-intro="${profile.id}">${queued ? "Intro queued" : "Request intro"}</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  if (!matches.length) {
    matchList.innerHTML = `<div class="intro-queue empty">No matches found for that search.</div>`;
  }

  drawGraph(matches.slice(0, 5));
}

function renderIntroWorkspace() {
  const user = getUserProfile();
  const queued = profiles
    .filter((profile) => state.intros.has(profile.id))
    .map((profile) => scoreProfile(user, profile))
    .sort((left, right) => right.score - left.score);

  if (!queued.length) {
    matchList.innerHTML = `
      <div class="intro-queue empty">
        No intros queued yet. Go back to Matches, shortlist promising partners, then request an intro when the fit looks real.
      </div>
    `;
    drawGraph([]);
    return;
  }

  matchList.innerHTML = queued
    .map((profile) => {
      const capitalGap = Math.max(0, profile.capitalNeeded - user.capitalAvailable);
      const missingChecks = verificationTasks
        .filter((task) => !profile.verified.includes(task.id))
        .slice(0, 2)
        .map((task) => `<span class="tag">${task.title}</span>`)
        .join("");
      const reasons = profile.reasons.map((reason) => `<li>${reason}</li>`).join("");

      return `
        <article class="match-card" data-role="${profile.role}">
          <div>
            <div class="match-header">
              <span class="avatar ${profile.role}" aria-hidden="true">${initials(profile.name)}</span>
              <div>
                <h3>${profile.name}</h3>
                <div class="profile-meta">
                  <span class="tag">${roleLabels[profile.role]}</span>
                  <span class="tag">${industryLabels[profile.industry]}</span>
                  <span class="tag">${profile.city}</span>
                </div>
              </div>
            </div>
            <p class="match-summary">${profile.summary}</p>
            <ul class="reason-list">${reasons}</ul>
            <div class="profile-meta">
              <span class="verified-tag">${profile.verified.length}/5 verified</span>
              <span class="tag">Capital gap: ${money(capitalGap)}</span>
              ${missingChecks}
            </div>
          </div>
          <div class="score-box">
            <span class="score">${profile.score}%</span>
            <div class="card-actions">
              <button class="save-button is-added" type="button" data-intro="${profile.id}" title="Remove ${profile.name}" aria-label="Remove ${profile.name}">x</button>
              <button class="intro-button is-added" type="button" data-view="verify">Check readiness</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  drawGraph(queued.slice(0, 5));
}

function renderVerifyWorkspace() {
  const checked = new Set(selectedValues("verify"));
  const percent = Math.round((checked.size / verificationTasks.length) * 100);
  const queued = profiles.filter((profile) => state.intros.has(profile.id));
  const nextTask = verificationTasks.find((task) => !checked.has(task.id));

  matchList.innerHTML = `
    <article class="match-card" data-role="hybrid">
      <div>
        <div class="match-header">
          <span class="avatar hybrid" aria-hidden="true">${percent}%</span>
          <div>
            <h3>Verification readiness</h3>
            <div class="profile-meta">
              <span class="verified-tag">${checked.size}/${verificationTasks.length} checks complete</span>
              <span class="tag">${queued.length} queued intro${queued.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </div>
        <p class="match-summary">
          ${nextTask ? `Next useful proof: ${nextTask.title}. ${nextTask.detail}` : "Ready for a guarded first conversation. Keep legal, lending, securities, and ownership documents outside the prototype."}
        </p>
      </div>
      <div class="score-box">
        <span class="score">${percent}%</span>
      </div>
    </article>
    ${verificationTasks
      .map((task) => `
        <article class="match-card" data-role="${checked.has(task.id) ? "worker" : "operator"}">
          <div>
            <div class="match-header">
              <span class="avatar ${checked.has(task.id) ? "worker" : "operator"}" aria-hidden="true">${checked.has(task.id) ? "OK" : "DO"}</span>
              <div>
                <h3>${task.title}</h3>
                <div class="profile-meta">
                  <span class="${checked.has(task.id) ? "verified-tag" : "tag"}">${checked.has(task.id) ? "complete" : "needed"}</span>
                </div>
              </div>
            </div>
            <p class="match-summary">${task.detail}</p>
          </div>
          <div class="score-box">
            <button class="intro-button ${checked.has(task.id) ? "is-added" : ""}" type="button" data-verify-toggle="${task.id}">
              ${checked.has(task.id) ? "Mark open" : "Mark done"}
            </button>
          </div>
        </article>
      `)
      .join("")}
  `;

  drawGraph(queued.map((profile) => scoreProfile(getUserProfile(), profile)).slice(0, 5));
}

function renderMetrics() {
  document.querySelector("#workerCount").textContent = profiles.filter((profile) => profile.role === "worker").length;
  document.querySelector("#operatorCount").textContent = profiles.filter((profile) => profile.role === "operator").length;
  document.querySelector("#capitalCount").textContent = profiles.filter((profile) => profile.role === "capital").length;
  document.querySelector("#introCount").textContent = state.intros.size;
}

function renderTrust() {
  const verified = selectedValues("verify");
  const percent = Math.round((verified.length / 5) * 100);
  trustFill.style.width = `${percent}%`;
  trustPercent.textContent = `${percent}%`;
  verifiedCount.textContent = `${verified.length}/5`;
}

function renderIntroQueue() {
  const queued = profiles.filter((profile) => state.intros.has(profile.id));

  if (!queued.length) {
    introQueue.className = "intro-queue empty";
    introQueue.textContent = "No intro requests yet.";
    return;
  }

  introQueue.className = "intro-queue";
  introQueue.innerHTML = queued
    .map((profile) => `
      <div class="intro-item">
        <span class="mini-avatar">${initials(profile.name)}</span>
        <span>
          <strong>${profile.name}</strong>
          <small>${roleLabels[profile.role]} / ${industryLabels[profile.industry]}</small>
        </span>
      </div>
    `)
    .join("");
}

function setView(view) {
  state.view = view;
  navButtons.forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  render();
}

function renderWorkspaceChrome() {
  const viewCopy = {
    matches: {
      eyebrow: "Live Matching",
      title: "People ready to build",
      brief: ""
    },
    intros: {
      eyebrow: "Intro Desk",
      title: "Queued conversations",
      brief: "Use this view to pressure-test whether a requested intro has enough fit, capital clarity, and verification signal to be worth the next conversation."
    },
    verify: {
      eyebrow: "Trust Work",
      title: "Proof before pressure",
      brief: "These are local prototype readiness checks. Anything involving legal, lending, securities, ownership, identity vendors, or production data still needs the proper human gate."
    }
  };

  const copy = viewCopy[state.view];
  matchEyebrow.textContent = copy.eyebrow;
  matchTitle.textContent = copy.title;
  toolbarActions.hidden = state.view !== "matches";
  metricStrip.hidden = state.view === "verify";
  viewBrief.hidden = !copy.brief;
  viewBrief.textContent = copy.brief;
}

function drawGraph(matches) {
  const width = graph.width;
  const height = graph.height;
  graphContext.clearRect(0, 0, width, height);
  graphContext.fillStyle = "#fffaf0";
  graphContext.fillRect(0, 0, width, height);

  graphContext.strokeStyle = "#ded6c7";
  graphContext.lineWidth = 1;
  for (let x = 40; x < width; x += 80) {
    graphContext.beginPath();
    graphContext.moveTo(x, 0);
    graphContext.lineTo(x, height);
    graphContext.stroke();
  }
  for (let y = 40; y < height; y += 80) {
    graphContext.beginPath();
    graphContext.moveTo(0, y);
    graphContext.lineTo(width, y);
    graphContext.stroke();
  }

  const center = { x: width / 2, y: height / 2 };
  graphContext.fillStyle = "#17202a";
  graphContext.beginPath();
  graphContext.arc(center.x, center.y, 27, 0, Math.PI * 2);
  graphContext.fill();
  graphContext.fillStyle = "#fffdf8";
  graphContext.font = "900 13px Inter, sans-serif";
  graphContext.textAlign = "center";
  graphContext.textBaseline = "middle";
  graphContext.fillText("YOU", center.x, center.y);

  const roleColors = {
    worker: "#19715f",
    operator: "#2156a5",
    capital: "#b58a1f",
    hybrid: "#a3314e"
  };

  matches.forEach((match, index) => {
    const angle = -Math.PI / 2 + index * ((Math.PI * 2) / Math.max(matches.length, 5));
    const distance = 54 + (99 - match.score) * 1.25;
    const x = center.x + Math.cos(angle) * distance;
    const y = center.y + Math.sin(angle) * distance;

    graphContext.strokeStyle = "rgba(23, 32, 42, 0.25)";
    graphContext.lineWidth = Math.max(2, match.score / 24);
    graphContext.beginPath();
    graphContext.moveTo(center.x, center.y);
    graphContext.lineTo(x, y);
    graphContext.stroke();

    graphContext.fillStyle = roleColors[match.role] || "#17202a";
    graphContext.beginPath();
    graphContext.arc(x, y, 20, 0, Math.PI * 2);
    graphContext.fill();
    graphContext.fillStyle = "#fffdf8";
    graphContext.font = "900 11px Inter, sans-serif";
    graphContext.fillText(initials(match.name), x, y);
  });
}

function render() {
  capitalAvailableValue.textContent = money(Number(capitalAvailableInput.value));
  capitalNeededValue.textContent = money(Number(capitalNeededInput.value));
  renderWorkspaceChrome();
  renderTrust();
  renderMetrics();
  renderIntroQueue();
  if (state.view === "matches") {
    renderMatches();
  } else if (state.view === "intros") {
    renderIntroWorkspace();
  } else {
    renderVerifyWorkspace();
  }
}

form.addEventListener("input", () => {
  render();
  syncProfileToApi();
});

document.querySelector(".verification-list").addEventListener("input", async () => {
  render();
  if (state.apiConnected) {
    await api.setProofChecks(selectedValues("verify"));
  }
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  render();
});

document.querySelector(".segment-control").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  state.filter = button.dataset.filter;
  document.querySelectorAll(".segment").forEach((segment) => segment.classList.toggle("is-active", segment === button));
  render();
});

document.querySelector(".topnav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  setView(button.dataset.view);
});

matchList.addEventListener("click", async (event) => {
  const verifyButton = event.target.closest("[data-verify-toggle]");
  if (verifyButton) {
    const input = document.querySelector(`input[name="verify"][value="${verifyButton.dataset.verifyToggle}"]`);
    if (input) input.checked = !input.checked;
    render();
    if (state.apiConnected) {
      await api.setProofChecks(selectedValues("verify"));
    }
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const button = event.target.closest("[data-intro], [data-save]");
  if (!button) return;

  if (button.dataset.save) {
    const id = button.dataset.save;
    if (state.apiConnected) {
      const result = await api.toggleShortlist(id);
      state.shortlist = new Set(result.shortlist);
    } else if (state.shortlist.has(id)) {
      state.shortlist.delete(id);
    } else {
      state.shortlist.add(id);
    }
  } else {
    const id = button.dataset.intro;
    if (state.apiConnected) {
      if (state.intros.has(id)) {
        const result = await api.removeIntro(id);
        state.intros = new Set(result.intros.map((profile) => profile.id));
      } else {
        const result = await api.addIntro(id);
        state.intros = new Set(result.intros.map((profile) => profile.id));
        state.shortlist.add(id);
      }
    } else if (state.intros.has(id)) {
      state.intros.delete(id);
    } else {
      state.intros.add(id);
      state.shortlist.add(id);
    }
  }
  render();
});

document.querySelector("#clearIntros").addEventListener("click", async () => {
  if (state.apiConnected) {
    await api.clearIntros();
  }
  state.intros.clear();
  render();
});

if (loginButton) {
  loginButton.addEventListener("click", async () => {
    if (state.apiConnected) {
      const billing = await api.getBillingStatus();
      state.billingMode = billing.mode;
      alert(
        billing.mode === "dry-run"
          ? "Connected to local API. Stripe checkout is dry-run only until billing gate clears."
          : "Connected to local Werkles API."
      );
      return;
    }

    await bootstrapApi();
  });
}

render();
bootstrapApi();
