const LOGIN_URL = "http://localhost:8001"; // futuro microservicio de login

export async function login(username, password) {
  const res = await fetch(`${LOGIN_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}
