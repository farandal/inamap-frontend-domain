import { Card } from "@mui/material";
import { getCookie } from "dash-admin/src/utils/cookies";
import { useAxios } from 'dash-axios-hook';
import { useDialog } from "dash-dialog";
import React, { useRef, useEffect, useState, lazy, Suspense } from "react";
import { useRedirect, useGetList, useRefresh, Loading, Toolbar, SaveButton, SimpleForm, useResourceContext, useDataProvider } from "react-admin";
import useVirtualHash from 'dash-auto-admin/src/hooks/useVirtualHash';

import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';
import {DASHAppConstants} from "dash-constants";
import { parseAxiosError } from "dash-admin/src/helpers/parseAxiosError";
import DnDTreeGrid from "./DnDTreeGrid";
import { dashStorage } from "dash-utils";

//const DnDTreeGrid = lazy(() => import("./DnDTreeGrid"));

const convertArrayToObject = (array, key) => {
    const initialValue = {};
    return array.reduce((obj, item) => {
        return {
            ...obj,
            [item[key]]: item,
        };
    }, initialValue);
};
export interface ICategoryTree {
    title: string;
    categories: any[];
}

const parsetreeCategory = (category: any) => {
    return {
        title: category.name,
        id: category.id,
        key: category.id,
        is_primary: category.is_primary,
        children: category.subcategories.map((cat) => parsetreeCategory(cat)),
    }
}

const getParentKey = (key: React.Key, tree: any[]): React.Key => {
    let parentKey: React.Key;
    for (let i = 0; i < tree.length; i++) {
        const node = tree[i];
        if (node.children) {
            if (node.children.some(item => item.key === key)) {
                parentKey = node.key;
            } else if (getParentKey(key, node.children)) {
                parentKey = getParentKey(key, node.children);
            }
        }
    }
    return parentKey!;
};

const URL_PREFIX = DASHAppConstants.system.URL_PREFIX;

const CategoryEdit: React.FC<IDashAutoAdminCustomFieldComponent> = ({ method, attribute }) => {
    const [fetchOnce, setFetchOnce] = useState(false);

    const dataProvider = useDataProvider();
    const resource = useResourceContext();

    const { data, total, isLoading, error, isFetching } = useGetList(
        'inamap/categories',
        {
            /* @ts-ignore mismatch */
            pagination: false,
            sort: { field: 'tree_index', order: 'ASC' },
            filter: {}
        },
        { refetchOnWindowFocus: false }
    );

    const refresh = useRefresh();
    const { setVirtualHash } = useVirtualHash();
    const dialog = useDialog();

    useEffect(() => {
        const timer = async () => {
            setFetchOnce(true);
            setTimeout(() => {
                setFetchOnce(false)
            }, 300)
        }
        timer();
    }, [data])

    const onError = (_error: any) => {

        dialog({
            variant: 'danger',
            title: `Error`,
            content: `${parseAxiosError(_error)}`,
            onConfirm: () => { },
            onClose: () => { },
        });

    };

    const editFn = (e: Event, index: number, record: any): void => {
        e.preventDefault();
        e.stopPropagation();

        const vhash = `${URL_PREFIX}inamap/categories/inline/${record.id}/edit`;
        setVirtualHash(vhash);
    };

    const deleteFn = (e: Event, index: number, record: any): void => {

        e.preventDefault();
        e.stopPropagation();

        dialog({
            variant: 'info',
            title: 'Eliminar Categoría',
            content: <>Está seguro que desea eliminar ésta categoría</>,
            showCancelButton: true,
            onConfirm: async () => {
                try {
                    const { data } = await dataProvider.delete(resource, { id: record.id });
                    console.log(data);

                } catch (e) {
                    onError(e);
                } finally {
                    refresh();
                }
            },
        });

    };

    if (isLoading) return <Loading />;
    if (fetchOnce) return <Loading />;

    return <>
        <Suspense fallback={<Loading />}>
            <DnDTreeGrid data={data} onEdit={editFn} onDelete={deleteFn} />
        </Suspense>
    </>

    /*return <CategoryTree
        title={'titulo'}
        categories={data}
    />*/
    // const CategoryMappers = useMemo(() => {

    // }, [data]);


    // return <>{CategoryMappers}</>
}

// const MarketplacesCategoryMapperView: React.FC<IDashAutoAdminCustomFieldComponent> = ({ method, attribute }) => {
//     const category: Category = useRecordContext();

//     const columns = [
//         {
//             title: 'Valor',
//             dataIndex: 'text',
//             key: 'name',
//         }
//     ]
//     return (
//         <Table columns={columns} dataSource={category?.input_category_mappings} bordered rowClassName="editable-row" pagination={false} />
//     )
// }

const CustomToolbar = (props) => (
    <Toolbar {...props} >
        <SaveButton alwaysEnable={true} />
    </Toolbar>
);

const CategoryListComponent = ({ method, attribute, resourceConfig }: IDashAutoAdminCustomFieldComponent) => {
    const axios = useAxios();
    const redirect = useRedirect();
    const refresh = useRefresh();
    const resource = useResourceContext();

    const dialog = useDialog();
    const onSave = async (formData) => {
        console.log(formData)
        const tenant_id = dashStorage.getItem('tenant_id');
        try {
            const { data } = await axios.post(`${resource}/updateTree`, { updatedTree: formData.treeData, tenant_id });
            refresh();
            redirect(`/${resource}`);
            console.log(data)
        } catch (error: any) {

            dialog({
                variant: "danger",
                title: "Error",
                content: error.response.data.message ?? "Ha ocurrido un error",
                onSubmit: () => { },
                onClose: () => { }
            });

        }
    };
    return <div title={"Categorías"} style={{ width: '100%' }}>
        <SimpleForm toolbar={<CustomToolbar />} noValidate onSubmit={onSave} >

            <CategoryEdit attribute={attribute} method={method} resourceConfig={resourceConfig} />
        </SimpleForm>
    </div>
    // switch (method) {
    //     case "edit":
    //     case "create":
    // return <CategoryEdit attribute={attribute} method={method} resourceConfig={resourceConfig} />
    //     case "view":
    //         return <MarketplacesCategoryMapperView attribute={attribute} method={method} resourceConfig={resourceConfig} />
    // }
}

export default CategoryListComponent;
