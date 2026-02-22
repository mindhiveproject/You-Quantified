import React, { useState } from "react";
import clsx from "clsx";
import { useSelector, useDispatch } from "react-redux";
import { selectDataMappings } from "../../utility/selectors";
import { WaveFormIcon } from "./expanded window/WaveFormIcon";
import { MappingWindow } from "./expanded window";
import { motion } from "motion/react";
import useMeasure from "react-use-measure";
// Fix the problem where data doesn't get auto mapped when you enter
// Change the buffer length in the auto slider



function DataCard({
  visParameter,
  dataMappings,
  custom,
  deleteParameter,
  visInfo,
  updateParameter,
  setIsExpanded,
  isExpanded,
  expandedParam,
  setExpandedParam,
}) {
  // Represents an individual parameter

  const dispatch = useDispatch();
  const [ref, { height }] = useMeasure();

  // Where the current mapping is rendered. Could be changed in the render stack.
  const currentMapping = dataMappings?.[visParameter.name];

  const isMapped = currentMapping?.device != "None";
  const isCurrentExpanded = expandedParam?.visParameter == visParameter;
  console.log(expandedParam);

  const [showEditOverlay, setShowEditOverlay] = useState(false);

  function changeSource(sourceInfo) {
    dispatch({
      type: "params/updateMappings",
      payload: {
        name: visParameter.name,
        mapping: sourceInfo,
      },
    });
  }

  function expandCard() {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setExpandedParam({ visParameter, currentMapping, visInfo, updateParameter, deleteParameter, dataMappings, changeSource });
    } else {
      setExpandedParam(null);
    }
  }

  return (
    <motion.button
      ref={ref}
      className={clsx(
        "btn",
        isCurrentExpanded && "active border border-primary",
        "btn-outline-dark overflow-hidden",
      )}
      onClick={expandCard}
      animate={{ width: isExpanded ? "100%" : height || "auto" }}
      transition={{ duration: 0.15, ease: "easeIn" }}
    >
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <span className={`material-symbols-outlined ps-1p`}>motion_mode</span>
          <motion.div
            className="ms-3"
            animate={{ opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-nowrap">
              <small>{isMapped ? "Streaming" : "Not mapped"}</small>
              <h6 className="text-start m-0">{visParameter.name}</h6>
            </div>
          </motion.div>
        </div>
        <div>
          <div className="d-flex justify-content-between border border-tertiary align-items-center px-3 py-2 text-nowrap">
            <div className="d-flex align-items-center">
              <div className="d-flex me-2 p-0 m-0 align-items-center">
                <WaveFormIcon active={isMapped} />
              </div>
              <span className="fw-semibold ms-1">
                {currentMapping?.stream || "Manual"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
export default DataCard;