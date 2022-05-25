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
const corsConfig =
  process.env.NODE_ENV === 'production'
    ? cors()
    : (req: any, res: any, next: express.NextFunction) => {
        next()
      }
app.use(corsConfig);
app.use(express.static(path.join(__dirname, '..', 'public')))

// render home page
app.get('/', function (req: any, res: express.Response) {

  res.sendFile(path.join(__dirname, '..','/public/index.html'))
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

/**
 * Configuration parameter sampleUrl: "http://localhost:3000"
 * @api {get} /v1/ownerOf/:address/:tokenId Get owner of given NFT regardless of Chain
 * @apiVersion 1.0.0
 * @apiName Get OwnerOf
 * 
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Accept-Encoding": "Accept-Encoding: gzip, deflate"
 *     }
 * 
 * @apiParam {String} address A contract address, a string starting with 0x.
 * @apiParam {Number} tokenId A valid token ID (a number).
 * @apiQuery {String} [potentialOwner] a potential owner of the given NFT. 
 * @apiQuery {Number} [chain] A chain id. It allows quicker response by avoiding querying other chains.
 * @apiQuery {Boolean} [wantsChain] true to obtain the chain in the result.
 * 
 * @apiSuccess {Boolean} success Whether call was successful or not.
 * @apiSuccess {String} owner The address of the owner.
 * @apiSuccess {Number} [chain] The chain id given query has 'wantsChain=true'.
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "owner": "0xf4b4A58974524E183c275F3c6EA895bC2368E738"
 *     }
 * 
 * @apiError {Boolean} success Unsuccessful query.
 * @apiError {String} message Error message description
 * 
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 400 OK
 *     {
 *       "success": false,
 *       "message": "invalid tokenId"
 *     }
 */
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
