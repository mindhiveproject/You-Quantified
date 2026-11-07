import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import CodePane from "./code/code_editor";
import DataManagementWindow from "./data mappings/main";
import { VisualsWindow } from "./p5window/p5window";
import DocsWindow from "./docs/main";
import DataSourcesWindow from "./data sources/main";
import SplitPane, {
  SplitPaneLeft,
  SplitPaneRight,
  Divider,
} from "../../../utility/SplitPane";

export function VisualScreen({
  visMetadata,
  code,
  popupVisuals,
  currentScreen,
  isStopped,
  docsContent,
  setters,
  isEditable,
  isDirty,
  isDirtyRef,
  awarenessUser,
  linkedSources,
}) {
  const [errors, setErrors] = useState([]);
  const visName = visMetadata?.title;

  const isDocsVisible = visMetadata?.docsVisible;

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get("dashboard");

  const showDashboard =
    currentScreen.left !== "none" &&
    (viewParam === "true" || viewParam === null);

  return (
    <SplitPane className="split-pane-row">
      <SplitPaneLeft show={`${showDashboard}`}>
        {currentScreen.left === "code" && (
          <CodePane
            visName={visName}
            setCode={setters.setCode}
            code={code}
            isEditable={isEditable}
            extensions={visMetadata?.extensions}
            setExtensions={setters.setExtensions}
            isDirtyRef={isDirtyRef}
            setIsDirty={setters.setIsDirty}
            setRemoteCode={setters.setRemoteCode}
            errors={errors}
            setErrors={setErrors}
          />
        )}
        {currentScreen.left == "docs" && (
          <DocsWindow
            updateDocsData={setters.updateDocsData}
            setDocsVisibility={setters.setDocsVisibility}
            docsContent={docsContent}
            isEditable={isEditable}
            isDocsVisible={isDocsVisible}
            isDirtyRef={isDirtyRef}
            setIsDirty={setters.setIsDirty}
            awarenessUser={awarenessUser}
          />
        )}
        {currentScreen.left === "data" && (
          <DataSourcesWindow
            visMetadata={visMetadata}
            linkedSources={linkedSources}
            isEditable={isEditable}
          />
        )}
        <DataManagementWindow
          visInfo={visMetadata}
          custom={isEditable}
          changeParameters={setters.changeParameters}
          hidden={currentScreen.left !== "dashboard"}
        />
      </SplitPaneLeft>
      <Divider />
      <SplitPaneRight>
        <VisualsWindow
          code={code}
          setErrors={setErrors}
          visMetadata={visMetadata}
          popupVisuals={popupVisuals}
          setPopupVisuals={setters.setPopupVisuals}
          extensions={visMetadata?.extensions}
          isStopped={isStopped}
        />
      </SplitPaneRight>
    </SplitPane>
  );
}
