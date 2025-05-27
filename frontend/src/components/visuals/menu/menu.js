import React, { useEffect, useState } from "react";
import { VisualizationCards } from "./viscards";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../../../App";
import { MyUserName } from "./username";
import { useQuery } from "@apollo/client";
import { GET_ALL_TAGS } from "../../../queries/visuals";
export function MainMenu() {
  const { currentUser } = useContext(UserContext);

  const { data: tagData, loading, error } = useQuery(GET_ALL_TAGS);

  const [currentSearch, setCurrentSearch] = useState("");
  const [currentTags, setCurrentTags] = useState([]);

  const getStoredValue = (key, defaultValue) => {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  };

  const [currentFilter, setCurrentFilter] = useState(() =>
    getStoredValue("currentFilter", "featured")
  );
  const [currentSort, setCurrentSort] = useState(() =>
    getStoredValue("currentSort", { type: "alphabetical", isDescending: false })
  );

  useEffect(() => {
    sessionStorage.setItem("currentFilter", JSON.stringify(currentFilter));
  }, [currentFilter]);

  useEffect(() => {
    sessionStorage.setItem("currentSort", JSON.stringify(currentSort));
  }, [currentSort]);

  useEffect(() => {
    const newTags = tagData?.tags?.map(({ label }) => {
      return { label, selected: false };
    });
    setCurrentTags(newTags);
  }, [tagData]);

  // Add a sort useState here
  return (
    <div className="h-100 center-margin overflow-scroll disable-scrollbar">
      <div className="align-items-start">
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
          {currentUser?.isAdmin && (
            <Link to="/visuals-new-ai" className="btn btn-dark fw-medium me-3">
              ✨ Generate with AI
            </Link>
          )}
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
      <div className="pt-4 sticky-top bg-white z-1">
        <div className="d-flex align-items-center mb-3">
          <input
            type="text"
            className="form-control me-1"
            placeholder="Search"
            aria-label="search"
            autoComplete="off"
            onChange={(e) => setCurrentSearch(e.target.value)}
          ></input>
          <VisualSortMenu
            currentSort={currentSort}
            setCurrentSort={setCurrentSort}
          />
        </div>
        <div className="d-flex justify-content-between w-100">
          <VisualTagMenu
            currentTags={currentTags}
            setCurrentTags={setCurrentTags}
            setCurrentFilter={setCurrentFilter}
            currentFilter={currentFilter}
            isLoggedIn={currentUser?.id}
          />
        </div>
      </div>
      <div>
        <VisualizationCards
          currentFilter={currentFilter}
          currentSearch={currentSearch}
          currentTags={currentTags}
          currentUser={currentUser}
          currentSort={currentSort}
          showAuthor={currentFilter !== "my"}
        />
      </div>
    </div>
  );
}

function VisualTagMenu({
  currentTags,
  setCurrentTags,
  isLoggedIn,
  setCurrentFilter,
  currentFilter,
}) {

  function selectTag(tagLabel) {
    const newTags = (currentTags || []).map((tag) => {
      if (tag.label === tagLabel) {
        return { ...tag, selected: !tag.selected };
      } else {
        return tag;
      }
    });
    setCurrentTags(newTags);
  }

  const renderTags = (currentTags || []).map((tag) => {
    return (
      <button
        className={`btn btn-outline-dark me-1 d-flex pe-3 ps-3 ${
          tag?.selected ? "btn-primary text-white" : ""
        }`}
        onClick={() => selectTag(tag?.label)}
        key={tag?.label}
      >
        {tag?.label}
        {tag?.selected && (
          <span className="material-symbols-outlined ms-1 me-n1">
            close_small
          </span>
        )}
      </button>
    );
  });

  return (
    <div className="d-flex w-100 overflow-x-scroll pb-3">
      <div className="d-flex me-2">
        <button
          onClick={() => setCurrentFilter("featured")}
          className={`btn btn-outline-dark me-n0-1 ${
            currentFilter === "featured" ? "active" : ""
          }`}
        >
          Featured
        </button>
        {isLoggedIn && (
          <div className="d-flex">
            <button
              onClick={() => setCurrentFilter("my")}
              className={`btn btn-outline-dark me-n0-1 ${
                currentFilter === "my" ? "active" : ""
              }`}
            >
              Yours
            </button>
            <button
              onClick={() => setCurrentFilter("favorites")}
              className={`btn btn-outline-dark me-n0-1 ${
                currentFilter === "favorites" ? "active" : ""
              }`}
            >
              Liked
            </button>
            <button
              onClick={() => setCurrentFilter("friends")}
              className={`btn btn-outline-dark ${
                currentFilter === "friends" ? "active" : ""
              }`}
            >
              Friends
            </button>
          </div>
        )}
      </div>
      <div className="vr me-2"></div>
      <div className="d-flex">{renderTags}</div>
    </div>
  );
}

export function VisualSortMenu({ currentSort, setCurrentSort }) {
  return (
    <div className="d-flex align-items-center p-0">
      <div className="dropdown p-0">
        <button
          className="btn btn-outline-dark d-flex align-items-center me-n0-1"
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
        className="btn btn-outline-dark text-decoration-none d-flex ps-2 pe-2"
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

function FilterByTags() {}
