"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "../../_ui/icons";
import { uploadProductImage, removeProductImage, makePrimaryImage } from "./actions";

/**
 * ImageUploader — drag-and-drop (or click) photo upload for a product, plus a
 * thumbnail grid where the owner can set the cover photo or remove one. The
 * first photo is the cover shown on the storefront. Uploads go through the
 * `uploadProductImage` server action, which optimises the file automatically.
 */
type Img = { id: number; url: string; alt: string };

export function ImageUploader({ productId, images }: { productId: number; images: Img[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);

  // When the server sends back a new set of images, the upload finished.
  useEffect(() => { setUploading(false); }, [images.length]);

  const submit = () => { setUploading(true); formRef.current?.requestSubmit(); };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const input = formRef.current?.querySelector<HTMLInputElement>('input[type="file"]');
    if (input && e.dataTransfer.files.length) {
      input.files = e.dataTransfer.files;
      submit();
    }
  };

  return (
    <div>
      <form ref={formRef} action={uploadProductImage}>
        <input type="hidden" name="productId" value={productId} />
        <label
          className={`adm-uploader${drag ? " drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          <span className="up-ic"><Icon name={uploading ? "box" : "upload"} /></span>
          <b>{uploading ? "Uploading…" : "Drag a photo here, or click to choose"}</b>
          <span>JPG, PNG or WebP · up to 8 MB · we optimise it for you</span>
          <input type="file" name="file" accept="image/*" onChange={(e) => e.currentTarget.value && submit()} />
        </label>
      </form>

      {images.length > 0 && (
        <div className="adm-thumbs">
          {images.map((img, i) => (
            <div key={img.id} className="adm-thumb">
              <img src={img.url} alt={img.alt} />
              {i === 0 && <span className="primary-tag">Cover</span>}
              <form action={removeProductImage}>
                <input type="hidden" name="imageId" value={img.id} />
                <input type="hidden" name="productId" value={productId} />
                <button className="del" type="submit" aria-label="Remove photo" title="Remove photo"><Icon name="trash" /></button>
              </form>
              {i !== 0 && (
                <form action={makePrimaryImage} style={{ position: "absolute", left: 5, bottom: 5 }}>
                  <input type="hidden" name="imageId" value={img.id} />
                  <input type="hidden" name="productId" value={productId} />
                  <button type="submit" title="Make this the cover photo"
                    style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: ".3px", textTransform: "uppercase", padding: "3px 6px", borderRadius: 5, border: "none", background: "rgba(20,10,5,.62)", color: "#fff", cursor: "pointer" }}>
                    Set cover
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
