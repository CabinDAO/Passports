import { styled } from "@cabindao/topo";
import React from "react";
import Layout from "../../components/Layout";

const Title = styled("h1", {
  textTransform: "uppercase",
  color: "#8B9389",
  fontSize: "14px",
  fontFamily: "$mono",
});

const StampAddressPage = () => {
  return (
    <Layout title={<Title>Stamps / Coming Soon</Title>}>Coming soon!</Layout>
  );
};

export default StampAddressPage;
