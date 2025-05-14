import React, { useRef, useState } from "react";
import clsx from "clsx";
import { useOutsideAlerter } from "../../../../../utility/outsideClickDetection";
import { useQuery } from "@apollo/client";
import { GET_AI_HISTORY } from "../../../../../queries/genAI";
import { useNavigate, useSearchParams } from "react-router-dom";

function HistoryButton({userID}) {
  const historymodalRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Format date to "Month Day, at H:MM am/pm"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12; // Convert to 12-hour format

    return `${month} ${day}, ${year}, at ${formattedHours}:${minutes} ${ampm}`;
  };

  const {
    data: completeHistory,
    loading,
    error,
  } = useQuery(GET_AI_HISTORY, {
    variables: { userID: userID },
  });


  useOutsideAlerter(historymodalRef, setShowModal);

  if (!completeHistory?.genAIS) return;

  const handleHistoryItemClick = (threadId) => {
    setSearchParams({ "ai-thread": threadId });
    setShowModal(false);
  };

  return (
    <div className="position-relative">
      <button
        className="btn btn-outline-light d-flex align-items-center me-1 input-btn-layout"
        onClick={() => setShowModal(true)}
      >
        <span className="material-symbols-outlined">history</span>
      </button>
      {showModal && (
        <div
          className="bg-black border-light position-absolute z-10 popup-bottom-left max-height-70vh overflow-scroll black-scrollbar"
          ref={historymodalRef}
        >
          <ul className="list-group text-start">
            {completeHistory.genAIS.map((item, index) => (
              <button
                key={item.id || index}
                className={clsx(
                  "text-start list-group-item text-start text-white bg-black rounded-0 border-0 truncate-text",
                  index > 0 && "border-top"
                )}
                onClick={() => handleHistoryItemClick(item.langGraphThread)}
              >
                {formatDate(item.createdAt)}
              </button>
            ))}
            {completeHistory.genAIS.length === 0 && (
              <div className="text-start list-group-item text-white bg-black rounded-0 border-0">
                No history found
              </div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default HistoryButton;
