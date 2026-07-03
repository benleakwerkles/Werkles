export const roleLabels = {
  worker: "Worker / builder",
  operator: "Trade operator",
  capital: "Capital partner",
  hybrid: "Hybrid",
};

export const industryLabels = {
  plumbing: "Plumbing",
  hvac: "HVAC",
  electrical: "Electrical",
  contracting: "Contracting",
  logistics: "Logistics",
  auto: "Auto / diesel",
  services: "Local services",
};

export const skillLabels = {
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
  capital: "capital",
};

export const verificationTasks = [
  {
    id: "identity",
    title: "Identity",
    detail: "Confirm the person is real before intros move past a first conversation.",
  },
  {
    id: "funds",
    title: "Funds / capital",
    detail: "Confirm available capital claims before money becomes part of the plan.",
  },
  {
    id: "history",
    title: "Work history",
    detail: "Validate role, years, and relevant operating experience.",
  },
  {
    id: "license",
    title: "Licenses",
    detail: "Check trade licenses before matching around regulated work.",
  },
  {
    id: "references",
    title: "References",
    detail: "Collect reference signals before moving toward diligence.",
  },
];

export function money(value) {
  if (value === 0) return "$0";
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
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
    "operator:worker": 14,
  };
  return weights[pair] || 8;
}

function sharedCount(left, right) {
  const rightSet = new Set(right);
  return left.filter((item) => rightSet.has(item)).length;
}

export function scoreProfile(user, candidate) {
  const reasons = [];
  let score = 18;

  const roleScore = complementaryRoles(user.role, candidate.role);
  score += roleScore;
  if (roleScore >= 14) {
    reasons.push(`${roleLabels[user.role]} fits ${roleLabels[candidate.role].toLowerCase()}`);
  }

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

  const candidateCoversNeeds = sharedCount(
    candidate.skills,
    ["field", "license", "ops", "sales", "books", "admin"].filter((skill) => !user.skills.includes(skill))
  );
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
    reasons: reasons.slice(0, 5),
  };
}

export function filterMatches(profiles, user, { filter = "all", search = "" } = {}) {
  const normalizedSearch = search.toLowerCase();

  return profiles
    .map((profile) => scoreProfile(user, profile))
    .filter((profile) => filter === "all" || profile.role === filter)
    .filter((profile) => {
      if (!normalizedSearch) return true;
      const haystack = [
        profile.name,
        profile.city,
        roleLabels[profile.role],
        industryLabels[profile.industry],
        profile.summary,
        ...profile.skills.map((skill) => skillLabels[skill] || skill),
        ...profile.needs.map((skill) => skillLabels[skill] || skill),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    })
    .sort((left, right) => right.score - left.score);
}
