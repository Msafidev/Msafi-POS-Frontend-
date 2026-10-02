import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LuBell, LuCheck } from "react-icons/lu";
import { notificationsService } from "../../services/notificationsService";

const TYPE_DOT = {
  low_stock: "bg-till-500",
  out_of_stock: "bg-rose-500",
  expiring_product: "bg-rose-500",
  new_order: "bg-mint-500",
  system_alert: "bg-ink-700",
};

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: notificationsService.unreadCount,
    refetchInterval: 30000,
  });

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsService.list(),
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsService.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });

  const notifications = data?.results ?? [];
  const unreadCount = countData?.count ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-paper-100 transition-colors"
        aria-label="Notifications"
      >
        <LuBell className="w-5 h-5 text-ink-800" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-lg border border-paper-200 overflow-hidden z-20">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-paper-200">
            <p className="text-sm font-medium text-ink-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                className="text-xs font-medium text-till-600 hover:text-till-500"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-paper-100">
            {notifications.length === 0 ? (
              <p className="text-sm text-ink-700/50 text-center py-8">You're all caught up.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
                  className={`w-full text-left px-4 py-3 flex gap-2.5 hover:bg-paper-50 ${!n.is_read ? "bg-paper-50/60" : ""}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${TYPE_DOT[n.type] || "bg-ink-700"}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-ink-900 truncate">{n.title}</p>
                    {n.message && <p className="text-xs text-ink-700/50 mt-0.5">{n.message}</p>}
                  </div>
                  {!n.is_read && <LuCheck className="w-3.5 h-3.5 text-ink-700/30 shrink-0 ml-auto mt-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
