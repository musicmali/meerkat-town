// ============================================================================
// MCP ADAPTER - Convert OpenAI tool format to MCP tool format
// ============================================================================

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

/**
 * MCP Tool format (Model Context Protocol)
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Convert OpenAI ChatCompletionTool[] to MCP tool format
 *
 * OpenAI: { type: 'function', function: { name, description, parameters } }
 * MCP:    { name, description, inputSchema }
 */
export function convertToMCPTools(tools: ChatCompletionTool[]): MCPTool[] {
  return tools
    .filter(t => t.type === 'function')
    .map(t => ({
      name: t.function.name,
      description: t.function.description || '',
      inputSchema: {
        type: 'object',
        properties: (t.function.parameters as any)?.properties || {},
        required: (t.function.parameters as any)?.required,
      },
    }));
}
