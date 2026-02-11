# Smart Contracts

Smart contracts are self-executing programs deployed on blockchains that automatically enforce rules and execute transactions when conditions are met. Once deployed, they are immutable and operate without intermediaries.

## Solidity Fundamentals

### Language Basics
- Solidity is the primary language for Ethereum and EVM-compatible chains
- Statically typed, supports inheritance and libraries
- Files use `.sol` extension with a pragma version declaration
- Contract structure: state variables, functions, events, modifiers
- Data types: uint256, int256, address, bool, bytes, string, arrays, mappings, structs, enums

### Functions
- Visibility: public, private, internal, external
- State mutability: view (read-only), pure (no state access), payable (accepts ETH)
- Function modifiers for access control and validation
- Constructor runs once at deployment
- Fallback and receive functions handle ETH transfers

### Storage and Memory
- Storage: persistent on-chain data (expensive to write)
- Memory: temporary data during function execution (cheaper)
- Calldata: read-only input data for external functions (cheapest)
- Stack: local value types, limited to 16 variables deep

## Token Standards

### ERC-20 (Fungible Tokens)
- Standard interface for interchangeable tokens (USDC, UNI, AAVE)
- Core functions: transfer, approve, transferFrom, balanceOf, totalSupply, allowance
- Events: Transfer, Approval
- Used for governance tokens, stablecoins, utility tokens

### ERC-721 (Non-Fungible Tokens)
- Each token has a unique ID and optional metadata
- Core functions: ownerOf, safeTransferFrom, approve, setApprovalForAll
- tokenURI points to metadata (JSON with name, description, image)
- Used for digital art, collectibles, memberships, identity

### ERC-1155 (Multi-Token)
- Single contract manages both fungible and non-fungible tokens
- Batch operations for efficiency (batch transfer, batch balance)
- Used for gaming items, mixed collections
- More gas-efficient than deploying separate ERC-20 and ERC-721

### ERC-8004 (AI Agent Registry)
- Standard for registering AI agents on-chain
- Identity Registry for agent metadata (name, skills, capabilities)
- Reputation Registry for on-chain feedback scores
- Validation Registry for agent verification
- Used by Meerkat Town for AI agent marketplace

### ERC-4626 (Tokenized Vaults)
- Standard for yield-bearing vault tokens
- Deposit/withdraw underlying assets, receive shares
- Used by lending protocols and yield aggregators

## Common Patterns

### Access Control
- Ownable: single admin address, transferable ownership
- Role-Based (AccessControl): multiple roles with different permissions
- Timelock: delay before executing sensitive operations
- Multisig: require multiple signatures for critical actions

### Proxy Patterns (Upgradeability)
- Transparent Proxy: admin calls proxy, users forwarded to implementation
- UUPS (Universal Upgradeable Proxy): upgrade logic in implementation contract
- Diamond Pattern (EIP-2535): modular upgrades with multiple facets
- Beacon Proxy: multiple proxies share one implementation pointer

### Factory Pattern
- Contract that deploys other contracts
- CREATE2 for deterministic addresses
- Clone (minimal proxy, EIP-1167) for gas-efficient cloning
- Used for deploying token pairs, vaults, or agent contracts

### Reentrancy Guard
- Prevents recursive calls that drain funds
- Use OpenZeppelin's ReentrancyGuard modifier
- Checks-Effects-Interactions pattern: update state before external calls
- Critical for any function that sends ETH or calls external contracts

## OpenZeppelin Library

### Overview
- Most widely used smart contract library
- Audited, battle-tested implementations
- Install: `forge install OpenZeppelin/openzeppelin-contracts`
- Covers tokens (ERC-20, 721, 1155), access control, security, governance, proxies

### Key Contracts
- `Ownable.sol`: Simple single-owner access control
- `AccessControl.sol`: Role-based permissions
- `ReentrancyGuard.sol`: Reentrancy protection
- `Pausable.sol`: Emergency stop mechanism
- `ERC20.sol`, `ERC721.sol`, `ERC1155.sol`: Token implementations
- `SafeERC20.sol`: Safe token transfer wrappers

