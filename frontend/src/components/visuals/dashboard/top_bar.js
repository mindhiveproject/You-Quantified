import { useState, useRef, useContext } from "react";
import { useOutsideAlerter } from "../../../utility/outsideClickDetection";
import { useSearchParams } from "react-router-dom";
import { UserContext } from "../../../App";
import { EditModalManager } from "./edit";
import { ShareMenu } from "../menu/share";

export function VisTopBar({
  visMetadata,
  currentScreen,
  setCurrentScreen,
  popupVisuals,
  setPopupVisuals,
  fullScreenHandle,
  mutationData,
  changeVisMetadata,
  isEditable,
  isDirty
}) {
  const [showEdit, setShowEdit] = useState(false);
  const editPopupRef = useRef(null);
  const sharePopupRef = useRef(null);
  const [showShare, setShowShare] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPrivacy, setCurrentPrivacy] = useState(visMetadata?.privacy);

  const viewParam = searchParams.get("dashboard");

  useOutsideAlerter(editPopupRef, setShowEdit);
  useOutsideAlerter(sharePopupRef, setShowShare);

  const isDocsVisible = visMetadata?.docsVisible || isEditable;

  function changeScreen(input) {
    let newScreen = input;
    if (input === currentScreen.left) {
      newScreen = "none";
    }
    setCurrentScreen({
      ...currentScreen,
      left: newScreen,
    });
  }

  return (
    <div className="vis-bar">
      <div className="d-flex align-items-center">
        {(viewParam === "true" || viewParam === null) && (
          <div className="d-flex align-items-center">
            <button
              className={`btn-custom primary ${
                currentScreen.left == "dashboard" ? "active" : ""
              }`}
              onClick={() => changeScreen("dashboard")}
            >
              <span className="material-symbols-outlined inline-icon">
                tune
              </span>
            </button>
            <button
              className={`btn-custom code ${
                currentScreen.left == "code" ? "active" : ""
              }`}
              onClick={() => changeScreen("code")}
            >
              <b>
                <span className="material-symbols-outlined inline-icon">
                  code
                </span>
              </b>
            </button>
            {isDocsVisible && (
              <button
                className={`btn-custom code ${
                  currentScreen.left == "docs" ? "active" : ""
                }`}
                onClick={() => changeScreen("docs")}
              >
                <span className="material-symbols-outlined inline-icon">
                  docs
                </span>
              </button>
            )}
          </div>
        )}
        {showEdit && (
          <div className="edit-background">
            <div className="edit-popup" ref={editPopupRef}>
              <EditModalManager
                visMetadata={visMetadata}
                setShowEdit={setShowEdit}
                changeVisMetadata={changeVisMetadata}
              />
            </div>
          </div>
        )}
        <h5 className="align-self-center m-0 text-center ms-3 text-truncate">
          {visMetadata?.title}
        </h5>
      </div>
      <div className="d-flex justify-content-end align-items-center">
        {isEditable && <ShowUploadState mutationData={mutationData} isDirty={isDirty}/>}
        <button
          className="btn btn-link"
          onClick={() => setPopupVisuals(!popupVisuals)}
        >
          <b>
            <i className="bi bi-window" alt="popup-window"></i>
          </b>
        </button>
        {isEditable && (
          <PrivacyDropdown
            currentPrivacy={currentPrivacy}
            setCurrentPrivacy={setCurrentPrivacy}
            changeVisMetadata={changeVisMetadata}
          />
        )}
        {currentPrivacy !== "private" && (
          <button
            className="btn btn-outline-dark me-1 overflow-x-hidden text-nowrap"
            onClick={() => setShowShare(true)}
          >
            <div>
              <span className="material-symbols-outlined inline-icon me-2 ms-n1">
                ios_share
              </span>
              <span>Share</span>
            </div>
          </button>
        )}
        <button
          className="btn btn-outline-dark btn-secondary me-1 overflow-x-hidden ps-3 text-nowrap" // Change styling to make smaller
          onClick={() => setShowEdit(!showEdit)}
        >
          <div>
            <span className="material-symbols-outlined inline-icon me-2 ms-n1">
              edit
            </span>
            <span>Edit</span>
          </div>
        </button>
        {showShare && (
          <div className="edit-background">
            <div className="edit-popup" ref={sharePopupRef}>
              <ShareMenu
                visURL={window.location.href}
                setShowShare={setShowShare}
              />
            </div>
          </div>
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
    <div className="dropdown me-1">
      <button
        className="btn btn-outline-dark ps-3 overflow-x-hidden text-nowrap"
        data-bs-toggle="dropdown"
      >
        {currentPrivacy === "public" && (
          <div>
            <span className="material-symbols-outlined inline-icon me-2 ms-n1">
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
              <small>Only you can see it.</small>
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

  console.log("[Top Bar] isDirty", isDirty);
  if (isDirty) statusText = "Saving changes..."
  if (loading) statusText = "Saving changes…";
  if (error) statusText = "Error saving";

  return (
    <span className="text-body-tertiary m-0 p-0 ms-2 pe-2 text-truncate">
      {statusText}
    </span>
  );
}
