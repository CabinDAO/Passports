import { Button, styled } from "@cabindao/topo";
import { PlusIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link"
import {
  useUser,
} from "@clerk/nextjs";

const OuterNav = styled("nav", {
  width: "80px",
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  padding: "15px 5px",
  background: "$forest",
  borderRight: "2px solid $green900",
});

const OrganizationNav = styled("nav", {
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
});

const NavButton = styled("div", {
  padding: "5px",
});

const NavImage = styled(Image, {
  borderRadius: "15px",
});

const NavIndicator = ({ src, path }: { src: string; path: string }) => {
  return (
    <NavButton>
      <Link href={path}>
        <a>
          <NavImage width={60} height={60} src={src} />
        </a>
      </Link>

    </NavButton>
  );
};

const CommunitySwitch = () => {
  const user = useUser();
  return (
    <OuterNav>
      <OrganizationNav>
        <NavIndicator
          src={user.user?.profileImageUrl || "/logo.png"}
          path={"/passport"}
        />
        <NavIndicator src={"/logo.png"} path={"/"} />
      </OrganizationNav>
      <Button tone="wheat" type="primary">
        <PlusIcon height={"16px"} width={"16px"} />
      </Button>
    </OuterNav>
  );
}

export default CommunitySwitch;
