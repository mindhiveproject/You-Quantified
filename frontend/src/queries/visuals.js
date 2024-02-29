import { gql } from "@apollo/client";

export const MY_VISUALS = gql`
  query Query($where: VisualWhereInput!) {
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
