import { IDashAutoAdminCustomFieldComponent } from "dash-auto-admin";
import React, { useEffect } from "react";
import { useRecordContext, useNotify,useRefresh } from "react-admin";

import { useAxios } from 'dash-axios-hook';
import { Tenant } from "dash-admin/interfaces/Tenant";

interface SampleComponentProps extends IDashAutoAdminCustomFieldComponent {
}

const SampleComponentEdit: React.FC<SampleComponentProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();
  const axios = useAxios();
  const notify = useNotify();
  const refresh = useRefresh();

    useEffect(() => {
    if (tenant && attribute.attribute) {
      const settings = tenant[attribute.attribute as keyof Tenant];
    }
  }, [tenant, attribute.attribute]);


 return <></>

};

const SampleComponentCreate: React.FC<SampleComponentProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}) => {

 return <></>
};

const SampleComponentView: React.FC<SampleComponentProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();

  useEffect(() => {
    if (tenant && attribute.attribute) {
      const settings = tenant[attribute.attribute as keyof Tenant];
    }
  }, [tenant, attribute.attribute]);


 return <></>
};

const SampleComponentList: React.FC<SampleComponentProps> = ({ 
  method, 
  attribute, 
  resourceConfig, 
  ...props 
}) => {
  const tenant: Tenant = useRecordContext();

  useEffect(() => {
    if (tenant && attribute.attribute) {
      const settings = tenant[attribute.attribute as keyof Tenant];
    }
  }, [tenant, attribute.attribute]);



  return <></>

};

const SampleComponent = ({ 
  method, 
  attribute, 
  resourceConfig, 
  endpoint,
  ...props 
}: SampleComponentProps) => {

   
  switch (method) {
    case "edit":
      return (
        <SampleComponentEdit 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    case "view":
      return (
        <SampleComponentView 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    case "create":
      return (
        <SampleComponentCreate 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    case "list":
      return (
        <SampleComponentList 
          attribute={attribute} 
          method={method} 
          resourceConfig={resourceConfig} 
          {...props} 
        />
      );
    default:
      return <></>;
  }
};

export default SampleComponent;
