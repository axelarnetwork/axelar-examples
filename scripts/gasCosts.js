const { providers: { Provider } } = require('ethers');
const { utils: { setJSON }} = require('@axelar-network/axelar-local-dev');

class GasCostLogger{
    env;
    name;
    logs = [];
    currentLog;
    index;
    constructor(name, chains = null, env = '') {
        this.env = env;
        this.name= name;
        this.loadLogs();
        this.index = this.logs.length - ((env != '') ? 0 : 1);
        if(env != '') this.logs.push({env: env});
        this.currentLog = this.logs[this.index];
        if(chains == null) chains = this.currentLog;
        for(const chain in chains) {
            if(chain == 'env') continue;
            if(env != '') this.currentLog[chain] = {};
            this.currentLog[chain][name] = 0;
        }
    }

    loadLogs() {
        try {
            this.logs = require('../info/gasLogs.json');
        } catch(e) {}
    }

    async log(chain, tx) {
        if(tx.wait) tx = await tx.wait();
        const gasUsed = Number(tx.gasUsed);
        this.currentLog[chain][this.name] += gasUsed
    }

    write() {
        setJSON(this.logs, './info/gasLogs.json');
    }
}

module.exports = {
    GasCostLogger
}