## Testing with Foundry

### Forge Test Basics
- Write tests in Solidity (not JavaScript)
- Test files in `test/` directory, named `*.t.sol`
- Test functions prefixed with `test_` or `testFuzz_`
- `setUp()` function runs before each test
- Assertions: `assertEq`, `assertTrue`, `assertGt`, `assertLt`

### Cheatcodes
- `vm.prank(address)`: set msg.sender for next call
- `vm.deal(address, amount)`: set ETH balance
- `vm.warp(timestamp)`: set block.timestamp
- `vm.roll(blockNumber)`: set block.number
- `vm.expectRevert()`: expect next call to revert
- `vm.expectEmit()`: verify events are emitted

### Fuzz Testing
- Foundry automatically generates random inputs
- `function testFuzz_deposit(uint256 amount) public`
- Use `vm.assume()` to constrain inputs
- Default: 256 runs, configurable in foundry.toml
- Finds edge cases humans would miss

### Fork Testing
- Test against live blockchain state
- `forge test --fork-url <RPC_URL>`
- Interact with deployed contracts in tests
- Useful for testing integrations with existing protocols

## Gas Optimization

### Storage Optimization
- Pack variables into 32-byte slots (uint128 + uint128 = 1 slot)
- Use mappings over arrays for large datasets
- Use bytes32 instead of string when possible
- Mark variables as immutable or constant when applicable
- Delete storage to get gas refunds

### Function Optimization
- Use calldata instead of memory for read-only parameters
- Short-circuit conditions (cheaper checks first)
- Use unchecked blocks for math that cannot overflow
- Avoid redundant storage reads (cache in local variables)
- Use custom errors instead of require strings (saves ~50 gas per error)

### Common Gas-Saving Patterns
- Batch operations instead of multiple transactions
- Use events for data that doesn't need on-chain access
- Minimize on-chain storage, use IPFS/Arweave for large data
- Prefer `++i` over `i++` in loops
- Use `!= 0` instead of `> 0` for unsigned integers

## Common Vulnerabilities

### Reentrancy
- Attacker recursively calls a function before state updates
- The DAO hack (2016) was a reentrancy attack
- Prevention: ReentrancyGuard, Checks-Effects-Interactions pattern

### Front-Running / MEV
- Miners/validators reorder transactions for profit
- Sandwich attacks: attacker places trades before and after victim
- Prevention: commit-reveal schemes, private mempools (Flashbots)

### Integer Overflow/Underflow
- Solidity 0.8+ has built-in overflow checks
- Pre-0.8 contracts used SafeMath library
- Still relevant in unchecked blocks

### Oracle Manipulation
- Attackers manipulate price feeds to exploit protocols
- Flash loan attacks can distort spot prices
- Prevention: use TWAP (time-weighted average), Chainlink oracles

### Access Control Issues
- Missing or incorrect permission checks
- Unprotected initialize functions on proxies
- Default visibility is public in older Solidity versions

### Flash Loan Attacks
- Borrow massive amounts without collateral in a single transaction
- Used to manipulate prices, exploit governance, drain pools
- Prevention: use time-weighted data, block same-block operations

## Deployment and Verification

### Deployment with Foundry
- Use `forge create` for simple deployments
- Use `forge script` for complex deployment scripts
- Specify RPC URL, private key, and constructor arguments
- Always verify on block explorer after deployment

### Contract Verification
- `forge verify-contract` on Etherscan/Basescan
- Makes source code publicly readable and auditable
- Verified contracts show green checkmark on explorers
- Required for user trust and composability

## Events and Indexing

### Events
- Emit data from smart contracts for off-chain consumption
- Indexed parameters (up to 3) enable efficient filtering
- Much cheaper than storage for logging purposes
- Standard: `event Transfer(address indexed from, address indexed to, uint256 value)`

### The Graph
- Decentralized indexing protocol for querying blockchain data
- Subgraphs define how to index specific contract events
- GraphQL API for querying indexed data
- Essential for building dApp frontends that need historical data
