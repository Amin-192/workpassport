import * as LitJsSdk from '@lit-protocol/lit-node-client'

let litNodeClient: any = null

export async function getLitClient() {
  if (litNodeClient) {
    return litNodeClient
  }

  const client = new LitJsSdk.LitNodeClient({
    litNetwork: 'datil-dev',
    debug: false,
  })

  await client.connect()
  litNodeClient = client
  
  return client
}

export function disconnectLit() {
  if (litNodeClient) {
    litNodeClient.disconnect()
    litNodeClient = null
  }
}