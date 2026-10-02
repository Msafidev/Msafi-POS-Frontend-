import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { LuBanknote, LuTrendingUp, LuReceiptText, LuTriangleAlert, LuFileCheck2 } from "react-icons/lu";
import { Link } from "react-router-dom";
import { dashboardService } from "../../services/dashboardService";
import StatCard from "../../components/dashboard/StatCard";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: dashboardService.getSummary,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink-900">
          Good to see you, {user?.first_name || user?.username}
        </h1>
        <p className="text-sm text-ink-700/60">Here's how {user?.business?.name || "your business"} is doing.</p>
      </div>

      {isLoading && <SkeletonGrid />}
      {isError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl p-4">
          Couldn't load your dashboard data. Try refreshing the page.
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Today's sales" value={`KES ${data.today_sales}`} icon={LuBanknote} accent="till" />
            <StatCard label="Monthly revenue" value={`KES ${data.revenue}`} icon={LuTrendingUp} accent="mint" />
            <StatCard label="Expenses" value={`KES ${data.expenses}`} icon={LuReceiptText} accent="rose" />
            <StatCard label="Low stock items" value={data.low_stock_products.length} icon={LuTriangleAlert} accent="rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SalesChartCard chartData={data.sales_graph} />
            <TopProductsCard products={data.top_selling_products} />
          </div>

          <EtimsCard summary={data.etims_summary} />

          <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-sm">
            <h2 className="font-display font-semibold text-ink-900 mb-3">Recent transactions</h2>
            {data.recent_transactions.length === 0 ? (
              <EmptyState message="No sales recorded yet. Once your POS module is live, transactions will show up here." />
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function SalesChartCard({ chartData }) {
  return (
    <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-sm">
      <h2 className="font-display font-semibold text-ink-900 mb-4">Sales — last 7 days</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-200)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="sales" stroke="var(--color-till-500)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Replaces the old "Revenue — last 7 days" chart, which plotted the exact
 * same daily totals as the Sales chart next to it (sales and revenue are
 * the same figure here — there's no separate revenue stream on a POS).
 * Top Selling Products actually tells you something the Sales chart
 * doesn't: which products are driving those numbers this month.
 */
function TopProductsCard({ products }) {
  const chartData = [...(products || [])].reverse();
  return (
    <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-sm">
      <h2 className="font-display font-semibold text-ink-900 mb-4">Top selling products — this month</h2>
      {chartData.length === 0 ? (
        <EmptyState message="No sales recorded yet this month." />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-200)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={110}
              tickFormatter={(name) => (name.length > 16 ? `${name.slice(0, 15)}…` : name)}
            />
            <Tooltip formatter={(value) => [`${value} units`, "Sold"]} />
            <Bar dataKey="units_sold" fill="var(--color-till-500)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function EtimsCard({ summary }) {
  if (!summary?.enabled) {
    return (
      <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-paper-100 flex items-center justify-center text-ink-700/40">
            <LuFileCheck2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="font-display font-semibold text-ink-900 text-sm">eTIMS not connected</p>
            <p className="text-xs text-ink-700/60">Sales aren't being registered with KRA eTIMS yet.</p>
          </div>
        </div>
        <Link to="/settings" className="text-xs font-medium text-till-600 hover:text-till-500 whitespace-nowrap">
          Set up eTIMS →
        </Link>
      </div>
    );
  }

  const hasFailures = summary.failed_today > 0;
  return (
    <div className="bg-white rounded-2xl border border-paper-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-ink-900">eTIMS (KRA) — today</h2>
        <span className="text-[11px] text-ink-700/50 uppercase tracking-wide">{summary.environment}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-display font-semibold text-mint-600">{summary.submitted_today}</p>
          <p className="text-xs text-ink-700/60">Submitted</p>
        </div>
        <div>
          <p className="text-lg font-display font-semibold text-ink-900">{summary.pending_today}</p>
          <p className="text-xs text-ink-700/60">Pending</p>
        </div>
        <div>
          <p className={`text-lg font-display font-semibold ${hasFailures ? "text-rose-500" : "text-ink-900"}`}>
            {summary.failed_today}
          </p>
          <p className="text-xs text-ink-700/60">Failed</p>
        </div>
      </div>
      {hasFailures && (
        <p className="text-xs text-rose-500 mt-3">
          Some invoices failed to reach KRA — check your eTIMS device credentials in Tax settings.
        </p>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return <p className="text-sm text-ink-700/50 text-center py-8">{message}</p>;
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-paper-200/60 animate-pulse" />
      ))}
    </div>
  );
}
