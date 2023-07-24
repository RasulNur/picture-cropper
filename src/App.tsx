import {
    useState,
    useRef,
    FC,
    ChangeEventHandler,
    SyntheticEvent,
    ChangeEvent,
} from "react";

import ReactCrop, {
    Crop,
    centerCrop,
    makeAspectCrop,
    PixelCrop,
} from "react-image-crop";
import { canvasPreview } from "./canvasPreview";
import { useDebounceEffect } from "./useDebounceEffect";
import "./App.css";
import "react-image-crop/dist/ReactCrop.css";
import * as htmlToImage from "html-to-image";

const centerAspectCrop = (
    mediaWidth: number,
    mediaHeight: number,
    aspect: number
) => {
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
};

export const App: FC = () => {
    const divToDownload = useRef(null);

    const [imgSrc, setImgSrc] = useState("");
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const hiddenAnchorRef = useRef<HTMLAnchorElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [radius, setRadius] = useState<number | string>(0);
    const [checkbox, setCheckbox] = useState<boolean>(false);
    const [aspect, _] = useState<number | undefined>(16 / 9);

    const handleCheckbox: ChangeEventHandler<HTMLInputElement> = (e) => {
        setCheckbox(e.target.checked);
        if (e.target.checked) {
            radius ? setRadius(radius) : setRadius(5);
        }
    };

    const onSelectFile: ChangeEventHandler<HTMLInputElement> = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setCrop(undefined);
            const reader = new FileReader();
            reader.addEventListener("load", () =>
                setImgSrc(reader.result?.toString() || "")
            );
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
        if (aspect) {
            const { width, height } = e.currentTarget;
            setCrop(centerAspectCrop(width, height, aspect));
        }
    };

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

    const downloadImage = async (): Promise<void> => {
        if (!previewCanvasRef.current) {
            throw new Error("Crop canvas does not exist");
        }
        previewCanvasRef.current.toDataURL();
        const dataUrl = await htmlToImage.toPng(previewCanvasRef.current);
        const link = document.createElement("a");
        link.download = "image.png";
        link.href = dataUrl;
        link.click();
    };

    const handleChangeRadius = (e: ChangeEvent<HTMLInputElement>) => {
        setRadius(e.target.value);
    };

    return (
        <div className="App">
            <div className="Crop-Controls">
                <div className="crop__text-wrapper">
                    <label className="crop__label" htmlFor="imageUpload">
                        Select file here
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
                        name="radius-checkbox"
                        id="radius-checkbox"
                        checked={checkbox}
                        onChange={handleCheckbox}
                    />
                    <label htmlFor="radius-checkbox">Round corners</label>
                </div>

                <div className="radius-group">
                    <label htmlFor="radius-value-input">
                        Round radius (px)
                    </label>
                    <input
                        className="radius-value-input"
                        name="radius-value-input"
                        id="radius-value-input"
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
                                borderRadius: "inherit",
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
};
