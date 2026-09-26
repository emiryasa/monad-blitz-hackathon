// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "forge-std/Script.sol";
import { EventFactory } from "../src/EventFactory.sol";

contract Deploy is Script {
    function run() external returns (EventFactory factory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);
        factory = new EventFactory();
        vm.stopBroadcast();
    }
}
