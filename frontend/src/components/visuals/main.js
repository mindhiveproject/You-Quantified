import React, { useContext, useEffect, useRef, useState } from "react";
import { useFullScreenHandle } from "react-full-screen";
import { useParams, useNavigate } from "react-router-dom";
import CodePane from "./code_editor";
import DataManagementWindow from "./dashboard/main";
import { VisualsWindow } from "./window/visuals_window";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useDispatch } from "react-redux";
import { fetchCode } from "./utility/fetch_code";
import { useOutsideAlerter } from "../../utility/outsideClickDetection";
import { EditModalManager } from "./edit";
import DocsWindow from "./docs/main";

import SplitPane, {
  SplitPaneLeft,
  SplitPaneRight,
  Divider,
} from "../../utility/SplitPane";
import { MY_VISUALS, CHANGE_VISUAL } from "../../queries/visuals";
import { UserContext } from "../../App";

export function VisualScreen({
  visMetadata,
  setCode,
  code,
  setVisMetadata,
  popupVisuals,
  setPopupVisuals,
  currentScreen,
  updateDocsData,
  setDocsVisibility,
  docsContent,
}) {
  const fullScreenHandle = useFullScreenHandle();
  const visName = visMetadata?.title;

  const { currentUser } = useContext(UserContext);
  const isEditable = visMetadata?.author?.id === currentUser?.id;
  const isDocsVisible = visMetadata?.docsVisible;

  return (
    <SplitPane className="split-pane-row">
      <SplitPaneLeft>
        {currentScreen.left == "code" && (
          <CodePane
            visName={visName}
            setCode={setCode}
            code={code}
            isEditable={isEditable}
          />
        )}
        {currentScreen.left == "docs" && (
          <DocsWindow
            updateDocsData={updateDocsData}
            setDocsVisibility={setDocsVisibility}
            docsContent={docsContent}
            isEditable={isEditable}
            isDocsVisible={isDocsVisible}
          />
        )}
        <DataManagementWindow
          visInfo={visMetadata}
          custom={isEditable}
          setVisInfo={setVisMetadata}
        />
      </SplitPaneLeft>
      <Divider />
      <SplitPaneRight>
        <VisualsWindow
          code={code}
          visMetadata={visMetadata}
          fullScreenHandle={fullScreenHandle}
          popupVisuals={popupVisuals}
          setPopupVisuals={setPopupVisuals}
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
}) {
  const [showEdit, setShowEdit] = useState(false);
  const editPopupRef = useRef(null);

  useOutsideAlerter(editPopupRef, setShowEdit);
  const { currentUser } = useContext(UserContext);
  const isEditable = visMetadata?.author?.id === currentUser?.id;
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
          className="btn btn-link "
          onClick={() => setPopupVisuals(!popupVisuals)}
        >
          <b>
            <i className="bi bi-window" alt="popup-window"></i>
          </b>
        </button>
        <button className="btn btn-link " onClick={fullScreenHandle.enter}>
          <b>
            <i className="bi bi-arrows-fullscreen" alt="full-screen"></i>
          </b>
        </button>
      </div>
    </div>
  );
}

function ShowUploadState({ mutationData }) {
  const { loading, error } = mutationData;

  if (loading)
    return (
      <span className="text-body-tertiary m-0 p-0 ms-2 pe-3">
        Uploading data
      </span>
    );
  if (error)
    return (
      <span className="text-body-tertiary m-0 p-0 ms-2 pe-3">
        Error uploading
      </span>
    );

  return (
    <span className="text-body-tertiary m-0 p-0 ms-2 pe-4">
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

  if (loading) return "Loading...";
  if (error) return `Error! ${error.message}`;

  return <MainView visID={visID} queryData={data?.visuals[0]} />;
}

export function MainView({ visID, queryData }) {
  // This function bridges the left pane (code editor/parameters) with the visualization

  const [visMetadata, _setVisMetadata] = useState(queryData);

  const [changeVisMetadata, mutationData] = useMutation(CHANGE_VISUAL, {
    variables: {
      where: { id: visID },
    },
  });

  const dispatch = useDispatch();
  useEffect(() => {
    if (visMetadata?.parameters) {
      dispatch({ type: "params/load", payload: visMetadata?.parameters });
    }
  }, [visMetadata]);

  const [currentScreen, setCurrentScreen] = useState({
    left: "data",
  });

  const [code, _setCode] = useState("");
  const [docsContent, _setDocsContent] = useState();

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

  // Get the code and docs when the program starts
  useEffect(() => {
    fetchCode(visMetadata?.code?.url)
      .then((response) => _setCode(response))
      .catch((error) => _setCode(null));
    if (visMetadata?.docs) {
      _setDocsContent(visMetadata?.docs);
    }
  }, []);

  const fullScreenHandle = useFullScreenHandle();
  const [popupVisuals, setPopupVisuals] = useState(false);

  return (
    <div className="h-100">
      <VisTopBar
        visMetadata={visMetadata}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        popupVisuals={popupVisuals}
        setPopupVisuals={setPopupVisuals}
        fullScreenHandle={fullScreenHandle}
        mutationData={mutationData}
        changeVisMetadata={changeVisMetadata}
      />
      <VisualScreen
        visMetadata={visMetadata}
        setCode={setCode}
        code={code}
        setVisMetadata={changeVisParameters}
        setPopupVisuals={setPopupVisuals}
        popupVisuals={popupVisuals}
        currentScreen={currentScreen}
        fullScreenHandle={fullScreenHandle}
        updateDocsData={updateDocsData}
        setDocsVisibility={setDocsVisibility}
        docsContent={docsContent}
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
