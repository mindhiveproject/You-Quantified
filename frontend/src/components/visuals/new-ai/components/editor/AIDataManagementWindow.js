import { useSelector } from "react-redux";
import DataManagement from "../../../dashboard/data mappings/data_management";

/**
 * Window component for managing data mappings and parameters in the AI visual generation interface
 * 
 * @param {object} props
 * @param {function} props.changeParameters - Function to update visual parameters
 * @param {object} props.visInfo - Information about the visual
 * @param {boolean} props.custom - Whether this is a custom visual
 * @param {function} props.setIsDashboard - Function to toggle dashboard visibility
 */
export default function AIDataManagementWindow({
  changeParameters,
  visInfo,
  custom,
  setIsDashboard,
}) {
  const parameters = useSelector((state) => state.params);
  const selectorKeys = Object.keys(parameters);
  const visInfoKeys = visInfo?.parameters.map(({ name }) => name);

  if (JSON.stringify(selectorKeys) != JSON.stringify(visInfoKeys)) {
    console.log("settingDashboard to false");

    return (
      <div className="d-flex h-100 w-100 align-items-center justify-content-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-100 ms-1 me-1 overflow-auto">
      <DataManagement
        visInfo={visInfo}
        custom={custom}
        changeParameters={changeParameters}
      />
    </div>
  );
}