import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { question, context } = body;

    if (!question) {
      return NextResponse.json(
        {
          error: "Question is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!context) {
      return NextResponse.json(
        {
          error: "Copilot context is required.",
        },
        {
          status: 400,
        },
      );
    }

    const prompt = `
You are AlphaLens, an AI DeFi portfolio copilot.

You are given structured data produced by AlphaLens's
deterministic portfolio, risk, liquidity, activity,
yield, and opportunity engines.

Your job is to explain that analysis clearly to the user.

IMPORTANT:

- Treat the supplied context as the source of truth.
- Never invent financial data.
- Never invent token prices, TVL, APR, volume, fees,
  balances, or risk scores.
- Do not recalculate metrics unless necessary to explain them.
- Never guarantee profits.
- Never tell the user that a yield is "safe".
- Higher APR does NOT automatically mean a better opportunity.
- Extremely low liquidity should be treated as a major warning.
- Consider liquidity, activity, yield quality, TVL,
  and opportunity score together.
- Clearly distinguish facts from your interpretation.
- If the data is insufficient, say so.
- Keep answers concise and practical.

When recommending an opportunity:

1. Identify the relevant pool.
2. Explain the opportunity.
3. Explain the main risks.
4. Compare it against obviously inferior opportunities
   when useful.
5. Give a cautious recommendation.

UNLOCK DATA:
Use the unlock data provided in the context when discussing
token or protocol unlocks.

Never invent unlock events.

If the unlock list is empty, clearly state that Alpha Lens
currently has no verified unlock events available.

Treat unlock risk as an additional risk signal when evaluating
DeFi opportunities.

You are an analysis and education assistant.
You do not execute transactions.

USER QUESTION:

${question}

ALPHA LENS CONTEXT:

${JSON.stringify(context, null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    return NextResponse.json({
      answer: response.text,
    });
  } catch (error) {
    console.error("Copilot API error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate Copilot response.",
      },
      {
        status: 500,
      },
    );
  }
}
