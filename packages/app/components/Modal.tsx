// TODO: refactor. Most of this can be migrated to Topo or at least
//       swapped out with a Topo component.

import { styled, theme, Modal, Box, Input } from "@cabindao/topo";
export { Modal } from "@cabindao/topo";

export const ModalInput = styled(Input, {
  paddingLeft: 8,
  border: "1px solid $forest",
  borderRadius: 5,
  fontWeight: 600,
  width: "100%",
});

export const ModalContent = styled("div", {
  color: "$forest",
  marginTop: "-8px",
  width: "400px",
  minHeight: "440px",
});

export const ModalLabel = styled(`h2`, { marginBottom: 32 });

export const ModalInputBox = styled(Box, { marginBottom: 25 });

export const ModalInputLabel = styled(`label`, {
  fontFamily: `var(--fonts-mono)`,
  fontWeight: 600,
  fontSize: `var(--fontSizes-sm)`,
  textTransform: "uppercase",
  marginRight: 10,
});

const modalComponents = {
  Modal,
  ModalInput,
  ModalContent,
  ModalLabel,
  ModalInputBox,
  ModalInputLabel,
};

export default modalComponents;
