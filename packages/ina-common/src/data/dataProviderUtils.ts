/**
 * Data provider utilities for form data processing
 */

import DASHStorageClass from 'dash-admin/src/classes/DASHStorageClass';
import { IDashAutoAdminAttribute, IDashAutoAdminResourceConfig } from 'dash-auto-admin';

/**
 * Retrieves the resource configuration for the specified model.
 * 
 * @param model - The name of the model to retrieve the resource configuration for.
 * @returns The resource configuration for the specified model.
 */
export const getResourceConfig = (model: string): IDashAutoAdminResourceConfig | undefined => {
    const resources = DASHStorageClass.resources;
    // Try exact match first
    const exactMatch = resources.find((resource: IDashAutoAdminResourceConfig) => resource.model === model);
    if (exactMatch) return exactMatch;

    const normalizedModel = model.replace( /\/[\w-]+$/, '');
    return resources.find((resource: IDashAutoAdminResourceConfig) => resource.model === normalizedModel);
};

/**
 * Helper function to append a value to FormData with proper handling of different types.
 * Recursively handles nested objects and arrays.
 * 
 * @param form - The FormData object to append to.
 * @param key - The key/name for the form field.
 * @param value - The value to append.
 * @param debug - Whether to log debug information.
 */
const appendToFormData = (form: FormData, key: string, value: any, debug: boolean = false): void => {
    if (value === undefined || value === null) {
        if (debug) console.log(`Skipping ${key} as value is undefined or null`);
        return;
    }

    // Handle File and Blob types directly
    if (value instanceof File || value instanceof Blob) {
        if (debug) console.log(`Adding File/Blob for ${key}`);
        form.append(key, value);
        return;
    }

    // Handle rawFile pattern (React Admin file uploads)
    if (value?.rawFile instanceof File || value?.rawFile instanceof Blob) {
        if (debug) console.log(`Adding rawFile for ${key}`);
        form.append(key, value.rawFile);
        return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
        if (debug) console.log(`Field ${key} is an array with ${value.length} items`);
        if (!value.length) {
            if (debug) console.log(`Empty array for ${key}, adding empty string`);
            form.append(key + '[]', '');
            return;
        }

        value.forEach((item, index) => {
            if (item === null || item === undefined) {
                return; // Skip null/undefined items
            }

            // If array item is a primitive value (string, number, boolean)
            if (typeof item !== 'object') {
                if (debug) console.log(`Adding primitive array item for ${key}[]: ${item}`);
                form.append(key + '[]', String(item));
            }
            // If array item is a File/Blob
            else if (item instanceof File || item instanceof Blob) {
                if (debug) console.log(`Adding File/Blob array item for ${key}[]`);
                form.append(key + '[]', item);
            }
            // If array item is an object with rawFile
            else if (item?.rawFile instanceof File || item?.rawFile instanceof Blob) {
                if (debug) console.log(`Adding rawFile array item for ${key}[]`);
                form.append(key + '[]', item.rawFile);
            }
            // If array item is an object, flatten it with indexed notation
            else if (typeof item === 'object') {
                if (debug) console.log(`Adding object array item for ${key}[${index}]`);
                Object.entries(item).forEach(([subKey, subValue]) => {
                    appendToFormData(form, `${key}[${index}][${subKey}]`, subValue, debug);
                });
            }
        });
        return;
    }

    // Handle plain objects (not File, not Blob, not array)
    if (typeof value === 'object') {
        if (debug) console.log(`Field ${key} is a nested object`);
        Object.entries(value).forEach(([subKey, subValue]) => {
            appendToFormData(form, `${key}[${subKey}]`, subValue, debug);
        });
        return;
    }

    // Handle primitives (string, number, boolean)
    if (debug) console.log(`Adding primitive value for ${key}: ${value}`);
    form.append(key, String(value));
};

/**
 * Processes form data for a given resource and parameters.
 * 
 * @param resource - The name of the resource to process the form data for.
 * @param params - The parameters to include in the form data.
 * @returns A FormData object containing the processed form data.
 */
