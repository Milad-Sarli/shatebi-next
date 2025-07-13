'use client';

import { useEffect, useState } from "react";
import { fetchNotifications } from "@/lib/services/notification.service";
import { useAuth } from "@/lib/context/auth.context";

// Notification type based on API response
export interface Notification {
  id: string | number;
  user_id: string;
  type: string;
  data: {
    title: string;
    body: string;
    sender?: string;
    student?: string;
    dars?: string;
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export default function NotificationDisplay() {
  const { accessToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    fetchNotifications(accessToken)
      .then(setNotifications)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) return <div className="p-4 text-center">در حال بارگذاری اعلان‌ها...</div>;
  if (error) return <div className="p-4 text-center text-red-500">خطا: {error}</div>;
  if (!notifications.length) return <div className="p-4 text-center text-zinc-500">اعلانی وجود ندارد.</div>;

  return (
    <div dir="rtl" className="flex flex-col items-end">
      <ul
        className="max-h-80 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800 flex flex-col-reverse w-full"
        dir="rtl"
        style={{ direction: 'rtl', textAlign: 'right' }}
      >
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`p-3 flex flex-row-reverse items-start gap-2 ${n.read_at ? 'bg-zinc-50 dark:bg-zinc-900' : 'bg-blue-50 dark:bg-blue-950'}`}
            style={{ textAlign: 'right' }}
          >
            <div className="flex-1">
              <div className="font-semibold text-blue-700 dark:text-blue-300">{n.data?.title}</div>
              <div className="text-sm text-zinc-800 dark:text-zinc-200">{n.data?.body}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{new Date(n.created_at).toLocaleString('fa-IR')}</div>
            </div>
          </li>
        ))}
      </ul>
      <a
        href="/dashboard/notifications"
        className="block w-full mt-2 text-center rounded bg-blue-600 text-white py-2 hover:bg-blue-700 transition"
        style={{ direction: 'rtl' }}
      >
        مشاهده همه اعلان‌ها
      </a>
    </div>
  );
} 