// ============================================================================
// AGENT TOOLS - OpenAI Function Calling Definitions
// ============================================================================
// Define tools that agents can use to fetch real-time data and perform actions
// ============================================================================

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * Tools available to all Meerkat agents
 * These enable real-time data fetching and on-chain queries
 */
export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_crypto_price',
      description: 'Get current price of a cryptocurrency in USD. Use this when users ask about token prices, market data, or want to know how much a crypto is worth.',
      parameters: {
        type: 'object',
        properties: {
          coinId: {
            type: 'string',
            description: 'CoinGecko coin ID (e.g., "bitcoin", "ethereum", "usd-coin"). For less common tokens, use the full name in lowercase with hyphens.'
          }
        },
        required: ['coinId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_wallet_balance',
      description: 'Get ETH balance for a wallet address on Base Sepolia network. Use this when users want to check their wallet balance or any address balance.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Ethereum wallet address (0x...)'
          }
        },
        required: ['address']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_gas_price',
      description: 'Get current gas prices on Base Sepolia network. Use this when users ask about gas fees or transaction costs.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_token_info',
      description: 'Get on-chain information about an ERC-20 token on Base Sepolia (name, symbol, decimals, total supply). Use this when users ask about a specific token contract.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Token contract address (0x...)'
          }
        },
        required: ['address']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_block_number',
      description: 'Get the latest block number on Base Sepolia. Use this when users ask about the current block or blockchain state.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_transaction',
      description: 'Get details about a specific transaction on Base Sepolia. Use this when users provide a transaction hash and want to know its status or details.',
      parameters: {
        type: 'object',
        properties: {
          hash: {
            type: 'string',
            description: 'Transaction hash (0x...)'
          }
        },
        required: ['hash']
      }
    }
  }
];

/**
 * Tool names for easy reference
 */
export const TOOL_NAMES = AGENT_TOOLS.map(t => {
  if (t.type === 'function') {
    return t.function.name;
  }
  return '';
}).filter(Boolean);

/**
 * Get a human-readable list of tools for system prompts
 */
export function getToolDescriptions(): string {
  return AGENT_TOOLS.map(t => {
    if (t.type === 'function') {
      return `- ${t.function.name}: ${t.function.description}`;
    }
    return '';
  }).filter(Boolean).join('\n');
}
