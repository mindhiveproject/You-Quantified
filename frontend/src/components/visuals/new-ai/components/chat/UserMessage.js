import React from "react";
import { motion, useTime, useTransform } from "motion/react";

/**
 * Component that renders a message from the user
 *
 * @param {object} props
 * @param {string} props.message - The content of the user's message
 * @param {boolean} props.isLoading - Whether to show a loading animation
 */
function UserMessage({ message, isLoading = false, addRefNumber }) {

  let displayMessage = typeof message === "string" ? message : "";
  // Updated regex to use the global flag and properly handle multiline content
  displayMessage = displayMessage.replace(/\u001E[\s\S]*?\u001F/g, '');

  const time = useTime();
  const rotate = useTransform(time, [0, 3000], [0, 360], { clamp: false });
  const rotationBg = useTransform(rotate, (r) => {
    return `linear-gradient(${r}deg, #1BD29A 0%, #9747FF 100%)`;
  });
  

  return (
    <div className="w-100 d-flex justify-content-end mb-1">
      <div className="position-relative w-70">
        <div
          className={`position-relative p-2 bg-gray-800 me-1px z-3 ${
            isLoading ? "border border-primary" : "border border-white"
          }`}
        >
          <p className="p-0 m-0">{displayMessage}</p>
          {addRefNumber > 0 && (
            <p className="text-gray-600 m-0 mt-1">
              {`Used ${addRefNumber} additional reference${addRefNumber>1?"s":""}`}
            </p>
          )}
        </div>
        {isLoading && (
          <motion.div
            className="position-absolute rounded-0 z-0 inset-n1"
            style={{
              background: rotationBg,
            }}
          ></motion.div>
        )}
      </div>
    </div>
  );
}

export default UserMessage;
