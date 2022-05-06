// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

library StringToAddress {
    function toAddress(string memory _a) internal pure returns (address){
        bytes memory tmp = bytes(_a);
        if(tmp.length != 42) return address(0);
        uint160 iaddr = 0;
        uint8 b;
        for (uint i=2; i<42; i++){
            b = uint8(tmp[i]);
            if ((b >= 97)&&(b <= 102)) b -= 87;
            else if ((b >= 65)&&(b <= 70)) b -= 55;
            else if ((b >= 48)&&(b <= 57)) b -= 48;
            else return address(0);
            iaddr |= uint160(uint256(b)<<(41-i<<2));
        }
        return address(iaddr);
    }
}