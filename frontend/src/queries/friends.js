import { gql } from "@apollo/client";

export const SEND_REQUEST = gql`
  mutation SendRequest($recipient: ID!, $requester: ID!) {
    createFriendship(
      data: {
        requester: { connect: { id: $requester } }
        recipient: { connect: { id: $recipient } }
      }
    ) {
      status
      createdAt
      id
    }
  }
`;

export const APPROVE_FRIEND = gql`
  mutation ApproveRequest($friendshipID: ID!) {
    updateFriendship(
      where: { id: $friendshipID }
      data: { status: "accepted" }
    ) {
      status
      createdAt
    }
  }
`;

/*
export const REJECT_FRIEND = gql`
mutation RejectRequest($friendshipID: ID!) {
  updateFriendship(where:  {
     id: $friendshipID
  }, data: {
    status: "rejected"
  }) {
    status
    createdAt
  }
}
`*/

export const DELETE_REQUEST = gql`
  mutation Unfriend($friendshipID: ID!) {
    deleteFriendship(where: { id: $friendshipID }) {
      status
      createdAt
    }
  }
`;
export const GET_FRIENDS = gql`
  query GetFriends($userID: ID!) {
    friendships(
      where: {
        OR: [
          { requester: { id: { equals: $userID } } }
          { recipient: { id: { equals: $userID } } }
        ]
      }
    ) {
      recipient {
        id
        name
        visualsCount
        isAdmin
      }
      requester {
        id
        name
        visualsCount
        isAdmin
      }
      status
      id
    }
  }
`;

export const GET_REQUESTS = gql`
  query GetRequests($userID: ID!) {
    friendships(
      where: {
        OR: [
          { recipient: { id: { equals: $userID } } }
          { requester: { id: { equals: $userID } } }
        ]
      }
    ) {
      recipient {
        id
        name
        visualsCount
      }
      requester {
        id
        name
        visualsCount
      }
      createdAt
      status
    }
  }
`;

export const GET_SENT_REQUESTS = gql`
  query GetSentRequests($userID: ID!) {
    friendships(
      where: {
        AND: [
          { status: { equals: "pending" } }
          { requester: { id: { equals: $userID } } }
        ]
      }
    ) {
      recipient {
        id
        name
        visualsCount
      }
      createdAt
      status
    }
  }
`;

export const GET_RECEIVED_REQUESTS = gql`
  query GetReceivedRequests($userID: ID!) {
    friendships(
      where: {
        AND: [
          { status: { equals: "pending" } }
          { recipient: { id: { equals: $userID } } }
        ]
      }
    ) {
      requester {
        id
        name
        visualsCount
      }
      createdAt
      status
    }
  }
`;

export const GET_USER_DATA = gql`
  query GetOtherUser($userID: ID!, $name: String) {
    users(
      where: { OR: [{ id: { equals: $userID } }, { name: { equals: $name } }] }
    ) {
      name
      visuals {
        id
        createdAt
        likesCount
      }
      visualsCount
      id
    }
  }
`;
