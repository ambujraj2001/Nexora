import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { log } from '../utils/logger';

const addNumbersSchema = z.object({
  a: z.number().describe('The first number to add'),
  b: z.number().describe('The second number to add'),
});

export const addNumbersTool = tool(
  async ({ a, b }: { a: number; b: number }): Promise<string> => {
    log({ event: 'tool_execution_started', toolName: 'add_numbers', args: { a, b } });
    const result = a + b;
    return String(result);
  },
  {
    name: 'add_numbers',
    description: 'Adds two numbers together and returns the result. Use this when asked to add, sum, or calculate the total of two numbers.',
    schema: addNumbersSchema,
  },
);
