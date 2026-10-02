import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import QRCode from "qrcode";
import { LuPrinter } from "react-icons/lu";
import Modal from "../ui/Modal";
import { useAuth } from "../../hooks/useAuth";
import { businessesService } from "../../services/businessesService";
import { addonsService } from "../../services/addonsService";
import { taxService } from "../../services/taxService";

export default function ReceiptModal({ open, onClose, sale }) {
  const { user } = useAuth();
  const businessId = user?.business?.id;
  const [qrDataUrl, setQrDataUrl] = useState("");

  const { data: business } = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessesService.get(businessId),
    enabled: !!businessId && open,
  });
  const { data: myAddons } = useQuery({
    queryKey: ["my-addons"],
    queryFn: addonsService.getMyAddons,
    enabled: open,
  });
  const taxAddonActive = myAddons?.tax?.active;

  const { data: etimsData } = useQuery({
    queryKey: ["etims-invoice", sale?.id],
    queryFn: () => taxService.listETIMSInvoices({ sale: sale.id }),
    enabled: !!sale && open && taxAddonActive === true,
  });
  const etimsInvoices = etimsData?.results ?? (Array.isArray(etimsData) ? etimsData : []);
  const etimsInvoice = etimsInvoices[0];

  useEffect(() => {
    if (!sale) return;
    const verificationText =
      etimsInvoice?.status === "submitted" && etimsInvoice.qr_code_data
        ? etimsInvoice.qr_code_data
        : [
            business?.name || "MsafiPOS",
            `Receipt: ${sale.sale_number}`,
            `Total: KES ${sale.total_amount}`,
            `Date: ${new Date(sale.created_at).toLocaleString()}`,
            business?.tax_number ? `KRA PIN: ${business.tax_number}` : null,
          ]
            .filter(Boolean)
            .join("\n");

    QRCode.toDataURL(verificationText, { margin: 1, width: 128 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [sale, business, etimsInvoice]);

  if (!sale) return null;

  return (
    <Modal open={open} onClose={onClose} title="Sale complete" width="max-w-sm">
      <div id="receipt-print" className="font-mono text-sm text-ink-900">
        <div className="text-center mb-3">
          <p className="font-display font-bold text-base">{business?.name || user?.business?.name}</p>
          {business?.address && <p className="text-[11px] text-ink-700/60">{business.address}</p>}
          {(business?.phone || business?.email) && (
            <p className="text-[11px] text-ink-700/60">
              {[business?.phone, business?.email].filter(Boolean).join(" · ")}
            </p>
          )}
          {business?.tax_number && <p className="text-[11px] text-ink-700/60">KRA PIN: {business.tax_number}</p>}
          <p className="text-xs text-ink-700/60 mt-1">{sale.sale_number}</p>
          <p className="text-xs text-ink-700/60">{new Date(sale.created_at).toLocaleString()}</p>
        </div>
        <div className="border-t border-dashed border-ink-700/30 my-2" />
        {sale.items.map((item) => (
          <div key={item.id} className="flex justify-between py-0.5 text-xs">
            <span className="truncate pr-2">{item.product_name} x{item.quantity}</span>
            <span className="shrink-0">KES {item.line_total}</span>
          </div>
        ))}
        <div className="border-t border-dashed border-ink-700/30 my-2" />
        <div className="flex justify-between text-xs"><span>Subtotal</span><span>KES {sale.subtotal}</span></div>
        {Number(sale.discount_amount) > 0 && (
          <div className="flex justify-between text-xs"><span>Discount</span><span>-KES {sale.discount_amount}</span></div>
        )}
        <div className="flex justify-between text-xs">
          <span>VAT{business?.vat_percent ? ` (${business.vat_percent}%)` : ""}</span>
          <span>KES {sale.tax_amount}</span>
        </div>
        <div className="flex justify-between font-semibold pt-1 border-t border-dashed border-ink-700/30 mt-1">
          <span>TOTAL</span><span>KES {sale.total_amount}</span>
        </div>
        {sale.payments.map((p) => (
          <div key={p.id} className="flex justify-between text-xs text-ink-700/60 mt-1 capitalize">
            <span>{p.method.replace("_", " ")}</span><span>KES {p.amount}</span>
          </div>
        ))}
        {Number(sale.change_due) > 0 && (
          <div className="flex justify-between text-xs"><span>Change</span><span>KES {sale.change_due}</span></div>
        )}
        {Number(sale.balance_due) > 0 && (
          <div className="flex justify-between text-xs text-rose-500"><span>Balance due</span><span>KES {sale.balance_due}</span></div>
        )}

        {etimsInvoice && (
          <>
            <div className="border-t border-dashed border-ink-700/30 my-2" />
            <div className="text-[11px] text-ink-700/70">
              {etimsInvoice.status === "submitted" ? (
                <p>eTIMS Invoice No: {etimsInvoice.kra_invoice_number}</p>
              ) : (
                <p className="text-rose-500">eTIMS: {etimsInvoice.status.replace("_", " ")}</p>
              )}
            </div>
          </>
        )}

        {qrDataUrl && (
          <div className="flex flex-col items-center mt-4">
            <img src={qrDataUrl} alt="Receipt verification QR code" className="w-24 h-24" />
            <p className="text-[9px] text-ink-700/40 mt-1">Scan to verify this receipt</p>
          </div>
        )}

        <p className="text-center text-[10px] text-ink-700/50 mt-4">
          Served by {sale.cashier_name} · {business?.receipt_footer_text || "Thank you for shopping with us"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-5 print:hidden">
        <button onClick={onClose} className="py-2.5 rounded-lg border border-paper-200 text-sm font-medium text-ink-900 hover:bg-paper-100">
          New sale
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-till-500 text-ink-950 text-sm font-semibold hover:bg-till-400"
        >
          <LuPrinter className="w-4 h-4" /> Print
        </button>
      </div>
    </Modal>
  );
}
