import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const policyId = Number(body.policyId);

    if (!Number.isInteger(policyId) || policyId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "A valid policyId is required.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "pausePolicy can only be executed by the wallet that created the policy. Use the policy owner wallet, not the agent wallet or server key.",
        policyId,
      },
      { status: 400 },
    );
  } catch (error) {
    console.error("Pause failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Pause failed",
      },
      { status: 500 },
    );
  }
}
