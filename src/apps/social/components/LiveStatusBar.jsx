export default function LiveStatusBar({ lastSynced, loading }) {
  return (
    <div className="live-status-bar">
      <div className="status-pill live">
        <span></span>
        {loading ? "Syncing..." : "Live"}
      </div>

      <div className="status-pill">
        <span></span>
        Supabase Connected
      </div>

      <div className="status-pill">
        <span></span>
        Make Ready
      </div>

      <div className="status-pill">
        <span></span>
        Storage Healthy
      </div>

      <div className="status-time">
        Last Sync: {lastSynced || "Not synced yet"}
      </div>
    </div>
  );
}
