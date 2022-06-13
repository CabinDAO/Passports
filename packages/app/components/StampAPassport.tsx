import { Button, Input, Modal, styled } from "@cabindao/topo";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CrossCircledIcon } from "@radix-ui/react-icons";

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
}>({ setUsers: () => {}, setConfirmed: () => {}, users: [] });

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
  const { users, setConfirmed } = useContext(ScreenContext);
  return (
    <>
      <Title>2. Confirm Transaction</Title>
      <Body>
        Whose passport do you want to stamp? Search your community to send this
        stamp to them.
      </Body>
    </>
  );
};

const StampAPassport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState(0);
  const [users, setUsers] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const screens = useMemo(
    () => [
      {
        Body: SearchForCommunityMembers,
        onConfirm: () => {
          setScreen(1);
          return true;
        },
        cancelText: "",
      },
      {
        Body: ConfirmTransactionScreen,
      },
    ],
    []
  );
  const { Body, ...props } = screens[screen];
  return (
    <ScreenContext.Provider value={{ setUsers, setConfirmed, users }}>
      <Button type="primary" tone="wheat" onClick={() => setIsOpen(true)}>
        Stamp a Passport
      </Button>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title={"Stamp a Passport"}
        disabled={!confirmed || !users.length}
        confirmText={"Next"}
        {...props}
      >
        <Body />
      </Modal>
    </ScreenContext.Provider>
  );
};

export default StampAPassport;
