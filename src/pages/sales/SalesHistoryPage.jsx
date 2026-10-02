import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuReceipt, LuRotateCcw } from "react-icons/lu";
import { salesService } from "../../services/salesService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import ReceiptModal from "../../components/pos/ReceiptModal";
import RefundModal from "../../components/pos/RefundModal";

const STATUS_TONE = {
  held: "neutral", completed: "mint", refunded: "rose", partially_refunded: "till", voided: "rose",
};

export default function SalesHistoryPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [receiptSale, setReceiptSale] = useState(null);
  const [refundSale, setRefundSale] = useState(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sales", statusFilter],
    queryFn: () => salesService.list(statusFilter ? { status: statusFilter } : {}),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, payload }) => salesService.refund(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setRefundSale(null);
    },
  });

  const sales = data?.results ?? [];

  return (
    <div>
      <PageHeader title="Sales" subtitle="Every transaction, with receipts and refunds one click away." />

      <div className="flex gap-1 mb-4 bg-paper-100 p-1 rounded-lg w-fit">
        {["", "completed", "held", "partially_refunded", "refunded"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              statusFilter === s ? "bg-white shadow-sm text-ink-900" : "text-ink-700/60"
            }`}
          >
            {s ? s.replace("_", " ") : "All"}
          </button>
        ))}
      </div>

      <DataTable
        isLoading={isLoading}
        rows={sales}
        rowKey={(s) => s.id}
        emptyState={<EmptyState title="No sales yet" message="Completed and held sales from the POS screen will show up here." />}
        columns={[
          { key: "number", header: "Sale", accessor: (s) => s.sale_number },
          { key: "customer", header: "Customer", accessor: (s) => s.customer_name || "Walk-in" },
          { key: "cashier", header: "Cashier", accessor: (s) => s.cashier_name },
          { key: "total", header: "Total", accessor: (s) => `KES ${s.total_amount}` },
          { key: "status", header: "Status", accessor: (s) => <Badge tone={STATUS_TONE[s.status]}>{s.status.replace("_", " ")}</Badge> },
          { key: "when", header: "When", accessor: (s) => new Date(s.created_at).toLocaleString() },
          { key: "actions", header: "", accessor: (s) => (
            <div className="flex items-center gap-3">
              <button onClick={() => setReceiptSale(s)} className="flex items-center gap-1 text-xs font-medium text-ink-700/70 hover:text-ink-900">
                <LuReceipt className="w-3.5 h-3.5" /> Receipt
              </button>
              {(s.status === "completed" || s.status === "partially_refunded") && (
                <button onClick={() => setRefundSale(s)} className="flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-500/80">
                  <LuRotateCcw className="w-3.5 h-3.5" /> Refund
                </button>
              )}
            </div>
          )},
        ]}
      />

      <ReceiptModal open={!!receiptSale} onClose={() => setReceiptSale(null)} sale={receiptSale} />
      <RefundModal
        open={!!refundSale}
        onClose={() => setRefundSale(null)}
        sale={refundSale}
        onConfirm={(payload) => refundMutation.mutate({ id: refundSale.id, payload })}
        loading={refundMutation.isPending}
        serverError={refundMutation.error?.response?.data}
      />
    </div>
  );
}
