// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {AbstractReactive} from "@reactive/src/base/AbstractReactive.sol";
import {ISystemContract} from "@reactive/src/interfaces/ISystemContract.sol";

/// @notice One independent Reactive contract per vault. No shared custody or global vault admin.
contract IncomeFlowReactive is AbstractReactive, Ownable2Step {
    uint256 public constant ORIGIN_CHAIN = 84532;
    uint256 public constant TRANSFER_TOPIC = uint256(keccak256("Transfer(address,address,uint256)"));
    uint64 public constant CALLBACK_GAS = 1_000_000;
    address public immutable token;
    address public vault;
    bool public subscribed;
    mapping(bytes32 => bytes) private _payloads;
    mapping(bytes32 => uint256) public lastRequestedAt;

    error InvalidConfiguration();
    error RetryUnavailable();
    error OwnershipRequired();
    event VaultBound(address indexed vault, address indexed token);
    event SubscriptionChanged(bool active);
    event PaymentObserved(
        bytes32 indexed paymentId,
        uint256 indexed originTxHash,
        address indexed payer,
        uint256 logIndex,
        uint256 originBlock,
        uint256 amount
    );
    event AllocationRequested(bytes32 indexed paymentId, address indexed vault, bool retry);

    constructor(address owner_, address token_) payable Ownable(owner_) {
        if (block.chainid != 5318007 && block.chainid != 31337) revert InvalidConfiguration();
        if (token_ == address(0)) revert InvalidConfiguration();
        token = token_;
    }

    /// @notice One-time binding after destination deployment solves the circular-address dependency.
    function bindVault(address vault_) external onlyOwner {
        if (vault != address(0) || vault_ == address(0) || vault_ == token) revert InvalidConfiguration();
        vault = vault_;
        _setSubscription(true);
        emit VaultBound(vault_, token);
    }

    function setSubscription(bool active) external onlyOwner {
        if (vault == address(0) || active == subscribed) revert InvalidConfiguration();
        if (active) _coverDebt();
        _setSubscription(active);
    }

    function _setSubscription(bool active) internal {
        subscribed = active;
        if (active) {
            SYSTEM.subscribe(
                ORIGIN_CHAIN, token, TRANSFER_TOPIC, REACTIVE_IGNORE, uint256(uint160(vault)), REACTIVE_IGNORE
            );
        } else {
            SYSTEM.unsubscribe(
                ORIGIN_CHAIN, token, TRANSFER_TOPIC, REACTIVE_IGNORE, uint256(uint160(vault)), REACTIVE_IGNORE
            );
        }
        emit SubscriptionChanged(active);
    }

    /// @dev Invalid/unrelated records are ignored without wasting revert gas.
    function react(LogRecord memory log_) external override onlySystem {
        if (
            !subscribed || log_.chainId != ORIGIN_CHAIN || log_.contractAddress != token
                || log_.topic0 != TRANSFER_TOPIC || log_.opCode != 3 || log_.topic3 != 0
                || log_.topic1 > type(uint160).max || log_.topic2 != uint256(uint160(vault)) || log_.data.length != 32
                || log_.txHash == 0 || log_.blockNumber == 0
        ) return;
        address payer = address(uint160(log_.topic1));
        uint256 amount = abi.decode(log_.data, (uint256));
        if (amount == 0 || payer == vault) return;
        bytes32 id = keccak256(abi.encode(ORIGIN_CHAIN, token, vault, log_.txHash, log_.logIndex));
        if (_payloads[id].length != 0) return;
        bytes memory payload = abi.encodeWithSignature(
            "allocate(address,uint256,address,address,uint256,uint256,uint256,uint256)",
            address(0),
            ORIGIN_CHAIN,
            token,
            payer,
            log_.txHash,
            log_.logIndex,
            log_.blockNumber,
            amount
        );
        _payloads[id] = payload;
        emit PaymentObserved(id, log_.txHash, payer, log_.logIndex, log_.blockNumber, amount);
        _request(id, payload, false);
    }

    /// @notice Retry only a previously authenticated event. Destination replay guard remains authoritative.
    function retry(bytes32 id) external onlyOwner {
        if (_payloads[id].length == 0 || block.timestamp < lastRequestedAt[id] + 60) revert RetryUnavailable();
        _request(id, _payloads[id], true);
    }

    function _request(bytes32 id, bytes memory payload, bool isRetry) internal {
        lastRequestedAt[id] = block.timestamp;
        SYSTEM.requestCallbackV_1_0(
            ISystemContract.CallbackConfiguration_V_1_0({
                chainId: ORIGIN_CHAIN, recipient: vault, gasLimit: CALLBACK_GAS, payload: payload
            })
        );
        emit AllocationRequested(id, vault, isRetry);
    }

    function coverDebt() external {
        _coverDebt();
    }

    function renounceOwnership() public view override onlyOwner {
        revert OwnershipRequired();
    }
}
