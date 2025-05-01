import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { START, END, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state.js";
import { z } from "zod";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { loadDocs } from "./fetch_docs.js";
// https://langchain-ai.github.io/langgraph/cloud/how-tos/use_stream_react/#typescript

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPEN_AI_API,
});

const codeFormatter = tool(async () => {}, {
  name: "code_formatter",
  schema: z.object({
    answerPrefix: z.string().describe("An explanation of your solution and code"),
    name: z.string().max(50).describe("Short name for the visual (max 50 characters)"),
    parameters: z
      .array(
        z.object({
          name: z.string().describe("Name of the parameter"),
          suggested: z
            .array(z.string())
            .describe("List of data streams it could be mapped to by default"),
        }),
      )
      .optional()
      .describe("Data parameters for the visual"),
    code: z.string().describe("P5.js code block"),
  }),
});

// Preload and cache context data
const preloadContext = async () => {
  const { intro, quickStart } = loadDocs;
  const [introDocs, quickStartDocs] = await Promise.all([intro, quickStart]);
  return {
    introDocs,
    quickStartDocs,
  };
};

const contextCache = await preloadContext();

async function checkDetailSufficiency(state: typeof StateAnnotation.State) {
  const checkDetailSufficiency = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an assistant helping a P5.js coder understand a designer. 
        The designer may provide instructions or an image with instructions.
        You will check if the user has provided enough details for the coder.
        You will never code since you will just pass the job to the next person.
        The designer may also leave some decisions to the coder. That's okay.
        If they have you will respond with PROCEED.
        Otherwise you will respond with REPROMPT.
        `,
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await checkDetailSufficiency.invoke({
    messages: state.messages, // Considering changing to last message
    context: contextCache.introDocs,
  });
  const response = await model.invoke(prompt.messages);

  const responseContent = response.content.toString().trim().toUpperCase();

  if (responseContent.includes("PROCEED")) {
    return "proceed";
  } else {
    return "back";
  }
}

async function askForMoreDetails(state: typeof StateAnnotation.State) {
  const moreDetailsPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an assistant helping a designer better explain their P5.js sketch requirements.
      The designer will be using the You: Quantified web platform.
      Some basic information about the platform is the following: {context}
      Ask specific questions to get more information about visual elements, colors, interactions, and any other details.
      Be specific and focused on getting concrete details that will help a programmer implement the design.
      You are talking to the designer so avoid using any code.`,
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await moreDetailsPrompt.invoke({
    messages: state.messages,
    context: `${contextCache.introDocs} \n\n ${contextCache.quickStartDocs}`,
  });

  const response = await model.invoke(prompt.messages);

  return {
    messages: [response],
  };
}

async function getMoreDetails(state: typeof StateAnnotation.State) {
  const moreDetails = interrupt("details");

  return {
    ...state,
    messages: moreDetails,
  };
}

async function summarizeInput(state: typeof StateAnnotation.State) {
  const summarizePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an assistant helping organize requirements for a P5.js sketch.
      Summarize all the information provided by the user into a clear, structured format.
      The documentation providing basic information about the platform is the following: {context}
      Highlight key visual elements, interactions, colors, and behaviors that need to be implemented.
      You do not need to provide any code.
      This summary will be used as the basis for generating P5.js code.`,
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await summarizePrompt.invoke({
    messages: state.messages,
    context: `${contextCache.introDocs} \n\n ${contextCache.quickStartDocs}`,
  });

  const response = await model.invoke(prompt.messages);

  return {
    messages: [response],
  };
}

async function processP5Code(
  state: typeof StateAnnotation.State,
  isFix = false,
) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a coding assistant with expertise in the P5.js framework. 
      Ensure any code you provide can be executed with all the variables defined.
      You will be coding P5.js within the context of the You: Quantified web platform. 
      This is a small guide to code visuals within that platform: {context}
      
      ${state.visual?.name ? `You are implementing a visual named: "${state.visual.name}"` : 
        "Please provide a short, descriptive name (max 50 characters) for this visual."}
      
      Provide your response with:
      1. A description explaining how the code works
      2. Parameters that could be customized, each with a name and possible default values
      3. The P5.js code itself
      
      You will use windowWidth and windowHeight for the canvas dimensions.
      ${state.visual?.code ? "The code at the moment is the following: {code}" : "" }
      ${isFix ? "Please fix the errors in the provided code" : "Here is the user question:"}`,
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await promptTemplate.invoke({
    messages: state.messages,
    context: contextCache.quickStartDocs,
    code: state.visual?.code || "",
  });

  const structuredLLM = model.bindTools([codeFormatter]);
  const response = await structuredLLM.invoke(prompt.messages);

  // Extract data directly from the structured tool call
  const visualName = state.visual?.name || response?.tool_calls?.[0]?.args?.name || "Unnamed Visual";
  const parameters = response?.tool_calls?.[0]?.args?.parameters || [];
  const code = response?.tool_calls?.[0]?.args?.code || "";
  const answerPrefix = response?.tool_calls?.[0]?.args?.answerPrefix || "";

  return {
    messages: [new AIMessage(answerPrefix)],
    visual: {
      ...state?.visual,
      name: visualName,
      code,
      parameters,
    },
  };
}

