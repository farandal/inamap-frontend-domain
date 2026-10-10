import React from 'react';
import { useRecordContext, useInput } from 'react-admin';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import { IDashAutoAdminCustomFieldComponent } from 'dash-auto-admin';
import { useCurrencies, useLanguages, useTimezones, Currency, Language, Timezone } from '../../hooks/useSystemConfig';

/**
 * Custom Language Selector for Tenancy Account
 * Uses system config data to populate available languages
 */
interface LanguageSelectorProps extends IDashAutoAdminCustomFieldComponent {}

const LanguageSelectorEdit: React.FC<LanguageSelectorProps> = ({ attribute }) => {
    const record = useRecordContext();
    const { data: languages, isLoading } = useLanguages();
    
    const { field, fieldState } = useInput({ source: attribute.attribute });
    
    if (isLoading) {
        return <CircularProgress size={24} />;
    }

    return (
        <FormControl fullWidth variant="outlined" error={!!fieldState.error}>
            <InputLabel id="primary-language-label">Primary Language</InputLabel>
            <Select
                labelId="primary-language-label"
                id="primary-language"
                label="Primary Language"
                {...field}
                value={field.value || ''}
            >
                {languages.map((lang: Language) => (
                    <MenuItem key={lang.code} value={lang.code}>
                        {lang.native_name || lang.name} ({lang.code})
                    </MenuItem>
                ))}
            </Select>
            {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
        </FormControl>
    );
};

const LanguageSelectorView: React.FC<LanguageSelectorProps> = ({ attribute }) => {
    const record = useRecordContext();
    const { data: languages } = useLanguages();
    
    const value = record?.[attribute.attribute as keyof typeof record];
    const language = languages.find((l: Language) => l.code === value);
    
    return <span>{language?.native_name || language?.name || value || '-'}</span>;
};

export const TenancyLanguageSelector: React.FC<LanguageSelectorProps> = ({ method, ...props }) => {
    switch (method) {
        case 'edit':
        case 'create':
            return <LanguageSelectorEdit method={method} {...props} />;
        case 'view':
        case 'list':
            return <LanguageSelectorView method={method} {...props} />;
        default:
            return null;
    }
};

/**
 * Custom Currency Selector for Tenancy Account
 * Uses system config data to populate available currencies
 */
interface CurrencySelectorProps extends IDashAutoAdminCustomFieldComponent {}

const CurrencySelectorEdit: React.FC<CurrencySelectorProps> = ({ attribute }) => {
    const record = useRecordContext();
    const { data: currencies, isLoading } = useCurrencies();
    
    const { field, fieldState } = useInput({ source: attribute.attribute });
    
    if (isLoading) {
        return <CircularProgress size={24} />;
    }

    return (
        <FormControl fullWidth variant="outlined" error={!!fieldState.error}>
            <InputLabel id="primary-currency-label">Primary Currency</InputLabel>
            <Select
                labelId="primary-currency-label"
                id="primary-currency"
                label="Primary Currency"
                {...field}
                value={field.value || ''}
            >
                {currencies.map((curr: Currency) => (
                    <MenuItem key={curr.code} value={curr.code}>
                        {curr.symbol} - {curr.code} ({curr.label || curr.code})
                    </MenuItem>
                ))}
            </Select>
            {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
        </FormControl>
    );
};

const CurrencySelectorView: React.FC<CurrencySelectorProps> = ({ attribute }) => {
    const record = useRecordContext();
    const { data: currencies } = useCurrencies();
    
    const value = record?.[attribute.attribute as keyof typeof record];
    const currency = currencies.find((c: Currency) => c.code === value);
    
    return <span>{currency ? `${currency.symbol} ${currency.code}` : value || '-'}</span>;
};

export const TenancyCurrencySelector: React.FC<CurrencySelectorProps> = ({ method, ...props }) => {
    switch (method) {
        case 'edit':
        case 'create':
            return <CurrencySelectorEdit method={method} {...props} />;
        case 'view':
        case 'list':
            return <CurrencySelectorView method={method} {...props} />;
        default:
            return null;
    }
};

/**
 * Custom Timezone Selector for Tenancy Account
 * Uses system config data to populate available timezones
 */
interface TimezoneSelectorProps extends IDashAutoAdminCustomFieldComponent {}

const TimezoneSelectorEdit: React.FC<TimezoneSelectorProps> = ({ attribute }) => {
    const record = useRecordContext();
    const { data: timezoneGroups, isLoading } = useTimezones();
    
    const { field, fieldState } = useInput({ source: attribute.attribute });
    
    if (isLoading) {
        return <CircularProgress size={24} />;
    }

    // Flatten timezone groups into a single array
    const allTimezones: Timezone[] = Object.values(timezoneGroups).flat();

    return (
        <FormControl fullWidth variant="outlined" error={!!fieldState.error}>
            <InputLabel id="primary-timezone-label">Primary Timezone</InputLabel>
            <Select
                labelId="primary-timezone-label"
                id="primary-timezone"
                label="Primary Timezone"
                {...field}
                value={field.value || ''}
            >
                {Object.entries(timezoneGroups).map(([region, tzList]) => [
                    <MenuItem key={`region-${region}`} disabled sx={{ fontWeight: 'bold', opacity: 1 }}>
                        {region}
                    </MenuItem>,
                    ...(tzList as Timezone[]).map((tz: Timezone) => (
                        <MenuItem key={tz.value} value={tz.value} sx={{ pl: 4 }}>
                            {tz.label} ({tz.offset})
                        </MenuItem>
                    ))
                ])}
            </Select>
            {fieldState.error && <FormHelperText>{fieldState.error.message}</FormHelperText>}
        </FormControl>
    );
};

const TimezoneSelectorView: React.FC<TimezoneSelectorProps> = ({ attribute }) => {
    const record = useRecordContext();
    const { data: timezoneGroups } = useTimezones();
    
    const value = record?.[attribute.attribute as keyof typeof record];
    
    // Find timezone label
    const allTimezones: Timezone[] = Object.values(timezoneGroups).flat();
    const timezone = allTimezones.find((tz: Timezone) => tz.value === value);
    
    return <span>{timezone?.label || value || '-'}</span>;
};

export const TenancyTimezoneSelector: React.FC<TimezoneSelectorProps> = ({ method, ...props }) => {
    switch (method) {
        case 'edit':
        case 'create':
            return <TimezoneSelectorEdit method={method} {...props} />;
        case 'view':
        case 'list':
            return <TimezoneSelectorView method={method} {...props} />;
        default:
            return null;
    }
};

export default {
    TenancyLanguageSelector,
    TenancyCurrencySelector,
    TenancyTimezoneSelector,
};
