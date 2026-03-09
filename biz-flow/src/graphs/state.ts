import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { UserRow } from "../types/user.types";

export const GraphStateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  user: Annotation<UserRow>(),
  messages: Annotation<BaseMessage[]>({
    reducer: (x: BaseMessage[], y: BaseMessage | BaseMessage[]) => {
      const added = Array.isArray(y) ? y : [y];
      return x.concat(added);
    },
    default: () => [],
  }),
  toolResults: Annotation<any[]>({
    reducer: (x: any[], y: any | any[]) => {
      const added = Array.isArray(y) ? y : [y];
      return x.concat(added);
    },
    default: () => [],
  }),
  reply: Annotation<string>(),

  // App graph state specific fields
  appId: Annotation<string>(),
  dataUpdates: Annotation<any[]>({
    reducer: (x: any[], y: any | any[]) => {
      const added = Array.isArray(y) ? y : [y];
      return x.concat(added);
    },
    default: () => [],
  }),
});

export type GraphState = typeof GraphStateAnnotation.State;
