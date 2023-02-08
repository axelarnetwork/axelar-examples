//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { ExpressProxy } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/express/ExpressProxy.sol';

contract DistributionProxy is ExpressProxy {

    constructor(address gateway_, address gmpExpressService_) ExpressProxy(gateway_, gmpExpressService_) {}

    function contractId() internal pure override returns (bytes32) {
        return keccak256('distribution-proxy');
    }
}
