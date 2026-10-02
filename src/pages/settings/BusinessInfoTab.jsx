import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessesService } from "../../services/businessesService";
import { useAuth } from "../../hooks/useAuth";

export default function BusinessInfoTab() {
  const { user } = useAuth();
  const businessId = user?.business?.id;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessesService.get(businessId),
    enabled: !!businessId,
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const updateMutation = useMutation({
    mutationFn: (values) => businessesService.update(businessId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["business", businessId] }),
  });

  if (isLoading || !data) {
    return <div className="h-64 rounded-2xl bg-paper-200/60 animate-pulse" />;
  }

  return (
    <form onSubmit={handleSubmit((v) => updateMutation.mutate(v))} className="bg-white rounded-2xl border border-paper-200 p-6 max-w-2xl space-y-4">
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Business name</label>
        <input {...register("name")} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Email</label>
          <input type="email" {...register("email")} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Phone</label>
          <input {...register("phone")} className="input" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-ink-700/70 mb-1.5">Address</label>
        <input {...register("address")} className="input" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">KRA PIN</label>
          <input {...register("tax_number")} className="input" placeholder="e.g. P051234567X" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Default VAT %</label>
          <input
            type="number"
            step="0.01"
            {...register("vat_percent")}
            className="input"
            placeholder="16"
          />
          <p className="text-xs text-ink-700/50 mt-1">
            Applied to new products by default (16%/8%/0% per KRA's VAT Act) — free on every plan.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Currency</label>
          <input {...register("currency")} className="input" />
        </div>
        <div>
          <label className="block text-xs text-ink-700/70 mb-1.5">Timezone</label>
          <input {...register("timezone")} className="input" />
        </div>
      </div>
      <button
        type="submit"
        disabled={updateMutation.isPending}
        className="px-5 py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400 disabled:opacity-60"
      >
        {updateMutation.isPending ? "Saving…" : "Save changes"}
      </button>
      {updateMutation.isSuccess && <p className="text-mint-500 text-sm">Saved.</p>}
    </form>
  );
}
