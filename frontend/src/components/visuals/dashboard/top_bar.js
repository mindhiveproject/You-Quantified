import { useState, useContext } from "react";
import { UserContext } from "../../../App";
import { Modal } from "../../modal";
import { EditModalManager } from "./edit";
import { ShareMenu } from "./share";

export function VisTopBar({
  visMetadata,
  sources,
  popupVisuals,
  setPopupVisuals,
  fullScreenHandle,
  mutationData,
  changeVisMetadata,
  isEditable,
  isOwner,
  isStopped,
  setIsStopped,
}) {
  const [showEdit, setShowEdit] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [currentPrivacy, setCurrentPrivacy] = useState(visMetadata?.privacy);

  return (
    <div className="vis-bar">
      <h1 className="vis-title text-truncate">{visMetadata?.title}</h1>
      <div className="d-flex align-items-center gap-1 pe-1">
        {showEdit && (
          <Modal onClose={() => setShowEdit(false)}>
            <EditModalManager
              visMetadata={visMetadata}
              sources={sources}
              setShowEdit={setShowEdit}
              changeVisMetadata={changeVisMetadata}
              isEditable={isEditable}
              isOwner={isOwner}
            />
          </Modal>
        )}
        {/*isEditable && (
          <ShowUploadState mutationData={mutationData} isDirty={isDirty} />
        )*/}
        <button
          className="btn btn-link"
          onClick={() => setPopupVisuals(!popupVisuals)}
        >
          <b>
            <i className="bi bi-window" alt="popup-window"></i>
          </b>
        </button>
        {isOwner && (
          <PrivacyDropdown
            currentPrivacy={currentPrivacy}
            setCurrentPrivacy={setCurrentPrivacy}
            changeVisMetadata={changeVisMetadata}
          />
        )}
        {currentPrivacy !== "private" && (
          <button
            className="btn btn-outline-dark btn-48 ps-3 pe-4"
            onClick={() => setShowShare(true)}
          >
            <span className="material-symbols-outlined">ios_share</span>
            Share
          </button>
        )}
        <button
          className="btn btn-outline-dark btn-secondary btn-48 ps-3 pe-4"
          onClick={() => setShowEdit(!showEdit)}
        >
          <span className="material-symbols-outlined">edit</span>
          Edit
        </button>
        {showShare && (
          <Modal onClose={() => setShowShare(false)}>
            <ShareMenu
              visMetadata={visMetadata}
              visURL={window.location.href}
              setShowShare={setShowShare}
              changeVisMetadata={changeVisMetadata}
              isOwner={isOwner}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

function PrivacyDropdown({
  currentPrivacy,
  setCurrentPrivacy,
  changeVisMetadata,
}) {
  const { currentUser } = useContext(UserContext);
  function setPrivacy(input) {
    setCurrentPrivacy(input);
    changeVisMetadata({
      variables: {
        data: {
          privacy: input,
        },
      },
    });
  }

  return (
    <div className="dropdown">
      <button
        className="btn btn-outline-dark btn-48 ps-3 pe-4"
        data-bs-toggle="dropdown"
      >
        {currentPrivacy === "public" && (
          <div>
            <span className="material-symbols-outlined inline-icon me-2">
              public
            </span>
            <span>Public</span>
          </div>
        )}
        {currentPrivacy === "friends" && (
          <div>
            <span className="material-symbols-outlined inline-icon me-2">
              group
            </span>
            <span>Friends</span>
          </div>
        )}
        {currentPrivacy === "unlisted" && (
          <div>
            <span className="material-symbols-outlined inline-icon me-2">
              link
            </span>
            <span>Unlisted</span>
          </div>
        )}
        {currentPrivacy === "private" && (
          <div>
            <span className="material-symbols-outlined inline-icon me-2">
              lock
            </span>
            <span>Private</span>
          </div>
        )}
      </button>
      <ul className="dropdown-menu">
        {currentUser?.isAdmin && (
          <li className="dropdown-item">
            <button
              className="btn btn-link text-decoration-none d-flex align-items-center p-0 text-start pt-1 pe-1 w-100"
              onClick={() => setPrivacy("public")}
            >
              <span className="material-symbols-outlined me-3">public</span>
              <div>
                <h6 className="m-0">Public</h6>
                <small>Feature the visual for every user.</small>
              </div>
            </button>
          </li>
        )}
        <li className="dropdown-item">
          <button
            className="btn btn-link text-decoration-none d-flex align-items-center p-0 text-start pt-1 pe-1 w-100"
            onClick={() => setPrivacy("friends")}
          >
            <span className="material-symbols-outlined me-3">group</span>
            <div>
              <h6 className="m-0">Friends</h6>
              <small>Visible to my friends.</small>
            </div>
          </button>
        </li>
        <li className="dropdown-item">
          <button
            className="btn btn-link text-decoration-none d-flex align-items-center p-0 text-start pt-1 pe-1 w-100"
            onClick={() => setPrivacy("unlisted")}
          >
            <span className="material-symbols-outlined me-3">link</span>
            <div>
              <h6 className="m-0">Unlisted</h6>
              <small>Those with a link.</small>
            </div>
          </button>
        </li>
        <li className="dropdown-item">
          <button
            className="btn btn-link text-decoration-none d-flex align-items-center p-0 text-start pt-1 pe-1 w-100"
            onClick={() => setPrivacy("private")}
          >
            <span className="material-symbols-outlined me-3">lock</span>
            <div>
              <h6 className="m-0">Private</h6>
              <small>Only those with edit access can see it.</small>
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}

function ShowUploadState({ mutationData, isDirty }) {
  const { loading, error } = mutationData;
  let statusText = "All changes saved";

  if (isDirty) statusText = "Saving changes...";
  if (loading) statusText = "Saving changes…";
  if (error) statusText = "Error saving";

  return (
    <span className="text-body-tertiary m-0 p-0 ms-2 pe-2 text-truncate">
      {statusText}
    </span>
  );
}
