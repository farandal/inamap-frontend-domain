import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React from "react";
import { useRecordContext } from "react-admin";
import { useFormContext } from "react-hook-form";
import { useTranslate } from "react-admin";
import { MenuItem, Select, FormControl, InputLabel } from "@mui/material";

interface DeliveryMethodFieldProps extends IDashAutoAdminCustomFieldComponent {
}

const DELIVERY_METHODS = [
    { value: 'COUNTER', label: 'Counter' },
    { value: 'TABLE', label: 'Table' },
    { value: 'DELIVERY', label: 'Delivery' },
];

const DeliveryMethodFieldEdit: React.FC<DeliveryMethodFieldProps> = ({ 
  attribute, 
}) => {
  const { register, watch, setValue } = useFormContext();
  const value = watch(attribute.attribute);
  const translate = useTranslate();

  return (
    <FormControl fullWidth margin="normal">
      <InputLabel>{translate('Delivery Method')}</InputLabel>
      <Select
        value={value || ''}
        label={translate('Delivery Method')}
        {...register(attribute.attribute)}
        onChange={(e) => setValue(attribute.attribute, e.target.value)}
      >
        {DELIVERY_METHODS.map((method) => (
          <MenuItem key={method.value} value={method.value}>
            {translate(method.label)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const DeliveryMethodFieldCreate: React.FC<DeliveryMethodFieldProps> = ({ 
  attribute, 
}) => {
  const { register, watch, setValue } = useFormContext();
  const value = watch(attribute.attribute);
  const translate = useTranslate();

  return (
    <FormControl fullWidth margin="normal">
      <InputLabel>{translate('Delivery Method')}</InputLabel>
      <Select
        value={value || 'TABLE'}
        label={translate('Delivery Method')}
        {...register(attribute.attribute)}
        onChange={(e) => setValue(attribute.attribute, e.target.value)}
      >
        {DELIVERY_METHODS.map((method) => (
          <MenuItem key={method.value} value={method.value}>
            {translate(method.label)}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const DeliveryMethodFieldView: React.FC<DeliveryMethodFieldProps> = ({ 
  attribute, 
}) => {
  const record = useRecordContext();
  const value = record?.[attribute.attribute];
  const translate = useTranslate();
  const label = DELIVERY_METHODS.find(m => m.value === value)?.label || value;

  return <span>{translate(label)}</span>;
};

const DeliveryMethodFieldList: React.FC<DeliveryMethodFieldProps> = ({ 
  attribute, 
}) => {
  const record = useRecordContext();
  const value = record?.[attribute.attribute];
  const translate = useTranslate();
  const label = DELIVERY_METHODS.find(m => m.value === value)?.label || value;

  return <span>{translate(label)}</span>;
};

const DeliveryMethodField = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}: DeliveryMethodFieldProps) => {

  switch (method) {
    case "edit":
      return <DeliveryMethodFieldEdit attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    case "create":
      return <DeliveryMethodFieldCreate attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    case "view":
    case "show":
      return <DeliveryMethodFieldView attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    case "list":
      return <DeliveryMethodFieldList attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    default:
      return <></>;
  }
};

export default DeliveryMethodField;
