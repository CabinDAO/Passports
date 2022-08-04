import { Button, styled } from "@cabindao/topo";
import BaseLayout from "@/layouts/Base";
import CommunitySwitch from "@/components/CommunitySwitch";

const PageContent = styled("div", {
  display: "flex",
  flexDirection: "column",
  padding: "48px",
  position: "relative",
  flexGrow: 1,
});

// TODO: refactor or replace, we have a component like this in multiple places
const PageMain = styled("main", {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  padding: `40px 0`,
  overflow: "auto",
});

type LayoutProps = { title?: React.ReactNode; loading?: boolean };

export const PageLayout: React.FC<LayoutProps> = ({
  children,
  title,
  loading,
}) => {
  return (
    <BaseLayout title={title} loading={loading}>
      <CommunitySwitch />
      <PageContent>
        <PageMain>{children}</PageMain>
      </PageContent>
    </BaseLayout>
  );
};

export default PageLayout;
