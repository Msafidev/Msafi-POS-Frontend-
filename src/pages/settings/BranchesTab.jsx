import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesService } from "../../services/businessesService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

export default function BranchesTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["branches"], queryFn: () => branchesService.list() });

  const createMutation = useMutation({
    mutationFn: branchesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      setModalOpen(false);
    },
  });

  const branches = data?.results ?? [];

  return (
    <div>
      <PageHeader title="Branches" subtitle="Locations under this business." onAdd={() => setModalOpen(true)} addLabel="Add branch" />

      <DataTable
        isLoading={isLoading}
        rows={branches}
        rowKey={(b) => b.id}
        emptyState={<EmptyState title="No branches yet" message="Add another location if you operate more than one." />}
        columns={[
          { key: "name", header: "Branch", accessor: (b) => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{b.name}</span>
              {b.is_main && <Badge tone="till">Main</Badge>}
            </div>
          )},
          { key: "code", header: "Code", accessor: (b) => b.code },
          { key: "phone", header: "Phone", accessor: (b) => b.phone || "—" },
          { key: "status", header: "Status", accessor: (b) => <Badge tone={b.is_active ? "mint" : "neutral"}>{b.is_active ? "Active" : "Inactive"}</Badge> },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add branch">
        <BranchForm
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function BranchForm({ onSubmit, loading, serverError }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Branch name</label>
        <input {...register("name", { required: true })} className="input" autoFocus />
        {errors.name && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Branch code</label>
        <input {...register("code", { required: true })} className="input" placeholder="e.g. TOWN2" />
        {errors.code && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Phone</label>
        <input {...register("phone")} className="input" />
      </div>
      {serverError && <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>}
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Saving…" : "Save branch"}
      </button>
    </form>
  );
}
