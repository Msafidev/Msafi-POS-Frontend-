import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService, brandsService } from "../../services/inventoryService";
import PageHeader from "../../components/ui/PageHeader";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";

export default function CategoriesBrandsPage() {
  const [tab, setTab] = useState("categories");
  const [modalOpen, setModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const service = tab === "categories" ? categoriesService : brandsService;
  const { data, isLoading } = useQuery({ queryKey: [tab], queryFn: () => service.list() });

  const createMutation = useMutation({
    mutationFn: service.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [tab] });
      setModalOpen(false);
    },
  });

  const items = data?.results ?? [];

  return (
    <div>
      <PageHeader
        title="Categories & Brands"
        subtitle="Organize your catalog. Categories can be nested; brands are flat."
        onAdd={() => setModalOpen(true)}
        addLabel={tab === "categories" ? "Add category" : "Add brand"}
      />

      <div className="flex gap-1 mb-4 bg-paper-100 p-1 rounded-lg w-fit">
        {["categories", "brands"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-white shadow-sm text-ink-900" : "text-ink-700/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-paper-200/60 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={`No ${tab} yet`} message={`Add your first ${tab.slice(0, -1)} to start organizing products.`} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-paper-200 p-4">
              <p className="font-medium text-ink-900">{item.name}</p>
              {tab === "categories" && (
                <p className="text-xs text-ink-700/50 mt-1">
                  {item.product_count} product{item.product_count === 1 ? "" : "s"}
                  {item.children?.length > 0 && ` · ${item.children.length} subcategories`}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={tab === "categories" ? "Add category" : "Add brand"}>
        <SimpleNameForm
          onSubmit={(values) => createMutation.mutate(values)}
          loading={createMutation.isPending}
          serverError={createMutation.error?.response?.data}
        />
      </Modal>
    </div>
  );
}

function SimpleNameForm({ onSubmit, loading, serverError }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Name</label>
        <input {...register("name", { required: true })} className="input" autoFocus />
        {errors.name && <p className="text-rose-500 text-xs mt-1">Required</p>}
      </div>
      {serverError && <p className="text-rose-500 text-sm">{Object.values(serverError).flat().join(" ")}</p>}
      <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm disabled:opacity-60">
        {loading ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
