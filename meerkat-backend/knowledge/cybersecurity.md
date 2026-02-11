# Cybersecurity

Cybersecurity is the practice of protecting systems, networks, and data from digital attacks, unauthorized access, and damage. In the Web3 era, it extends to smart contract security, wallet protection, and decentralized application defense.

## Web3 Security

### Smart Contract Auditing
- Manual code review by experienced auditors
- Automated analysis with tools like Slither, Mythril, Aderyn
- Formal verification for mathematical correctness proofs
- Typical audit process: scoping, analysis, report, remediation, re-audit
- Top audit firms: Trail of Bits, OpenZeppelin, Cyfrin, Consensys Diligence, Spearbit
- Bug bounties complement audits (Immunefi, HackerOne)

### Common Smart Contract Vulnerabilities
- **Reentrancy**: recursive calls before state updates (the DAO hack pattern)
- **Oracle manipulation**: corrupting price feeds via flash loans
- **Access control flaws**: missing permission checks on critical functions
- **Integer overflow/underflow**: arithmetic errors (mitigated in Solidity 0.8+)
- **Flash loan attacks**: exploit price discrepancies within a single transaction
- **Front-running / MEV**: transaction ordering manipulation by validators
- **Logic errors**: business logic bugs that bypass intended constraints
- **Uninitialized proxies**: missing initialization on upgradeable contracts

### DeFi Security Considerations
- Protocol composability creates cascading risk (one hack affects many protocols)
- Bridge security is critical (bridges hold large amounts of cross-chain assets)
- Governance attacks: acquiring enough tokens to pass malicious proposals
- Economic attacks: exploiting tokenomics or incentive misalignments
- Time-lock and multisig for protocol upgrades (limit single-point-of-failure)

## Wallet Security

