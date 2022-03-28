import { shimmer, toBase64 } from "./constants";
import NextImage from "next/image";
import {  useMemo, useState } from "react";

const IpfsImage = ({
  cid,
  height = 200,
  width = 300,
}: {
  cid: string;
  height?: string | number;
  width?: string | number;
}) => {
  const src = useMemo(() => `https://ipfs.io/ipfs/${cid}`, [cid]);
  const [imageState, setImageStats] = useState({ width, height });
  return (
    <NextImage
      src={src}
      alt={"thumbnail"}
      width={imageState.width}
      height={imageState.height}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
     /* onLoadStart={(e) => {
        const parent = (e.target as HTMLImageElement).parentElement;
        if (
          imageState.height === "100%" &&
          imageState.width === "100%" &&
          parent
        ) {
          const dummyImage = new Image();
          dummyImage.src = src;
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
            setImageStats({
              width: clientWidth * ratio,
              height: clientHeight * ratio,
            });
          };
        }
      }}*/
    />
  );
};

export default IpfsImage;
