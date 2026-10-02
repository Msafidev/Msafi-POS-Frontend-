import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersService } from "../../services/suppliersService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["suppliers", search],
    queryFn: () => suppliersService.list({ search }),
  });

  const createMutation = useMutation({
    mutationFn: suppliersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      setModalOpen(false);
    },
  });

  const suppliers = data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Suppliers"
        subtitle="Who you buy stock from, and what you owe them."
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setModalOpen(true)}
        addLabel="Add supplier"
      />

      <DataTable
        isLoading={isLoading}
        rows={suppliers}
        rowKey={(s) => s.id}
        emptyState={<EmptyState title="No suppliers yet" message="Add a supplier to start creating purchase orders." />}
        columns={[
          { key: "name", header: "Supplier", accessor: (s) => (
            <div>
              <p className="font-medium">{s.name}</p>
              {s.contact_person && <p className="text-xs text-ink-700/50">{s.contact_person}</p>}
            </div>
          )},
          { key: "phone", header: "Phone", accessor: (s) => s.phone || "—" },
          { key: "email", header: "Email", accessor: (s) => s.email || "—" },
          { key: "balance", header: "Outstanding balance", accessor: (s) => `KES ${s.outstanding_balance}` },
          { key: "status", header: "Status", accessor: (s) => <Badge tone={s.is_active ? "mint" : "neutral"}>{s.is_active ? "Active" : "Inactive"}</Badge> },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add supplier">
        <SupplierForm
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function SupplierForm({ onSubmit, loading, serverError }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Supplier name</label>
        <input {...register("name", { required: true })} className="input" autoFocus />
        {errors.name && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Contact person</label>
          <input {...register("contact_person")} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Phone</label>
          <input {...register("phone")} className="input" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Email</label>
        <input type="email" {...register("email")} className="input" />
      </div>
      {serverError && <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>}
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Saving…" : "Save supplier"}
      </button>
    </form>
  );
}
