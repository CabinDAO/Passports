import axios from "axios";
import Link from "next/link";
import Papa from "papaparse";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import type { ContractSendMethod } from "web3-eth-contract";
import type { TransactionReceipt } from "web3-core";

// Components
import {
  Box,
  Button,
  Input,
  Label,
  styled,
  theme,
  Toast,
  Tooltip,
} from "@cabindao/topo";
import {
  Pencil1Icon,
  Share1Icon,
  Pencil2Icon,
  PlayIcon,
  PauseIcon,
  OpacityIcon,
  ExitIcon,
  Link1Icon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useAddress, useChainId, useWeb3 } from "@/components/Web3Context";
import Layout from "@/layouts/PageLayout";
import StampHeader from "@/components/StampHeader";
import { Tabs, TabList, TabPanels, Tab, TabPanel } from "@/components/tabs";
import PageTitle from "@/components/PageTitle";
import StampSettings from "@/components/screens/StampSettings";
import StampOwnersTab from "@/components/screens/StampOwnersTab";

// Utils
import { bytes32ToIpfsHash, ipfsAdd } from "@/utils/ipfs";
import { resolveAddress } from "@/utils/address";
import { getStampContract } from "@/utils/stamps";
import { networkIdByName, networkNameById } from "@/utils/constants";
import {
  getStampContract as backendGetStampContract,
  getWeb3,
} from "@/utils/backend";
import { getStampOwners } from "@/utils/firebase";

// API methods
import { getCustomization } from "@/api/customization";

// Misc ---
const Container = styled("div");

// Page Component ----
const StampDetailPage = (props: IStampProps) => {
  const router = useRouter();

  const {
    tab = "owners",
    address,
    network,
    offset = "0",
    size = "10",
  } = router.query;

  const [pageLoading, setPageLoading] = React.useState<boolean>(false);

  const base = router.pathname
    .replace("[address]", address as string)
    .replace("[network]", network as string);

  const loadOwners = useCallback(
    () => router.push(`${base}?tab=owners`),
    [router, base]
  );

  React.useEffect(() => {
    const handleStart = () => {
      setPageLoading(true);
    };
    const handleComplete = () => {
      setPageLoading(false);
    };

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);
  }, [router, setPageLoading]);

  return (
    <Layout
      title={
        <PageTitle>
          <Link href={"/stamps"}>Stamps</Link> / {props.name}
        </PageTitle>
      }
      loading={pageLoading}
    >
      <StampHeader
        {...props}
        // TODO replace with a callback that edits UI directly
        onStampSuccess={loadOwners}
      />
      <Container css={{ pt: "2rem" }}>
        <Tabs>
          <TabList>
            <Tab active={!tab || tab === "owners"} onClick={loadOwners}>
              Owners
            </Tab>
            <Tab
              active={tab === "transactions"}
              onClick={() => router.push(`${base}?tab=transactions`)}
              disabled
            >
              Transactions
            </Tab>
            <Tab
              active={tab === "settings"}
              onClick={() => router.push(`${base}?tab=settings`)}
            >
              Settings
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel active={!tab || tab === "owners"}>
              <StampOwnersTab
                {...props}
                offset={offset}
                size={size}
                loading={pageLoading}
                loadOwners={loadOwners}
              />
            </TabPanel>
            <TabPanel active={tab === "transactions"}>
              <h2>Panel 2</h2>
            </TabPanel>
            <TabPanel active={tab === "settings"}>
              <StampSettings {...props} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
};

type QueryParams = {
  address: string;
  network: string;
};

export const getServerSideProps: GetServerSideProps<
  IStampProps,
  QueryParams
> = (context) => {
  const { network = "", address = "" } = context.params || {};
  const web3 = getWeb3(network);
  const { tab = "", offset } = context.query;
  return Promise.all([
    backendGetStampContract({ address, web3, network }).then(
      ({ contract, version }) =>
        (contract.methods.get() as ContractSendMethod)
          .call()
          .then((data) => ({ data, version }))
    ),
    tab === "settings"
      ? Promise.all([
          getCustomization(address).then(),
          web3.eth
            .getBalance(address)
            .then((b) => web3.utils.fromWei(b, "ether")),
        ]).then(([customization, balance]) => ({ customization, balance }))
      : tab === "transactions" // TODO - SSR transactions
      ? { transactions: [] }
      : getStampOwners({
          contract: address,
          chain: networkIdByName[network],
          offset: Number(offset) || 0,
        }),
  ])
    .then(([{ data, version }, rest]) => {
      const metadataHash = bytes32ToIpfsHash(data[5]);
      return axios
        .get<{ thumbnail: string } & Record<string, string>>(
          `https://ipfs.io/ipfs/${metadataHash}`
        )
        .then((r) => r.data)
        .catch(() => ({} as Record<string, string>))
        .then(({ thumbnail = "", ...metadata }) => ({
          props: {
            address,
            name: data[0],
            symbol: data[1],
            supply: data[2] - data[3],
            price: web3.utils.fromWei(data[4], "ether"),
            thumbnail,
            network,
            version,
            limit: Number(data[8]),
            metadataHash,
            metadata,
            mintIndex: Number(data[3]),
            royalty: data[6] / 100,
            isPrivate: data[7],
            paused: data[9] || false,
            ...rest,
          },
        }));
    })
    .catch((e) => {
      console.error(e);
      return {
        notFound: true,
      };
    });
};

export default StampDetailPage;
