const MICROSERVICE2_URL = "http://localhost:8000";

export async function getNotifications() {
  const res = await fetch(`${MICROSERVICE2_URL}/notifications`);
  return res.json();
}
