import { shimmer, toBase64 } from "./constants";
import NextImage from "next/image";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const loadingShimmerSrc = `data:image/svg+xml;base64,${toBase64(
  shimmer(700, 475)
)}`;

const IpfsAsset = ({
  cid,
  id = cid,
  height = 200,
  width = 300,
}: {
  cid: string;
  id?: string;
  height?: string | number;
  width?: string | number;
}) => {
  const src = useMemo(() => `https://ipfs.io/ipfs/${cid}`, [cid]);
  const [assetData, setAssetData] = useState<{
    src: string;
    type: "image" | "video" | "unknown";
  }>();
  const [imageState, setImageStats] = useState({ width, height });
  useEffect(() => {
    if (!assetData) {
      axios
        .get(src, { responseType: "blob" })
        .then((r) => {
          const contentType =
            r.headers["content-type"] || r.headers["Content-Type"];
          const assetSrc = URL.createObjectURL(r.data);
          if (contentType.startsWith("image")) {
            const parent = (document.getElementById(id) as HTMLDivElement)
              ?.parentElement;
            if (
              imageState.height === "100%" &&
              imageState.width === "100%" &&
              parent
            ) {
              const dummyImage = new Image();
              dummyImage.src = assetSrc;
              dummyImage.style.visibility = "hidden";
              dummyImage.onload = () => {
                document.body.appendChild(dummyImage);
                const { clientWidth, clientHeight } = dummyImage;
                dummyImage.remove();
                const {
                  clientWidth: containerWidth,
                  clientHeight: containerHeight,
                } = parent;
                const ratio = Math.min(
                  containerWidth / clientWidth,
                  containerHeight / clientHeight
                );
                setAssetData({ src: assetSrc, type: "image" });
                setImageStats({
                  width: clientWidth * ratio,
                  height: clientHeight * ratio,
                });
              };
            } else {
              setAssetData({ src: assetSrc, type: "image" });
            }
          } else if (contentType.startsWith("video")) {
            setAssetData({ src: assetSrc, type: "video" });
          } else {
            setAssetData({ src: assetSrc, type: "unknown" });
          }
        })
        .catch((e) => console.error(e));
    }
  }, [
    id,
    imageState.height,
    imageState.width,
    src,
    assetData,
    setAssetData,
    setImageStats,
  ]);
  return (
    <>
      <div id={id} />
      {assetData?.type === "image" && (
        <NextImage
          src={assetData.src}
          alt={"thumbnail"}
          width={imageState.width}
          height={imageState.height}
        />
      )}
      {assetData?.type === "video" && (
        <video
          src={assetData.src}
          width={imageState.width}
          height={imageState.height}
          controls
          autoPlay
        />
      )}
      {!assetData && (
        <NextImage
          src={loadingShimmerSrc}
          alt={"loading..."}
          width={imageState.width}
          height={imageState.height}
        />
      )}
    </>
  );
};

export default IpfsAsset;
