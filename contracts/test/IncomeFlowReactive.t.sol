// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {Test} from "forge-std/Test.sol";
import {IncomeFlowReactive} from "../src/IncomeFlowReactive.sol";
import {IReactive} from "@reactive/src/interfaces/IReactive.sol";
import {MockService} from "./Mocks.sol";

contract IncomeFlowReactiveTest is Test {
    address constant SYSTEM = 0x8888888888888888888888888888888888888888;
    address token = address(0x1000);
    address vault = address(0x2000);
    IncomeFlowReactive rc;
    MockService service;

    function setUp() public {
        vm.chainId(5318007);
        vm.warp(1000);
        MockService template = new MockService();
        vm.etch(SYSTEM, address(template).code);
        service = MockService(payable(SYSTEM));
        rc = new IncomeFlowReactive(address(this), token);
        rc.bindVault(vault);
    }

    function record() internal view returns (IReactive.LogRecord memory l) {
        l.chainId = 84532;
        l.contractAddress = token;
        l.topic0 = rc.TRANSFER_TOPIC();
        l.topic1 = uint256(uint160(address(this)));
        l.topic2 = uint256(uint160(vault));
        l.data = abi.encode(100e6);
        l.blockNumber = 90;
        l.opCode = 3;
        l.txHash = 1;
        l.logIndex = 0;
    }

    function react(IReactive.LogRecord memory l) internal {
        vm.prank(SYSTEM);
        rc.react(l);
    }

    function testExactFilterAndCallbackPlaceholder() public {
        assertEq(service.filterChain(), 84532);
        assertEq(service.filterToken(), token);
        assertEq(service.filterTopic0(), rc.TRANSFER_TOPIC());
        assertEq(service.filterTopic2(), uint256(uint160(vault)));
        assertTrue(service.filterTopic1() != 0);
        assertTrue(service.filterTopic3() != 0);
        react(record());
        assertEq(service.requests(), 1);
        assertEq(service.lastRecipient(), vault);
        bytes memory p = service.lastPayload();
        bytes32 first;
        assembly { first := mload(add(p, 36)) }
        assertEq(first, bytes32(0));
    }

    function testSystemOnly() public {
        IReactive.LogRecord memory l = record();
        vm.expectRevert();
        rc.react(l);
    }

    function testReplayIgnoredAndAuthenticatedRetry() public {
        react(record());
        react(record());
        assertEq(service.requests(), 1);
        bytes32 id = keccak256(abi.encode(uint256(84532), token, vault, uint256(1), uint256(0)));
        vm.expectRevert();
        rc.retry(id);
        vm.warp(1060);
        rc.retry(id);
        assertEq(service.requests(), 2);
        vm.prank(address(0xBAD));
        vm.expectRevert();
        rc.retry(id);
        vm.expectRevert();
        rc.retry(bytes32(uint256(999)));
    }

    function testMalformedAndUnrelatedLogsDoNotRequestCallbacks() public {
        IReactive.LogRecord memory l = record();
        l.chainId = 1;
        react(l);
        l = record();
        l.contractAddress = address(0xBAD);
        react(l);
        l = record();
        l.topic0 = 0;
        react(l);
        l = record();
        l.topic1 = type(uint256).max;
        react(l);
        l = record();
        l.topic2 = 0;
        react(l);
        l = record();
        l.opCode = 2;
        react(l);
        l = record();
        l.opCode = 4;
        react(l);
        l = record();
        l.data = hex"01";
        react(l);
        l = record();
        l.topic3 = 1;
        react(l);
        l = record();
        l.data = abi.encode(uint256(0));
        react(l);
        l = record();
        l.txHash = 0;
        react(l);
        l = record();
        l.topic1 = uint256(uint160(vault));
        react(l);
        l = record();
        l.blockNumber = 0;
        react(l);
        assertEq(service.requests(), 0);
    }

    function testFuzzWrongLogTopics(uint256 t1, uint256 t2, uint256 opcode) public {
        vm.assume(t1 > type(uint160).max || t2 != uint256(uint160(vault)) || opcode != 3);
        IReactive.LogRecord memory l = record();
        l.topic1 = t1;
        l.topic2 = t2;
        l.opCode = opcode;
        react(l);
        assertEq(service.requests(), 0);
    }

    function testPauseSubscriptionAndResume() public {
        rc.setSubscription(false);
        react(record());
        assertEq(service.requests(), 0);
        assertEq(service.unsubscriptions(), 1);
        rc.setSubscription(true);
        react(record());
        assertEq(service.requests(), 1);
        assertEq(service.subscriptions(), 2);
    }

    function testBindingAndControlRestricted() public {
        vm.expectRevert();
        rc.bindVault(address(0x3000));
        vm.prank(address(0xBAD));
        vm.expectRevert();
        rc.setSubscription(false);
        vm.expectRevert();
        rc.renounceOwnership();
    }

    function testUnsupportedNetworkRejected() public {
        vm.chainId(1);
        vm.expectRevert();
        new IncomeFlowReactive(address(this), token);
    }
}
