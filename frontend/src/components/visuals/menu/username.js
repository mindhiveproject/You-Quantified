import { useContext, useState, useRef, useEffect } from "react";
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

  const [showUserID, setShowUserID] = useState(false);

  const konamiCode = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  const [konamiIndex, setKonamiIndex] = useState(0);

  const konamiIndexRef = useRef(konamiIndex);
  konamiIndexRef.current = konamiIndex;

  function konamiCodeFunc(event, konamiIndexRef) {
    // Check if the key pressed matches the current konami sequence key
    console.log(konamiIndexRef.current);
    if (event.key === konamiCode[konamiIndexRef.current]) {
      setKonamiIndex((prevIndex) => prevIndex + 1);
      // If the entire Konami code is successfully entered
      if (konamiIndexRef.current + 1 === konamiCode.length) {
        setShowUserID(true);
        setKonamiIndex(0); // Reset the index
      }
    } else {
      // Reset the index if the key doesn't match
      setKonamiIndex(0);
    }
  }

  function copyUserName() {
    navigator.clipboard.writeText(currentUser?.id);
    alert("Copied user ID to clipboard");
  }
  useEffect(() => {
    document.addEventListener("keydown", (event) =>
      konamiCodeFunc(event, konamiIndexRef)
    );

    return () => {
      document.removeEventListener("keydown", (event) =>
        konamiCodeFunc(event, konamiIndexRef)
      );
    };
  }, []);

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
        {showUserID && (
          <li>
            <a className="dropdown-item" onClick={copyUserName}>
              {currentUser?.id}<i className="ms-3 bi bi-clipboard"></i>
            </a>
          </li>
        )}
      </ul>
    </div>
  );
}
