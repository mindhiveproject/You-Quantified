import React, { useEffect, useRef, useState, useContext } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { HumanMessage } from "@langchain/core/messages";
import { useSearchParams, useNavigate } from "react-router-dom";

// Import components from our reorganized structure
import {
  AIInputBox,
  BackButton,
  ChatBox,
  RightPannel,
  IntroSuggestions,
} from "./components";

/**
 * Main component for the AI visual generation interface
 * Handles the LangGraph communication, chat history, and visual generation
 */
export function AINewVisual() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [additionalReferences, setAdditionalReferences] = useState([]);
  const [codeError, setCodeError] = useState();
  const [inputValue, setInputValue] = useState("");
  const chatDivRef = useRef(null);
  const navigate = useNavigate();

  const thread = useStream({
    apiUrl: "http://localhost:2024",
    assistantId: "agent",
    messagesKey: "messages",
    threadId: searchParams.get("ai-thread"),
    onThreadId: (id) =>
      setSearchParams((prev) => {
        prev.set("ai-thread", id);
        return prev;
      }),
    onUpdateEvent: (ev) => console.log(ev),
  });

  const currentScreen = thread?.messages?.length > 0 ? "ask" : "intro";
  const visualMetaAI = thread?.values?.visual;
  const isVerifying = thread?.interrupt?.value === "verify";

  async function submitMessage(e) {
    e.preventDefault();

    setInputValue("");

    // Add input validatino here to throw errors
    // Afterwards, proceed
    const msgContent = [{ type: "text", text: inputValue.toString() }];
    const contextMessageContent = ``;

    for (const addReference in additionalReferences) {
      if (addReference?.type === "image") {
        msgContent.push({
          type: "image_url",
          image_url: { url: addReference?.imgSrc },
        });
      }
      if (addReference?.type === "visual") {
        const response = await fetch(addReference?.codeURL);
        const codeString = await response.text();
        contextMessageContent += `Use the code from the following visual called ${addReference?.name} as inspiration:
        \`\`\`javascript
        ${codeString}
        \`\`\`
        `;
      }
    }

    const message = [
      new HumanMessage({
        content: msgContent,
        additional_kwargs: {
          additional_references_len: additionalReferences.length,
        },
      }),
    ];

    setAdditionalReferences([]);

    if (contextMessageContent) {
      message.push(
        new HumanMessage({
          content: contextMessageContent,
          additional_kwargs: { hide_in_thread: true },
        })
      );
    }

    console.log(message);

    if (thread.interrupt?.value === "details") {
      thread.submit(undefined, { command: { resume: message } });
    } else if (thread?.isLoading) {
      console.warn("Tried to submit while thread is loading");
    } else if (isVerifying) {
      console.warn("Tried to submit while AI verified its message");
    } else {
      thread.submit({ messages: message });
    }
  }

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight;
    }
  }, [thread?.messages]);

  // Handle verification result
  useEffect(() => {
    if (!isVerifying) return;

    if (codeError) {
      const message =
        codeError === "success"
          ? "The code ran successfully."
          : `ERROR: ${codeError}`;

      // Add metadata to mark this as a system message that shouldn't be displayed
      thread.submit(undefined, {
        command: {
          resume: new HumanMessage({
            content: message,
            additional_kwargs: { hide_in_thread: true },
          }),
        },
      });
    }
  }, [codeError]);

  return (
    <div className="vh-100 w-100 bg-black ai-overlay text-white overscroll-x-none">
      <div className="g-0 p-0 pb-1 pt-1 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center justify-content-center">
          <BackButton />
        </div>
        <button
          className="btn btn-outline-light me-1 d-flex align-items-center"
          onClick={() => {
            navigate("/visuals-new-ai");
            location.reload();
          }}
        >
          New Conversation
        </button>
      </div>
      <div className="container-fluid p-0 m-0 w-100 h-95 p-4">
        <div className="row h-100 justify-content-center">
          <div className="col col-6 h-100 d-flex flex-column justify-content-center p-2 ps-4">
            {currentScreen === "intro" && (
              <div className="d-flex flex-column">
                <h3>Create a visual with AI</h3>
                <p className="gray-500">
                  Not sure where to start? You can reference other visuals to
                  use as inspiration, upload images or sketches, or describe
                  what you want.
                </p>
              </div>
            )}
            {currentScreen === "ask" && (
              <div
                className="align-self-stretch overflow-scroll black-scrollbar mb-2"
                ref={chatDivRef}
              >
                <ChatBox
                  messages={thread?.messages}
                  isLoading={thread?.isLoading || isVerifying}
                />
              </div>
            )}
            <div>
              <AIInputBox
                inputValue={inputValue}
                setInputValue={setInputValue}
                inputDisabled={(additionalReferences.length === 0 && inputValue === "") || thread?.isLoading || isVerifying}
                onSubmit={submitMessage}
                additionalReferences={additionalReferences}
                setAdditionalReferences={setAdditionalReferences}
              />
            </div>
            {currentScreen === "intro" && (
              <div className="mt-4 mb-n5">
                <p className="text-gray-600 m-0 p-0">or</p>
                <p className="text-light mb-1">Browse the list of featured visuals and use them as a starting point.</p>
                <IntroSuggestions
                  additionalReferences={additionalReferences}
                  setAdditionalReferences={setAdditionalReferences}
                />
              </div>
            )}
          </div>
          {visualMetaAI && (
            <div className="col col-6">
              <RightPannel
                visualMetaAI={visualMetaAI}
                isLoading={thread?.isLoading}
                isVerifying={isVerifying}
                setError={setCodeError}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
