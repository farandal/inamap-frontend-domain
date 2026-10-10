import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React from "react";
import { useRecordContext } from "react-admin";
import { useFormContext } from "react-hook-form";
import { useTranslate } from "react-admin";
import { TextField } from "@mui/material";

interface TableNumberFieldProps extends IDashAutoAdminCustomFieldComponent {
}

const TableNumberFieldEdit: React.FC<TableNumberFieldProps> = ({ 
  attribute, 
}) => {
  const { register } = useFormContext();
  const translate = useTranslate();

  return (
    <TextField
      fullWidth
      margin="normal"
      label={translate('Table Number')}
      {...register(attribute.attribute)}
    />
  );
};

const TableNumberFieldCreate: React.FC<TableNumberFieldProps> = ({ 
  attribute, 
}) => {
  const { register } = useFormContext();
  const translate = useTranslate();

  return (
    <TextField
      fullWidth
      margin="normal"
      label={translate('Table Number')}
      {...register(attribute.attribute)}
    />
  );
};

const TableNumberFieldView: React.FC<TableNumberFieldProps> = ({ 
  attribute, 
}) => {
  const record = useRecordContext();
  return <span>{record?.[attribute.attribute]}</span>;
};

const TableNumberFieldList: React.FC<TableNumberFieldProps> = ({ 
  attribute, 
}) => {
  const record = useRecordContext();
  return <span>{record?.[attribute.attribute]}</span>;
};

const TableNumberField = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}: TableNumberFieldProps) => {

  switch (method) {
    case "edit":
      return <TableNumberFieldEdit attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    case "create":
      return <TableNumberFieldCreate attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    case "view":
    case "show":
      return <TableNumberFieldView attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    case "list":
      return <TableNumberFieldList attribute={attribute} method={method} resourceConfig={resourceConfig} {...props} />;
    default:
      return <></>;
  }
};

export default TableNumberField;
