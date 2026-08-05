import CrudPage from "../components/CrudPage";

const projectName = project => `${project.code} - ${project.name}`;
const employeeName = employee => `${employee.firstName} ${employee.lastName || ""}`.trim();

export default function Assets() {
  return <CrudPage title="Asset and Logistics Management" endpoint="/asset-records" fields={[
    { key: "assetTag", label: "Asset tag", required: true },
    { key: "assetType", label: "Asset type", type: "select", options: ["SURVEY_INSTRUMENT", "VEHICLE", "DRONE", "LIDAR_SENSOR", "GNSS", "TOTAL_STATION", "ACCESSORY", "OTHER"] },
    { key: "serialNumber", label: "Serial number" },
    { key: "status", label: "Availability status", type: "select", options: ["AVAILABLE", "ASSIGNED", "IN_MAINTENANCE", "CALIBRATION_DUE", "RETIRED", "LOST"] },
    { key: "custodianEmployeeId", label: "Custodian", optionsEndpoint: "/employees", optionLabel: employeeName },
    { key: "projectId", label: "Project deployment", optionsEndpoint: "/projects", optionLabel: projectName },
    { key: "lastLocation", label: "Last known location" },
    { key: "calibrationDue", label: "Calibration due", type: "date" },
    { key: "maintenanceDue", label: "Maintenance due", type: "date" },
    { key: "mobilizationStatus", label: "Mobilization status", type: "select", options: ["READY", "MOBILIZED", "DEMOBILIZED", "ON_ROUTE"] },
    { key: "damageReport", label: "Damage / loss report" },
    { key: "movementLog", label: "Movement log" },
    { key: "notes", label: "Notes" }
  ]}/>;
}