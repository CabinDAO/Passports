import React from "react";
import { styled, Button, Text } from "@cabindao/topo";

export const Tabs = styled("div", {
  margin: "0.25rem 0"
});

export const TabList = styled("div", {
  display: "flex",
  borderBottom: "2px solid $forest",
});

export const TabPanels = styled("div", {});

export const TabPanel = styled("div", {
  display: "none",
  pt: "1rem",

  variants: {
    active: {
      true: {
        display: "block"
      }
    }
  }
});

export const Tab = styled("div", {
  padding: "0.5rem 0.75rem",

  variants: {
    active: {
      true: {
        color: "$sand",
        backgroundColor: "$forest"
      },
      false: {
        color: "$forest",
        '&:hover': {
          backgroundColor: "$forest",
          color: "$sand",
          transition: "all 300ms ease"
        },
      }
    },
    disabled: {
      true: {
        backgroundColor: "rgba(50, 72, 65, 0.1)",
        color: "rgba(50, 72, 65, 0.9)",
        cursor: "not-allowed",
      }
    }
  }
});

