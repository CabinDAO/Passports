import { NextPage } from "next";
import CommunityLayout from "@/layouts/CommunityLayout";

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
