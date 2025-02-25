import { useContext, useState, useRef, useEffect } from "react";
import { UserContext } from "../../../App";
import { useMutation } from "@apollo/client";
import { END_SESSION } from "../../../queries/user";
import { Link } from "react-router-dom";
export function MyUserName() {
  const { currentUser, setCurrentUser } = useContext(UserContext);

  const [endSession, { data, loading }] = useMutation(END_SESSION, {
    update() {
      setCurrentUser(undefined);
    },
  });

  if (loading) return <div>Logging out...</div>;

  return (
    <Link className="username btn btn-outline-primary text-start" to={`/user/${currentUser.id}`} disabled>
      <div>
        <p className="">Profile</p>
        <p className="fw-medium">{currentUser?.name}</p>
      </div>
    </Link>
  );
}
