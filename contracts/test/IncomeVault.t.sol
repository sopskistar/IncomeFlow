// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {Test} from "forge-std/Test.sol";
import {IncomeVault} from "../src/IncomeVault.sol";
import {MockIncomeUSD} from "../src/MockIncomeUSD.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";
import {MockService, HostileToken} from "./Mocks.sol";

contract IncomeVaultTest is Test {
    MockIncomeUSD token;
    MockService proxy;
    IncomeVault vault;
    address reactive = address(0xA11CE);
    address spending = address(0x1001);
    address savings = address(0x1002);
    address taxes = address(0x1003);

    function setUp() public {
        vm.chainId(84532);
        vm.roll(100);
        vm.warp(1_000);
        token = new MockIncomeUSD();
        proxy = new MockService();
        vault = new IncomeVault(address(this), token, IPayable(payable(address(proxy))), reactive);
        vault.setRules(policy());
        token.faucet();
    }

    function policy() internal view returns (IncomeVault.Rule[] memory r) {
        r = new IncomeVault.Rule[](3);
        r[0] = IncomeVault.Rule(spending, 5000, "Spending");
        r[1] = IncomeVault.Rule(savings, 3000, "Savings");
        r[2] = IncomeVault.Rule(taxes, 2000, "Tax reserve");
    }

    function payload(uint256 txHash, uint256 index, uint256 originBlock, uint256 amount)
        internal
        view
        returns (bytes memory)
    {
        return abi.encodeCall(
            vault.allocate, (reactive, 84532, address(token), address(this), txHash, index, originBlock, amount)
        );
    }

    function deliver(uint256 txHash, uint256 amount) internal {
        proxy.deliver(address(vault), payload(txHash, 0, 90, amount));
    }

    function testExactDistributionAndReplay() public {
        token.transfer(address(vault), 100e6);
        deliver(1, 100e6);
        assertEq(token.balanceOf(spending), 50e6);
        assertEq(token.balanceOf(savings), 30e6);
        assertEq(token.balanceOf(taxes), 20e6);
        assertEq(token.balanceOf(address(vault)), 0);
        token.transfer(address(vault), 100e6);
        deliver(1, 100e6);
        assertEq(token.balanceOf(address(vault)), 100e6);
        assertEq(vault.paymentCount(), 1);
    }

    function testFuzzConservation(uint96 raw) public {
        uint256 amount = bound(uint256(raw), 1, 1000e6);
        token.transfer(address(vault), amount);
        deliver(1, amount);
        assertEq(token.balanceOf(spending) + token.balanceOf(savings) + token.balanceOf(taxes), amount);
        assertEq(token.balanceOf(address(vault)), 0);
        assertEq(vault.totalDistributed(), amount);
    }

    function testTinyAmountRemainderGoesToLastRecipient() public {
        token.transfer(address(vault), 1);
        deliver(1, 1);
        assertEq(token.balanceOf(spending), 0);
        assertEq(token.balanceOf(savings), 0);
        assertEq(token.balanceOf(taxes), 1);
    }

    function testDirectCallbackRejectedEvenWithCorrectIdentity() public {
        vm.expectRevert();
        vault.allocate(reactive, 84532, address(token), address(this), 1, 0, 90, 100);
    }

    function testForgedReactiveIdentityRejected() public {
        vm.expectRevert();
        proxy.deliver(
            address(vault),
            abi.encodeCall(vault.allocate, (address(0xBAD), 84532, address(token), address(this), 1, 0, 90, 100))
        );
    }

    function testWrongChainTokenAndFutureBlockRejected() public {
        vm.expectRevert(IncomeVault.InvalidPayment.selector);
        proxy.deliver(
            address(vault), abi.encodeCall(vault.allocate, (reactive, 1, address(token), address(this), 1, 0, 90, 100))
        );
        vm.expectRevert(IncomeVault.InvalidPayment.selector);
        proxy.deliver(
            address(vault),
            abi.encodeCall(vault.allocate, (reactive, 84532, address(0xBAD), address(this), 1, 0, 90, 100))
        );
        vm.expectRevert(IncomeVault.InvalidPayment.selector);
        proxy.deliver(address(vault), payload(1, 0, 101, 100));
    }

    function testInsufficientBalanceDoesNotConsumeEvent() public {
        vm.expectRevert();
        deliver(1, 100e6);
        assertFalse(vault.processed(vault.paymentId(1, 0)));
        token.transfer(address(vault), 100e6);
        deliver(1, 100e6);
        assertEq(vault.paymentCount(), 1);
    }

    function testConcurrentPaymentsOutOfOrderAndSameTransaction() public {
        token.transfer(address(vault), 300e6);
        proxy.deliver(address(vault), payload(1, 1, 90, 200e6));
        proxy.deliver(address(vault), payload(1, 0, 90, 100e6));
        assertEq(vault.paymentCount(), 2);
        assertEq(vault.totalDistributed(), 300e6);
    }

    function testPendingPaymentUsesCurrentPolicy() public {
        token.transfer(address(vault), 100e6);
        IncomeVault.Rule[] memory r = policy();
        r[0].bps = 4000;
        r[1].bps = 4000;
        vault.setRules(r);
        deliver(1, 100e6);
        assertEq(token.balanceOf(spending), 40e6);
        assertEq(vault.policyVersion(), 2);
    }

    function testInvalidRulesAndDuplicatesRejected() public {
        IncomeVault.Rule[] memory r = policy();
        r[0].bps = 4999;
        vm.expectRevert();
        vault.setRules(r);
        r = policy();
        r[1].recipient = spending;
        vm.expectRevert();
        vault.setRules(r);
        r = policy();
        r[1].recipient = address(vault);
        vm.expectRevert();
        vault.setRules(r);
        r = policy();
        r[1].recipient = address(0);
        vm.expectRevert();
        vault.setRules(r);
        r = policy();
        r[0].bps = 0;
        vm.expectRevert();
        vault.setRules(r);
        r = policy();
        r[0].label = "";
        vm.expectRevert();
        vault.setRules(r);
        r = new IncomeVault.Rule[](9);
        vm.expectRevert();
        vault.setRules(r);
        assertEq(vault.policyVersion(), 1);
    }

    function testOwnerControlsAndTwoStepTransfer() public {
        IncomeVault.Rule[] memory r = policy();
        vm.startPrank(address(0xBAD));
        vm.expectRevert();
        vault.setRules(r);
        vm.expectRevert();
        vault.pause();
        vm.expectRevert();
        vault.recover();
        vm.expectRevert();
        vault.transferOwnership(address(0xBAD));
        vm.stopPrank();
        vault.transferOwnership(spending);
        assertEq(vault.owner(), address(this));
        vm.prank(spending);
        vault.acceptOwnership();
        assertEq(vault.owner(), spending);
    }

    function testRenunciationRejected() public {
        vm.expectRevert();
        vault.renounceOwnership();
    }

    function testPausedCallbackRetriable() public {
        token.transfer(address(vault), 100e6);
        vault.pause();
        vm.expectRevert();
        deliver(1, 100e6);
        vault.resume();
        deliver(1, 100e6);
        assertEq(vault.paymentCount(), 1);
    }

    function testRecoveryInvalidatesOldEventsBeforeNewIncome() public {
        token.transfer(address(vault), 100e6);
        vm.expectRevert();
        vault.recover();
        vault.pause();
        vault.recover();
        vault.resume();
        vm.roll(101);
        token.transfer(address(vault), 100e6);
        vm.expectRevert();
        deliver(1, 100e6);
        proxy.deliver(address(vault), payload(2, 0, 101, 100e6));
        assertEq(vault.paymentCount(), 1);
    }

    function testDebtSettlementAndUnauthorizedPay() public {
        proxy.setDebt(1 ether);
        vm.expectRevert();
        vault.coverDebt();
        vm.deal(address(vault), 1 ether);
        vault.coverDebt();
        assertEq(proxy.debt(address(vault)), 0);
        vm.expectRevert();
        vault.pay(1);
    }

    function testFaucetCooldownUsesTime() public {
        vm.expectRevert();
        token.faucet();
        vm.warp(block.timestamp + 1 hours);
        token.faucet();
        assertEq(token.balanceOf(address(this)), 2000e6);
    }

    function testERC20FailureRollsBackAllAccounting() public {
        HostileToken bad = new HostileToken();
        IncomeVault v = new IncomeVault(address(this), bad, IPayable(payable(address(proxy))), reactive);
        v.setRules(policy());
        bad.mint(address(v), 100);
        bad.setFail(true);
        vm.expectRevert();
        proxy.deliver(
            address(v), abi.encodeCall(v.allocate, (reactive, 84532, address(bad), address(this), 1, 0, 90, 100))
        );
        assertFalse(v.processed(v.paymentId(1, 0)));
        assertEq(v.totalDistributed(), 0);
        assertEq(bad.balanceOf(address(v)), 100);
    }

    function testReentrantCallbackRejected() public {
        HostileToken bad = new HostileToken();
        IncomeVault v = new IncomeVault(address(this), bad, IPayable(payable(address(proxy))), reactive);
        v.setRules(policy());
        bad.mint(address(v), 200);
        bytes memory nested = abi.encodeCall(v.allocate, (reactive, 84532, address(bad), address(this), 2, 0, 90, 100));
        bad.setHook(address(proxy), abi.encodeCall(proxy.deliver, (address(v), nested)));
        proxy.deliver(
            address(v), abi.encodeCall(v.allocate, (reactive, 84532, address(bad), address(this), 1, 0, 90, 100))
        );
        assertTrue(bad.attempted());
        assertFalse(bad.reentrySucceeded());
        assertEq(v.paymentCount(), 1);
    }

    function testUnsupportedNetworkDeploymentRejected() public {
        vm.chainId(1);
        vm.expectRevert();
        new IncomeVault(address(this), token, IPayable(payable(address(proxy))), reactive);
    }
}