### Seed Phrase Security
- 12 or 24 words that control your entire wallet
- Never share, photograph, or store digitally unencrypted
- Store on metal plates or paper in a secure physical location
- Consider splitting across multiple locations (Shamir's Secret Sharing)
- Never enter seed phrases on websites or DMs

### Hardware Wallets
- Store private keys offline on dedicated device
- Sign transactions physically on the device
- Popular: Ledger, Trezor, GridPlus, Keystone
- Even with hardware wallet, seed phrase backup is essential
- Verify transaction details on the device screen before signing

### Multisig Wallets
- Require M-of-N signatures to execute transactions (e.g., 2-of-3)
- Protects against single key compromise
- Safe (formerly Gnosis Safe) is the most popular multisig
- Used by protocols, DAOs, and high-value individuals
- Social recovery: trusted parties help recover access

### Wallet Best Practices
- Use separate wallets for different purposes (daily use, long-term storage, DeFi)
- Regularly revoke token approvals (revoke.cash, etherscan token approval checker)
- Verify contract addresses before interacting
- Use transaction simulation tools (Pocket Universe, Fire, Blowfish)
- Enable all available security features on hardware wallets

## Common Attack Vectors

### Phishing
- Fake websites mimicking legitimate DApps or wallets
- Malicious approval requests disguised as minting or claiming
- Social engineering via DMs (Discord, Telegram, Twitter)
- Fake customer support impersonating official teams
- Prevention: bookmark trusted sites, verify URLs, never click DM links

### Approval Phishing
- Tricking users into signing unlimited token approvals
- Attacker then drains tokens using the approval
- Often disguised as free mints, airdrops, or claim pages
- Prevention: read what you're signing, use hardware wallet, review approvals

### Address Poisoning
- Attacker sends tiny transactions from addresses that look similar to yours
- User copies poisoned address from transaction history
- Sends funds to attacker's lookalike address
- Prevention: always verify full address, use address book feature

### SIM Swap Attacks
- Attacker ports your phone number to their SIM
- Bypasses SMS-based two-factor authentication
- Gains access to email, exchange accounts, social media
- Prevention: use authenticator apps or hardware keys instead of SMS 2FA

### Social Engineering
- Impersonation of team members, influencers, or support staff
- Urgency tactics ("act now or lose access")
- Fake partnerships or job offers
- Prevention: verify through official channels, be skeptical of urgency

## DeFi Exploits

### Flash Loan Attacks
- Borrow massive amounts without collateral in a single transaction
- Use borrowed funds to manipulate prices, drain pools, or exploit logic bugs
- Atomic: if exploit fails, entire transaction reverts (risk-free for attacker)
- Prevention: use TWAP oracles, block same-block interactions for sensitive operations

### Price Manipulation
- Manipulate spot prices on low-liquidity pools
- Exploit protocols that read spot price instead of time-weighted average
- Often combined with flash loans for capital efficiency
- Prevention: Chainlink oracles, TWAP, multiple price sources

### Governance Attacks
- Acquire voting power (buy or flash-loan governance tokens)
- Pass malicious proposals that drain treasury or change parameters
- Prevention: time-locks on execution, vote delegation, quorum requirements

### Sandwich Attacks
- Attacker places a buy order before and sell order after a victim's trade
- Profits from the price impact of the victim's trade
- Very common on Ethereum mainnet
- Prevention: use MEV-protected RPC (Flashbots Protect), set tight slippage

## Web Application Security (OWASP Top 10)

### Injection
- SQL injection, command injection, NoSQL injection
- Attacker inserts malicious code through user input
- Prevention: parameterized queries, input validation, ORM usage

### Cross-Site Scripting (XSS)
- Attacker injects malicious scripts into web pages
- Stored XSS, reflected XSS, DOM-based XSS
- Prevention: output encoding, Content Security Policy (CSP), sanitize input

### Cross-Site Request Forgery (CSRF)
- Attacker tricks user's browser into making unwanted requests
- Prevention: CSRF tokens, SameSite cookies, verify origin header

### Broken Authentication
- Weak passwords, credential stuffing, session hijacking
- Prevention: MFA, strong password policies, secure session management

### Sensitive Data Exposure
- Unencrypted data in transit or at rest
- Exposed API keys, secrets in source code
- Prevention: HTTPS everywhere, encrypt at rest, secrets management

### Security Misconfiguration
- Default credentials, unnecessary services, verbose errors
- Prevention: hardening checklists, automated scanning, minimal configuration

## Security Tools

### Smart Contract Analysis
- **Slither**: static analysis for Solidity (free, by Trail of Bits)
- **Mythril**: symbolic execution for finding vulnerabilities
- **Aderyn**: Rust-based static analysis tool
- **Echidna**: property-based fuzzing for smart contracts
- **Certora Prover**: formal verification
- **OpenZeppelin Defender**: monitoring and automated response

### Blockchain Security
- **Forta**: decentralized monitoring network for on-chain threats
- **Chainalysis / Elliptic**: blockchain analytics and compliance
- **Tenderly**: transaction simulation and debugging
- **BlockSec Phalcon**: real-time attack detection
- **DeFiSafety**: protocol security scoring

### General Security
- **Burp Suite**: web application penetration testing
- **Nmap**: network scanning and discovery
- **Wireshark**: network protocol analyzer
- **OWASP ZAP**: web application security scanner
- **HashiCorp Vault**: secrets management

## Incident Response

### Response Steps
1. **Detect**: identify the breach or attack
2. **Contain**: limit the damage (pause contracts, revoke access)
3. **Analyze**: understand what happened and scope of impact
4. **Remediate**: fix the vulnerability
5. **Recover**: restore services and lost funds if possible
6. **Post-mortem**: document lessons learned and improve defenses

### DeFi Incident Response
- Emergency pause mechanisms in smart contracts
- War rooms: coordinate response with team and security partners
- Communication: transparent disclosure to community
- Whitehat coordination: work with ethical hackers who find vulnerabilities
- Fund recovery: negotiate with attackers, on-chain tracking

## Zero-Trust Architecture

### Principles
- Never trust, always verify
- Least privilege access for every user and system
- Assume breach and design for containment
- Verify explicitly based on all available data points
- Micro-segmentation of networks and systems

### Implementation
- Identity verification for every access request
- Device health checks before granting access
- Network segmentation and micro-perimeters
- Continuous monitoring and logging
- Automated threat detection and response
