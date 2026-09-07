import { useState, useRef, useContext } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  ADD_COLLABORATOR,
  GET_USERS_IN_CLASS,
  REMOVE_COLLABORATOR,
} from "../../../queries/visuals";
import { UserContext } from "../../../App";

export function ShareMenu({ visURL, setShowShare, visMetadata, isOwner }) {
  const [textCopied, setTextCopied] = useState(false);

  let textCopiedTimeout;
  function addURLParam() {
    const url = new URL(visURL);
    url.searchParams.set("dashboard", "false");
    return url.toString();
  }

  const nonDashboardURL = addURLParam();

  function copyURL(viewingLink) {
    if (textCopied && textCopiedTimeout) clearTimeout(textCopiedTimeout);
    setTextCopied(true);
    textCopiedTimeout = setTimeout(() => setTextCopied(false), 2000);
    const stringURL = viewingLink ? visURL : nonDashboardURL;
    navigator.clipboard.writeText(stringURL);
  }

  return (
    <div>
      <div className="mb-4">
        <div className="d-flex justify-content-between">
          <button
            className="devices-close-btn h4 text-end"
            onClick={() => setShowShare(false)}
          >
            <i className="bi bi-x"></i>
          </button>
          <h5 className="mb-2">Share</h5>
        </div>
        <div className="input-group mb-2">
          <button
            className="btn btn-outline-dark"
            onClick={() => copyURL(true)}
          >
            Copy link
          </button>
          <input disabled value={visURL} className="form-control"></input>
        </div>
        {textCopied && (
          <span className="text-body-tertiary">Link copied to clipboard!</span>
        )}
      </div>
      {isOwner && <CollaboratorsMenu visMetadata={visMetadata} />}
    </div>
  );
}

function CollaboratorsMenu({ visMetadata }) {
  const { currentUser } = useContext(UserContext);
  const userClasses = [
    ...(currentUser?.studentIn?.map(({ id }) => id) ?? []),
    ...(currentUser?.teacherIn?.map(({ id }) => id) ?? []),
    ...(currentUser?.mentorIn?.map(({ id }) => id) ?? []),
  ];

  const [collaborators, setCollaborators] = useState(
    visMetadata?.collaborators ?? [],
  );

  const currentCollaboratorIDs = collaborators.map(({ id }) => id);

  return (
    <div>
      <div>
        <h5 className="mb-1">Edit access</h5>
        <p>
          You can add people from your class or friends list to edit this
          visual.
        </p>
      </div>
      <div className="mb-2">
        {collaborators.length > 0 ? (
          collaborators.map((collaborator) => (
            <CollaboratorCard
              key={collaborator.id}
              collaboratorInfo={collaborator}
              visID={visMetadata?.id}
              currentCollaboratorIDs={currentCollaboratorIDs}
              setCollaborators={setCollaborators}
            />
          ))
        ) : (
          <p className="text-body-tertiary">
            No collaborators yet. Search bellow to invite people.
          </p>
        )}
      </div>
      <CollaboratorSearch
        userClasses={userClasses}
        visID={visMetadata?.id}
        currentUserID={currentUser?.id}
        currentCollaboratorIDs={currentCollaboratorIDs}
        setCollaborators={setCollaborators}
      />
    </div>
  );
}

function CollaboratorSearch({
  userClasses,
  visID,
  currentUserID,
  currentCollaboratorIDs,
  setCollaborators,
}) {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCollabList, setShowCollabList] = useState(false);

  const debounceRef = useRef(null);

  const { loading, error, data } = useQuery(GET_USERS_IN_CLASS, {
    variables: { classIDs: userClasses },
  });

  function onSearchChange(value) {
    setSearchText(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 250);
  }

  const classUsers = data?.profiles ?? [];
  const search = debouncedSearch.trim().toLowerCase();
  const filteredUsers = classUsers.filter((user) => {
    if (user.id === currentUserID) return false;
    if (!search) return true;
    return (
      user.username?.toLowerCase().includes(search) ||
      user.id?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="mb-3 position-relative">
      <label className="mb-1">
        Search for a username or id.
      </label>
      <input
        type="text"
        className="form-control"
        placeholder="Search"
        aria-label="search"
        autoComplete="off"
        value={searchText}
        onFocus={() => setShowCollabList(true)}
        onBlur={() => setShowCollabList(false)}
        onChange={(e) => onSearchChange(e.target.value)}
      ></input>
      {error && <p className="text-body-tertiary">Error loading users.</p>}
      {showCollabList && (
        <ul
          className="dropdown-menu show w-100 mt-1 p-0"
          style={{ maxHeight: "240px", overflowY: "auto" }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading && (
            <li className="dropdown-item-text text-body-tertiary">
              Loading...
            </li>
          )}
          {!loading && filteredUsers.length === 0 && (
            <li className="dropdown-item-text text-body-tertiary">
              No users found.
            </li>
          )}
          {filteredUsers.map((user) => (
            <li key={user.id}>
              <CollaboratorCard
                collaboratorInfo={user}
                visID={visID}
                currentCollaboratorIDs={currentCollaboratorIDs}
                setCollaborators={setCollaborators}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CollaboratorCard({
  collaboratorInfo,
  visID,
  currentCollaboratorIDs,
  setCollaborators,
}) {
  const addedStatus = currentCollaboratorIDs.includes(collaboratorInfo?.id);

  const [addCollaborator, { loading: addLoading }] = useMutation(
    ADD_COLLABORATOR,
    {
      variables: { id: visID, userID: collaboratorInfo?.id },
      onCompleted: (data) =>
        setCollaborators(data?.updateVisual?.collaborators ?? []),
    },
  );

  const [removeCollaborator, { loading: removeLoading }] = useMutation(
    REMOVE_COLLABORATOR,
    {
      variables: { id: visID, userID: collaboratorInfo?.id },
      onCompleted: (data) =>
        setCollaborators(data?.updateVisual?.collaborators ?? []),
    },
  );

  const loading = addLoading || removeLoading;

  function changeCollaborationStatus() {
    if (addedStatus) {
      removeCollaborator();
    } else {
      addCollaborator();
    }
  }

  return (
    <div className="d-flex">
      <div className="card rounded-0 w-100 h-100">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap">
          <h6 className="card-title m-0 me-3">{collaboratorInfo?.username}</h6>
          <button
            className={`btn d-flex align-items-center h-40 ${
              addedStatus ? "btn-outline-danger" : "btn-outline-primary"
            }`}
            onClick={changeCollaborationStatus}
            disabled={loading}
          >
            <span className="material-symbols-outlined me-2">
              {addedStatus ? "person_remove" : "person_add"}
            </span>
            <span>{addedStatus ? "Remove" : "Invite"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
