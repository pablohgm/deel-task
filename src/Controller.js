const ResponseHelper = require('./helpers/ResponseHelper')
const Service = require('./Service')

/**
 * @returns contract by id
 * @param req
 * @param res
 */
async function getContractById(req, res) {
    const profileId = req.profile.get('id')
    const {id: contractId} = req.params

    const service = new Service()
    const contract = await service.getContractByProfileId({contractId, profileId})
    const { statusCode, data } = ResponseHelper.get(contract)

    res.status(statusCode).json(data)
}

/**
 * @returns list of contracts
 * @param req
 * @param res
 */
async function getContracts(req, res) {
    const profileId = req.profile.get('id')

    const service = new Service()
    const contracts = await service.getAllContracts({ profileId })
    const { statusCode, data } = ResponseHelper.get(contracts)

    res.status(statusCode).json(data)
}

/**
 * @returns list of unpaid jobs
 * @param req
 * @param res
 */
async function geUnpaidJobs(req, res) {
    const profileId = req.profile.get('id')

    const service = new Service()
    const jobs = await service.getUnpaidJobs({ profileId })
    const { statusCode, data } = ResponseHelper.get(jobs)

    res.status(statusCode).json(data)
}

/**
 * @returns The Best Profession
 * @param req
 * @param res
 */
async function getBestProfession(req, res) {
    const {start, end} = req.query

    const service = new Service()
    const profession = await service.getBestProfession({ start, end })
    const { statusCode, data } = ResponseHelper.get(profession)

    res.status(statusCode).json(data)
}

/**
 * @returns The Best Client
 * @param req
 * @param res
 */
async function getBestClient(req, res) {
    const {start, end, limit} = req.query

    const service = new Service()
    const clients = await service.getBestClients({ start, end, limit })
    const { statusCode, data } = ResponseHelper.get(clients)

    res.status(statusCode).json(data)
}

/**
 * @returns Pay for Job
 * @param req
 * @param res
 */
async function payJob(req, res) {
    const {id: jobId} = req.params
    const profileId = req.profile.get('id')

    const service = new Service()
    const job = await service.payJob({ jobId, profileId })
    const { statusCode, data } = ResponseHelper.get(job)

    res.status(statusCode).json(data)
}

/**
 * @returns Deposit on client balance
 * @param req
 * @param res
 */
async function depositClient(req, res) {
    const {id: profileId} = req.params
    const {amount} = req.body

    const service = new Service()
    const client = await service.depositClient({ profileId, amount })
    const { statusCode, data } = ResponseHelper.get(client)

    res.status(statusCode).json(data)
}

module.exports = {
    getContractById,
    getContracts,
    geUnpaidJobs,
    payJob,
    depositClient,
    getBestProfession,
    getBestClient
}
