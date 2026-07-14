require('dotenv').config({ path: `${__dirname}/.env` });

const { WebpageServer } = require('./WebpageServer');

new WebpageServer();
