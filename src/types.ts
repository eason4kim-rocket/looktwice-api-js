export type Evidence = {
  source: string;
  source_record_id: string | null;
  source_url: string;
  retrieved_at: string;
  content_hash: string;
  excerpt?: string | null;
};

export type EmailCheckRequest = { email: string };

export type EmailCheckResponse = {
  normalized: string;
  syntax_valid: boolean;
  mx_present: boolean | null;
  disposable: boolean | null;
  role_address: boolean | null;
  free_provider: boolean | null;
  mailbox_status: "not_checked";
  reasons: string[];
  checked_at: string;
};

export type VatCheckRequest = {
  country_code: string;
  vat_number: string;
  requester_country_code?: string;
  requester_vat_number?: string;
};

export type VatCheckResponse = {
  valid: boolean;
  country_code: string;
  vat_number: string;
  name: string | null;
  address: string | null;
  request_date: string;
  request_identifier: string | null;
  source_status: "available";
  checked_at: string;
};

export type IbanCheckRequest = { iban: string };

export type IbanCheckResponse = {
  valid: boolean;
  normalized_masked: string;
  country_code: string | null;
  sepa_country: boolean | null;
  registry: { release: string; source_url: string };
  checks: {
    country_supported: boolean;
    length_valid: boolean;
    structure_valid: boolean;
    checksum_valid: boolean;
  };
  bank_identifier: string | null;
  branch_identifier: string | null;
  account_status: "not_checked";
  checked_at: string;
};

export type DomainCheckRequest = { domain: string };

export type DomainCheckResponse = {
  domain: string;
  dns: {
    a: string[];
    aaaa: string[];
    mx: Array<{ exchange: string; priority: number }>;
    ns: string[];
  };
  mail_configured: boolean;
  mx_status: "configured" | "null_mx" | "absent" | "unavailable";
  tls: {
    status: "valid" | "expired" | "unavailable";
    issuer: string | null;
    expires_at: string | null;
  };
  rdap: { available: boolean; expires_at: string | null };
  checked_at: string;
};

export type CpscProduct = {
  external_id?: string;
  product_name: string;
  brand?: string;
  model?: string;
  upc?: string;
  description?: string;
};

export type CpscRecallMatchRequest = Omit<CpscProduct, "external_id">;

export type CpscCandidate = {
  match_level: "exact" | "likely" | "possible";
  score: number;
  matched_on: string[];
  recall_number: string;
  recall_date: string | null;
  title: string;
  product_description: string | null;
  hazard: string | null;
  remedy: string | null;
  official_url: string;
  evidence: Evidence;
};

export type CpscRecallMatchResponse = {
  match_level: "exact" | "likely" | "possible" | "none";
  candidates: CpscCandidate[];
  sources_checked: Array<"cpsc_recalls" | "cpsc_product_safety_warnings">;
  source_synced_at: string;
  checked_at: string;
  disclaimer: string;
};

export type CreateCatalogRequest = {
  name: string;
  webhook_endpoint_id?: string;
};

export type CatalogItemsRequest = { items: CpscProduct[] };

export type CreateKnowledgeWatchRequest = {
  url: string;
  facts: Array<{ key: string; description: string }>;
  webhook_endpoint_id?: string;
};

export type CreateWebhookEndpointRequest = {
  url: string;
  description?: string;
};
