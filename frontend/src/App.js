import "./App.scss";
import React, { useState, createContext, useEffect } from "react";
import { QueryMainView } from "./components/visuals/main";
import { MainMenu } from "./components/visuals/menu/menu";
import { DevicesManager } from "./components/devices/main";
import { Routes, Route, NavLink } from "react-router-dom";
import { isMobile } from "react-device-detect";
import MobileUnavaiabilityScreen from "./components/mobile";
import HomePage from "./components/home/main";
import Login from "./components/login/main";
import SignUp from "./components/login/signup";
import { useQuery } from "@apollo/client";
import { AUTH_USER } from "./queries/user";
import { NewVisual } from "./components/visuals/menu/new";
import { MainViewLesson } from "./components/lessons/editor/main";
import { LessonMenu } from "./components/lessons/menu/main";

function NavBar({ setShowDevices }) {
  return (
    <nav className="navbar styled-navbar g-0 p-0 d-flex justify-content-between align-items-center">
      <NavLink className="navbar-brand m-0 ms-4 h5" to="/">
        <span className="fw-normal">You:</span> Quantified
      </NavLink>
      <div className="h-100 m-0 g-0 d-flex align-items-center">
        {/*<NavLink className="nav-link" to="/lessons">
          Lessons
  </NavLink>*/}
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
          <Route path="/lessons" element={<LessonMenu />} />
          <Route path="/lessons/:lessonID" element={<MainViewLesson />} />
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
