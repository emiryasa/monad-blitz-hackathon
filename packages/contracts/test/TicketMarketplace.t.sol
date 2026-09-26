// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { EventFactory } from "../src/EventFactory.sol";
import { EventTicket } from "../src/EventTicket.sol";
import { TicketMarketplace } from "../src/TicketMarketplace.sol";

contract TicketMarketplaceTest is Test {
    EventFactory private factory;
    EventTicket private ticket;
    TicketMarketplace private marketplace;

    address private organizer = makeAddr("organizer");
    address private seller = makeAddr("seller");
    address private buyer = makeAddr("buyer");
    address private other = makeAddr("other");

    uint64 private constant SALES_START = 10 days;
    uint64 private constant EVENT_START = 30 days;
    uint64 private constant LISTING_EXPIRY = 20 days;
    uint256 private constant PRIMARY_PRICE = 1 ether;
    uint256 private constant LISTING_PRICE = 1.5 ether;
    uint256 private constant MAX_RESALE_PRICE = 2 ether;
    uint16 private constant CREATOR_FEE_BPS = 500;
    uint256 private constant TOKEN_ID = 1;

    function setUp() external {
        factory = new EventFactory();
        marketplace = new TicketMarketplace(address(factory));

        vm.prank(organizer);
        ticket = EventTicket(factory.createEvent(_defaultConfig()));

        vm.deal(seller, 100 ether);
        vm.deal(buyer, 100 ether);
        vm.deal(other, 100 ether);
        vm.warp(SALES_START);

        vm.prank(seller);
        ticket.buyTicket{ value: PRIMARY_PRICE }();

        vm.prank(seller);
        ticket.approve(address(marketplace), TOKEN_ID);
    }

    function testFactoryRegistersTicketCollection() external view {
        assertTrue(factory.isEventTicket(address(ticket)));
    }

    function testOwnerCanListTicket() external {
        _listDefault();

        (address storedSeller, uint256 price, uint64 expiresAt) =
            marketplace.listings(address(ticket), TOKEN_ID);
        assertEq(storedSeller, seller);
        assertEq(price, LISTING_PRICE);
        assertEq(expiresAt, LISTING_EXPIRY);
        assertTrue(marketplace.isListingValid(address(ticket), TOKEN_ID));
    }

    function testSellerCanUpdateListing() external {
        _listDefault();

        uint256 updatedPrice = 1.75 ether;
        uint64 updatedExpiry = 25 days;
        vm.prank(seller);
        marketplace.updateListing(address(ticket), TOKEN_ID, updatedPrice, updatedExpiry);

        (address storedSeller, uint256 price, uint64 expiresAt) =
            marketplace.listings(address(ticket), TOKEN_ID);
        assertEq(storedSeller, seller);
        assertEq(price, updatedPrice);
        assertEq(expiresAt, updatedExpiry);
    }

    function testSellerCanCancelListing() external {
        _listDefault();

        vm.prank(seller);
        marketplace.cancelListing(address(ticket), TOKEN_ID);

        (address storedSeller,,) = marketplace.listings(address(ticket), TOKEN_ID);
        assertEq(storedSeller, address(0));
    }

    function testBuyerCanPurchaseListing() external {
        _listDefault();

        vm.prank(buyer);
        marketplace.buyListing{ value: LISTING_PRICE }(address(ticket), TOKEN_ID);

        uint256 creatorFee = LISTING_PRICE * CREATOR_FEE_BPS / 10_000;
        assertEq(ticket.ownerOf(TOKEN_ID), buyer);
        assertEq(marketplace.pendingWithdrawals(organizer), creatorFee);
        assertEq(marketplace.pendingWithdrawals(seller), LISTING_PRICE - creatorFee);
        assertEq(address(marketplace).balance, LISTING_PRICE);

        (address storedSeller,,) = marketplace.listings(address(ticket), TOKEN_ID);
        assertEq(storedSeller, address(0));
    }

    function testSellerAndOrganizerCanWithdrawSaleProceeds() external {
        _listDefault();

        vm.prank(buyer);
        marketplace.buyListing{ value: LISTING_PRICE }(address(ticket), TOKEN_ID);

        uint256 creatorFee = LISTING_PRICE * CREATOR_FEE_BPS / 10_000;
        uint256 sellerBalanceBefore = seller.balance;
        uint256 organizerBalanceBefore = organizer.balance;

        vm.prank(seller);
        marketplace.withdrawProceeds();

        vm.prank(organizer);
        marketplace.withdrawProceeds();

        assertEq(seller.balance, sellerBalanceBefore + LISTING_PRICE - creatorFee);
        assertEq(organizer.balance, organizerBalanceBefore + creatorFee);
        assertEq(address(marketplace).balance, 0);
    }

    function testListingRevertsWithoutMarketplaceApproval() external {
        vm.prank(seller);
        ticket.approve(address(0), TOKEN_ID);

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(TicketMarketplace.MarketplaceNotApproved.selector, TOKEN_ID)
        );
        marketplace.listTicket(address(ticket), TOKEN_ID, LISTING_PRICE, LISTING_EXPIRY);
    }

    function testListingRevertsAboveResalePriceCap() external {
        uint256 invalidPrice = MAX_RESALE_PRICE + 1;

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                TicketMarketplace.ResalePriceExceeded.selector, MAX_RESALE_PRICE, invalidPrice
            )
        );
        marketplace.listTicket(address(ticket), TOKEN_ID, invalidPrice, LISTING_EXPIRY);
    }

    function testListingRevertsWhenExpirationIsAfterEvent() external {
        uint64 invalidExpiry = EVENT_START + 1;

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                TicketMarketplace.InvalidExpiration.selector, invalidExpiry, EVENT_START
            )
        );
        marketplace.listTicket(address(ticket), TOKEN_ID, LISTING_PRICE, invalidExpiry);
    }

    function testPurchaseRevertsForSeller() external {
        _listDefault();

        vm.prank(seller);
        vm.expectRevert(TicketMarketplace.SelfPurchase.selector);
        marketplace.buyListing{ value: LISTING_PRICE }(address(ticket), TOKEN_ID);
    }

    function testPurchaseRevertsWithIncorrectPayment() external {
        _listDefault();

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(
                TicketMarketplace.IncorrectPayment.selector, LISTING_PRICE, PRIMARY_PRICE
            )
        );
        marketplace.buyListing{ value: PRIMARY_PRICE }(address(ticket), TOKEN_ID);
    }

    function testPurchaseRevertsAfterListingExpires() external {
        _listDefault();
        vm.warp(LISTING_EXPIRY);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(TicketMarketplace.ListingExpired.selector, LISTING_EXPIRY)
        );
        marketplace.buyListing{ value: LISTING_PRICE }(address(ticket), TOKEN_ID);
    }

    function testPurchaseRevertsAfterTicketWasTransferred() external {
        _listDefault();

        vm.prank(seller);
        ticket.transferFrom(seller, other, TOKEN_ID);

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(TicketMarketplace.StaleListing.selector, seller, other)
        );
        marketplace.buyListing{ value: LISTING_PRICE }(address(ticket), TOKEN_ID);
    }

    function testAnyoneCanInvalidateStaleListing() external {
        _listDefault();

        vm.prank(seller);
        ticket.transferFrom(seller, other, TOKEN_ID);

        vm.prank(buyer);
        marketplace.invalidateListing(address(ticket), TOKEN_ID);

        (address storedSeller,,) = marketplace.listings(address(ticket), TOKEN_ID);
        assertEq(storedSeller, address(0));
    }

    function testCheckedInTicketInvalidatesListing() external {
        _listDefault();

        vm.prank(organizer);
        ticket.checkIn(TOKEN_ID);

        assertFalse(marketplace.isListingValid(address(ticket), TOKEN_ID));

        vm.prank(other);
        marketplace.invalidateListing(address(ticket), TOKEN_ID);
    }

    function testOnlySellerCanCancelListing() external {
        _listDefault();

        vm.prank(other);
        vm.expectRevert(
            abi.encodeWithSelector(TicketMarketplace.NotListingSeller.selector, other, seller)
        );
        marketplace.cancelListing(address(ticket), TOKEN_ID);
    }

    function testUnregisteredCollectionCannotBeListed() external {
        address unsupportedCollection = makeAddr("unsupportedCollection");

        vm.prank(seller);
        vm.expectRevert(
            abi.encodeWithSelector(
                TicketMarketplace.UnsupportedCollection.selector, unsupportedCollection
            )
        );
        marketplace.listTicket(unsupportedCollection, TOKEN_ID, LISTING_PRICE, LISTING_EXPIRY);
    }

    function _listDefault() private {
        vm.prank(seller);
        marketplace.listTicket(address(ticket), TOKEN_ID, LISTING_PRICE, LISTING_EXPIRY);
    }

    function _defaultConfig() private pure returns (EventTicket.EventConfig memory) {
        return EventTicket.EventConfig({
            name: "Monad Istanbul",
            symbol: "MIST",
            eventMetadataURI: "ipfs://event-metadata",
            salesStartAt: SALES_START,
            eventStartsAt: EVENT_START,
            maxSupply: 5,
            primaryPrice: PRIMARY_PRICE,
            creatorFeeBps: CREATOR_FEE_BPS,
            maxResalePrice: MAX_RESALE_PRICE
        });
    }
}
