// ─── Central Tool Registry ───────────────────────────────────────────────────
// To add a new tool:
//   1. Create a new file in src/tools/
//   2. Export a LangChain tool from it
//   3. Import it here and add it to the `tools` array
// No other code changes are needed.

import { addNumbersTool } from './addNumbersTool';
import { subtractNumbersTool } from './subtractNumbersTool';
import { randomJokeTool } from './randomJokeTool';
import { prettifyResponseTool } from './prettifyTool';

export const tools = [
  addNumbersTool,
  subtractNumbersTool,
  randomJokeTool,
  prettifyResponseTool,
];

export type AppTool = typeof tools[number];
