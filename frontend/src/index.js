import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/js/bootstrap.bundle.min";
import App from "./App";
import "./index.scss";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

const link = createUploadLink({
  uri: process.env.NODE_ENV === "development" ? process.env.REACT_APP_UPLOAD_URI_ENDPOINT_DEV : process.env.UPLOAD_URI_ENDPOINT,
  credentials: "include",
  headers: {
    "Apollo-Require-Preflight": "true",
  },
});

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),
});

// import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// import ErrorPage from "./error-page";

import { Provider } from "react-redux";
import store from "./store/store";
import { BrowserRouter } from "react-router-dom";

/*
const router = createBrowserRouter([
  {
    path: ":visID/*",
    element: <App />,
    errorElement: <ErrorPage />,
  },

]);
{
  path: "*",
  element: <Navigate to="/home/devices" />,
}*/

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </BrowserRouter>
  </ApolloProvider>
);

// <RouterProvider router={router}>
// <Provider>
// </React.StrictMode>
