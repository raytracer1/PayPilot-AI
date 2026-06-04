import { privateKeyToAccount } from "viem/accounts";
import { encodeFunctionData, parseUnits, parseEther, createPublicClient } from "viem";
import { getChain, getTransport, getExplorerUrl } from "./chainConfig";

const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const ERC20_ABI = [{
  name: "transfer", type: "function", stateMutability: "nonpayable",
  inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }],
  outputs: [{ name: "", type: "bool" }],
}] as const;

export async function fundUserWallet(
  userAddress: string,
  amount: number,
): Promise<{ txHash: string; explorerUrl: string; ethTxHash?: string } | { error: string }> {
  const devKey = import.meta.env.VITE_DEV_WALLET_KEY;
  if (!devKey) {
    return { error: "Dev wallet key not configured. Set VITE_DEV_WALLET_KEY in frontend/.env" };
  }

  try {
    const account = privateKeyToAccount(devKey.startsWith("0x") ? devKey as `0x${string}` : `0x${devKey}` as `0x${string}`);
    const chain = getChain();
    const client = createPublicClient({ chain, transport: getTransport() });

    const recipient = userAddress as `0x${string}`;

    // 1. Send ETH for gas (0.0001 ETH = 100000 gas × 1 gwei, exactly 1 ERC20 transfer)
    let nonce = await client.getTransactionCount({ address: account.address });
    const ethTxSigned = await account.signTransaction({
      to: recipient,
      value: parseEther("0.0001"),
      gas: 21000n,
      gasPrice: 1000000000n,
      chainId: chain.id,
      nonce,
    });
    const ethTxHash = await client.sendRawTransaction({ serializedTransaction: ethTxSigned });

    // 2. Send USDC (nonce increments by 1)
    nonce += 1;
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient, parseUnits(amount.toString(), 6)],
    });

    const signed = await account.signTransaction({
      to: USDC_SEPOLIA as `0x${string}`,
      data,
      value: 0n,
      gas: 100000n,
      gasPrice: 1000000000n,
      chainId: chain.id,
      nonce,
    });

    const txHash = await client.sendRawTransaction({ serializedTransaction: signed });
    return {
      txHash,
      ethTxHash,
      explorerUrl: getExplorerUrl(txHash),
    };
  } catch (err: any) {
    return { error: err.message || "Funding failed" };
  }
}
