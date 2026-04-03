import React, { useState } from "react";
import DataCard from "./DataCard";
import { useSelector, useDispatch } from "react-redux";
import { selectDataMappings } from "../../utility/selectors";
import { MappingWindow } from "./expanded window";
import { motion, AnimatePresence } from "motion/react";

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
    <div className="h-100 d-flex flex-column" style={{ overflow: "hidden" }}>
      <div className="p-3 m-0 bg-light border border-dark mt-n1">
        <h6 className="mb-0 mt-1">Data Mappings</h6>
      </div>
      <div className="flex-grow-1 overflow-hidden">
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

    if (newInfo.name && newInfo.name !== oldInfo.name) {
      dispatch({
        type: "params/rename",
        payload: { oldName: oldInfo.name, newName: newInfo.name },
      });
    }

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
    <div className="d-flex h-100 p-2 pb-4">
      <motion.div
        className="rounded-0 overflow-hidden flex-shrink-0"
        animate={{ width: isExpanded ? "100%" : 68 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {dataCards}
      </motion.div>
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            className="border border-tertiary ms-2 h-100 overflow-y-auto"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            exit={{ width: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <MappingWindow
              parameter={expandedParam?.visParameter}
              currentMapping={(() => {
                const raw = expandedParam?.visParameter
                  ? dataMappings?.[expandedParam.visParameter.name]
                  : undefined;
                return raw !== "Manual" ? raw : undefined;
              })()}
              visInfo={expandedParam?.visInfo}
              updateParameter={expandedParam?.updateParameter}
              deleteParameter={expandedParam?.deleteParameter}
              dataMappings={dataMappings}
              changeSource={expandedParam?.changeSource}
              onClose={handleCloseExpanded}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
