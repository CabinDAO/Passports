import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Web3 from "web3";

const DRAWER_WIDTH = 255;
const HEADER_HEIGHT = 64;

const Home: NextPage = () => {
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
              <a>Passports</a>
            </Link>
          </div>
        </div>
      </div>
      <main
        style={{
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          padding: "4rem 0",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          marginLeft: DRAWER_WIDTH,
          width: `calc(100% - 255px)`,
        }}
      >
        <h1>NFT Passports Dashboard</h1>
      </main>
    </div>
  );
};

export default Home;
