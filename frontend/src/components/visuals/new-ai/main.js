import React, { useEffect, useRef, useState, useContext } from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { HumanMessage, ToolMessage } from "@langchain/core/messages";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CREATE_GEN_AI } from "../../../queries/genAI";
import { useMutation } from "@apollo/client";
import { UserContext } from "../../../App";
import { Link } from "react-router-dom";

// Import components from our reorganized structure
import {
  AIInputBox,
  BackButton,
  ChatBox,
  RightPannel,
  IntroSuggestions,
  HistoryButton,
} from "./components";

const uriEndpoint =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_GEN_AI_ENDPOINT_DEV
    : process.env.REACT_APP_GEN_AI_ENDPOINT;

/**
 * Main component for the AI visual generation interface
 * Handles the LangGraph communication, chat history, and visual generation
 */
export function AINewVisual() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [additionalReferences, setAdditionalReferences] = useState([]);
  const [codeError, setCodeError] = useState({});
  const [inputValue, setInputValue] = useState("");
  const chatDivRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);

  const [createGenAI] = useMutation(CREATE_GEN_AI, {
    refetchQueries: ["GetAIVisuals"],
  });

  const thread = useStream({
    apiUrl: uriEndpoint,
    assistantId: "agent",
    messagesKey: "messages",
    threadId: searchParams.get("ai-thread"),
    onThreadId: (id) => {
      setSearchParams((prev) => {
        prev.set("ai-thread", id);
        return prev;
      });
      createGenAI({ variables: { thread: id, userID: currentUser?.id } });
    },
    onUpdateEvent: (ev) => {
      if (
        Object.keys(ev)[0] === "summarize-modification" ||
        Object.keys(ev)[0] === "summarize-initial"
      ) {
        setIsAICoding(true);
      } else {
        setIsAICoding(false);
      }
    },
  });

  const [isAICoding, setIsAICoding] = useState(false);
  const currentScreen = thread?.messages?.length > 0 ? "ask" : "intro";
  const visualMetaAI = thread?.values?.visual;
  const isVerifying = thread?.interrupt?.value === "verify";

  function addReference(newReference) {
    setAdditionalReferences((prev) =>
      prev.includes(newReference) ? prev : [...prev, newReference]
    );
  }

  function removeReference(object) {
    setAdditionalReferences((prev) =>
      prev.filter((val) => {
        if (object?.id) {
          return val?.id !== object?.id;
        } else if (object?.imgSrc) {
          return val?.imgSrc !== object?.imgSrc;
        } else {
          return true;
        }
      })
    );
  }

  async function submitMessage(e) {
    e.preventDefault();

    // Afterwards, proceed
    const msgContent = [{ type: "text", text: inputValue.toString() }];

    for (const addReference of additionalReferences) {
      console.log(addReference);
      if (addReference?.type === "image") {
        msgContent.push({
          type: "image_url",
          image_url: { url: addReference?.imgSrc },
        });
      }
      console.log("Add Ref", addReference);
      if (addReference?.type === "visual") {
        const HIDE_START = "\u001E";
        const HIDE_END = "\u001F";
        const response = await fetch(addReference?.codeURL);
        const codeString = await response.text();
        console.log(JSON.stringify(addReference.visParameters));
        msgContent[0].text += ` 
        ${HIDE_START}
          Follow my instructions closely, but use the following visual as a reference.
          name="${addReference?.name}" 
          code="${codeString}" 
          parameters="${JSON.stringify(addReference?.visParameters) || []}" 
        ${HIDE_END}`;
      }
    }

    console.log("Message Content", msgContent);

    const message = [
      new HumanMessage({
        content: msgContent,
        additional_kwargs: {
          additional_references_len: additionalReferences.length,
        },
      }),
    ];

    console.log("Submitted message", message);

    setAdditionalReferences([]);

    if (thread?.isLoading || isVerifying) {
      console.warn("Tried to submit while thread is busy");
    } else {
      thread.submit({ messages: message });
      setInputValue("");
    }
  }

  useEffect(() => {
    if (chatDivRef.current) {
      chatDivRef.current.scrollTop = chatDivRef.current.scrollHeight;
    }
  }, [thread?.messages]);

  // Handle verification result
  useEffect(() => {
    console.log("Code error has changed!");
    if (!isVerifying) return;

    const lastMessage = thread?.messages[thread?.messages.length - 1];
    const lastToolCall = lastMessage?.tool_calls?.[0]?.id;

    const message =
      codeError?.state === "success"
        ? "The code ran successfully."
        : `ERROR: ${codeError?.message}`;

    if (!lastToolCall) return;

    thread.submit(undefined, {
      command: {
        resume: new ToolMessage({
          content: message,
          tool_call_id: lastToolCall,
        }),
      },
    });
  }, [codeError]);

  if (!currentUser?.id) {
    return (
      <div className="vh-100 w-100 bg-black ai-overlay text-white">
        <div className="d-flex w-100 h-100 align-items-center justify-content-center">
          <div className="d-flex row align-items-center text-center">
            <p>You must be logged in to generate new visuals with AI</p>
            <Link className="btn-link link-light" to="/visuals">
              {"Main Menu"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser?.isAdmin) {
    return (
      <div className="vh-100 w-100 bg-black ai-overlay text-white">
        <div className="d-flex w-100 h-100 align-items-center justify-content-center">
          <div className="d-flex row align-items-center text-center">
            <p>You must be a platform admin to create visuals with AI</p>
            <Link className="btn-link link-light" to="/visuals">
              {"Main Menu"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vh-100 w-100 bg-black ai-overlay text-white overscroll-x-none">
      <div className="g-0 p-0 pb-1 pt-1 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center justify-content-center">
          <BackButton />
        </div>
        <div className="d-flex align-items-center me-1">
          <HistoryButton userID={currentUser?.id} />
          <button
            className="btn btn-outline-light d-flex align-items-center"
            onClick={() => {
              navigate("/visuals-new-ai");
            }}
          >
            New Conversation
          </button>
        </div>
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
                  isCoding={isAICoding}
                  isVerifying={isVerifying}
                  isLoading={thread?.isLoading}
                />
              </div>
            )}
            <div>
              <AIInputBox
                inputValue={inputValue}
                setInputValue={setInputValue}
                inputDisabled={
                  (additionalReferences.length === 0 && inputValue === "") ||
                  thread?.isLoading ||
                  isVerifying ||
                  isAICoding
                }
                onSubmit={submitMessage}
                additionalReferences={additionalReferences}
                addReference={addReference}
                removeReference={removeReference}
              />
            </div>
            {currentScreen === "intro" && (
              <div className="mt-4 mb-n5">
                <p className="text-gray-600 m-0 p-0">or</p>
                <p className="text-light mb-1">
                  Browse the list of featured visuals and use them as a starting
                  point.
                </p>
                <IntroSuggestions
                  additionalReferences={additionalReferences}
                  addReference={addReference}
                  removeReference={removeReference}
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
