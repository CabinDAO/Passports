import { NextPage } from "next";
import CommunityLayout from "../components/CommunityLayout";
import { styled } from "@cabindao/topo";

const ProfileContent = () => {
  return <h1>Community Profile coming soon!</h1>;
};

const Profile: NextPage = () => {
  return (
    <CommunityLayout>
      <ProfileContent />
    </CommunityLayout>
  );
};

export default Profile;
