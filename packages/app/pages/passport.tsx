import type { GetServerSideProps, NextPage } from "next";

import { withServerSideAuth } from "@clerk/nextjs/ssr";
import type { User } from "@clerk/clerk-sdk-node";

import { getCommunitiesByUser } from "@/utils/firebase";

import { styled, Button, Box, Heading, Text } from "@cabindao/topo";
import Layout from "@/layouts/PageLayout";
import PageTitle from "@/components/PageTitle";
import ProfileHeader from "@/components/ProfileHeader";
import CommunityCard from "@/components/CommunityCard";

const UserContent = styled("div", {
  display: "grid",
  gap: "16px",
  padding: "0 8px 24px",
  flexGrow: 1,
  overflowY: "auto",
  "&::-webkit-scrollbar": {
    width: 0,
  },
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
});

{
  /*
   * TODO: merge <Profile /> and <ProfileContent /> into a single component
   */
}
const ProfileContent = ({ communities, ...rest }: PageProps) => {
  return (
    <>
      <ProfileHeader tab="communities" {...rest} />
      <UserContent>
        {communities.map((c, i) => (
          <CommunityCard key={`${c.symbol} ${i}`} {...c} />
        ))}
      </UserContent>
    </>
  );
};

const Profile = (props: PageProps) => {
  return (
    <Layout title={<PageTitle>Passport</PageTitle>}>
      <ProfileContent {...props} />
    </Layout>
  );
};

type PageProps = Awaited<ReturnType<typeof getProfileProps>>;

{
  /*
   * TODO: User will have to already be signed in in order to see this page, so
   * we should already have the user object
   */
}
export const getProfileProps = (user: User) => {
  const userId = user.id!;
  return getCommunitiesByUser(userId).then((communities) => ({
    communities,
    name:
      user.username ||
      `${user.firstName} ${user.lastName}`.trim() ||
      user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
        ?.emailAddress ||
      user.web3Wallets[0].web3Wallet ||
      userId,
    passportNumber: userId,
    avatar: user.profileImageUrl || "/logo.png",
  }));
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
      return getProfileProps(user).then((props) => ({
        props,
      }));
    },
    { loadUser: true }
  );

export default Profile;
