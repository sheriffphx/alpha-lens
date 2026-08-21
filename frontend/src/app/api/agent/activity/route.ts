import { NextResponse } from "next/server";
import { createPublicClient, defineChain, http, parseAbiItem } from "viem";

const botTestnet = defineChain({
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

const botMainnet = defineChain({
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
    chain: botTestnet,
    executor: "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1" as `0x${string}`,
    explorer: "https://scan.bohr.life",
  },

  677: {
    chain: botMainnet,
    executor: "0xB363a61f16Ca0a69772A9a445c707D5C98590F92" as `0x${string}`,
    explorer: "https://scan.botchain.ai",
  },
} as const;

const policyCreatedEvent = parseAbiItem(
  "event PolicyCreated(uint256 indexed policyId,address indexed owner,address indexed agent,address tokenIn,address tokenOut,uint256 maxAmount,uint256 maxSlippageBps,uint256 minOpportunityScore,uint256 cooldown,uint256 expiry)",
);

const policyPausedEvent = parseAbiItem(
  "event PolicyPaused(uint256 indexed policyId)",
);

const policyResumedEvent = parseAbiItem(
  "event PolicyResumed(uint256 indexed policyId)",
);

const decisionCommittedEvent = parseAbiItem(
  "event DecisionCommitted(uint256 indexed policyId,bytes32 indexed decisionId,uint256 opportunityScore)",
);

const decisionExecutedEvent = parseAbiItem(
  "event DecisionExecuted(uint256 indexed policyId,uint256 indexed decisionId,address agent,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOut)",
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const chainId = Number(searchParams.get("chainId"));

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

    const client = createPublicClient({
      chain: deployment.chain,
      transport: http(),
    });

    /*
     * Keep each event query independent.
     *
     * If one event is unavailable on a deployment, the entire
     * activity history should NOT crash.
     */

    const activity: any[] = [];

    // ------------------------------------------------------------
    // POLICY CREATED
    // ------------------------------------------------------------

    try {
      const logs = await client.getLogs({
        address: deployment.executor,
        event: policyCreatedEvent,
        fromBlock: 0n,
        toBlock: "latest",
      });

      for (const log of logs) {
        activity.push({
          type: "policy_created",
          blockNumber: log.blockNumber?.toString(),
          transactionHash: log.transactionHash,
          policyId: log.args.policyId?.toString(),
        });
      }
    } catch (error) {
      console.error("PolicyCreated logs failed:", error);
    }

    // ------------------------------------------------------------
    // POLICY PAUSED
    // ------------------------------------------------------------

    try {
      const logs = await client.getLogs({
        address: deployment.executor,
        event: policyPausedEvent,
        fromBlock: 0n,
        toBlock: "latest",
      });

      for (const log of logs) {
        activity.push({
          type: "policy_paused",
          blockNumber: log.blockNumber?.toString(),
          transactionHash: log.transactionHash,
          policyId: log.args.policyId?.toString(),
        });
      }
    } catch (error) {
      console.error("PolicyPaused logs failed:", error);
    }

    // ------------------------------------------------------------
    // POLICY RESUMED
    // ------------------------------------------------------------

    try {
      const logs = await client.getLogs({
        address: deployment.executor,
        event: policyResumedEvent,
        fromBlock: 0n,
        toBlock: "latest",
      });

      for (const log of logs) {
        activity.push({
          type: "policy_resumed",
          blockNumber: log.blockNumber?.toString(),
          transactionHash: log.transactionHash,
          policyId: log.args.policyId?.toString(),
        });
      }
    } catch (error) {
      console.error("PolicyResumed logs failed:", error);
    }

    // ------------------------------------------------------------
    // DECISION COMMITTED
    // ------------------------------------------------------------

    try {
      const logs = await client.getLogs({
        address: deployment.executor,
        event: decisionCommittedEvent,
        fromBlock: 0n,
        toBlock: "latest",
      });

      for (const log of logs) {
        activity.push({
          type: "decision_committed",
          blockNumber: log.blockNumber?.toString(),
          transactionHash: log.transactionHash,
          policyId: log.args.policyId?.toString(),
          decisionId: log.args.decisionId,
        });
      }
    } catch (error) {
      console.error("DecisionCommitted logs failed:", error);
    }

    // ------------------------------------------------------------
    // DECISION EXECUTED
    // ------------------------------------------------------------

    try {
      const logs = await client.getLogs({
        address: deployment.executor,
        event: decisionExecutedEvent,
        fromBlock: 0n,
        toBlock: "latest",
      });

      for (const log of logs) {
        activity.push({
          type: "decision_executed",
          blockNumber: log.blockNumber?.toString(),
          transactionHash: log.transactionHash,
          policyId: log.args.policyId?.toString(),
          decisionId: log.args.decisionId
            ? `0x${BigInt(log.args.decisionId).toString(16).padStart(64, "0")}`
            : undefined,
          agent: log.args.agent,
          tokenIn: log.args.tokenIn,
          tokenOut: log.args.tokenOut,
          amountIn: log.args.amountIn?.toString(),
          amountOut: log.args.amountOut?.toString(),
        });
      }
    } catch (error) {
      console.error("DecisionExecuted logs failed:", error);
    }

    // ------------------------------------------------------------
    // SORT NEWEST FIRST
    // ------------------------------------------------------------

    activity.sort((a, b) => {
      const blockA = BigInt(a.blockNumber ?? "0");
      const blockB = BigInt(b.blockNumber ?? "0");

      if (blockA > blockB) return -1;
      if (blockA < blockB) return 1;

      return 0;
    });

    return NextResponse.json({
      success: true,
      chainId,
      executor: deployment.executor,
      explorer: deployment.explorer,
      activity,
    });
  } catch (error) {
    console.error("Activity fetch failed:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch activity",
      },
      { status: 500 },
    );
  }
}
