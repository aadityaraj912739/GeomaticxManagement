import CrudPage from "../components/CrudPage";

const projectName = project => `${project.code} - ${project.name}`;
const userName = user => `${user.name} (${user.email})`;

export default function Processing() {
  return <CrudPage title="Drone, LiDAR and 3D Processing Workflows" endpoint="/processing-jobs" fields={[
    { key: "projectId", label: "Project", optionsEndpoint: "/projects", optionLabel: projectName },
    { key: "datasetName", label: "Dataset name", required: true },
    { key: "sourceType", label: "Source type", type: "select", options: ["RAW", "DRONE", "RASTER", "LIDAR", "POINT_CLOUD", "BIM", "3D_TILE"] },
    { key: "stage", label: "Processing stage", type: "select", options: ["REGISTERED", "REQUESTED", "PROCESSING", "QC", "READY", "FAILED"] },
    { key: "outputType", label: "Output type", type: "select", options: ["ORTHOMOSAIC", "DSM", "DTM", "DEM", "CLASSIFIED_POINT_CLOUD", "MESH", "3D_TILES", "OTHER"] },
    { key: "coordinateSystem", label: "Coordinate system" },
    { key: "checksum", label: "File checksum" },
    { key: "lineage", label: "Lineage" },
    { key: "approvalStatus", label: "Approval status", type: "select", options: ["PENDING", "APPROVED", "REJECTED"] },
    { key: "failureReason", label: "Failure reason" },
    { key: "retryCount", label: "Retry count", type: "number", default: 0 },
    { key: "approvedByUserId", label: "Approved by", optionsEndpoint: "/users", optionLabel: userName },
    { key: "evidenceRef", label: "Approval evidence" },
    { key: "notes", label: "Notes" }
  ]}/>;
}