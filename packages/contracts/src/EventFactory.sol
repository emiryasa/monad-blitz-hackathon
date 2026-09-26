// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { EventTicket } from "./EventTicket.sol";

/// @title EventFactory
/// @notice Creates and indexes ticket contracts deployed by event organizers.
contract EventFactory {
    struct EventInfo {
        address ticket;
        address organizer;
    }

    event EventCreated(
        uint256 indexed eventId, address indexed organizer, address indexed ticket, string name
    );

    EventInfo[] private _events;
    mapping(address organizer => address[] tickets) private _organizerEvents;

    function createEvent(
        string calldata name,
        string calldata symbol,
        string calldata eventMetadataURI,
        uint256 maxSupply,
        uint256 primaryPrice
    ) external returns (address ticketAddress) {
        EventTicket ticket = new EventTicket(
            name, symbol, eventMetadataURI, msg.sender, maxSupply, primaryPrice
        );

        ticketAddress = address(ticket);
        uint256 eventId = _events.length;

        _events.push(EventInfo({ ticket: ticketAddress, organizer: msg.sender }));
        _organizerEvents[msg.sender].push(ticketAddress);

        // Deployment has no untrusted callback; emit only after the contract address is known.
        // forge-lint: disable-next-line(reentrancy-events)
        emit EventCreated(eventId, msg.sender, ticketAddress, name);
    }

    function eventCount() external view returns (uint256) {
        return _events.length;
    }

    function getEvent(uint256 eventId) external view returns (EventInfo memory) {
        return _events[eventId];
    }

    function getOrganizerEvents(address organizer) external view returns (address[] memory) {
        return _organizerEvents[organizer];
    }
}