export const processFormData = (resource: string, params: any): FormData => {
    const debug = true;
    const resourceConfig = getResourceConfig(resource);

    if (debug) console.log(`Processing form data for resource: ${resource}`);
    const form = new FormData();

    if (debug) console.log('Starting to process parameters:', params);

    Object.entries(params).forEach((element) => {
        const [key, value]: [string, any] = element;

        if (value !== undefined) {
            if (debug) console.log(`Processing field: ${key} with value:`, value);

            // Check if there's a processor defined for this field
            if (resourceConfig) {
                const fieldConfig: IDashAutoAdminAttribute | undefined = resourceConfig.schema.find(
                    (field: IDashAutoAdminAttribute) => field.attribute.split(".")[0] === key,
                );

                if (fieldConfig?.processor) {
                    if (debug) console.log(`Processing ${key} with processor: ${fieldConfig.processor}`);

                    // Handle Null processor FIRST before other processors
                    if (fieldConfig.processor === 'Null') {
                        if (debug) console.log(`Processing Null processor for ${key}, value:`, value);
                        if (value === null || value === undefined || value === '' || value === 'null') {
                            if (debug) console.log(`Converting null/empty value for ${key} to empty string`);
                            form.append(key, '');
                            return;
                        }
                        if (debug) console.log(`Adding non-null value for ${key}:`, value);
                        form.append(key, value);
                        return;
                    }

                    if (fieldConfig.processor === 'Blob') {
                        if (debug) console.log(`Adding Blob for ${key}`);
                        form.append(key, value as Blob);
                        return;
                    }

                    if (fieldConfig.processor === 'Stringify') {
                        if (debug) console.log(`Stringifying value for ${key}`);
                        form.append(key, JSON.stringify(value));
                        return;
                    }

                    if (fieldConfig.processor === 'File') {
                        if (debug) console.log(`Adding File for ${key}`);
                        if (value.rawFile) {
                            form.append(key, value.rawFile);
                        } else {
                            form.append(key, value as File);
                        }
                        return;
                    }

                    if (fieldConfig.processor === 'RawFile') {
                        if (debug) console.log(`Adding RawFile for ${key}`);
                        form.append(key, value.rawFile as Blob);
                        return;
                    }

                    if (fieldConfig.processor === 'Boolean') {
                        if (debug) console.log(`Converting Boolean for ${key}`);
                        form.append(key, Number(value).toString());
                        return;
                    }

                    if (fieldConfig.processor === 'BooleanOnOff') {
                        if (debug) console.log(`Converting BooleanOnOff for ${key}`);
                        form.append(key, Number(value) === 1 ? 'on' : 'off');
                        return;
                    }

                    if (fieldConfig.processor === 'BooleanActiveInactive') {
                        if (debug) console.log(`Converting BooleanActiveInactive for ${key}`);
                        form.append(key, Number(value) === 1 ? 'active' : 'inactive');
                        return;
                    }
                }
            }

            // Use the recursive helper for all other values
            appendToFormData(form, key, value, debug);
        }
    });

    if (debug) console.log('Form processing completed');
    return resourceConfig?.formPostFormatter
        ? (debug && console.log('Applying form post formatter'), resourceConfig.formPostFormatter(params, form))
        : form;
};

/**
 * Processes POST data for a given resource applying field processors
 */
export const processPostData = (
    resource: string,
    params: any,
    method: 'getList' | 'update' | 'create' | 'import',
): any => {
    const resourceConfig = getResourceConfig(resource);

    Object.entries(params).forEach((element) => {
        const [key, value]: [string, any] = element;

        if (resourceConfig) {
            const fieldConfig: IDashAutoAdminAttribute | undefined = resourceConfig.schema.find(
                (field: IDashAutoAdminAttribute) => field.attribute === key,
            );
            if (fieldConfig?.processor === 'Boolean') {
                params[key] = Number(value).toString();
            }

            if (fieldConfig?.processor === 'BooleanOnOff') {
                params[key] = value ? 'on' : 'off';
            }

            if (fieldConfig?.processor === 'BooleanActiveInactive') {
                params[key] = value ? 'active' : 'inactive';
            }
        }
    });

    if (resourceConfig?.postFormatter && method !== 'getList') {
        params = resourceConfig.postFormatter(params, method);
    }

    return params;
};
