// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import { StringToAddress, AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/utils/AddressString.sol';


contract BreedableNFT is AxelarExecutable, ERC721, Ownable  {
    using Counters for Counters.Counter;
    using StringToAddress for string;

    Counters.Counter public tokenIdCounter;


    string public status = "nothing";

    string public value;
    string public sourceChain;
    string public sourceAddress;
    IAxelarGasService public immutable gasService;

    constructor(address gateway_, address gasReceiver_) AxelarExecutable(gateway_) ERC721("BreedableNFT", "BNFT") {
        gasService = IAxelarGasService(gasReceiver_);
        safeMint(msg.sender);
    }

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = tokenIdCounter.current();
        tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function breedWithRemote(
        string calldata destinationChain,
        string calldata destinationAddress,
        string calldata value_,
        uint srcToken,
        uint destToken
    ) external payable {
        status = "bred";
        bytes memory payload = abi.encode(value_);
        if (msg.value > 0) {
            gasService.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }



    // Handles calls created by breedWithRemote. Updates this contract's value
    function _execute(
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override {
        status = "executed";
        (value) = abi.decode(payload_, (string));
        sourceChain = sourceChain_;
        sourceAddress = sourceAddress_;

        // Don't use the safeMint function because we're not owner
        uint256 tokenId = tokenIdCounter.current();
        tokenIdCounter.increment();
        _safeMint(sourceAddress.toAddress(), tokenId);
    }
}
