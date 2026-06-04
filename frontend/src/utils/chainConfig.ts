import { baseSepolia } from "viem/chains";
import { http, type Chain, type Transport } from "viem";

const LOCAL_RPC = import.meta.env.VITE_LOCAL_RPC as string | undefined;
const IS_LOCAL = !!LOCAL_RPC;

/** Returns the chain config — local Anvil fork or real Base Sepolia */
export function getChain(): Chain {
  if (IS_LOCAL) {
    return {
      ...baseSepolia,
      rpcUrls: {
        default: { http: [LOCAL_RPC] },
        public: { http: [LOCAL_RPC] },
      },
    };
  }
  return baseSepolia;
}

/** Returns the viem transport */
export function getTransport(): ReturnType<typeof http> {
  return IS_LOCAL ? http(LOCAL_RPC) : http();
}

/** Returns explorer URL for a given tx hash */
export function getExplorerUrl(txHash: string): string {
  if (IS_LOCAL) {
    return `http://localhost:8545/tx/${txHash}`;
  }
  return `https://sepolia.basescan.org/tx/${txHash}`;
}

/** True if running against local Anvil fork */
export { IS_LOCAL };
