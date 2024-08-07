import React, { useEffect, useState } from "react";
import { VisualizationCards } from "./viscards";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../../App";
import { MyUserName } from "./username";

export function MainMenu() {
  const { currentUser } = useContext(UserContext);
  const [currentFilter, setCurrentFilter] = useState("all");
  const [currentSearch, setCurrentSearch] = useState("");

  return (
    <div className="h-100 center-margin overflow-scroll disable-scrollbar">
      <div className="align-items-start">
        {currentUser && <MyUserName currentUser={currentUser} />}
        <h2 className="mt-5 mb-2 fw-bold">Visuals</h2>
        <p>
          These are some of the visuals we have made or selected. <br></br>Feel
          free to modify the code, create your own visual or explore.
        </p>
      </div>
      {currentUser ? (
        <div className="d-flex mb-2">
          <Link
            to="/visuals-new"
            className="btn btn-secondary btn-outline-dark fw-medium me-3"
          >
            <i className="bi bi-plus m-0 p-0 me-1"></i>New visual
          </Link>
        </div>
      ) : (
        <div className="d-flex mb-2">
          <Link
            to="/login"
            className="btn btn-primary btn-outline-dark text-light me-3"
          >
            Log In
          </Link>
          <Link to="/signup" className="btn btn-outline-dark">
            Sign Up
          </Link>
        </div>
      )}
      <div className="mt-4">
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Search"
          aria-label="search"
          autoComplete="off"
          onChange={(e) => setCurrentSearch(e.target.value)}
        ></input>
        <button
          onClick={() => setCurrentFilter("all")}
          className={`filter-button pe-2 ${
            currentFilter === "all" ? "active" : ""
          }`}
        >
          Published visuals
        </button>
        {currentUser?.id && (
          <button
            onClick={() => setCurrentFilter("my")}
            className={`filter-button pe-2 ${
              currentFilter === "my" ? "active" : ""
            }`}
          >
            My visuals
          </button>
        )}
      </div>
      <div>
        <VisualizationCards
          currentFilter={currentFilter}
          currentSearch={currentSearch}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
