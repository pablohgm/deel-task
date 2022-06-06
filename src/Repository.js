const { Contract, Profile, Job, Op, sequelize } = require('./model')
const currency = require("currency.js");

const PROFILE_TYPE = Object.freeze({
    CLIENT: 'client',
    CONTRACTOR: 'contractor'
})

const CONTRACT_STATUS = Object.freeze({
    NEW: 'new',
    IN_PROGRESS: 'in_progress',
    TERMINATED: 'terminated'
})

class Repository {

    /**
     * Find a contract by contract id and profile id
     * @param contractId
     * @param profileId
     * @returns {Promise<Contract>}
     */
    findContractByProfileId({ contractId, profileId }) {
        return Contract.findOne({
            where: {
                id: contractId,
                [Op.or]: [
                    {'ClientId': profileId},
                    {'ContractorId': profileId}
                ]
            },
            include: [
                {
                    model: Profile,
                    as: 'Client',
                    attributes: [],
                },
                {
                    model: Profile,
                    as: 'Contractor',
                    attributes: [],
                }]
        })
    }

    /**
     * Find all the contracts belong to a contract/client
     * @param profileId
     * @returns {Promise<Contract[]>}
     */
    findAllContracts({ profileId }) {
        return Contract.findAll({
            where: {
                [Op.or]: [
                    {'ClientId': profileId},
                    {'ContractorId': profileId}
                ],
                status: [CONTRACT_STATUS.NEW,CONTRACT_STATUS.IN_PROGRESS]
            },
            include: [
                {
                    model: Profile,
                    as: 'Client',
                    attributes: [],
                },
                {
                    model: Profile,
                    as: 'Contractor',
                    attributes: [],
                }]
        })
    }

    /**
     * Find all unpaid jobs belong to a contract/client
     * @param profileId
     * @returns {Promise<Job[]>}
     */
    findUnpaidJobs({ profileId }) {
        return Job.findAll({
            where: {
                paid: {
                    [Op.or]: [false, null]
                }
            },
            include: [
                {
                    model: Contract,
                    attributes: [],
                    where: {
                        [Op.or]: [
                            {'ClientId': profileId},
                            {'ContractorId': profileId}
                        ],
                        status: CONTRACT_STATUS.IN_PROGRESS
                    }
                }
            ]
        })
    }

    /**
     * Find unpaid job by id belong to a contract/client
     * @param jobId
     * @param profileId
     * @returns {Promise<Job>}
     */
    findUnpaidJobById({ jobId, profileId }) {
        return Job.findOne({
            where: {
                paid: {
                    [Op.or]: [false, null]
                },
                id: jobId
            },
            include: [
                {
                    model: Contract,
                    attributes: [],
                    where: {
                        'ClientId': profileId, // I'm assuming only clients can pay
                        status: CONTRACT_STATUS.IN_PROGRESS
                    }
                }
            ]
        })
    }

    /**
     * Find paid job by id belong to a contract/client
     * @param jobId
     * @param profileId
     * @returns {Promise<Job>}
     */
    findPaidJobById({ jobId, profileId }) {
        return Job.findOne({
            where: {
                paid: true,
                id: jobId
            },
            include: [
                {
                    model: Contract,
                    attributes: [],
                    where: {
                        'ClientId': profileId,
                        status: CONTRACT_STATUS.TERMINATED
                    }
                }
            ]
        })
    }

    /**
     * Find client by id
     * @param profileId
     * @returns {Promise<Profile>}
     */
    findClientById({ profileId }) {
        return Profile.findOne({
            where: {
                id: profileId,
                type: PROFILE_TYPE.CLIENT
            }
        })
    }

    /**
     * Find contract by id
     * @param contractId
     * @returns {Promise<Profile>}
     */
    findContractById({ contractId }) {
        return Profile.findOne({
            where: {
                type: 'contractor'
            },
            include: [
                {
                    model: Contract,
                    as: 'Contractor',
                    attributes: [],
                    where: {
                        id: contractId,
                        status: CONTRACT_STATUS.IN_PROGRESS
                    }
                }
            ]
        })
    }

    /**
     * Deposit in the balance of a contractor
     * @param contractId
     * @param amount
     * @param transaction
     * @returns {Promise<void>}
     */
    async depositContractor({ contractId, amount }, transaction) {
        const contractor = await this.findContractById({ contractId})
        const contractorBalance = contractor.get('balance')
        await contractor.update({
            balance: currency(contractorBalance).add(amount)
        }, {transaction: transaction})
    }

