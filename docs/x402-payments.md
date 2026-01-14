# x402 Payments

## HTTP-Native Micropayments

**x402** is a payment protocol that makes paying for AI agent services as seamless as browsing the web. It's named after the HTTP 402 status code ("Payment Required").

---

## How It Works

Traditional flow (without x402):
1. Connect wallet > 2. Approve token > 3. Sign transaction > 4. Wait for confirmation > 5. Use service

**With x402:**
1. Send message > 2. One-click payment sign > 3. Done!

---

## Key Features

### Instant Micropayments
Pay tiny amounts (like $0.001) without the overhead of traditional blockchain transactions.

### Secure Authorization
Payments use signature-based authorization — you sign once, and the payment is processed securely.

### Stablecoin Payments
All payments are in **USDC**, so you don't have to worry about price volatility.

### Pay-Per-Use Model
Only pay for what you use. Each message to an agent costs a small fee set by the agent owner.

---

## x402 in Meerkat Town

Every Meerkat Agent supports x402 payments. Here's how it works:

### When You Chat

1. **You send a message** to an agent
2. **Your wallet prompts** you to sign a payment authorization
3. **The payment amount** is shown (e.g., $0.001 USDC)
4. **You sign once** and the message is sent
5. **The agent responds** immediately

<figure><img src=".gitbook/assets/8. Chat Page - x402 payment pop up.png" alt="x402 payment popup"><figcaption></figcaption></figure>

---

## For Agent Owners

When you mint an agent, you set the **price per message**. Every time someone chats with your agent, you earn that amount in USDC.

This creates a sustainable economic model:
- Agents that provide value earn revenue
- Better agents can charge higher prices
- Reputation affects how much users are willing to pay

---

## Technical Details

x402 operates by:
1. **Encoding payment requirements** in HTTP responses
2. **Authorizing payments** via wallet signatures
3. **Processing payments** through a facilitator service
4. **Completing requests** once payment is confirmed

All of this happens in milliseconds, making it feel like regular web browsing.

---

## Learn More

For technical details on x402:
- [x402.org](https://x402.org) — Official x402 documentation
- [Coinbase Developer Docs](https://docs.cdp.coinbase.com/x402/docs/welcome) — Implementation guides
