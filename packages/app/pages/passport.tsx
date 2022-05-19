import type { GetServerSideProps, NextPage } from "next";
import Image from "next/image";
import Layout from "../components/Layout";
import { Button, styled } from "@cabindao/topo";
import PageTitle from "../components/PageTitle";
import { withServerSideAuth } from "@clerk/nextjs/ssr";
import type { User } from "@clerk/clerk-sdk-node";
import { useRouter } from "next/router";
import { getCommunitiesByUser } from "../components/firebase";

const UserProfileContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  maxHeight: "100%",
});

const UserProfileHero = styled("div", {
  padding: "24px 32px",
  background: "$forest",
  minHeight: "232px",
  display: "flex",
  alignItems: "center",
  marginBottom: "24px",
  flexShrink: 0,
});

const UserInfo = styled("div", {
  flexGrow: 1,
});

const UserPersonalInfo = styled("div", {
  width: "min-content",
  marginBottom: "40px",
});

const UserName = styled("h1", {
  fontSize: "32px",
  fontFamily: "$mono",
  fontWeight: 600,
  color: "$sand",
});

const UserDivider = styled("hr", {
  background: "$sprout",
  margin: "16px 0",
  height: "1px",
  border: 0,
});

const PassportNumber = styled("h2", {
  textTransform: "uppercase",
  fontSize: "18px",
  fontFamily: "$mono",
  fontWeight: 600,
  color: "$sand",
  whiteSpace: "nowrap",
});

const UserTabs = styled("div", {
  display: "flex",
  gap: "16px",
});

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

const AvatarContainer = styled("div", {
  "> span": {
    borderRadius: "50%",
  },
});

export const ProfileLayout: React.FC<{
  tab: "communities" | "stamps";
  name: string;
  passportNumber: string;
  avatar: string;
}> = ({ children, tab, name, passportNumber, avatar }) => {
  const router = useRouter();
  const { asPath } = router;
  const base = asPath.replace(/\/stamps$/, "");
  return (
    <UserProfileContainer>
      <UserProfileHero>
        <UserInfo>
          <UserPersonalInfo>
            <UserName>{name}</UserName>
            <UserDivider />
            <PassportNumber>Passport NO: {passportNumber}</PassportNumber>
          </UserPersonalInfo>
          <UserTabs>
            <Button
              tone="wheat"
              type={tab === "communities" ? "primary" : "secondary"}
              // @ts-ignore TODO update TOPO Button
              css={{
                minWidth: "144px",
              }}
              onClick={() => router.push(base)}
            >
              Communities
            </Button>
            <Button
              tone="wheat"
              type={tab === "stamps" ? "primary" : "secondary"}
              // @ts-ignore TODO update TOPO Button
              css={{
                minWidth: "144px",
              }}
              onClick={() => router.push(`${base}/stamps`)}
            >
              Stamps
            </Button>
          </UserTabs>
        </UserInfo>
        <AvatarContainer>
          <Image src={avatar} width={120} height={120} alt={"Profile Image"} />
        </AvatarContainer>
      </UserProfileHero>
      {children}
    </UserProfileContainer>
  );
};

const CommunityContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 4px 15px rgb(0 0 0 / 0.25)",
});

const CommunityContent = styled("div", {
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: "20px",
});

const CommunityHeader = styled("div", {
  background: "$forest",
  color: "$sand",
  textTransform: "capitalize",
  padding: "10px 20px",
  fontFamily: "$mono",
  fontSize: "16px",
});

const CommunityThumbnail = styled("div", {
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

const CommunityDescription = styled("div", {
  margin: "20px 0px",
  fontFamily: "$mono",
  fontSize: "14px",
  fontWeight: 400,
  flexGrow: 1,
});

const CommunityFields = styled("div", {
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

const ProfileContent = ({ communities, ...rest }: PageProps) => {
  return (
    <ProfileLayout tab="communities" {...rest}>
      <UserContent>
        {communities.map((c) => (
          <CommunityContainer key={c.symbol}>
            <CommunityHeader>
              {c.name} ({c.symbol})
            </CommunityHeader>
            <CommunityContent>
              <CommunityThumbnail>
                <Image
                  src={c.thumbnail}
                  alt={"Thumbnail"}
                  height={"100%"}
                  width={"100%"}
                />
              </CommunityThumbnail>
              <CommunityDescription>{c.description}</CommunityDescription>
              <CommunityFields>
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
              </CommunityFields>
            </CommunityContent>
          </CommunityContainer>
        ))}
      </UserContent>
    </ProfileLayout>
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
