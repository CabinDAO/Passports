import { users } from "@clerk/clerk-sdk-node";
import { GetServerSideProps } from "next";
import Profile, { getProfileProps } from "../passport";

// REFACTOR: Not sure we need these pages. Regardless, refactor /passport/stamps, /passport/:address, and /passport/:address/stamps
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
  return getProfileProps(user).then((props) => ({
    props,
  }));
};

export default Profile;
