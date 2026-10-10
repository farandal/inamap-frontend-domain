import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React from "react";
import { Box } from "@mui/material";
import TenancyAccountDelete from "./TenancyAccountDelete";
import TenancyDataExport from "./TenancyDataExport";

interface TenancyAccountManagementProps extends IDashAutoAdminCustomFieldComponent {}

/**
 * TenancyAccountManagement Component
 * 
 * Provides account management features for TenancyAdmin users:
 * - Account deletion with confirmation (via TenancyAccountDelete)
 * - Data export functionality (via TenancyDataExport)
 * 
 * Only visible in edit mode.
 * 
 * This is a wrapper component that combines the independent
 * TenancyAccountDelete and TenancyDataExport components.
 */
const TenancyAccountManagement: React.FC<TenancyAccountManagementProps> = ({
    method,
    attribute,
    resourceConfig,
    ...props
}) => {
    // Only show in edit mode
    if (method !== 'edit') {
        return null;
    }

    return (
        <Box sx={{ mt: 4 }}>
            {/* Account Deletion Section */}
            <Box sx={{ mb: 3 }}>
                <TenancyAccountDelete variant="card" />
            </Box>

            {/* Data Export Section */}
            <TenancyDataExport variant="card" showHistory={true} />
        </Box>
    );
};

export default TenancyAccountManagement;

// Re-export the individual components for independent use
export { TenancyAccountDelete, TenancyDataExport };
