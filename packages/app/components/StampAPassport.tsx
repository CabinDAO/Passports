import {
  Button,
  Checkbox,
  Input,
  Label,
  Modal,
  styled,
  Toast,
} from "@cabindao/topo";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CrossCircledIcon } from "@radix-ui/react-icons";
import { getStampContract } from "./utils";
import { useAddress, useChainId, useWeb3 } from "./Web3Context";
import type { ContractSendMethod } from "web3-eth-contract";
import axios from "axios";
import Loading from "./Loading";
import { networkNameById } from "./constants";
import { ArrowRightIcon } from "@radix-ui/react-icons";

// TODO: migrate to TOPO at some point
const AutocompleteInput = ({
  onEnter,
  ...inputProps
}: {
  onEnter?: (s: typeof inputProps.value) => void;
} & Parameters<typeof Input>[0]) => {
  return (
    <Input
      {...inputProps}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onEnter?.(inputProps.value);
        }
      }}
    />
  );
};

const Title = styled("h1", {
  fontFamily: "$mono",
  fontWeight: 600,
  fontSize: "18px",
  color: "black",
  marginBottom: "32px",
});

const Body = styled("p", {
  fontFamily: "$mono",
  fontWeight: 400,
  fontSize: "18px",
  color: "black",
  marginBottom: "32px",
});

const UserContainer = styled("ol", {
  marginTop: "32px",
  paddingLeft: "20px",
  "& > li > div": {
    display: "flex",
    justifyContent: "space-between",
    borderBottom: "1px solid #00000040",
    padding: "8px 0",
  },
  "& > li > div:last-child": {
    borderBottom: "unset",
  },
});

const ScreenContext = createContext<{
  setUsers: (u: string[]) => void;
  setConfirmed: (b: boolean) => void;
  users: string[];
  label: string;
  txHash: string;
}>({
  setUsers: () => {},
  setConfirmed: () => {},
  users: [],
  label: "",
  txHash: "",
});

