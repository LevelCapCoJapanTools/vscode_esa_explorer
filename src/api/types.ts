export interface EsaUser {
  myself: boolean;
  name: string;
  screen_name: string;
  icon: string;
}

export interface EsaPost {
  number: number;
  name: string;
  full_name: string;
  wip: boolean;
  body_md: string;
  body_html?: string;
  created_at: string;
  updated_at: string;
  message?: string;
  url: string;
  tags: string[];
  category: string | null;
  revision_number: number;
  created_by: EsaUser;
  updated_by: EsaUser;
  kind?: "stock" | "flow";
  overlapped?: boolean;
}

export interface EsaPostsResponse {
  posts: EsaPost[];
  prev_page: number | null;
  next_page: number | null;
  total_count: number;
  page: number;
  per_page: number;
  max_per_page: number;
}

export interface EsaOriginalRevision {
  body_md: string;
  number: number;
  user: string;
}

export interface UpdatePostInput {
  bodyMd: string;
  message: string;
  originalRevision: EsaOriginalRevision;
}
