import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { paymentsService } from "../../services/paymentsService";
import { addonsService } from "../../services/addonsService";

const PROVIDERS = [
  { value: "coop", label: "Co-operative Bank (PDQ)", kind: "bank" },
  { value: "kcb", label: "KCB Bank (PDQ)", kind: "bank" },
  { value: "equity", label: "Equity Bank (PDQ)", kind: "bank" },
  { value: "absa", label: "Absa Bank (PDQ)", kind: "bank" },
  { value: "other_bank", label: "Other Bank (PDQ)", kind: "bank" },
  { value: "pesapal", label: "PesaPal", kind: "gateway" },
  { value: "visa_mastercard", label: "Visa / Mastercard", kind: "gateway" },
  { value: "mpesa_stk", label: "M-Pesa STK Push", kind: "mpesa" },
];

const EMPTY_FORM = {
  provider: "mpesa_stk",
  display_name: "",
  terminal_id: "",
  merchant_id: "",
  api_key: "",
  api_secret: "",
  shortcode: "",
  passkey: "",
  account_reference: "",
  sandbox: true,
};

function kindOf(provider) {
  return PROVIDERS.find((p) => p.value === provider)?.kind || "gateway";
}

export default function PaymentProvidersTab() {
  const queryClient = useQueryClient();
  const { data: myAddons } = useQuery({ queryKey: ["my-addons"], queryFn: addonsService.getMyAddons });
  const paymentsAddonActive = myAddons?.payments?.active;

  const { data: providers, isLoading } = useQuery({
    queryKey: ["payment-providers"],
    queryFn: paymentsService.listProviders,
    enabled: paymentsAddonActive === true,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["payment-providers"] });

  const createMutation = useMutation({
    mutationFn: paymentsService.createProvider,
    onSuccess: () => {
      invalidate();
      setShowForm(false);
      setForm(EMPTY_FORM);
    },
  });
  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => paymentsService.updateProvider(id, { active }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: paymentsService.deleteProvider,
    onSuccess: invalidate,
  });

  const list = Array.isArray(providers) ? providers : providers?.results || [];
  const kind = kindOf(form.provider);

  if (myAddons && !paymentsAddonActive) {
    return (
      <div className="max-w-2xl bg-white rounded-2xl border border-paper-200 p-6 text-center">
        <p className="font-medium text-ink-900 mb-1">Payment Providers is a premium add-on</p>
        <p className="text-sm text-ink-700/60 mb-4">
          Connect bank PDQ terminals, PesaPal, Visa/Mastercard, or your own M-Pesa STK Push once this add-on is
          active on your account.
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

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-white rounded-2xl border border-paper-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-ink-900">Connected payment providers</p>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="px-4 py-2 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400"
          >
            {showForm ? "Cancel" : "+ Connect provider"}
          </button>
        </div>

        {isLoading && <div className="h-16 rounded-xl bg-paper-200/60 animate-pulse" />}

        {!isLoading && list.length === 0 && (
          <p className="text-sm text-ink-700/60">
            No payment providers connected yet. Connect your bank's PDQ terminal, PesaPal, or your own M-Pesa till so
            cashiers can take card / mobile money payments in the POS.
          </p>
        )}

        <div className="space-y-2">
          {list.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-paper-200 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">
                  {p.display_name || PROVIDERS.find((x) => x.value === p.provider)?.label}
                </p>
                <p className="text-xs text-ink-700/60">
                  {PROVIDERS.find((x) => x.value === p.provider)?.label}
                  {p.sandbox ? " · Sandbox" : " · Live"}
                  {p.has_credentials ? " · Credentials saved" : " · No credentials yet"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-ink-700/70">
                  <input
                    type="checkbox"
                    checked={p.active}
                    onChange={(e) => toggleMutation.mutate({ id: p.id, active: e.target.checked })}
                    className="accent-till-500"
                  />
                  Active
                </label>
                <button
                  onClick={() => deleteMutation.mutate(p.id)}
                  className="text-xs text-ink-700/50 hover:text-red-500"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-paper-200 p-6 space-y-4">
          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">Provider</label>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}
              className="input"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-ink-700/70 mb-1.5">Label (shown to cashiers)</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="e.g. KCB Main Till"
              className="input"
            />
          </div>

          {kind === "bank" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Terminal ID</label>
                <input
                  value={form.terminal_id}
                  onChange={(e) => setForm((f) => ({ ...f, terminal_id: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Merchant ID</label>
                <input
                  value={form.merchant_id}
                  onChange={(e) => setForm((f) => ({ ...f, merchant_id: e.target.value }))}
                  className="input"
                />
              </div>
              <p className="col-span-2 text-xs text-ink-700/50">
                Bank card payments are taken on the physical PDQ terminal — the cashier keys in the amount shown in
                the POS, then confirms the terminal's approval code back in MsafiPOS.
              </p>
            </div>
          )}

          {kind === "mpesa" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Shortcode (Till/Paybill)</label>
                <input
                  value={form.shortcode}
                  onChange={(e) => setForm((f) => ({ ...f, shortcode: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Passkey</label>
                <input
                  type="password"
                  value={form.passkey}
                  onChange={(e) => setForm((f) => ({ ...f, passkey: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Consumer Key</label>
                <input
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Consumer Secret</label>
                <input
                  type="password"
                  value={form.api_secret}
                  onChange={(e) => setForm((f) => ({ ...f, api_secret: e.target.value }))}
                  className="input"
                />
              </div>
              <p className="col-span-2 text-xs text-ink-700/50">
                From your own Safaricom Daraja app (Lipa Na M-Pesa Online). Customers get an STK prompt on their
                phone at checkout.
              </p>
            </div>
          )}

          {kind === "gateway" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Consumer Key</label>
                <input
                  value={form.api_key}
                  onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs text-ink-700/70 mb-1.5">Consumer Secret</label>
                <input
                  type="password"
                  value={form.api_secret}
                  onChange={(e) => setForm((f) => ({ ...f, api_secret: e.target.value }))}
                  className="input"
                />
              </div>
              {form.provider === "visa_mastercard" && (
                <p className="col-span-2 text-xs text-ink-700/50">
                  Visa/Mastercard payments are processed through PesaPal's card gateway — use the same PesaPal
                  consumer key/secret here.
                </p>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.sandbox}
              onChange={(e) => setForm((f) => ({ ...f, sandbox: e.target.checked }))}
              className="accent-till-500"
            />
            Sandbox / test mode
          </label>

          <button
            onClick={() => createMutation.mutate(form)}
            disabled={createMutation.isPending}
            className="px-5 py-2.5 rounded-lg bg-till-500 text-ink-950 font-medium text-sm hover:bg-till-400 disabled:opacity-60"
          >
            {createMutation.isPending ? "Saving…" : "Save provider"}
          </button>
          {createMutation.isError && (
            <p className="text-red-500 text-sm">Couldn't save — check the details and try again.</p>
          )}
        </div>
      )}
    </div>
  );
}
