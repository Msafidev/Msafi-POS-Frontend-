import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "../../services/customersService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["customers", search],
    queryFn: () => customersService.list({ search }),
  });

  const createMutation = useMutation({
    mutationFn: customersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setModalOpen(false);
    },
  });

  const customers = data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Profiles, loyalty points, and credit balances."
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setModalOpen(true)}
        addLabel="Add customer"
      />

      <DataTable
        isLoading={isLoading}
        rows={customers}
        rowKey={(c) => c.id}
        emptyState={<EmptyState title="No customers yet" message="Add your first customer to start building purchase history and loyalty." />}
        columns={[
          { key: "name", header: "Customer", accessor: (c) => (
            <div>
              <p className="font-medium">{c.name}</p>
              {c.group_name && <p className="text-xs text-ink-700/50">{c.group_name}</p>}
            </div>
          )},
          { key: "phone", header: "Phone", accessor: (c) => c.phone || "—" },
          { key: "loyalty", header: "Loyalty points", accessor: (c) => c.loyalty_points },
          { key: "credit", header: "Credit balance", accessor: (c) => `KES ${c.credit_balance}` },
          { key: "status", header: "Status", accessor: (c) => <Badge tone={c.is_active ? "mint" : "neutral"}>{c.is_active ? "Active" : "Inactive"}</Badge> },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add customer">
        <CustomerForm
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function CustomerForm({ onSubmit, loading, serverError }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Customer name</label>
        <input {...register("name", { required: true })} className="input" autoFocus />
        {errors.name && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Phone</label>
          <input {...register("phone")} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Email</label>
          <input type="email" {...register("email")} className="input" />
        </div>
      </div>
      {serverError && <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>}
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Saving…" : "Save customer"}
      </button>
    </form>
  );
}
