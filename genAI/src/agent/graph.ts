import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { tool } from "@langchain/core/tools";
import { interrupt } from "@langchain/langgraph";
import { START, END, StateGraph } from "@langchain/langgraph";
import { StateAnnotation } from "./state.js";
import { z } from "zod";
import { loadDocs } from "./fetch_docs.js";
// https://langchain-ai.github.io/langgraph/cloud/how-tos/use_stream_react/#typescript

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPEN_AI_API,
});

const advancedModel = new ChatOpenAI({
  model: "o4-mini",
  apiKey: process.env.OPEN_AI_API,
})

const codeFormatter = tool(async () => {}, {
  name: "code_formatter",
  schema: z.object({
    name: z
      .string()
      .max(50)
      .describe("Short name for the visual (max 50 characters)"),
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
      `You are an assistant helping a P5.js coder understand a designer's requirements. 
        Use the whole conversation to decide if the designer provided enough details or is ready to proceed.
        The designer may leave some decisions to the coder - that's acceptable.
        You will ONLY respond with one word.
        If there's enough detail to start coding or the designer wants to start, respond with PROCEED.
        Otherwise respond with ASK.
        ${
          state?.visual?.code
            ? `The coder is already working from the following:       \`\`\`javascript
              {code}
              \`\`\``
            : ""
        }

        `,
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await checkDetailSufficiency.invoke({
    messages: state.messages,
    code: state.visual?.code || "",
  });


  const response = await model.invoke(prompt.messages);
  const responseContent = response.content.toString().trim().toUpperCase();

  if (responseContent.includes("PROCEED")) {
    return state.visual?.code ? "modify" : "new";
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

      Ask specific questions about missing details such as:
      - "What colors should be used for the visualization?"
      - "How should the elements be arranged on the screen?"
      - "Should the visualization respond to user input? If so, how?"
      - "What data streams should this visual represent?"
      
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

async function summarizeInitialInput(state: typeof StateAnnotation.State) {
  const summarizePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an assistant helping organize requirements for a new P5.js sketch.
      Summarize all the information provided by the user into a clear, structured format.
      The documentation providing basic information about the platform is the following: {context}
      
      Your summary should include:
      1. Main visualization purpose
      2. Visual elements and their properties
      3. Interactions or animations
      4. Color schemes and styling preferences
      5. Data streams to be used (if specified)
      
      
      This summary will be used as the basis for generating P5.js code.
      You may outline lines that are important, but you will NOT be generating any code. 
      You will not code the whole sketch, only provide tips, guidelines, and ideas.
      `,
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

async function summarizeModification(state: typeof StateAnnotation.State) {
  const summarizePrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are an assistant helping organize requirements for modifying an existing P5.js sketch.
      Summarize the requested changes to the existing visualization.
      The documentation providing basic information about the platform is the following: {context}
      
      Focus on what elements need to be:
      1. Added to the current visualization
      2. Modified from their current implementation
      3. Removed from the current implementation
      
      This summary will be used as the basis for modifying existing P5.js code.
      You will not be providing any code, but you may outline lines that you think might need to be changed.
      `,
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

async function createP5Code(state: typeof StateAnnotation.State) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a coding assistant with expertise in the P5.js framework. 
      You are creating a new visualization from scratch based on the requirements.
      Ensure any code you provide can be executed with all the variables defined.
      You will be coding P5.js within the context of the You: Quantified web platform. 
      This is a small guide to code visuals within that platform: {context}
      
      Please provide a short, descriptive name (max 50 characters) for this visual.
      
      Provide your response with:
      1. A description explaining how the code works
      2. Parameters that could be customized, each with a name and possible default values.
      3. The P5.js code itself

      You must ensure the parameters are reference with the EXACT same key in the code.
      
      You will use windowWidth and windowHeight for the canvas dimensions.`,
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await promptTemplate.invoke({
    messages: state.messages,
    context: `${contextCache.introDocs} \n\n ${contextCache.quickStartDocs}`,
  });

  const structuredLLM = advancedModel.bindTools([codeFormatter]);
  const response = await structuredLLM.invoke(prompt.messages);

  // Extract data directly from the structured tool call
  const visualName = response?.tool_calls?.[0]?.args?.name || "Unnamed Visual";
  const parameters = response?.tool_calls?.[0]?.args?.parameters || [];
  const code = response?.tool_calls?.[0]?.args?.code || "";


  if (response?.tool_calls && response.tool_calls.length > 1) {
    response.tool_calls = [response?.tool_calls?.[0]]
  }

  return {
    messages: [response],
    visual: {
      name: visualName,
      code,
      parameters,
    },
  };
}

async function fixP5Code(state: typeof StateAnnotation.State) {
  const promptTemplate = ChatPromptTemplate.fromMessages([
    [
      "system",
      `You are a coding assistant with expertise in the P5.js framework. 
      You are fixing errors in an existing visualization.
      Ensure any code you provide can be executed with all the variables defined.
      You will be coding P5.js within the context of the You: Quantified web platform. 
      This is a small guide to code visuals within that platform: {context}
      
      You are fixing a visual named: "${state.visual?.name || "Unnamed Visual"}"
      
      The code with errors is the following:
      \`\`\`javascript
      {code}
      \`\`\`

      You must ensure the parameters are reference with the EXACT same key in the code.
      
      Here is the error report or the changes the user is requesting:`,
    ],
    ["placeholder", "{messages}"],
  ]);

  const prompt = await promptTemplate.invoke({
    messages: state.messages,
    context: `${contextCache.introDocs} \n\n ${contextCache.quickStartDocs}`,
    code: state.visual?.code || "",
  });

  const structuredLLM = advancedModel.bindTools([codeFormatter]);
  const response = await structuredLLM.invoke(prompt.messages);

  const code = response?.tool_calls?.[0]?.args?.code || "";

  if (response?.tool_calls && response.tool_calls.length > 1) {
    response.tool_calls = [response?.tool_calls?.[0]]
  }

  return {
    messages: [response],
    visual: {
      ...state.visual,
      code,
    },
  };
}

async function verifyP5Code(state: typeof StateAnnotation.State) {
  const errorMessage = interrupt("verify");

  return {
    ...state,
    iterations: 1,
    messages: [errorMessage],
  };
}

async function decideToFix(state: typeof StateAnnotation.State) {
  // Check the last message for error information
  const lastMessage = state.messages[state.messages.length - 1];
  const hasError = lastMessage?.content?.toString().includes("ERROR:");

  if (hasError && state.iterations < 3) {
    console.log("---FIXING---");
    return "fix";
  } else {
    console.log("---RAN SUCCESSFULLY---")
    return "end";
  }
}

const workflow = new StateGraph(StateAnnotation)
  .addNode("re-ask", askForMoreDetails)
  .addNode("summarize-initial", summarizeInitialInput)
  .addNode("summarize-modification", summarizeModification)
  .addNode("create", createP5Code)
  .addNode("verify", verifyP5Code)
  .addNode("fix", fixP5Code)
  .addConditionalEdges(START, checkDetailSufficiency, {
    new: "summarize-initial",
    modify: "summarize-modification",
    back: "re-ask",
  })
  .addEdge("re-ask", END)
  .addEdge("summarize-modification", "fix")
  .addEdge("summarize-initial", "create")
  .addEdge("create", "verify")
  .addEdge("fix", "verify")
  .addConditionalEdges("verify", decideToFix, {
    end: END,
    fix: "fix",
  });

export const graph = workflow.compile();
