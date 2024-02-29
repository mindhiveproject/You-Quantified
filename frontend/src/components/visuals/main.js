import React, { useContext, useEffect, useRef, useState } from "react";
import { useFullScreenHandle } from "react-full-screen";
import { useParams, useNavigate } from "react-router-dom";
import CodePane from "./code_editor";
import DataManagementWindow from "./dashboard/main";
import { VisualsWindow } from "./window/visuals_window";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useDispatch } from "react-redux";
import { fetchCode } from "./fetch_code";
import { useOutsideAlerter } from "../../utility/outsideClickDetection";
import { EditModalManager } from "./edit";

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
  showCode,
}) {
  const fullScreenHandle = useFullScreenHandle();
  const visName = visMetadata?.title;

  const { currentUser } = useContext(UserContext);

  const isEditable = visMetadata?.author?.id === currentUser?.id;

  return (
    <SplitPane className="split-pane-row">
      <SplitPaneLeft>
        {showCode ? (
          <CodePane
            visName={visName}
            setCode={setCode}
            code={code}
            isEditable={isEditable}
          />
        ) : (
          <DataManagementWindow
            visInfo={visMetadata}
            custom={isEditable}
            setVisInfo={setVisMetadata}
          />
        )}
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
  showCode,
  setShowCode,
  popupVisuals,
  setPopupVisuals,
  fullScreenHandle,
  mutationData,
  changeVisMetadata,
}) {
  const [showEdit, setShowEdit] = useState(false);
  const editPopupRef = useRef(null);

  useOutsideAlerter(editPopupRef, setShowEdit);

  return (
    <div className="vis-bar">
      <div className="d-flex align-items-center">
        <div className="align-self-center me-3">
          {visMetadata?.editable && (
            <div>
              <button
                className={`btn-custom code ${showCode ? "active" : ""}`}
                onClick={() => setShowCode(!showCode)}
              >
                <b>
                  <i className="bi bi-code-slash" alt="code"></i>
                </b>
              </button>
              <button
                className="btn-custom secondary"
                onClick={() => setShowEdit(!showEdit)}
              >
                <i className="bi bi-pencil-fill"></i>
              </button>
            </div>
          )}
        </div>
        {showEdit && (
          <div className="edit-popup" ref={editPopupRef}>
            <EditModalManager
              visMetadata={visMetadata}
              setShowEdit={setShowEdit}
              changeVisMetadata={changeVisMetadata}
            />
          </div>
        )}
        <h5 className="align-self-center m-0 text-center">
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

  //const [custom, setCustom] = useState("custom" in visMetadata);

  // Load the visualizations from the local storage
  const [showCode, setShowCode] = useState(false);
  const [code, _setCode] = useState("");

  function setCode(str) {
    localStorage.setItem(`visuals/${visID}`, str);
    const file = createTextFileFromString(str, "code.txt");
    console.log(file);
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

  // Get the code when the program starts
  useEffect(() => {
    fetchCode(visMetadata?.code?.url)
      .then((response) => _setCode(response))
      .catch((error) => _setCode(null));
  }, []);

  const fullScreenHandle = useFullScreenHandle();
  const [popupVisuals, setPopupVisuals] = useState(false);

  return (
    <div className="h-100">
      <VisTopBar
        visMetadata={visMetadata}
        showCode={showCode}
        setShowCode={setShowCode}
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
        showCode={showCode}
        fullScreenHandle={fullScreenHandle}
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
