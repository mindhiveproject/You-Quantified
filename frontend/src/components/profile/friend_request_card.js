import { useMutation } from "@apollo/client";
import {
  DELETE_REQUEST,
  GET_FRIENDS,
  SEND_REQUEST,
  APPROVE_FRIEND,
} from "../../queries/friends";

export function FriendRequestCard({
  currentUserID,
  friendInfo,
  currentFriendship,
  fullWidth,
}) {
  const [
    sendRequest,
    { data: sendData, loading: sendLoading, error: sendError },
  ] = useMutation(SEND_REQUEST, {
    variables: {
      recipient: friendInfo?.id,
      requester: currentUserID,
    },
    refetchQueries: [GET_FRIENDS, "GetFriends"],
  });

  const [deleteRequest, { data: deleteData, loading: deleteLoading }] =
    useMutation(DELETE_REQUEST, {
      variables: {
        friendshipID:
          sendData?.createFriendship?.id || currentFriendship?.friendshipID,
      },
      refetchQueries: [GET_FRIENDS, "GetFriends"],
    });

  const [acceptRequest, { data: acceptData, loading: acceptLoading }] =
    useMutation(APPROVE_FRIEND, {
      variables: {
        friendshipID:
          sendData?.createFriendship?.id || currentFriendship?.friendshipID,
      },
      refetchQueries: [GET_FRIENDS, "GetFriends"],
    });

  const getCurrentSendStatus = () => {
    if (currentFriendship?.status === "pending") {
      if (currentFriendship?.myRole === "requester") {
        return "sent";
      } else {
        return "received";
      }
    }
    if (sendLoading || deleteLoading || acceptLoading) {
      return "loading";
    }
    if (deleteData?.deleteFriendship) {
      return "none";
    }
    if (sendError) {
      return "none";
    }
    if (sendData?.createFriendship) {
      return "sent";
    }
    return "none";
  };

  const currentSendStatus = getCurrentSendStatus();
  const visualsCount = friendInfo?.visualsCount;

  return (
    <div className="d-flex">
      <div className={`card rounded-0 ${fullWidth && "w-100 h-100"}`}>
        <div className="card-body d-flex justify-content-between flex-wrap align-content-between">
          <div className="me-3">
            <h5 className="card-title m-0">{friendInfo?.name}</h5>
            <small>
              <span>
                {visualsCount} {visualsCount === 1 ? "visual" : "visuals"}
              </span>
              {friendInfo?.isAdmin && <span> | Admin</span>}
            </small>
          </div>
          <div>
            {currentSendStatus === "none" && (
              <button
                className="btn btn-outline-primary d-flex align-items-center"
                onClick={sendRequest}
                disabled={currentSendStatus === "loading"}
              >
                <span className="material-symbols-outlined me-2">
                  group_add
                </span>
                <span>Send request</span>
              </button>
            )}
            {currentSendStatus === "sent" && (
              <button
                className="btn btn-outline-dark d-flex align-items-center"
                onClick={deleteRequest}
                disabled={currentSendStatus === "loading"}
              >
                <span>Cancel request</span>
              </button>
            )}
            {currentSendStatus === "received" && (
              <div className="d-flex">
                <button
                  className="btn btn-outline-danger text-decoration-none me-2"
                  onClick={deleteRequest}
                  disabled={currentSendStatus === "loading"}
                >
                  <span>Delete request</span>
                </button>
                <button
                  className="btn btn-secondary btn-outline-dark d-flex align-items-center"
                  onClick={acceptRequest}
                  disabled={currentSendStatus === "loading"}
                >
                  <span>Accept request</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

