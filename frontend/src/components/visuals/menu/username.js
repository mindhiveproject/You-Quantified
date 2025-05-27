import { useContext, useState, useRef, useEffect } from "react";
import { UserContext } from "../../../App";
import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";

export function MyUserName() {
  const { currentUser, setCurrentUser } = useContext(UserContext);
  const location = useLocation();
  const currentPath = location.pathname;

  if (!currentUser?.id) {
    return (
      <div className="d-flex justify-content-end">
        <Link
          className={clsx(
            "btn ps-3 pe-3",
            currentPath === "/login" ? "btn-outline-dark active" : "btn-outline-primary"
          )}
          to="/login"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <Link
      className={clsx(
        "btn text-start ps-3 pe-3",
        currentPath === `/user/${currentUser?.id}` ? "btn-outline-dark active" : "btn-outline-primary"
      )}
      to={`/user/${currentUser?.id}`}
      disabled
    >
      <div>
        <p className="fw-medium m-0">{currentUser?.name}</p>
      </div>
    </Link>
  );
}
