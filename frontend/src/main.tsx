import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base, polygon, arbitrum } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { WalletProvider } from "./context/WalletContext";
import "./index.css";

// Wagmi config for wallet connection
const config = createConfig({
  chains: [base, polygon, arbitrum],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "PayPilot AI" }),
  ],
  transports: {
    [base.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
  },
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <WalletProvider>
            <App />
          </WalletProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);