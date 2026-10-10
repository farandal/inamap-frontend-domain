import { useState } from "react";
import { Box } from "@mui/material";
import KtLanding from "@app/assets/login-back.svg";

/**
 * Static PNG replacement for the layered SVG hero visual, with the intro
 * video's play button overlaid on top (previously its own VideoPromo section).
 * See HeroAnimation.tsx to switch between this and HeroAnimationSvg.
 */
export default function HeroAnimationImage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box sx={{ position: "relative" }}>
      <img
        className="img-fluid d-block m-auto"
        src={KtLanding}
        alt="INAMAP"
      />
    </Box>
  );
}
