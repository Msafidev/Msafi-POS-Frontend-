import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuCheck, LuX } from "react-icons/lu";
import { addonsService } from "../../services/addonsService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";

const STATUS_TONE = { pending: "till", verified: "mint", rejected: "rose" };
const METHOD_LABEL = { pochi_la_biashara: "Pochi la Biashara", till_number: "Till Number" };

export default function AddonVerificationsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  const { data: info } = useQuery({ queryKey: ["addon-plans"], queryFn: addonsService.getPlans });
  const { data, isLoading } = useQuery({
    queryKey: ["all-addon-payments", statusFilter],
    queryFn: () => addonsService.listPayments(statusFilter ? { status: statusFilter } : {}),
  });

  const verifyMutation = useMutation({
    mutationFn: addonsService.verifyPayment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["all-addon-payments"] }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => addonsService.rejectPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-addon-payments"] });
      setRejectTarget(null);
      setRejectReason("");
    },
  });

  const payments = data?.results ?? (Array.isArray(data) ? data : []);

  return (
    <div>
      <PageHeader
        title="Add-on Verifications"
        subtitle="Premium feature payments (Payment Providers, Advanced Tax & eTIMS) awaiting confirmation against your M-Pesa statement."
      />

      <div className="flex gap-1 mb-4 bg-paper-100 p-1 rounded-lg w-fit">
        {["pending", "verified", "rejected", ""].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              statusFilter === s ? "bg-white shadow-sm text-ink-900" : "text-ink-700/60"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <DataTable
        isLoading={isLoading}
        rows={payments}
        rowKey={(p) => p.id}
        emptyState={<EmptyState title="Nothing here" message="No add-on payment submissions match this filter." />}
        columns={[
          { key: "business", header: "Shop", accessor: (p) => p.business_name },
          { key: "addon", header: "Add-on", accessor: (p) => info?.addons[p.feature]?.label || p.feature },
          { key: "amount", header: "Amount", accessor: (p) => `KES ${p.amount}` },
          { key: "method", header: "Method", accessor: (p) => METHOD_LABEL[p.payment_method] },
          { key: "code", header: "Transaction code", accessor: (p) => <span className="font-mono">{p.transaction_code}</span> },
          { key: "phone", header: "Payer phone", accessor: (p) => p.payer_phone },
          { key: "status", header: "Status", accessor: (p) => <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge> },
          { key: "submitted", header: "Submitted by", accessor: (p) => `${p.submitted_by_name} — ${new Date(p.created_at).toLocaleString()}` },
          { key: "actions", header: "", accessor: (p) =>
            p.status === "pending" ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => verifyMutation.mutate(p.id)}
                  disabled={verifyMutation.isPending}
                  className="flex items-center gap-1 text-xs font-medium text-mint-500 hover:text-mint-500/80"
                >
                  <LuCheck className="w-3.5 h-3.5" /> Verify
                </button>
                <button
                  onClick={() => setRejectTarget(p)}
                  className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-500/80"
                >
                  <LuX className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            ) : null,
          },
        ]}
      />

      <Modal open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Reject add-on payment">
        <div className="space-y-4">
          <p className="text-sm text-ink-700/70">
            Rejecting <span className="font-medium text-ink-900">{rejectTarget?.business_name}</span>'s payment
            of KES {rejectTarget?.amount} — the add-on stays locked until they resubmit a corrected claim.
          </p>
          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">Reason (shown to the shop admin)</label>
            <input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input"
              placeholder="e.g. Transaction code doesn't match our M-Pesa statement"
            />
          </div>
          <button
            onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
            disabled={rejectMutation.isPending}
            className="w-full py-2.5 rounded-lg bg-rose-500 text-white font-medium text-sm hover:bg-rose-500/90 disabled:opacity-50"
          >
            {rejectMutation.isPending ? "Rejecting…" : "Reject payment"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
