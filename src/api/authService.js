import axios from "axios";

export const register = (user) => {
  return axios.post("http://localhost:8001/auth/register", user); // /auth si pusiste router.include con /auth
};

export const login = (user) => {
  return axios.post("http://localhost:8001/auth/login", user);
};
