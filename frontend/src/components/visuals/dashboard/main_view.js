import React, {
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useFullScreenHandle } from "react-full-screen";
import { VisTopBar } from "./top_bar";
import { VisualScreen } from "./visual_screen";
import { UserContext } from "../../../App";
import { useDispatch } from "react-redux";
import { useMutation } from "@apollo/client/react";
import { CHANGE_VISUAL } from "../../../queries/visuals";
import {
  HocuspocusRoom,
  useHocuspocusProvider,
  useHocuspocusEvent,
} from "@hocuspocus/provider-react";
import { fetchCode } from "../utility/fetch_code";
import {
  prosemirrorJSONToYXmlFragment,
  yXmlFragmentToProseMirrorRootNode,
} from "@tiptap/y-tiptap";
import { extensions } from "./docs/main";
import { getSchema } from "@tiptap/core";
import { userColor } from "../../../utility/user_colors";


const SAVE_DEBOUNCE_MS = 5000;

const docsToJSON = (fragment) =>
  yXmlFragmentToProseMirrorRootNode(fragment, getSchema(extensions)).toJSON();

export default function MainView({ visID, queryData }) {

  const { currentUser } = useContext(UserContext);
  const [currentScreen, setCurrentScreen] = useState({
    left: queryData?.docsVisible ? "docs" : "dashboard",
  });
  const [popupVisuals, setPopupVisuals] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const fullScreenHandle = useFullScreenHandle();
  const provider = useHocuspocusProvider();

  const isOwner =
    queryData?.author?.id === currentUser?.id || currentUser?.isAdmin;

  const isEditable =
    isOwner ||
    queryData?.collaborators?.some(({ id }) => id == currentUser?.id);

  const [visMetadata, _setVisMetadata] = useState(queryData);
  const [code, setCode] = useState("");
  const saveTimeout = useRef(null);

  const dispatch = useDispatch();
  const [changeVisMetadata, mutationData] = useMutation(CHANGE_VISUAL, {
    variables: { where: { id: visID } },
  });

  function setDocsVisibility(input) {
    changeVisMetadata({ variables: { data: { docsVisible: input } } });
  }

  function changeParameters(input) {
    _setVisMetadata({ ...visMetadata, parameters: input });
    changeVisMetadata({ variables: { data: { parameters: input } } });
  }

  function setExtensions(input) {
    _setVisMetadata({ ...visMetadata, extensions: input });
    changeVisMetadata({ variables: { data: { extensions: input } } });
  }

  const seedDocument = useCallback(async () => {
    if (visMetadata?.yjsState) return;

    // Initial seeding:
    const ydoc = provider.document;
    const ycode = ydoc.getText("code");

    if (ycode.length === 0) {
      console.log("Seeding code from the backend");
      const response = await fetchCode(visMetadata?.code?.url);
      ycode.insert(0, response);
    }

    const ytiptap = ydoc.getXmlFragment("docs");
    if (ytiptap.length === 0) {
      if (visMetadata?.docs) {
        console.log("Seeding docs from the backend");
        prosemirrorJSONToYXmlFragment(
          getSchema(extensions),
          visMetadata?.docs,
          ytiptap,
        );
      }
    }
  }, [provider, visMetadata]);

  useHocuspocusEvent("synced", ({ state }) => {
    console.log("Websocket synced", state);
    seedDocument();
  });

  useHocuspocusEvent("authenticationFailed", ({ reason }) => {
    console.warn("Collaboration unavailable — read-only fallback:", reason);
    provider.configuration.websocketProvider.disconnect();
    seedDocument();
  });

  useEffect(() => {
    if (provider?.isSynced) seedDocument();
  }, [provider, seedDocument]);

  useEffect(() => {
    _setVisMetadata(queryData);
  }, [queryData]);


  useEffect(() => {
    if (visMetadata?.parameters) {
      dispatch({ type: "params/sync", payload: visMetadata.parameters });
    }
  }, [dispatch, visMetadata?.parameters]);

  function backupToFields() {
    const ydoc = provider.document;
    const code = ydoc.getText("code").toString();

    changeVisMetadata({
      variables: {
        data: {
          code: { upload: new Blob([code], { type: "text/plain" }) },
          docs: docsToJSON(ydoc.getXmlFragment("docs")),
        },
      },
    });
  }

  useEffect(() => {
    const ycode = provider.document.getText("code");
    const ydocs = provider.document.getXmlFragment("docs");

    function scheduleBackup(transaction) {
      if (!isEditable || !transaction.local) return;
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(backupToFields, SAVE_DEBOUNCE_MS);
    }

    const onCode = (_event, transaction) => {
      setCode(ycode.toString());
      scheduleBackup(transaction);
    };
    const onDocs = (_events, transaction) => scheduleBackup(transaction);

    ycode.observe(onCode);
    ydocs.observeDeep(onDocs);

    return () => {
      ycode.unobserve(onCode);
      ydocs.unobserveDeep(onDocs);
      clearTimeout(saveTimeout.current);
    };
  }, [provider, isEditable]);

  useEffect(() => {
    if (!currentUser?.id) return;
    provider.setAwarenessField("user", {
      name: currentUser.username,
      userID: currentUser.id,
      color: userColor(currentUser.id),
    });
  }, [provider, currentUser?.id, currentUser?.username]);

  const setters = {
    setCode,
    changeParameters,
    setDocsVisibility,
    setExtensions,
    setPopupVisuals,
  };

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
        isOwner={isOwner}
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        popupVisuals={popupVisuals}
        setPopupVisuals={setPopupVisuals}
        fullScreenHandle={fullScreenHandle}
        mutationData={mutationData}
        changeVisMetadata={changeVisMetadata}
        isStopped={isStopped}
        setIsStopped={setIsStopped}
      />
      <VisualScreen
        isEditable={isEditable}
        visMetadata={visMetadata}
        code={code}
        isStopped={isStopped}
        popupVisuals={popupVisuals}
        currentScreen={currentScreen}
        fullScreenHandle={fullScreenHandle}
        setters={setters}
      />
    </div>
  );
}
