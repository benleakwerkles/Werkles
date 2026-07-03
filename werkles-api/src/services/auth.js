import {
  createSession,
  deleteSession,
  ensureWorkspace,
  getSession,
  getUserByEmail,
  getUserById,
} from "../store/index.js";

export function loginWithEmail(email) {
  const user = getUserByEmail(email);
  if (!user) {
    throw new Error("Unknown user in dry-run mode. Use demo@werkles.local");
  }

  const session = createSession(user.id);
  ensureWorkspace(user.id);

  return {
    token: session.token,
    expiresAt: session.expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
    },
  };
}

export function logout(token) {
  if (token) deleteSession(token);
  return { ok: true };
}

export function getAuthContext(token) {
  const session = getSession(token);
  if (!session) return null;

  const user = getUserById(session.userId);
  if (!user) return null;

  return {
    token,
    user,
    workspace: ensureWorkspace(user.id),
  };
}
