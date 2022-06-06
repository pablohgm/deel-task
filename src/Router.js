const express = require('express')
const router = express.Router()

const { getProfile } = require('./middleware/getProfile')
const {
    getContractById,
    getContracts,
    geUnpaidJobs,
    payJob,
    depositClient,
    getBestProfession,
    getBestClient
} = require('./Controller');

router.get('/contracts/:id', getProfile, getContractById)
router.get('/contracts', getProfile, getContracts)
router.get('/jobs/unpaid', getProfile, geUnpaidJobs)
router.post('/jobs/:id/pay', getProfile, payJob)
router.post('/balances/deposit/:id', getProfile, depositClient)
router.get('/admin/best-profession', getProfile, getBestProfession)
router.get('/admin/best-clients', getProfile, getBestClient)

module.exports = router
