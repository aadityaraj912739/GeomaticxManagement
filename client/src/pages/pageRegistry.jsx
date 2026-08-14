import CrudPage from "../components/CrudPage";
import Dashboard from "./Dashboard";
import SurveyForms from "./SurveyForms";
import Users from "./Users";
import AuditLogs from "./AuditLogs";
import Geospatial from "./Geospatial";
import Processing from "./Processing";
import Assets from "./Assets";
import Commercial from "./Commercial";
import Approvals from "./Approvals";
import Reporting from "./Reporting";
import AIRecords from "./AIRecords";
import SecurityControls from "./SecurityControls";
import Attendance from "./Attendance";
import SurveySubmissions from "./SurveySubmissions";
import Tasks from "./Tasks";
import Marketing from "./Marketing";
import WorkflowGuide from "./WorkflowGuide";

export const managementRoles = ["ADMIN", "MANAGER"];
export const hrRoles = ["ADMIN", "HR"];
export const employeeName = employee => `${employee.firstName} ${employee.lastName || ""}`.trim();

export function makePages(user, focusedTask = null) {
  return {
    Dashboard: { element: <Dashboard/> },
    "How Website Works": { roles: managementRoles, element: <WorkflowGuide/> },
    Attendance: { element: <Attendance currentUser={user}/> },
    Marketing: { roles: ["ADMIN", "MANAGER", "MARKETING_MANAGER", "MARKETING_EXECUTIVE"], element: <Marketing currentUser={user}/> },
    "Submit Survey": { element: <SurveySubmissions/> },
    Reporting: { roles: managementRoles, element: <Reporting currentUser={user}/> },
    Offices: {
      roles: hrRoles,
      element: <CrudPage title="Offices" endpoint="/offices" fields={[
        { key: "name", label: "Name", required: true },
        { key: "code", label: "Code", required: true },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "phone", label: "Phone" },
        { key: "active", label: "Active", type: "checkbox", default: true }
      ]}/>
    },
    Departments: {
      roles: hrRoles,
      element: <CrudPage title="Departments" endpoint="/departments" fields={[
        { key: "name", label: "Name", required: true },
        { key: "code", label: "Code" },
        { key: "description", label: "Description" }
      ]}/>
    },
    Designations: {
      roles: hrRoles,
      element: <CrudPage title="Designations" endpoint="/designations" fields={[
        { key: "name", label: "Name", required: true },
        { key: "code", label: "Code", required: true },
        { key: "level", label: "Level", type: "number" },
        { key: "description", label: "Description" },
        { key: "active", label: "Active", type: "checkbox", default: true }
      ]}/>
    },
    Employees: {
      roles: hrRoles,
      element: <CrudPage title="Employees" endpoint="/employees" fields={[
        { key: "employeeCode", label: "Employee code", required: true },
        { key: "firstName", label: "First name", required: true },
        { key: "lastName", label: "Last name" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone" },
        { key: "officeId", label: "Office", optionsEndpoint: "/offices" },
        { key: "departmentId", label: "Department", optionsEndpoint: "/departments" },
        { key: "designationId", label: "Designation", optionsEndpoint: "/designations" },
        { key: "reportingManagerId", label: "Reports to", optionsEndpoint: "/employees", optionLabel: employeeName },
        { key: "userId", label: "User account", optionsEndpoint: "/users", optionLabel: account => `${account.name} (${account.email})` },
        { key: "status", label: "Status", type: "select", options: ["ACTIVE", "INACTIVE", "ON_LEAVE", "EXITED"] }
      ]}/>
    },
    Clients: {
      roles: managementRoles,
      element: <CrudPage title="Clients" endpoint="/clients" fields={[
        { key: "name", label: "Name", required: true },
        { key: "code", label: "Code" },
        { key: "contactName", label: "Contact" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone" }
      ]}/>
    },
    Projects: {
      roles: managementRoles,
      element: <CrudPage title="Projects" endpoint="/projects" fields={[
        { key: "code", label: "Code", required: true },
        { key: "name", label: "Name", required: true },
        { key: "location", label: "Location" },
        { key: "startDate", label: "Start", type: "date" },
        { key: "endDate", label: "End", type: "date" },
        { key: "status", label: "Status", type: "select", options: ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] }
      ]}/>
    },
    Tasks: {
      element: <Tasks currentUser={user} focusedTask={focusedTask}/>
    },
    "Spatial GIS": { roles: ["ADMIN", "MANAGER", "SURVEYOR"], element: <Geospatial/> },
    Processing: { roles: ["ADMIN", "MANAGER", "SURVEYOR"], element: <Processing/> },
    Assets: { roles: ["ADMIN", "MANAGER", "HR"], element: <Assets/> },
    Commercial: { roles: managementRoles, element: <Commercial/> },
    Approvals: { roles: ["ADMIN", "MANAGER", "SURVEYOR"], element: <Approvals/> },
    "AI Governance": { roles: ["ADMIN", "MANAGER", "SURVEYOR"], element: <AIRecords currentUser={user}/> },
    "Security Controls": { roles: ["ADMIN"], element: <SecurityControls/> },
    "Survey Forms": { roles: managementRoles, element: <SurveyForms/> },
    "User Accounts": { roles: ["ADMIN"], element: <Users currentUser={user}/> },
    "Audit Trail": { roles: ["ADMIN"], element: <AuditLogs/> }
  };
}
