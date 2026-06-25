import { useState } from "react";

export default function SocialActions({
  selectedPost,
  saveEdit,
  rejectPost,
  schedulePost
}) {
  const [scheduleTime, setScheduleTime] = useState("");

  async function handleSchedule() {
    if (!selectedPost) return;
    if (!scheduleTime) {
      alert("Pick a schedule time first.");
      return;
    }

    await schedulePost(new Date(scheduleTime).toISOString());
    setScheduleTime("");
  }

  return (
    <div className="social-actions-panel">
      <label>Schedule Time</label>

      <input
        type="datetime-local"
        value={scheduleTime}
        onChange={(e) => setScheduleTime(e.target.value)}
      />

      <div className="social-actions">
        <button className="primary-btn" disabled={!selectedPost} onClick={saveEdit}>
          Save Edit
        </button>

        <button className="secondary-btn" disabled={!selectedPost} onClick={handleSchedule}>
          Schedule + Send
        </button>

        <button className="secondary-btn" disabled={!selectedPost}>
          Export ZIP
        </button>

        <button className="danger-btn" disabled={!selectedPost} onClick={rejectPost}>
          Reject
        </button>
      </div>
    </div>
  );
}
