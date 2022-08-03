import { styled, Button, Box, Heading, Text } from "@cabindao/topo";

import { Card, CardHeader, CardBody } from "./Card";

import Image from "next/image";

const CommunityThumbnail = styled("div", {
  width: "160px",
  height: "120px",
  "> span": {
    borderRadius: "20px",
  },
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
});

const Field = styled("span", {
  color: "$forest",
  fontFamily: "$mono",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: "8px",
});

const Value = styled("span", {
  color: "#8B9389",
  fontFamily: "$sans",
  fontSize: 12,
  fontWeight: 500,
});

const CommunityCard = ({
  name,
  symbol,
  description,
  thumbnail,
  quantity,
}: {
  name: string;
  symbol: string;
  description: string;
  thumbnail: string;
  quantity: number;
}) => (
  <Card>
    <CardHeader>
      <Heading>
        {name} ({symbol})
      </Heading>
    </CardHeader>
    <CardBody>
      <CommunityThumbnail>
        <Image
          src={thumbnail}
          alt={"Thumbnail"}
          height={"100%"}
          width={"100%"}
        />
      </CommunityThumbnail>
      <Text mono weight="light" size="sm" css={{ my: "$5" }}>
        {description}
      </Text>
      <Box css={{ display: "flex", justifyContent: "space-between" }}>
        <Box
          css={{
            display: "flex",
            alignItems: "start",
            flexDirection: "column",
          }}
        >
          <Field>Membership Stamp</Field>
          <Value>
            {name} ({symbol})
          </Value>
        </Box>
        <Box
          css={{ display: "flex", alignItems: "end", flexDirection: "column" }}
        >
          <Field>Quantity</Field>
          <Value>{quantity}</Value>
        </Box>
      </Box>
    </CardBody>
  </Card>
);

export default CommunityCard;
