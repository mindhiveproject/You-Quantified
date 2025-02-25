import React, { useContext, useEffect, useRef, useState } from "react";
import { useFullScreenHandle } from "react-full-screen";
import { useParams, useSearchParams } from "react-router-dom";
import CodePane from "./code/code_editor";
import DataManagementWindow from "./data mappings/main";
import { VisualsWindow } from "./p5window/p5window";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useDispatch } from "react-redux";
import { fetchCode } from "../utility/fetch_code";
import { useOutsideAlerter } from "../../../utility/outsideClickDetection";
import { EditModalManager } from "./edit";
import DocsWindow from "./docs/main";

import SplitPane, {
  SplitPaneLeft,
  SplitPaneRight,
  Divider,
} from "../../../utility/SplitPane";
import { MY_VISUALS, CHANGE_VISUAL } from "../../../queries/visuals";
import { UserContext } from "../../../App";

export function VisualScreen({
  visMetadata,
  code,
  popupVisuals,
  currentScreen,
  docsContent,
  setters,
  isEditable,
}) {
  const fullScreenHandle = useFullScreenHandle();
  const visName = visMetadata?.title;

  const isDocsVisible = visMetadata?.docsVisible;

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("dashboard");
  const showDashboard = viewParam === "true" || viewParam === null;

  return (
    <SplitPane className="split-pane-row">
      <SplitPaneLeft show={showDashboard}>
        {currentScreen.left == "code" && (
          <CodePane
            visName={visName}
            setCode={setters.setCode}
            code={code}
            isEditable={isEditable}
            extensions={visMetadata?.extensions}
            setExtensions={setters.setExtensions}
          />
        )}
        {currentScreen.left == "docs" && (
          <DocsWindow
            updateDocsData={setters.updateDocsData}
            setDocsVisibility={setters.setDocsVisibility}
            docsContent={docsContent}
            isEditable={isEditable}
            isDocsVisible={isDocsVisible}
          />
        )}
        <DataManagementWindow
          visInfo={visMetadata}
          custom={isEditable}
          setVisInfo={setters.setVisMetadata}
          showDashboard={showDashboard}
        />
      </SplitPaneLeft>
      <Divider />
      <SplitPaneRight>
        <VisualsWindow
          code={code}
          visMetadata={visMetadata}
          fullScreenHandle={fullScreenHandle}
          popupVisuals={popupVisuals}
          setPopupVisuals={setters.setPopupVisuals}
          extensions={visMetadata?.extensions}
        />
      </SplitPaneRight>
    </SplitPane>
  );
}

function VisTopBar({
  visMetadata,
  currentScreen,
  setCurrentScreen,
  popupVisuals,
  setPopupVisuals,
  fullScreenHandle,
  mutationData,
  changeVisMetadata,
  isEditable,
}) {
  const [showEdit, setShowEdit] = useState(false);
  const editPopupRef = useRef(null);

  useOutsideAlerter(editPopupRef, setShowEdit);

  const isDocsVisible = visMetadata?.docsVisible || isEditable;

  return (
    <div className="vis-bar">
      <div className="d-flex align-items-center">
        <div>
          {visMetadata?.editable && (
            <div>
              <button
                className="btn-custom secondary"
                onClick={() => setShowEdit(!showEdit)}
              >
                <i className="bi bi-pencil-fill"></i>
              </button>
              <button
                className={`btn-custom code ${
                  currentScreen.left == "code" ? "active" : ""
                }`}
                onClick={() =>
                  setCurrentScreen({
                    ...currentScreen,
                    left: currentScreen.left == "code" ? "data" : "code",
                  })
                }
              >
                <b>
                  <i className="bi bi-code-slash" alt="code"></i>
                </b>
              </button>
            </div>
          )}
        </div>
        {isDocsVisible && (
          <button
            className={`btn-custom code ${
              currentScreen.left == "docs" ? "active" : ""
            }`}
            onClick={() =>
              setCurrentScreen({
                ...currentScreen,
                left: currentScreen.left == "docs" ? "data" : "docs",
              })
            }
          >
            <i className="bi bi-file-earmark-text"></i>
          </button>
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
        <h5 className="align-self-center m-0 text-center ms-3">
          {visMetadata?.title}
        </h5>
      </div>
      <div className="d-flex justify-content-end align-items-center">
        <ShowUploadState mutationData={mutationData} />
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
            visMetadata={visMetadata}
            changeVisMetadata={changeVisMetadata}
          />
        )}
        {/*<button className="btn btn-link " onClick={fullScreenHandle.enter}>
          <b>
            <i className="bi bi-arrows-fullscreen" alt="full-screen"></i>
          </b>
        </button>*/}
      </div>
    </div>
  );
}

function PrivacyDropdown({ visMetadata, changeVisMetadata }) {
  const [currentPrivacy, setCurrentPrivacy] = useState(visMetadata?.privacy);

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
      <button className="btn btn-outline-dark" data-bs-toggle="dropdown">
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
              <small>Only you can see it.</small>
            </div>
          </button>
        </li>
      </ul>
    </div>
  );
}

function ShowUploadState({ mutationData }) {
  const { loading, error } = mutationData;

  if (loading)
    return (
      <span className="text-body-tertiary m-0 p-0 ms-2 pe-2">
        Saving changes…
      </span>
    );
  if (error)
    return (
      <span className="text-body-tertiary m-0 p-0 ms-2 pe-2">Error saving</span>
    );

  return (
    <span className="text-body-tertiary m-0 p-0 ms-2 pe-2">
      All changes saved
    </span>
  );
}

