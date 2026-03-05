import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { log } from '../utils/logger';

const subtractNumbersSchema = z.object({
  a: z.number().describe('The number to subtract from'),
  b: z.number().describe('The number to subtract'),
});

export const subtractNumbersTool = tool(
  async ({ a, b }: { a: number; b: number }): Promise<string> => {
    log({ event: 'tool_execution_started', toolName: 'subtract_numbers', args: { a, b } });
    const result = a - b;
    return String(result);
  },
  {
    name: 'subtract_numbers',
    description: 'Subtracts one number from another and returns the result. Use this when asked to subtract, find the difference, or take away one number from another.',
    schema: subtractNumbersSchema,
  },
);
