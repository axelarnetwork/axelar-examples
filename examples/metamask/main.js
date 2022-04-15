const IAxelarGateway = await fetch('abi/IAxelarGateway.json').then((chain) => {
    return chain.json();
});
const IERC20 = await fetch('abi/IERC20.json').then((chain) => {
    return chain.json();
});

const chain1 = await fetch('chain1.json').then((chain) => {
    return chain.json();
});
const chain2 = await fetch('chain2.json').then((chain) => {
    return chain.json();
});
const chains = [chain1, chain2];
const getChain = (name) => {
    return chains.find(chain => name === chain.name);
}
const getOtherChain = (name) => {
    return chains.find(chain => name !== chain.name);
}
let chain;
let otherChain;
let gateway;
let provider;
let ust;

async function selectChain(e) {
    let element = e.target;
    let value = element.options[element.selectedIndex].text;
    chain = getChain(value);
    otherChain = getOtherChain(value);
    await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{
            chainId: "0x" + chain.chainId.toString(16),
        }]
    });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    gateway = new ethers.Contract(chain.gatewayAddress, IAxelarGateway.abi, provider);
    const ustAddress = await gateway.tokenAddresses('UST');
    ust = new ethers.Contract(ustAddress, IERC20.abi, provider);
}

let scroll = document.getElementById('chain');
for (let chain of chains) {
    let option = document.createElement('option');
    option.innerHTML = chain.name;
    scroll.appendChild(option);
}
scroll.addEventListener('change', selectChain);

selectChain({
    target:
        document.getElementById('chain')
})


async function approve() {
    let amountIn = document.getElementById('amountIn').value;
    amountIn = BigInt(amountIn * 1e6);

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner();
    console.log(gateway.address, amountIn);
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    console.log(await ust.allowance(account, gateway.address));
    await (await ust.connect(signer).approve(gateway.address, amountIn)).wait();
    console.log(await ust.allowance(account, gateway.address));

}

const approveButton = document.getElementById('approve');
approveButton.addEventListener('click', approve);

async function send() {
    let destinationAddress = document.getElementById('destinationAddress').value;
    if (!ethers.utils.isAddress(destinationAddress)) {
        alert('Please enter a valid address');
        return;
    }
    destinationAddress = ethers.utils.getAddress(destinationAddress);

    let amountIn = document.getElementById('amountIn').value;
    amountIn = BigInt(amountIn * 1e6);

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner();
    await (await gateway.connect(signer).sendToken(otherChain.name, destinationAddress, 'UST', amountIn)).wait();

}

const sendButton = document.getElementById('send');
sendButton.addEventListener('click', send);

async function track() {
    await ethereum.request({
        method: 'wallet_watchAsset',
        params: {
            type: 'ERC20',
            options: {
                address: ust.address,
                symbol: 'UST',
                decimals: 6,
            },
        },
    });

}

const trackButton = document.getElementById('track');
trackButton.addEventListener('click', track);

async function auto() {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    document.getElementById('destinationAddress').value = accounts[0];
}

const autoButton = document.getElementById('auto');
autoButton.addEventListener('click', auto);

setInterval(async () => {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    let amountIn = document.getElementById('amountIn').value;
    amountIn = BigInt(amountIn * 1e6);
    const allowance = await ust.allowance(account, gateway.address);

    if (allowance >= amountIn) {
        approveButton.disabled = true;
        sendButton.disabled = false;
    } else {
        approveButton.disabled = false;
        sendButton.disabled = true;
    }
}, 1000);