export function QueryMainView() {
  const { visID } = useParams();

  const { loading, error, data } = useQuery(MY_VISUALS, {
    variables: { where: { id: { equals: visID } } },
    fetchPolicy: "network-only",
  });

  if (error) return `Error! ${error.message}`;
  if (loading) return "Loading...";

  if (data?.visuals?.length === 0) {
    return <NoVisualScreen />;
  }

  return <MainView visID={visID} queryData={data?.visuals[0]} />;
}

function NoVisualScreen() {
  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  const [konamiIndex, setKonamiIndex] = useState(0);
  const [isDino, setIsDino] = useState(false);

  const konamiIndexRef = useRef(konamiIndex);
  konamiIndexRef.current = konamiIndex;

  function konamiCodeFunc(event, konamiIndexRef) {
    // Check if the key pressed matches the current konami sequence key
    if (event.key === konamiCode[konamiIndexRef.current]) {
      setKonamiIndex((prevIndex) => prevIndex + 1);
      // If the entire Konami code is successfully entered
      if (konamiIndexRef.current + 1 === konamiCode.length) {
        alert(
          "Stranger, whoever you are, open this to find what will amaze you"
        );
        setIsDino(true);
        setKonamiIndex(0); // Reset the index
      }
    } else {
      // Reset the index if the key doesn't match
      setKonamiIndex(0);
    }
  }

  const dinoiFrame = (
    <iframe width="500" height="400" src="https://dinosaurgame.app" />
  );

  useEffect(() => {
    document.addEventListener("keydown", (event) =>
      konamiCodeFunc(event, konamiIndexRef)
    );

    return () => {
      document.removeEventListener("keydown", (event) =>
        konamiCodeFunc(event, konamiIndexRef)
      );
    };
  }, []);

  return (
    <div className="h-100 w-100">
      <div className="position-absolute top-50 start-50 translate-middle">
        <h4 className="text-center">Error 404</h4>
        <p>This visual doesn't seem to exist :(</p>
        {isDino && dinoiFrame}
        {konamiIndex > 2 && <p>?</p>}
        {konamiIndex > 5 && <p>??</p>}
      </div>
    </div>
  );
}

export function MainView({ visID, queryData }) {
  // This function bridges the left pane (code editor/parameters) with the visualization

  const [visMetadata, _setVisMetadata] = useState(queryData);
  const [currentScreen, setCurrentScreen] = useState({
    left: "data",
  });
  const [code, _setCode] = useState("");
  const [docsContent, _setDocsContent] = useState();
  const [popupVisuals, setPopupVisuals] = useState(false);

  const [changeVisMetadata, mutationData] = useMutation(CHANGE_VISUAL, {
    variables: {
      where: { id: visID },
    },
  });
  const dispatch = useDispatch();
  const fullScreenHandle = useFullScreenHandle();

  const { currentUser } = useContext(UserContext);
  const isEditable =
    visMetadata?.author?.id === currentUser?.id || currentUser?.isAdmin;


  function setExtensions(input) {
    // In case I want prettier URLs https://www.jsdelivr.com/docs/data.jsdelivr.com#overview
    _setVisMetadata({
      ...visMetadata,
      extensions: input,
    });
    changeVisMetadata({
      variables: {
        data: {
          extensions: input,
        },
      },
    });
  }

  function setCode(str) {
    localStorage.setItem(`visuals/${visID}`, str);
    const file = createTextFileFromString(str, "code.txt");
    changeVisMetadata({
      variables: {
        data: {
          code: {
            upload: file,
          },
        },
      },
    });
    _setCode(str);
  }

  function updateDocsData(content) {
    changeVisMetadata({
      variables: {
        data: {
          docs: content,
        },
      },
    });
    _setDocsContent(content);
  }

  function setDocsVisibility(input) {
    changeVisMetadata({
      variables: {
        data: {
          docsVisible: input,
        },
      },
    });
  }

  function changeVisParameters(input) {
    _setVisMetadata({
      ...visMetadata,
      parameters: input,
    });
    changeVisMetadata({
      variables: {
        data: {
          parameters: input,
        },
      },
    });
  }

  const setters = {
    setCode,
    changeVisParameters,
    setDocsVisibility,
    updateDocsData,
    setExtensions,
    setPopupVisuals,
  };

  // Get the code and docs when the program starts
  useEffect(() => {
    fetchCode(visMetadata?.code?.url)
      .then((response) => _setCode(response))
      .catch((error) => _setCode(null));
    if (visMetadata?.docs) {
      _setDocsContent(visMetadata?.docs);
    }
  }, []);

  useEffect(() => {
    if (visMetadata?.parameters) {
      dispatch({ type: "params/load", payload: visMetadata?.parameters });
    }
  }, [visMetadata]);

  if (!isEditable && visMetadata?.privacy === "private") {
    return (
      <div className="h-100 w-100 d-flex justify-content-center align-items-center">
        This visual has been made private by the user.
      </div>
    );
  }

  return (
    <div className="h-100">
      <VisTopBar
        visMetadata={visMetadata}
        isEditable={isEditable}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        popupVisuals={popupVisuals}
        setPopupVisuals={setPopupVisuals}
        fullScreenHandle={fullScreenHandle}
        mutationData={mutationData}
        changeVisMetadata={changeVisMetadata}
      />
      <VisualScreen
        isEditable={isEditable}
        visMetadata={visMetadata}
        code={code}
        popupVisuals={popupVisuals}
        currentScreen={currentScreen}
        fullScreenHandle={fullScreenHandle}
        docsContent={docsContent}
        setters={setters}
      />
    </div>
  );
}

function createTextFileFromString(text, filename) {
  // Create a Blob object from the string

  const blob = new Blob([text], { type: "text/plain" });

  //const file = new File([blob], filename, { type: "text/plain" });
  // const downloadLink = URL.createObjectURL(file);

  // Create a new File object from the Blob
  return blob;
}
