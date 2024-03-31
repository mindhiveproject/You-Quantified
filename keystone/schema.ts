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
import type { Lists } from ".keystone/types";

export const lists: Lists = {
  User: list({
    access: allowAll,
    fields: {
      name: text(),
      email: text({
        validation: { isRequired: true },
        isIndexed: "unique",
      }),
      password: password({ validation: { isRequired: true } }),
      visuals: relationship({ ref: "Visual.author", many: true }),
      lessons: relationship({ ref: "Lesson.author", many: true }),
      userLessons: relationship({ref: "UserLesson.author", many: true}),
      isAdmin: checkbox(),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
      }),
    },
  }),
  Lesson: list({
    access: {
      operation: {
        query: () => true,
      },
      item: {
        update: ({ session, item }) =>
          item.authorId === session?.itemId || session?.isAdmin,
        create: ({ session }) => !!session,
        delete: ({ session, item }) =>
          item.authorId === session?.itemId || session?.isAdmin,
      },
    },

    // this is the fields for our Post list
    fields: {
      title: text({ validation: { isRequired: true } }),
      content: json(),
      author: relationship({ ref: "User.lessons", many: false }),
      createdAt: timestamp({
        defaultValue: { kind: "now" },
      }),
      code: file({ storage: "p5_visuals" }),
      parameters: json({
        defaultValue: [
          {
            name: "Untitled",
            suggested: ["Alpha"],
          },
        ],
      }),
      visual: relationship({ref: "Visual", many: false}),
      unit: relationship({ ref: "Unit.lessons", many: false }),
      userLessons: relationship({ref: "UserLesson.lesson", many: true})
    },
  }),
  UserLesson: list({
    access: {
      operation: {
        query: () => true,
      },
      item: {
        update: ({ session, item }) =>
          item.authorId === session?.itemId || session?.isAdmin,
        create: ({ session }) => !!session,
        delete: ({ session, item }) =>
          item.authorId === session?.itemId || session?.isAdmin,
      },
    },
    // this is the fields for our Post list
    fields: {
      title: text({ validation: { isRequired: true } }),
      content: json(),
      author: relationship({ ref: "User.userLessons", many: false }),
      startedAt: timestamp({
        defaultValue: { kind: "now" },
      }),
      completedAt: timestamp(),
      code: file({ storage: "p5_visuals" }),
      parameters: json({
        defaultValue: [
          {
            name: "Untitled",
            suggested: ["Alpha"],
          },
        ],
      }),
      lesson: relationship({ ref: "Lesson.userLessons", many: false }),
    },
  }),
  Unit: list({
    access: {
      operation: {
        query: () => true,
      },
      item: {
        update: ({ session, item }) =>
          item.authorId === session?.itemId || session?.isAdmin,
        create: ({ session }) => !!session,
        delete: ({ session, item }) =>
          item.authorId === session?.itemId || session?.isAdmin,
      },
    },
    fields: {
      title: text({ validation: { isRequired: true } }),
      duration: integer(),
      description: text(),
      lessons: relationship({ ref: "Lesson.unit", many: true }),
    },
  }),
  Tag: list({
    access: {
      operation: allowAll,
    },
    fields: {
      label: text(),
      visuals: relationship({ ref: "Visual", many: true }),
    },
  }),

  Visual: list({
    access: {
      operation: {
        query: () => true,
      },
      item: {
        update: ({ session, item }) =>
          item.authorId === session?.itemId || session?.data.isAdmin,
        create: ({ session }) => !!session,
        delete: ({ session, item }) =>
          item.authorId === session?.itemId || session?.data.isAdmin,
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
      published: checkbox(),
      editable: checkbox(),
      tags: relationship({ ref: "Tag", many: true }),
    },
  }),
};
