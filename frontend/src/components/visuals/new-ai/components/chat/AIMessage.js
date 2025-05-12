import React from "react";
import SyntaxMarkDown from "./SyntaxMarkDown";

/**
 * Component that renders a message from the AI assistant
 * 
 * @param {object} props
 * @param {string} props.message - The content of the AI's message
 */
function AIMessage({ message }) {
  if (!message) return;
  
  return (
    <div className="w-100 mb-1">
      <p className="gray-500 mb-0">AI Assistant</p>
      <div className="ai-text-render">
        <SyntaxMarkDown>{message}</SyntaxMarkDown>
      </div>
    </div>
  );
}

export default AIMessage;