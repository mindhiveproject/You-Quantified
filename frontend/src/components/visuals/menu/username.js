import { useContext } from "react";
import { UserContext } from "../../../App";
import { useMutation } from "@apollo/client";
import { END_SESSION } from "../../../queries/user";

export function MyUserName() {
  const { currentUser, setCurrentUser } = useContext(UserContext);

  const [endSession, { data, loading }] = useMutation(END_SESSION, {
    update() {
      setCurrentUser(undefined);
    },
  });

  if (loading) return <div>Logging out...</div>;

  return (
    <div className="username">
      <div>
        <p className="text-black-50 bg-white">User</p>
        <p className="fw-medium">{currentUser?.name}</p>
      </div>
      <a
        className="btn btn-link m-0 p-0"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="10"
          height="10"
          fill="#9D9D9D"
          className="bi bi-caret-down-fill"
          viewBox="0 0 16 16"
        >
          <path d="M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
        </svg>
      </a>
      <ul className="dropdown-menu">
        <li>
          <a className="dropdown-item" onClick={endSession}>
            Sign Out
          </a>
        </li>
      </ul>
    </div>
  );
}
