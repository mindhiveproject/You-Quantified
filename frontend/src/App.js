import "./App.scss";
import React, { useState, createContext, useEffect } from "react";
import { QueryMainView } from "./components/visuals/main";
import { MainMenu } from "./components/visuals/menu/menu";
import visSourcesImport from "./metadata/vis";
import { DevicesManager } from "./components/devices/main";
import { Routes, Route, NavLink, useSearchParams } from "react-router-dom";
import { RecordComponent } from "./components/devices/recording";
import { isMobile } from "react-device-detect";
import MobileUnavaiabilityScreen from "./components/mobile";
import LessonBuilder from "./components/lessons/main";
import HomePage from "./components/home/main";
import Login from "./components/login/main";
import SignUp from "./components/login/signup";
import { useQuery } from "@apollo/client";
import { AUTH_USER } from "./queries/user";
import { NewVisual } from "./components/visuals/menu/new";

// Some improvements that I need to make (after env):
// Maybe have the user put his license information in here (?) Otherwise do they access Cortex through our account (?)

// Another useful thing is the stream selection when in the devices tabs:
// Store data mappings on the store
// Don't stream every variable - check which ones the user has selected to only make those available in the dropdown

export const allVisSources = visSourcesImport.map((visSource) => {
  if (visSource.img_src) {
    return {
      name: visSource.name,
      description: visSource.description,
      img_name: require(`./assets/${visSource.img_src}`),
      properties: visSource.properties,
      engine: visSource.engine,
      code: visSource?.code,
      id: visSource.id,
      path: visSource?.path,
    };
  } else {
    return {
      name: visSource.name,
      description: visSource.description,
      properties: visSource.properties,
      engine: visSource.engine,
      code: visSource?.code,
      id: visSource.id,
    };
  }
});

function NavBar({ setShowDevices }) {
  return (
    <nav className="navbar styled-navbar g-0 p-0 d-flex justify-content-between align-items-center">
      <a
        className="navbar-brand m-0 ms-4 h5"
        href="https://creative-quantified-self.gitbook.io/docs/"
        target="_blank"
      >
        <span className="fw-normal">You:</span> Quantified
      </a>
      <div className="h-100 m-0 g-0 d-flex align-items-center">
        <NavLink className="nav-link" to="/lessons">
          Lessons
        </NavLink>
        <NavLink className="nav-link" to="/visuals">
          Visuals
        </NavLink>
        <button className="btn" onClick={() => setShowDevices(true)}>
          Data
        </button>
      </div>
    </nav>
  );
}

// Object where recording is temporarily stored
const saveObject = [];

function DesktopApp() {
  const [showDevices, setShowDevices] = useState(false);
  const [recording, setRecording] = useState(false);

  return (
    <>
      <NavBar setShowDevices={setShowDevices} />
      <div className="hv-100">
        {showDevices && (
          <DevicesManager
            setShowDevices={setShowDevices}
            saveObject={saveObject}
            recording={recording}
            setRecording={setRecording}
          />
        )}
        <Routes>
          <Route path="/lessons" element={<LessonBuilder />} />
          <Route path="/visuals" element={<MainMenu />} />
          <Route path="/visuals-new" element={<NewVisual />} />
          <Route path="/visuals/:visID" element={<QueryMainView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  const renderedContent = isMobile ? (
    <MobileUnavaiabilityScreen />
  ) : (
    <DesktopApp />
  );
  const { data } = useQuery(AUTH_USER);

  const [currentUser, setCurrentUser] = useState(data?.authenticatedItem);

  useEffect(() => {
    setCurrentUser(data?.authenticatedItem);
  }, [data]);

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {renderedContent}
    </UserContext.Provider>
  );
}

export const UserContext = createContext(null);

// Notes

// To persist data in a sessionstorage, I could follow the tutorial
// https://www.geeksforgeeks.org/how-to-persist-redux-state-in-local-storage-without-any-external-library/
// Also featured here: https://stackoverflow.com/questions/49330546/how-to-persist-redux-state-in-the-easiest-way

// It would be session storage instead of local storage though
// To save the data from an object into a CSV, I can use papaparse
// After papaparse, I can manually save with:
// https://stackoverflow.com/questions/19327749/javascript-blob-filename-without-link
