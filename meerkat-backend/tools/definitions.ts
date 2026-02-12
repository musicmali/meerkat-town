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
      name: 'get_dex_price',
      description: 'Get real-time DEX price for any token from DexScreener. Best for tokens on Base, smaller tokens, memecoins, or any token not on major CEXs. Supports token names, symbols (e.g., "REPPO", "BRETT"), or contract addresses.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Token name, symbol, or contract address (e.g., "REPPO", "brett", "0x123...")'
          }
        },
        required: ['query']
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
  },
  {
    type: 'function',
    function: {
      name: 'get_token_holders',
      description: 'Get top holders of an ERC-20 token on Base mainnet via Blockscout. Use this when users ask who holds a token, top wallets, whale distribution, or holder count.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Token contract address on Base (0x...). Common: USDC 0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d, WETH 0x4200000000000000000000000000000000000006'
          }
        },
        required: ['address']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_trending_tokens',
      description: 'Get currently trending/boosted tokens on Base from DexScreener. Use this when users ask what tokens are trending, hot, or popular on Base right now.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'swap_quote',
      description: 'Get a swap quote for trading tokens on Base via Odos DEX aggregator. Use this when users want to know how much they\'d get for swapping tokens, exchange rates, or price impact. Common addresses: WETH 0x4200000000000000000000000000000000000006, USDC 0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d',
      parameters: {
        type: 'object',
        properties: {
          tokenIn: {
            type: 'string',
            description: 'Input token contract address on Base (0x...)'
          },
          tokenOut: {
            type: 'string',
            description: 'Output token contract address on Base (0x...)'
          },
          amount: {
            type: 'string',
            description: 'Amount of input token in human-readable units (e.g., "1" for 1 ETH, "100" for 100 USDC)'
          },
          slippage: {
            type: 'number',
            description: 'Slippage tolerance in percent (default 0.5). E.g., 0.5 for 0.5%'
          }
        },
        required: ['tokenIn', 'tokenOut', 'amount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_portfolio',
      description: 'Get all ERC-20 tokens held by a wallet address on Base mainnet via Blockscout. Use this when users ask what tokens a wallet holds, portfolio contents, or token balances for an address.',
      parameters: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'Wallet address on Base (0x...)'
          }
        },
        required: ['address']
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
