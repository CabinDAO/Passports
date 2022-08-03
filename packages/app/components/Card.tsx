import { styled, Box, Heading, Text } from "@cabindao/topo";

// Card
export const Card = styled(Box, {
  boxShadow: "0 4px 15px rgb(0 0 0 / 0.25)",
});

// Card Header
export const CardHeader = styled(Box, {
  background: "$forest",
  color: "$sand",
  padding: "$3 $5",
  [`& ${Heading}, & ${Text}`]: {
    color: "$sand",
    textTransform: "capitalize",
    fontFamily: "$mono",
    fontSize: "$base",
    fontWeight: "$light",
    m: 0
  },
});

export const CardBody = styled(Box, {padding: "$5"})

export default Card;
