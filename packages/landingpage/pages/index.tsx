import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";

const ConvertKit: React.FunctionComponent = () => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, [setLoaded]);
  return (
    <>
      {!loaded && (
        <Head>
          <script
            async
            src="https://prodigious-trader-7332.ck.page/a85e477729/index.js"
          />
        </Head>
      )}
      <script data-uid="a85e477729" />
    </>
  );
};

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>NFT Passports</title>
        <meta
          name="description"
          content="Gate membership to your DAO with NFT Passports"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Welcome to NFT Passports!</h1>
        <ConvertKit />
      </main>
    </div>
  );
};

export default Home;
