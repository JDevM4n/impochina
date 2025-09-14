export async function login(username, password) {
  const res = await fetch(`http://localhost:8001/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}