const SearchForCommunityMembers = () => {
  const [value, setValue] = useState("");
  const { users, setUsers } = useContext(ScreenContext);
  return (
    <>
      <Title>1. Search for comunity Members</Title>
      <Body>
        Whose passport do you want to stamp? Search your community to send this
        stamp to them.
      </Body>
      <AutocompleteInput
        label={"Search Community"}
        placeholder={"cabin.eth"}
        helpText={"Search by name, ens, or address"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onEnter={(v) => {
          setUsers(users.concat([`${v ?? ""}`]));
          setValue("");
        }}
      />
      <UserContainer>
        {users.map((u) => (
          <li key={u}>
            <div>
              <span>{u}</span>
              <Button
                // @ts-ignore
                css={{
                  background: "unset",
                  color: "$forest",
                }}
                type={"icon"}
                onClick={() => {
                  const newUsers = users.filter((user) => user !== u);
                  setUsers(newUsers);
                }}
              >
                <CrossCircledIcon />
              </Button>
            </div>
          </li>
        ))}
      </UserContainer>
    </>
  );
};

const ConfirmTransactionScreen = () => {
  const { users, setConfirmed, setUsers, label } = useContext(ScreenContext);
  return (
    <>
      <Title>2. Confirm Transaction</Title>
      <Body>
        Would you like to mint the {label} stamp for the following community
        members?
      </Body>
      <UserContainer>
        {users.map((u) => (
          <li key={u}>
            <div>
              <span>{u}</span>
              <Button
                // @ts-ignore
                css={{
                  background: "unset",
                  color: "$forest",
                }}
                type={"icon"}
                onClick={() => {
                  const newUsers = users.filter((user) => user !== u);
                  setUsers(newUsers);
                }}
              >
                <CrossCircledIcon />
              </Button>
            </div>
          </li>
        ))}
      </UserContainer>
      <Label
        label="Confirmation"
        description="This will update the contract and require signing a transaction and paying a gas fee"
      >
        <Checkbox
          defaultChecked={false}
          onCheckedChange={(b) => setConfirmed(b === true)}
        />
      </Label>
    </>
  );
};

const LoadingContainer = styled("div", {
  display: "flex",
  alignItems: "center",
  margin: "64px 0",
  justifyContent: "center",
});

const EtherscanContainer = styled("a", {
  display: "flex",
  alignItems: "center",
  fontFamily: "$mono",
  fontSize: "16px",
  margin: "16px 0",
  textTransform: "uppercase",
  color: "$forest",
  gap: "16px",
  cursor: "pointer",
  textDecoration: "none",
  justifyContent: "center",
  span: {
    textDecoration: "underline",
  },
});

const ConfirmingTransactionScreen = () => {
  const { label, txHash } = useContext(ScreenContext);
  const chainId = useChainId();
  return (
    <>
      <Title>2. Confirm Transaction</Title>
      <Body>Updating the {label} stamp. This may take a few minutes.</Body>
      <LoadingContainer>
        <Loading />
      </LoadingContainer>
      {txHash && (
        <EtherscanContainer
          href={`https://${
            networkNameById[chainId] === "mainnet"
              ? ""
              : `${networkNameById[chainId]}.`
          }etherscan.io/tx/${txHash}`}
          target={"_blank"}
          rel={"noreferrer"}
        >
          <span>View on etherscan</span>
          <ArrowRightIcon />
        </EtherscanContainer>
      )}
    </>
  );
};

const StampAPassport = ({
  label,
  version,
  address,
  onStampSuccess,
}: {
  label: string;
  version: string;
  address: string;
  onStampSuccess: (args: { tokenId: string; address: string }[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState(0);
  const [users, setUsers] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const account = useAddress();
  const web3 = useWeb3();
  const chainId = useChainId();
  const [toastMessage, setToastMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const onStamp = useCallback((): Promise<void> => {
    setScreen(2);
    return getStampContract({
      web3,
      address,
      version,
    })
      .then(
        (contract) =>
          new Promise<void>((resolve, reject) =>
            (contract.methods.airdrop(users) as ContractSendMethod)
              .send({
                from: account,
              })
              .on("receipt", (receipt) => {
                const transferEvents = receipt.events?.["Transfer"];
                const transfers = Array.isArray(transferEvents)
                  ? transferEvents
                  : [transferEvents];
                const tokens = transfers.map((t) => ({
                  tokenId: t?.returnValues?.tokenId as string,
                  address: t?.returnValues?.to as string,
                }));
                axios
                  .post("/api/stamps", {
                    chain: chainId,
                    tokens,
                    contract: address,
                  })
                  .then(() => {
                    setToastMessage("Users Successfully Received Stamps!");
                    resolve();
                    onStampSuccess(tokens);
                  });
              })
              .on("transactionHash", (transactionHash) => {
                setTxHash(transactionHash);
              })
              .on("error", reject),
          ),
      )
      .catch((e) => {
        setToastMessage(`ERROR: ${e.message}`);
      });
  }, [web3, account, version, address, users, chainId, onStampSuccess]);
  const screens = useMemo(
    () => [
      {
        Body: SearchForCommunityMembers,
        onConfirm: (): boolean => {
          setScreen(1);
          return true;
        },
        cancelText: "",
      },
      {
        Body: ConfirmTransactionScreen,
        cancelText: "Back",
        onCancel: () => {
          setScreen(0);
          return true;
        },
        onConfirm: onStamp,
      },
      {
        Body: ConfirmingTransactionScreen,
        hideFooter: true,
      },
    ],
    [onStamp, setScreen],
  );
  const { Body, ...props } = screens[screen];
  return (
    <ScreenContext.Provider
      value={{ setUsers, setConfirmed, users, label, txHash }}
    >
      <Button type="primary" tone="wheat" onClick={() => setIsOpen(true)}>
        Stamp a Passport
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={"Stamp a Passport"}
        disabled={!users.length || (screen === 1 && !confirmed)}
        confirmText={"Next"}
        {...props}
      >
        <Body />
      </Modal>
      <Toast
        isOpen={!!toastMessage}
        onClose={() => setToastMessage("")}
        message={toastMessage}
        intent={toastMessage.startsWith("ERROR") ? "error" : "success"}
      />
    </ScreenContext.Provider>
  );
};

export default StampAPassport;
