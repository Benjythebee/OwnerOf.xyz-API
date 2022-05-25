
/**
 * Configuration parameter sampleUrl: "http://localhost:3000"
 * @api {get} /v1/ownerOf/:address/:tokenId Get owner of NFT
 * @apiVersion 0.1.0
 * @apiGroup API
 * @apiName GetOwnerOf
 * 
 * @apiHeaderExample {json} Header-Example:
 *     {
 *       "Content-Type": "application/json",
 *     }
 * 
 * @apiParam {String} address A contract address, a string starting with 0x.
 * @apiParam {String} tokenId A valid token ID .
 * 
 * @apiQuery {String} [potentialOwner] a potential owner of the given NFT. Necessary for ERC1155
 * @apiQuery {Number} [chain] A chain id. If known, it allows quicker response by avoiding querying other chains.
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
  * @apiSuccessExample Success-Response-wantsChain:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "owner": "0xf4b4A58974524E183c275F3c6EA895bC2368E738",
 *       "chain":1
 *     }
 * 
 * @apiError {Boolean} success Unsuccessful query.
 * @apiError {String} message Error message description
 * 
 * @apiErrorExample Error-Response-Invalid-Parameters:
 *     HTTP/1.1 400 NOTOK
 *     {
 *       "success": false,
 *       "message": "invalid tokenId"
 *     }
  * @apiErrorExample Error-Response-Invalid-QueryParams:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": false,
 *       "message": "invalid potentialOwner"
 *     }
 */
 function getOwnerOf() { return; }