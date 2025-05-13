import { gql } from "@apollo/client";

export const GET_AI_HISTORY = gql`
  query GetAIVisuals($userID: ID!) {
    genAIS(where: { author: { id: { equals: $userID } } }) {
      langGraphThread
      createdAt
    }
  }
`;

export const CREATE_GEN_AI = gql`
  mutation CreateGenAI($userID: ID!, $thread: String!) {
    createGenAI(data:  {
       author:  {
          connect:  {
             id: $userID
          }
       },
       langGraphThread: $thread
    }) {
      langGraphThread
    }
  }
  `;
