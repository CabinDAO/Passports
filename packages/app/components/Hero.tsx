import { styled, Heading } from "@cabindao/topo";

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

const HeroContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  height: 328,
  position: "relative",
  marginBottom: 80,
  marginTop: 80,
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

const Hero = ({ children, title }) => (
  <HeroContainer>
    <HeroPattern width={17} height={6} />
    <ProductHeading>
      <Heading
        as="h2"
        mono
        css={{
          color: "$forest",
          background: "$sand",
          padding: "8px 16px",
          margin: 0,
          fontSize: "$base",
        }}
      >
        {title}
      </Heading>
      <HeaderBackground>{children}</HeaderBackground>
    </ProductHeading>
  </HeroContainer>
);

export default Hero;
