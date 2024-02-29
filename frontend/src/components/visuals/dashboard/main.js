import React, { useEffect, useState } from "react";
import DataManagement from "./data_management";
import { useSelector, useDispatch } from "react-redux";

export default function DataManagementWindow({ setVisInfo, visInfo, custom }) {
  // The window with the data mappings

  const parameters = useSelector((state) => state.params);
  if (Object.keys(parameters).length === 0) return <div>Loading...</div>;

  return (
    <div className="h-100 ms-5 me-5 overflow-auto disable-scrollbar">
      <h5 className="mt-5">Data Mappings</h5>
      <p>Map the parameters to the data received from your device.</p>
      <DataManagement
        visInfo={visInfo}
        custom={custom}
        setVisInfo={setVisInfo}
        parameters={parameters}
      />
    </div>
  );
}
