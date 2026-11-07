import "./App.scss";
import React, { useState, createContext, useEffect } from "react";
import { QueryMainView } from "./components/visuals/dashboard/main";
import { MainMenu } from "./components/visuals/menu/menu";
import { Routes, Route, NavLink } from "react-router-dom";
import { isMobile } from "react-device-detect";
import MobileUnavaiabilityScreen from "./components/mobile";
import HomePage from "./components/home/main";
import Login from "./components/login/main";
import SignUp from "./components/login/signup";
import { useQuery } from "@apollo/client/react";
import { AUTH_USER } from "./queries/user";
import { NewVisual } from "./components/visuals/menu/new";
import { AINewVisual } from "./components/visuals/new-ai/main";
import { User } from "./components/profile/main";
import { MyUserName } from "./components/visuals/menu/username";
import { useIsRecording } from "./devices/runtime";

function NavBar() {
  const recording = useIsRecording();
  return (
    <nav className="navbar styled-navbar g-0 p-0 d-flex justify-content-between align-items-center">
      <NavLink className="navbar-brand m-0 ms-4 h5" to="/">
        <span className="fw-normal">You</span>Quantified
      </NavLink>
      <div className="h-100 m-0 g-0 d-flex align-items-center">
        <div className="me-4">
          <MyUserName />
        </div>
        <NavLink className="nav-link" to="/visuals">
          Projects
        </NavLink>
        {recording && <div className="record-indicator" />}
      </div>
    </nav>
  );
}

function DesktopApp() {
  return (
    <div className="h-100 d-flex flex-column">
      <NavBar />
      <div className="hv-100">
        <Routes>
          <Route path="/visuals" element={<MainMenu />} />
          <Route path="/visuals-new" element={<NewVisual />} />
          <Route path="/visuals-new-ai" element={<AINewVisual />} />
          <Route path="/visuals/:visID" element={<QueryMainView />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/user/:userID" element={<User />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  const renderedContent = isMobile ? (
    <MobileUnavaiabilityScreen />
  ) : (
    <DesktopApp />
  );
  const { data, dataState, error } = useQuery(AUTH_USER);

  const [currentUser, setCurrentUser] = useState();

  useEffect(() => {
    let isAdmin = false;
    if (data?.authenticatedItem) {
      isAdmin = data?.authenticatedItem?.permissions.some(
        (x) => x.canAccessAdminUI
      );
    }
    setCurrentUser({ ...data?.authenticatedItem, isAdmin });
  }, [data]);


  if (dataState === "empty" && !error) return <div></div>;

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser }}>
      {renderedContent}
    </UserContext.Provider>
  );
}

export const UserContext = createContext(null);
