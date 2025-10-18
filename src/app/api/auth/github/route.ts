import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID
  const redirectUri = `${request.nextUrl.origin}/api/auth/callback`
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,repo`
  
  return Response.redirect(githubAuthUrl)
}