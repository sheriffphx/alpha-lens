import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bot,wrapped-bot&vs_currencies=usd",
      {
        next: {
          revalidate: 60,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch CoinGecko price");
    }

    const data = await response.json();

    return NextResponse.json({
      BOT: data.bot.usd,
      WBOT: data["wrapped-bot"]?.usd ?? null,
    });
  } catch (error) {
    console.error("CoinGecko error:", error);

    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 },
    );
  }
}
