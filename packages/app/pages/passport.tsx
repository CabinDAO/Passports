import type { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import Layout from "../components/Layout";
import { Button, styled } from "@cabindao/topo";
import PageTitle from "../components/PageTitle";
import { useUser } from "@clerk/nextjs";
import { withServerSideAuth } from "@clerk/nextjs/ssr";

const UserProfileContainer = styled("div", {});

const UserProfileHero = styled("div", {
  padding: "24px 32px",
  background: "$forest",
  minHeight: "232px",
});

const UserInfo = styled("div", {});

const UserPersonalInfo = styled("div", {});

const UserName = styled("h1", {});

const UserDivider = styled("hr", {
  background: "$sprout",
  margin: "16px 0",
  height: "1px",
  border: 0,
});

const PassportNumber = styled("h2", {});

const UserTabs = styled("div", {});

const UserContent = styled("div", {});

export const ProfileLayout: React.FC<{ tab: "communities" | "stamps" }> = ({
  children,
  tab,
}) => {
  const user = useUser();
  return (
    <UserProfileContainer>
      <h1>Page Under Construction. Check back later!</h1>
      <UserProfileHero>
        <UserInfo>
          <UserPersonalInfo>
            <UserName>{user.user?.username}</UserName>
            <UserDivider />
            <PassportNumber>Passport NO: {user.user?.id}</PassportNumber>
          </UserPersonalInfo>
          <UserTabs>
            <Button
              tone="wheat"
              type={tab === "communities" ? "primary" : "secondary"}
            >
              Communities
            </Button>
            <Button
              tone="wheat"
              type={tab === "stamps" ? "primary" : "secondary"}
            >
              Stamps
            </Button>
          </UserTabs>
        </UserInfo>
        <Image
          src={user.user?.profileImageUrl || ""}
          width={120}
          height={120}
          alt={"Profile Image"}
        />
      </UserProfileHero>
      <UserContent>{children}</UserContent>
    </UserProfileContainer>
  );
};

const CommunityContainer = styled("div", {});

const CommunityHeader = styled("div", {});

const CommunityThumbnail = styled("div", {});

const CommunityDescription = styled("div", {});

const CommunityFields = styled("div", {});

const ProfileContent = (props: PageProps) => {
  return (
    <ProfileLayout tab="communities">
      {props.communities.map((c) => (
        <CommunityContainer key={c.symbol}>
          <CommunityHeader>
            {c.name} ({c.symbol})
          </CommunityHeader>
          <CommunityThumbnail></CommunityThumbnail>
          <CommunityDescription></CommunityDescription>
          <CommunityFields></CommunityFields>
        </CommunityContainer>
      ))}
    </ProfileLayout>
  );
};

type PageProps = {
  communities: Awaited<ReturnType<typeof getCommunitiesByUser>>;
};

const Profile = (props: PageProps) => {
  return (
    <Layout title={<PageTitle>Passport</PageTitle>}>
      <ProfileContent {...props} />
    </Layout>
  );
};

// fetch user data
const getCommunitiesByUser = async (userId: string) => [
  {
    name: "ACME Corporation",
    symbol: "AC",
    description:
      "Acme Corporation is a member-owned global network of independent, innovative hubs powered by web3.",
    quantity: 3000,
  },
  {
    name: "House DAO",
    symbol: "HDAO",
    description:
      "House DAO is a member-owned global network of independent, innovative hubs powered by web3.",
    quantity: 230,
  },
  {
    name: "Rocket Science",
    symbol: "RS",
    description:
      "Acme Corporation is a member-owned global network of independent, innovative hubs powered by web3.",
    quantity: 7100403,
  },
];

export const getServerSideProps: GetServerSideProps<PageProps, {}> =
  withServerSideAuth((context) => {
    const { userId } = context.req.auth;
    if (!userId)
      return {
        props: { communities: [] },
      };
    return getCommunitiesByUser(userId).then((communities) => ({
      props: {
        communities,
      },
    }));
  });

export default Profile;
