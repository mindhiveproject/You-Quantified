# You: Quantified
This project brings tools to easily visualize, record and work with physiological data on a web-based environment. It's meant as a learning tool to help us understand the _Quantified Self_ (self-knowledge through numbers). You can visit the website at [youquantified.com](https://youquantified.com).

## Installing and running the App
To install and run this app, you must run the front end and back end (keystone) separately. Navigate into each folder on different command lines and run

`npm install`

#### Front end 
The front end was built using react. Before running the front end, you must configure a .env file. This file will create "environmental variables" that are fed into the running instance of node.js and provide runtime tokens. Your .env file should look something like this:

```
REACT_APP_CORTEX_CLIENT_ID = [EMOTIV CORTEX Client ID]
REACT_APP_CORTEX_CLIENT_SECRET = [EMOTIV CORTEX Client Secret]
REACT_APP_CORTEX_LICENSE= ""
REACT_APP_UPLOAD_URI_ENDPOINT_DEV = "http://localhost:3001/api/graphql"
REACT_APP_UPLOAD_URI_ENDPOINT = [Use the web address from production, i.e. https://backend.production.com/api/graphql]
GENERATE_SOURCEMAP = false
```


Aftewards, you can begin the project in development mode using.

`npm start`

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

To build and run a deployment version, you can use:

```
npm run build
npm install -g serve
serve -s build
```


#### Back end 
The back end was built using [KeystoneJS](https://keystonejs.com). Before compiling or running, you must also configure a .env file to provide tokens. The file, in this case, will have the following structure:
```
NODE_ENV = 'development'
SESSION_SECRET = [32-character long secret key for encrypting cookie data]
SESSION_DOMAIN_DEV = "localhost"
SESSION_DOMAIN = [Web domain for production, i.e. frontend_url.com]
ASSET_BASE_URL_DEV = "http://localhost:3001"
ASSET_BASE_URL = [Backend production address, i.e. https://backend.production.com]
FRONTEND_URL_DEV = "http://localhost:3000"
FRONTEND_URL = [Front end URL in production, i.e. https://frontend_url.com]
POSTGRES_URL = [Production database URL]
PORT = 3001
```

Run the back end with

`npm run dev`

Open [http://localhost:3001](http://localhost:3001) to view Keystone's UI.


###### Documentation 
I wrote a bit of [documentation](https://creative-quantified-self.gitbook.io/docs/) that provides some of the basics:
* How to use and connect devices
* Add/edit P5.js visualizations
* A small guide on interpreting EEG signal metrics

And also includes advanced information to allow developers to contribute with new components that seamlessly interact with the data that's already streaming from the devices.


## Devices
This is a simple web app built using React and Node.js. It leverages multiple frameworks for working with different devices and being able to process their data within JavaScript. The implementation of future devices is being explored through LSL and/or Brainflow. Currently it has support fot the devices listed here.

### Muse 2
EEG sensing headband. The application interfaces with the Muse using the Chrome's Bluetooth API thanks to the [muse-js](https://github.com/urish/muse-js) module.

### EMOTIV
A variety of wireless EEG headsets. EMOTIV provides access to derived EEG metrics using their launcher and the [Cortex API](https://github.com/Emotiv/cortex-example). Raw EEG metrics require a paid license in the EMOTIV launcher. Currently, the API keys and the license information can be specified in your own .env file.

## Visuals
The project uses P5.js as the basis for the creative visualizations. The visuals are run in a code sandbox similar to the online P5.js editor, so that you can copy-paste the code. The data is streamed into the iframe containing the P5.js instance by sending [Window messages](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). It receives them outside of the visible code in a `data` object. To retrieve a parameter, use `data?.["PARAMETER NAME"]`.

Currently, if you want to add a file, you would need to host it elsewhere on the web and directly link to it within the P5.js code or add it to the project directory, since the backend is not currently conected to a file server.

## Authorship
This app was created at NYU as part of a research project.
