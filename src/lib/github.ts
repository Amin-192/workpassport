import { Octokit } from '@octokit/core'

export async function getGitHubData(token: string) {
  const octokit = new Octokit({ auth: token })
  
  // Get user info
  const { data: user } = await octokit.request('GET /user')
  
  // Get ALL repositories (up to 100)
  const { data: repos } = await octokit.request('GET /user/repos', {
    sort: 'updated',
    per_page: 100,
    affiliation: 'owner,collaborator'
  })
  
  // Get total commit count across all repos
  let totalCommits = 0
  const repoCommits: { [key: string]: number } = {}
  
  for (const repo of repos.slice(0, 10)) { // Check last 10 active repos for performance
    try {
      const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: repo.owner.login,
        repo: repo.name,
        author: user.login,
        per_page: 100
      })
      repoCommits[repo.name] = commits.length
      totalCommits += commits.length
    } catch (error) {
      console.error(`Error fetching commits for ${repo.name}:`, error)
    }
  }
  
  return {
    user,
    repos,
    totalCommits,
    repoCommits
  }
}

export async function getRepoCommits(token: string, owner: string, repo: string) {
  const octokit = new Octokit({ auth: token })
  
  const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    per_page: 100,
  })
  
  return commits
}