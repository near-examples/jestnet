const fs = require('fs').promises;
const BN = require('bn.js');
const nearApi = require('near-api-js');
const { Account, Contract, utils: { format: { parseNearAmount } } } = nearApi

let primaryAccount, near

async function initConnection() {
    const keyStore = new nearApi.keyStores.InMemoryKeyStore();
    const config = Object.assign(require('./config')(process.env.NODE_ENV || 'development'), {
        deps: { keyStore },
    });

    primaryAccount = config.primaryAccount
    const credentials = JSON.parse(await fs.readFile(process.env.HOME + '/.near-credentials/default/' + config.primaryAccount + '.json'))
    if (config.primaryAccount) {
        await keyStore.setKey(config.networkId, config.primaryAccount, nearApi.utils.KeyPair.fromString(credentials.private_key));
    }

    near = await nearApi.connect(config)
    return near;
}

async function getPrimary() {
    return new Account(near.connection, primaryAccount)
}

async function createAccount(fundingAmount = '1') {
    const primary = new Account(near.connection, primaryAccount)
    const newAccountName = generateUniqueString('test');
    const newPublicKey = await near.connection.signer.createKey(newAccountName, near.networkId);
    await primary.createAccount(newAccountName, newPublicKey, new BN(parseNearAmount(fundingAmount)));
    const newAccount = new nearApi.Account(near.connection, newAccountName);
    console.log(`New Account Created: ${newAccountName}`)
    return newAccount;
}

function generateUniqueString(prefix) {
    return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000000)}`;
}

module.exports = {
    initConnection, getPrimary, createAccount
}