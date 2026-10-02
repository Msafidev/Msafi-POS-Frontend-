import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expensesService } from "../../services/expensesService";
import PageHeader from "../../components/ui/PageHeader";
import DataTable from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";

const RECURRENCE_LABEL = { none: "One-off", daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", search],
    queryFn: () => expensesService.list({ search }),
  });
  const { data: categories } = useQuery({ queryKey: ["expense-categories"], queryFn: () => expensesService.categories.list() });

  const createMutation = useMutation({
    mutationFn: expensesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setModalOpen(false);
    },
  });

  const expenses = data?.results ?? [];
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`Everything spent running the business. Total shown: KES ${total.toFixed(2)}`}
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setModalOpen(true)}
        addLabel="Record expense"
      />

      <DataTable
        isLoading={isLoading}
        rows={expenses}
        rowKey={(e) => e.id}
        emptyState={<EmptyState title="No expenses recorded" message="Record your first expense to start tracking spend." />}
        columns={[
          { key: "title", header: "Expense", accessor: (e) => (
            <div>
              <p className="font-medium">{e.title}</p>
              {e.category_name && <p className="text-xs text-ink-700/50">{e.category_name}</p>}
            </div>
          )},
          { key: "amount", header: "Amount", accessor: (e) => `KES ${e.amount}` },
          { key: "date", header: "Date", accessor: (e) => e.expense_date },
          { key: "recurrence", header: "Recurrence", accessor: (e) => (
            e.is_recurring ? <Badge tone="till">{RECURRENCE_LABEL[e.recurrence_period]}</Badge> : <Badge tone="neutral">One-off</Badge>
          )},
          { key: "by", header: "Recorded by", accessor: (e) => e.recorded_by_name },
        ]}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record expense">
        <ExpenseForm
          categories={categories?.results ?? []}
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function ExpenseForm({ categories, onSubmit, loading, serverError }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { expense_date: new Date().toISOString().slice(0, 10), recurrence_period: "none" },
  });
  const isRecurring = watch("recurrence_period") !== "none";

  const submit = (values) => onSubmit({ ...values, is_recurring: isRecurring });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Title</label>
        <input {...register("title", { required: true })} className="input" autoFocus placeholder="e.g. July rent, Electricity bill…" />
        {errors.title && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Amount</label>
          <input type="number" step="0.01" {...register("amount", { required: true })} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Date</label>
          <input type="date" {...register("expense_date", { required: true })} className="input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Category</label>
          <select {...register("category")} className="input">
            <option value="">None</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Recurrence</label>
          <select {...register("recurrence_period")} className="input">
            <option value="none">One-off</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Notes (optional)</label>
        <input {...register("description")} className="input" />
      </div>

      {serverError && <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>}

      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Saving…" : "Save expense"}
      </button>
    </form>
  );
}
