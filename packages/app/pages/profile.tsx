import { NextPage } from "next";
import { Web3Provider } from "../components/Web3Context";
import { UserProfile } from "@clerk/nextjs";
import Layout from "../components/Layout";
import { styled } from "@cabindao/topo";

const UserProfileContainer = styled("div", {
  "& .cl-component.cl-user-profile": {
    background: "transparent",
  },
  "& .cl-powered-by-clerk-container.cl-powered-by-clerk": {
    display: "none",
  },
});

const ProfileContent = () => {
  return (
    <Layout>
      <UserProfileContainer>
        <UserProfile />
      </UserProfileContainer>
    </Layout>
  );
};

const Profile: NextPage = () => {
  return (
    <Web3Provider>
      <ProfileContent />
    </Web3Provider>
  );
};

export default Profile;
