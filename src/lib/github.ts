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
  
  // Get total commit count and timeline
  let totalCommits = 0
  const repoCommits: { [key: string]: number } = {}
  const contributionsByMonth: { [key: string]: number } = {}
  
  for (const repo of repos.slice(0, 25)) { 
    try {
      const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
        owner: repo.owner.login,
        repo: repo.name,
        author: user.login,
        per_page: 100
      })
      repoCommits[repo.name] = commits.length
      totalCommits += commits.length
      
      // Group commits by month
      commits.forEach((commit: any) => {
        const date = new Date(commit.commit.author.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        contributionsByMonth[monthKey] = (contributionsByMonth[monthKey] || 0) + 1
      })
    } catch (error) {
      console.error(`Error fetching commits for ${repo.name}:`, error)
    }
  }
  
  // Convert contributions to array for charting (last 12 months)
  const now = new Date()
  const contributionsTimeline = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    contributionsTimeline.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      commits: contributionsByMonth[monthKey] || 0
    })
  }
  
  return {
    user,
    repos,
    totalCommits,
    repoCommits,
    contributionsTimeline
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