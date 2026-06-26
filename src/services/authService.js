import { supabase } from "../core/database/supabase";

export async function loginUser(username, password) {
  const { data, error } = await supabase.rpc("login_app_user", {
    input_username: username,
    input_password: password
  });

  if (error) throw error;

  return data;
}

export async function registerUser(username, password) {
  const { data, error } = await supabase.rpc("register_app_user", {
    input_username: username,
    input_password: password
  });

  if (error) throw error;

  return data;
}

export function saveSession(user) {
  localStorage.setItem(
    "fractal_user",
    JSON.stringify(user)
  );
}

export function getSession() {
  const session =
    localStorage.getItem("fractal_user");

  return session
    ? JSON.parse(session)
    : null;
}

export function logoutUser() {
  localStorage.removeItem(
    "fractal_user"
  );
}
