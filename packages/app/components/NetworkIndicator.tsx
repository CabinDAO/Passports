// TODO: migrate this to Topo. This is maybe even something we
//       could abstract out into a separate package?

import { styled } from "@cabindao/topo";
import { networkNameById } from "@/utils/constants";

const NetworkIndicatorContainer = styled("span", {
  height: "27px",
  borderRadius: "13.5px",
  background: "$green200",
  padding: "8px",
  marginRight: "16px",
  textTransform: "capitalize",
  fontWeight: 700,
  color: "$forest",
  fontFamily: "$sans",
  display: "inline-flex",
  alignItems: "center",
  span: {
    background: "$forest",
    height: "8px",
    width: "8px",
    borderRadius: "4px",
    marginRight: "5px",
    display: "inline-block",
  },
});

const NetworkIndicator = ({ chainId }: { chainId: number }) => {
  return (
    <NetworkIndicatorContainer>
      <span />
      {(chainId ? networkNameById[chainId] || "" : "Unknown").replace("-", " ")}
    </NetworkIndicatorContainer>
  );
};

export default NetworkIndicator;
