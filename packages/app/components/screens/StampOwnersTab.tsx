import { styled, theme, Button } from "@cabindao/topo";
import StampAPassport from "@/components/StampAPassport";

const OwnerTable = styled("table", {
  textAlign: "left",
  fontWeight: 600,
  color: "$forest",
  textTransform: "capitalize",
  fontSize: "14px",
  fontFamily: "$mono",
  borderCollapse: "separate",
});

const OwnerTableRow = styled("tr", {
  borderBottom: "1px solid $forest",
});

const OwnerTableCell = styled("td", {
  padding: "4px 12px",
});

const OwnerTableHeaderCell = styled("td", {
  padding: "4px 12px",
});

const PaginatedContainer = styled("td", {
  display: "flex",
  gap: "16px",
});

const CreateStampContainer = styled("div", {
  borderRadius: "48px",
  border: "1px solid $forest",
  background: "rgba(29, 43, 42, 0.05)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  padding: "72px",
  fontWeight: 600,
});

const CreateStampHeader = styled("h1", {
  fontSize: "24px",
  lineHeight: "31.2px",
  fontFamily: "$mono",
});

const StampOwnersTab = ({ offset, size, loading, loadOwners, ...props }) => {
  return (
    <>
      {Object.keys(props.users || {}).length ? (
        <OwnerTable>
          <thead>
            <OwnerTableRow>
              <OwnerTableHeaderCell css={{ width: "64px" }}>
                ID
              </OwnerTableHeaderCell>
              <OwnerTableHeaderCell>NAME</OwnerTableHeaderCell>
              <OwnerTableHeaderCell>ADDRESS</OwnerTableHeaderCell>
            </OwnerTableRow>
          </thead>
          <tbody>
            {Object.entries(props.users || {})
              .flatMap(([addr, { tokens, name }]) =>
                tokens.map((id) => [id, name, addr] as const)
              )
              .sort((a, b) => a[0] - b[0])
              .map((a) => (
                <OwnerTableRow key={a[0]}>
                  <OwnerTableCell>{a[0]}</OwnerTableCell>
                  <OwnerTableCell>{a[1]}</OwnerTableCell>
                  <OwnerTableCell>{a[2]}</OwnerTableCell>
                </OwnerTableRow>
              ))}
          </tbody>
          <tfoot>
            <tr>
              <OwnerTableCell />
              <OwnerTableCell>
                Page {Number(offset) / Number(size) + 1} of{" "}
                {Math.ceil((props.userTotal || 0) / Number(size))}
              </OwnerTableCell>
              <OwnerTableCell>
                <PaginatedContainer>
                  <Button
                    disabled={loading || offset === "0"}
                    onClick={() => {
                      const params = new URLSearchParams({
                        offset: (Number(offset) - Number(size)).toString(),
                        tab: tab as string,
                      });
                      router.push(`${base}?${params.toString()}`);
                    }}
                  >
                    Prev
                  </Button>
                  <Button
                    disabled={
                      loading ||
                      Number(offset) + Number(size) >= (props.userTotal || 0)
                    }
                    onClick={() => {
                      const params = new URLSearchParams({
                        offset: (Number(offset) + Number(size)).toString(),
                        tab: tab as string,
                      });
                      router.push(`${base}?${params.toString()}`);
                    }}
                  >
                    Next
                  </Button>
                </PaginatedContainer>
              </OwnerTableCell>
            </tr>
          </tfoot>
        </OwnerTable>
      ) : (
        <CreateStampContainer>
          <CreateStampHeader>Get started using stamps</CreateStampHeader>
          <StampAPassport
            label={`${props.name} (${props.symbol})`}
            version={props.version}
            address={props.address}
            // TODO replace with a callback that edits UI directly
            onStampSuccess={loadOwners}
          />
        </CreateStampContainer>
      )}
    </>
  );
};

export default StampOwnersTab;
