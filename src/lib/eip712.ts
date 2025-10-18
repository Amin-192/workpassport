export const CREDENTIAL_TYPES = {
  Credential: [
    { name: 'workerAddress', type: 'address' },
    { name: 'issuerAddress', type: 'address' },
    { name: 'position', type: 'string' },
    { name: 'company', type: 'string' },
    { name: 'startDate', type: 'string' },
    { name: 'endDate', type: 'string' },
    { name: 'skills', type: 'string' },
    { name: 'createdAt', type: 'string' },
  ],
}

export const DOMAIN = {
  name: 'WorkPassport',
  version: '1',
  chainId: 11155111, // Sepolia
}

export function createCredentialMessage(credential: {
  worker_address: string
  issuer_address: string
  position: string
  company: string
  start_date: string
  end_date: string | null
  skills: string[]
  created_at: string
}) {
  return {
    workerAddress: credential.worker_address,
    issuerAddress: credential.issuer_address,
    position: credential.position,
    company: credential.company,
    startDate: credential.start_date,
    endDate: credential.end_date || '',
    skills: credential.skills.join(','),
    createdAt: credential.created_at,
  }
}