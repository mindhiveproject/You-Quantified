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
    }
  }
`;

export const CHANGE_VISUAL = gql`
  mutation ChangeVisual(
    $where: VisualWhereUniqueInput!
    $data: VisualUpdateInput!
  ) {
    updateVisual(where: $where, data: $data) {
      published
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

export const DELETE_VISUAL = gql`
  mutation DeleteVisual($id: ID!) {
    deleteVisual(where: { id: $id }) {
      id
    }
  }
`;
