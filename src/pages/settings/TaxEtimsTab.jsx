import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LuCircleCheck, LuCircleX, LuLoaderCircle } from "react-icons/lu";
import { taxService } from "../../services/taxService";
import { addonsService } from "../../services/addonsService";

const RATE_FIELDS = [
  { key: "turnover_tax_rate", label: "Turnover Tax %", estimatable: true },
  { key: "corporation_tax_rate", label: "Corporation Tax %", estimatable: true },
  { key: "withholding_tax_rate", label: "Withholding Tax (WHT) %", estimatable: false },
  { key: "capital_gains_tax_rate", label: "Capital Gains Tax (CGT) %", estimatable: false },
  { key: "excise_duty_rate", label: "Excise Duty %", estimatable: false },
  { key: "digital_service_tax_rate", label: "Digital Service Tax (DST) %", estimatable: false },
];

export default function TaxEtimsTab() {
  const queryClient = useQueryClient();
  const { data: myAddons } = useQuery({ queryKey: ["my-addons"], queryFn: addonsService.getMyAddons });
  const taxAddonActive = myAddons?.tax?.active;

  const { data: profile } = useQuery({
    queryKey: ["tax-profile"],
    queryFn: taxService.getProfile,
    enabled: taxAddonActive === true,
  });
  const { data: summary } = useQuery({
    queryKey: ["tax-summary"],
    queryFn: () => taxService.getSummary(),
    enabled: taxAddonActive === true,
  });
  const {
    data: etimsStatus,
    isLoading: etimsStatusLoading,
    refetch: refetchEtimsStatus,
  } = useQuery({
    queryKey: ["etims-status"],
    queryFn: taxService.getEtimsStatus,
    enabled: taxAddonActive === true && profile?.etims_enabled === true,
    retry: false,
  });

  const { register, handleSubmit, reset } = useForm();
  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  const saveMutation = useMutation({
    mutationFn: taxService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-profile"] });
      queryClient.invalidateQueries({ queryKey: ["tax-summary"] });
      queryClient.invalidateQueries({ queryKey: ["etims-status"] });
    },
  });

  const estimateMutation = useMutation({
    mutationFn: taxService.estimateRecord,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tax-summary"] }),
  });

  if (myAddons && !taxAddonActive) {
    return (
      <div className="max-w-2xl bg-white rounded-2xl border border-paper-200 p-6 text-center">
        <p className="font-medium text-ink-900 mb-1">Advanced Tax & eTIMS is a premium add-on</p>
        <p className="text-sm text-ink-700/60 mb-4">
          Corporation Tax, Turnover Tax, WHT, CGT, Excise Duty, DST and eTIMS e-invoicing unlock once this add-on
          is active. VAT + KRA PIN stay free under Business Info.
        </p>
        <Link
          to="/addons"
          className="inline-block px-5 py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400"
        >
          View Add-ons
        </Link>
      </div>
    );
  }

  if (!profile) {
    return <div className="h-64 rounded-2xl bg-paper-200/60 animate-pulse max-w-2xl" />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form
        onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
        className="bg-white rounded-2xl border border-paper-200 p-6 space-y-4"
      >
        <p className="font-medium text-ink-900">Tax rates</p>
        <p className="text-xs text-ink-700/60">
          Enter the rate that applies to your business — MsafiPOS estimates Turnover Tax and Corporation Tax
          straight from your sales data; the rest (WHT, CGT, Excise, DST) don't depend on POS data, so log those
          under Tax Records below once you know the figure.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {RATE_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-ink-700/70 mb-1.5">{f.label}</label>
              <input type="number" step="0.01" {...register(f.key)} className="input" />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="font-medium text-ink-900">eTIMS (KRA e-invoicing)</p>
          {profile.etims_enabled && <EtimsConnectionBadge status={etimsStatus} isLoading={etimsStatusLoading} onRecheck={refetchEtimsStatus} />}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("etims_enabled")} className="accent-till-500" />
          Enable eTIMS submission for completed sales
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">Environment</label>
            <select {...register("etims_environment")} className="input">
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">Branch code</label>
            <input {...register("etims_branch_code")} className="input" placeholder="00" />
          </div>
          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">Device serial</label>
            <input {...register("etims_device_serial")} className="input" />
          </div>
          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">Communication key</label>
            <input type="password" {...register("etims_communication_key")} className="input" />
          </div>
        </div>
        <p className="text-xs text-ink-700/50">
          These are issued by KRA once your eTIMS OSCU/VSCU device request is approved in the eTIMS taxpayer
          portal — MsafiPOS can't generate them for you.
        </p>

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="px-5 py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400 disabled:opacity-60"
        >
          {saveMutation.isPending ? "Saving…" : "Save tax settings"}
        </button>
      </form>

      {summary && (
        <div className="bg-white rounded-2xl border border-paper-200 p-6">
          <p className="font-medium text-ink-900 mb-1">This month's estimate</p>
          <p className="text-xs text-ink-700/60 mb-4">
            {summary.start} to {summary.end} — turnover KES {summary.turnover.toLocaleString()}, gross profit KES{" "}
            {summary.gross_profit.toLocaleString()}.
          </p>
          <div className="space-y-2">
            {["turnover_tax", "corporation_tax"].map((type) => (
              <div key={type} className="flex items-center justify-between text-sm border-b border-paper-100 pb-2">
                <span className="text-ink-700/70 capitalize">{type.replace("_", " ")}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink-900">
                    {summary.estimates[type] != null ? `KES ${summary.estimates[type].toLocaleString()}` : "Set a rate first"}
                  </span>
                  {summary.rates[type] != null && (
                    <button
                      onClick={() =>
                        estimateMutation.mutate({ tax_type: type, period_start: summary.start, period_end: summary.end })
                      }
                      className="text-xs text-till-500 hover:text-till-400 font-medium"
                    >
                      Log this figure
                    </button>
                  )}
                </div>
              </div>
            ))}
            {summary.manual_entry_required.map((type) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-ink-700/70 capitalize">{type.replace("_", " ")}</span>
                <span className="text-ink-700/50 text-xs">
                  Rate: {summary.rates[type] != null ? `${summary.rates[type]}%` : "not set"} — record manually
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Connected/Not Connected badge — re-runs KRA's device-init call (see
 * apps.tax.etims.ETIMSAdapter.check_connection) rather than assuming
 * "credentials filled in" means "reachable". Click to re-check after
 * fixing something.
 */
function EtimsConnectionBadge({ status, isLoading, onRecheck }) {
  if (isLoading || !status) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-ink-700/50">
        <LuLoaderCircle className="w-3.5 h-3.5 animate-spin" /> Checking…
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRecheck()}
      title={status.reason}
      className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${
        status.connected ? "bg-mint-50 text-mint-600" : "bg-rose-50 text-rose-500"
      }`}
    >
      {status.connected ? <LuCircleCheck className="w-3.5 h-3.5" /> : <LuCircleX className="w-3.5 h-3.5" />}
      {status.connected ? "Connected" : "Not connected"}
    </button>
  );
}
