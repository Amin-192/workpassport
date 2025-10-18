import { Octokit } from '@octokit/core'

export async function getGitHubData(token: string) {
  const octokit = new Octokit({ auth: token })
  
  // Get user info
  const { data: user } = await octokit.request('GET /user')
  
  // Get repositories
  const { data: repos } = await octokit.request('GET /user/repos', {
    sort: 'updated',
    per_page: 10,
  })
  
  return {
    user,
    repos,
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