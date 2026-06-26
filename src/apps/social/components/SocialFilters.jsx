export default function SocialFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  platformFilter,
  setPlatformFilter,
  refresh
}) {
  return (
    <div className="sd-filter-card">
      <div className="sd-section-head">
        <h3>Filters</h3>
        <button className="sd-mini-btn" onClick={refresh}>Refresh</button>
      </div>

      <input
        placeholder="Search content, platform, status, title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="sd-filter-grid">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>Draft</option>
          <option>Scheduled</option>
          <option>Uploaded</option>
          <option>Rejected</option>
          <option>All</option>
        </select>

        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
          <option>All</option>
          <option>LinkedIn</option>
          <option>Facebook</option>
          <option>Instagram</option>
          <option>X</option>
        </select>
      </div>
    </div>
  );
}
