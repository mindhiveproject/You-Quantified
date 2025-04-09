import { MyUsernameButtonGroup } from "./input_group";
import { AddNewFriendModal, FriendRequestsModal } from "./friend_modals";
import { UserContext } from "../../../App";
import { useOutsideAlerter } from "../../../utility/outsideClickDetection";

import { useState, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";

import { DELETE_REQUEST, GET_FRIENDS } from "../../../queries/friends";
import { END_SESSION } from "../../../queries/user";

export function MyUserPage({ userData, myFriends }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const requestsModalRef = useRef(null);
  const addModalRef = useRef(null);

  const receivedRequests = myFriends.filter(
    ({ status, myRole }) => status === "pending" && myRole === "recipient"
  );

  useOutsideAlerter(addModalRef, setShowAddModal);
  useOutsideAlerter(requestsModalRef, setShowRequestsModal);

  const { setCurrentUser } = useContext(UserContext);

  const [endSession, { data, loading }] = useMutation(END_SESSION, {
    update() {
      setCurrentUser(undefined);
    },
  });

  if (loading) return <div>Logging out...</div>;

  if (data) {
    return (
      <div className="d-flex h-100 center-margin align-items-center justify-content-center">
        <div>
          <span>Sucessfully logged out! </span>
          <Link to="/visuals">Return to visuals?</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-100 center-margin overflow-scroll disable-scrollbar">
      <div className="align-items-start mb-3">
        <h2 className="mt-5 mb-2 ">You</h2>
        <span>
          Manage your visuals, add new friends, and view your profile.
        </span>
        <div className="d-flex m-0 align-items-top p-0 mt-2">
          <MyUsernameButtonGroup userData={userData} />
          <button
            className="btn btn-outline-dark d-flex h-40 ms-2 d-flex align-items-center ps-3 pe-3"
            onClick={endSession}
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="mb-3">
        <h4 className="m-0">Friends</h4>
        <p className="m-0 mb-2">Check out a profile or add new friends.</p>
        <div className="d-flex">
          <button
            className="btn btn-outline-dark d-flex align-items-center outline-grey me-2"
            onClick={() => setShowAddModal(true)}
          >
            <span className="material-symbols-outlined me-2">group_add</span>
            <span>Add a new friend</span>
          </button>
          {receivedRequests.length > 0 && (
            <button
              className="btn btn-outline-dark bg-light"
              onClick={() => setShowRequestsModal(true)}
            >
              {receivedRequests.length}
              {receivedRequests.length === 1 ? " request" : " requests"}
            </button>
          )}
        </div>
        {showAddModal && (
          <div className="blur-background-navbar">
            <div className="edit-popup" ref={addModalRef}>
              <AddNewFriendModal
                userData={userData}
                myFriends={myFriends}
                setShowAddModal={setShowAddModal}
              />
            </div>
          </div>
        )}
        {showRequestsModal && (
          <div className="blur-background-navbar">
            <div className="edit-popup" ref={requestsModalRef}>
              <FriendRequestsModal
                userData={userData}
                receivedRequests={receivedRequests}
                setShowRequestsModal={setShowRequestsModal}
              />
            </div>
          </div>
        )}
      </div>
      <RenderAllFriends myFriends={myFriends} userData={userData} />
    </div>
  );
}

function RenderAllFriends({ myFriends, userData }) {
  const sentRequests = myFriends.filter(
    ({ status, myRole }) => status === "pending" && myRole === "requester"
  );
  const activeFriends = myFriends.filter(
    ({ status, myRole }) => status === "accepted"
  );

  const renderActiveFriends = activeFriends.map((friend) => (
    <ActiveFriendCard friendInfo={friend} />
  ));

  return (
    <div>
      <div className="custom-grid h-100 mb-5">{renderActiveFriends}</div>
    </div>
  );
}

function ActiveFriendCard({ friendInfo }) {
  const [deleteFriendship, { data: deleteData, loading: deleteLoading }] =
    useMutation(DELETE_REQUEST, {
      variables: {
        friendshipID: friendInfo?.friendshipID,
      },
      refetchQueries: [GET_FRIENDS, "GetFriends"],
    });

  return (
    <div className="card rounded-0 d-flex grid-item" disabled={!!deleteLoading}>
      <div className="card-body w-100 h-100">
        <div className="d-flex justify-content-between align-items-start">
          <Link
            className="btn btn-link p-0 text-decoration-none text-start w-100"
            to={`/user/${friendInfo.id}`}
          >
            <h5 className="card-title m-0">{friendInfo.name}</h5>
            <small className="text-primary">
              <span>
                {friendInfo.visualsCount}{" "}
                {friendInfo.visualsCount === 1 ? "visual" : "visuals"}
              </span>
              {friendInfo?.isAdmin && <span> | Admin</span>}
            </small>
          </Link>
          <button
            className="btn btn-outline-dark h-40 p-0 ps-2 d-flex align-items-center"
            onClick={deleteFriendship}
            disabled={deleteLoading}
          >
            <span className="material-symbols-outlined me-2">group_remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
