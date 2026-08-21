import { NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const BOT_TESTNET = defineChain({
  id: 968,
  name: "BOT Chain Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.bohr.life"],
    },
  },
});

const BOT_MAINNET = defineChain({
  id: 677,
  name: "BOT Chain",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.botchain.ai"],
    },
  },
});

const deployments = {
  968: {
    chain: BOT_TESTNET,
    executor:
      "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1" as Address,
  },

  677: {
    chain: BOT_MAINNET,
    executor:
      "0xB363a61f16Ca0a69772A9a445c707D5C98590F92" as Address,
  },
} as const;

const agentExecutorAbi = [
  {
    type: "function",
    name: "executeDecision",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "policyId",
        type: "uint256",
      },
      {
        name: "decision",
        type: "tuple",
        components: [
          {
            name: "decisionId",
            type: "bytes32",
          },
          {
            name: "tokenIn",
            type: "address",
          },
          {
            name: "tokenOut",
            type: "address",
          },
          {
            name: "amountIn",
            type: "uint256",
          },
          {
            name: "amountOutMin",
            type: "uint256",
          },
          {
            name: "opportunityScore",
            type: "uint256",
          },
          {
            name: "deadline",
            type: "uint256",
          },
          {
            name: "evidenceHash",
            type: "bytes32",
          },
        ],
      },
    ],
    outputs: [
      {
        name: "amounts",
        type: "uint256[]",
      },
    ],
  },
] as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const chainId = Number(body.chainId);
    const decision = body.decision ?? body;

    if (chainId !== 968 && chainId !== 677) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported chain.",
        },
        { status: 400 },
      );
    }

    const deployment = deployments[chainId];

    const {
      policyId,
      decisionId,
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMin,
      opportunityScore,
      deadline,
      evidenceHash,
    } = decision;

    if (
      policyId === undefined ||
      policyId === null ||
      !decisionId ||
      !tokenIn ||
      !tokenOut ||
      amountIn === undefined ||
      amountIn === null ||
      amountOutMin === undefined ||
      amountOutMin === null ||
      opportunityScore === undefined ||
      opportunityScore === null ||
      deadline === undefined ||
      deadline === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing execution parameters",
          received: decision,
        },
        { status: 400 },
      );
    }

    if (
      typeof decisionId !== "string" ||
      !/^0x[a-fA-F0-9]{64}$/.test(
        decisionId,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid decisionId. Expected bytes32.",
        },
        { status: 400 },
      );
    }

    const finalEvidenceHash =
      evidenceHash ??
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    if (
      typeof finalEvidenceHash !==
        "string" ||
      !/^0x[a-fA-F0-9]{64}$/.test(
        finalEvidenceHash,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid evidenceHash. Expected bytes32.",
        },
        { status: 400 },
      );
    }

    if (
      typeof tokenIn !== "string" ||
      typeof tokenOut !== "string" ||
      !/^0x[a-fA-F0-9]{40}$/.test(
        tokenIn,
      ) ||
      !/^0x[a-fA-F0-9]{40}$/.test(
        tokenOut,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid token address.",
        },
        { status: 400 },
      );
    }

    const privateKey =
      process.env.AGENT_PRIVATE_KEY;

    if (!privateKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "AGENT_PRIVATE_KEY is not configured",
        },
        { status: 500 },
      );
    }

    const account =
      privateKeyToAccount(
        privateKey.startsWith("0x")
          ? (privateKey as Hex)
          : (`0x${privateKey}` as Hex),
      );

    const publicClient =
      createPublicClient({
        chain: deployment.chain,
        transport: http(),
      });

    const walletClient =
      createWalletClient({
        account,
        chain: deployment.chain,
        transport: http(),
      });

    console.log(
      "Agent execution chain:",
      deployment.chain.name,
    );

    console.log(
      "Chain ID:",
      chainId,
    );

    console.log(
      "Agent executor:",
      deployment.executor,
    );

    console.log(
      "Agent signer:",
      account.address,
    );

    console.log(
      "Policy ID:",
      policyId,
    );

    const txHash =
      await walletClient.writeContract({
        address: deployment.executor,
        abi: agentExecutorAbi,
        functionName:
          "executeDecision",
        args: [
          BigInt(policyId),
          {
            decisionId:
              decisionId as Hex,

            tokenIn:
              tokenIn as Address,

            tokenOut:
              tokenOut as Address,

            amountIn:
              BigInt(amountIn),

            amountOutMin:
              BigInt(amountOutMin),

            opportunityScore:
              BigInt(opportunityScore),

            deadline:
              BigInt(deadline),

            evidenceHash:
              finalEvidenceHash as Hex,
          },
        ],
      });

    console.log(
      "Execution transaction:",
      txHash,
    );

    const receipt =
      await publicClient.waitForTransactionReceipt(
        {
          hash: txHash,
        },
      );

    if (receipt.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          transactionHash: txHash,
          policyId: String(policyId),
          chainId,
          chainName:
            deployment.chain.name,
          error:
            "Execution transaction reverted",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      transactionHash: txHash,
      executor: deployment.executor,
      agentSigner: account.address,
      policyId: String(policyId),
      chainId,
      chainName: deployment.chain.name,
      status: receipt.status,
    });
  } catch (error) {
    console.error(
      "Agent execution failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Agent execution failed",
      },
      { status: 500 },
    );
  }
}