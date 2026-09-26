// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EventTicket
/// @notice ERC-721 tickets and primary-sale rules for a single event.
contract EventTicket is ERC721, Ownable, ReentrancyGuard {
    enum SaleStatus {
        Pending,
        Active,
        SoldOut,
        Ended
    }

    struct EventConfig {
        string name;
        string symbol;
        string eventMetadataURI;
        uint64 salesStartAt;
        uint64 eventStartsAt;
        uint256 maxSupply;
        uint256 primaryPrice;
        uint16 creatorFeeBps;
        uint256 maxResalePrice;
    }

    error InvalidOrganizer();
    error InvalidSupply();
    error InvalidPrimaryPrice();
    error InvalidSchedule(uint64 salesStartAt, uint64 eventStartsAt);
    error CreatorFeeTooHigh(uint16 creatorFeeBps);
    error InvalidMaxResalePrice(uint256 primaryPrice, uint256 maxResalePrice);
    error SaleNotStarted(uint64 salesStartAt);
    error SaleEnded(uint64 eventStartsAt);
    error InvalidQuantity(uint256 quantity);
    error InsufficientSupply(uint256 requested, uint256 available);
    error IncorrectPayment(uint256 expected, uint256 received);
    error TicketAlreadyUsed(uint256 tokenId);
    error TicketDoesNotExist(uint256 tokenId);
    error NothingToWithdraw();
    error WithdrawalFailed();

    event TicketsPurchased(
        address indexed buyer, uint256 indexed firstTokenId, uint256 quantity, uint256 totalPrice
    );
    event TicketCheckedIn(uint256 indexed tokenId, address indexed attendee);
    event ProceedsWithdrawn(address indexed organizer, uint256 amount);

    uint16 public constant MAX_CREATOR_FEE_BPS = 1_000;
    uint256 public constant MAX_TICKETS_PER_PURCHASE = 10;

    uint64 public immutable salesStartAt;
    uint64 public immutable eventStartsAt;
    uint256 public immutable maxSupply;
    uint256 public immutable primaryPrice;
    uint16 public immutable creatorFeeBps;
    uint256 public immutable maxResalePrice;

    uint256 private _nextTokenId = 1;
    string private _eventMetadataURI;

    mapping(uint256 tokenId => bool used) public isUsed;

    constructor(EventConfig memory config, address organizer_)
        ERC721(config.name, config.symbol)
        Ownable(organizer_)
    {
        if (organizer_ == address(0)) revert InvalidOrganizer();
        if (config.maxSupply == 0) revert InvalidSupply();
        if (config.primaryPrice == 0) revert InvalidPrimaryPrice();
        // Second-level timestamp precision is sufficient for event scheduling.
        // forge-lint: disable-next-line(block-timestamp)
        if (config.salesStartAt >= config.eventStartsAt || config.eventStartsAt <= block.timestamp)
        {
            revert InvalidSchedule(config.salesStartAt, config.eventStartsAt);
        }
        if (config.creatorFeeBps > MAX_CREATOR_FEE_BPS) {
            revert CreatorFeeTooHigh(config.creatorFeeBps);
        }
        if (config.maxResalePrice < config.primaryPrice) {
            revert InvalidMaxResalePrice(config.primaryPrice, config.maxResalePrice);
        }

        _eventMetadataURI = config.eventMetadataURI;
        salesStartAt = config.salesStartAt;
        eventStartsAt = config.eventStartsAt;
        maxSupply = config.maxSupply;
        primaryPrice = config.primaryPrice;
        creatorFeeBps = config.creatorFeeBps;
        maxResalePrice = config.maxResalePrice;
    }

    /// @notice Purchases one ticket at the fixed primary-sale price.
    function buyTicket() external payable nonReentrant returns (uint256 tokenId) {
        tokenId = _buyTickets(1);
    }

    /// @notice Purchases multiple consecutive ticket IDs in a single transaction.
    /// @return firstTokenId The first token ID minted in the batch.
    function buyTickets(uint256 quantity)
        external
        payable
        nonReentrant
        returns (uint256 firstTokenId)
    {
        firstTokenId = _buyTickets(quantity);
    }

    /// @notice Marks a ticket as used. Only the event organizer can check in attendees.
    function checkIn(uint256 tokenId) external onlyOwner {
        address attendee = _ownerOf(tokenId);
        if (attendee == address(0)) revert TicketDoesNotExist(tokenId);
        if (isUsed[tokenId]) revert TicketAlreadyUsed(tokenId);

        isUsed[tokenId] = true;
        emit TicketCheckedIn(tokenId, attendee);
    }

    /// @notice Withdraws accumulated primary-sale proceeds to the organizer.
    function withdrawProceeds() external nonReentrant onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();

        address organizer = owner();
        emit ProceedsWithdrawn(organizer, amount);

        // Protected by nonReentrant; call is used so contract-wallet organizers are supported.
        // forge-lint: disable-next-line(reentrancy-eth)
        (bool success,) = payable(organizer).call{ value: amount }("");
        if (!success) revert WithdrawalFailed();
    }

    function saleStatus() external view returns (SaleStatus) {
        // Event lifecycle intentionally follows the chain timestamp.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < salesStartAt) return SaleStatus.Pending;
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp >= eventStartsAt) return SaleStatus.Ended;
        if (_nextTokenId > maxSupply) return SaleStatus.SoldOut;
        return SaleStatus.Active;
    }

    function totalMinted() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    function ticketsAvailable() external view returns (uint256) {
        return maxSupply - totalMinted();
    }

    function eventMetadataURI() external view returns (string memory) {
        return _eventMetadataURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _eventMetadataURI;
    }

    function _buyTickets(uint256 quantity) private returns (uint256 firstTokenId) {
        // Event lifecycle intentionally follows the chain timestamp.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp < salesStartAt) revert SaleNotStarted(salesStartAt);
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp >= eventStartsAt) revert SaleEnded(eventStartsAt);
        if (quantity == 0 || quantity > MAX_TICKETS_PER_PURCHASE) {
            revert InvalidQuantity(quantity);
        }

        uint256 available = maxSupply - totalMinted();
        if (quantity > available) revert InsufficientSupply(quantity, available);

        uint256 expectedPayment = primaryPrice * quantity;
        if (msg.value != expectedPayment) {
            revert IncorrectPayment(expectedPayment, msg.value);
        }

        firstTokenId = _nextTokenId;
        for (uint256 i; i < quantity; ++i) {
            _safeMint(msg.sender, _nextTokenId++);
        }

        // nonReentrant prevents ERC-721 receiver callbacks from reentering the sale.
        // forge-lint: disable-next-line(reentrancy-events)
        emit TicketsPurchased(msg.sender, firstTokenId, quantity, msg.value);
    }

    /// @dev Used tickets remain owned by the attendee but cannot be transferred again.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        if (to != address(0) && isUsed[tokenId]) {
            // _update is also reached by the bounded batch-mint loop.
            // forge-lint: disable-next-line(require-revert-in-loop)
            revert TicketAlreadyUsed(tokenId);
        }
        return super._update(to, tokenId, auth);
    }
}
