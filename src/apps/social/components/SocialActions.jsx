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
    if (!scheduleTime) return alert("Pick a schedule time first.");

    await schedulePost(new Date(scheduleTime).toISOString());
    setScheduleTime("");
  }

  return (
    <div className="sd-actions-card">
      <label>Schedule Time</label>

      <input
        type="datetime-local"
        value={scheduleTime}
        onChange={(e) => setScheduleTime(e.target.value)}
      />

      <div className="sd-actions">
        <button className="primary-btn" disabled={!selectedPost} onClick={saveEdit}>
          Save
        </button>

        <button className="secondary-btn" disabled={!selectedPost} onClick={handleSchedule}>
          Schedule
        </button>

        <button className="danger-btn" disabled={!selectedPost} onClick={rejectPost}>
          Reject
        </button>
      </div>
    </div>
  );
}
