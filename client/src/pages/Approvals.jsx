import CrudPage from "../components/CrudPage";

const projectName = project => `${project.code} - ${project.name}`;
const userName = user => `${user.name} (${user.role})`;

export default function Approvals() {
  return <CrudPage title="Quality Control and Approval Workflows" endpoint="/qc-approvals" fields={[
    { key: "projectId", label: "Project", optionsEndpoint: "/projects", optionLabel: projectName },
    { key: "entityType", label: "Entity type", type: "select", options: ["SPATIAL", "PROCESSING", "ASSET", "COMMERCIAL", "DELIVERABLE"] },
    { key: "entityName", label: "Entity name", required: true },
    { key: "version", label: "Version" },
    { key: "makerUserId", label: "Maker", optionsEndpoint: "/users", optionLabel: userName },
    { key: "checkerUserId", label: "Checker", optionsEndpoint: "/users", optionLabel: userName },
    { key: "approvedByUserId", label: "Final approver", optionsEndpoint: "/users", optionLabel: userName },
    { key: "reviewerRole", label: "Reviewer role", type: "select", options: ["SUPERVISOR", "QC", "MANAGER", "CLIENT"] },
    { key: "qcObservation", label: "QC observation" },
    { key: "rejectionReason", label: "Rejection reason" },
    { key: "approvalStatus", label: "Approval status", type: "select", options: ["DRAFT", "SUBMITTED", "REJECTED", "APPROVED", "LOCKED"] },
    { key: "checksum", label: "Output checksum" },
    { key: "lineage", label: "Data lineage" },
    { key: "evidenceRef", label: "Approval evidence" },
    { key: "immutableEventId", label: "Immutable event ID" },
    { key: "notes", label: "Notes" }
  ]}/>;
}