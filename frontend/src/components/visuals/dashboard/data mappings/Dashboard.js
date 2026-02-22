import React, { useState } from "react";
import clsx from "clsx";
import DataCard from "./DataCard";
import { useSelector, useDispatch } from "react-redux";
import { selectDataMappings } from "../../utility/selectors";
import { MappingWindow } from "./expanded window";

export default function DataManagementWindow({
  showDashbord,
  changeParameters,
  visInfo,
  custom,
}) {
  // The window with the data mappings

  const parameters = useSelector((state) => state.params);
  const selectorKeys = Object.keys(parameters);
  const visInfoKeys = visInfo?.parameters.map(({ name }) => name);

  if (JSON.stringify(selectorKeys) != JSON.stringify(visInfoKeys))
    return <div>Loading...</div>;

  return (
    <div className={`h-100 overflow-none `}>
      <div className="p-3 mb-3 m-0 bg-light border border-dark mt-n1">
        <h6 className="mb-0 mt-1">Data Mappings</h6>
      </div>
      <div className="ms-3 me-3 h-100">
        <DataManagement
          visInfo={visInfo}
          custom={custom}
          changeParameters={changeParameters}
        />
      </div>
    </div>
  );
}


function DataManagement({ changeParameters, visInfo, custom }) {
  // Contains the entire accordion with all vis properties based on the current visInfo

  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedParam, setExpandedParam] = useState(null);

  const dataMappings = useSelector(selectDataMappings);

  const dispatch = useDispatch();

  function deleteParameter(paramName) {
    // Retrieve data from local storage and assign it to a new object

    const newMeta = JSON.parse(JSON.stringify(visInfo));
    newMeta.parameters = newMeta.parameters.filter(
      ({ name }) => name != paramName,
    );

    changeParameters(newMeta.parameters);
  }

  function updateParameter(oldInfo, newInfo) {
    const newMeta = JSON.parse(JSON.stringify(visInfo));
    const oldParam = newMeta.parameters.find(
      ({ name }) => name === oldInfo.name,
    );
    const updatedParam = { ...oldParam, ...newInfo };
    newMeta.parameters = newMeta.parameters.map((param) =>
      param.name === oldInfo.name ? updatedParam : param,
    );
    changeParameters(newMeta.parameters);
  }

  function handleCloseExpanded() {
    setIsExpanded(true);
    setExpandedParam(null);
  }

  const dataCards = visInfo?.parameters?.map((parameter) => (
    <DataCard
      visParameter={parameter}
      key={parameter.name}
      dataMappings={dataMappings}
      deleteParameter={deleteParameter}
      visInfo={visInfo}
      custom={custom}
      updateParameter={updateParameter}
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      expandedParam={expandedParam}
      setExpandedParam={setExpandedParam}
    />
  ));

  if (Object.keys(dataMappings).length === 0) return <div>Loading...</div>;
  // custom && to check if you can add a new parameter

  return (
    <div className="mb-5 d-flex">
      <div className={clsx("rounded-0", isExpanded && "w-100")}>
        {dataCards}
      </div>
      {!isExpanded && (
        <div className="w-100 border border-tertiary ms-2">
          <MappingWindow
            parameter={expandedParam?.visParameter}
            currentMapping={expandedParam?.currentMapping}
            visInfo={expandedParam?.visInfo}
            updateParameter={expandedParam?.updateParameter}
            deleteParameter={expandedParam?.deleteParameter}
            dataMappings={expandedParam?.dataMappings}
            changeSource={expandedParam?.changeSource}
            onClose={handleCloseExpanded}
          />
        </div>
      )}
    </div>
  );
}
