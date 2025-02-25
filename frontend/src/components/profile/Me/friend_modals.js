import { useLazyQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { FriendRequestCard } from "../friend_request_card";
import { GET_USER_DATA } from "../../../queries/friends";
export function FriendRequestsModal({
  receivedRequests,
  userData,
  setShowRequestsModal,
}) {
  const renderReceivedRequests = receivedRequests.map((friend) => (
    <FriendRequestCard
      currentFriendship={friend}
      friendInfo={friend}
      currentUserID={userData?.id}
      fullWidth
    />
  ));

  return (
    <div className="d-flex row">
      <div className="d-flex justify-content-between">
        <button
          className="devices-close-btn h4 text-end"
          onClick={() => setShowRequestsModal(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h3 className="mb-3">Friend requests</h3>
      </div>
      {receivedRequests.length > 0 ? (
        renderReceivedRequests
      ) : (
        <p className="text-body-tertiary">
          You don't have any more pending requests at the moment
        </p>
      )}
    </div>
  );
}

export function AddNewFriendModal({ userData, myFriends, setShowAddModal }) {
  const [currentFriendSearch, setCurrentFriendSearch] = useState("");
  const [searchError, setSearchError] = useState();
  const [foundFriendship, setFoundFriendship] = useState();
  const [searchFriend, { data, loading, error: queryError }] =
    useLazyQuery(GET_USER_DATA);
  const searchData = data?.users?.[0];

  useEffect(() => {
    if (searchData) {
      const foundFriend = myFriends.find(
        (friend) => friend.id === searchData.id
      );

      if (foundFriend?.status === "accepted") {
        setSearchError("You're already friends with this user :D");
      }

      setFoundFriendship(foundFriend);
    }
  }, [myFriends]);

  async function onSearchSubmit(e) {
    e.preventDefault();
    setSearchError();

    let search = currentFriendSearch;
    try {
      const url = new URL(search);
      const pathname = url.pathname;
      let parts = pathname.split("/");
      search = parts.pop() || parts.pop();
    } catch (_) {
      console.log("Not URL");
    }

    if (search === userData.id || search === userData.name) {
      setSearchError("You cannot add yourself as a friend!");
      return;
    }

    const foundFriend = myFriends.find(
      (friend) => friend?.id === search || friend?.name === search
    );

    if (foundFriend?.status === "accepted") {
      setSearchError("You are already friends with this user :D");
    }

    setFoundFriendship(foundFriend);

    const { data, error } = await searchFriend({
      variables: { userID: search, name: search },
    });

    if (error) {
      setSearchError("Error fetching data");
    }

    if (data?.users.length === 0) {
      setSearchError("No users found!");
    }
  }

  return (
    <div className="d-flex row">
      <div className="d-flex justify-content-between">
        <button
          className="devices-close-btn h4 text-end"
          onClick={() => setShowAddModal(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h3 className="mb-3">Add a new friend</h3>
      </div>
      <div className="mb-3">
        <label className="text-body-tertiary mb-1">
          Search for a username, id or paste a profile link.
        </label>
        <form className="d-flex" onSubmit={onSearchSubmit}>
          <input
            type="text"
            className="form-control me-2"
            placeholder="Search"
            aria-label="search"
            autoComplete="off"
            value={currentFriendSearch}
            onChange={(e) => setCurrentFriendSearch(e.target.value)}
          ></input>
          <button
            type="submit"
            className="btn btn-outline-primary d-flex align-items-center ps-3 pe-3"
          >
            <span className="material-symbols-outlined">group_add</span>
          </button>
        </form>
        {searchError && <p className="text-body-tertiary">{searchError}</p>}
      </div>
      {loading && (
        <div className="custom-grid h-100 mb-5 spinner-grow">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      {searchData &&
        !searchError &&
        (foundFriendship?.status === "accepted" ? (
          <ActiveFriendCard friendInfo={data?.users?.[0]} />
        ) : (
          <FriendRequestCard
            currentUserID={userData.id}
            friendInfo={data?.users?.[0]}
            currentFriendship={foundFriendship}
            fullWidth
          />
        ))}
    </div>
  );
}
