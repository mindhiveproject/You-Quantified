import React, { useState } from "react";
import { useSelector } from "react-redux";
import { deviceRuntime, useIsRecording } from "../../../../devices/runtime";
import { Modal } from "../../../modal";
import { EditModalManager } from "../edit";
import { SourceCard } from "./source_card";
import { LinkSourceModal } from "./link_modal";
import { RecordingList, ReplayModal } from "./recordings";

// The Data Sources tab: the devices linked into this project, ready to connect.
// Laid out like the docs, with a bar of actions over the content.
export default function DataSourcesWindow({ visMetadata, linkedSources, isEditable }) {
  const { sources, link, unlink } = linkedSources;
  const [modal, setModal] = useState(null);
  const closeModal = () => setModal(null);

  return (
    <div className="d-flex flex-column h-100 overflow-clip sources">
      <div className="menu-bar d-flex justify-content-between">
        <div className="d-flex">
          <button onClick={() => setModal("link")}>
            <span className="material-symbols-outlined inline-icon">add_link</span>
            Link a data source
          </button>
          <div className="vertical-line" />
          <button onClick={() => setModal("replay")}>
            <span className="material-symbols-outlined inline-icon">replay</span>
            Replay a recording
          </button>
        </div>
        <RecordButton />
      </div>

      <div className="scrollable-editor px-4 pb-4">
        <h5 className="mt-4">Data Sources</h5>
        <p>Connect the devices this visual reads from.</p>
        {!isEditable && (
          <div className="alert alert-light border-dark rounded-0 d-flex justify-content-between align-items-center">
            <span>
              Changes you make here are only for this session. Create a copy to
              save them.
            </span>
            <button
              className="btn btn-secondary btn-outline-dark text-nowrap ms-3"
              onClick={() => setModal("copy")}
            >
              Create a copy
            </button>
          </div>
        )}
        {sources.length === 0 && (
          <p className="text-body-tertiary">
            No data sources are linked yet. Link one to connect a device.
          </p>
        )}
        {sources.map((source) => (
          <SourceCard key={source.id} source={source} onRemove={() => unlink(source)} />
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
      className={recording ? "text-danger" : ""}
    >
      <span className="material-symbols-outlined inline-icon">
        {recording ? "stop_circle" : "radio_button_checked"}
      </span>
      {recording ? "Stop recording" : "Record"}
    </button>
  );
}
