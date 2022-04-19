import type { NextPage } from "next/types";
import Layout from "../components/Layout";
import { Button, styled, Wrapper } from "@cabindao/topo";

const Row = styled("div", {
  display: "flex",
  justifyContent: "space-between",
});

const HeroElement = styled("div", {
  marginTop: 2.31,
  width: 8,
  height: 4.62,
  backgroundColor: "$sprout",
  position: "relative",
  "&:before": {
    content: "",
    borderLeft: "4px solid transparent",
    borderRight: "4px solid transparent",
    position: "absolute",
    top: -2.31,
    borderBottom: "2.31px solid $sprout",
  },
  "&:after": {
    content: "",
    borderLeft: "4px solid transparent",
    borderRight: "4px solid transparent",
    position: "absolute",
    bottom: -2.31,
    borderTop: "2.31px solid $sprout",
  },
});

const InnerHeroElement = styled(HeroElement, {
  transform: "scale(0.7,0.7)",
  backgroundColor: "$sand",
  zIndex: 1,
  marginTop: 0,
  "&:before": {
    borderBottomColor: "$sand",
  },
  "&:after": {
    borderTopColor: "$sand",
  },
});

const HeroPattern = ({ width, height }: { width: number; height: number }) => (
  <>
    {Array(height)
      .fill(null)
      .map((_, i) => (
        <Row key={i}>
          {Array(width)
            .fill(null)
            .map((_, j) => (
              <HeroElement key={j}>
                <InnerHeroElement />
              </HeroElement>
            ))}
        </Row>
      ))}
  </>
);

const Container = styled("section", {
  pt: "$12",
});

const Title = styled("h2", {
  background: "$sand",
  fontFamily: "$mono",
  fontSize: "16px",
  lineHeight: "21px",
  padding: "8px 16px",
  margin: 0,
  display: "flex",
  flexDirection: "row",
  justifyContent: "center",
  alignItems: "center",
  width: "fit-content",
});

const Header = styled("h1", {
  fontSize: 32,
  lineHeight: "44px",
  color: "$forest",
  fontFamily: "$mono",
  mt: 0,
  mb: 24,
  background: "$sand",
  textAlign: "center",
});

const HeroContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  height: 328,
  position: "relative",
  marginBottom: 80,
});

const ProductHeading = styled("div", {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%,-50%)",
  textAlign: "center",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  width: "100%",
});

const HeaderBackground = styled("div", {
  padding: "8px 16px",
  background: "$sand",
  maxWidth: "676px",
  width: "100%",
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
  return (
    <Layout>
      <Container>
        <Wrapper>
          <HeroContainer>
            <HeroPattern width={17} height={6} />
            <ProductHeading>
              <Title>PASSPORTS</Title>
              <HeaderBackground>
                <Header>
                  Create and mint Stamp NFTs representing membership
                </Header>
              </HeaderBackground>
            </ProductHeading>
          </HeroContainer>
        </Wrapper>
      </Container>
      <Container id="about">
        <Wrapper>
          <Content>
            <h2>{"Why Passports?"}</h2>
            <div>
              <p>
                NFTs are the best way to grant and manage membership, but until
                now have been mired in complicated contracts and messy manual
                tracking. And while you may be web3 tech savvy, your growing
                community may not. You need a simple and effective way to grant
                access that reduces friction and seamlessly onboards new
                members. With NFT Passports, we{"'"}re changing what{"'"}s possible for
                on-chain membership, giving you one place to easily create,
                mint, and manage your membership NFTs. Connect your wallet on
                the top right to get started!
              </p>
            </div>
          </Content>
        </Wrapper>
      </Container>
    </Layout>
  );
};

export default Home;
