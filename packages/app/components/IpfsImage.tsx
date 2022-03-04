import { shimmer, toBase64 } from "./constants";
import Image from "next/image";
import { styled } from "@cabindao/topo";

const StyledImage = styled(Image, {
    borderRadius: '20px',
    border: "1px solid $forest",
    width: "100%",
    height: "176px",
})

const IpfsImage = ({
  cid,
  height,
  width,
}: {
  cid: string;
  height?: string | number;
  width?: string | number;
}) => {
  return (
    <StyledImage
      src={`https://ipfs.io/ipfs/${cid}`}
      alt={"thumbnail"}
      width={height || 300}
      height={width || 200}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(700, 475))}`}
    />
  );
};

export default IpfsImage;
