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
  register: (email: string, password: string, name?: string) => Promise<void>;
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
function deriveSmartWallet(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(40, "0").slice(0, 40);
  return `0x${hex}`;
}

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

  // Email auth (simulated for demo)
  const login = useCallback(async (email: string, _password: string) => {
    // Simulate API call — accept any email/password in demo
    const id = "usr_" + btoa(email).slice(0, 16);
    const u: UserInfo = { id, email, displayName: email.split("@")[0], smartWallet: deriveSmartWallet(id) };
    const t = "pp_jwt_" + btoa(id + Date.now());
    setUser(u);
    setToken(t);
    saveSession(t, u);
  }, []);

  const register = useCallback(async (email: string, _password: string, name?: string) => {
    const id = "usr_" + btoa(email + Date.now()).slice(0, 16);
    const u: UserInfo = { id, email, displayName: name || email.split("@")[0], smartWallet: deriveSmartWallet(id) };
    const t = "pp_jwt_" + btoa(id + Date.now());
    setUser(u);
    setToken(t);
    saveSession(t, u);
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

  // Verify token on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved.token && saved.user) {
      setToken(saved.token);
      setUser(saved.user);
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
