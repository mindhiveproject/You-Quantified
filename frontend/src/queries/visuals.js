import { gql } from "@apollo/client";

export const MY_VISUALS = gql`
  query VisualsQuery($where: VisualWhereInput!) {
    visuals(where: $where) {
      author {
        id
        name
      }
      code {
        url
      }
      cover {
        url
      }
      title
      createdAt
      description
      parameters
      id
      docs
      docsVisible
      editable
      extensions
      likes {
        id
      }
      privacy
      tags {
        id
        label
      }
    }
  }
`;

export const SEARCH_VISUALS = gql`
  query GetOtherVisual($visID: ID!, $title: String) {
    visuals(
      where: {
        OR: [{ id: { equals: $visID } }, { title: { contains: $title } }]
      }
    ) {
      title
      code {
        url
      }
      cover {
        url
      }
      id
      author {
        name
      }
      createdAt
      parameters
    }
  }
`;

export const CHANGE_VISUAL = gql`
  mutation ChangeVisual(
    $where: VisualWhereUniqueInput!
    $data: VisualUpdateInput!
  ) {
    updateVisual(where: $where, data: $data) {
      extensions
      code {
        url
      }
      parameters
    }
  }
`;

export const NEW_VISUAL = gql`
  mutation NewVisual($data: VisualCreateInput!) {
    createVisual(data: $data) {
      id
    }
  }
`;

export const GET_ALL_TAGS = gql`
  query AllTags {
    tags {
      label
    }
  }
`;

export const DELETE_VISUAL = gql`
  mutation DeleteVisual($id: ID!) {
    deleteVisual(where: { id: $id }) {
      id
    }
  }
`;

export const LIKE_VISUAL = gql`
  mutation UpdateVisual($id: ID!, $userID: ID!) {
    updateVisual(
      data: { likes: { connect: [{ id: $userID }] } }
      where: { id: $id }
    ) {
      likesCount
    }
  }
`;

export const UNLIKE_VISUAL = gql`
  mutation UpdateVisual($id: ID!, $userID: ID!) {
    updateVisual(
      data: { likes: { disconnect: [{ id: $userID }] } }
      where: { id: $id }
    ) {
      likesCount
    }
  }
`;