async function verifyP5Code(state: typeof StateAnnotation.State) {
  const errorMessage = interrupt("verify");

  return {
    ...state,
    iterations: 1,
    messages: [new HumanMessage(errorMessage)],
  };
}

async function decideToFix(state: typeof StateAnnotation.State) {
  // Check the last message for error information
  const lastMessage = state.messages[state.messages.length - 1];
  const hasError = lastMessage?.content?.toString().includes("ERROR:");

  if (hasError && state.iterations < 3) {
    return "fix";
  } else {
    return "end";
  }
}

async function passThrough(state: typeof StateAnnotation.State) {
  // Simply pass through the state without modification
  return state;
}

async function handlePostCompletion(state: typeof StateAnnotation.State) {
  const classifyPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are helping classify user requests after P5.js code has been generated.
      Determine if the user is asking to:
      1. IMPROVE - Make specific changes or improvements to the code
      2. DISCUSS - Ask general questions about design, style, or concepts
      3. FINISH – End the conversation and finish the thread. 
      Respond with just one word: IMPROVE, DISCUSS, or FINISH.
      `,
    ],
    ["placeholder", "{messages}"],
  ]);

  // Only process the last message (the one after completion)
  const lastMessage = state.messages[state.messages.length - 1];

  const prompt = await classifyPrompt.invoke({
    messages: [lastMessage],
  });

  const response = await model.invoke(prompt.messages);
  const intent = response.content.toString().trim().toUpperCase();

  if (intent.includes("IMPROVE")) {
    return "improve";
  } else if (intent.includes("FINISH")) {
    return "finish";
  } else {
    return "discuss";
  }
}

async function discussCode(state: typeof StateAnnotation.State) {
  const discussPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an assistant helping discuss P5.js code within the You: Quantified platform.
      Provide clear explanations about design choices, coding patterns, and concepts.
      The documentation of the platform is the following: {context}
      Be educational and insightful. Reference the current code when relevant.`,
    ],
    ["placeholder", "{messages}"],
    
    [
      "assistant",
      `Making revisions to: ${state.visual?.name || "Unnamed Visual"}

      Here is the current code:
      \`\`\`javascript
      {code}
      \`\`\`

      ${state.visual?.parameters && state.visual.parameters.length > 0 && "Available parameters:"}
      ${state.visual?.parameters && state.visual.parameters.map((p) => `- ${p.name}: ${p.suggested.join(", ")}`).join("\n")}`,
    ],
  ]);

  const lastMessage = state.messages[state.messages.length - 1];

  const prompt = await discussPrompt.invoke({
    messages: [lastMessage],
    code: state.visual?.code || "No code has been generated yet.",
    context: `${contextCache.introDocs} \n\n ${contextCache.quickStartDocs}`
  });

  const response = await model.invoke(prompt.messages);

  return {
    messages: [response],
  };
}

async function captureNextInput(state: typeof StateAnnotation.State) {
  const nextInput = interrupt("continue");
  
  return {
    ...state,
    messages: nextInput,
  };
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("pass_through", passThrough)
  .addNode("re-ask", askForMoreDetails)
  .addNode("get_details", getMoreDetails)
  .addNode("summarize", summarizeInput)
  .addNode("create", (state) => processP5Code(state, false))
  .addNode("verify", verifyP5Code)
  .addNode("fix", (state) => processP5Code(state, true))
  .addNode("review", captureNextInput)
  .addNode("discuss", discussCode)
  .addEdge(START, "pass_through")
  .addConditionalEdges("pass_through", checkDetailSufficiency, {
    proceed: "summarize",
    back: "re-ask",
  })
  .addEdge("re-ask", "get_details")
  .addEdge("get_details", "pass_through")
  .addEdge("summarize", "create")
  .addEdge("create", "verify")
  .addEdge("fix", "verify")
  .addConditionalEdges("verify", decideToFix, {
    end: "review",
    fix: "fix",
  })
  .addEdge("discuss", "review")
  .addConditionalEdges("review", handlePostCompletion, {
    improve: "fix",
    discuss: "discuss",
    finish: END,
  });
  

export const graph = workflow.compile();
