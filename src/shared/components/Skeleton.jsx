// Reusable skeleton shimmer components for loading states

export function Skeleton({ width = "100%", height = "16px", radius = "8px", style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function SkeletonCard({ lines = 3, style = {} }) {
  return (
    <div className="skeleton-card" style={style}>
      <Skeleton height="14px" width="40%" style={{ marginBottom: "10px" }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="12px"
          width={i === lines - 1 ? "60%" : "100%"}
          style={{ marginBottom: "8px" }}
        />
      ))}
    </div>
  );
}

export function SkeletonRow({ style = {} }) {
  return (
    <div className="skeleton-row" style={style}>
      <Skeleton width="36px" height="36px" radius="10px" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton height="13px" width="55%" style={{ marginBottom: "6px" }} />
        <Skeleton height="11px" width="35%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton-table-row">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} height="13px" width={j === 0 ? "40%" : "70%"} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ rows = 6 }) {
  return (
    <div className="skeleton-page">
      <div className="skeleton-page-header">
        <div>
          <Skeleton height="13px" width="100px" style={{ marginBottom: "10px" }} />
          <Skeleton height="28px" width="220px" style={{ marginBottom: "8px" }} />
          <Skeleton height="13px" width="180px" />
        </div>
        <Skeleton height="40px" width="120px" radius="var(--radius-sm)" />
      </div>
      <div className="skeleton-page-body">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
