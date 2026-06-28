import { getSession } from "./authService";
import { updateUserOnlineStatus, logSession } from "./adminService";

const SESSION_START_KEY = "fractal_session_start";
const HEARTBEAT_INTERVAL = 60000;

let heartbeatTimer = null;

export function startSessionTracking() {
  const session = getSession();
  if (!session) return;

  const userId = session.user?.id || session.id;
  const username = session.user?.username || session.username || "Unknown";

  localStorage.setItem(SESSION_START_KEY, Date.now().toString());

  updateUserOnlineStatus(userId, true);
  logSession(userId, username, "session_start");

  heartbeatTimer = setInterval(() => {
    updateUserOnlineStatus(userId, true);
  }, HEARTBEAT_INTERVAL);

  window.addEventListener("beforeunload", () => {
    endSessionTracking();
  });
}

export function endSessionTracking() {
  const session = getSession();
  if (!session) return;

  const userId = session.user?.id || session.id;
  const username = session.user?.username || session.username || "Unknown";

  const startStr = localStorage.getItem(SESSION_START_KEY);
  const durationMs = startStr ? Date.now() - Number(startStr) : 0;
  const durationMin = Math.round(durationMs / 60000);

  updateUserOnlineStatus(userId, false);
  logSession(userId, username, "session_end", {
    duration_minutes: durationMin
  });

  localStorage.removeItem(SESSION_START_KEY);

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export function getSessionDuration() {
  const startStr = localStorage.getItem(SESSION_START_KEY);
  if (!startStr) return "0m";

  const elapsed = Date.now() - Number(startStr);
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
