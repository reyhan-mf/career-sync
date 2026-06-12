"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import TopBar from "@/components/layout/TopBar";
import { getSession } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import {
  describeNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  relativeTime,
  type NotificationRow,
} from "@/lib/supabase/notification-queries";

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "signed-out" | "error">("loading");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const session = await getSession();
      if (!alive) return;
      if (!session) {
        setStatus("signed-out");
        return;
      }
      const uid = session.user.id;
      setUserId(uid);
      try {
        const rows = await getMyNotifications();
        if (!alive) return;
        setNotifs(rows);
        setStatus("ready");
      } catch {
        if (alive) setStatus("error");
      }

      channel = supabase
        .channel(`notifications:user:${uid}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          (payload) => {
            const row = payload.new as NotificationRow;
            setNotifs((prev) => (prev.some((n) => n.id === row.id) ? prev : [row, ...prev]));
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${uid}` },
          (payload) => {
            const row = payload.new as NotificationRow;
            setNotifs((prev) => prev.map((n) => (n.id === row.id ? row : n)));
          },
        )
        .subscribe();
    })();

    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const displayed = tab === "all" ? notifs : notifs.filter((n) => !n.read_at);
  const unreadCount = notifs.filter((n) => !n.read_at).length;

  async function markAllRead() {
    if (!userId || unreadCount === 0) return;
    const now = new Date().toISOString();
    setNotifs((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    await markAllNotificationsRead(userId).catch(() => {});
  }

  async function handleClick(n: NotificationRow) {
    const view = describeNotification(n);
    if (!n.read_at) {
      const now = new Date().toISOString();
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read_at: now } : x)));
      await markNotificationRead(n.id).catch(() => {});
    }
    if (view.href) router.push(view.href);
  }

  return (
    <>
      <TopBar />
      <div className="max-w-3xl mx-auto p-6 lg:p-10">
        <div className="mb-8">
          <h1 className="font-headline text-3xl font-bold text-on-background mb-2">Notifikasi</h1>
          <p className="font-body text-on-surface-variant">
            Ikuti perkembangan lamaran, undangan, dan aktivitas akun Anda.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-ambient ghost-border">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-surface-variant">
            <div className="flex gap-4">
              <button
                onClick={() => setTab("all")}
                className={`font-label text-sm font-semibold pb-2 px-1 transition-colors ${tab === "all" ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-primary"}`}
              >
                Semua
              </button>
              <button
                onClick={() => setTab("unread")}
                className={`font-label text-sm font-medium pb-2 px-1 transition-colors ${tab === "unread" ? "text-primary border-b-2 border-primary font-semibold" : "text-on-surface-variant hover:text-primary"}`}
              >
                Belum Dibaca ({unreadCount})
              </button>
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="font-label text-xs text-primary hover:underline disabled:text-outline disabled:no-underline"
            >
              Tandai semua dibaca
            </button>
          </div>

          {status === "loading" && (
            <div className="text-center py-12 font-body text-sm text-on-surface-variant">Memuat notifikasi…</div>
          )}

          {status === "signed-out" && (
            <div className="text-center py-12">
              <Icon name="lock" className="text-outline mx-auto mb-3" size={40} />
              <p className="font-body text-on-surface-variant">Masuk untuk melihat notifikasi Anda.</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-12">
              <Icon name="error_outline" className="text-error mx-auto mb-3" size={40} />
              <p className="font-body text-on-surface-variant">Gagal memuat notifikasi. Coba muat ulang halaman.</p>
            </div>
          )}

          {status === "ready" && (
            <>
              <div className="space-y-4">
                {displayed.map((n) => {
                  const view = describeNotification(n);
                  const unread = !n.read_at;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`relative group p-4 rounded-xl flex gap-4 cursor-pointer transition-colors ${unread ? "bg-primary-fixed/30 hover:bg-primary-fixed/50" : "hover:bg-surface-container-low"}`}
                    >
                      {unread && <span className="absolute top-6 left-2 w-2 h-2 bg-primary rounded-full" />}
                      <div className={`flex-shrink-0 w-12 h-12 bg-surface-container rounded-full flex items-center justify-center ${view.color} ${unread ? "ml-2" : ""}`}>
                        <Icon name={view.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-3">
                          <h3 className={`font-headline text-lg ${unread ? "font-bold text-on-background" : "font-semibold text-on-surface"}`}>
                            {view.title}
                          </h3>
                          <span className="font-label text-xs text-on-surface-variant whitespace-nowrap">
                            {relativeTime(n.created_at)}
                          </span>
                        </div>
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed">{view.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {displayed.length === 0 && (
                <div className="text-center py-12">
                  <Icon name="notifications_none" className="text-outline mx-auto mb-3" size={40} />
                  <p className="font-body text-on-surface-variant">
                    {tab === "unread" ? "Tidak ada notifikasi yang belum dibaca." : "Belum ada notifikasi."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
