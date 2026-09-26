// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { EventFactory } from "../src/EventFactory.sol";
import { EventTicket } from "../src/EventTicket.sol";

contract EventTicketTest is Test {
    EventFactory private factory;
    EventTicket private ticket;

    address private organizer = makeAddr("organizer");
    address private buyer = makeAddr("buyer");
    address private secondBuyer = makeAddr("secondBuyer");

    uint64 private constant SALES_START = 10 days;
    uint64 private constant EVENT_START = 30 days;
    uint256 private constant MAX_SUPPLY = 5;
    uint256 private constant PRICE = 1 ether;
    uint16 private constant CREATOR_FEE_BPS = 500;
    uint256 private constant MAX_RESALE_PRICE = 2 ether;

    function setUp() external {
        factory = new EventFactory();

        vm.prank(organizer);
        address ticketAddress = factory.createEvent(_defaultConfig());

        ticket = EventTicket(ticketAddress);
        vm.deal(buyer, 100 ether);
        vm.deal(secondBuyer, 100 ether);
        vm.warp(SALES_START);
    }

    function testFactoryRegistersFullEventConfiguration() external view {
        assertEq(factory.eventCount(), 1);

        EventFactory.EventInfo memory eventInfo = factory.getEvent(0);
        assertEq(eventInfo.ticket, address(ticket));
        assertEq(eventInfo.organizer, organizer);
        assertEq(eventInfo.name, "Monad Istanbul");
        assertEq(eventInfo.symbol, "MIST");
        assertEq(eventInfo.eventMetadataURI, "ipfs://event-metadata");
        assertEq(eventInfo.salesStartAt, SALES_START);
        assertEq(eventInfo.eventStartsAt, EVENT_START);
        assertEq(eventInfo.maxSupply, MAX_SUPPLY);
        assertEq(eventInfo.primaryPrice, PRICE);
        assertEq(eventInfo.creatorFeeBps, CREATOR_FEE_BPS);
        assertEq(eventInfo.maxResalePrice, MAX_RESALE_PRICE);
        assertEq(ticket.owner(), organizer);
    }

    function testBuyerCanPurchaseSingleTicket() external {
        vm.prank(buyer);
        uint256 tokenId = ticket.buyTicket{ value: PRICE }();

        assertEq(tokenId, 1);
        assertEq(ticket.ownerOf(tokenId), buyer);
        assertEq(ticket.totalMinted(), 1);
        assertEq(ticket.ticketsAvailable(), MAX_SUPPLY - 1);
        assertEq(address(ticket).balance, PRICE);
    }

    function testBuyerCanPurchaseMultipleTickets() external {
        vm.prank(buyer);
        uint256 firstTokenId = ticket.buyTickets{ value: PRICE * 3 }(3);

        assertEq(firstTokenId, 1);
        assertEq(ticket.ownerOf(1), buyer);
        assertEq(ticket.ownerOf(2), buyer);
        assertEq(ticket.ownerOf(3), buyer);
        assertEq(ticket.totalMinted(), 3);
        assertEq(ticket.ticketsAvailable(), 2);
    }

    function testPurchaseRevertsBeforeSaleStarts() external {
        vm.warp(SALES_START - 1);

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(EventTicket.SaleNotStarted.selector, SALES_START));
        ticket.buyTicket{ value: PRICE }();
    }

    function testPurchaseRevertsWhenEventHasStarted() external {
        vm.warp(EVENT_START);

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(EventTicket.SaleEnded.selector, EVENT_START));
        ticket.buyTicket{ value: PRICE }();
    }

    function testPurchaseRevertsWithIncorrectBatchPayment() external {
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicket.IncorrectPayment.selector, PRICE * 2, PRICE)
        );
        ticket.buyTickets{ value: PRICE }(2);
    }

    function testPurchaseRevertsWithInvalidQuantity() external {
        uint256 invalidQuantity = ticket.MAX_TICKETS_PER_PURCHASE() + 1;

        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicket.InvalidQuantity.selector, invalidQuantity)
        );
        ticket.buyTickets{ value: PRICE * invalidQuantity }(invalidQuantity);
    }

    function testPurchaseRevertsWhenSupplyIsInsufficient() external {
        vm.prank(buyer);
        ticket.buyTickets{ value: PRICE * 4 }(4);

        vm.prank(secondBuyer);
        vm.expectRevert(abi.encodeWithSelector(EventTicket.InsufficientSupply.selector, 2, 1));
        ticket.buyTickets{ value: PRICE * 2 }(2);
    }

    function testSaleStatusTracksLifecycle() external {
        vm.warp(SALES_START - 1);
        assertEq(uint256(ticket.saleStatus()), uint256(EventTicket.SaleStatus.Pending));

        vm.warp(SALES_START);
        assertEq(uint256(ticket.saleStatus()), uint256(EventTicket.SaleStatus.Active));

        vm.prank(buyer);
        ticket.buyTickets{ value: PRICE * MAX_SUPPLY }(MAX_SUPPLY);
        assertEq(uint256(ticket.saleStatus()), uint256(EventTicket.SaleStatus.SoldOut));

        vm.warp(EVENT_START);
        assertEq(uint256(ticket.saleStatus()), uint256(EventTicket.SaleStatus.Ended));
    }

    function testFactoryRejectsCreatorFeeAboveCap() external {
        EventTicket.EventConfig memory config = _defaultConfig();
        config.creatorFeeBps = ticket.MAX_CREATOR_FEE_BPS() + 1;

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicket.CreatorFeeTooHigh.selector, config.creatorFeeBps)
        );
        factory.createEvent(config);
    }

    function testFactoryRejectsInvalidSchedule() external {
        EventTicket.EventConfig memory config = _defaultConfig();
        config.salesStartAt = config.eventStartsAt;

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicket.InvalidSchedule.selector, config.salesStartAt, config.eventStartsAt
            )
        );
        factory.createEvent(config);
    }

    function testFactoryRejectsResalePriceBelowPrimaryPrice() external {
        EventTicket.EventConfig memory config = _defaultConfig();
        config.maxResalePrice = PRICE - 1;

        vm.prank(organizer);
        vm.expectRevert(
            abi.encodeWithSelector(
                EventTicket.InvalidMaxResalePrice.selector, PRICE, config.maxResalePrice
            )
        );
        factory.createEvent(config);
    }

    function testUsedTicketCannotBeTransferred() external {
        vm.prank(buyer);
        uint256 tokenId = ticket.buyTicket{ value: PRICE }();

        vm.prank(organizer);
        ticket.checkIn(tokenId);

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(EventTicket.TicketAlreadyUsed.selector, tokenId));
        ticket.transferFrom(buyer, secondBuyer, tokenId);
    }

    function testOrganizerCanWithdrawProceeds() external {
        vm.prank(buyer);
        ticket.buyTickets{ value: PRICE * 2 }(2);

        uint256 balanceBefore = organizer.balance;

        vm.prank(organizer);
        ticket.withdrawProceeds();

        assertEq(organizer.balance, balanceBefore + PRICE * 2);
        assertEq(address(ticket).balance, 0);
    }

    function testOnlyOrganizerCanCheckInTicket() external {
        vm.prank(buyer);
        uint256 tokenId = ticket.buyTicket{ value: PRICE }();

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, buyer));
        ticket.checkIn(tokenId);
    }

    function testTicketCannotBeCheckedInTwice() external {
        vm.prank(buyer);
        uint256 tokenId = ticket.buyTicket{ value: PRICE }();

        vm.startPrank(organizer);
        ticket.checkIn(tokenId);
        vm.expectRevert(abi.encodeWithSelector(EventTicket.TicketAlreadyUsed.selector, tokenId));
        ticket.checkIn(tokenId);
        vm.stopPrank();
    }

    function testOnlyOrganizerCanWithdrawPrimarySaleProceeds() external {
        vm.prank(buyer);
        ticket.buyTicket{ value: PRICE }();

        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, buyer));
        ticket.withdrawProceeds();
    }

    function testWithdrawRevertsWhenThereAreNoProceeds() external {
        vm.prank(organizer);
        vm.expectRevert(EventTicket.NothingToWithdraw.selector);
        ticket.withdrawProceeds();
    }

    function testFactoryRejectsZeroSupplyAndZeroPrice() external {
        EventTicket.EventConfig memory config = _defaultConfig();
        config.maxSupply = 0;

        vm.prank(organizer);
        vm.expectRevert(EventTicket.InvalidSupply.selector);
        factory.createEvent(config);

        config = _defaultConfig();
        config.primaryPrice = 0;

        vm.prank(organizer);
        vm.expectRevert(EventTicket.InvalidPrimaryPrice.selector);
        factory.createEvent(config);
    }

    function testFuzzBatchPurchaseMintsExactQuantity(uint8 rawQuantity) external {
        uint256 quantity = bound(rawQuantity, 1, MAX_SUPPLY);

        vm.prank(buyer);
        uint256 firstTokenId = ticket.buyTickets{ value: PRICE * quantity }(quantity);

        assertEq(firstTokenId, 1);
        assertEq(ticket.totalMinted(), quantity);
        assertEq(ticket.ticketsAvailable(), MAX_SUPPLY - quantity);
        assertEq(address(ticket).balance, PRICE * quantity);
        for (uint256 tokenId = 1; tokenId <= quantity; ++tokenId) {
            assertEq(ticket.ownerOf(tokenId), buyer);
        }
    }

    function _defaultConfig() private pure returns (EventTicket.EventConfig memory) {
        return EventTicket.EventConfig({
            name: "Monad Istanbul",
            symbol: "MIST",
            eventMetadataURI: "ipfs://event-metadata",
            salesStartAt: SALES_START,
            eventStartsAt: EVENT_START,
            maxSupply: MAX_SUPPLY,
            primaryPrice: PRICE,
            creatorFeeBps: CREATOR_FEE_BPS,
            maxResalePrice: MAX_RESALE_PRICE
        });
    }
}
