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
      code {
        url
      }
      parameters
    }
  }
`;

export const GET_UNITS = gql`
  query GetAllUnits($userID: ID) {
    units {
      description
      title
      lessons {
        title
        id
        content
        code {
          url
        }
        visual {
          title
        }
        userLessons(where: { author: { id: { equals: $userID } } }) {
          author {
            id
          }
          id
          completedAt
          startedAt
          title
        }
        author {
          id
          isAdmin
        }
      }
    }
  }
`;

export const GET_USER_LESSON = gql`
  query GetUserLesson($id: ID) {
    userLesson(where: { id: $id }) {
      author {
        id
      }
      code {
        url
      }
      content
      parameters
      title
    }
  }
`;

export const CHANGE_USER_LESSON = gql`
  mutation ChangeUserLesson($id: ID!, $data: UserLessonUpdateInput!) {
    updateUserLesson(where: { id: $id }, data: $data) {
      content
      id
      title
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

export const NEW_USER_LESSON = gql`
  mutation NewUserLesson($data: UserLessonCreateInput!) {
    createUserLesson(data: $data) {
      id
    }
  }
`;
