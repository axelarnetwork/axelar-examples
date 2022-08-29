// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executables/AxelarExecutable.sol';
import { Upgradable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/upgradables/Upgradable.sol';
import { StringToAddress, AddressToString } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/StringAddressUtils.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';

contract Headers is AxelarExecutable, Upgradable {
    using StringToAddress for string;
    using AddressToString for address;

    error AlreadyInitialized();

    uint256 public immutable length;
    uint256 public n;
    mapping(string => bytes32[]) public headersMap;
    mapping(string => uint256[]) public blocksMap;
    IAxelarGasService public immutable gasReceiver;

    constructor(
        address gateway_,
        address gasReceiver_,
        uint256 length_
    ) AxelarExecutable(gateway_) {
        gasReceiver = IAxelarGasService(gasReceiver_);
        length = length_;
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
        bytes memory payload = abi.encode(block.number - 1, blockhash(block.number - 1));
        uint256 total;
        for (uint256 i = 0; i < chains.length; i++) {
            total += gases[i];
        }
        IERC20(token).transferFrom(msg.sender, address(this), total);
        for (uint256 i = 0; i < chains.length; i++) {
            //Pay gas to the gasReceiver to automatically fullfill the call.
            IERC20(token).approve(address(gasReceiver), gases[i]);
            string memory thisAddress = address(this).toString();
            gasReceiver.payGasForContractCall(address(this), chains[i], thisAddress, payload, token, gases[i], msg.sender);
            gateway.callContract(chains[i], thisAddress, payload);
        }
    }

    function _execute(
        string calldata sourceChain,
        string calldata sourceAddress,
        bytes calldata payload
    ) internal override {
        //Ensure the sender is a sibling. There are more efficient way to do this.
        require(sourceAddress.toAddress() == address(this), 'WRONG_SENDER');
        (uint256 block_, bytes32 header_) = abi.decode(payload, (uint256, bytes32));
        uint256 l = headersMap[sourceChain].length;
        if (l < length) {
            n = l;
            blocksMap[sourceChain].push(block_);
            headersMap[sourceChain].push(header_);
        } else {
            n = (n + 1) % length;
            blocksMap[sourceChain][n] = block_;
            headersMap[sourceChain][n] = header_;
        }
    }

    function contractId() external pure returns (bytes32) {
        return keccak256('example');
    }
}
