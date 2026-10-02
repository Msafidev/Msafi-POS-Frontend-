import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuPlus, LuTrash2, LuPackageCheck } from "react-icons/lu";
import { purchaseOrdersService, productsService } from "../../services/inventoryService";
import { suppliersService } from "../../services/suppliersService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

const STATUS_TONE = {
  draft: "neutral", ordered: "till", partially_received: "till", received: "mint", cancelled: "rose",
};

export default function PurchaseOrdersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["purchase-orders"], queryFn: () => purchaseOrdersService.list() });
  const { data: suppliers } = useQuery({ queryKey: ["suppliers"], queryFn: () => suppliersService.list() });
  const { data: products } = useQuery({ queryKey: ["products", ""], queryFn: () => productsService.list() });

  const createMutation = useMutation({
    mutationFn: purchaseOrdersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      setModalOpen(false);
    },
  });

  const receiveMutation = useMutation({
    mutationFn: purchaseOrdersService.receive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const orders = data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Purchase Orders"
        subtitle="Order stock from suppliers, then receive it to update inventory automatically."
        onAdd={() => setModalOpen(true)}
        addLabel="New purchase order"
      />

      <DataTable
        isLoading={isLoading}
        rows={orders}
        rowKey={(po) => po.id}
        emptyState={<EmptyState title="No purchase orders yet" message="Create one to start ordering stock from your suppliers." />}
        columns={[
          { key: "ref", header: "Reference", accessor: (po) => po.reference },
          { key: "supplier", header: "Supplier", accessor: (po) => po.supplier_name },
          { key: "status", header: "Status", accessor: (po) => <Badge tone={STATUS_TONE[po.status]}>{po.status.replace("_", " ")}</Badge> },
          { key: "total", header: "Total cost", accessor: (po) => `KES ${po.total_cost}` },
          { key: "actions", header: "", accessor: (po) =>
            po.status !== "received" && po.status !== "cancelled" ? (
              <button
                onClick={() => receiveMutation.mutate(po.id)}
                disabled={receiveMutation.isPending}
                className="flex items-center gap-1.5 text-xs font-medium text-mint-500 hover:text-mint-500/80"
              >
                <LuPackageCheck className="w-3.5 h-3.5" /> Receive
              </button>
            ) : null,
          },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New purchase order" width="max-w-xl">
        <PurchaseOrderForm
          suppliers={suppliers?.results ?? []}
          products={products?.results ?? []}
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function PurchaseOrderForm({ suppliers, products, onSubmit, loading, serverError }) {
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { items: [{ product: "", quantity_ordered: "", unit_cost: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Supplier</label>
          <select {...register("supplier", { required: true })} className="input">
            <option value="">Select a supplier</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.supplier && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Reference</label>
          <input {...register("reference", { required: true })} className="input" placeholder="e.g. PO-1001" />
          {errors.reference && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs text-ink-700/70">Items</label>
          <button
            type="button"
            onClick={() => append({ product: "", quantity_ordered: "", unit_cost: "" })}
            className="flex items-center gap-1 text-xs font-medium text-till-600 hover:text-till-500"
          >
            <LuPlus className="w-3.5 h-3.5" /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-[1fr_80px_90px_28px] gap-2 items-start">
              <select {...register(`items.${index}.product`, { required: true })} className="input">
                <option value="">Product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input
                type="number" step="0.01" placeholder="Qty"
                {...register(`items.${index}.quantity_ordered`, { required: true })}
                className="input"
              />
              <input
                type="number" step="0.01" placeholder="Cost"
                {...register(`items.${index}.unit_cost`, { required: true })}
                className="input"
              />
              <button
                type="button"
                onClick={() => fields.length > 1 && remove(index)}
                className="p-2 text-ink-700/40 hover:text-rose-500"
              >
                <LuTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {serverError && <p className="text-rose-500 text-sm">{JSON.stringify(serverError)}</p>}

      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Creating…" : "Create purchase order"}
      </button>
    </form>
  );
}
