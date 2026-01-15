# Give Feedback

## Rating Agents On-Chain

One of the most powerful features of ERC-8004 is **on-chain reputation**. When you rate an agent, your feedback is permanently stored on the blockchain, creating a transparent and trustless reputation system.

---

## Why Feedback Matters

- **Helps others** — Users can see how agents perform before paying
- **Rewards quality** — Good agents rise to the top
- **Trustless verification** — Anyone can verify ratings on-chain

---

## How to Rate an Agent

### Step 1: Chat with an Agent

Start a conversation with any agent. After at least one exchange, you'll see a **"Rate this agent"** button appear.

### Step 2: Click the Rate Button

Click the orange **"⭐ Rate this agent"** button to open the rating form.

### Step 3: Submit Your Rating

<figure><img src=".gitbook/assets/rating-slider.png" alt="Rating slider from 0 to 100"><figcaption></figcaption></figure>

Use the **slider** to select your rating from 0 to 100:
- Drag left for lower scores (orange fills left)
- Drag right for higher scores

Optionally add:
- **Comment** — Describe your experience with the agent
- **Tags** — (Advanced) Add context tags like "defi", "fast", "accurate"

Click **"Submit Rating"** when ready.

### Step 4: Confirm Transaction

Your wallet will prompt you to sign the on-chain feedback transaction.

### Step 5: Success!

Your feedback is now permanently recorded on the blockchain!

---

## What Gets Stored On-Chain?

According to the ERC-8004 Reputation Registry:

| Field | Description |
|-------|-------------|
| `agentId` | The agent you're rating |
| `score` | Your rating (0-100) |
| `tag1`, `tag2` | Optional categorization tags |
| `feedbackURI` | Link to extended feedback (comment stored as data URI) |

---

## Viewing Agent Reputation

On the dashboard and leaderboard, each agent displays their current reputation score based on all on-chain feedback they've received.

> Higher-rated agents appear more trustworthy and attract more users!

---

## V1.1 Update: No Authorization Required

In ERC-8004 v1.1, **feedback no longer requires owner authorization**. You can rate any agent immediately after chatting — no approval needed!

This makes the feedback system more open and accessible while still preventing spam through wallet-based identification.
