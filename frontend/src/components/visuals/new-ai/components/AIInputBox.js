import React, { useEffect, useRef, useState } from "react";
import { LayoutGroup, motion } from "motion/react";
import useMeasure from "react-use-measure";

// Import extracted components
import FileInputButton from "./references/FileInputButton";
import ReferenceVisualButton from "./references/ReferenceVisualButton";
import AdditionalReference from "./references/AdditionalReference";

/**
 * Main input box component for the AI visual generation feature
 * Allows users to enter text description and add reference materials
 * 
 * @param {object} props
 * @param {string} props.inputValue - The current input text value
 * @param {function} props.setInputValue - Function to update input value
 * @param {boolean} props.inputDisabled - Whether the input is disabled
 * @param {function} props.onSubmit - Function to handle submission
 * @param {Array} props.additionalReferences - Array of added references
 * @param {function} props.setAdditionalReferences - Function to update references
 */
function AIInputBox({ inputValue, setInputValue, inputDisabled, onSubmit, additionalReferences, addReference, removeReference }) {
  const [isFocus, setIsFocus] = useState(false);
  const textareaRef = useRef(null);

  const [ref, { height }] = useMeasure();

  const changeText = (e) => {
    setInputValue(e.target.value);
  };

  useEffect(() => {
    const myref = textareaRef.current;
    if (myref) {
      myref.style.height = "0px";
      const scrollHeight = myref.scrollHeight;
      myref.style.height = scrollHeight + "px";
    }
  }, [textareaRef, inputValue]);

  const renderReferences = additionalReferences.map((reference) => (
    <AdditionalReference
      reference={reference}
      removeReference={removeReference}
      key={reference?.id || reference?.name}
    />
  ));

  return (
    <LayoutGroup>
      <div className="d-flex flex-wrap-reverse">{renderReferences}</div>
      <motion.div
        className={`p-0 ai-input-wrapper`}
        key="add-img"
        animate={{ height }}
        transition={{ duration: 0.15 }}
        initial={{ height: 0 }}
        layout="position"
      >
        <div
          className={`d-flex flex-column justify-content-between p-1 m-0`}
          ref={ref}
        >
          <motion.textarea
            key="text-area"
            className="mt-2 mb-2 ps-2 ai-input-textbox w-100 black-scrollbar"
            value={inputValue}
            onChange={changeText}
            placeholder="Describe your visual"
            onFocus={() => setIsFocus(true)}
            onBlur={() => setIsFocus(false)}
            ref={textareaRef}
            onKeyDown={(e) => {
              // Submit when pressing Enter without Shift
              if (e.key === "Enter" && !e.shiftKey && !inputDisabled) {
                onSubmit(e);
              }
              // Shift+Enter adds a new line (default behavior)
            }}
          />
          <motion.div
            layout="position"
            transition={{ duration: 0.15 }}
            className="d-flex justify-content-end p-0"
            key="all-buttons"
          >
            <div className="d-flex p-0">
              <div className="me-1">
                <FileInputButton addReference={addReference} />
              </div>
              <div className="me-1">
                <ReferenceVisualButton
                  addReference={addReference}
                  additionalReferences={additionalReferences}
                />
              </div>
              <div>
                <motion.button
                  className="d-flex justify-content-center btn btn-outline-light btn-primary h-48px w-48px"
                  disabled={inputDisabled}
                  onClick={onSubmit}
                >
                  <motion.span className="material-symbols-outlined m-0">
                    prompt_suggestion
                  </motion.span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </LayoutGroup>
  );
}

export default AIInputBox;