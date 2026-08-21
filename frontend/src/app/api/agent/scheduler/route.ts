import { NextResponse } from "next/server";
import { createPublicClient, http, type Address } from "viem";

import { agentExecutorAbi } from "@/lib/agentExecutorAbi";
import { getAgentDeployment } from "@/lib/agentDeployments";

const CHAINS = [
  {
    chainId: 677,
    chainName: "BOT Chain Mainnet",
    rpcUrl: "https://rpc.botchain.ai",
    executor: getAgentDeployment(677).executor,
  },
  {
    chainId: 968,
    chainName: "BOT Chain Testnet",
    rpcUrl: "https://rpc.bohr.life",
    executor: getAgentDeployment(968).executor,
  },
] as const;

// Safety limit so a corrupted contract cannot cause an infinite loop.
const MAX_POLICY_SCAN = 1000;

export async function GET(req: Request) {
  try {
    // ============================================================
    // 1. Authenticate scheduler
    // ============================================================

    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error(
        "[AlphaLens Scheduler] CRON_SECRET is not configured.",
      );

      return NextResponse.json(
        {
          success: false,
          error: "Scheduler secret is not configured.",
        },
        { status: 500 },
      );
    }

    const authorization = req.headers.get("authorization");

    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    // ============================================================
    // 2. Agent configuration
    // ============================================================

    const agentPrivateKey = process.env.AGENT_PRIVATE_KEY;

    if (!agentPrivateKey) {
      return NextResponse.json(
        {
          success: false,
          error: "AGENT_PRIVATE_KEY is not configured.",
        },
        { status: 500 },
      );
    }

    const agentAddress =
      process.env.NEXT_PUBLIC_AGENT_ADDRESS?.toLowerCase();

    if (!agentAddress) {
      return NextResponse.json(
        {
          success: false,
          error: "AGENT_ADDRESS is not configured.",
        },
        { status: 500 },
      );
    }

    // ============================================================
    // 3. Base URL
    // ============================================================

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000";

    const results: Array<Record<string, unknown>> = [];

    let policiesProcessed = 0;
    let policiesFound = 0;

    // ============================================================
    // 4. Scan every chain
    // ============================================================

    for (const chain of CHAINS) {
      try {
        console.log(
          `[AlphaLens Scheduler] ================================`,
        );

        console.log(
          `[AlphaLens Scheduler] Scanning ${chain.chainName}`,
        );

        console.log(
          `[AlphaLens Scheduler] Executor: ${chain.executor}`,
        );

        console.log(
          `[AlphaLens Scheduler] Agent: ${agentAddress}`,
        );

        const publicClient = createPublicClient({
          transport: http(chain.rpcUrl),
        });

        // ========================================================
        // Find all policies belonging to this agent.
        //
        // We deliberately do NOT use PolicyCreated logs.
        //
        // Policy IDs are sequential:
        // 1, 2, 3, 4...
        //
        // policies(id) returns owner = 0x0 when the policy
        // does not exist.
        // ========================================================

        const policyIds: bigint[] = [];

        for (
          let id = 1n;
          id <= BigInt(MAX_POLICY_SCAN);
          id++
        ) {
          try {
            const policy = await publicClient.readContract({
              address: chain.executor as Address,
              abi: agentExecutorAbi,
              functionName: "policies",
              args: [id],
            });

            const owner = policy[0];
            const policyAgent = policy[1];

            // First nonexistent policy.
            if (
              !owner ||
              owner === "0x0000000000000000000000000000000000000000"
            ) {
              console.log(
                `[AlphaLens Scheduler] ${chain.chainName}: reached end of policies at ID ${id}`,
              );

              break;
            }

            console.log(
              `[AlphaLens Scheduler] Policy ${id}:`,
              {
                owner,
                agent: policyAgent,
                active: policy[10],
                expiry: policy[9]?.toString(),
              },
            );

            // Only schedule policies assigned to our agent.
            if (
              policyAgent?.toLowerCase() === agentAddress
            ) {
              policyIds.push(id);
            }
          } catch (error) {
            console.error(
              `[AlphaLens Scheduler] Failed reading policy ${id.toString()} on ${chain.chainName}:`,
              error,
            );

            // Stop scanning this chain if the RPC cannot read
            // the next policy.
            break;
          }
        }

        policiesFound += policyIds.length;

        console.log(
          `[AlphaLens Scheduler] ${chain.chainName}: found ${policyIds.length} policies assigned to agent`,
        );

        // ========================================================
        // Run every policy
        // ========================================================

        for (const policyId of policyIds) {
          policiesProcessed++;

          try {
            console.log(
              `[AlphaLens Scheduler] Running policy ${policyId.toString()} on ${chain.chainName}`,
            );

            const response = await fetch(
              `${baseUrl}/api/agent/run`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  chainId: chain.chainId,
                  policyId: Number(policyId),
                }),
                cache: "no-store",
              },
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
              console.error(
                `[AlphaLens Scheduler] Policy ${policyId.toString()} failed:`,
                result,
              );

              results.push({
                success: false,
                chainId: chain.chainId,
                chainName: chain.chainName,
                policyId: Number(policyId),
                status: "failed",
                error:
                  result.error ??
                  "Agent run failed",
              });

              continue;
            }

            console.log(
              `[AlphaLens Scheduler] Policy ${policyId.toString()} completed: ${result.status}`,
            );

            results.push({
              success: true,
              chainId: chain.chainId,
              chainName: chain.chainName,
              policyId: Number(policyId),
              status: result.status,
              transactionHash:
                result.transactionHash ?? null,
              decision:
                result.decision ?? null,
            });
          } catch (error) {
            console.error(
              `[AlphaLens Scheduler] Policy ${policyId.toString()} crashed:`,
              error,
            );

            results.push({
              success: false,
              chainId: chain.chainId,
              chainName: chain.chainName,
              policyId: Number(policyId),
              status: "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown policy error",
            });
          }
        }
      } catch (error) {
        // One chain failing must not stop the other chain.

        console.error(
          `[AlphaLens Scheduler] ${chain.chainName} scan failed:`,
          error,
        );

        results.push({
          success: false,
          chainId: chain.chainId,
          chainName: chain.chainName,
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Chain scan failed",
        });
      }
    }

    // ============================================================
    // 5. Return scheduler result
    // ============================================================

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      chainsScanned: CHAINS.length,
      policiesFound,
      policiesProcessed,
      results,
    });
  } catch (error) {
    console.error(
      "[AlphaLens Scheduler] Fatal error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Scheduler failed",
      },
      { status: 500 },
    );
  }
}