import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";

interface WalletUser {
  id: string;
  wallet_address: string;
  display_name: string | null;
  tier: string;
  created_at: string;
}

interface WalletContextValue {
  // Wagmi state (from hooks)
  address: `0x${string}` | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;

  // SIWE session
  token: string | null;
  user: WalletUser | null;
  isAuthenticated: boolean;
  siweSignIn: () => Promise<void>;
  siweSignOut: () => void;

  // Chain info
  chainId: number | undefined;
  chainName: string;
}

const WalletContext = createContext<WalletContextValue | null>(null);

const TOKEN_KEY = "paypilot_siwe_token";
const USER_KEY = "paypilot_siwe_user";

function loadSession(): { token: string | null; user: WalletUser | null } {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (token && userStr) {
      return { token, user: JSON.parse(userStr) };
    }
  } catch {}
  return { token: null, user: null };
}

const CHAIN_NAMES: Record<number, string> = {
  8453: "Base",
  137: "Polygon",
  42161: "Arbitrum",
  1: "Ethereum",
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [session, setSession] = useState(loadSession);

  // Connect to first available connector (injected/metamask)
  const connectWallet = useCallback(() => {
    const injected = connectors.find((c) => c.id === "injected" || c.id === "metaMask" || c.id === "coinbaseWallet");
    if (injected) {
      connect({ connector: injected });
    }
  }, [connectors, connect]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setSession({ token: null, user: null });
  }, [disconnect]);

  // SIWE: sign message with wallet, verify on backend
  const siweSignIn = useCallback(async () => {
    if (!address || !isConnected) return;

    try {
      // 1. Get nonce + message
      const nonceRes = await fetch(`/api/siwe/nonce/${address}`, { method: "POST" });
      const { message } = await nonceRes.json();

      // 2. Sign message with wallet
      const signature = await signMessageAsync({ message });

      // 3. Verify on backend
      const verifyRes = await fetch("/api/siwe/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          signature,
          wallet_address: address,
        }),
      });
      if (!verifyRes.ok) throw new Error("SIWE verification failed");

      const data = await verifyRes.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setSession({ token: data.access_token, user: data.user });
    } catch (err) {
      console.error("SIWE sign-in error:", err);
    }
  }, [address, isConnected, signMessageAsync]);

  const siweSignOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setSession({ token: null, user: null });
  }, []);

  // Auto-verify token on mount
  useEffect(() => {
    if (session.token) {
      fetch("/api/siwe/me", {
        headers: { Authorization: `Bearer ${session.token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Token expired");
          return res.json();
        })
        .then((data) => {
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          setSession((s) => ({ ...s, user: data.user }));
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setSession({ token: null, user: null });
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value: WalletContextValue = {
    address,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    token: session.token,
    user: session.user,
    isAuthenticated: !!session.token,
    siweSignIn,
    siweSignOut,
    chainId,
    chainName: chainId ? CHAIN_NAMES[chainId] || `Chain ${chainId}` : "Not connected",
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
