import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersService } from "../../services/usersService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

const ROLES = ["admin", "manager", "cashier", "store_keeper", "accountant"];

export default function UsersTab() {
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["staff-users"], queryFn: () => usersService.list() });

  const createMutation = useMutation({
    mutationFn: usersService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-users"] });
      setModalOpen(false);
    },
  });

  const users = data?.results ?? [];

  return (
    <div>
      <PageHeader title="Users" subtitle="Staff accounts and their roles." onAdd={() => setModalOpen(true)} addLabel="Add user" />

      <DataTable
        isLoading={isLoading}
        rows={users}
        rowKey={(u) => u.id}
        emptyState={<EmptyState title="No staff added yet" message="Add cashiers, managers, and other staff accounts here." />}
        columns={[
          { key: "name", header: "User", accessor: (u) => (
            <div>
              <p className="font-medium">{u.username}</p>
              <p className="text-xs text-ink-700/50">{u.email}</p>
            </div>
          )},
          { key: "role", header: "Role", accessor: (u) => <Badge tone="till">{u.role.replace("_", " ")}</Badge> },
          { key: "phone", header: "Phone", accessor: (u) => u.phone || "—" },
          { key: "status", header: "Status", accessor: (u) => <Badge tone={u.is_active ? "mint" : "neutral"}>{u.is_active ? "Active" : "Inactive"}</Badge> },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add user">
        <UserForm
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function UserForm({ onSubmit, loading, serverError }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Username</label>
          <input {...register("username", { required: true })} className="input" autoFocus />
          {errors.username && <p className="text-rose-500 text-xs mt-1">Required</p>}
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Role</label>
          <select {...register("role", { required: true })} className="input">
            {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Email</label>
        <input type="email" {...register("email", { required: true })} className="input" />
        {errors.email && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Temporary password</label>
        <input type="password" {...register("password", { required: true, minLength: 8 })} className="input" />
        {errors.password && <p className="text-rose-500 text-xs mt-1">At least 8 characters</p>}
      </div>
      {serverError && <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>}
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
