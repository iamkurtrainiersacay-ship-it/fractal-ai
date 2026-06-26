import { createClient } from "@supabase/supabase-js";

export const socialSupabase = createClient(
  "https://tgrjnydebfkfqgaqbtdz.supabase.co",
  "sb_publishable_A2hGUVe41TV5eyCnsjf9dw_MknIFuJR"
);

const MAKE_GENERATE_WEBHOOK = "https://hook.us2.make.com/x0urnzfbkhpa9pbij2pjc3c2cedbke3r";
const MAKE_SCHEDULE_WEBHOOK = "https://hook.us2.make.com/pcyf4ux2s2i5wroslltttp15399tfmra";
const STORAGE_BUCKET = "content-assets";

export async function getGeneratedPosts() {
  const { data, error } = await socialSupabase
    .from("generated_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) throw error;
  return data || [];
}

export async function getContentAssets() {
  const { data, error } = await socialSupabase
    .from("content_assets")
    .select("*")
    .limit(500);

  if (error) throw error;
  return data || [];
}

export async function updateGeneratedPost(id, updates) {
  const { data, error } = await socialSupabase
    .from("generated_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGeneratedPosts(ids = []) {
  if (!ids.length) return;

  const { error } = await socialSupabase
    .from("generated_posts")
    .delete()
    .in("id", ids);

  if (error) throw error;
}

export async function uploadSocialImage(file) {
  if (!file) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const path = `assets/${filename}`;

  const { error } = await socialSupabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  const { data } = socialSupabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return {
    image_url: data.publicUrl,
    image_filename: filename
  };
}

export async function createContentAsset(asset, imageFile) {
  let imagePayload = {};

  if (imageFile) {
    imagePayload = await uploadSocialImage(imageFile);
  }

  const { data, error } = await socialSupabase
    .from("content_assets")
    .insert({
      title: asset.title,
      url: asset.url,
      category: asset.category,
      content_type: asset.content_type,
      description: asset.description,
      cta: asset.cta,
      priority: asset.priority || "High",
      status: "Ready",
      ...imagePayload
    })
    .select()
    .single();

  if (error) throw error;

  await fetch(MAKE_GENERATE_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      asset_id: data.id,
      ...data
    })
  });

  return data;
}

export async function scheduleAndSendPost(post, asset, scheduledAt, finalBody) {
  const updated = await updateGeneratedPost(post.id, {
    post_body: finalBody,
    status: "Scheduled",
    approved: true,
    approved_at: new Date().toISOString(),
    approved_by: "Kurt",
    scheduled_by: "Kurt",
    scheduled_at: scheduledAt
  });

  await fetch(MAKE_SCHEDULE_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      post_id: post.id,
      asset_id: post.asset_id,
      title: post.title || asset?.title || "Untitled Post",
      platform: post.platform === "X(Twitter)" ? "X" : post.platform,
      post_body: finalBody,
      image_url: post.image_url || asset?.image_url || "",
      image_filename: post.image_filename || asset?.image_filename || "",
      scheduled_at: scheduledAt,
      status: "Scheduled",
      source: "fractal_social_distribution"
    })
  });

  return updated;
}
