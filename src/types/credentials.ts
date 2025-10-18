export interface Credential {
  id: string
  worker_address: string
  issuer_address: string
  position: string
  company: string
  start_date: string
  end_date: string | null
  skills: string[]
  created_at: string
  credential_hash: string
  signature: string
  signed_message: string
}

export interface GitHubCredential {
  id: string
  worker_address: string
  github_username: string
  repos_count: number
  total_commits: number
  languages: string[]
  avatar_url: string | null
  created_at: string
}