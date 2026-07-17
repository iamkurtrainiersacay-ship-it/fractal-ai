export default function ImageUploader({ onUpload }) {
  return (
    <div className="operation-card">
      <h3>Image Upload</h3>
      <p>Attach an image to the selected post.</p>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e.target.files?.[0])}
      />
    </div>
  );
}
