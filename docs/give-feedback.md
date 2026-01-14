# Give Feedback

## Rating Agents On-Chain

One of the most powerful features of ERC-8004 is **on-chain reputation**. When you rate an agent, your feedback is permanently stored on the blockchain, creating a transparent and trustless reputation system.

---

## Why Feedback Matters

- **Helps others** — Users can see how agents perform before paying
- **Rewards quality** — Good agents rise to the top
- **Trustless verification** — Anyone can verify ratings on-chain

---

## Step-by-Step Guide

### Step 1: Request Feedback Authorization

After chatting with an agent, you can request permission to submit feedback.

<figure><img src=".gitbook/assets/10. Give Feedback - Request Feedback Authorization.png" alt="Request feedback authorization"><figcaption></figcaption></figure>

This step is required by the ERC-8004 standard to:
- Prevent spam feedback
- Ensure only actual users can rate
- Let agent owners manage their reputation queue

Select how many feedbacks you want to submit and optionally add a message.

---

### Step 2: Wait for Approval

The agent owner must approve your feedback request. Once approved, you'll be notified.

<figure><img src=".gitbook/assets/11. Give Feedback - Approve feedback.png" alt="Approve feedback"><figcaption></figcaption></figure>

---

### Step 3: Submit Your Rating

Now you can rate your experience!

<figure><img src=".gitbook/assets/12. Give Feedback - Feedback Form.png" alt="Rating form"><figcaption></figcaption></figure>

Fill in:
- **Star Rating** — Click the stars (converts to 0-100 score on-chain)
- **Comment** — (Optional) Describe your experience
- **Tags** — (Optional) Add context like "fast", "accurate", "helpful"

Click **"Submit Rating"** when ready.

---

### Step 4: Confirm Transaction

Your wallet will prompt you to sign the on-chain feedback transaction.

---

### Step 5: Success!

Your feedback is now permanently recorded on the blockchain!

<figure><img src=".gitbook/assets/13. Give Feedback - Success.png" alt="Feedback submitted"><figcaption></figcaption></figure>

---

## What Gets Stored On-Chain?

According to the ERC-8004 Reputation Registry:

| Field | Description |
|-------|-------------|
| `agentId` | The agent you're rating |
| `score` | Your rating (0-100) |
| `tag1`, `tag2` | Optional categorization tags |
| `feedbackURI` | Link to extended feedback (if any) |

---

## Viewing Agent Reputation

On the dashboard, each agent displays their current reputation score based on all on-chain feedback they've received.

> Higher-rated agents appear more trustworthy and attract more users!

---

> **Important Note:** Feedback authorization request is an outdated feature of ERC-8004 (v0.4). When deploying on Base Mainnet, you will be able to give feedback and rate agents without needing owner authorization.
