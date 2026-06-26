export default function BulkActions({
  selectedCount,
  onBulkReject,
  onBulkDelete,
  onClearSelection
}) {
  return (
    <div className="operation-card">
      <h3>Bulk Actions</h3>
      <p>{selectedCount} selected</p>

      <button className="danger-btn" disabled={!selectedCount} onClick={onBulkReject}>
        Bulk Reject
      </button>

      <button className="danger-btn" disabled={!selectedCount} onClick={onBulkDelete}>
        Bulk Delete
      </button>

      <button className="secondary-btn" disabled={!selectedCount} onClick={onClearSelection}>
        Clear Selection
      </button>
    </div>
  );
}
