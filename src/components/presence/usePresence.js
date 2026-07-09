/**
 * usePresence — real-time page presence.
 * Upserts a heartbeat record for the current user every 30s and returns
 * other users active on the same page within the last 70s. Live-updates
 * via realtime entity subscription.
 */

import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

const STALE_MS = 70000;

export default function usePresence(user, page) {
  const [others, setOthers] = useState([]);

  useEffect(() => {
    if (!user?.email || !page) return;
    let alive = true;

    const beat = async () => {
      const mine = await base44.entities.PresenceHeartbeat.filter({ user_email: user.email });
      if (mine[0]) {
        await base44.entities.PresenceHeartbeat.update(mine[0].id, { page, user_name: user.full_name || "" });
      } else {
        await base44.entities.PresenceHeartbeat.create({ user_email: user.email, user_name: user.full_name || "", page });
      }
    };

    const refresh = async () => {
      const all = await base44.entities.PresenceHeartbeat.filter({ page });
      if (!alive) return;
      const cutoff = Date.now() - STALE_MS;
      setOthers(all.filter((p) =>
        p.user_email !== user.email &&
        new Date(p.updated_date).getTime() > cutoff
      ));
    };

    beat().then(refresh).catch(() => {});
    const t = setInterval(() => { beat().then(refresh).catch(() => {}); }, 30000);
    const unsubscribe = base44.entities.PresenceHeartbeat.subscribe(() => {
      refresh().catch(() => {});
    });

    return () => { alive = false; clearInterval(t); unsubscribe(); };
  }, [user?.email, page]);

  return others;
}