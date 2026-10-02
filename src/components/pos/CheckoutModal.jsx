import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuPlus, LuTrash2, LuLoaderCircle, LuCircleCheck } from "react-icons/lu";
import Modal from "../ui/Modal";
import { paymentsService } from "../../services/paymentsService";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "gift_card", label: "Gift Card" },
  { value: "store_credit", label: "Store Credit" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

const CARD_PROVIDER_TYPES = new Set(["coop", "kcb", "equity", "absa", "other_bank", "pesapal", "visa_mastercard"]);

/**
 * Collects one or more payments (split-payment support) before submitting
 * checkout. Live-computes change/balance client-side purely for display —
 * the server recomputes everything authoritatively when the sale posts.
 *
 * Mobile Money and Card rows can go through the real Payment Provider
 * engine (M-Pesa STK push / bank PDQ terminal) when the business has the
 * Payments add-on and a provider connected — the confirmed gateway
 * reference is what gets submitted as that row's `reference`. Without
 * the add-on/a connected provider, those methods still work exactly as
 * before: the cashier just types in a reference manually.
 */
export default function CheckoutModal({ open, onClose, total, onConfirm, loading, serverError }) {
  const [payments, setPayments] = useState([{ method: "cash", amount: total.toFixed(2), reference: "", confirmed: true }]);

  // This modal is mounted once by POSPage and only toggles visibility via
  // `open` — it never remounts — so the useState() initializer above only
  // ever ran a single time, back when the cart (and `total`) was still 0.
  // Without this effect, every later "Take payment" open kept showing a
  // stale "0.00" default: the Complete Sale button stayed disabled
  // (paid <= 0) and checkout looked like it was doing nothing.
  useEffect(() => {
    if (open) {
      setPayments([{ method: "cash", amount: total.toFixed(2), reference: "", confirmed: true }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: activeProviders } = useQuery({
    queryKey: ["active-payment-providers"],
    queryFn: paymentsService.listActiveProviders,
    enabled: open,
    retry: false,
  });
  const mobileMoneyProvider = activeProviders?.find((p) => p.provider === "mpesa_stk");
  const cardProviders = (activeProviders || []).filter((p) => CARD_PROVIDER_TYPES.has(p.provider));

  const paid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const change = Math.max(0, paid - total);
  const balance = Math.max(0, total - paid);
  const allConfirmed = payments.every((p) => p.confirmed !== false);

  const updatePayment = (i, patch) =>
    setPayments((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const addPayment = () =>
    setPayments((prev) => [...prev, { method: "cash", amount: "0", reference: "", confirmed: true }]);
  const removePayment = (i) => setPayments((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <Modal open={open} onClose={onClose} title="Take payment" width="max-w-md">
      <div className="space-y-4">
        <div className="bg-paper-50 rounded-xl p-4 text-center">
          <p className="text-xs text-ink-700/60 uppercase tracking-wide">Amount due</p>
          <p className="font-display text-3xl font-semibold text-ink-900">KES {total.toFixed(2)}</p>
        </div>

        <div className="space-y-3">
          {payments.map((p, i) => (
            <div key={i} className="space-y-2">
              <div className="grid grid-cols-[1fr_100px_28px] gap-2 items-center">
                <select
                  value={p.method}
                  onChange={(e) => updatePayment(i, { method: e.target.value, reference: "", confirmed: e.target.value === "cash" || e.target.value === "gift_card" || e.target.value === "store_credit" || e.target.value === "bank_transfer", gateway: null })}
                  className="input"
                >
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input
                  type="number" step="0.01" value={p.amount}
                  onChange={(e) => updatePayment(i, { amount: e.target.value })}
                  className="input text-right"
                />
                <button
                  onClick={() => payments.length > 1 && removePayment(i)}
                  className="p-2 text-ink-700/40 hover:text-rose-500"
                >
                  <LuTrash2 className="w-4 h-4" />
                </button>
              </div>

              {p.method === "mobile_money" && (
                <MobileMoneyRow
                  payment={p}
                  provider={mobileMoneyProvider}
                  onChange={(patch) => updatePayment(i, patch)}
                />
              )}

              {p.method === "card" && (
                <CardRow
                  payment={p}
                  providers={cardProviders}
                  onChange={(patch) => updatePayment(i, patch)}
                />
              )}

              {(p.method === "gift_card" || p.method === "store_credit") && (
                <input
                  value={p.reference}
                  onChange={(e) => updatePayment(i, { reference: e.target.value })}
                  className="input text-xs"
                  placeholder="Reference (optional)"
                />
              )}

              {p.method === "bank_transfer" && (
                <BankTransferRow payment={p} onChange={(patch) => updatePayment(i, patch)} />
              )}
            </div>
          ))}
          <button onClick={addPayment} className="flex items-center gap-1 text-xs font-medium text-till-600 hover:text-till-500">
            <LuPlus className="w-3.5 h-3.5" /> Split payment
          </button>
        </div>

        <div className="flex justify-between text-sm pt-2 border-t border-paper-200">
          <span className="text-ink-700/60">{balance > 0 ? "Balance due" : "Change due"}</span>
          <span className="font-semibold text-ink-900">KES {(balance > 0 ? balance : change).toFixed(2)}</span>
        </div>

        {serverError && (
          <p className="text-rose-500 text-sm">{JSON.stringify(serverError)}</p>
        )}

        <button
          onClick={() => onConfirm(payments.map((p) => ({ method: p.method, amount: Number(p.amount), reference: p.reference })))}
          disabled={loading || paid <= 0 || !allConfirmed}
          className="w-full py-2.5 rounded-lg bg-till-500 text-ink-950 font-semibold text-sm hover:bg-till-400 disabled:opacity-50"
        >
          {loading ? "Processing…" : !allConfirmed ? "Waiting for payment confirmation…" : balance > 0 ? "Complete sale (partial payment)" : "Complete sale"}
        </button>
      </div>
    </Modal>
  );
}

/**
 * Mobile Money row: if the business has an M-Pesa STK provider connected,
 * offer to send a real prompt to the customer's phone and auto-fill the
 * reference once Safaricom confirms. Otherwise falls back to a plain
 * phone/reference field, same as before.
 */
function MobileMoneyRow({ payment, provider, onChange }) {
  const [phone, setPhone] = useState("");
  const [txn, setTxn] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!txn || txn.status === "success" || txn.status === "failed" || txn.status === "cancelled") {
      if (txn?.status === "success") onChange({ reference: txn.provider_reference, confirmed: true });
      return;
    }
    pollRef.current = setInterval(async () => {
      const updated = await paymentsService.refreshStatus(txn.id);
      setTxn(updated);
    }, 3000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txn?.id, txn?.status]);

  if (!provider) {
    return (
      <input
        value={payment.reference}
        onChange={(e) => onChange({ reference: e.target.value })}
        className="input text-xs"
        placeholder="M-Pesa phone/reference"
      />
    );
  }

  if (txn?.status === "success") {
    return (
      <div className="flex items-center gap-2 text-xs text-mint-600 bg-mint-50 rounded-lg px-3 py-2">
        <LuCircleCheck className="w-4 h-4 shrink-0" /> Confirmed — {txn.provider_reference}
      </div>
    );
  }

  if (txn) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-700/70 bg-paper-50 rounded-lg px-3 py-2">
        <LuLoaderCircle className="w-4 h-4 animate-spin text-till-500 shrink-0" />
        Waiting for {phone} to enter M-Pesa PIN…
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="input text-xs flex-1"
        placeholder="07XXXXXXXX"
      />
      <button
        type="button"
        disabled={!phone}
        onClick={async () => {
          onChange({ confirmed: false });
          const result = await paymentsService.initiate({ provider: "mpesa_stk", amount: payment.amount, phone_number: phone });
          setTxn(result);
        }}
        className="px-3 py-1.5 rounded-lg bg-till-500 text-ink-950 text-xs font-medium whitespace-nowrap disabled:opacity-50"
      >
        Send STK push
      </button>
    </div>
  );
}

/**
 * Card row: pick which connected bank/gateway to charge on. Bank PDQ
 * terminals are "semi-integrated" (see apps.payments.adapters.bank_terminal)
 * — the cashier keys the amount on the physical terminal themselves, then
 * enters the approval code the terminal prints, which is what populates
 * into the POS as the payment reference.
 */
function CardRow({ payment, providers, onChange }) {
  const [providerCode, setProviderCode] = useState(providers[0]?.provider || "");
  const [txn, setTxn] = useState(null);
  const [approvalCode, setApprovalCode] = useState("");

  // `providers` arrives async (the active-providers query resolves after
  // this modal/row is already mounted). Without this, a cashier who picks
  // "Card" before the list loads gets stuck with providerCode === "" even
  // after providers show up, and "Charge" silently submits an empty
  // provider. Keep providerCode valid whenever the list changes.
  useEffect(() => {
    if (providers.length > 0 && !providers.some((p) => p.provider === providerCode)) {
      setProviderCode(providers[0].provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  if (providers.length === 0) {
    return (
      <input
        value={payment.reference}
        onChange={(e) => onChange({ reference: e.target.value })}
        className="input text-xs"
        placeholder="Card reference (last 4 digits / auth code)"
      />
    );
  }

  if (txn?.status === "awaiting_terminal" && !payment.confirmed) {
    return (
      <div className="flex gap-2">
        <input
          value={approvalCode}
          onChange={(e) => setApprovalCode(e.target.value)}
          className="input text-xs flex-1"
          placeholder="Terminal approval code"
        />
        <button
          type="button"
          disabled={!approvalCode}
          onClick={async () => {
            const updated = await paymentsService.confirmTerminal(txn.id, approvalCode);
            setTxn(updated);
            onChange({ reference: approvalCode, confirmed: true });
          }}
          className="px-3 py-1.5 rounded-lg bg-till-500 text-ink-950 text-xs font-medium whitespace-nowrap"
        >
          Confirm
        </button>
      </div>
    );
  }

  if (payment.confirmed && payment.reference) {
    return (
      <div className="flex items-center gap-2 text-xs text-mint-600 bg-mint-50 rounded-lg px-3 py-2">
        <LuCircleCheck className="w-4 h-4 shrink-0" /> Confirmed — {payment.reference}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <select value={providerCode} onChange={(e) => setProviderCode(e.target.value)} className="input text-xs flex-1">
        {providers.map((p) => (
          <option key={p.id} value={p.provider}>{p.display_name || p.provider_label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={async () => {
          onChange({ confirmed: false });
          const result = await paymentsService.initiate({ provider: providerCode, amount: payment.amount });
          setTxn(result);
        }}
        className="px-3 py-1.5 rounded-lg bg-till-500 text-ink-950 text-xs font-medium whitespace-nowrap"
      >
        Charge
      </button>
    </div>
  );
}

const BANK_TRANSFER_TYPES = [
  { value: "paybill", label: "Paybill" },
  { value: "till", label: "Till Number" },
  { value: "direct", label: "Direct to Bank Account" },
];

/**
 * Bank Transfer row: the customer has already sent the money themselves
 * (M-Pesa Paybill, M-Pesa Till, or a direct bank transfer) rather than
 * the cashier collecting it through a connected Payment Provider — so
 * this is manual entry, same as gift_card/store_credit before it, but
 * structured by transfer type instead of a single free-text field, since
 * a Paybill payment, a Till payment, and a direct bank deposit each carry
 * different reconciliation details.
 */
function BankTransferRow({ payment, onChange }) {
  const [transferType, setTransferType] = useState("paybill");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [txnCode, setTxnCode] = useState("");

  const buildReference = (type, fields) => {
    const code = fields.txnCode?.trim();
    if (type === "paybill") {
      const base = `Paybill ${fields.paybillNumber?.trim() || "—"} · Acc ${fields.accountNumber?.trim() || "—"}`;
      return code ? `${base} · ${code}` : base;
    }
    if (type === "till") {
      const base = `Till ${fields.tillNumber?.trim() || "—"}`;
      return code ? `${base} · ${code}` : base;
    }
    const base = `${fields.bankName?.trim() || "Bank"} · Acc ${fields.bankAccountNumber?.trim() || "—"}`;
    return code ? `${base} · ${code}` : base;
  };

  const emit = (type, patch = {}) => {
    const fields = { paybillNumber, accountNumber, tillNumber, bankName, bankAccountNumber, txnCode, ...patch };
    onChange({ reference: buildReference(type, fields) });
  };

  return (
    <div className="space-y-2">
      <select
        value={transferType}
        onChange={(e) => {
          const type = e.target.value;
          setTransferType(type);
          emit(type);
        }}
        className="input text-xs"
      >
        {BANK_TRANSFER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {transferType === "paybill" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={paybillNumber}
            onChange={(e) => { setPaybillNumber(e.target.value); emit("paybill", { paybillNumber: e.target.value }); }}
            className="input text-xs"
            placeholder="Paybill number"
          />
          <input
            value={accountNumber}
            onChange={(e) => { setAccountNumber(e.target.value); emit("paybill", { accountNumber: e.target.value }); }}
            className="input text-xs"
            placeholder="Account number"
          />
        </div>
      )}

      {transferType === "till" && (
        <input
          value={tillNumber}
          onChange={(e) => { setTillNumber(e.target.value); emit("till", { tillNumber: e.target.value }); }}
          className="input text-xs"
          placeholder="Till number"
        />
      )}

      {transferType === "direct" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={bankName}
            onChange={(e) => { setBankName(e.target.value); emit("direct", { bankName: e.target.value }); }}
            className="input text-xs"
            placeholder="Bank name"
          />
          <input
            value={bankAccountNumber}
            onChange={(e) => { setBankAccountNumber(e.target.value); emit("direct", { bankAccountNumber: e.target.value }); }}
            className="input text-xs"
            placeholder="Account number"
          />
        </div>
      )}

      <input
        value={txnCode}
        onChange={(e) => { setTxnCode(e.target.value); emit(transferType, { txnCode: e.target.value }); }}
        className="input text-xs"
        placeholder="M-Pesa/transaction code (optional)"
      />
    </div>
  );
}
