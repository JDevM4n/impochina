// sourcing/api/src/state.js

// ---- Estado del request (en memoria) ----
const store = new Map(); // requestId -> state

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

// ---- Resultados del request (en memoria) ----
const resultsStore = new Map(); // requestId -> items[]

export function setResults(requestId, items) {
  resultsStore.set(requestId, items);
}

export function getResults(requestId) {
  return resultsStore.get(requestId) || [];
}
