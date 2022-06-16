// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;


import { IAxelarExecutable } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarExecutable.sol';
import { IERC20 } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IERC20.sol';
import { StringToAddress, AddressToString } from 'axelar-utils-solidity/src/StringAddressUtils.sol';
import { IAxelarGateway } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarGateway.sol';
import { IAxelarGasReceiver } from '@axelar-network/axelar-cgp-solidity/src/interfaces/IAxelarGasReceiver.sol';

contract Headers is IAxelarExecutable {
    using StringToAddress for string;
    using AddressToString for address;

    error AlreadyInitialized();

    uint256 public immutable length;
    uint256 public n;
    mapping(string => bytes32[]) public headersMap;
    mapping(string => uint256[]) public blocksMap;
    IAxelarGasReceiver gasReceiver;

    //We need to know where the gateway is as well as where the gasReceiver is. length_ is the maximum number of headers to cache per chain.
    constructor(uint256 length_) IAxelarExecutable(address(0)) {
        length = length_;
    }

    function init(address gateway_, address gasReceiver_) external {
        if(address(gateway) != address(0) || address(gasReceiver) != address(0)) revert AlreadyInitialized();
        gasReceiver = IAxelarGasReceiver(gasReceiver_);
        gateway = IAxelarGateway(gateway_);
    }

    //i_ here is how old the header to fetch is. i_=0 is the lastest header we have in store.
    function getHeader(string calldata chain, uint256 i_) external view returns (uint256 block_, bytes32 header_) {
        uint256 l = headersMap[chain].length;
        require(i_ < l, 'NOT_ENOUGHT_HEADERS_STORED');
        //We store the headers cyclically.
        uint256 i = (n + l - i_) % l;
        block_ = blocksMap[chain][i];
        header_ = headersMap[chain][i];
    }

    function getStoredLength(string calldata chain) external view returns (uint256) {
        return headersMap[chain].length;
    }

    function updateRemoteHeaders(
        address token, 
        string[] memory chains,
        uint256[] memory gases
    ) external {
        bytes memory payload = abi.encode(block.number-1, blockhash(block.number - 1));
        uint256 total;
        for(uint256 i = 0; i< chains.length; i++) {
            total += gases[i];
        }
        IERC20(token).transferFrom(msg.sender, address(this), total);
        for(uint256 i = 0; i < chains.length; i++) {
            //Pay gas to the gasReceiver to automatically fullfill the call.
            IERC20(token).approve(address(gasReceiver), gases[i]);
            string memory thisAddress = address(this).toString();
            gasReceiver.payGasForContractCall(
                address(this),
                chains[i], 
                thisAddress, 
                payload,
                token, 
                gases[i],
                msg.sender
            );
            gateway.callContract(
                chains[i], 
                thisAddress, 
                payload
            );
        }
    }

    function _execute(
        string memory sourceChain, 
        string memory sourceAddress, 
        bytes calldata payload
    ) internal override {
        //Ensure the sender is a sibling. There are more efficient way to do this.
        require(sourceAddress.toAddress() == address(this), 'WRONG_SENDER');
        (
            uint256 block_,
            bytes32 header_
        ) = abi.decode(payload, (uint256, bytes32));
        uint256 l = headersMap[sourceChain].length;
        if(l < length) {
            n = l;
            blocksMap[sourceChain].push(block_);
            headersMap[sourceChain].push(header_);
        } else {
            n = (n + 1) % length;
            blocksMap[sourceChain][n] = block_;
            headersMap[sourceChain][n] = header_;
        }
    }
}