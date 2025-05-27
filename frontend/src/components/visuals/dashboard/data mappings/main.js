import React from "react";
import DataManagement from "./data_management";
import { useSelector } from "react-redux";

export default function DataManagementWindow({ showDashbord, changeParameters, visInfo, custom }) {
  // The window with the data mappings



  const parameters = useSelector((state) => state.params);
  const selectorKeys = Object.keys(parameters);
  const visInfoKeys = visInfo?.parameters.map(({ name }) => name);

  if (JSON.stringify(selectorKeys) != JSON.stringify(visInfoKeys))
    return <div>Loading...</div>;

  return (
    <div className={`h-100 ms-5 me-5 overflow-auto disable-scrollbar ${showDashbord ? "d-none":''}`}>
      <h5 className="mt-5">Data Mappings</h5>
      <p>Map the parameters to the data received from your device.</p>
      <DataManagement
        visInfo={visInfo}
        custom={custom}
        changeParameters={changeParameters}
      />
    </div>
  );
}
