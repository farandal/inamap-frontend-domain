export interface IAccountSetting {
  key: string;
  value: string | number | boolean | null;
}

export interface IAccountMetadata {
  key: string;
  value: string | number | boolean | null;
}

export interface IAccount {
  id: string;
  public_name: string;
  legal_name: string;
  public_id: string;
  email: string;
  url: string;
  slug: string;
  status: string;
  trial_ends_at: string; // ISO date string
  suspended_at: string | null;
  marked_for_deletion_at: string | null;
  settings: IAccountSetting[];
  metadata: IAccountMetadata[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  gateway_customer_id: string | null;
  gateway_type: string;
  pm_type: string | null;
  pm_last_four: string | null;
}

export type IAccounts = IAccount[];