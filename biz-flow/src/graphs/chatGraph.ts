import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphStateAnnotation, GraphState } from "./state";
import { plannerNode } from "../nodes/plannerNode";
import { toolNode } from "../nodes/toolNode";
import { responseNode } from "../nodes/responseNode";
import { AIMessage } from "@langchain/core/messages";

const shouldContinue = (state: GraphState) => {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  return "respond";
};

const graphBuilder = new StateGraph(GraphStateAnnotation)
  .addNode("planner", plannerNode)
  .addNode("tools", toolNode)
  .addNode("respond", responseNode)
  .addEdge(START, "planner")
  .addConditionalEdges("planner", shouldContinue, {
    tools: "tools",
    respond: "respond",
  })
  .addEdge("tools", "planner")
  .addEdge("respond", END);

export const chatGraph = graphBuilder.compile();
