// SPDX-License-Identifier: MIT
pragma solidity 0.8.29;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {AbstractCallback} from "@reactive/src/base/AbstractCallback.sol";
import {IPayable} from "@reactive/src/interfaces/IPayable.sol";

/// @notice Independent, owner-controlled vault for one conventional ERC-20 on Base Sepolia.
/// @dev The proxy AND the immutable Reactive sender authenticate every event-derived amount.
contract IncomeVault is AbstractCallback, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    uint256 public constant BPS = 10_000;
    uint256 public constant MAX_RECIPIENTS = 8;
    IERC20 public immutable token;
    uint256 public policyVersion;
    uint256 public recoveryBlock;
    uint256 public totalDistributed;
    uint256 public paymentCount;
    mapping(bytes32 => bool) public processed;

    struct Rule {
        address recipient;
        uint16 bps;
        string label;
    }
    Rule[] private _rules;

    error InvalidConfiguration();
    error InvalidRecipient(address recipient);
    error InvalidTotal(uint256 total);
    error InvalidPayment();
    error PaymentRecovered(uint256 originBlock, uint256 cutoff);
    error InsufficientTokenBalance(uint256 required, uint256 available);
    error OwnershipRequired();

    event PolicyUpdated(uint256 indexed version, address[] recipients, uint16[] bps, string[] labels);
    event PaymentAllocated(
        bytes32 indexed paymentId,
        uint256 indexed originTxHash,
        address indexed payer,
        uint256 originLogIndex,
        uint256 amount,
        uint256 version
    );
    event AllocationPaid(bytes32 indexed paymentId, address indexed recipient, uint256 amount, uint256 ruleIndex);
    event DuplicateIgnored(bytes32 indexed paymentId);
    event FundsRecovered(address indexed owner, uint256 amount, uint256 cutoffBlock);
    event UnsupportedTokenRecovered(address indexed token, uint256 amount);

    constructor(address owner_, IERC20 token_, IPayable proxy_, address reactiveSender_)
        payable
        AbstractCallback(proxy_, reactiveSender_)
        Ownable(owner_)
    {
        if (block.chainid != 84532 && block.chainid != 31337) revert InvalidConfiguration();
        if (address(token_).code.length == 0 || address(proxy_).code.length == 0 || reactiveSender_ == address(0)) {
            revert InvalidConfiguration();
        }
        token = token_;
    }

    function rules() external view returns (Rule[] memory) {
        return _rules;
    }

    /// @notice Pending payments use the policy current when their callback executes.
    function setRules(Rule[] calldata next) external onlyOwner {
        if (next.length < 2 || next.length > MAX_RECIPIENTS) revert InvalidConfiguration();
        uint256 sum;
        address[] memory recipients = new address[](next.length);
        uint16[] memory shares = new uint16[](next.length);
        string[] memory labels = new string[](next.length);
        for (uint256 i; i < next.length; ++i) {
            address recipient = next[i].recipient;
            if (
                recipient == address(0) || recipient == address(this) || recipient == address(token)
                    || recipient == address(_SERVICE_PROVIDER)
            ) revert InvalidRecipient(recipient);
            if (next[i].bps == 0 || bytes(next[i].label).length == 0 || bytes(next[i].label).length > 32) {
                revert InvalidConfiguration();
            }
            for (uint256 j; j < i; ++j) if (next[j].recipient == recipient) revert InvalidRecipient(recipient);
            sum += next[i].bps;
            recipients[i] = recipient;
            shares[i] = next[i].bps;
            labels[i] = next[i].label;
        }
        if (sum != BPS) revert InvalidTotal(sum);
        delete _rules;
        for (uint256 i; i < next.length; ++i) _rules.push(next[i]);
        ++policyVersion;
        emit PolicyUpdated(policyVersion, recipients, shares, labels);
    }

    function paymentId(uint256 originTxHash, uint256 logIndex) public view returns (bytes32) {
        return keccak256(abi.encode(block.chainid, address(token), address(this), originTxHash, logIndex));
    }

    /// @notice Only the official proxy carrying the configured Reactive contract may call this.
    /// @dev The first address is reserved for network injection. No user-supplied payout destinations.
    function allocate(
        address reactiveSender_,
        uint256 originChain,
        address originToken,
        address payer,
        uint256 originTxHash,
        uint256 logIndex,
        uint256 originBlock,
        uint256 amount
    ) external onlyServiceProvider onlyCallbackSender(reactiveSender_) nonReentrant whenNotPaused {
        if (
            originChain != block.chainid || originToken != address(token) || originTxHash == 0 || originBlock == 0
                || originBlock > block.number || payer == address(this) || amount == 0 || _rules.length == 0
        ) revert InvalidPayment();
        bytes32 id = paymentId(originTxHash, logIndex);
        if (processed[id]) {
            emit DuplicateIgnored(id);
            return;
        }
        if (originBlock <= recoveryBlock) revert PaymentRecovered(originBlock, recoveryBlock);
        uint256 balance = token.balanceOf(address(this));
        if (balance < amount) revert InsufficientTokenBalance(amount, balance);
        processed[id] = true;
        totalDistributed += amount;
        ++paymentCount;
        // Snapshot before external calls, including callbacks from a hostile token.
        Rule[] memory current = _rules;
        uint256 version = policyVersion;
        uint256 remaining = amount;
        for (uint256 i; i < current.length; ++i) {
            uint256 share = i == current.length - 1 ? remaining : Math.mulDiv(amount, current[i].bps, BPS);
            remaining -= share;
            if (share != 0) token.safeTransfer(current[i].recipient, share);
            emit AllocationPaid(id, current[i].recipient, share, i);
        }
        emit PaymentAllocated(id, originTxHash, payer, logIndex, amount, version);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function resume() external onlyOwner {
        _unpause();
    }

    function coverDebt() external {
        _coverDebt();
    }

    /// @notice Recover all supported funds to the owner, invalidating old pending callbacks.
    /// @dev New deposits in this block are also below the cutoff; they remain recoverable.
    function recover() external onlyOwner whenPaused nonReentrant {
        recoveryBlock = block.number;
        uint256 amount = token.balanceOf(address(this));
        token.safeTransfer(owner(), amount);
        emit FundsRecovered(owner(), amount, recoveryBlock);
    }

    function recoverUnsupported(IERC20 other) external onlyOwner nonReentrant {
        if (address(other) == address(token)) revert InvalidConfiguration();
        uint256 amount = other.balanceOf(address(this));
        other.safeTransfer(owner(), amount);
        emit UnsupportedTokenRecovered(address(other), amount);
    }

    // Accidental renunciation would permanently strand recovery and policy control.
    function renounceOwnership() public view override onlyOwner {
        revert OwnershipRequired();
    }
}
