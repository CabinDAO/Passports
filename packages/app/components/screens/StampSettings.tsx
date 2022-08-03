import React, { useState, useCallback } from "react";
import axios from "axios";
import {
  styled,
  theme,
  Box,
  Label,
  Text,
  Tooltip,
  Button,
  Modal,
  Input,
  Toast,
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
import {
  ModalInput,
  ModalContent,
  ModalLabel,
  ModalInputLabel,
  ModalInputBox,
} from "@/components/Modal";
import EditStampField from "@/components/modals/EditStampField";
import TogglePauseStamp from "@/components/modals/TogglePauseStamp";
import AirdropStampModal from "@/components/modals/AirdropStampModal";
import StampOwnershipModal from "@/components/modals/StampOwnershipModal";

import { getStampContract } from "@/utils/stamps";
import { networkNameById } from "@/utils/constants";

import type { ContractSendMethod } from "web3-eth-contract";

// Stamp Settings ----
const SettingTitle = styled(Text, {
  font: "$mono",
  color: "$wheat",
  fontSize: "$sm",
  textTransform: "uppercase",
});

const StampCardValue = styled(Text, {
  color: "white",
  fontWeight: "$bold",
  fontFamily: "$sans",
  "& > button": {
    height: "16px",
  },
});

const StampCardContainer = styled("div", {
  background: "$forest",
  color: "$sand",
  width: 300,
  padding: "18px 24px 24px",
  display: "inline-block",
  marginRight: "8px",
  marginBottom: "8px",
  verticalAlign: "top",
  border: "1px solid $sprout",
  borderRadius: "20px",
});

const StampCardRow = styled("div", {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
  fontSize: "14px",
  fontFamily: "$mono",
  alignItems: "center",
});

const StampCardKey = styled("span", {
  textTransform: "uppercase",
});

const EditableStampCardRow = ({
  field,
  stamp,
  setStamp,
  decorator = "",
}: {
  field: keyof IStampProps;
  stamp: IStampProps;
  setStamp: (s: IStampProps) => void;
  decorator?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const web3 = useWeb3();
  const address = useAddress();
  const [value, setValue] = useState(stamp[field] || 0);

  return (
    <StampCardRow>
      <StampCardKey>{field}</StampCardKey>
      <StampCardValue>
        {stamp[field]}
        {decorator}
        <Tooltip content={"Edit"}>
          <Button onClick={() => setIsOpen(true)} type={"icon"}>
            <Pencil1Icon color={theme.colors.wheat} width={12} height={12} />
          </Button>
        </Tooltip>

        {/* Modal for editing the stamp field */}
        <EditStampField
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          field={field}
          stamp={stamp}
          setStamp={setStamp}
          value={value}
          setValue={setValue}
        />
      </StampCardValue>
    </StampCardRow>
  );
};

const StampCard = (props: IStampProps) => {
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();
  const chainId = useChainId();

  const [stamp, setStamp] = useState(props);

  const [isOpen, setIsOpen] = useState(false);
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [airDropIsOpen, setAirDropIsOpen] = useState(false);
  const [pauseIsOpen, setPauseIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), [setIsOpen]);

  const [fileLoading, setFileLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  return (
    <StampCardContainer>
      <div style={{ marginBottom: 16 }}>
        <Tooltip content={"Share Stamp Ownership"}>
          <Button onClick={() => setShareIsOpen(true)} type="icon">
            <Share1Icon width={20} height={20} color={theme.colors.wheat} />
          </Button>
        </Tooltip>
        <Tooltip content={"Customize checkout"}>
          <Button onClick={open} type="icon">
            <Pencil2Icon width={20} height={20} color={theme.colors.wheat} />
          </Button>
        </Tooltip>
        <Tooltip content={"Airdrop stamps"}>
          <Button onClick={() => setAirDropIsOpen(true)} type="icon">
            <OpacityIcon width={20} height={20} color={theme.colors.wheat} />
          </Button>
        </Tooltip>
        <Tooltip content={stamp.paused ? "Unpause" : "Pause"}>
          <Button
            onClick={() => {
              setPauseIsOpen(true);
            }}
            type={"icon"}
          >
            {stamp.paused ? (
              <PlayIcon width={20} height={20} color={theme.colors.wheat} />
            ) : (
              <PauseIcon width={20} height={20} color={theme.colors.wheat} />
            )}
          </Button>
        </Tooltip>

        <StampOwnershipModal
          stamp={stamp}
          isOpen={shareIsOpen}
          setIsOpen={setShareIsOpen}
          setStamp={setStamp}
          setToastMessage={setToastMessage}
        />

        <AirdropStampModal
          stamp={stamp}
          isOpen={airDropIsOpen}
          setIsOpen={setAirDropIsOpen}
          setStamp={setStamp}
          setToastMessage={setToastMessage}
        />

        <TogglePauseStamp
          stamp={stamp}
          isOpen={pauseIsOpen}
          setIsOpen={setPauseIsOpen}
          setStamp={setStamp}
          setToastMessage={setToastMessage}
        />
      </div>

      <StampCardRow>
        <span>BALANCE</span>
        <StampCardValue>
          {((Number(stamp.balance) * 39) / 40).toFixed(2)} ETH
          <Tooltip content={"Withdraw"}>
            <Button
              type={"icon"}
              disabled={stamp.balance === "0"}
              onClick={(e) => {
                getStampContract({
                  web3,
                  address: stamp.address,
                  version: stamp.version,
                }).then((contract) =>
                  (contract.methods.claimEth() as ContractSendMethod)
                    .send({ from: address })
                    .on("receipt", () => {
                      setToastMessage(
                        `Successfully Claimed ${stamp.balance} ETH!`
                      );
                      setStamp({
                        ...stamp,
                        balance: "0",
                      });
                    })
                );
                e.stopPropagation();
              }}
            >
              <ExitIcon color={theme.colors.wheat} width={12} height={12} />
            </Button>
          </Tooltip>
        </StampCardValue>
      </StampCardRow>

      <StampCardRow>
        <span>MINTED</span>
        <StampCardValue>
          {stamp.mintIndex}
          <Tooltip content={"Copy checkout link"}>
            <Button
              onClick={(e) => {
                window.navigator.clipboard.writeText(
                  `${window.location.origin}/checkout/${
                    networkNameById[Number(networkId)]
                  }/${stamp.address}`
                );
                setToastMessage("Copied checkout link!");
                e.stopPropagation();
              }}
              type="icon"
            >
              <Link1Icon width={12} height={12} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
        </StampCardValue>
      </StampCardRow>

      <EditableStampCardRow
        field={"supply"}
        stamp={stamp}
        setStamp={setStamp}
      />

      <EditableStampCardRow
        field={"price"}
        stamp={stamp}
        setStamp={setStamp}
        decorator={" ETH"}
      />

      <EditableStampCardRow
        field={"royalty"}
        stamp={stamp}
        setStamp={setStamp}
        decorator={"%"}
      />

      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
      />
    </StampCardContainer>
  );
};

interface IStampProps {
  address: string;
  name: string;
  symbol: string;
  mintIndex: number;
  supply: number;
  price: string;
  metadataHash: string;
  royalty: number;
  isPrivate: boolean;
  version: string;
  paused: boolean;
  thumbnail: string;
  metadata: Record<string, string>;
  // based on query params - should prob separate into individual routes based on path params
  users?: Record<string, { tokens: number[]; name: string }>;
  userTotal?: number;
  transactions?: unknown[];
  balance?: string;
  customization?: Record<string, string>;
}

const StampSettings = (props: IStampProps) => {
  const web3 = useWeb3();
  const address = useAddress();
  const networkId = useChainId();

  const [stamp, setStamp] = useState(props);

  const [isOpen, setIsOpen] = useState(false);
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [airDropIsOpen, setAirDropIsOpen] = useState(false);
  const [pauseIsOpen, setPauseIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);

  const [toastMessage, setToastMessage] = useState("");

  console.log("airDropIsOpen", airDropIsOpen);

  return (
    <Box>
      {/* Settings header toolbar */}
      <Box
        css={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Box>
          <Tooltip content={"Share Stamp Ownership"}>
            <Button onClick={() => setShareIsOpen(true)}>
              <Share1Icon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={"Customize checkout"}>
            <Button onClick={open}>
              <Pencil2Icon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={"Airdrop stamps"}>
            <Button onClick={() => setAirDropIsOpen(true)}>
              <OpacityIcon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
          <Tooltip content={stamp.paused ? "Unpause" : "Pause"}>
            <Button
              onClick={() => {
                setPauseIsOpen(true);
              }}
            >
              {stamp.paused ? (
                <PlayIcon width={20} height={20} color={theme.colors.wheat} />
              ) : (
                <PauseIcon width={20} height={20} color={theme.colors.wheat} />
              )}
            </Button>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip content={"Refresh IPFS pin"}>
            <Button
              onClick={() =>
                axios.put(`/api/stamp/refresh`, {
                  paths: [props.metadataHash, props.thumbnail],
                })
              }
            >
              <ReloadIcon width={20} height={20} color={theme.colors.wheat} />
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Box>
        <StampCard {...props} />
      </Box>

      {/* Stamp Settings Body */}
      <Box css={{ padding: "$6 $4", maxWidth: 400, background: "$forest" }}>
        <StampCardRow>
          <SettingTitle>Balance</SettingTitle>

          <StampCardValue>
            {((Number(stamp.balance) * 39) / 40).toFixed(2)} ETH
            <Tooltip content={"Withdraw"}>
              <Button
                type={"icon"}
                disabled={stamp.balance === "0"}
                onClick={(e) => {
                  getStampContract({
                    web3,
                    address: stamp.address,
                    version: stamp.version,
                  }).then((contract) =>
                    (contract.methods.claimEth() as ContractSendMethod)
                      .send({ from: address })
                      .on("receipt", () => {
                        setToastMessage(
                          `Successfully Claimed ${stamp.balance} ETH!`
                        );
                        setStamp({
                          ...stamp,
                          balance: "0",
                        });
                      })
                  );
                  e.stopPropagation();
                }}
              >
                <ExitIcon color={theme.colors.wheat} width={12} height={12} />
              </Button>
            </Tooltip>
          </StampCardValue>
        </StampCardRow>

        <StampCardRow>
          <span>MINTED</span>
          <StampCardValue>
            {stamp.mintIndex}
            <Tooltip content={"Copy checkout link"}>
              <Button
                onClick={(e) => {
                  window.navigator.clipboard.writeText(
                    `${window.location.origin}/checkout/${
                      networkNameById[Number(networkId)]
                    }/${stamp.address}`
                  );
                  setToastMessage("Copied checkout link!");
                  e.stopPropagation();
                }}
                type="icon"
              >
                <Link1Icon width={12} height={12} color={theme.colors.wheat} />
              </Button>
            </Tooltip>
          </StampCardValue>
        </StampCardRow>

        <EditableStampCardRow
          field={"supply"}
          stamp={stamp}
          setStamp={setStamp}
        />

        <EditableStampCardRow
          field={"price"}
          stamp={stamp}
          setStamp={setStamp}
          decorator={" ETH"}
        />

        <EditableStampCardRow
          field={"royalty"}
          stamp={stamp}
          setStamp={setStamp}
          decorator={"%"}
        />
      </Box>

      {/* Modals */}
      <TogglePauseStamp
        stamp={stamp}
        isOpen={pauseIsOpen}
        setIsOpen={setPauseIsOpen}
      />

      <StampOwnershipModal
        stamp={stamp}
        isOpen={shareIsOpen}
        setIsOpen={setShareIsOpen}
        setStamp={setStamp}
        setToastMessage={setToastMessage}
      />

      <AirdropStampModal
        stamp={stamp}
        isOpen={airDropIsOpen}
        setIsOpen={setAirDropIsOpen}
        setStamp={setStamp}
        setToastMessage={setToastMessage}
      />
    </Box>
  );
};

export default StampSettings;
