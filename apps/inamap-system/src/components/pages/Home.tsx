
import { useTheme } from "@mui/material";
import { useTranslate } from "../hooks/usePolyglotTranslation";
import Promo from "../theme/components/promo/Promo";
import VideoPromo from "../theme/components/promo/VideoPromo";
import HeroThree from "../theme/themes/index-3/HeroThree";
import Download from "../theme/pages/Download";
import CtaSignup from "../theme/components/cta/CtaSignup";

export default function Home() {
  const theme = useTheme();
  const isLightMode = theme.palette.mode === "light";
  const translate = useTranslate();

  return (
    <>
      <HeroThree />
      <Promo />
      <VideoPromo />
      <Download />
      <CtaSignup bgColor={true} />
      {/*<Promo />
      <Features />
      <FeatureImgThree />
      <VideoPromo />
      <Price hasBg={true} />
      <Screenshot hasBg={true} />
      <LatestNewsOne bgColor="primary-bg" light={isLightMode} />
      <Team hasTitle={true} bgColor={"#336699"} />
      <Contact bgColor />
      <BrandCarousel hasBg={true} />
      <Subsribe />*/}

    </>
  );
}