    /**
     * Withdraw from balance a client
     * @param clientId
     * @param amount
     * @param transaction
     * @returns {Promise<void>}
     */
    async withdrawClient({ clientId, amount }, transaction) {
        const client = await this.findClientById({ profileId: clientId })
        const clientBalance = client.get('balance')
        await client.update({
            balance: currency(clientBalance).subtract(amount)
        }, {transaction: transaction})
    }

    /**
     * Deposit in the balance of a client
     * @param profileId
     * @param amount
     * @returns {Promise<void>}
     */
    async depositClient({ profileId, amount }) {
        const client = await this.findClientById({ profileId })
        const clientBalance = client.get('balance')
        await client.update({
            balance: currency(clientBalance).add(amount)
        })
    }

    /**
     * Set a job as paid
     * @param jobId
     * @param profileId
     * @param transaction
     * @returns {Promise<void>}
     */
    async jobPaid({ jobId, profileId }, transaction) {
        const job = await this.findUnpaidJobById({ jobId, profileId })
        await job.update({
            paid: true,
            paymentDate: new Date()
        }, {transaction: transaction})
    }

    /**
     * Set a contract as terminated
     * @param contractId
     * @param transaction
     * @returns {Promise<void>}
     */
    async terminateContract({ contractId }, transaction) {
        await Contract.update({ // I'm assuming after pay for a job the contract should be terminated
            status: 'terminated'
        }, {
            where: {
                id: contractId
            },
            transaction: transaction
        })
    }

    /**
     * Pay a job
     * @param contractId
     * @param clientId
     * @param jobId
     * @param amount
     * @param profileId
     * @returns {Promise<Job|*>}
     */
    async payJob({ contractId, clientId, jobId, amount, profileId }) {
        const payTransaction = await sequelize.transaction()

        try {
            // I'm assuming after pay for a job the contract should be terminated
            await Promise.all([
                this.depositContractor({ contractId, amount }, payTransaction),
                this.withdrawClient({ clientId, amount}, payTransaction),
                this.jobPaid({ jobId, profileId }, payTransaction),
                this.terminateContract({ contractId }, payTransaction)
            ])

            await payTransaction.commit()

            return this.findPaidJobById({ jobId, profileId })
        } catch (error) {
            await payTransaction.rollback()

            return error
        }
    }

    /**
     * Find the amount that a client has to pay
     * @param clientId
     * @returns {Promise<number>}
     */
    amountToPay({ clientId }){
        return Job.sum('price', {
            where: {
                paid: {
                    [Op.or]: [false, null]
                },
            },
            include: [
                {
                    model: Contract,
                    attributes: [],
                    where: {
                        clientId,
                        status: CONTRACT_STATUS.IN_PROGRESS
                    }
                }
            ]
        })
    }

    /**
     * Find the profession that earned the most money in a time range
     * @param start
     * @param end
     * @returns {Promise<Profile>}
     */
    findBestProfession({ start, end }) {
        return Profile.findOne({
            raw : true,
            where: {
                type: PROFILE_TYPE.CONTRACTOR
            },
            attributes: ['profession'],
            order: [[sequelize.fn('sum', sequelize.col('price')), 'DESC']],
            group: ['profession'],
            limit: 1,
            include: [
                {
                    model: Contract,
                    as: 'Contractor',
                    attributes: [],
                    duplicating: false,
                    include: [
                        {
                            model: Job,
                            as: 'Jobs',
                            duplicating: false,
                            where: {
                                paid: true,
                                paymentDate: {
                                    [Op.between]: [start, end]
                                }
                            },
                            attributes: [[sequelize.fn('sum', sequelize.col('price')), 'profession_amount']]
                        }
                    ]
                }
            ]
        })
    }

    /**
     * Find the clients that paid more in a time range
     * @param start
     * @param end
     * @param limit
     * @returns {Promise<Profile[]>}
     */
    findBestClient({ start, end, limit }) {
        return Profile.findAll({
            raw : true,
            where: {
                type: PROFILE_TYPE.CLIENT
            },
            order: [[sequelize.fn('sum', sequelize.col('price')), 'DESC']],
            group: ['firstName'],
            limit: limit || 2,
            include: [
                {
                    model: Contract,
                    as: 'Client',
                    duplicating: false,
                    attributes: [],
                    include: [
                        {
                            model: Job,
                            as: 'Jobs',
                            duplicating: false,
                            where: {
                                paid: true,
                                paymentDate: {
                                    [Op.between]: [start, end]
                                }
                            },
                            attributes: [[sequelize.fn('sum', sequelize.col('price')), 'sum_jobs']],
                        }
                    ]
                }
            ]
        })
    }
}

module.exports = Repository
