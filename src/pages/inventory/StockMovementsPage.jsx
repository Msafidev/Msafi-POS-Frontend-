import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockMovementsService, productsService } from "../../services/inventoryService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

const TYPE_TONE = { stock_in: "mint", stock_out: "rose", adjustment: "till", transfer: "neutral" };

export default function StockMovementsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["stock-movements"], queryFn: () => stockMovementsService.list() });
  const { data: products } = useQuery({ queryKey: ["products", ""], queryFn: () => productsService.list() });

  const createMutation = useMutation({
    mutationFn: stockMovementsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setModalOpen(false);
    },
  });

  const movements = data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Stock Movements"
        subtitle="Every stock in, stock out, transfer, and adjustment — a full audit trail."
        onAdd={() => setModalOpen(true)}
        addLabel="Record movement"
      />

      <DataTable
        isLoading={isLoading}
        rows={movements}
        rowKey={(m) => m.id}
        emptyState={<EmptyState title="No movements recorded" message="Stock in your first delivery to see it here." />}
        columns={[
          { key: "type", header: "Type", accessor: (m) => <Badge tone={TYPE_TONE[m.movement_type]}>{m.movement_type.replace("_", " ")}</Badge> },
          { key: "product", header: "Product", accessor: (m) => m.product_name },
          { key: "qty", header: "Quantity", accessor: (m) => m.quantity },
          { key: "reason", header: "Reason", accessor: (m) => m.reason || "—" },
          { key: "by", header: "By", accessor: (m) => m.performed_by_name },
          { key: "when", header: "When", accessor: (m) => new Date(m.created_at).toLocaleString() },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record stock movement">
        <MovementForm
          products={products?.results ?? []}
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function MovementForm({ products, onSubmit, loading, serverError }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Product</label>
        <select {...register("product", { required: true })} className="input">
          <option value="">Select a product</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
        </select>
        {errors.product && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Movement type</label>
          <select {...register("movement_type", { required: true })} className="input">
            <option value="stock_in">Stock in</option>
            <option value="stock_out">Stock out</option>
            <option value="adjustment">Adjustment</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Quantity</label>
          <input type="number" step="0.01" {...register("quantity", { required: true })} className="input" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Reason (optional)</label>
        <input {...register("reason")} className="input" placeholder="e.g. Damaged goods, stock count correction…" />
      </div>
      {serverError && <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>}
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Saving…" : "Record movement"}
      </button>
    </form>
  );
}
