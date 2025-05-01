import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

// Define the parameter type
export type Parameter = {
  name: string;
  suggested: string[];
};

// Define the visual type
export type Visual = {
  name?: string;
  code?: string;
  description?: string;
  parameters?: Parameter[];
};

export const StateAnnotation = Annotation.Root({
  /**
   * Holds the sequence of messages exchanged in the conversation.
   */
  messages: Annotation<BaseMessage[], BaseMessageLike[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  /**
   * The visual information including name, code, description, and parameters
   */
  visual: Annotation<Visual>(),

  /**
   * Counter for iterations through the fix cycle
   */
  iterations: Annotation<number>({
    reducer: (a, b) => a + b,
    default: () => 0,
  }),
});
