import CrudPage from "../components/CrudPage";

const projectName = project => `${project.code} - ${project.name}`;

export default function Geospatial() {
  return <CrudPage title="Geospatial and Survey Management" endpoint="/spatial-records" fields={[
    { key: "projectId", label: "Project", optionsEndpoint: "/projects", optionLabel: projectName },
    { key: "referenceName", label: "Boundary / location / layer name", required: true },
    { key: "recordType", label: "Record type", type: "select", options: ["PROJECT_BOUNDARY", "SURVEY_LOCATION", "UTILITY_ASSET", "TOPO_CONTROL", "GPR_TRACE", "GIS_LAYER"] },
    { key: "coordinateReferenceSystem", label: "Coordinate reference system" },
    { key: "geometryType", label: "Geometry type", type: "select", options: ["POINT", "LINESTRING", "POLYGON", "RASTER", "MESH"] },
    { key: "geometryValidationStatus", label: "Geometry validation", type: "select", options: ["PENDING", "VALID", "WARNINGS", "INVALID"] },
    { key: "qcStatus", label: "Spatial QC status", type: "select", options: ["NOT_STARTED", "IN_REVIEW", "PASSED", "FAILED"] },
    { key: "coveragePercent", label: "Coverage %", type: "number", default: 0 },
    { key: "mapUrl", label: "Map visualization URL" },
    { key: "utilityAssetRef", label: "Utility / asset mapping" },
    { key: "topoSurveyRef", label: "Topographic survey ref" },
    { key: "gprSurveyRef", label: "GPR survey ref" },
    { key: "dgpsRef", label: "DGPS data ref" },
    { key: "totalStationRef", label: "Total-station data ref" },
    { key: "kmlRef", label: "KML deliverable ref" },
    { key: "cadRef", label: "CAD deliverable ref" },
    { key: "gisDeliverableRef", label: "GIS deliverable ref" },
    { key: "notes", label: "Notes" }
  ]}/>;
}