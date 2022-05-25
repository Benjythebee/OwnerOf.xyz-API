require('dotenv').config()

import { named } from './lib/logger'
import { ethers } from 'ethers'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
// import type * as express from 'express'
import express from 'express'
import cache, { noCache } from './cache'
import { getOwnershipOfToken, isChainSupported, supportedChains } from './lib/ethereum-helpers'
const log = named('Server')

const app = express()
const http = require('http').Server(app)
const path = require('path')

const bodyParser = require('body-parser')
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))

const NODE_PORT = process.env.NODE_PORT || 3000
// const corsConfig =
//   process.env.NODE_ENV === 'production'
//     ? cors()
//     : (req: any, res: any, next: express.NextFunction) => {
//         next()
//       }
// var corsOptions = {
//   origin: '*',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
// app.use(cors(corsOptions));
app.use(express.static(path.join(__dirname, '..', 'public')))

// render home page
app.get('/', function (req: any, res: express.Response) {

  res.sendFile(path.join(__dirname, '..','/public/index.html'))
})
// health
app.get('/zhealth', function (req: any, res: express.Response) {
  res.status(200).send('up');
})
const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 60 seconds
  max: 60,
  message: 'Too many request, slow down.',
  statusCode: 429,
  handler: (req: any, res: any, next: express.NextFunction) => {
    noCache(res),
    res.status(429).send({
      success: false,
      error: 'Too many request, slow down.',
    })
  },
})

app.get('/v1/ownerOf/:address/:tokenId',cache('30 seconds'),apiRateLimit, async (req: any, res: any)=> {
  const {address,tokenId} = req.params
  const {chain,potentialOwner} = req.query
  const wantsChain = req.query.wantsChain=='true'

  if(!address || !ethers.utils.isAddress(address)){
    res.status(400).json({success:false,message:'invalid address'})
    return
  }
  const reg = new RegExp('^[0-9]+$');
  if(!tokenId || !reg.test(tokenId)){
    res.status(400).json({success:false,message:'invalid tokenId'})
    return
  }
  
  if(chain && !isChainSupported(chain)){
    res.status(200).json({success:false,message:'invalid chain'})
    return
  }
  
  if(wantsChain && chain){
    res.status(200).json({success:false,message:'Cannot have wantsChain and chain set at the same time.'})
    return
  }

  let pOwner = ethers.constants.AddressZero
  if(potentialOwner && !ethers.utils.isAddress(address)){
    res.status(200).json({success:false,message:'invalid potentialOwner'})
    return
  }else if (potentialOwner && ethers.utils.isAddress(address)){
    pOwner = potentialOwner
  }

  let owner = undefined;
  let resultChain = chain;
  log.info(`Querying ownership for address: `+address+'; tokenId:',tokenId)
  if(chain){
    owner = await getOwnershipOfToken(chain,address,tokenId,pOwner)
  } else{
    for(const c of Object.values(supportedChains)){
      owner = await getOwnershipOfToken(c,address,tokenId,pOwner)
      if(owner){
        resultChain=c
        break;
      }
    }
  }
  if(!owner){
    owner = ethers.constants.AddressZero
  }
  const result = {success:true,owner,...(wantsChain?{chain:resultChain}:{})}
  res.send(result)
})


http.listen(NODE_PORT, function () {
  console.log('Listening on ' + NODE_PORT)
})
