import { VisualizationCards } from "../../visuals/menu/viscards";
import { FriendRequestCard } from "../friend_request_card";
import { useState } from "react";
import { VisualSortMenu } from "../../visuals/menu/menu";

export function FriendPage({ friendData, currentUser, currentFriendship }) {
  if (currentFriendship.status === "accepted") {
    return <FriendUserPage userData={friendData} currentUser={currentUser} />;
  } else {
    return (
      <UserIsNotAFriend
        friendData={friendData}
        currentUser={currentUser}
        currentFriendship={currentFriendship}
      />
    );
  }
}

function FriendUserPage({ userData, currentUser }) {
  const [currentSearch, setCurrentSearch] = useState("");
  const [currentSort, setCurrentSort] = useState({
    type: "alphabetical",
    isDescending: true,
  });

  return (
    <div className="h-100 center-margin overflow-scroll disable-scrollbar">
      <div className="align-items-start mb-4 sticky-top bg-white pb-2 z-1 pt-2">
        <h2 className="mt-5 ">{userData.name}</h2>
        <span>Check out this user's visuals and manage your friendship.</span>
      </div>
      <div className="mb-3">
        <h4 className="m-0">Visuals</h4>
        <p className="m-0 mb-2">Created and published by {userData.name}.</p>
      </div>
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
      <VisualizationCards
        currentFilter={"all"}
        currentSort={currentSort}
        friendData={userData}
        currentUser={currentUser}
        currentSearch={currentSearch}
        showAuthor={false}
        showDescription={true}
        showParameters={false}
        showImage={false}
      />
    </div>
  );
}

function UserIsNotAFriend({ friendData, currentUser, currentFriendship }) {
  return (
    <div className="d-flex h-100 align-items-center justify-content-center ps-2 pe-2">
      <div>
        <p>This user must be your friend to view their profile.</p>
        <FriendRequestCard
          currentUserID={currentUser?.id}
          friendInfo={friendData}
          currentFriendship={currentFriendship}
        />
      </div>
    </div>
  );
}
