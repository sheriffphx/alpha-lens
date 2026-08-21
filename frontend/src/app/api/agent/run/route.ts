import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const policyId = Number(body.policyId);
    const chainId = Number(body.chainId);

    if (!Number.isInteger(policyId) || policyId <= 0) {
      return NextResponse.json(
        {
          success: false,
          stage: "decision",
          error: "A valid policyId is required.",
        },
        { status: 400 },
      );
    }

    if (chainId !== 968 && chainId !== 677) {
      return NextResponse.json(
        {
          success: false,
          stage: "decision",
          error: "Unsupported chain.",
        },
        { status: 400 },
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const decideResponse = await fetch(`${baseUrl}/api/agent/decide`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        policyId,
        chainId,
      }),
      cache: "no-store",
    });

    const decisionResult = await decideResponse.json();

    if (!decideResponse.ok || !decisionResult.success) {
      return NextResponse.json(
        {
          success: false,
          stage: "decision",
          error: decisionResult.error ?? "Decision failed",
        },
        { status: 500 },
      );
    }

    const decision = decisionResult.decision;

    if (decision.action === "hold") {
      return NextResponse.json({
        success: true,
        status: "held",
        stage: "decision",
        chainId,
        chainName: decisionResult.chainName,
        decision,
        execution: null,
        transactionHash: null,
      });
    }

    const executeResponse = await fetch(`${baseUrl}/api/agent/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId,
        decision,
      }),
      cache: "no-store",
    });

    const executionResult = await executeResponse.json();

    if (!executeResponse.ok || !executionResult.success) {
      return NextResponse.json(
        {
          success: false,
          stage: "execution",
          chainId,
          decision,
          error: executionResult.error ?? "Execution failed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      status: "executed",
      stage: "complete",
      chainId,
      chainName: executionResult.chainName,
      decision,
      execution: executionResult,
      transactionHash: executionResult.transactionHash,
    });
  } catch (error) {
    console.error("Agent run failed:", error);

    return NextResponse.json(
      {
        success: false,
        stage: "agent",
        error: error instanceof Error ? error.message : "Agent run failed",
      },
      { status: 500 },
    );
  }
}
