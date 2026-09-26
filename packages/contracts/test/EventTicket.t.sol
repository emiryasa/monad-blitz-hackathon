// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "forge-std/Test.sol";
import { EventFactory } from "../src/EventFactory.sol";
import { EventTicket } from "../src/EventTicket.sol";

contract EventTicketTest is Test {
    EventFactory private factory;
    EventTicket private ticket;

    address private organizer = makeAddr("organizer");
    address private buyer = makeAddr("buyer");
    address private secondBuyer = makeAddr("secondBuyer");

    uint256 private constant PRICE = 1 ether;

    function setUp() external {
        factory = new EventFactory();

        vm.prank(organizer);
        address ticketAddress =
            factory.createEvent("Monad Istanbul", "MIST", "ipfs://event-metadata", 2, PRICE);

        ticket = EventTicket(ticketAddress);
        vm.deal(buyer, 10 ether);
        vm.deal(secondBuyer, 10 ether);
    }

    function testFactoryRegistersCreatedEvent() external view {
        assertEq(factory.eventCount(), 1);

        EventFactory.EventInfo memory eventInfo = factory.getEvent(0);
        assertEq(eventInfo.ticket, address(ticket));
        assertEq(eventInfo.organizer, organizer);
        assertEq(ticket.owner(), organizer);
    }

    function testBuyerCanPurchaseTicket() external {
        vm.prank(buyer);
        uint256 tokenId = ticket.buyTicket{ value: PRICE }();

        assertEq(tokenId, 1);
        assertEq(ticket.ownerOf(tokenId), buyer);
        assertEq(ticket.totalMinted(), 1);
        assertEq(address(ticket).balance, PRICE);
    }

    function testPurchaseRevertsWithIncorrectPayment() external {
        vm.prank(buyer);
        vm.expectRevert(
            abi.encodeWithSelector(EventTicket.IncorrectPayment.selector, PRICE, 0.5 ether)
        );
        ticket.buyTicket{ value: 0.5 ether }();
    }

    function testPurchaseRevertsWhenSoldOut() external {
        vm.prank(buyer);
        ticket.buyTicket{ value: PRICE }();

        vm.prank(secondBuyer);
        ticket.buyTicket{ value: PRICE }();

        vm.prank(buyer);
        vm.expectRevert(EventTicket.SoldOut.selector);
        ticket.buyTicket{ value: PRICE }();
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
        ticket.buyTicket{ value: PRICE }();

        uint256 balanceBefore = organizer.balance;

        vm.prank(organizer);
        ticket.withdrawProceeds();

        assertEq(organizer.balance, balanceBefore + PRICE);
        assertEq(address(ticket).balance, 0);
    }
}
