import CrudPage from "../components/CrudPage";

const projectName = project => `${project.code} - ${project.name}`;
const userName = user => `${user.name} (${user.email})`;

export default function SecurityControls() {
  return <CrudPage title="Security, Privacy and Audit Controls" endpoint="/security-registers" fields={[
    { key: "projectId", label: "Project", optionsEndpoint: "/projects", optionLabel: projectName },
    { key: "registerType", label: "Register type", type: "select", options: ["ACCESS_REVIEW", "PRIVACY_RETENTION", "INCIDENT", "VULNERABILITY", "SECRET_REFERENCE", "EVIDENCE_VERIFICATION", "RELEASE_GATE", "ADMIN_SEPARATION"] },
    { key: "title", label: "Title", required: true },
    { key: "ownerUserId", label: "Owner / reviewer", optionsEndpoint: "/users", optionLabel: userName },
    { key: "status", label: "Status", type: "select", options: ["OPEN", "IN_REVIEW", "BLOCKED", "RESOLVED", "CLOSED"] },
    { key: "severity", label: "Severity", type: "select", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
    { key: "controlStatus", label: "Control status", type: "select", options: ["PASS", "WARN", "FAIL"] },
    { key: "evidenceRef", label: "Independent evidence" },
    { key: "retentionUntil", label: "Retention until", type: "date" },
    { key: "secretRef", label: "Secret reference" },
    { key: "blockingReason", label: "Blocking reason" },
    { key: "notes", label: "Notes" }
  ]}/>;
}