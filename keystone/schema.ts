// Welcome to your schema
//   Schema driven development is Keystone's modus operandi
//
// This file is where we define the lists, fields and hooks for our data.
// If you want to learn more about how lists are configured, please read
// - https://keystonejs.com/docs/config/lists

import { list } from "@keystone-6/core";
import { allowAll } from "@keystone-6/core/access";

// see https://keystonejs.com/docs/fields/overview for the full list of fields
//   this is a few common fields for an example
import {
  text,
  relationship,
  password,
  json,
  timestamp,
  image,
  select,
  checkbox,
  file,
  integer,
} from "@keystone-6/core/fields";

// when using Typescript, you can refine your types to a stricter subset by importing
// the generated types from '.keystone/types'
import type { Lists, UserWhereUniqueInput } from ".keystone/types";

function getVisualFilterQuery(session: any) {
  if (session?.data.isAdmin) return true;
  return {
    OR: [
      // You're the author
      { author: { id: { equals: session?.itemId } } },
      // Public visuals
      { privacy: { equals: "public" } },
      // You have liked & they are unlisted or for friends
      {
        AND: [
          { likes: { some: { id: { equals: session?.itemId } } } },
          {
            OR: [
              { privacy: { equals: "unlisted" } },
              { privacy: { equals: "friends" } },
            ],
          },
        ],
      },
      // Made by a friend and with "friends" privacy
      {
        AND: [
          {
            OR: [
              {
                author: {
                  followers: {
                    some: {
                      requester: { id: { equals: session?.itemId } },
                      status: { equals: "accepted" },
                    },
                  },
                },
              },
              {
                author: {
                  following: {
                    some: {
                      recipient: { id: { equals: session?.itemId } },
                      status: { equals: "accepted" },
                    },
                  },
                },
              },
            ],
          },
          { privacy: { equals: "friends" } },
        ],
      },
    ],
  };
}

export const lists: Lists = {
  User: list({
    access: allowAll,
    fields: {
      name: text({ isIndexed: "unique" }),
      email: text({
        validation: { isRequired: false },
        isIndexed: "unique",
        access: {
          read: ({ session, item }) =>
            item?.id === session?.itemId || !!(session?.data.isAdmin),
          create: () => true,
          update: ({ session, item }) =>
            item?.id === session?.itemId || !!(session?.data.isAdmin),
        },
      }),
      password: password({
        validation: { isRequired: true },
        access: {
          read: ({ session, item }) =>
            item?.id === session?.itemId || !!(session?.data.isAdmin),
          create: () => true,
          update: ({ session, item }) =>
            item?.id === session?.itemId || !!(session?.data.isAdmin),
        },
      }),
      visuals: relationship({ ref: "Visual.author", many: true }),
      isAdmin: checkbox(),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
      }),
      liked: relationship({ ref: "Visual.likes", many: true }),
      following: relationship({ ref: "Friendship.requester", many: true }),
      followers: relationship({ ref: "Friendship.recipient", many: true }),
      genAI: relationship({ ref: "GenAI.author", many: true }),
    },
  }),
  GenAI: list({
    access: allowAll,
    fields: {
      langGraphThread: text({ isIndexed: "unique" }),
      author: relationship({ ref: "User.genAI", many: false }),
      visual: relationship({ ref: "Visual.genAI", many: false }),
      createdAt: timestamp({ defaultValue: { kind: "now" } }), // May 12, 2025
    },
  }),
  Friendship: list({
    access: allowAll,
    fields: {
      requester: relationship({ ref: "User.following", many: false }),
      recipient: relationship({ ref: "User.followers", many: false }),
      status: select({
        options: [
          { label: "Pending", value: "pending" },
          { label: "Accepted", value: "accepted" },
          { label: "Rejected", value: "rejected" },
        ],
        defaultValue: "pending",
      }),
      createdAt: timestamp({ defaultValue: { kind: "now" } }),
    },
  }),
  Visual: list({
    access: {
      operation: {
        query: () => true,
        update: () => true,
        create: () => true,
        delete: () => true,
      },
      item: {
        update: ({ session, item }) =>
          item.authorId === session?.itemId || session?.data.isAdmin,
        create: ({ session }) => !!session,
        delete: ({ session, item }) =>
          item.authorId === session?.itemId || session?.data.isAdmin,
      },
      filter: {
        query: ({ session }) => getVisualFilterQuery(session),
      },
    },

    // this is the fields for our Post list
    fields: {
      title: text({ validation: { isRequired: true } }),
      cover: image({ storage: "cover_images" }),
      code: file({ storage: "p5_visuals" }),
      description: text(),
      author: relationship({ ref: "User.visuals", many: false }),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
      }),
      parameters: json({
        defaultValue: [
          {
            name: "Sample",
            suggested: ["Alpha"],
          },
        ],
      }),
      likes: relationship({ ref: "User.liked", many: true }),
      extensions: json({ defaultValue: [] }),
      docs: json(),
      docsVisible: checkbox(),
      published: checkbox(),
      editable: checkbox(),
      tags: relationship({ ref: "Tag.visuals", many: true }),
      privacy: select({
        options: [
          { label: "Friends", value: "friends" },
          { label: "Public", value: "public" },
          { label: "Private", value: "private" },
          { label: "Unlisted", value: "unlisted" },
        ],
        defaultValue: "private",
      }),
      genAI: relationship({ ref: "GenAI.visual", many: false }),
    },
  }),
  Tag: list({
    access: {
      operation: allowAll,
    },
    fields: {
      label: text(),
      visuals: relationship({ ref: "Visual.tags", many: true }),
    },
  }),
};
