// Tool Registry - Manages available tools for AI

import type { Tool, ToolResult } from '../types';

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool by name
   */
  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        toolCallId: '',
        name,
        result: `Tool not found: ${name}`,
        isError: true,
      };
    }

    try {
      const result = await tool.execute(args);
      return {
        toolCallId: '',
        name,
        result: typeof result === 'string' ? result : JSON.stringify(result),
        isError: false,
      };
    } catch (error) {
      return {
        toolCallId: '',
        name,
        result: error instanceof Error ? error.message : 'Unknown error',
        isError: true,
      };
    }
  }

  /**
   * Get tools in OpenAI function calling format
   */
  getToolsForLLM(): {
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }[] {
    return this.getAllTools().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear();
  }
}

// Singleton instance
export const toolRegistry = new ToolRegistry();
