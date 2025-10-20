"use client";

import { useCampaignComposer } from "../CampaignComposerProvider";

export default function ImageDialog() {
    const {
        showImageInput,
        setShowImageInput,
        draggingImage,
        setDraggingImage,
        onDropImage,
        imageFileInputRef,
        onPickImageFile,
        onImageFileChange,
        imageUrlInput,
        setImageUrlInput,
        insertImageFromUrl,
        uploadingImage,
    } = useCampaignComposer();

    if (!showImageInput) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="w-[560px] pointer-events-auto bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="text-sm font-medium">Insert Image</div>
                    <button onClick={() => setShowImageInput(false)} className="text-white/60 hover:text-white">✕</button>
                </div>
                <div className="p-6">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDraggingImage(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setDraggingImage(false); }}
                        onDrop={onDropImage}
                        className={`border border-dashed rounded-md ${draggingImage ? 'border-white/40 bg-white/5' : 'border-white/15'} text-center p-10`}
                    >
                        <div className="text-3 mb-3 text-white/60">
                            <svg className="w-6 h-6 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2 2.5l3-4l4.5 6H6l2.5-4.5zM8 8a1.5 1.5 0 1 1 0 3a1.5 1.5 0 0 1 0-3z"/></svg>
                            Drag and drop or
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <input ref={imageFileInputRef} type="file" accept="image/*" className="hidden" onChange={onImageFileChange} />
                            <button className="px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/15 border border-white/15" onClick={onPickImageFile} disabled={uploadingImage}>
                                Upload an image
                            </button>
                            <button className="px-3 py-1.5 text-sm rounded bg-white/10 hover:bg-white/15 border border-white/15" onClick={() => {
                                const url = window.prompt('Paste image URL');
                                if (url) { setImageUrlInput(url); insertImageFromUrl(); }
                            }}>
                                Use from library
                            </button>
                        </div>
                    </div>
                    {imageUrlInput ? (
                        <div className="mt-4 flex gap-2">
                            <input value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="https://…" className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm" />
                            <button className="px-3 py-2 text-sm rounded bg-[#FA4616] hover:bg-[#E23F14]" onClick={insertImageFromUrl}>Insert</button>
                        </div>
                    ) : null}
                    {uploadingImage ? <div className="mt-4 text-white/60 text-sm">Uploading…</div> : null}
                </div>
            </div>
        </div>
    );
}


