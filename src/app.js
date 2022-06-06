const express = require('express');
const bodyParser = require('body-parser');
const Router = require('./Router')

const { getProfile } = require('./middleware/getProfile')

const app = express();
app.use(bodyParser.json());
app.use('/', getProfile, Router)

module.exports = app;
