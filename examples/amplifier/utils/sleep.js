const sleep = (ms) => {
    console.log(`Sleeping for ${ms}\n`);
    return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
    sleep,
};
