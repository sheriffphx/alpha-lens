## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### AlphaLensExecutor tests

The normal suite uses local mocks and runs without network access:

```shell
$ forge test
```

The BOT fork tests validate the deployed router/factory relationship on both supported
networks. They are skipped unless the matching RPC URL is supplied; fork calls execute
only against Foundry's local fork and do not broadcast a transaction:

```shell
$ BOT_MAINNET_RPC_URL=https://your-bot-mainnet-rpc \
  BOT_TESTNET_RPC_URL=https://your-bot-testnet-rpc \
  forge test --match-contract AlphaLensExecutorBotForkTest -vvv
```

Expected chain IDs: BOT mainnet `677`; BOT testnet `968`.

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
