import React, { useState, useRef } from "react";

import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";
import "./App.css";
import "react-image-crop/dist/ReactCrop.css";
import * as htmlToImage from "html-to-image";

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
    const divToDownload = useRef(null);

    const [imgSrc, setImgSrc] = useState("");
    const previewCanvasRef = useRef(null);
    const imgRef = useRef(null);
    const hiddenAnchorRef = useRef(null);
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [radius, setRadius] = useState(0);
    const [checkbox, setCheckbox] = useState(false);
    const [aspect, setAspect] = useState(16 / 9);

    const handleCheckbox = (e) => {
        setCheckbox(e.target.checked);
        if (e.target.checked) {
            radius ? setRadius(radius) : setRadius(5);
        }
    };

    function onSelectFile(e) {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener("load", () =>
                setImgSrc(reader.result?.toString() || "")
            );
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    function onImageLoad(e) {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
        }
    }

    useDebounceEffect(
        async () => {
            if (
                completedCrop?.width &&
                completedCrop?.height &&
                imgRef.current &&
                previewCanvasRef.current
            ) {
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

    const downloadImage = async () => {
        let canvasDataUrl = await previewCanvasRef.current.toDataURL();
        divToDownload.current.style = `background: url("${canvasDataUrl}") no-repeat 4 center`;
        divToDownload.current.style = `border-radius: ${radius}px`;
        previewCanvasRef.current.style.display = "hidden";

        const dataUrl = await htmlToImage.toPng(divToDownload.current);

        const link = document.createElement("a");
        link.download = "image.png";
        link.href = dataUrl;
        link.click();
    };

    const handleChangeRadius = (e) => {
        setRadius(e.target.value);
    };

    return (
        <div className="App">
            <div className="Crop-Controls">
                <div className="crop__text-wrapper">
                    <label className="crop__label" htmlFor="imageUpload">
                        Select or drop file here
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        id="imageUpload"
                        onChange={onSelectFile}
                    />
                </div>
            </div>
            <div
                className="react-crop"
                style={{
                    width: `${!!imgSrc ? "fit-content" : ""}`,
                    minHeight: `${!!imgSrc ? "" : "350px"}`,
                    alignSelf: `${!!imgSrc ? "center" : ""}`,
                    backgroundColor: `${!!imgSrc ? "white" : ""}`,
                }}>
                {!!imgSrc && (
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        style={{ display: "block" }}>
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={imgSrc}
                            onLoad={onImageLoad}
                        />
                    </ReactCrop>
                )}
            </div>
            <div className="radius-box">
                <div className="radius-group">
                    <input
                        className="radius-checkbox"
                        type="checkbox"
                        checked={checkbox}
                        onChange={handleCheckbox}
                    />
                    <label htmlFor="">Round corners</label>
                </div>

                <div className="radius-group">
                    <label htmlFor="">Round radius (px)</label>
                    <input
                        className="radius-value-input"
                        value={radius}
                        disabled={!checkbox}
                        onChange={handleChangeRadius}
                        type="number"
                    />
                </div>
            </div>
            {!!completedCrop && (
                <>
                    <div
                        className="canvas-box"
                        ref={divToDownload}
                        style={{
                            borderRadius: `${checkbox ? radius : 0}px`,
                        }}>
                        <canvas
                            id="download-comp"
                            style={{
                                objectFit: "contain",
                                width: completedCrop.width,
                                height: completedCrop.height,
                                // borderRadius: `${checkbox ? radius : 0}px`,
                                borderRadius: `inherit`,
                            }}
                            ref={previewCanvasRef}
                        />
                    </div>
                    <div className="download-btn-box">
                        <button
                            className="download-btn"
                            onClick={downloadImage}>
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
