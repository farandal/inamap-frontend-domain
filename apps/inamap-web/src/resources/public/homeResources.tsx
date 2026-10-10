import { IDashAutoAdminResourceConfig } from "dash-auto-admin";
import BusinessIcon from "@mui/icons-material/Business";
import HomeIcon from "@mui/icons-material/Home";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import React from "react";
import Home from "@app/components/pages/Home";
import { isPreRelease } from "@app/utils/releaseStage";

export const HomeResources: IDashAutoAdminResourceConfig[] = [
    {
        roles: ["*"],
        listComponent: (resourceConfig) => { return <Home/> },
        model: "home",
        path: "/",
        schema: [],
        label: "menu.home",
        //group: "Public",
        icon: <HomeIcon />,
        menuOnly: true,
        redirect: "/",
    },
    // Plans is hidden while in pre-release mode
    ...(isPreRelease() ? [] : [{
        roles: ["*"],
        model: "plans",
        path: "/plans",
        schema: [],
        label: "menu.plans",
        //group: "Public",
        icon: <PriceCheckIcon />,
        menuOnly: true,
        redirect: "/plans",
    }]),
];

export default HomeResources;