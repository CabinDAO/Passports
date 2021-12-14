import type { NextPage } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Web3 from "web3";

const DRAWER_WIDTH = 255;
const HEADER_HEIGHT = 64;

const Tab: React.FC<{ to: string }> = ({ children, to }) => {
  const router = useRouter();
  const onClick = useCallback(() => router.push(`#${to}`), [router, to]);
  return (
    <div
      style={{ minHeight: 64, padding: 20, cursor: "pointer" }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

const Portal: React.FC = ({ children }) => <>{children}</>; // Replace with react-portal in TOPO

const Modal: React.FC<{
  title: string;
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
  confirmText?: string;
  onConfirm?: () => void | Promise<void>;
}> = ({
  title,
  isOpen,
  setIsOpen,
  children,
  confirmText = "Submit",
  onConfirm,
}) => {
  // TODO migrate to TOPO
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);
  const onContainerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
      }
    },
    [close]
  );
  const onConfirmClick = useCallback(() => {
    const result = onConfirm?.();
    if (result) {
      result.then(close);
    } else {
      close();
    }
  }, [onConfirm, close]);
  return isOpen ? (
    <Portal>
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          backgroundColor: "#32484180", // Forest, 50% opacity
          zIndex: -1,
          inset: 0,
        }}
        onClick={close}
      ></div>
      <div
        style={{
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        onKeyDown={onContainerKeyDown}
        tabIndex={-1}
      >
        <div
          style={{
            maxWidth: 600,
            minWidth: 400,
            margin: 32,
            boxShadow: "0px 12px 50px -24px rgba(0, 0, 0, 0.24);",
            background: "#FDF3E7", // sand
          }}
        >
          <div
            style={{
              height: 56,
              backgroundColor: "#324841", // forest
              paddingTop: 12,
              paddingLeft: 40,
              paddingRight: 16,
              paddingBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 600,
                fontFamily: "IBM Flex Mono",
                color: "#FDF3E7", // sand
              }}
            >
              {title}
            </span>
            <button
              style={{
                width: 32,
                height: 32,
                backgroundColor: "#FDC67B", // wheat
              }}
              onClick={close}
            >
              X {/*replace with icon*/}
            </button>
          </div>
          <div style={{ padding: 40 }}>
            {children}
            <div style={{ display: "flex", justifyContent: "right" }}>
              <button // Replace with TOPO button
                onClick={close}
              >
                Cancel
              </button>
              <button // Replace with TOPO button
                onClick={onConfirmClick}
                style={{ marginLeft: 32 }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  ) : null;
};

const MembershipTabContent = () => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), [setIsOpen]);
  return (
    <>
      <h1>Memberships</h1>
      <div>
        <button style={{ padding: 8 }} onClick={open}>
          Create New Membership Type
        </button>
        <Modal
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          title="New Membership Type"
        >
          <div style={{ paddingLeft: 8, marginBottom: 32 }}>
            <input
              name={"Name"} // TODO Create INPUT component in TOPO
            />
          </div>
          <div style={{ paddingLeft: 8, marginBottom: 32 }}>
            <input name={"Description"} />
          </div>
        </Modal>
      </div>
    </>
  );
};

const UsersTabContent = () => {
  return (
    <>
      <h1>Users</h1>
      <div>Coming Soon!</div>
    </>
  );
};

const SettingsTabContent = () => {
  return (
    <>
      <h1>Settings</h1>
      <div>Coming Soon!</div>
    </>
  );
};

const Home: NextPage = () => {
  const router = useRouter();
  const tab = useMemo(() => router.asPath.replace(/^\/#?/, ""), [router]);
  const [address, setAddress] = useState("");
  const web3 = useRef<Web3>(
    new Web3(Web3.givenProvider || "ws://localhost:8545")
  );
  const assignAddress = useCallback(
    () =>
      web3.current.eth.getAccounts().then((s) => {
        setAddress(s[0]);
      }),
    [setAddress]
  );
  const connectWallet = useCallback(() => {
    (web3.current.givenProvider.enable() as Promise<void>).then(assignAddress);
  }, [assignAddress, web3]);
  useEffect(() => {
    if (web3.current.givenProvider.isConnected()) {
      assignAddress();
    }
  }, [assignAddress, web3]);
  return (
    <div
      style={{
        padding: "0 2rem",
      }}
    >
      <Head>
        <title>NFT Passports</title>
        <meta name="description" content="App | NFT Passports" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header // TODO replace with Topo header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "right",
          padding: 16,
          marginLeft: DRAWER_WIDTH,
          height: HEADER_HEIGHT,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
        }}
      >
        {address ? (
          <button style={{ padding: 8 }}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </button>
        ) : (
          <button // TODO replace with TOPO button
            onClick={connectWallet}
            style={{ padding: 8 }}
          >
            Connect Wallet
          </button>
        )}
      </header>
      <div
        style={{
          width: DRAWER_WIDTH,
          flex: "0 0 auto",
        }}
      >
        <div
          style={{
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            background: "#fdf3e7",
            height: "100%",
            color: "#324841",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            flex: "1 0 auto",
            zIndex: 1200,
            position: "fixed",
            top: 0,
            outline: 0,
            left: 0,
            borderRight: "#fdf3e7",
          }}
        >
          <div style={{ minHeight: 64, padding: 20 }}>
            <Link href="/">
              <a>NFT Passports Dashboard</a>
            </Link>
          </div>
          <Tab to={"memberships"}>Memberships</Tab>
          <Tab to={"users"}>Users</Tab>
          <Tab to={"settings"}>Settings</Tab>
        </div>
      </div>
      <main
        style={{
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          marginLeft: DRAWER_WIDTH,
          width: `calc(100% - 255px)`,
        }}
      >
        {tab === "memberships" && <MembershipTabContent />}
        {tab === "users" && <UsersTabContent />}
        {tab === "settings" && <SettingsTabContent />}
      </main>
    </div>
  );
};

export default Home;
