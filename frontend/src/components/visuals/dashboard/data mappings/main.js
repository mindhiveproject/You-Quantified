import React from "react";
import DataManagement, { NewParameterButton } from "./data_management";
import { useSelector } from "react-redux";

// The window with the data mappings. It stays mounted while another tab is
// open, since its cards are what feed the streams into the parameters.
export default function DataManagementWindow({ hidden, changeParameters, visInfo, custom }) {
  const parameters = useSelector((state) => state.params);
  const visInfoKeys = visInfo?.parameters?.map(({ name }) => name);

  const inSync =
    visInfoKeys?.length === Object.keys(parameters).length &&
    visInfoKeys.every((name) => name in parameters);

  if (!inSync) return <div>Loading...</div>;

  return (
    <div className={`d-flex flex-column h-100 ${hidden ? "d-none" : ""}`}>
      {custom && (
        <div className="action-bar">
          <NewParameterButton visInfo={visInfo} changeParameters={changeParameters} />
        </div>
      )}
      <div className="overflow-auto disable-scrollbar p-4">
        <h2 className="pane-title">Data Mappings</h2>
        <p>Map the parameters to the data received from your device.</p>
        <DataManagement
          visInfo={visInfo}
          custom={custom}
          changeParameters={changeParameters}
        />
      </div>
    </div>
  );
}
