import { keyframes, styled } from "@cabindao/topo";

const Position = styled("div", {
  position: "relative",
});

const BackgroundSvgContainer = styled("span", {
  transform: `rotate(-90deg)`,
  display: `inline-block`,
  transition: `transform 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms`,
  color: `#eeeeee`,
});

const loading = keyframes({
  "0%": {
    transform: "rotate(0deg)",
  },
  "100%": {
    transform: "rotate(360deg)",
  },
});

const ForegroundSvgContainer = styled("span", {
  display: "inline-block",
  animation: `550ms linear 0s infinite normal none running ${loading}`,
  color: "#1a90ff",
  position: "absolute",
  left: 0,
});

const ForegroundCircle = styled("circle", {
  stroke: "$forest",
  strokeDasharray: "80px, 200px",
  strokeDashoffset: 0,
});

// Inspired by the former Facebook spinners.
const Loading = ({
  size = 40,
  thickness = 4,
}: {
  size?: string | number;
  thickness?: number;
}) => {
  return (
    <Position>
      <BackgroundSvgContainer
        role="progressbar"
        aria-valuenow={100}
        css={{
          width: typeof size === "number" ? `${size}px` : size,
          height: typeof size === "number" ? `${size}px` : size,
        }}
      >
        <svg viewBox="22 22 44 44">
          <circle
            cx={44}
            cy={44}
            r="20.5"
            fill="none"
            strokeWidth={thickness}
            style={{
              strokeDasharray: "128.805",
              strokeDashoffset: 0,
              stroke: "currentcolor",
              transition:
                "stroke-dashoffset 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
            }}
          />
        </svg>
      </BackgroundSvgContainer>
      <ForegroundSvgContainer
        css={{
          width: typeof size === "number" ? `${size}px` : size,
          height: typeof size === "number" ? `${size}px` : size,
        }}
      >
        <svg viewBox="22 22 44 44">
          <ForegroundCircle
            cx="44"
            cy="44"
            r="20.5"
            fill="none"
            strokeWidth={thickness}
          />
        </svg>
      </ForegroundSvgContainer>
    </Position>
  );
};

export default Loading;
