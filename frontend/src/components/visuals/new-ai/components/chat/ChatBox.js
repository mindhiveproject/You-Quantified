import React from "react";
import AIMessage from "./AIMessage";
import UserMessage from "./UserMessage";

/**
 * Component that renders a chat conversation between the user and AI
 * 
 * @param {object} props
 * @param {Array} props.messages - Array of message objects
 * @param {boolean} props.isLoading - Whether the AI is currently generating a response
 */
function ChatBox({ messages, isLoading }) {
  const renderMessages = messages.map(
    ({ type, content, additional_kwargs, id }, indx) => {
      if (type === "ai") {
        return <AIMessage message={content} key={id}/>;
      }
      if (type === "human") {
        const messageContent = content?.[0]?.text || content;
        const loading = indx === messages.length - 1 && isLoading;
        if (additional_kwargs?.hide_in_thread) return;
        return <UserMessage message={messageContent} isLoading={loading} key={id}/>;
      }
    }
  );

  return <div className="d-flex flex-column w-100">{renderMessages}</div>;
}

export default ChatBox;