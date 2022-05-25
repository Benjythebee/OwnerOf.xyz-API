import fetch from 'node-fetch'
import { chainType } from './types'
import { ethers } from "ethers"
import {abi} from '../abis/OwnershipChecker'

export const supportedChains = {'ethereum':1,'polygon':2}

export const isChainSupported = (chain:number)=>{
  return !!Object.values(supportedChains).find((key)=>key==chain)
}

const addresses = {eth:'0xdBcDEEe0E6A8E5a9aEcB27c633534164df13720f',polygon:'0x70d9176320B2589AF92aFE91797801F3efC6CEc3'}
export const OwnershipCheckerContract = (chain:number=1)=>{
    if (chain==137){
        return new ethers.Contract(addresses.polygon,abi,new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.quiknode.pro',137))
    }
    return new ethers.Contract(addresses.eth,abi,new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth',1))
}

export const getOwnershipOfToken = async (chain:number=1,address:string,tokenId:string,_potentialOwner?:string)=>{
  const contract = await OwnershipCheckerContract(chain)
  if(!_potentialOwner){
    _potentialOwner = ethers.constants.AddressZero
  }
  let result = undefined
  try{
    result = await contract.ownerOfTokenAt(address,tokenId,_potentialOwner)
    return result
  }catch(e){
    console.error(e)
    return undefined
  }
}
