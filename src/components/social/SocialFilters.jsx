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
    <div className="social-filters">
      <h3>Filters</h3>

      <input
        placeholder="Search posts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

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

      <button className="primary-btn" onClick={refresh}>Refresh</button>
    </div>
  );
}
