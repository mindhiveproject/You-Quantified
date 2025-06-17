import React, { useContext, useEffect, useRef, useState } from "react";
import { useFullScreenHandle } from "react-full-screen";
import { useParams, useSearchParams } from "react-router-dom";
import CodePane from "./code/code_editor";
import DataManagementWindow from "./data mappings/main";
import { VisualsWindow } from "./p5window/p5window";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useDispatch } from "react-redux";
import { fetchCode } from "../utility/fetch_code";
import DocsWindowWrapper from "./docs/main";
import { VisTopBar } from "./top_bar";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const collabEndpoint =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_COLLAB_ENDPOINT_DEV || "ws://localhost:3001/collab"
    : process.env.REACT_APP_COLLAB_ENDPOINT;

// Fix names not appearing when in view mode

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

  const { currentUser } = useContext(UserContext);
  const isDocsVisible = visMetadata?.docsVisible;

  const [collab, setCollab] = useState();
  const [isDirty, setIsDirty] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("dashboard");

  console.log("[Visual Screen] Code", code)
  const showDashboard =
    currentScreen.left !== "none" &&
    (viewParam === "true" || viewParam === null);

  const onYUpdate = () => {
    console.log("[Collaborative Editing] Yjs document updated.");
    setIsDirty(true);
  }

  useEffect(() => {
    if (!visMetadata?.id || !currentUser?.name) {
      console.log("[Collaborative Editing] Missing visMetadata ID or currentUser name.");
      return;
    }

    console.log("[Collaborative Editing] Initializing collaborative editing for visual:", visMetadata?.id);

    const doc = new Y.Doc();
    const wsProvider = new WebsocketProvider(collabEndpoint, visMetadata?.id, doc);

    const root = doc.getMap("root");

    const initCollabMap = (key, factory) => {
      if (!root.has(key)) {
        root.set(key, factory());
      }
      return root.get(key);
    };

    initCollabMap("tiptap", () => new Y.XmlFragment());
    initCollabMap("code", () => new Y.Text());

    // Set user awareness with consistent color
    wsProvider.awareness.setLocalStateField("user", {
      name: currentUser.name,
      color: stringToColor(currentUser.name),
    });

    const collaboration = { doc, root, provider: wsProvider };
    setCollab(collaboration);

    console.log("[Collaborative Editing] Collaboration initialized:", collaboration);

    doc.on("update", onYUpdate);

    return () => {
      console.log("[Collaborative Editing] Cleaning up collaborative editing.");
      wsProvider.disconnect();
      doc.destroy();
    };
  }, [visMetadata?.id, currentUser?.name]);

  return (
    <SplitPane className="split-pane-row">
      <SplitPaneLeft show={showDashboard === true ? "true" : "false"}>
        {currentScreen.left == "code" && (
          <CodePane
            visName={visName}
            setCode={setters.setCode}
            code={code}
            isEditable={isEditable}
            extensions={visMetadata?.extensions}
            setExtensions={setters.setExtensions}
            collab={collab}
            isDirty={isDirty}
            setIsDirty={setIsDirty}
          />
        )}
        {currentScreen.left == "docs" && (
          <DocsWindowWrapper
            updateDocsData={setters.updateDocsData}
            setDocsVisibility={setters.setDocsVisibility}
            docsContent={docsContent}
            isEditable={isEditable}
            isDocsVisible={isDocsVisible}
            collab={collab}
            isDirty={isDirty}
            setIsDirty={setIsDirty}
          />
        )}
        <DataManagementWindow
          visInfo={visMetadata}
          custom={isEditable}
          changeParameters={setters.changeParameters}
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

export function QueryMainView() {
  const { visID } = useParams();

  const { loading, error, data } = useQuery(MY_VISUALS, {
    variables: { where: { id: { equals: visID } } },
    // fetchPolicy: "network-only",
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

function MainView({ visID, queryData }) {
  // This function bridges the left pane (code editor/parameters) with the visualization

  const [visMetadata, _setVisMetadata] = useState(queryData);

  useEffect(() => {
    _setVisMetadata(queryData);
  }, [queryData]);

  const [currentScreen, setCurrentScreen] = useState({
    left: visMetadata?.docsVisible ? "docs" : "dashboard",
  });
  const [code, _setCode] = useState("");
  const [docsContent, _setDocsContent] = useState(visMetadata?.docs);
  const [popupVisuals, setPopupVisuals] = useState(false);

  const [changeVisMetadata, mutationData] = useMutation(CHANGE_VISUAL, {
    variables: {
      where: { id: visID },
    },
    refetchQueries: [MY_VISUALS, "VisualsQuery"],
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
    console.log("This is my code", str);
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

  function changeParameters(input) {
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
    changeParameters,
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
  const blob = new Blob([text], { type: "text/plain" });
  //const file = new File([blob], filename, { type: "text/plain" });
  // const downloadLink = URL.createObjectURL(file);

  // Create a new File object from the Blob
  return blob;
}



function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = (hash >> 0) & 0xff;
  const g = (hash >> 8) & 0xff;
  const b = (hash >> 16) & 0xff;

  const mix = 0.7; // 0 = no mix, 1 = full white
  const toHex = (x) =>
    Math.round(x + (255 - x) * mix)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
