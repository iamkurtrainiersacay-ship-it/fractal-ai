import { useEffect, useMemo, useState } from "react";
import {
  getGeneratedPosts,
  getContentAssets,
  updateGeneratedPost,
  scheduleAndSendPost,
  createContentAsset,
  uploadSocialImage,
  deleteGeneratedPosts
} from "../services/socialService";

import SocialStats from "../components/social/SocialStats";
import SocialFilters from "../components/social/SocialFilters";
import SocialPostList from "../components/social/SocialPostList";
import SocialEditor from "../components/social/SocialEditor";
import SocialPreview from "../components/social/SocialPreview";
import SocialActions from "../components/social/SocialActions";
import SocialAnalytics from "../components/social/SocialAnalytics";
import AssetCreator from "../components/social/AssetCreator";
import BulkActions from "../components/social/BulkActions";
import PostScheduler from "../components/social/PostScheduler";
import ZipExporter from "../components/social/ZipExporter";
import ImageUploader from "../components/social/ImageUploader";

export default function SocialDistribution() {
  const [posts, setPosts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [statusFilter, setStatusFilter] = useState("Draft");
  const [platformFilter, setPlatformFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editedBody, setEditedBody] = useState("");

  async function loadData() {
    const [postData, assetData] = await Promise.all([
      getGeneratedPosts(),
      getContentAssets()
    ]);

    setPosts(postData || []);
    setAssets(assetData || []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const assetMap = useMemo(() => {
    const map = {};
    assets.forEach((asset) => { map[asset.id] = asset; });
    return map;
  }, [assets]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const asset = assetMap[post.asset_id] || {};
      const platform = post.platform === "X(Twitter)" ? "X" : post.platform;

      const matchesStatus = statusFilter === "All" || post.status === statusFilter;
      const matchesPlatform = platformFilter === "All" || platform === platformFilter;

      const searchText = `
        ${post.id || ""}
        ${post.title || ""}
        ${post.post_body || ""}
        ${post.platform || ""}
        ${post.status || ""}
        ${asset.title || ""}
        ${asset.category || ""}
      `.toLowerCase();

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

    setPosts((prev) => prev.map((post) => post.id === updated.id ? updated : post));
    setSelectedPost(updated);
    alert("Post saved.");
  }

  async function rejectPost() {
    if (!selectedPost) return;

    const updated = await updateGeneratedPost(selectedPost.id, {
      status: "Rejected",
      rejected: true,
      rejected_at: new Date().toISOString()
    });

    setPosts((prev) => prev.map((post) => post.id === updated.id ? updated : post));
    setSelectedPost(updated);
    alert("Post rejected.");
  }

  async function schedulePost(scheduledAt) {
    if (!selectedPost) return;

    const asset = assetMap[selectedPost.asset_id] || {};
    const updated = await scheduleAndSendPost(selectedPost, asset, scheduledAt, editedBody);

    setPosts((prev) => prev.map((post) => post.id === updated.id ? updated : post));
    setSelectedPost(updated);
    alert("Post scheduled and sent to Make.");
    await loadData();
  }

  async function handleCreateAsset(asset, imageFile) {
    await createContentAsset(asset, imageFile);
    alert("Asset created and sent to Make for generation.");
    await loadData();
  }

  async function handleImageUpload(file) {
    if (!selectedPost || !file) {
      alert("Select a post first.");
      return;
    }

    const uploaded = await uploadSocialImage(file);

    const updated = await updateGeneratedPost(selectedPost.id, {
      image_url: uploaded.image_url,
      image_filename: uploaded.image_filename
    });

    setPosts((prev) => prev.map((post) => post.id === updated.id ? updated : post));
    setSelectedPost(updated);
  }

  async function bulkReject() {
    if (!selectedIds.length) return;

    for (const id of selectedIds) {
      await updateGeneratedPost(id, {
        status: "Rejected",
        rejected: true,
        rejected_at: new Date().toISOString()
      });
    }

    setSelectedIds([]);
    await loadData();
  }

  async function bulkDelete() {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} posts?`)) return;

    await deleteGeneratedPosts(selectedIds);
    setSelectedIds([]);
    setSelectedPost(null);
    await loadData();
  }

  return (
    <div className="social-v2">
      <div className="social-header">
        <h1>Social Distribution Center</h1>
        <p>AI Content Review + Publishing Pipeline</p>
      </div>

      <div className="panel">
        <SocialStats posts={posts} />
      </div>

      <div className="workspace-grid">
        <div className="panel queue-panel">
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
        </div>

        <div className="panel editor-panel">
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
        </div>

        <div className="panel preview-panel">
          <SocialPreview
            selectedPost={selectedPost}
            editedBody={editedBody}
            assetMap={assetMap}
          />
        </div>
      </div>

      <div className="panel">
        <h2>Operations Center</h2>

        <div className="operations-grid">
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
      </div>

      <div className="panel">
        <SocialAnalytics posts={posts} />
      </div>
    </div>
  );
}
