import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuCircleCheck, LuLock, LuLoaderCircle, LuTriangleAlert } from "react-icons/lu";
import { addonsService } from "../../services/addonsService";
import Badge from "../../components/ui/Badge";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";

const STATUS_TONE = { pending: "till", processing: "till", verified: "mint", rejected: "rose", failed: "rose" };

export default function AddonsPage() {
  const [selectedAddon, setSelectedAddon] = useState(null);
  const queryClient = useQueryClient();

  const { data: info, isLoading } = useQuery({ queryKey: ["addon-plans"], queryFn: addonsService.getPlans });
  const { data: mine } = useQuery({ queryKey: ["my-addons"], queryFn: addonsService.getMyAddons });
  const { data: paymentsData } = useQuery({ queryKey: ["addon-payments"], queryFn: () => addonsService.listPayments() });

  const payments = paymentsData?.results ?? (Array.isArray(paymentsData) ? paymentsData : []);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold text-ink-900">Add-ons</h1>
        <p className="text-sm text-ink-700/60">
          MsafiPOS itself is free — these are the only paid features. Pay by M-Pesa STK push and access unlocks
          automatically the moment the payment is confirmed, no waiting on anyone to approve it.
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-2xl bg-paper-200/60 animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {Object.entries(info.addons).map(([key, addon]) => {
              const status = mine?.[key];
              const isActive = status?.active;
              return (
                <div key={key} className="rounded-2xl border border-paper-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-semibold text-ink-900">{addon.label}</p>
                    </div>
                    {isActive ? (
                      <LuCircleCheck className="w-5 h-5 text-mint-500 shrink-0" />
                    ) : (
                      <LuLock className="w-5 h-5 text-ink-700/30 shrink-0" />
                    )}
                  </div>
                  <p className="text-xl font-display font-bold text-ink-900 mt-3">
                    KES {addon.price.toLocaleString()}
                    <span className="text-xs font-normal text-ink-700/50"> / {addon.days} days</span>
                  </p>
                  {isActive ? (
                    <p className="text-xs text-mint-500 mt-2">
                      Active until {new Date(status.expires_at).toLocaleDateString()}
                    </p>
                  ) : (
                    <button
                      onClick={() => setSelectedAddon(key)}
                      className="mt-3 w-full py-2 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400"
                    >
                      Purchase via M-Pesa
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() => setSelectedAddon(key)}
                      className="mt-3 w-full py-2 rounded-lg border border-paper-200 text-ink-700 font-medium text-sm hover:border-till-500/50"
                    >
                      Renew early
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {selectedAddon && (
            <STKPurchaseFlow
              addon={selectedAddon}
              addonInfo={info.addons[selectedAddon]}
              onDone={() => {
                setSelectedAddon(null);
                queryClient.invalidateQueries({ queryKey: ["my-addons"] });
                queryClient.invalidateQueries({ queryKey: ["addon-payments"] });
              }}
              onCancel={() => setSelectedAddon(null)}
            />
          )}
        </>
      )}

      <h2 className="font-display font-semibold text-ink-900 mt-10 mb-3">Your add-on payment history</h2>
      <DataTable
        rows={payments}
        rowKey={(p) => p.id}
        emptyState={<EmptyState title="No add-on payments yet" message="Purchases you make will show up here." />}
        columns={[
          { key: "addon", header: "Add-on", accessor: (p) => info?.addons[p.feature]?.label || p.feature },
          { key: "amount", header: "Amount", accessor: (p) => `KES ${p.amount}` },
          { key: "phone", header: "Phone", accessor: (p) => p.payer_phone },
          { key: "code", header: "M-Pesa code", accessor: (p) => p.transaction_code || "—" },
          { key: "status", header: "Status", accessor: (p) => (
            <div>
              <Badge tone={STATUS_TONE[p.status]}>{p.status}</Badge>
              {(p.status === "rejected" || p.status === "failed") && p.rejection_reason && (
                <p className="text-xs text-rose-500 mt-1">{p.rejection_reason}</p>
              )}
            </div>
          )},
          { key: "when", header: "Submitted", accessor: (p) => new Date(p.created_at).toLocaleString() },
        ]}
      />
    </div>
  );
}

/**
 * Kicks off an STK push, then polls checkStatus every 3s (the phone's
 * M-Pesa prompt itself expires after ~60-90s) until it lands on
 * verified/failed, or the shop gives up and cancels. Auto-verified end
 * to end — there's nothing for the shop or a Super Admin to click once
 * the phone confirms.
 */
function STKPurchaseFlow({ addon, addonInfo, onDone, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [payment, setPayment] = useState(null);
  const pollRef = useRef(null);

  const initiateMutation = useMutation({
    mutationFn: addonsService.initiatePurchase,
    onSuccess: (data) => setPayment(data),
  });

  useEffect(() => {
    if (!payment || payment.status === "verified" || payment.status === "failed") {
      if (payment?.status === "verified") setTimeout(onDone, 1200);
      return;
    }
    pollRef.current = setInterval(async () => {
      const updated = await addonsService.checkStatus(payment.id);
      setPayment(updated);
    }, 3000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment?.id, payment?.status]);

  return (
    <div className="rounded-2xl border border-paper-200 bg-white p-6 mb-8">
      <h3 className="font-display font-semibold text-ink-900 mb-1">
        Pay KES {addonInfo.price.toLocaleString()} for {addonInfo.label}
      </h3>
      <p className="text-xs text-ink-700/50 mb-4">
        Enter the Safaricom number to send the M-Pesa prompt to. Access unlocks automatically once it's confirmed.
      </p>

      {!payment && (
        <form onSubmit={handleSubmit((values) => initiateMutation.mutate({ ...values, feature: addon }))} className="space-y-4">
          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">M-Pesa phone number</label>
            <input {...register("phone_number", { required: true })} className="input" placeholder="07XXXXXXXX" />
            {errors.phone_number && <p className="text-rose-500 text-xs mt-1">Required</p>}
          </div>

          {initiateMutation.error && (
            <p className="text-rose-500 text-sm">
              {initiateMutation.error.response?.data?.detail ||
                Object.values(initiateMutation.error.response?.data || {}).flat().join(" ") ||
                "Couldn't send the STK push."}
            </p>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-paper-200 text-ink-700 text-sm font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={initiateMutation.isPending}
              className="flex-1 py-2.5 rounded-lg bg-till-500 text-ink-950 font-semibold text-sm hover:bg-till-400 disabled:opacity-60"
            >
              {initiateMutation.isPending ? "Sending…" : "Send STK push"}
            </button>
          </div>
        </form>
      )}

      {payment && payment.status !== "verified" && payment.status !== "failed" && (
        <div className="flex items-center gap-3 bg-paper-50 rounded-xl p-4">
          <LuLoaderCircle className="w-5 h-5 text-till-500 animate-spin shrink-0" />
          <p className="text-sm text-ink-700/70">
            Check {payment.payer_phone} for the M-Pesa prompt and enter your PIN — this updates automatically.
          </p>
        </div>
      )}

      {payment?.status === "verified" && (
        <div className="flex items-center gap-3 bg-mint-50 rounded-xl p-4">
          <LuCircleCheck className="w-5 h-5 text-mint-500 shrink-0" />
          <p className="text-sm text-ink-900">Payment confirmed — {addonInfo.label} is now active.</p>
        </div>
      )}

      {payment?.status === "failed" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-rose-50 rounded-xl p-4">
            <LuTriangleAlert className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-sm text-rose-600">{payment.rejection_reason || "Payment failed or was cancelled."}</p>
          </div>
          <button onClick={() => setPayment(null)} className="w-full py-2.5 rounded-lg border border-paper-200 text-ink-700 text-sm font-medium">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
