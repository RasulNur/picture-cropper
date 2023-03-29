import React, { useState, useRef } from "react";

import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";
import "./App.css";
import "react-image-crop/dist/ReactCrop.css";

// This is to demonstate how to make and center a % aspect crop
// which is a bit trickier so we use some helper functions.
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 80,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export default function App() {
    const [imgSrc, setImgSrc] = useState("");
    const previewCanvasRef = useRef(null);
    const imgRef = useRef(null);
    const hiddenAnchorRef = useRef(null);
    const blobUrlRef = useRef("");
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    // const [radius, setRadius] = useState(5);

    function onSelectFile(e) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined); // Makes crop preview update between images.
            const reader = new FileReader();
            reader.addEventListener("load", () =>
                setImgSrc(reader.result?.toString() || "")
            );
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function onImageLoad(e) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height));
    }

    function onDownloadCropClick() {
        if (!previewCanvasRef.current) {
            throw new Error("Crop canvas does not exist");
        }

        previewCanvasRef.current.toBlob((blob) => {
            if (!blob) {
                throw new Error("Failed to create blob");
            }
            if (blobUrlRef.current) {
                URL.revokeObjectURL(blobUrlRef.current);
            }
            blobUrlRef.current = URL.createObjectURL(blob);
            hiddenAnchorRef.current.href = blobUrlRef.current;
            hiddenAnchorRef.current.click();
        });
    }

    useDebounceEffect(
        async () => {
            if (
                completedCrop?.width &&
                completedCrop?.height &&
                imgRef.current &&
                previewCanvasRef.current
            ) {
                // We use canvasPreview as it's much faster than imgPreview.
                canvasPreview(
                    imgRef.current,
                    previewCanvasRef.current,
                    completedCrop
                );
            }
        },
        100,
        [completedCrop]
    );

    // const handleChangeRadius = (e) => {
    //     setRadius(e.target.value);
    //     console.log(radius);
    // };

    return (
        <div className="App">
            <div className="Crop-Controls">
                <div className="crop__text-wrapper">
                    <div className="crop__text">Select or drop file</div>
                    <label className="crop__label" htmlFor="imageUpload">
                        Upload
                    </label>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    id="imageUpload"
                    onChange={onSelectFile}
                />
            </div>
            <div className="react-crop">
                {!!imgSrc && (
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}>
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imgSrc}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                )}
            </div>
            {/* <div className="radius-box">
                <div className="radius-group">
                    <input className="radius-checkbox" type="checkbox" />
                    <label htmlFor="">Round corners</label>
                </div>

                <div className="radius-group">
                    <label htmlFor="">Round radius (px)</label>
                    <input
                        className="radius-value-input"
                        defaultValue={5}
                        onChange={handleChangeRadius}
                        type="number"
                    />
                </div>
            </div> */}
            {!!completedCrop && (
                <>
                    <div>
                        <canvas
                            ref={previewCanvasRef}
                            style={{
                                border: "1px solid black",
                                objectFit: "contain",
                                display: "none",
                                width: completedCrop.width,
                                height: completedCrop.height,
                            }}
                        />
                    </div>
                    <div>
                        <button
                            className="download-btn"
                            onClick={onDownloadCropClick}>
                            Download Crop
                        </button>
                        <a
                            ref={hiddenAnchorRef}
                            download
                            style={{
                                position: "absolute",
                                top: "-200vh",
                                visibility: "hidden",
                            }}>
                            Hidden download
                        </a>
                    </div>
                </>
            )}
        </div>
    );
}
