const { createNetwork, networks, relay, getGasPrice, utils: { deployContract } } = require('@axelar-network/axelar-local-dev');
const {utils: { defaultAbiCoder, keccak256 }, constants: { AddressZero } } = require('ethers');



const NftLinker = require('../../build/NftLinker.json');
const ERC721Demo = require('../../build/ERC721Demo.json');


//Get the owner of a given NFT, returns the chain and address the user is at, as well as the tokenId in that chain.
const ownerOf = async (sourceChain, operator, tokenId) => {
    const owner = await operator.ownerOf(tokenId);
    if(owner != sourceChain.nftLinker.address) {
        return {chain: sourceChain.name, address: owner, tokenId: BigInt(tokenId)};
    } else {
        const newTokenId = BigInt(keccak256(defaultAbiCoder.encode(['string', 'address', 'uint256'], [sourceChain.name, operator.address, tokenId])));
        for(let chain of networks) {
            if(chain == sourceChain) continue;
            try {
                const address = await chain.nftLinker.ownerOf(newTokenId);
                return {chain: chain.name, address: address, tokenId: newTokenId};
            } catch (e) {}
        }
    }
}

(async () => {
    //Number of supported networks.
    const n = 5;
    //Create the networks and deploy the contracts there.
    for(let i=0; i<n; i++) {
        const chain = await createNetwork({seed: 'network' + i});
        const [,deployer] = chain.userWallets;
        chain.nftLinker = await deployContract(deployer, NftLinker, [chain.name, chain.gateway.address, chain.gasReceiver.address]);
        chain.ERC721 = await deployContract(deployer, ERC721Demo, ['Demo ERC721', 'DEMO']);
    }

    //Link all the nftLinkers together so they know who to trust (only each other).
    for(let i=0; i<n; i++) {   
        const chain = networks[i];
        const [,deployer] = chain.userWallets;
        for(let j=0; j<n; j++) {
            if(i==j) continue;
            const otherChain = networks[j];
            await (await chain.nftLinker.connect(deployer).addLinker(otherChain.name, otherChain.nftLinker.address)).wait();
        }
    }


    //Get the first two chains and generate an NFT on the first one.
    const chain1 = networks[0];
    const [user1] = chain1.userWallets;
    const chain2 = networks[1];
    const [user2] = chain2.userWallets;
    await (await chain1.ERC721.connect(user1).mint(1234)).wait();
    console.log(await ownerOf(chain1, chain1.ERC721, 1234));

    //Get the gas price assuming a gas limit of 1e6 (which is a safe overestimate);
    const gasLimit = 1e6;
    const gasPrice = getGasPrice(chain1, chain2, AddressZero);
    const gasAmount = gasLimit * gasPrice;

    //Approve and send our NFT to chain2.
    await (await chain1.ERC721.connect(user1).approve(chain1.nftLinker.address, 1234)).wait(); 
    await (await chain1.nftLinker.connect(user1).sendNFT(
        chain1.ERC721.address, 
        1234, 
        chain2.name, 
        user2.address, 
        {value: gasAmount}
    )).wait(); 
    //Relay this information to chain2.
    await relay();
    
    //Cycle the NFT from chain2 to all the other chains.
    for(let i=1; i<networks.length; i++) {
        const chain = networks[i];
        const dest = networks[(i+1) % networks.length];
        const [user] = chain.userWallets;
        const [destUser] = dest.userWallets;
        const owner = await ownerOf(chain1, chain1.ERC721, 1234);
        console.log(owner, 'should show this address:', user.address);
        //We don't need to approve here because the nftLinker is the minter. 
        //This is not the safest way to do things but it suffices for our example.
        await (await chain.nftLinker.connect(user).sendNFT(
            chain.nftLinker.address, 
            owner.tokenId, 
            dest.name, 
            destUser.address, 
            {value: gasAmount}
        )).wait(); 
        
        await relay();
    }
    const owner = await ownerOf(chain1, chain1.ERC721, 1234);
    console.log(owner, user1.address);
})();