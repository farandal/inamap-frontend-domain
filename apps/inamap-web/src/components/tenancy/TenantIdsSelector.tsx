import {
    Box,
    Chip,
} from "@mui/material";

import React, { useEffect, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import { Loading, SearchInput, useEditContext } from "react-admin";


import { List } from "react-admin";
import { TopToolbar } from "react-admin";
import { Datagrid } from "react-admin";
import { TextField } from "react-admin";
import { useListContext } from "react-admin";
import { useRecordContext } from "react-admin";
import { PaginationComponent } from "dash-components";
import { useRecordSelection } from 'react-admin'
import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";


const ListAutoSelectIds = ({ resource, selectedIdsFn }) => {
    const { data, isLoading } = useListContext();
    //const { record: systemMarketplace, isPending } = useEditContext<any>();
    const record = useRecordContext<any>();
    const [finalSelectedIds, setFinalSelectedIds] = useState([]);
    const [selectedIds, { select }] = useRecordSelection({ resource });

    useEffect(() => {

        if (isLoading) return;

        let _selectedIds = [];

        /*if (data?.length) {
            _selectedIds = [...new Set([..._selectedIds, ...data.map(p => p.id)])];
        }*/

        if (record && record?.tenant_ids) {
            _selectedIds = [...new Set([..._selectedIds, ...record.tenant_ids])];
        }

        setFinalSelectedIds(_selectedIds);

    }, [data, record, isLoading]);

    useEffect(() => {
        if (!selectedIds || !selectedIds.length) return;

        if (selectedIdsFn) selectedIdsFn(selectedIds);
    }, [selectedIds]);


    useEffect(() => {
        if (!finalSelectedIds) return

        select(finalSelectedIds);
        //if (selectedIdsFn) selectedIdsFn(finalSelectedIds);

    }, [finalSelectedIds])

    return (
        <></>
    );
}

export const TenantIdsSelectorEdit: React.FC<IDashAutoAdminCustomFieldComponent> = ({
   attribute,resourceConfig }) => {


    const { record, isPending } = useEditContext<any>();
    const { setValue, control } = useFormContext(/*{ shouldUseNativeValidation: true }*/);

    const tenant_ids = useController({ name: "tenant_ids" });

    useEffect(() => {
     
        setValue("tenant_ids", record?.systemMarketplace ? record.tenant_ids.map(p => p.id) : []);
    

    }, [record]);


    return (<>
        {record && (
            <>
                <h1>Tenants asociados</h1>
                <Box sx={{ width: "100%" }}>
                    <List
                        disableSyncWithLocation
                        resource='tenancy/tenants'
                        /* This adds the filter button, but the problem this component is already in a form, cannot contain a nested form */
                        //actions={<TopToolbar><FilterButton /></TopToolbar>}
                        //filters={[<TextInput label="Buscar" source="q" />]}

                        actions={<TopToolbar></TopToolbar>}
                        filters={[<SearchInput source="q" placeholder="Buscar" alwaysOn fullWidth />]}

                        pagination={<PaginationComponent />}
                        storeKey='tenancy-tenants'
                        empty={<Loading />}
                        emptyWhileLoading={true}


                    >
                        <ListAutoSelectIds resource={'tenancy/tenants'} selectedIdsFn={(p) => {
                            tenant_ids.field.onChange(p);
                        }} />
                        <Datagrid

                            bulkActionButtons={<></>}


                        >
                            <TextField source="id" />
                            <TextField source="name" label='Nombre' />
                       
                        </Datagrid>
                      
                    </List>
                </Box>
            </>
        )}

    </>);
};



export const TenantIdsSelectorCreate: React.FC<IDashAutoAdminCustomFieldComponent> = ({
   attribute,resourceConfig }) => {


   
    const { setValue, control } = useFormContext(/*{ shouldUseNativeValidation: true }*/);

    const tenant_ids = useController({ name: "tenant_ids" });

    useEffect(() => {
        setValue("tenant_ids", []);
    }, []);


    return (
            <>
                <h1>Tenants asociados</h1>
                <Box sx={{ width: "100%" }}>
                    <List
                        disableSyncWithLocation
                        resource='tenancy/tenants'
                        /* This adds the filter button, but the problem this component is already in a form, cannot contain a nested form */
                        //actions={<TopToolbar><FilterButton /></TopToolbar>}
                        //filters={[<TextInput label="Buscar" source="q" />]}

                        actions={<TopToolbar></TopToolbar>}
                        filters={[<SearchInput source="q" placeholder="Buscar" alwaysOn fullWidth />]}

                        pagination={<PaginationComponent />}
                        storeKey='tenancy-tenants'
                        empty={<Loading />}
                        emptyWhileLoading={true}


                    >
                        <ListAutoSelectIds resource={'tenancy/tenants'} selectedIdsFn={(p) => {
                            tenant_ids.field.onChange(p);
                        }} />
                        <Datagrid

                            bulkActionButtons={<></>}


                        >
                            <TextField source="id" />
                            <TextField source="name" label='Nombre' />
                       
                        </Datagrid>
                      
                    </List>
                </Box>
            </>
        );
};

export const TenantIdsSelectorView: React.FC<IDashAutoAdminCustomFieldComponent> = ({attribute,
   resourceConfig }) => {


    const record = useRecordContext<any>();
  
    return (<>
        {record && (
                <Box sx={{ width: "100%" }}>
                    {record.tenants?.map((tenant: any) => (
                        <Chip
                            key={tenant.id}
                            label={tenant.name}
                            sx={{ margin: 0.5 }}
                        />
                    ))}
                </Box>
        )}
    </>);
};




const TenantIdsSelector = ({ method, attribute, resourceConfig }: IDashAutoAdminCustomFieldComponent) => {

  switch (method) {
    case "edit":
      return <TenantIdsSelectorEdit attribute={attribute} method={method} resourceConfig={resourceConfig} />
    case "create":
      return <TenantIdsSelectorCreate attribute={attribute} method={method} resourceConfig={resourceConfig} />
   
    case "view":
    case "list":    
      return <TenantIdsSelectorView attribute={attribute} method={method} resourceConfig={resourceConfig} />
  }
}

export default TenantIdsSelector;