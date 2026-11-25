// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {Test} from "forge-std/Test.sol";
import {StdInvariant} from "forge-std/StdInvariant.sol";
import {IncomeVault} from "../src/IncomeVault.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";
import {MockService, HostileToken} from "./Mocks.sol";

contract AccountingHandler is Test {
    HostileToken public token;
    MockService public proxy;
    IncomeVault public vault;
    uint256 public deposits;
    uint256 public paid;
    uint256 public count;
    mapping(uint256 => uint256) public amounts;
    mapping(uint256 => bool) public delivered;

    constructor(HostileToken t, MockService p, IncomeVault v) {
        token = t;
        proxy = p;
        vault = v;
    }

    function deposit(uint96 raw) external {
        uint256 amount = bound(uint256(raw), 1, 1e12);
        amounts[++count] = amount;
        deposits += amount;
        token.mint(address(vault), amount);
    }

    function callback(uint256 raw) external {
        if (count == 0) return;
        uint256 id = bound(raw, 1, count);
        proxy.deliver(
            address(vault),
            abi.encodeCall(
                vault.allocate,
                (
                    address(0xAA),
                    uint256(84532),
                    address(token),
                    address(this),
                    id,
                    uint256(0),
                    block.number,
                    amounts[id]
                )
            )
        );
        if (!delivered[id]) {
            delivered[id] = true;
            paid += amounts[id];
        }
    }
}

contract AccountingInvariantTest is StdInvariant, Test {
    AccountingHandler handler;
    HostileToken token;
    IncomeVault vault;

    function setUp() public {
        vm.chainId(84532);
        vm.roll(100);
        token = new HostileToken();
        MockService proxy = new MockService();
        vault = new IncomeVault(address(this), token, IPayable(payable(address(proxy))), address(0xAA));
        IncomeVault.Rule[] memory r = new IncomeVault.Rule[](3);
        r[0] = IncomeVault.Rule(address(0x1001), 5000, "Spending");
        r[1] = IncomeVault.Rule(address(0x1002), 3000, "Savings");
        r[2] = IncomeVault.Rule(address(0x1003), 2000, "Reserve");
        vault.setRules(r);
        handler = new AccountingHandler(token, proxy, vault);
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = handler.deposit.selector;
        selectors[1] = handler.callback.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
        targetContract(address(handler));
    }

    function invariantTokenConservationAndNoDuplicatePayout() public view {
        assertEq(vault.totalDistributed(), handler.paid());
        assertEq(token.balanceOf(address(vault)) + handler.paid(), handler.deposits());
        assertEq(
            token.balanceOf(address(0x1001)) + token.balanceOf(address(0x1002)) + token.balanceOf(address(0x1003)),
            handler.paid()
        );
    }
}
