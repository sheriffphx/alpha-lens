export const bdexV2FactoryAbi = [
  {
    type: "function",
    name: "allPairsLength",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
  },
  {
    type: "function",
    name: "allPairs",
    stateMutability: "view",
    inputs: [
      {
        name: "",
        type: "uint256",
      },
    ],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
] as const;

export const bdexV2PairAbi = [
  {
    type: "function",
    name: "token0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },
  {
    type: "function",
    name: "token1",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
      },
    ],
  },

  {
    type: "event",
    name: "Swap",
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: "sender",
        type: "address",
      },
      {
        indexed: false,
        name: "amount0In",
        type: "uint256",
      },
      {
        indexed: false,
        name: "amount1In",
        type: "uint256",
      },
      {
        indexed: false,
        name: "amount0Out",
        type: "uint256",
      },
      {
        indexed: false,
        name: "amount1Out",
        type: "uint256",
      },
      {
        indexed: true,
        name: "to",
        type: "address",
      },
    ],
  },

  {
    type: "function",
    name: "getReserves",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "_reserve0",
        type: "uint112",
      },
      {
        name: "_reserve1",
        type: "uint112",
      },
      {
        name: "_blockTimestampLast",
        type: "uint32",
      },
    ],
  },
] as const;
