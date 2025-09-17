// sourcing/api/src/state.js

// Mapa en memoria: requestId -> estado
const store = new Map();

export const Status = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
};

export function initPending(requestId, message = "Scrape job encolado") {
  const now = new Date().toISOString();
  const state = {
    requestId,
    status: Status.PENDING,
    message,
    createdAt: now,
    updatedAt: now,
  };
  store.set(requestId, state);
  return state;
}

export function getStatus(requestId) {
  return store.get(requestId) || null;
}

export function updateStatus(requestId, status, { message, error } = {}) {
  const s = store.get(requestId);
  if (!s) return null;
  s.status = status;
  s.updatedAt = new Date().toISOString();
  if (message !== undefined) s.message = message;
  if (error !== undefined) s.error = error;
  store.set(requestId, s);
  return s;
}
