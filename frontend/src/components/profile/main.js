import { useContext, useMemo } from "react";
import { UserContext } from "../../App";
import { useParams } from "react-router-dom";

import { GET_FRIENDS, GET_USER_DATA } from "../../queries/friends";
import { useQuery } from "@apollo/client";
import { Link } from "react-router-dom";
import { MyUserPage } from "./Me/main";
import { FriendPage } from "./Friends/main";

export function User() {
  const { currentUser } = useContext(UserContext);
  const { userID } = useParams();

  if (!userID) {
    return (
      <div className="d-flex h-100 w-100 align-items-center justify-content-center">
        404! User Not Found
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="d-flex h-100 center-margin align-items-center justify-content-center ps-2 pe-2">
        <div>
          <div>
            You must be authenticated and have the user as your friend to view
            their profile.
          </div>
          <div className="d-flex w-100 h-100 justify-content-center mt-3">
            <Link
              to={`/login?user=${userID}`}
              className="btn btn-primary btn-outline-dark text-light me-3"
            >
              Log In
            </Link>
            <Link
              to={`/signup?user=${userID}`}
              className="btn btn-outline-dark"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <QueryUserAuthenticatedPage currentUserID={currentUser?.id} />;
}

function QueryUserAuthenticatedPage({ currentUserID }) {
  const { data, loading, error } = useQuery(GET_FRIENDS, {
    variables: { userID: currentUserID },
    pollInterval: 500,
  });

  console.log(error);

  if (loading) return <div>Loading profile</div>;
  if (error) return <div>Error!</div>;

  return <UserAuthenticatedPage rawMyFriends={data.friendships} />;
}

function UserAuthenticatedPage({ rawMyFriends }) {
  const { currentUser } = useContext(UserContext);
  const { userID } = useParams();

  const isCurrentUser = currentUser?.id === userID;
  const myFriends = useMemo(
    () => transformFriendships(rawMyFriends, currentUser.id),
    [rawMyFriends, currentUser]
  );

  const { data, loading, error } = useQuery(GET_USER_DATA, {
    variables: { userID },
  });

  const currentFriendship =
    myFriends.find((friend) => friend.id === userID) || {};

  if (loading) return <div>Loading profile</div>;

  if (error || data?.users.length === 0) {
    return (
      <div className="d-flex h-100 align-items-center justify-content-center">
        <span className=" me-1">Error 404!</span> User Not Found
      </div>
    );
  }

  if (isCurrentUser) {
    return <MyUserPage userData={currentUser} myFriends={myFriends} />;
  } else {
    return (
      <FriendPage
        friendData={data.users[0]}
        currentUser={currentUser}
        currentFriendship={currentFriendship}
      />
    );
  }
}

function transformFriendships(rawMyFriends, currentUserID) {
  return (
    rawMyFriends?.map(({ recipient, requester, status, id }) => {
      const isUserRecipient = recipient.id === currentUserID;
      const friend = isUserRecipient ? requester : recipient;
      const myRole = isUserRecipient ? "recipient" : "requester";
      return { ...friend, myRole, status, friendshipID: id };
    }) ?? []
  );
}
