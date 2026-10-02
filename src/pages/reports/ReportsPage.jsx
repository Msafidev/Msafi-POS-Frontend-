import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuDownload } from "react-icons/lu";
import { reportsService } from "../../services/reportsService";
import DataTable from "../../components/ui/DataTable";
import EmptyState from "../../components/ui/EmptyState";

const TABS = [
  { key: "sales", label: "Sales" },
  { key: "profitLoss", label: "Profit & Loss" },
  { key: "expenses", label: "Expenses" },
  { key: "inventory", label: "Inventory" },
  { key: "cashFlow", label: "Cash Flow" },
  { key: "topCustomers", label: "Top Customers" },
  { key: "topProducts", label: "Top Products" },
  { key: "employeePerformance", label: "Employee Performance" },
  { key: "tax", label: "Tax" },
];

const CSV_PATH = {
  sales: "sales", profitLoss: "profit-loss", expenses: "expenses", inventory: "inventory",
  cashFlow: "cash-flow", topCustomers: "top-customers", topProducts: "top-products",
  employeePerformance: "employee-performance", tax: "tax",
};

export default function ReportsPage() {
  const [tab, setTab] = useState("sales");
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + "01";
  const [start, setStart] = useState(monthStart);
  const [end, setEnd] = useState(today);
  const [period, setPeriod] = useState("daily");

  const params = { start, end, ...(tab === "sales" ? { period } : {}) };

  const { data, isLoading } = useQuery({
    queryKey: ["report", tab, params],
    queryFn: () => reportsService[tab](params),
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink-900">Reports</h1>
          <p className="text-sm text-ink-700/60">Sales, profitability, inventory, and staff performance — export any of these to CSV.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="input !w-36" />
          <span className="text-ink-700/40 text-sm">to</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="input !w-36" />
          <button
            onClick={() => reportsService.downloadCsv(CSV_PATH[tab], params, `${CSV_PATH[tab]}.csv`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-paper-200 text-sm font-medium text-ink-900 hover:bg-paper-100 whitespace-nowrap"
          >
            <LuDownload className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-paper-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.key ? "border-till-500 text-ink-900" : "border-transparent text-ink-700/50 hover:text-ink-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "sales" && (
        <div className="flex gap-1 mb-4 bg-paper-100 p-1 rounded-lg w-fit">
          {["daily", "weekly", "monthly", "yearly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize ${period === p ? "bg-white shadow-sm text-ink-900" : "text-ink-700/60"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <ReportBody tab={tab} data={data} isLoading={isLoading} />
    </div>
  );
}

function ReportBody({ tab, data, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-lg bg-paper-200/60 animate-pulse" />)}
      </div>
    );
  }
  if (!data) return null;

  switch (tab) {
    case "sales":
      return (
        <DataTable
          rows={data.results}
          rowKey={(r) => r.period}
          emptyState={<EmptyState title="No sales in this range" message="Try widening the date range." />}
          columns={[
            { key: "period", header: "Period", accessor: (r) => r.period },
            { key: "count", header: "Sales", accessor: (r) => r.sales_count },
            { key: "gross", header: "Gross", accessor: (r) => `KES ${r.gross_sales.toFixed(2)}` },
            { key: "discount", header: "Discounts", accessor: (r) => `KES ${r.discount_total.toFixed(2)}` },
            { key: "tax", header: "Tax", accessor: (r) => `KES ${r.tax_total.toFixed(2)}` },
            { key: "total", header: "Total", accessor: (r) => `KES ${r.total_amount.toFixed(2)}` },
          ]}
        />
      );

    case "profitLoss":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-paper-200 p-5 space-y-2">
            {[
              ["Revenue", data.revenue], ["Cost of goods sold", -data.cost_of_goods_sold],
              ["Gross profit", data.gross_profit], ["Total expenses", -data.total_expenses],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-ink-700/60">{label}</span>
                <span className={value < 0 ? "text-rose-500" : "text-ink-900"}>KES {value.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between font-display font-semibold text-base pt-2 border-t border-paper-200">
              <span>Net profit</span>
              <span className={data.net_profit < 0 ? "text-rose-500" : "text-mint-500"}>KES {data.net_profit.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-paper-200 p-5">
            <p className="text-sm font-medium text-ink-900 mb-3">Expense breakdown</p>
            {data.expense_breakdown.length === 0 ? (
              <p className="text-sm text-ink-700/50">No expenses in this range.</p>
            ) : (
              <div className="space-y-2">
                {data.expense_breakdown.map((e) => (
                  <div key={e.category} className="flex justify-between text-sm">
                    <span className="text-ink-700/70">{e.category}</span>
                    <span className="text-ink-900">KES {e.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );

    case "expenses":
      return (
        <DataTable
          rows={data.results}
          rowKey={(r) => `${r.title}-${r.expense_date}-${r.amount}-${r.recorded_by}`}
          emptyState={<EmptyState title="No expenses in this range" message="Try widening the date range." />}
          columns={[
            { key: "title", header: "Expense", accessor: (r) => r.title },
            { key: "category", header: "Category", accessor: (r) => r.category },
            { key: "amount", header: "Amount", accessor: (r) => `KES ${r.amount.toFixed(2)}` },
            { key: "date", header: "Date", accessor: (r) => r.expense_date },
            { key: "by", header: "Recorded by", accessor: (r) => r.recorded_by },
          ]}
        />
      );

    case "inventory":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Total products", data.total_products], ["Stock value", `KES ${data.total_stock_value.toFixed(2)}`],
              ["Low stock", data.low_stock_count], ["Out of stock", data.out_of_stock_count],
            ].map(([label, value]) => (
              <div key={label} className="bg-white rounded-2xl border border-paper-200 p-4">
                <p className="text-xs text-ink-700/60 uppercase tracking-wide mb-1">{label}</p>
                <p className="font-display text-xl font-semibold text-ink-900">{value}</p>
              </div>
            ))}
          </div>
          <DataTable
            rows={data.by_category}
            rowKey={(r) => r.category}
            emptyState={<EmptyState title="No products yet" message="Add products under Inventory to see a breakdown here." />}
            columns={[
              { key: "category", header: "Category", accessor: (r) => r.category },
              { key: "count", header: "Products", accessor: (r) => r.product_count },
              { key: "value", header: "Stock value", accessor: (r) => `KES ${r.stock_value.toFixed(2)}` },
            ]}
          />
        </div>
      );

    case "cashFlow":
      return (
        <DataTable
          rows={data.results}
          rowKey={(r) => r.date}
          emptyState={<EmptyState title="No cash movement in this range" message="Try widening the date range." />}
          columns={[
            { key: "date", header: "Date", accessor: (r) => r.date },
            { key: "in", header: "Inflow", accessor: (r) => `KES ${r.inflow.toFixed(2)}` },
            { key: "out", header: "Outflow", accessor: (r) => `KES ${r.outflow.toFixed(2)}` },
            { key: "net", header: "Net", accessor: (r) => (
              <span className={r.net < 0 ? "text-rose-500" : "text-mint-500"}>KES {r.net.toFixed(2)}</span>
            )},
          ]}
        />
      );

    case "topCustomers":
      return (
        <DataTable
          rows={data.results}
          rowKey={(r) => r.customer}
          emptyState={<EmptyState title="No customer sales yet" message="Attach customers to sales at checkout to see this ranking." />}
          columns={[
            { key: "customer", header: "Customer", accessor: (r) => r.customer },
            { key: "orders", header: "Orders", accessor: (r) => r.orders },
            { key: "spent", header: "Total spent", accessor: (r) => `KES ${r.total_spent.toFixed(2)}` },
          ]}
        />
      );

    case "topProducts":
      return (
        <DataTable
          rows={data.results}
          rowKey={(r) => r.product}
          emptyState={<EmptyState title="No sales yet" message="Ring up sales at the POS to see your best sellers here." />}
          columns={[
            { key: "product", header: "Product", accessor: (r) => r.product },
            { key: "units", header: "Units sold", accessor: (r) => r.units_sold },
            { key: "revenue", header: "Revenue", accessor: (r) => `KES ${r.revenue.toFixed(2)}` },
          ]}
        />
      );

    case "employeePerformance":
      return (
        <DataTable
          rows={data.results}
          rowKey={(r) => r.cashier}
          emptyState={<EmptyState title="No sales yet" message="Sales rung up by staff will be ranked here." />}
          columns={[
            { key: "cashier", header: "Staff", accessor: (r) => r.cashier },
            { key: "count", header: "Sales", accessor: (r) => r.sales_count },
            { key: "total", header: "Total sold", accessor: (r) => `KES ${r.total_amount.toFixed(2)}` },
          ]}
        />
      );

    case "tax":
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-paper-200 p-5 w-fit">
            <p className="text-xs text-ink-700/60 uppercase tracking-wide mb-1">Total tax collected</p>
            <p className="font-display text-2xl font-semibold text-ink-900">KES {data.total_tax_collected.toFixed(2)}</p>
          </div>
          <DataTable
            rows={data.results}
            rowKey={(r) => r.date}
            emptyState={<EmptyState title="No taxable sales in this range" message="Try widening the date range." />}
            columns={[
              { key: "date", header: "Date", accessor: (r) => r.date },
              { key: "taxable", header: "Taxable sales", accessor: (r) => `KES ${r.taxable_sales.toFixed(2)}` },
              { key: "tax", header: "Tax collected", accessor: (r) => `KES ${r.tax_collected.toFixed(2)}` },
            ]}
          />
        </div>
      );

    default:
      return null;
  }
}
