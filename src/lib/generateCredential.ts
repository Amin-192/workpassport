interface GitHubRepo {
  language: string | null
  created_at: string
}

interface GitHubUser {
  login: string
}

interface GitHubData {
  user: GitHubUser
  repos: GitHubRepo[]
}

export function generateGitHubCredential(githubData: GitHubData, workerAddress: string) {
  const { user, repos } = githubData
  
  // Calculate stats
  const totalRepos = repos.length
  const languages = new Set<string>()
  
  repos.forEach((repo) => {
    if (repo.language) {
      languages.add(repo.language)
    }
  })
  
  // Find date range
  const dates = repos.map((repo) => new Date(repo.created_at))
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())))
  
  return {
    worker_address: workerAddress,
    position: 'GitHub Developer',
    company: `GitHub (@${user.login})`,
    start_date: earliestDate.toISOString().split('T')[0],
    end_date: latestDate.toISOString().split('T')[0],
    skills: Array.from(languages).slice(0, 10),
    github_username: user.login,
    total_repos: totalRepos,
  }
}