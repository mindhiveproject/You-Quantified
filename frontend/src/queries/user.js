import { gql } from "@apollo/client";

export const AUTH_USER = gql`
  query {
    authenticatedItem {
      ... on Profile {
        id
        username
        email
        permissions {
          name
          canAccessAdminUI
        }
      }
    }
  }
`;

export const CHANGE_USERNAME = gql`
mutation ChangeUsername($newName: String!, $userID: ID!) {
  updateProfile(where:  {
     id: $userID
  }, data:  {
     username: $newName
  }) {
    id
    username
  }
}`

export const LOGIN_USER = gql`
  mutation UserLogin($email: String!, $password: String!) {
    authenticateProfileWithPassword(email: $email, password: $password) {
      ... on ProfileAuthenticationWithPasswordSuccess {
        item {
          id
          email
          username
          permissions {
            name
            canAccessAdminUI
          }
        }
        sessionToken
      }
      ... on ProfileAuthenticationWithPasswordFailure {
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
  mutation ProfileSignin($data: UserCreateInput!) {
    createProfile(data: $data) {
      email
      username
      id
    }
  }
`;

export const CHECK_REPEATED_USER = gql`
  query CheckRepeatedUser($email: String, $username: String) {
    profilesCount(
      where: {
        OR: [{ email: { equals: $email } }, { username: { equals: $username } }]
      }
    )
  }
`;
