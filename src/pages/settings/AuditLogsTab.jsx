import { useQuery } from "@tanstack/react-query";
import { activityLogsService } from "../../services/usersService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";

export default function AuditLogsTab() {
  const { data, isLoading } = useQuery({ queryKey: ["activity-logs"], queryFn: () => activityLogsService.list() });
  const logs = data?.results ?? [];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Every login, sale, edit, and stock change — who did what, and when." />

      <DataTable
        isLoading={isLoading}
        rows={logs}
        rowKey={(l) => l.id}
        emptyState={<EmptyState title="No activity yet" message="Actions taken in the system will show up here." />}
        columns={[
          { key: "action", header: "Action", accessor: (l) => l.action },
          { key: "user", header: "User", accessor: (l) => l.user_name || "—" },
          { key: "description", header: "Detail", accessor: (l) => l.description || "—" },
          { key: "ip", header: "IP address", accessor: (l) => l.ip_address || "—" },
          { key: "when", header: "When", accessor: (l) => new Date(l.created_at).toLocaleString() },
        ]}
      />
    </div>
  );
}
