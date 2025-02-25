import { gql } from "@apollo/client";

export const AUTH_USER = gql`
  query {
    authenticatedItem {
      ... on User {
        id
        name
        email
        isAdmin
      }
    }
  }
`;

export const CHANGE_USERNAME = gql`
mutation ChangeUsername($newName: String!, $userID: ID!) {
  updateUser(where:  {
     id: $userID
  }, data:  {
     name: $newName
  }) {
    id
    name
  }
}`

export const LOGIN_USER = gql`
  mutation UserLogin($email: String!, $password: String!) {
    authenticateUserWithPassword(email: $email, password: $password) {
      ... on UserAuthenticationWithPasswordSuccess {
        item {
          id
          email
          name
          isAdmin
        }
        sessionToken
      }
      ... on UserAuthenticationWithPasswordFailure {
        message
      }
    }
  }
`;

export const END_SESSION = gql`
  mutation {
    endSession
  }
`;

export const REGISTER_USER = gql`
  mutation UserSignin($data: UserCreateInput!) {
    createUser(data: $data) {
      email
      name
      id
    }
  }
`;

export const CHECK_REPEATED_USER = gql`
  query CheckRepeatedUser($email: String, $name: String) {
    usersCount(
      where: {
        OR: [{ email: { equals: $email } }, { name: { equals: $name } }]
      }
    )
  }
`;
