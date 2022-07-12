import { useEffect } from "react";
import type { NextPage } from "next/types";
import { useRouter } from "next/router";
import BaseLayout from "../components/Layout/Base";
import Hero from "../components/Hero";
import { Button, styled, Wrapper, Heading } from "@cabindao/topo";
import { useUser } from "@clerk/nextjs";

const Container = styled("section", {
  pt: "$12",
});

const Content = styled("div", {
  display: "flex",
  flexDirection: "column",
  px: "$10",
  py: "$8",
  border: "1px solid $sprout",
  br: "$2",
  h2: {
    mt: "$1",
    mb: "$0",
    fontFamily: "$mono",
    fontSize: "$xl",
    fontWeight: 600,
    lineHeight: 1.6,
    maxWidth: "28rem",
    flex: "1",
  },
  div: {
    flex: "2",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  "@md": {
    flexDirection: "row",
    br: "$3",
    h2: {
      fontSize: "$xxl",
      maxWidth: "40rem",
    },
  },
});

const Home: NextPage = () => {
  const user = useUser();
  const router = useRouter();

  console.log(user);

  return (
    <BaseLayout>
      <Wrapper>
        <Hero title="PASSPORTS">
          <Heading
            mono
            css={{
              color: "$forest",
              fontSize: "$xxxl",
              mt: 0,
              mb: "$6",
              bg: "$sand",
              textAlign: "center",
            }}
          >
            Protocol for belonging
          </Heading>
          {
            user.isSignedIn ? (
              <Button tone="forest" onClick={() => {router.push("/passport")}}>Enter</Button>
            ) : (
              <Button tone="wheat">Bring your community</Button>
            )
          }
        </Hero>
      </Wrapper>
    </BaseLayout>
  );
};

export default Home;
