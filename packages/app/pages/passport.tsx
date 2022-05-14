import { GetServerSideProps, NextPage } from "next";
import Layout from "../components/Layout";
import { styled } from "@cabindao/topo";
import PageTitle from "../components/PageTitle";

const UserProfileContainer = styled("div", {});

const UserProfileHero = styled("div", {
  padding: "24px 32px",
  background: "$forest",
  minHeight: "232px",
});

const ProfileContent = () => {
  return (
    <UserProfileContainer>
      <UserProfileHero></UserProfileHero>
    </UserProfileContainer>
  );
};

type PageProps = {};

const Profile: NextPage = () => {
  return (
    <Layout title={<PageTitle>Passport</PageTitle>}>
      <ProfileContent />
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps, {}> = (
  context
) => {
  return Promise.resolve({
    props: {
      // fetch user data
    },
  });
};

export default Profile;
