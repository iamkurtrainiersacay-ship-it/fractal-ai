import { supabase } from "../core/database/supabase";

const SESSION_KEY = "fractal_user";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export interface FractalSession {
  success?: boolean;
  user?: { id: string; username: string; is_super_admin?: boolean };
  username?: string;
  id?: string;
  is_super_admin?: boolean;
  _issued_at?: number;
  _expires_at?: number;
  [key: string]: unknown;
}

export async function loginUser(username: string, password: string): Promise<FractalSession> {
  const { data, error } = await supabase.rpc("login_app_user", {
    input_username: username,
    input_password: password
  });

  if (error) throw error;

  const session = data as FractalSession;

  const userId = session?.user?.id || session?.id;
  if (userId) {
    const { data: userRow } = await supabase
      .from("app_users")
      .select("is_super_admin")
      .eq("id", userId)
      .single();

    if (userRow) {
      if (session.user) {
        session.user.is_super_admin = userRow.is_super_admin || false;
      }
      session.is_super_admin = userRow.is_super_admin || false;
    }
  }

  return session;
}

export async function registerUser(username: string, password: string): Promise<FractalSession> {
  const { data, error } = await supabase.rpc("register_app_user", {
    input_username: username,
    input_password: password
  });

  if (error) throw error;
  return data as FractalSession;
}

export function saveSession(user: FractalSession): void {
  const payload = {
    ...user,
    _issued_at: Date.now(),
    _expires_at: Date.now() + SESSION_TTL_MS
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export function getSession(): FractalSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session: FractalSession = JSON.parse(raw);
    if (session._expires_at && Date.now() > session._expires_at) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function refreshSession(): FractalSession | null {
  const session = getSession();
  if (!session) return null;
  session._expires_at = Date.now() + SESSION_TTL_MS;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logoutUser(): void {
  localStorage.removeItem(SESSION_KEY);
}
