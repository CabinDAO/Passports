import React from "react";
import { styled, Button, Text } from "@cabindao/topo";
import Image from "next/image";

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
  image,
  supply,
}: {
  name: string;
  symbol: string;
  image: string;
  supply: number;
}) => {
  return (
    <Card>
      <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
        <Container>
          <CardTitle>
            {name} ({symbol})
          </CardTitle>
          <Separator />
          <Text css={{ color: "$sand", mb: "2rem" }}>Supply: {supply}</Text>
          <Button type="primary" tone="wheat">
            Stamp a Passport
          </Button>
        </Container>
        <Container>
          <Image src={image} alt={"stock"} width={"100%"} height={"100%"} />
        </Container>
      </Flex>
    </Card>
  );
};

export default StampHeader;
