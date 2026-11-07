import React, { useState } from "react";
import { useSelector } from "react-redux";
import { deviceRuntime, useIsRecording } from "../../../../devices/runtime";
import { Modal } from "../../../modal";
import { EditModalManager } from "../edit";
import { SourceCard } from "./source_card";
import { LinkSourceModal } from "./link_modal";
import { RecordingList, ReplayModal } from "./recordings";

// The Data Sources tab: the devices linked into this project, ready to connect,
// under a bar of actions.
export default function DataSourcesWindow({ visMetadata, linkedSources, isEditable }) {
  const { sources, link, unlink } = linkedSources;
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  return (
    <div className="d-flex flex-column h-100 overflow-clip">
      <div className="action-bar">
        <RecordButton />
        <button className="btn btn-outline-dark btn-48" onClick={() => setModal("replay")}>
          <span className="material-symbols-outlined">upload</span>
          Upload
        </button>
        <button
          className="btn btn-primary border-dark btn-48"
          onClick={() => setModal("link")}
        >
          <span className="svg-icon icon-link" />
          Link new
        </button>
      </div>

      {!isEditable && (
        <div className="notice-bar">
          <p className="m-0">
            Changes you make will not be saved when you come back. Copy the visual
            to save changes.
          </p>
          <button
            className="btn btn-secondary border-dark btn-48 text-nowrap"
            onClick={() => setModal("copy")}
          >
            <span className="material-symbols-outlined">edit</span>
            Create a copy
          </button>
        </div>
      )}

      <div className="overflow-auto p-4 d-flex flex-column gap-4">
        <div>
          <h2 className="pane-title">Linked Data Sources</h2>
          <p className="m-0">Stream data from other devices to link them to parameters.</p>
        </div>
        {sources.length === 0 && (
          <p className="text-body-tertiary m-0">
            No data sources are linked yet. Link one to connect a device.
          </p>
        )}
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
        <RecordingList />
      </div>

      {modal === "link" && (
        <Modal onClose={closeModal}>
          <LinkSourceModal
            sources={sources}
            onLink={link}
            onUnlink={unlink}
            onClose={closeModal}
          />
        </Modal>
      )}
      {modal === "replay" && (
        <Modal onClose={closeModal}>
          <ReplayModal onClose={closeModal} />
        </Modal>
      )}
      {modal === "copy" && (
        <Modal onClose={closeModal}>
          <EditModalManager
            visMetadata={visMetadata}
            sources={sources}
            setShowEdit={closeModal}
            isEditable={isEditable}
          />
        </Modal>
      )}
    </div>
  );
}

function RecordButton() {
  const recording = useIsRecording();
  const hasData = useSelector((state) => Object.keys(state.deviceMeta).length > 0);

  async function toggle() {
    if (!recording) return deviceRuntime.startRecording();
    try {
      await deviceRuntime.stopRecording();
    } catch (error) {
      // yq-data refuses to write an empty archive.
      window.alert(error.message);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={!recording && !hasData}
      className={`btn btn-outline-dark btn-48 ${recording ? "text-danger" : ""}`}
    >
      <span className="material-symbols-outlined">
        {recording ? "stop_circle" : "album"}
      </span>
      {recording ? "Stop recording" : "Record"}
    </button>
  );
}
