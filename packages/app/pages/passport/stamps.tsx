import { styled } from "@cabindao/topo";
import { withServerSideAuth } from "@clerk/nextjs/ssr";
import { GetServerSideProps } from "next";
import React from "react";
import Layout from "../../components/Layout";
import PageTitle from "../../components/PageTitle";
import Image from "next/image";
import { ProfileLayout } from "../passport";
import { getStampsByUser } from "../../components/firebase";
import { useRouter } from "next/router";
import type { User } from "@clerk/clerk-sdk-node";

const StampContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  background: "$forest",
  padding: "16px 24px 40px",
  borderRadius: "20px",
});

const StampHeader = styled("div", {
  color: "$sand",
  textTransform: "capitalize",
  marginBottom: "8px",
  fontFamily: "$mono",
  fontSize: "18px",
  fontWeight: 600,
});

const StampDivider = styled("hr", {
  background: "$sprout",
  margin: "16px 0",
  height: "1px",
  border: 0,
});

const StampThumbnail = styled("div", {
  width: "100%",
  height: "128px",
  "> span": {
    borderRadius: "10px",
  },
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const TabContainer = styled("div", {
  marginBottom: "24px",
  display: "flex",
});

const Tab = styled("div", {
  padding: "8px 16px",
  cursor: "pointer",
  fontFamily: "$sans",
  fontWeight: 600,
  boxSizing: "border-box",
  border: "1px solid $forest",
  variants: {
    active: {
      true: {
        background: "$forest",
        color: "$wheat",
      },
      false: {
        color: "$forest",
        textDecoration: "underline",
      },
    },
  },
});

const UserContent = styled("div", {
  display: "grid",
  gap: "16px",
  paddingBottom: "24px",
  flexGrow: 1,
  overflowY: "auto",
  "&::-webkit-scrollbar": {
    width: 0,
  },
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
});

const ProfileContent = ({ stamps, communities, ...rest }: PageProps) => {
  const router = useRouter();
  const activeTab = (router.query["community"] as string) || "";
  return (
    <ProfileLayout tab="stamps" {...rest}>
      <TabContainer>
        {communities.map((c) => (
          <Tab
            key={c.id}
            active={activeTab === c.id}
            onClick={() => router.push(`/passport/stamps?community=${c.id}`)}
          >
            {c.name}
          </Tab>
        ))}
      </TabContainer>
      <UserContent>
        {stamps.map((c) => (
          <StampContainer key={c.symbol}>
            <StampHeader>
              {c.name} ({c.symbol})<br />
              {c.token}
            </StampHeader>
            <StampDivider />
            <StampThumbnail>
              <Image
                src={c.thumbnail}
                alt={"Thumbnail"}
                height={"100%"}
                width={"100%"}
              />
            </StampThumbnail>
          </StampContainer>
        ))}
      </UserContent>
    </ProfileLayout>
  );
};

const ProfileStamps = (props: PageProps) => {
  return (
    <Layout title={<PageTitle>Passport</PageTitle>}>
      <ProfileContent {...props} />
    </Layout>
  );
};

export const getProfileProps = (user: User) => {
  const userId = user.id!;
  const address = user.web3Wallets[0].web3Wallet;
  const chainId = user.unsafeMetadata.chainId as number;
  if (!address || !chainId) {
    throw new Error("Missing address or chainId");
  }
  return getStampsByUser({ address, chainId }).then((stamps) => ({
    stamps,
    name:
      user.username ||
      `${user.firstName} ${user.lastName}`.trim() ||
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ||
      user.web3Wallets[0].web3Wallet ||
      userId,
    passportNumber: userId,
    avatar: user.profileImageUrl || "/logo.png",
    communities: [
      { id: "CBN", name: "Cabin" },
      { id: "ACME", name: "Acme Corporation" },
      { id: "haus", name: "House DAO" },
      { id: "RS", name: "Rocket Science" },
    ],
  }));
};

type PageProps = Awaited<ReturnType<typeof getProfileProps>>;

export const getServerSideProps: GetServerSideProps<PageProps, {}> =
  withServerSideAuth(
    async (context) => {
      const { user } = context.req;
      const userId = user?.id;
      if (!user || !userId)
        return {
          redirect: {
            statusCode: 302,
            destination: "/",
          },
        };
      return getProfileProps(user)
        .then((props) => ({
          props: props,
        }))
        .catch(() => ({
          redirect: {
            statusCode: 302,
            destination: "/",
          },
        }));
    },
    { loadUser: true }
  );

export default ProfileStamps;
