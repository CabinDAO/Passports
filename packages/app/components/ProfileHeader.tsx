import { Button, styled, Heading, Box } from "@cabindao/topo";
import Image from "next/image";

const UserProfileContainer = styled("div", {
  display: "flex",
  flexDirection: "column",
  maxHeight: "100%",
});

const UserProfileHero = styled(Box, {
  padding: "24px 32px",
  background: "$forest",
  minHeight: "232px",
  display: "flex",
  alignItems: "center",
  marginBottom: "24px",
  flexShrink: 0,
});

// TODO: replace with divider in Topo
const UserDivider = styled("hr", {
  background: "$sprout",
  margin: "16px 0",
  height: "1px",
  border: 0,
});

const AvatarContainer = styled("div", {
  "> span": {
    borderRadius: "50%",
  },
});

export const ProfileHeader: React.FC<{
  tab: "communities" | "stamps";
  name: string;
  passportNumber: string;
  avatar: string;
}> = ({ children, tab, name, passportNumber, avatar }) => {
  return (
    <UserProfileContainer>
      <UserProfileHero>
        <Box css={{ flexGrow: 1 }}>
          <Box css={{ width: "min-content", mb: "$10" }}>
            <Heading mono as="h1" bold css={{ color: "$sand" }}>
              {name}
            </Heading>
            <UserDivider />
            <Heading
              as="h2"
              mono
              uppercase
              css={{ color: "$sand", fontSize: "$lg", whiteSpace: "nowrap" }}
            >
              Passport No: {passportNumber}
            </Heading>
          </Box>
        </Box>
        <AvatarContainer>
          <Image src={avatar} width={120} height={120} alt={"Profile Image"} />
        </AvatarContainer>
      </UserProfileHero>
    </UserProfileContainer>
  );
};

export default ProfileHeader;
