// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { EventFactory } from "./EventFactory.sol";
import { EventTicket } from "./EventTicket.sol";

/// @title TicketMarketplace
/// @notice Non-custodial secondary market for EventFactory ticket collections.
contract TicketMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        uint256 price;
        uint64 expiresAt;
    }

    error InvalidFactory();
    error UnsupportedCollection(address collection);
    error NotTokenOwner(address caller, uint256 tokenId);
    error TicketAlreadyUsed(uint256 tokenId);
    error MarketplaceNotApproved(uint256 tokenId);
    error InvalidPrice();
    error ResalePriceExceeded(uint256 maximum, uint256 provided);
    error InvalidExpiration(uint64 expiresAt, uint64 eventStartsAt);
    error EventAlreadyStarted(uint64 eventStartsAt);
    error AlreadyListed(address collection, uint256 tokenId);
    error ListingNotFound(address collection, uint256 tokenId);
    error NotListingSeller(address caller, address seller);
    error ListingExpired(uint64 expiresAt);
    error SelfPurchase();
    error StaleListing(address expectedSeller, address currentOwner);
    error IncorrectPayment(uint256 expected, uint256 received);
    error ListingStillValid(address collection, uint256 tokenId);
    error NothingToWithdraw();
    error WithdrawalFailed();

    event TicketListed(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint64 expiresAt
    );
    event ListingUpdated(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint64 expiresAt
    );
    event ListingCancelled(
        address indexed collection, uint256 indexed tokenId, address indexed seller
    );
    event ListingInvalidated(
        address indexed collection, uint256 indexed tokenId, address indexed seller
    );
    event TicketSold(
        address indexed collection,
        uint256 indexed tokenId,
        address indexed seller,
        address buyer,
        uint256 price,
        uint256 creatorFee
    );
    event ProceedsWithdrawn(address indexed account, uint256 amount);

    EventFactory public immutable factory;

    mapping(address collection => mapping(uint256 tokenId => Listing)) public listings;
    mapping(address account => uint256 amount) public pendingWithdrawals;

    constructor(address factory_) {
        if (factory_ == address(0)) revert InvalidFactory();
        factory = EventFactory(factory_);
    }

    /// @notice Lists a ticket after its owner has approved this marketplace.
    function listTicket(address collection, uint256 tokenId, uint256 price, uint64 expiresAt)
        external
    {
        EventTicket ticket = _registeredTicket(collection);
        if (listings[collection][tokenId].seller != address(0)) {
            revert AlreadyListed(collection, tokenId);
        }

        _validateSellerAndTicket(ticket, tokenId, msg.sender);
        _validatePriceAndWindow(ticket, price, expiresAt);

        listings[collection][tokenId] =
            Listing({ seller: msg.sender, price: price, expiresAt: expiresAt });

        emit TicketListed(collection, tokenId, msg.sender, price, expiresAt);
    }

    /// @notice Updates the price and expiration of an active listing.
    function updateListing(address collection, uint256 tokenId, uint256 price, uint64 expiresAt)
        external
    {
        Listing storage listing = listings[collection][tokenId];
        _requireListing(listing, collection, tokenId);
        if (listing.seller != msg.sender) {
            revert NotListingSeller(msg.sender, listing.seller);
        }

        EventTicket ticket = _registeredTicket(collection);
        _validateSellerAndTicket(ticket, tokenId, msg.sender);
        _validatePriceAndWindow(ticket, price, expiresAt);

        listing.price = price;
        listing.expiresAt = expiresAt;

        emit ListingUpdated(collection, tokenId, msg.sender, price, expiresAt);
    }

    function cancelListing(address collection, uint256 tokenId) external {
        Listing memory listing = listings[collection][tokenId];
        _requireListing(listing, collection, tokenId);
        if (listing.seller != msg.sender) {
            revert NotListingSeller(msg.sender, listing.seller);
        }

        delete listings[collection][tokenId];
        emit ListingCancelled(collection, tokenId, msg.sender);
    }

    /// @notice Purchases an active listing using native MON.
    function buyListing(address collection, uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[collection][tokenId];
        _requireListing(listing, collection, tokenId);
        if (msg.sender == listing.seller) revert SelfPurchase();

        EventTicket ticket = _registeredTicket(collection);
        _validatePurchase(ticket, tokenId, listing);

        if (msg.value != listing.price) {
            revert IncorrectPayment(listing.price, msg.value);
        }

        delete listings[collection][tokenId];

        uint256 creatorFee = listing.price * ticket.creatorFeeBps() / 10_000;
        pendingWithdrawals[listing.seller] += listing.price - creatorFee;
        pendingWithdrawals[ticket.owner()] += creatorFee;

        // nonReentrant is active before the ERC-721 receiver callback can execute.
        // forge-lint: disable-next-line(reentrancy-no-eth)
        ticket.safeTransferFrom(listing.seller, msg.sender, tokenId);

        // nonReentrant protects the ERC-721 receiver callback.
        // forge-lint: disable-next-line(reentrancy-events)
        emit TicketSold(collection, tokenId, listing.seller, msg.sender, listing.price, creatorFee);
    }

    /// @notice Removes a listing invalidated by transfer, approval removal, expiry, or check-in.
    function invalidateListing(address collection, uint256 tokenId) external {
        Listing memory listing = listings[collection][tokenId];
        _requireListing(listing, collection, tokenId);

        EventTicket ticket = _registeredTicket(collection);
        if (_isListingValid(ticket, tokenId, listing)) {
            revert ListingStillValid(collection, tokenId);
        }

        delete listings[collection][tokenId];
        emit ListingInvalidated(collection, tokenId, listing.seller);
    }

    function withdrawProceeds() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        pendingWithdrawals[msg.sender] = 0;
        emit ProceedsWithdrawn(msg.sender, amount);

        // Protected by nonReentrant and state is cleared before the external call.
        // forge-lint: disable-next-line(reentrancy-eth)
        (bool success,) = payable(msg.sender).call{ value: amount }("");
        if (!success) revert WithdrawalFailed();
    }

    function isListingValid(address collection, uint256 tokenId) external view returns (bool) {
        Listing memory listing = listings[collection][tokenId];
        if (listing.seller == address(0) || !factory.isEventTicket(collection)) return false;
        return _isListingValid(EventTicket(collection), tokenId, listing);
    }

    function _registeredTicket(address collection) private view returns (EventTicket ticket) {
        if (!factory.isEventTicket(collection)) revert UnsupportedCollection(collection);
        ticket = EventTicket(collection);
    }

    function _validateSellerAndTicket(EventTicket ticket, uint256 tokenId, address seller)
        private
        view
    {
        address currentOwner = ticket.ownerOf(tokenId);
        if (currentOwner != seller) revert NotTokenOwner(seller, tokenId);
        if (ticket.isUsed(tokenId)) revert TicketAlreadyUsed(tokenId);
        if (!_isApproved(ticket, seller, tokenId)) revert MarketplaceNotApproved(tokenId);
    }

    function _validatePriceAndWindow(EventTicket ticket, uint256 price, uint64 expiresAt)
        private
        view
    {
        if (price == 0) revert InvalidPrice();

        uint256 maximum = ticket.maxResalePrice();
        if (price > maximum) revert ResalePriceExceeded(maximum, price);

        uint64 eventStart = ticket.eventStartsAt();
        // Event and listing expiration deliberately follow the chain timestamp.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp >= eventStart) revert EventAlreadyStarted(eventStart);
        // forge-lint: disable-next-line(block-timestamp)
        if (expiresAt <= block.timestamp || expiresAt > eventStart) {
            revert InvalidExpiration(expiresAt, eventStart);
        }
    }

    function _validatePurchase(EventTicket ticket, uint256 tokenId, Listing memory listing)
        private
        view
    {
        uint64 eventStart = ticket.eventStartsAt();
        // Event and listing expiration deliberately follow the chain timestamp.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp >= eventStart) revert EventAlreadyStarted(eventStart);
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp >= listing.expiresAt) revert ListingExpired(listing.expiresAt);

        address currentOwner = ticket.ownerOf(tokenId);
        if (currentOwner != listing.seller) {
            revert StaleListing(listing.seller, currentOwner);
        }
        if (ticket.isUsed(tokenId)) revert TicketAlreadyUsed(tokenId);
        if (!_isApproved(ticket, listing.seller, tokenId)) {
            revert MarketplaceNotApproved(tokenId);
        }
    }

    function _isListingValid(EventTicket ticket, uint256 tokenId, Listing memory listing)
        private
        view
        returns (bool)
    {
        // Event and listing expiration deliberately follow the chain timestamp.
        // forge-lint: disable-next-line(block-timestamp)
        if (block.timestamp >= listing.expiresAt || block.timestamp >= ticket.eventStartsAt()) {
            return false;
        }
        if (ticket.ownerOf(tokenId) != listing.seller || ticket.isUsed(tokenId)) return false;
        return _isApproved(ticket, listing.seller, tokenId);
    }

    function _isApproved(EventTicket ticket, address seller, uint256 tokenId)
        private
        view
        returns (bool)
    {
        return ticket.getApproved(tokenId) == address(this)
            || ticket.isApprovedForAll(seller, address(this));
    }

    function _requireListing(Listing memory listing, address collection, uint256 tokenId)
        private
        pure
    {
        if (listing.seller == address(0)) revert ListingNotFound(collection, tokenId);
    }
}
