// Welcome to Keystone!
//
// This file is what Keystone uses as the entry-point to your headless backend
//
// Keystone imports the default export of this file, expecting a Keystone configuration object
//   you can find out more at https://keystonejs.com/docs/apis/config

import { config } from '@keystone-6/core';
import type { ServerConfig } from '@keystone-6/core/types';
import type { AdminUIConfig } from '@keystone-6/core/types';

// to keep this file tidy, we define our schema in a different file
import { lists } from './schema';

// authentication is configured separately here too, but you might move this elsewhere
// when you write your list-level access control functions, as they typically rely on session data
import { withAuth, session } from './auth';

import dotenv from 'dotenv';

dotenv.config();

const {
  ASSET_BASE_URL: baseUrl = 'http://localhost:3001',
} = process.env;


export default withAuth(
  config({
    db: {
      // we're using sqlite for the fastest startup experience
      //   for more information on what database might be appropriate for you
      //   see https://keystonejs.com/docs/guides/choosing-a-database#title
      provider: 'sqlite',
      url: 'file:./keystone.db',
    },
    ui: {
      isAccessAllowed: (context)=>context.session?.data.isAdmin
    },
    lists,
    session,
    server: {
      port: 3000,
      cors: { origin: ['http://localhost:3000'], credentials: true },
    },
    storage: {
      cover_images: {
        kind: 'local',
        type: 'image',
        generateUrl: path => `${baseUrl}/images${path}`,
        serverRoute: {
          path: '/images'
        },
        storagePath: `public/images`
      },
      p5_visuals: {
        kind: 'local',
        type: 'file',
        generateUrl: path => `${baseUrl}/visuals${path}`,
        serverRoute: {
          path: '/visuals'
        },
        storagePath: `public/visuals`
      }
    }
  })
);