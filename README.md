# AlphaLens

**AI-powered portfolio intelligence and autonomous trading dashboard for the BOT Chain ecosystem.**

AlphaLens is an AI-native DeFi copilot built for the **BOT Chain Builder Challenge #2 — AI Native Track**.

It combines real-time portfolio analytics, AI-assisted decision making, user-defined trading policies, and on-chain execution into a single interface.

[**Launch AlphaLens**](https://alpha-lens-one.vercel.app)

---

## Overview

DeFi users often have to manually monitor their portfolio, evaluate opportunities, assess risk, and decide when to act.

AlphaLens turns this into an intelligent workflow.

Users can:

* Track portfolio value and composition across BOT-native assets
* Monitor token prices and portfolio exposure
* Analyze liquidity and DeFi opportunities
* Assess portfolio and position risk
* Ask an AI copilot questions about their portfolio
* Define policies for autonomous trading
* Allow an AI agent to evaluate opportunities against those policies
* Execute validated trading decisions on-chain
* Review agent decisions and execution history

The goal is not simply to provide an AI chatbot, but to create an **AI-native financial interface where AI can understand a portfolio, reason about opportunities, and take constrained on-chain actions on behalf of the user.**

---

# Key Features

## Portfolio Intelligence

AlphaLens aggregates portfolio information and transforms raw wallet balances and market data into useful portfolio metrics.

The dashboard provides:

* Total portfolio value
* Asset allocation
* Individual token exposure
* Price data
* Liquidity information
* Opportunity scoring
* Yield-quality analysis
* Risk indicators

Market prices are retrieved from CoinGecko and combined with on-chain data to calculate portfolio metrics.

---

## AI Copilot

The AI copilot allows users to ask natural-language questions about their portfolio.

Examples:

> "Where is my idle capital?"

> "Which pool currently has the best opportunity?"

> "What is my biggest portfolio risk?"

> "Should I enter this opportunity?"

The architecture separates **calculation from interpretation**.

The backend computes deterministic financial metrics such as:

* Portfolio value
* Token balances
* Pool liquidity
* Opportunity scores
* Yield metrics
* Risk indicators

The AI model receives this structured context and is responsible for interpreting the information and communicating the result to the user.

This prevents the model from having to invent or estimate critical portfolio numbers.

---

# Autonomous Agent

AlphaLens includes an autonomous trading agent that can evaluate opportunities and execute trades according to a user-defined policy.

The agent follows a controlled decision pipeline:

```text
Portfolio / Market Data
        ↓
Opportunity Analysis
        ↓
AI Agent Decision
        ↓
Policy Validation
        ↓
User-defined Constraints
        ↓
On-chain Execution
        ↓
Transaction Result
```

The AI agent does not have unrestricted control over the user's funds.

Instead, the user defines a policy containing constraints such as opportunity thresholds and trading parameters.

The smart contract then acts as the on-chain enforcement layer.

This creates a separation between:

* **AI reasoning** — off-chain
* **Policy constraints** — user-defined
* **Policy enforcement** — on-chain
* **Trade execution** — smart contract

---

# Smart Contract

The core execution contract is:

`AlphaLensAgentExecutor.sol`

It provides two primary flows.

### `createPolicy`

Registers a user's autonomous trading policy.

A policy can define constraints such as:

* Minimum opportunity score
* Trading parameters
* Allowed execution conditions

### `executeDecision`

Executes a validated agent decision against an active policy.

The contract uses:

* OpenZeppelin `SafeERC20`
* OpenZeppelin `ReentrancyGuard`
* Explicit policy validation
* ERC-20 allowance checks

The contract is designed so that the AI agent cannot simply bypass the user's configured policy.

---

# AI Decision Architecture

AlphaLens separates the AI decision process into distinct stages.

```text
1. Collect portfolio and market data
              ↓
2. Calculate deterministic metrics
              ↓
3. Build structured AI context
              ↓
4. AI evaluates the opportunity
              ↓
5. Validate the decision
              ↓
6. Check user policy
              ↓
7. Execute on-chain
```

The AI therefore acts as the **reasoning layer**, while deterministic application logic and smart contracts provide validation and execution boundaries.

This architecture reduces the risk of relying on an LLM for calculations that should instead be handled by software and blockchain state.

---

# Architecture

```text
                         ┌──────────────────────┐
                         │       User           │
                         │  Wallet + Dashboard  │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Next.js         │
                         │    App Router        │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │   Portfolio    │ │  AI Copilot    │ │ Agent / Policy │
        │    Analytics   │ │                │ │   Interface    │
        └───────┬────────┘ └───────┬────────┘ └───────┬────────┘
                │                  │                  │
                ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │ On-chain Data  │ │ AI Provider    │ │ Agent Decision │
        │ + CoinGecko    │ │ OpenAI /       │ │   Pipeline     │
        │                │ │ Anthropic /    │ │                │
        │                │ │ Gemini         │ │                │
        └───────┬────────┘ └────────────────┘ └───────┬────────┘
                │                                     │
                └──────────────────┬──────────────────┘
                                   ▼
                         ┌──────────────────────┐
                         │  AlphaLens Executor  │
                         │   Smart Contract     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     BOT Chain        │
                         │   On-chain Execution │
                         └──────────────────────┘
```

---

# Tech Stack

## Frontend

* Next.js — App Router
* React
* TypeScript
* Tailwind CSS v4
* Inter + JetBrains Mono
* RainbowKit
* wagmi v2
* viem
* Vercel AI SDK

The frontend uses RainbowKit and wagmi for wallet connection and blockchain interaction.

wagmi is pinned to v2 because of the current RainbowKit compatibility requirements used by the project.

---

## Data & Analytics

* CoinGecko API for multi-asset market prices
* BOT Chain on-chain data
* BDEX pool data
* Custom portfolio analytics
* Opportunity scoring
* Yield-quality analysis
* Risk calculations

---

## AI

AlphaLens uses the **Vercel AI SDK** to keep the AI layer provider-agnostic.

Supported providers can include:

* OpenAI
* Anthropic
* Google Gemini

The application context is constructed by the backend before being passed to the model.

---

## Smart Contracts

* Solidity
* Foundry
* OpenZeppelin
* `SafeERC20`
* `ReentrancyGuard`

Core contract:

`AlphaLensAgentExecutor.sol`

---

# Project Structure

```text
alphalens/
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── overview/
│   │   │   ├── portfolio/
│   │   │   ├── risk/
│   │   │   ├── unlocks/
│   │   │   ├── gas/
│   │   │   └── agent/
│   │   └── api/
│   │       └── agent/
│   │
│   ├── components/
│   │   ├── agent/
│   │   └── ...
│   │
│   ├── hooks/
│   │   ├── usePortfolio.ts
│   │   ├── useBdexPools.ts
│   │   └── ...
│   │
│   └── lib/
│       └── copilotContext.ts
│
├── contracts/
│   └── src/
│       └── AlphaLensAgentExecutor.sol
│
└── README.md
```

---

# BOT Chain

AlphaLens is built specifically for the BOT Chain ecosystem.

### Mainnet

* **Chain ID:** `677`
* **Native Token:** BOT
* **RPC:** `https://rpc.botchain.ai`
* **Explorer:** `https://scan.botchain.ai`

### Testnet

* **Chain ID:** `968`
* **RPC:** `https://rpc.bohr.life`
* **Explorer:** `https://scan.bohr.life`

---

# Contract Deployments

### BOT Chain Testnet

```text
0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1
```

### BOT Chain Mainnet

```text
0xB363a61f16Ca0a69772A9a445c707D5C98590F92
```

---

# Important Contract Notes

### Solidity Compilation

The contracts are compiled with:

```toml
via_ir = true
```

This is required to resolve a `stack too deep` compilation issue.

### Token Allowances

Users must approve the required ERC-20 token allowance before calling `executeDecision`.

Otherwise, the transaction can revert with:

```text
ERC20InsufficientAllowance
```

### Score Conversion

The opportunity score is calculated off-chain as a JavaScript `number`, while the contract expects `minOpportunityScore` as a Solidity integer / `bigint`.

The conversion must therefore happen explicitly at the application-contract boundary.

### ABI Synchronization

Whenever contract parameters are reordered or the ABI changes:

1. Recompile the contract
2. Redeploy the contract
3. Update the frontend contract address
4. Update the frontend ABI

Using a stale ABI against new bytecode can result in an unrecognized function selector or failed transaction.

---

# Security Model

AlphaLens follows a layered approach to autonomous execution.

```text
AI Model
   │
   │ proposes decision
   ▼
Application Validation
   │
   │ validates structure and parameters
   ▼
User Policy
   │
   │ defines acceptable conditions
   ▼
Smart Contract
   │
   │ enforces policy / execution rules
   ▼
BOT Chain
```

The AI model is therefore not treated as a trusted source of truth.

Critical execution conditions are handled by deterministic application logic and smart-contract validation.

Users remain responsible for approving token allowances and configuring appropriate policies.

---

# Frontend Setup

Clone the repository and install dependencies:

```bash
cd frontend
npm install
```

Start the development server:

```bash
npm run dev
```

The application will then be available through the local Next.js development server.

---

# Environment Variables

Create a `.env.local` file inside the `frontend` directory:

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

NEXT_PUBLIC_ALPHALENS_EXECUTOR_ADDRESS=0xF5B91F7D5a3863C244Ba4Cb9b409da9f88654DF1

NEXT_PUBLIC_BOT_CHAIN_RPC_URL=

AI_PROVIDER_API_KEY=
```

Do not commit private API keys or other secrets to the repository.

---

# Smart Contract Setup

From the contracts directory:

```bash
cd contracts
forge install
forge build
forge test
```

---

# Development Flow

A typical autonomous execution flow looks like this:

```text
User connects wallet
        ↓
Portfolio is loaded
        ↓
Market + on-chain data is collected
        ↓
Opportunities are calculated
        ↓
Agent evaluates opportunities
        ↓
Agent produces a structured decision
        ↓
Decision is validated
        ↓
User policy is checked
        ↓
Transaction is submitted
        ↓
AlphaLensAgentExecutor executes on BOT Chain
        ↓
Execution result is recorded
```

---

# Why AlphaLens?

Traditional DeFi dashboards tell users **what is happening**.

AlphaLens is designed to help users understand:

* **What do I currently hold?**
* **Where is my capital?**
* **What opportunities exist?**
* **What risks am I taking?**
* **What should I do?**
* **Can an agent execute that action within my rules?**

The combination of portfolio intelligence, AI reasoning, policy-based autonomy, and on-chain execution turns AlphaLens from a passive dashboard into an **AI-native DeFi copilot**.

---

# Current Scope

AlphaLens currently focuses on the BOT Chain ecosystem and its available DeFi infrastructure.

The architecture is designed to be extensible toward:

* Additional tokens
* Additional liquidity pools
* More DeFi protocols
* More sophisticated risk models
* Additional AI providers
* More autonomous strategies
* Expanded policy controls
* Additional on-chain execution routes

---

# Disclaimer

AlphaLens is an experimental DeFi application built for the BOT Chain ecosystem and hackathon purposes.

DeFi protocols, smart contracts, AI-generated decisions, market data, and autonomous execution can involve significant risk.

Users should independently verify transactions, smart-contract addresses, token approvals, and trading decisions before interacting with the system.

---

## License

This project is provided for development and hackathon purposes.
