import { gql } from "@apollo/client";
export const GET_LESSON = gql`
  query GetLesson($id: ID!) {
    lesson(where: { id: $id }) {
      author {
        id
      }
      content
      id
      title
      visual {
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
    }
  }
`;

export const CHANGE_LESSON = gql`
  mutation ChangeLesson($id: ID!, $data: LessonUpdateInput!) {
    updateLesson(where: { id: $id }, data: $data) {
      content
      id
      title
    }
  }
`;

export const NEW_LESSON = gql`
  mutation NewLesson($data: LessonCreateInput!) {
    createLesson(data: $data) {
      id
    }
  }
`;
