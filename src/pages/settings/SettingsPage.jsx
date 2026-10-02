import { useState } from "react";
import BusinessInfoTab from "./BusinessInfoTab";
import BranchesTab from "./BranchesTab";
import UsersTab from "./UsersTab";
import PaymentsReceiptTab from "./PaymentsReceiptTab";
import PaymentProvidersTab from "./PaymentProvidersTab";
import TaxEtimsTab from "./TaxEtimsTab";
import AuditLogsTab from "./AuditLogsTab";
import { useAuth } from "../../hooks/useAuth";

const ALL_TABS = [
  { key: "business", label: "Business Info", component: BusinessInfoTab, roles: ["admin", "super_admin"] },
  { key: "branches", label: "Branches", component: BranchesTab, roles: ["admin", "super_admin"] },
  { key: "users", label: "Users", component: UsersTab, roles: ["admin", "super_admin"] },
  { key: "payments", label: "Payments & Receipt", component: PaymentsReceiptTab, roles: ["admin", "super_admin"] },
  {
    key: "payment_providers",
    label: "Payment Providers",
    component: PaymentProvidersTab,
    roles: ["admin", "super_admin"],
  },
  { key: "tax_etims", label: "Tax & eTIMS", component: TaxEtimsTab, roles: ["admin", "super_admin"] },
  { key: "audit", label: "Audit Logs", component: AuditLogsTab, roles: ["admin", "super_admin"] },
];

export default function SettingsPage() {
  const { role } = useAuth();
  const tabs = ALL_TABS.filter((t) => t.roles.includes(role));
  const [active, setActive] = useState(tabs[0]?.key);

  const ActiveComponent = tabs.find((t) => t.key === active)?.component;

  return (
    <div>
      <div className="flex gap-1 mb-6 border-b border-paper-200 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              active === t.key ? "border-till-500 text-ink-900" : "border-transparent text-ink-700/50 hover:text-ink-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {ActiveComponent && <ActiveComponent />}
    </div>
  );
}
