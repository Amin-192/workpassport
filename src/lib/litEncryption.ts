import { getLitClient } from './lit'
import * as LitJsSdk from '@lit-protocol/lit-node-client'

export async function encryptCredentialField(
  fieldValue: string,
  walletAddress: string
) {
  try {
    const litNodeClient = await getLitClient()

    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: walletAddress.toLowerCase(),
        },
      },
    ]

    const { ciphertext, dataToEncryptHash } = await litNodeClient.encrypt({
      accessControlConditions,
      dataToEncrypt: new TextEncoder().encode(fieldValue),
    })

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw error
  }
}

export async function decryptCredentialField(
  ciphertext: string,
  dataToEncryptHash: string,
  accessControlConditions: any[]
) {
  try {
    const litNodeClient = await getLitClient()

    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed')
    }

    const authSig = await LitJsSdk.checkAndSignAuthMessage({
      chain: 'ethereum',
      nonce: await litNodeClient.getLatestBlockhash(),
    })

    const decryptedData = await litNodeClient.decrypt({
      accessControlConditions,
      ciphertext,
      dataToEncryptHash,
      authSig,
      chain: 'ethereum',
    })

    return new TextDecoder().decode(decryptedData)
  } catch (error) {
    console.error('Decryption error:', error)
    throw error
  }
}