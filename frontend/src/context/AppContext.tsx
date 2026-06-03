import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useAccount } from "wagmi";

/* ─── Types ─── */
interface UserInfo {
  id: string;
  email: string;
  displayName: string;
  smartWallet: string; // derived from user id
}

interface AppState {
  // Email auth (Smart Wallet mode)
  user: UserInfo | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<string>; // returns private_key
  logout: () => void;

  // Wallet connection (BYO mode) — RainbowKit handles connect/disconnect
  byoAddress: string | undefined;
  isByoConnected: boolean;

  // Unified
  walletAddress: string | null;
  walletType: "smart" | "byo" | null;
  isAuthenticated: boolean;
}

const AppContext = createContext<AppState | null>(null);

/* ─── Helpers ─── */
function saveSession(token: string, user: UserInfo) {
  localStorage.setItem("pp_token", token);
  localStorage.setItem("pp_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("pp_token");
  localStorage.removeItem("pp_user");
}

function loadSession(): { token: string | null; user: UserInfo | null } {
  try {
    const token = localStorage.getItem("pp_token");
    const raw = localStorage.getItem("pp_user");
    if (token && raw) return { token, user: JSON.parse(raw) };
  } catch {}
  return { token: null, user: null };
}

/* ─── Provider ─── */
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => loadSession().user);
  const [token, setToken] = useState<string | null>(() => loadSession().token);

  // BYO wallet via wagmi (RainbowKit handles connect/disconnect UI)
  const { address: byoAddress, isConnected: isByoConnected } = useAccount();

  // Email auth (backend with database)
  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Login failed");
    }
    const data = await res.json();
    const u: UserInfo = { id: data.user.id, email: data.user.email, displayName: data.user.display_name, smartWallet: data.user.smart_wallet };
    setUser(u);
    setToken(data.token);
    saveSession(data.token, u);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string): Promise<string> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name: name || email.split("@")[0] }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Registration failed");
    }
    const data = await res.json();
    const u: UserInfo = { id: data.user.id, email: data.user.email, displayName: data.user.display_name, smartWallet: data.user.smart_wallet };
    setUser(u);
    setToken(data.token);
    saveSession(data.token, u);
    return data.private_key; // Returned once — caller must display to user
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearSession();
  }, []);

  // Determine unified wallet
  const walletAddress = isByoConnected && byoAddress ? byoAddress : user?.smartWallet ?? null;
  const walletType = isByoConnected && byoAddress ? "byo" : user ? "smart" : null;
  const isAuthenticated = !!user;

  // Verify token against backend on mount
  useEffect(() => {
    const saved = loadSession();
    const t = saved.token;
    if (t) {
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("expired");
          return res.json();
        })
        .then((data) => {
          const u: UserInfo = { id: data.user.id, email: data.user.email, displayName: data.user.display_name, smartWallet: data.user.smart_wallet };
          setUser(u);
          setToken(t);
          saveSession(t, u);
        })
        .catch(() => clearSession());
    }
  }, []);

  return (
    <AppContext.Provider value={{
      user, token, login, register, logout,
      byoAddress, isByoConnected,
      walletAddress, walletType, isAuthenticated,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
