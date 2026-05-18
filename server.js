const { Log } = require('./logging_middleware/logger');

async function testLogger() {
    console.log('Sending test log...');
    await Log('backend', 'error', 'handler', 'received string, expected bool');
    console.log('Log function executed.');
}

testLogger();
