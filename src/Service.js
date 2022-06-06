const ErrorHelper =  require('./helpers/ErrorHelper')
const Repository =  require('./repository')

class Service {
    /**
     * Constructor
     */
    constructor() {
        this.repository = new Repository()
    }

    /**
     * Get a contract by profile id
     * @param contractId
     * @param profileId
     * @returns {Promise<ErrorHelper|Contract>}
     */
    async getContractByProfileId({ contractId, profileId}) {
        const contract = await this.repository.findContractByProfileId({ contractId, profileId})

        if(!contract)
            return new ErrorHelper(404, 'Contract not found')

        return contract
    }

    /**
     * Get all belong to contract/client
     * @param profileId
     * @returns {Promise<Contract[]>}
     */
    getAllContracts({ profileId }) {
        return this.repository.findAllContracts({ profileId })
    }

    /**
     * Get all the active unpaid jobs
     * @param profileId
     * @returns {Promise<Job[]>}
     */
    getUnpaidJobs({ profileId }) {
        return this.repository.findUnpaidJobs({ profileId })
    }

    /**
     * Pay for a Job
     * @param jobId
     * @param profileId
     * @returns {Promise<Job|ErrorHelper>}
     */
    async payJob({ jobId, profileId }) {
        const job = await this.repository.findUnpaidJobById({ jobId, profileId })
        const client = await this.repository.findClientById({ profileId })

        if(!job || !client)
            return new ErrorHelper(404, 'Client or Job not found')

        if(job.get('paid'))
            return new ErrorHelper(404, 'No Job to pay')

        const jobPrice = job.get('price')
        const clientBalance = client.get('balance')

        if(clientBalance < jobPrice)
            return new ErrorHelper(402, 'Insufficient balance to pay')

        const contractId = job.get('ContractId')
        const amount = job.get('price')
        const clientId = client.get('id')

        return this.repository.payJob({ contractId, clientId, jobId, amount, profileId })
    }

    /**
     * Deposit to a client
     * @param profileId
     * @param amount
     * @returns {Promise<Profile|null|ErrorHelper>}
     */
    async depositClient({ profileId, amount }) {
        if(!amount)
            return new ErrorHelper(400, 'You should define the deposit amount')

        const client = await this.repository.findClientById({ profileId })

        if(!client)
            return new ErrorHelper(404, 'Client does not exist')

        const amountToPay = await this.repository.amountToPay({ clientId: profileId })

        if(!amountToPay)
            return new ErrorHelper(404, 'No jobs to pay')

        if (amount > ((25 / 100) * amountToPay))
            return new ErrorHelper(404, 'You cannot deposit more than 25% his total of jobs to pay')

        await this.repository.depositClient({ profileId, amount })

        return this.repository.findClientById({ profileId })
    }

    /**
     * Get the profession that earned the most money in a time range
     * @param start
     * @param end
     * @returns {Promise<{profession, paid}>}
     */
    async getBestProfession({ start, end }) {
       const profession = await this.repository.findBestProfession({ start, end })

        return {
            profession: profession.profession,
            paid: profession['Contractor.Jobs.profession_amount']
        }
    }

    /**
     * Get the clients that paid more in a time range
     * @param start
     * @param end
     * @param limit
     * @returns {Promise<{paid, fullName, id}[]>}
     */
    async getBestClients({ start, end, limit }) {
        const clients = await this.repository.findBestClient({ start, end, limit })

        return clients.map(({id, firstName, lastName, 'Client.Jobs.sum_jobs': paid}) => ({
            id,
            fullName: `${firstName} ${lastName}`,
            paid
        }))
    }
}

module.exports = Service
