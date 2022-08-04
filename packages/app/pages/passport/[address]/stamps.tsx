import { users } from "@clerk/clerk-sdk-node";
import { GetServerSideProps } from "next";
// TODO: migrate Profile to components or screens
import Profile, { getProfileProps } from "../stamps";

export const getServerSideProps: GetServerSideProps<
  Awaited<ReturnType<typeof getProfileProps>>,
  { address: string }
> = async (context) => {
  const { address = "" } = context.params || {};
  const [user] = await users.getUserList({
    web3Wallet: [address.toLowerCase()],
  });
  const userId = user?.id;
  if (!user || !userId)
    return {
      notFound: true,
    };
  return getProfileProps(user)
    .then((props) => ({
      props,
    }))
    .catch(() => ({ notFound: true }));
};

export default Profile;
