import React from "react";
import { styled, Button, Text } from "@cabindao/topo";

import Image from "next/image";

import IpfsAsset from "./IpfsAsset";
import StampAPassport from "./StampAPassport";

const CardTitle = styled("h1", {
  color: "$sand",
  fontFamily: "$mono",
  fontWeight: "500",
});

const Separator = styled("div", {
  height: "2px",
  width: "25%",
  minWidth: "15rem",
  marginBottom: "1rem",
  background: "$sprout",
});

const Card = styled("div", {
  background: "$forest",
  padding: "0.75rem 2rem",
});

const Flex = styled("div", {
  display: "flex",
});

const Container = styled("div");

const StampHeader = ({
  name,
  symbol,
  thumbnail,
  supply,
  version,
  address,
  onStampSuccess,
}: {
  name: string;
  symbol: string;
  thumbnail: string;
  supply: number;
  version: string;
  address: string;
  onStampSuccess: (args: { tokenId: string; address: string }[]) => void;
}) => {
  const label = `${name} (${symbol})`;
  return (
    <Card>
      <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
        <Container>
          <CardTitle>{label}</CardTitle>
          <Separator />
          <Text css={{ color: "$sand", mb: "2rem" }}>Supply: {supply}</Text>
          <StampAPassport
            label={label}
            version={version}
            address={address}
            onStampSuccess={onStampSuccess}
          />
        </Container>
        <Container>
          <IpfsAsset cid={thumbnail} width={"100%"} height={"100%"} />
        </Container>
      </Flex>
    </Card>
  );
};

export default StampHeader;
