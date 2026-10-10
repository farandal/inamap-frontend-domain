import { AxiosError } from 'axios';
import queryString from 'query-string';
import { processAxiosError, useAxios } from 'dash-axios-hook';
import { cacheInvalidatorHash } from 'dash-admin/utils/cache/CacheInvalidatorContext';
import { IDashAutoAdminDefaultBackendStructure } from 'dash-axios-hook/interfaces/IDashAutoAdminBackendError';
import { getResourceConfig, processFormData, processPostData } from 'ina-common/data/dataProviderUtils';
import { dashStorage } from 'dash-utils';


const dataProvider = {
    getList: async (resource, params, _options) => {
        let payload = processPostData(
            resource,
            { ...params.data, ...params.filter, ...{ no_cache: true } },
            'getList',
        );

        const axios = useAxios();

        const pagination =
            params.filter && !!params.filter.pagination
                ? params.filter.pagination
                : params.pagination
                    ? params.pagination
                    : false;

        if (pagination) {
            payload = { ...payload, pagination: true, ...pagination };
        } else {
            payload = { ...payload, pagination: false };
        }

        payload = { ...payload, ...params.meta };

        const hasSort = params.sort && params.sort.field && params.sort.order;

        if (hasSort && !params.meta?.removeSortFilters) {
            payload = {
                ...payload,
                ...{ ...params.sort, order: (params.sort.order).toLowerCase() },
            };
        }

        const hash = cacheInvalidatorHash(resource);

        if (hash) {
            payload = {
                ...payload,
                hash
            };
        }

        const processedQuery = queryString.stringify(payload, { arrayFormat: 'bracket' });

        let url = `${resource}?${processedQuery}`;



        const origin = url.includes('forSelect') ? 'forSelect' : url.includes('getMany') ? 'getMany' : 'getList';

        window.dispatchEvent(
            new MessageEvent('auto-admin-loading-state', {
                data: true,
                origin: origin,
                lastEventId: url,
            }),
        );

        try {
            const response = await axios.get(url);
            // The normal output for list pagination from the backend is  response?.data?.data the first data is part of the axios response, the second data is the actual attribute react-admin backend controller implements.
            // But in extraneuous cases, of a custom controller for example, that has not the data key, it will be appended. 
            let results = {};
           
            if(typeof response.data.data.total !== 'undefined') {
                results = response.data.data; // custom endpoints with data.total
            } else if (response?.data) {
                results = response.data;
            } else {
                results = { data: response, total: parseInt(response.headers['content-range']) || 0 };
            }
          
            /* const ret = {
                 data: results.data,
                 total:
                     results && results.total
                         ? results.total
                         : parseInt(response.headers['content-range']) || 0,
             };*/

            window.dispatchEvent(
                new MessageEvent('auto-admin-loading-state', {
                    data: false,
                    origin: origin,
                    lastEventId: url,
                }),
            );

            return results;
        } catch (e: unknown) {
            window.dispatchEvent(new MessageEvent('DASHGlobalError', { data: { error: e, config: { dialog: true } } }));
            throw processAxiosError(e as AxiosError<IDashAutoAdminDefaultBackendStructure>, resource, 'getList');
        } finally {
            window.dispatchEvent(
                new MessageEvent('auto-admin-loading-state', {
                    data: false,
                    origin: origin,
                    lastEventId: url,
                }),
            );
        }
    },

    getOne: async (resource, params) => {
        const axios = useAxios();

        try {
            /*if(resource.includes('tenant/tenant')) { 
                debugger; 
            }*/
            const response = await axios.get(
                `${resource}/${params.id}`,
                params.meta ? { params: params.meta } : {},
            );

            return {
                data: response.data,

            };
        } catch (e: unknown) {
            throw processAxiosError(e as AxiosError<IDashAutoAdminDefaultBackendStructure>, resource, 'getOne');
        }
    },

    getMany: async (resource, params) => {

        const axios = useAxios();

        const pagination =
            params.filter && params.filter.pagination
                ? params.filter.pagination
                : false;

        /**
         * Ugly Hack:
         * the ids in often cases comes as a double nested array, reason unknown yet.
         */
        const paramsIds =
            Array.isArray(params.ids) &&
                params.ids.length > 0 &&
                Array.isArray(params.ids[0])
                ? params.ids[0]
                : params.ids;

        let query = {
            ids:
                Array.isArray(paramsIds) &&
                    paramsIds.length > 0 &&
                    paramsIds[0].id
                    ? paramsIds.map((object) => object.id)
                    : paramsIds,
            ...params.sort,
            ...params.filter,
        };

        if (pagination) {
            query = { ...query, pagination: true, ...pagination };
        } else {
            query = { ...query, pagination: false };
        }

        const hash = cacheInvalidatorHash(resource);
        if (hash) {
            query = {
                ...query,
                hash
            };
        }

        const _query = queryString.stringify(query, {
            arrayFormat: 'bracket',
        });

        const url = `${resource}/getMany?${_query}`;

        try {
            const response = await axios.get(url);
            const results = response.data;

            return {
                data: results.data,
                total:
                    results.data && results.data.total
                        ? results.data.total
                        : parseInt(response.headers['content-range']) || 0,
            };
        } catch (e: unknown) {
            throw processAxiosError(e as AxiosError<IDashAutoAdminDefaultBackendStructure>, resource, 'getMany');
        }
    },

    getManyReference: async (resource, params) => {

        const pagination =
            params.filter && params.filter.pagination
                ? params.filter.pagination
                : false;

        const axios = useAxios();



        let query = {




            ...params.filter,
            [params.target]: params.id,
        };

        if (pagination) {
            query = { ...query, pagination: true, ...pagination };
        } else {
            query = { ...query, pagination: false };
        }

        const url = `${resource}/getManyReference?${queryString.stringify(query, {
            arrayFormat: 'bracket',
        })}`;

        try {
            const response = await axios.get(url);
            const results = response.data;

            return {
                data: results,
                total:
                    results.data && results.data.total
                        ? results.data.total
                        : parseInt(response.headers['content-range']) || 0,
            };
        } catch (e: unknown) {
            throw processAxiosError(e as AxiosError<IDashAutoAdminDefaultBackendStructure>, resource, 'getManyReference');
        }
    },

    update: async (resource, params) => {

        const axios = useAxios();
        const resourceConfig = getResourceConfig(resource);
        const isFormData =
            resourceConfig?.isFormData === true ||
            params.data?.isFormData === true ||
            params.meta?.isFormData === true;

        const resourcePath = (params.id && resource.includes(params.id.toString())) ? resource : (params.id ? `${resource}/${params.id}` : resource);

        const postData = processPostData(
            resourcePath,
            { ...params.data },
            'update',
        );

        let method: 'POST' | 'PUT' = params.meta?.method
            ? params.meta.method
            : 'PUT';

        method = postData?.axiosMethod ? postData.axiosMethod : method;
        delete postData.axiosMethod;

        const action = axios.post;
        if (method === "PUT") {
            postData._method = "PUT";
        }

        try {
            let response;
            if (isFormData) {
                const form: FormData = processFormData(resource, postData);
                response = await action(resourcePath, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                response = await action(resourcePath, postData);
            }

            // Backend now returns { data: ... } format directly
            // React-Admin expects this exact format
            return response.data;

        } catch (e: unknown) {
            const error = e as AxiosError<IDashAutoAdminDefaultBackendStructure>;
            throw processAxiosError(error, resource, 'update')
        }
    },

    create: async (resource, params) => {
        const axios = useAxios();
        const resourceConfig = getResourceConfig(resource);
        const isFormData =
            resourceConfig?.isFormData === true ||
            params.data?.isFormData === true ||
            params.meta?.isFormData === true;


        const resourcePath = (params.id && resource.includes(params.id.toString())) ? resource : (params.id ? `${resource}/${params.id}` : resource);

        const method: 'POST' | 'PUT' = params.meta?.method
            ? params.meta.method
            : 'POST';

        const action = method === 'POST' ? axios.post : axios.put;

        const postData = processPostData(
            resourcePath,
            {
                ...params.data,
            },
            'create',
        );


        try {
            let response;
            if (isFormData) {
                const form: FormData = processFormData(resource, postData);
                response = await action(resourcePath, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                response = await action(resourcePath, postData);
            }

            // Backend now returns { data: ... } format directly
            // React-Admin expects this exact format
            return response.data;

        } catch (e: unknown) {
            const error = e as AxiosError<IDashAutoAdminDefaultBackendStructure>;
            throw processAxiosError(error, resource, 'create')
        }
    },
    updateMany: async (resource, params) => {

        const axios = useAxios();

        const query = {
            filter: JSON.stringify({ ids: params.ids }),
        };

        const method: 'POST' | 'PUT' = params.meta?.method
            ? params.meta.method
            : 'POST';
        const action = method === 'POST' ? axios.post : axios.put;
        try {
            const response = await action(
                `${resource}/updateMany?${queryString.stringify(query, {
                    arrayFormat: 'bracket',
                })}`,
                params.data,
            );

            return response.data;
        } catch (e: any) {
            window.dispatchEvent(
                new MessageEvent('dash-global-loader', { data: false }),
            );
            //window.dispatchEvent(new MessageEvent('DASHGlobalError', { data: { error: e } }));
        }
    },

    import: async (resource, params) => {
        params.data = processPostData(resource, params.data, 'import');

        const axios = useAxios();

        const form: FormData = processFormData(resource, params.data);

        const method: 'POST' | 'PUT' = params.meta?.method
            ? params.meta.method
            : 'POST';
        const action = method === 'POST' ? axios.post : axios.put;
        try {
            const results = await action(`${resource}`, form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            return results;
        } catch (e: any) {
            window.dispatchEvent(
                new MessageEvent('dash-global-loader', { data: false }),
            );
            //window.dispatchEvent(new MessageEvent('DASHGlobalError', { data: { error: e } }));
        }
    },

    delete: async (resource, params) => {
        const axios = useAxios();

        const resourcePath = (params.id && resource.includes(params.id.toString())) ? resource : `${resource}/${params.id}`;

        // try {
        const { data } = await axios.delete(resourcePath, {
            ...params.data,
        });
        return {
            data,
        };
        /* } catch (e: any) {
             window.dispatchEvent(
                 new MessageEvent('dash-global-loader', { data: false }),
             );
             window.dispatchEvent(new MessageEvent('DASHGlobalError', { data: { error: e } }));
         } */
    },

    deleteMany: async (resource, params) => {

        const axios = useAxios();

        const query = {

            ids: params.ids ? params.ids : [],
        };

        // try {
        const data = await axios.post(
            `${resource}/deleteMany?${queryString.stringify(query, {
                arrayFormat: 'bracket',
            })}`,
        );

        return data;
        /*} catch (e: any) {
            window.dispatchEvent(
                new MessageEvent('dash-global-loader', { data: false }),
            );
            window.dispatchEvent(new MessageEvent('DASHGlobalError', { data: { error: e } }));
        }*/
    },

    /* @deprecated */
    checkError: (error) => {
        const status = error.status;
        if (status >= 400 && status < 499) {
            
            // Format client errors
            console.error('checkError', JSON.stringify(error));
            
            // Create a nicely formatted message based on status code
            let message = error.message;
            if (status === 401) message = 'You are not authenticated';
            if (status === 403) message = 'You do not have permission to access this resource';
            if (status === 404) message = 'The requested resource was not found';
            if (status === 422) message = 'Validation error';

            // Create a properly formatted error that React Admin understands
            const formattedError = new Error(message);
            (formattedError as any).status = status;
            (formattedError as any).body = error.body; // Pass along validation errors

            return Promise.reject(formattedError);
        }

        // For other errors, just pass them through
        if (status >= 500) {
            console.error('Server error', error);
            return Promise.reject(new Error('A server error occurred. Please try again later.'));
        }

        return Promise.resolve();
    }
};


export default dataProvider;
