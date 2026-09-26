// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title EventTicket
/// @notice ERC-721 tickets for a single event.
contract EventTicket is ERC721, Ownable, ReentrancyGuard {
    error InvalidOrganizer();
    error InvalidSupply();
    error IncorrectPayment(uint256 expected, uint256 received);
    error SoldOut();
    error TicketAlreadyUsed(uint256 tokenId);
    error TicketDoesNotExist(uint256 tokenId);
    error NothingToWithdraw();
    error WithdrawalFailed();

    event TicketPurchased(address indexed buyer, uint256 indexed tokenId, uint256 price);
    event TicketCheckedIn(uint256 indexed tokenId, address indexed attendee);
    event ProceedsWithdrawn(address indexed organizer, uint256 amount);

    uint256 public immutable maxSupply;
    uint256 public immutable primaryPrice;

    uint256 private _nextTokenId = 1;
    string private _eventMetadataURI;

    mapping(uint256 tokenId => bool used) public isUsed;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory eventMetadataURI_,
        address organizer_,
        uint256 maxSupply_,
        uint256 primaryPrice_
    ) ERC721(name_, symbol_) Ownable(organizer_) {
        if (organizer_ == address(0)) revert InvalidOrganizer();
        if (maxSupply_ == 0) revert InvalidSupply();

        _eventMetadataURI = eventMetadataURI_;
        maxSupply = maxSupply_;
        primaryPrice = primaryPrice_;
    }

    /// @notice Purchases one ticket at the fixed primary-sale price.
    function buyTicket() external payable nonReentrant returns (uint256 tokenId) {
        if (msg.value != primaryPrice) {
            revert IncorrectPayment(primaryPrice, msg.value);
        }
        if (_nextTokenId > maxSupply) revert SoldOut();

        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        // nonReentrant prevents the ERC-721 receiver callback from reentering this sale.
        // forge-lint: disable-next-line(reentrancy-events)
        emit TicketPurchased(msg.sender, tokenId, msg.value);
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

    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _eventMetadataURI;
    }

    /// @dev Used tickets remain owned by the attendee but cannot be transferred again.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        if (to != address(0) && isUsed[tokenId]) {
            revert TicketAlreadyUsed(tokenId);
        }
        return super._update(to, tokenId, auth);
    }
}
