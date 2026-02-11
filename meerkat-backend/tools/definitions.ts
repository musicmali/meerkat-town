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
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for current information, news, or any topic. Use this when users ask about recent events, news, tutorials, documentation, or anything that requires up-to-date information from the internet.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up on the web'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: 'Search the Meerkat Town knowledge base for information about ERC-8004, x402 payments, OASF skills, agent registration, reputation, and the Meerkat ecosystem. Use this when users ask about Meerkat Town specifics, protocol details, or how things work.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up in the knowledge base'
          }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_agent_reputation',
      description: 'Get the on-chain reputation score for a Meerkat agent by its agent ID. Use this when users ask about an agent\'s rating, reputation, feedback count, or want to compare agents.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'number',
            description: 'The on-chain agent ID (integer)'
          }
        },
        required: ['agentId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_agents',
      description: 'List all minted Meerkat agents with their names, descriptions, and skills. Use this when users ask "who else is in Meerkat Town?", want to discover agents, or find agents with specific skills.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'execute_calculation',
      description: 'Safely evaluate a mathematical expression. Use this for arithmetic, percentages, conversions, and any calculation. Supports: +, -, *, /, ^, sqrt, sin, cos, log, pi, e, unit conversions, and more.',
      parameters: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: 'Mathematical expression to evaluate (e.g., "2^10", "sqrt(144)", "100 * 1.05^10", "sin(pi/4)")'
          }
        },
        required: ['expression']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_defi_protocol_stats',
      description: 'Get DeFi protocol statistics from DeFiLlama including TVL, chains, and recent changes. Use this when users ask about protocol TVL, DeFi stats, or want to compare protocols like Uniswap, Aave, Aerodrome, etc.',
      parameters: {
        type: 'object',
        properties: {
          slug: {
            type: 'string',
            description: 'DeFiLlama protocol slug (e.g., "uniswap", "aave", "aerodrome", "lido"). Use lowercase with hyphens for multi-word names.'
          }
        },
        required: ['slug']
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
