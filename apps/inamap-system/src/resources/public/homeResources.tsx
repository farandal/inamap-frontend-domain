import { IDashAutoAdminResourceConfig } from "dash-auto-admin";
import BusinessIcon from "@mui/icons-material/Business";
import ResourceTemplate from "dash-admin/templates/ResourceTemplate";
import React from "react";
import Home from "@app/components/pages/Home";

const Icon = BusinessIcon as unknown as React.FC;

const HomeResources: IDashAutoAdminResourceConfig[] = [
    {
    roles: ["*"],
    listComponent: (resourceConfig) => { return <Home/> },
    model: "home",
    path: "/",
    schema: [],
    label: "Home",
    icon: <Icon />
}];

export default HomeResources;