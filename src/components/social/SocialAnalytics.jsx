export default function SocialAnalytics({ posts = [] }) {
  const platforms = [...new Set(posts.map((p) => p.platform || "Unknown"))];

  return (
    <div>
      <h3>Analytics</h3>
      <p>Total Platforms: {platforms.length}</p>
      <p>Total Posts Loaded: {posts.length}</p>
    </div>
  );
}
