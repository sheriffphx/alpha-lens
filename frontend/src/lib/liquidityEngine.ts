export type LiquidityRating =
  "excellent" | "good" | "moderate" | "poor" | "insufficient";

export function calculateLiquiditySuitability(
  amountUsd: number,
  poolTvl: number,
) {
  if (amountUsd <= 0 || poolTvl <= 0) {
    return {
      utilization: 100,
      rating: "insufficient" as LiquidityRating,
      suitable: false,
    };
  }

  const utilization = (amountUsd / poolTvl) * 100;

  let rating: LiquidityRating;
  let suitable = true;

  if (utilization <= 1) {
    rating = "excellent";
  } else if (utilization <= 5) {
    rating = "good";
  } else if (utilization <= 10) {
    rating = "moderate";
  } else if (utilization <= 25) {
    rating = "poor";
    suitable = false;
  } else {
    rating = "insufficient";
    suitable = false;
  }

  return {
    utilization,
    rating,
    suitable,
  };
}

// function deriveTokenPrice(
//   knownTokenPrice: number,
//   knownReserve: number,
//   unknownReserve: number
// ) {
//   if (
//     knownTokenPrice <= 0 ||
//     knownReserve <= 0 ||
//     unknownReserve <= 0
//   ) {
//     return 0;
//   }

//   return (
//     knownReserve *
//     knownTokenPrice
//   ) / unknownReserve;
// }
