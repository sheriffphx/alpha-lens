import { NextResponse } from "next/server";
import {
  createPublicClient,
  defineChain,
  http,
  keccak256,
  parseAbi,
  toBytes,
} from "viem";
import { GoogleGenAI } from "@google/genai";

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
    executor:
      "0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1" as `0x${string}`,
    router:
      "0xD6425a02f0845B8D99e349C34D2E7A576E177345" as `0x${string}`,
  },

  677: {
    chain: botMainnet,
    executor:
      "0xB363a61f16Ca0a69772A9a445c707D5C98590F92" as `0x${string}`,
    router:
      "0x1414eD29FdFD322c3c0a830330ed982E2D629e76" as `0x${string}`,
  },
} as const;

const policyAbi = parseAbi([
  "function policies(uint256) view returns (address owner,address agent,address tokenIn,address tokenOut,uint256 maxAmount,uint256 maxSlippageBps,uint256 minOpportunityScore,uint256 cooldown,uint256 lastExecution,uint256 expiry,bool active)",
]);

const routerAbi = parseAbi([
  "function getAmountsOut(uint256 amountIn,address[] calldata path) view returns (uint256[] memory)",
]);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const policyId = Number(body.policyId);
    const chainId = Number(body.chainId);

    if (!Number.isInteger(policyId) || policyId <= 0) {
      throw new Error("A valid policyId is required.");
    }

    if (chainId !== 968 && chainId !== 677) {
      throw new Error("Unsupported chain. Expected BOT Chain Testnet or BOT Chain Mainnet.");
    }

    const deployment = deployments[chainId];

    const client = createPublicClient({
      chain: deployment.chain,
      transport: http(),
    });

    const EXECUTOR = deployment.executor;
    const ROUTER = deployment.router;

    const policy = await client.readContract({
      address: EXECUTOR,
      abi: policyAbi,
      functionName: "policies",
      args: [BigInt(policyId)],
    });

    const [
      policyOwner,
      policyAgent,
      tokenIn,
      tokenOut,
      maxAmount,
      maxSlippageBps,
      minOpportunityScore,
      cooldown,
      lastExecution,
      expiry,
      active,
    ] = policy;

    if (
      policyOwner ===
      "0x0000000000000000000000000000000000000000"
    ) {
      throw new Error(`Policy #${policyId} does not exist.`);
    }

    if (!active) {
      return NextResponse.json({
        success: true,
        decision: {
          action: "hold",
          policyId,
          tokenIn,
          tokenOut,
          opportunityScore: 0,
          confidence: 0,
          reason: "Policy is paused.",
        },
        chainId,
        chainName: deployment.chain.name,
        executor: EXECUTOR,
        router: ROUTER,
      });
    }

    const nowSeconds = BigInt(
      Math.floor(Date.now() / 1000),
    );

    if (expiry <= nowSeconds) {
      return NextResponse.json({
        success: true,
        decision: {
          action: "hold",
          policyId,
          tokenIn,
          tokenOut,
          opportunityScore: 0,
          confidence: 0,
          reason: "Policy has expired.",
        },
        chainId,
        chainName: deployment.chain.name,
        executor: EXECUTOR,
        router: ROUTER,
      });
    }

    if (
      cooldown > 0n &&
      lastExecution > 0n &&
      nowSeconds < lastExecution + cooldown
    ) {
      return NextResponse.json({
        success: true,
        decision: {
          action: "hold",
          policyId,
          tokenIn,
          tokenOut,
          opportunityScore: 0,
          confidence: 0,
          reason: "Policy is still within its execution cooldown.",
        },
        chainId,
        chainName: deployment.chain.name,
        executor: EXECUTOR,
        router: ROUTER,
      });
    }

    const prompt = `
You are AlphaLens, an autonomous DeFi portfolio agent operating on:

Chain: ${deployment.chain.name}
Chain ID: ${chainId}

You are operating under a strict on-chain policy.

You may ONLY propose trading:

tokenIn: ${tokenIn}
tokenOut: ${tokenOut}

Do not propose another token pair.

Maximum amountIn:
${maxAmount.toString()}

Maximum slippage:
${maxSlippageBps.toString()} basis points

Minimum opportunity score:
${minOpportunityScore.toString()}

Return ONLY valid JSON.

Schema:
{
  "action": "swap" | "hold",
  "amountIn": "string",
  "opportunityScore": number,
  "confidence": number,
  "reason": "string"
}

Rules:

- opportunityScore must be between 0 and 100.
- confidence must be between 0 and 1.
- amountIn must be raw token base units.
- amountIn must never exceed the policy maximum.
- Prefer HOLD when confidence is low.
- Only propose SWAP when the opportunity is materially attractive relative to holding.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    const text = response.text?.trim();

    if (!text) {
      throw new Error("AI returned an empty response.");
    }

    const cleaned = text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    if (
      parsed.action !== "swap" &&
      parsed.action !== "hold"
    ) {
      throw new Error("Invalid AI action.");
    }

    const opportunityScore = Math.max(
      0,
      Math.min(
        100,
        Number(parsed.opportunityScore ?? 0),
      ),
    );

    const confidence = Math.max(
      0,
      Math.min(
        1,
        Number(parsed.confidence ?? 0),
      ),
    );

    const decisionId = keccak256(
      toBytes(
        JSON.stringify({
          chainId,
          policyId,
          tokenIn,
          tokenOut,
          action: parsed.action,
          opportunityScore,
          confidence,
          timestamp: Date.now(),
          nonce: Math.random(),
        }),
      ),
    );

    if (parsed.action === "hold") {
      const evidenceHash = keccak256(
        toBytes(
          JSON.stringify({
            source: "AlphaLens AI",
            chainId,
            policyId,
            action: "hold",
            reason: parsed.reason,
            opportunityScore,
            confidence,
          }),
        ),
      );

      return NextResponse.json({
        success: true,
        decision: {
          action: "hold",
          policyId,
          decisionId,
          tokenIn,
          tokenOut,
          opportunityScore,
          confidence,
          reason:
            parsed.reason ??
            "No reason supplied.",
          evidenceHash,
        },
        chainId,
        chainName: deployment.chain.name,
        executor: EXECUTOR,
        router: ROUTER,
      });
    }

    let amountIn: bigint;

    try {
      amountIn = BigInt(
        parsed.amountIn ?? "0",
      );
    } catch {
      throw new Error(
        "AI returned an invalid amountIn.",
      );
    }

    if (amountIn <= 0n) {
      throw new Error(
        "Proposed amountIn must be greater than zero.",
      );
    }

    if (amountIn > maxAmount) {
      amountIn = maxAmount;
    }

    if (
      opportunityScore <
      Number(minOpportunityScore)
    ) {
      return NextResponse.json({
        success: true,
        decision: {
          action: "hold",
          policyId,
          decisionId,
          tokenIn,
          tokenOut,
          opportunityScore,
          confidence,
          reason: `Opportunity score ${opportunityScore} is below the policy minimum of ${minOpportunityScore}.`,
        },
        chainId,
        chainName: deployment.chain.name,
        executor: EXECUTOR,
        router: ROUTER,
      });
    }

    const quote = await client.readContract({
      address: ROUTER,
      abi: routerAbi,
      functionName: "getAmountsOut",
      args: [
        amountIn,
        [tokenIn, tokenOut],
      ],
    });

    const quotedOutput =
      quote[quote.length - 1];

    const amountOutMin =
      (quotedOutput *
        (10_000n - BigInt(maxSlippageBps))) /
      10_000n;

    const deadline =
      nowSeconds + 600n > expiry
        ? expiry
        : nowSeconds + 600n;

    const evidenceHash = keccak256(
      toBytes(
        JSON.stringify({
          source: "AlphaLens AI",
          chainId,
          policyId,
          reason: parsed.reason,
          opportunityScore,
          confidence,
          quotedOutput:
            quotedOutput.toString(),
        }),
      ),
    );

    return NextResponse.json({
      success: true,

      decision: {
        action: "swap",
        policyId,
        decisionId,

        tokenIn,
        tokenOut,

        amountIn: amountIn.toString(),
        amountOutMin:
          amountOutMin.toString(),

        opportunityScore,
        confidence,

        deadline: deadline.toString(),

        reason:
          parsed.reason ??
          "No reason supplied.",

        evidenceHash,
      },

      chainId,
      chainName: deployment.chain.name,
      executor: EXECUTOR,
      router: ROUTER,
    });
  } catch (error) {
    console.error(
      "Agent decision failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Agent decision failed",
      },
      { status: 500 },
    );
  }
}