import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  getGeneratedPosts,
  getContentAssets,
  updateGeneratedPost,
  scheduleAndSendPost,
  createContentAsset,
  uploadSocialImage,
  deleteGeneratedPosts
} from "../services/socialService";

import SocialStats from "../components/SocialStats";
import SocialFilters from "../components/SocialFilters";
import SocialPostList from "../components/SocialPostList";
import SocialEditor from "../components/SocialEditor";
import SocialPreview from "../components/SocialPreview";
import SocialActions from "../components/SocialActions";
import SocialAnalytics from "../components/SocialAnalytics";
import AssetCreator from "../components/AssetCreator";
import BulkActions from "../components/BulkActions";
import PostScheduler from "../components/PostScheduler";
import ZipExporter from "../components/ZipExporter";
import ImageUploader from "../components/ImageUploader";
import LiveStatusBar from "../components/LiveStatusBar";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ActivityFeed from "../components/ActivityFeed";

export default function SocialDistribution() {
  const [posts, setPosts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Draft");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState("");
  const [activity, setActivity] = useState([]);

  function addActivity(message) {
    setActivity((prev) => [
      {
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        message
      },
      ...prev
    ].slice(0, 8));
  }

  async function loadData(silent = false) {
    try {
      setLoading(true);

      const [postData, assetData] = await Promise.all([
        getGeneratedPosts(),
        getContentAssets()
      ]);

      setPosts(postData || []);
      setAssets(assetData || []);
      setLastSynced(new Date().toLocaleTimeString());
      if (!silent) addActivity("Queue synced from Supabase.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync Social Distribution.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleShortcut(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveEdit();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        document.querySelector(".sd-filter-card input")?.focus();
      }

      if (e.key === "Delete" && selectedPost) {
        e.preventDefault();
        rejectPost();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  });

  const assetMap = useMemo(() => {
    const map = {};
    assets.forEach((asset) => {
      map[asset.id] = asset;
    });
    return map;
  }, [assets]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const asset = assetMap[post.asset_id] || {};
      const platform = post.platform === "X(Twitter)" ? "X" : post.platform;

      const matchesStatus = statusFilter === "All" || post.status === statusFilter;
      const matchesPlatform = platformFilter === "All" || platform === platformFilter;

      const searchText = [
        post.id,
        post.title,
        post.post_body,
        post.platform,
        post.status,
        asset.title,
        asset.category,
        asset.url,
        asset.content_type
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && matchesPlatform && searchText.includes(search.toLowerCase());
    });
  }, [posts, assetMap, statusFilter, platformFilter, search]);

  function selectPost(post) {
    setSelectedPost(post);
    setEditedBody(post.post_body || "");
  }

  function toggleSelected(id) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  }

  async function saveEdit() {
    if (!selectedPost) return;

    const updated = await updateGeneratedPost(selectedPost.id, {
      post_body: editedBody
    });

    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
    setSelectedPost(updated);
    toast.success("Post saved.");
    addActivity("Post edited and saved.");
  }

  async function rejectPost() {
    if (!selectedPost) return;

    const updated = await updateGeneratedPost(selectedPost.id, {
      status: "Rejected",
      rejected: true,
      rejected_at: new Date().toISOString()
    });

    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
    setSelectedPost(updated);
    toast.success("Post rejected.");
    addActivity("Post rejected.");
  }

  async function schedulePost(scheduledAt) {
    if (!selectedPost) return;

    const asset = assetMap[selectedPost.asset_id] || {};
    const updated = await scheduleAndSendPost(selectedPost, asset, scheduledAt, editedBody);

    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
    setSelectedPost(updated);
    toast.success("Post scheduled and sent to Make.");
    addActivity("Post scheduled and sent to Make.");
    await loadData(true);
  }

  async function handleCreateAsset(asset, imageFile) {
    await createContentAsset(asset, imageFile);
    toast.success("Asset created and sent to Make.");
    addActivity("Content asset created and generation started.");
    await loadData(true);
  }

  async function handleImageUpload(file) {
    if (!selectedPost || !file) {
      toast.error("Select a post first.");
      return;
    }

    const uploaded = await uploadSocialImage(file);

    const updated = await updateGeneratedPost(selectedPost.id, {
      image_url: uploaded.image_url,
      image_filename: uploaded.image_filename
    });

    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)));
    setSelectedPost(updated);
    toast.success("Image uploaded.");
    addActivity("Image attached to selected post.");
  }

  async function bulkReject() {
    for (const id of selectedIds) {
      await updateGeneratedPost(id, {
        status: "Rejected",
        rejected: true,
        rejected_at: new Date().toISOString()
      });
    }

    toast.success(`${selectedIds.length} posts rejected.`);
    addActivity(`${selectedIds.length} posts bulk rejected.`);
    setSelectedIds([]);
    await loadData(true);
  }

  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} posts?`)) return;

    await deleteGeneratedPosts(selectedIds);
    toast.success(`${selectedIds.length} posts deleted.`);
    addActivity(`${selectedIds.length} posts deleted.`);
    setSelectedIds([]);
    setSelectedPost(null);
    await loadData(true);
  }

  return (
    <div className="sd-page">
      <section className="sd-hero">
        <div>
          <p className="sd-eyebrow">Sovereign Solutions</p>
          <h1>Social Distribution Center</h1>
          <p>Review, edit, schedule, and distribute AI-generated content.</p>
        </div>

        <button className="primary-btn" onClick={() => loadData()}>
          Refresh Queue
        </button>
      </section>

      <LiveStatusBar lastSynced={lastSynced} loading={loading} />

      {loading && posts.length === 0 ? (
        <LoadingSkeleton />
      ) : (
        <>
          <SocialStats posts={posts} />

          <section className="sd-workspace">
            <aside className="sd-panel sd-left">
              <SocialFilters
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                platformFilter={platformFilter}
                setPlatformFilter={setPlatformFilter}
                refresh={loadData}
              />

              <SocialPostList
                posts={filteredPosts}
                selectedPost={selectedPost}
                selectPost={selectPost}
                assetMap={assetMap}
                selectedIds={selectedIds}
                toggleSelected={toggleSelected}
              />
            </aside>

            <main className="sd-panel sd-middle">
              <SocialEditor
                selectedPost={selectedPost}
                editedBody={editedBody}
                setEditedBody={setEditedBody}
                assetMap={assetMap}
              />

              <SocialActions
                selectedPost={selectedPost}
                saveEdit={saveEdit}
                rejectPost={rejectPost}
                schedulePost={schedulePost}
              />
            </main>

            <aside className="sd-panel sd-right">
              <SocialPreview
                selectedPost={selectedPost}
                editedBody={editedBody}
                assetMap={assetMap}
              />
            </aside>
          </section>

          <section className="sd-panel">
            <div className="sd-section-head">
              <div>
                <h2>Operations Center</h2>
                <p>Create assets, upload images, export posts, and manage bulk actions.</p>
              </div>
            </div>

            <div className="sd-operations">
              <AssetCreator onCreate={handleCreateAsset} />
              <ImageUploader onUpload={handleImageUpload} />
              <PostScheduler />
              <ZipExporter posts={filteredPosts} assetMap={assetMap} selectedIds={selectedIds} />
              <BulkActions
                selectedCount={selectedIds.length}
                onBulkReject={bulkReject}
                onBulkDelete={bulkDelete}
                onClearSelection={() => setSelectedIds([])}
              />
            </div>
          </section>

          <section className="sd-panel">
            <SocialAnalytics posts={posts} />
          </section>

          <section className="sd-panel">
            <ActivityFeed items={activity} />
          </section>
        </>
      )}
    </div>
  );
}
