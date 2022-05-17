import { styled } from "@cabindao/topo";
import { withServerSideAuth } from "@clerk/nextjs/ssr";
import { GetServerSideProps } from "next";
import React from "react";
import Layout from "../../components/Layout";
import PageTitle from "../../components/PageTitle";
import Image from "next/image";
import { ProfileLayout } from "../passport";

const StampContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 4px 15px rgb(0 0 0 / 0.25)",
});

const StampContent = styled("div", {
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: "20px",
});

const StampHeader = styled("div", {
  background: "$forest",
  color: "$sand",
  textTransform: "capitalize",
  padding: "10px 20px",
  fontFamily: "$mono",
  fontSize: "16px",
});

const StampThumbnail = styled("div", {
  width: "160px",
  height: "120px",
  "> span": {
    borderRadius: "20px",
  },
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
});

const StampDescription = styled("div", {
  margin: "20px 0px",
  fontFamily: "$mono",
  fontSize: "14px",
  fontWeight: 400,
  flexGrow: 1,
});

const StampFields = styled("div", {
  display: "flex",
  justifyContent: "space-between",
});

const MembershipStamp = styled("div", {
  alignItems: "start",
  display: "flex",
  flexDirection: "column",
});

const MembershipQuantity = styled("div", {
  alignItems: "end",
  display: "flex",
  flexDirection: "column",
});

const MembershipField = styled("span", {
  color: "$forest",
  fontFamily: "$mono",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: "8px",
});

const MembershipValue = styled("span", {
  color: "#8B9389",
  fontFamily: "$sans",
  fontSize: 12,
  fontWeight: 500,
});

const ProfileContent = ({ stamps, ...rest }: PageProps) => {
  return (
    <ProfileLayout tab="stamps" {...rest}>
      {stamps.map((c) => (
        <StampContainer key={c.symbol}>
          <StampHeader>
            {c.name} ({c.symbol})
          </StampHeader>
          <StampContent>
            <StampThumbnail>
              <Image
                src={c.thumbnail}
                alt={"Thumbnail"}
                height={"100%"}
                width={"100%"}
              />
            </StampThumbnail>
            <StampDescription>{c.description}</StampDescription>
            <StampFields>
              <MembershipStamp>
                <MembershipField>Membership Stamp</MembershipField>
                <MembershipValue>
                  {c.name} ({c.symbol})
                </MembershipValue>
              </MembershipStamp>
              <MembershipQuantity>
                <MembershipField>Quantity</MembershipField>
                <MembershipValue>{c.quantity}</MembershipValue>
              </MembershipQuantity>
            </StampFields>
          </StampContent>
        </StampContainer>
      ))}
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

const getStampsByUser = async (userId: string) =>
  [] as Record<string, string>[]; // TODO actually fetch stamps

type PageProps = {
  stamps: Awaited<ReturnType<typeof getStampsByUser>>;
  name: string;
  passportNumber: string;
  avatar: string;
};

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
      return getStampsByUser(userId).then((stamps) => ({
        props: {
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
        },
      }));
    },
    { loadUser: true }
  );

export default ProfileStamps;
