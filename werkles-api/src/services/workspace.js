import { filterMatches, verificationTasks } from "../domain/matching.js";
import { ensureWorkspace, getProfiles } from "../store/index.js";

export function getMatchingSnapshot(userId, query = {}) {
  const workspace = ensureWorkspace(userId);
  const user = {
    id: userId,
    name: "You",
    verified: workspace.proofChecks,
    ...workspace.profile,
  };

  const matches = filterMatches(getProfiles(), user, {
    filter: query.filter || "all",
    search: query.search || "",
  });

  return {
    user: {
      ...user,
      shortlist: workspace.shortlist,
      intros: workspace.intros,
    },
    matches,
    metrics: {
      workers: getProfiles().filter((profile) => profile.role === "worker").length,
      operators: getProfiles().filter((profile) => profile.role === "operator").length,
      capital: getProfiles().filter((profile) => profile.role === "capital").length,
      intros: workspace.intros.length,
    },
  };
}

export function updateUserProfile(userId, profilePatch) {
  const workspace = ensureWorkspace(userId);
  workspace.profile = { ...workspace.profile, ...profilePatch };
  return workspace.profile;
}

export function getProofStatus(userId) {
  const workspace = ensureWorkspace(userId);
  const completed = new Set(workspace.proofChecks);
  const percent = Math.round((completed.size / verificationTasks.length) * 100);

  return {
    checks: verificationTasks.map((task) => ({
      ...task,
      complete: completed.has(task.id),
    })),
    completed: workspace.proofChecks,
    percent,
    nextTask: verificationTasks.find((task) => !completed.has(task.id)) || null,
  };
}

export function setProofChecks(userId, checks) {
  const workspace = ensureWorkspace(userId);
  workspace.proofChecks = checks;
  return getProofStatus(userId);
}

export function getIntroQueue(userId) {
  const workspace = ensureWorkspace(userId);
  const profilesById = new Map(getProfiles().map((profile) => [profile.id, profile]));
  const snapshot = getMatchingSnapshot(userId);

  return workspace.intros
    .map((profileId) => profilesById.get(profileId))
    .filter(Boolean)
    .map((profile) => snapshot.matches.find((match) => match.id === profile.id) || profile);
}

export function addIntro(userId, profileId) {
  const workspace = ensureWorkspace(userId);
  if (!workspace.intros.includes(profileId)) {
    workspace.intros.push(profileId);
  }
  if (!workspace.shortlist.includes(profileId)) {
    workspace.shortlist.push(profileId);
  }
  return getIntroQueue(userId);
}

export function removeIntro(userId, profileId) {
  const workspace = ensureWorkspace(userId);
  workspace.intros = workspace.intros.filter((id) => id !== profileId);
  return getIntroQueue(userId);
}

export function clearIntros(userId) {
  const workspace = ensureWorkspace(userId);
  workspace.intros = [];
  return [];
}

export function toggleShortlist(userId, profileId) {
  const workspace = ensureWorkspace(userId);
  if (workspace.shortlist.includes(profileId)) {
    workspace.shortlist = workspace.shortlist.filter((id) => id !== profileId);
  } else {
    workspace.shortlist.push(profileId);
  }
  return workspace.shortlist;
}
