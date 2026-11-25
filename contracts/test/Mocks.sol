// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @dev Local test double only. Does not prove any network integration.
contract MockService {
    uint256 public requests;
    uint256 public subscriptions;
    uint256 public unsubscriptions;
    uint256 public debtAmount;
    bytes public lastPayload;
    address public lastRecipient;
    uint256 public filterChain;
    address public filterToken;
    uint256 public filterTopic0;
    uint256 public filterTopic1;
    uint256 public filterTopic2;
    uint256 public filterTopic3;

    receive() external payable {
        debtAmount = 0;
    }

    function debt(address) external view returns (uint256) {
        return debtAmount;
    }

    function setDebt(uint256 amount) external {
        debtAmount = amount;
    }

    function subscribe(uint256 chain, address token, uint256 t0, uint256 t1, uint256 t2, uint256 t3) external {
        ++subscriptions;
        filterChain = chain;
        filterToken = token;
        filterTopic0 = t0;
        filterTopic1 = t1;
        filterTopic2 = t2;
        filterTopic3 = t3;
    }

    function unsubscribe(uint256, address, uint256, uint256, uint256, uint256) external {
        ++unsubscriptions;
    }

    function requestCallbackV_1_0(ISystemContract.CallbackConfiguration_V_1_0 memory config) external {
        require(config.chainId == 84532 && config.gasLimit == 1_000_000);
        ++requests;
        lastPayload = config.payload;
        lastRecipient = config.recipient;
    }

    function deliver(address target, bytes memory payload) external returns (bytes memory) {
        (bool ok, bytes memory result) = target.call(payload);
        if (!ok) {
            assembly { revert(add(result, 32), mload(result)) }
        }
        return result;
    }
}

contract HostileToken is ERC20 {
    bool public fail;
    address public hook;
    bytes public hookPayload;
    bool public attempted;
    bool public reentrySucceeded;
    constructor() ERC20("Hostile test fixture", "TEST") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setFail(bool value) external {
        fail = value;
    }

    function setHook(address target, bytes memory payload) external {
        hook = target;
        hookPayload = payload;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (fail) return false;
        if (hook != address(0) && !attempted) {
            attempted = true;
            (reentrySucceeded,) = hook.call(hookPayload);
        }
        return super.transfer(to, amount);
    }
}
