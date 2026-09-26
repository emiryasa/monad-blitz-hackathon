// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { EventTicket } from "./EventTicket.sol";

/// @title EventFactory
/// @notice Creates and indexes ticket contracts deployed by event organizers.
contract EventFactory {
    struct EventInfo {
        address ticket;
        address organizer;
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

    event EventCreated(
        uint256 indexed eventId,
        address indexed organizer,
        address indexed ticket,
        string name,
        uint64 eventStartsAt
    );

    EventInfo[] private _events;
    mapping(address organizer => address[] tickets) private _organizerEvents;
    mapping(address ticket => bool registered) public isEventTicket;

    function createEvent(EventTicket.EventConfig calldata config)
        external
        returns (address ticketAddress)
    {
        EventTicket ticket = new EventTicket(config, msg.sender);

        ticketAddress = address(ticket);
        uint256 eventId = _events.length;

        _events.push(
            EventInfo({
                ticket: ticketAddress,
                organizer: msg.sender,
                name: config.name,
                symbol: config.symbol,
                eventMetadataURI: config.eventMetadataURI,
                salesStartAt: config.salesStartAt,
                eventStartsAt: config.eventStartsAt,
                maxSupply: config.maxSupply,
                primaryPrice: config.primaryPrice,
                creatorFeeBps: config.creatorFeeBps,
                maxResalePrice: config.maxResalePrice
            })
        );
        _organizerEvents[msg.sender].push(ticketAddress);
        isEventTicket[ticketAddress] = true;

        // Deployment has no untrusted callback; emit only after the contract address is known.
        // forge-lint: disable-next-line(reentrancy-events)
        emit EventCreated(eventId, msg.sender, ticketAddress, config.name, config.eventStartsAt);
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
