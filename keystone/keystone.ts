// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config

import { config } from "@keystone-6/core";
import type { ServerConfig } from "@keystone-6/core/types";
import type { AdminUIConfig } from "@keystone-6/core/types";

// to keep this file tidy, we define our schema in a different file
import { lists } from "./schema";

// authentication is configured separately here too, but you might move this elsewhere
// when you write your list-level access control functions, as they typically rely on session data
import { withAuth, session } from "./auth";

import dotenv from "dotenv";

dotenv.config();

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.ASSET_BASE_URL_DEV
    : process.env.ASSET_BASE_URL;

export default withAuth(
  config({
    db: {
      // we're using sqlite for the fastest startup experience
      //   for more information on what database might be appropriate for you
      //   see https://keystonejs.com/docs/guides/choosing-a-database#title
      provider:
        process.env.NODE_ENV === "development" ? "sqlite" : "postgresql",
      url:
        process.env.NODE_ENV === "development"
          ? "file:./keystone.db"
          : process.env.POSTGRES_URL || 'file:./keystone.db',
    },
    ui: {
      isAccessAllowed: (context) => context.session?.data.isAdmin,
    },
    lists,
    session,
    server: {
      port: 3001,
      cors: {
        origin: [
          process.env.NODE_ENV === "development"
            ? process.env.FRONTEND_URL_DEV
            : process.env.FRONTEND_URL,
        ],
        credentials: true,
        hostname: '127.0.0.1' // May secure server? Check alongside nginx request proxy
      },
    },
    storage: {
      cover_images: {
        kind: "local",
        type: "image",
        generateUrl: (path) => `${baseUrl}/images${path}`,
        serverRoute: {
          path: "/images",
        },
        storagePath: `public/images`,
      },
      p5_visuals: {
        kind: "local",
        type: "file",
        generateUrl: (path) => `${baseUrl}/code${path}`,
        serverRoute: {
          path: "/code",
        },
        storagePath: `public/code`,
      },
    },
  })
);
