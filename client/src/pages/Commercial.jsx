import CrudPage from "../components/CrudPage";

const projectName = project => `${project.code} - ${project.name}`;

export default function Commercial() {
  return <CrudPage title="Commercial and Financial Monitoring" endpoint="/commercial-records" fields={[
    { key: "projectId", label: "Project", optionsEndpoint: "/projects", optionLabel: projectName },
    { key: "workOrderNo", label: "Work-order number", required: true },
    { key: "projectValue", label: "Project value", type: "number" },
    { key: "boqLineItem", label: "BOQ line item" },
    { key: "billingMilestone", label: "Billing milestone" },
    { key: "invoiceNo", label: "Invoice number" },
    { key: "receivableStatus", label: "Receivable status", type: "select", options: ["NOT_BILLED", "BILLED", "PARTIAL", "OVERDUE", "COLLECTED"] },
    { key: "paymentFollowUp", label: "Payment follow-up" },
    { key: "expenseType", label: "Expense type", type: "select", options: ["EMPLOYEE", "VENDOR", "PROCUREMENT", "TRAVEL", "EQUIPMENT", "OTHER"] },
    { key: "vendorName", label: "Vendor name" },
    { key: "expenseAmount", label: "Expense amount", type: "number" },
    { key: "revenueSummary", label: "Revenue summary" },
    { key: "costSummary", label: "Cost summary" },
    { key: "purchaseRef", label: "Purchase / procurement ref" },
    { key: "managementDashboardNote", label: "Management dashboard note" },
    { key: "notes", label: "Notes" }
  ]}/>;
}