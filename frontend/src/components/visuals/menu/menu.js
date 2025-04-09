import React, { useEffect, useState } from "react";
import { VisualizationCards } from "./viscards";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../../App";
import { MyUserName } from "./username";

export function MainMenu() {
  const { currentUser } = useContext(UserContext);
  const [currentSearch, setCurrentSearch] = useState("");

  const getStoredValue = (key, defaultValue) => {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  };

  const [currentFilter, setCurrentFilter] = useState(() =>
    getStoredValue("currentFilter", "featured")
  );
  const [currentSort, setCurrentSort] = useState(() =>
    getStoredValue("currentSort", { type: "alphabetical", isDescending: true })
  );

  useEffect(() => {
    sessionStorage.setItem("currentFilter", JSON.stringify(currentFilter));
  }, [currentFilter]);

  useEffect(() => {
    sessionStorage.setItem("currentSort", JSON.stringify(currentSort));
  }, [currentSort]);

  // Add a sort useState here
  return (
    <div className="h-100 center-margin overflow-scroll disable-scrollbar">
      <div className="align-items-start">
        {currentUser && <MyUserName currentUser={currentUser} />}
        <h2 className="mt-5 mb-2 ">Visuals</h2>
        <p>
          Explore and modify our curated{" "}
          <a
            href="https://p5js.org"
            target="blank"
            className="link text-decoration-none"
          >
            p5.js visuals
          </a>{" "}
          or build your own data exploration.
        </p>
      </div>
      {currentUser ? (
        <div className="d-flex mb-2">
          <Link
            to="/visuals-new"
            className="btn btn-secondary btn-outline-dark fw-medium me-3"
          >
            <i className="bi bi-plus m-0 p-0 me-1"></i>New Visual
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
      <div className="pt-4 sticky-top bg-white z-1 pb-2">
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Search"
          aria-label="search"
          autoComplete="off"
          onChange={(e) => setCurrentSearch(e.target.value)}
        ></input>
        <div className="d-flex justify-content-between">
          <div>
            <button
              onClick={() => setCurrentFilter("featured")}
              className={`filter-button pe-3 ${
                currentFilter === "featured" ? "active" : ""
              }`}
            >
              Featured
            </button>
            {currentUser?.id && (
              <button
                onClick={() => setCurrentFilter("my")}
                className={`filter-button pe-3 ${
                  currentFilter === "my" ? "active" : ""
                }`}
              >
                Yours
              </button>
            )}
            {currentUser?.id && (
              <button
                onClick={() => setCurrentFilter("favorites")}
                className={`filter-button pe-3 ${
                  currentFilter === "favorites" ? "active" : ""
                }`}
              >
                Liked
              </button>
            )}

            {currentUser?.id && (
              <button
                onClick={() => setCurrentFilter("friends")}
                className={`filter-button pe-3 ${
                  currentFilter === "friends" ? "active" : ""
                }`}
              >
                Friends
              </button>
            )}
          </div>
          <VisualSortMenu
            currentSort={currentSort}
            setCurrentSort={setCurrentSort}
          />
        </div>
      </div>
      <div>
        <VisualizationCards
          currentFilter={currentFilter}
          currentSearch={currentSearch}
          currentUser={currentUser}
          currentSort={currentSort}
          showAuthor={currentFilter !== "my"}
        />
      </div>
    </div>
  );
}

export function VisualSortMenu({ currentSort, setCurrentSort }) {
  return (
    <div className="d-flex align-items-center p-0">
      <div className="dropdown p-0">
        <button
          className="filter-button d-flex align-items-center"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
        >
          <span className="material-symbols-outlined me-1">sort</span>Sort
        </button>
        <ul className="dropdown-menu">
          <li>
            <button
              className={`dropdown-item ${
                currentSort.type === "alphabetical"
                  ? "fw-semibold disabled"
                  : ""
              }`}
              onClick={() =>
                setCurrentSort({ ...currentSort, type: "alphabetical" })
              }
            >
              Alphabetical
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                currentSort.type === "createdAt" ? "fw-semibold disabled" : ""
              }`}
              onClick={() =>
                setCurrentSort({ ...currentSort, type: "createdAt" })
              }
            >
              Date created
            </button>
          </li>
          <li>
            <button
              className={`dropdown-item ${
                currentSort.type === "likes" ? "fw-semibold disabled" : ""
              }`}
              onClick={() => setCurrentSort({ ...currentSort, type: "likes" })}
            >
              Likes
            </button>
          </li>
        </ul>
      </div>
      <button
        className="filter-button text-decoration-none d-flex p-0"
        onClick={() =>
          setCurrentSort({
            ...currentSort,
            isDescending: !currentSort.isDescending,
          })
        }
      >
        {currentSort.isDescending ? (
          <span className="material-symbols-outlined">arrow_upward_alt</span>
        ) : (
          <span className="material-symbols-outlined">arrow_downward_alt</span>
        )}
      </button>
    </div>
  );
}
