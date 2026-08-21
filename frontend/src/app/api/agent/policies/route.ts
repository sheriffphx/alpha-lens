import { NextResponse } from "next/server";
import {
  createPublicClient,
  defineChain,
  http,
  type Address,
} from "viem";

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
    name: "getOwnerPolicyIds",
    stateMutability: "view",
    inputs: [
      {
        name: "account",
        type: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256[]",
      },
    ],
  },

  {
    type: "function",
    name: "policies",
    stateMutability: "view",
    inputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "agent",
        type: "address",
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
        name: "maxAmount",
        type: "uint256",
      },
      {
        name: "maxSlippageBps",
        type: "uint256",
      },
      {
        name: "minOpportunityScore",
        type: "uint256",
      },
      {
        name: "cooldown",
        type: "uint256",
      },
      {
        name: "lastExecution",
        type: "uint256",
      },
      {
        name: "expiry",
        type: "uint256",
      },
      {
        name: "active",
        type: "bool",
      },
    ],
  },
] as const;

export async function GET(req: Request) {
  try {
    const { searchParams } =
      new URL(req.url);

    const account =
      searchParams.get("account");

    const chainId = Number(
      searchParams.get("chainId"),
    );

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing account",
        },
        { status: 400 },
      );
    }

    if (
      chainId !== 968 &&
      chainId !== 677
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported chain.",
        },
        { status: 400 },
      );
    }

    const deployment =
      deployments[chainId];

    const publicClient =
      createPublicClient({
        chain: deployment.chain,
        transport: http(),
      });

    const policyIds =
      await publicClient.readContract({
        address:
          deployment.executor,
        abi: agentExecutorAbi,
        functionName:
          "getOwnerPolicyIds",
        args: [
          account as Address,
        ],
      });

    const policies =
      await Promise.all(
        policyIds.map(
          async (policyId) => {
            const policy =
              await publicClient.readContract(
                {
                  address:
                    deployment.executor,
                  abi:
                    agentExecutorAbi,
                  functionName:
                    "policies",
                  args: [policyId],
                },
              );

            return {
              policyId:
                Number(policyId),
              owner: policy[0],
              agent: policy[1],
              tokenIn: policy[2],
              tokenOut: policy[3],
              maxAmount:
                policy[4].toString(),
              maxSlippageBps:
                policy[5].toString(),
              minOpportunityScore:
                policy[6].toString(),
              cooldown:
                policy[7].toString(),
              lastExecution:
                policy[8].toString(),
              expiry:
                policy[9].toString(),
              active: policy[10],
            };
          },
        ),
      );

    return NextResponse.json({
      success: true,
      chainId,
      chainName:
        deployment.chain.name,
      executor:
        deployment.executor,
      policyIds:
        policyIds.map((id) =>
          id.toString(),
        ),
      policies,
    });
  } catch (error) {
    console.error(
      "Failed to load agent policies:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load policies",
      },
      { status: 500 },
    );
  }
}