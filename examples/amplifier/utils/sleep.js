const sleep = (ms) => {
    console.log(`Sleeping for ${ms}`);
    return new Promise((resolve) => setTimeout(resolve, ms));
};

module.exports = {
    sleep,
};
