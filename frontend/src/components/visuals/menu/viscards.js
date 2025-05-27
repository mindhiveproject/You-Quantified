import { React, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import p5logo from "../../../assets/p5logo.png";
import { useQuery, useMutation } from "@apollo/client";
import { ShareMenu } from "./share";
import { useOutsideAlerter } from "../../../utility/outsideClickDetection";
import {
  LIKE_VISUAL,
  UNLIKE_VISUAL,
  MY_VISUALS,
} from "../../../queries/visuals";

export function ImageCard({
  parameters,
  cover,
  description,
  title,
  visID,
  createdAt,
  likes,
  userInfo,
  showAuthor,
  showDescription,
  showImage,
  showParameters,
}) {
  // Represents a single card with the visualizations in the main menu

  const paramList = parameters.map((property) => (
    <div
      className="col-auto vis-property me-1 mb-1 p-1 ps-2 pe-2"
      key={property.name}
    >
      {property.name}
    </div>
  ));

  if (paramList.length > 6) {
    paramList.length = 6;
    paramList.push(
      <div className="col-auto vis-property me-1 mb-1 p-1 ps-2 pe-2" key="more">
        ...
      </div>
    );
  }

  const parsedCreatedAt = formatDateToLong(createdAt);

  return (
    <div className="card grid-item rounded-0">
      <Link
        to={`/visuals/${visID}`}
        // onClick={() => dispatch({ type: "params/load", payload: visSource })}
        className="rounded-0 text-decoration-none text-dark w-100"
        key={visID}
      >
        {cover?.url && showImage && (
          <img
            className="card-img-top rounded-0 p-2"
            src={cover.url}
            alt={title}
          />
        )}
        <div className="card-body" key={visID}>
          <h5 className="card-title m-0">{title}</h5>
          {showDescription && <p className="card-text mt-1">{description}</p>}
          {showParameters && (
            <div className="mb-2">
              <h6>Parameters</h6>
              <div className="container row justify-content-start">
                {paramList}
              </div>
            </div>
          )}
          <div className="d-flex justify-content-between m-0">
            {showAuthor && (
              <p className="card-text text-body-tertiary m-0">
                by: {userInfo.name}
              </p>
            )}
            <p className="text-end text-body-tertiary m-0">{parsedCreatedAt}</p>
          </div>
          {/*<div className="d-flex justify-content-between">
            <div className="p5-card mt-3">
              <img src={p5logo} className="m-0 p-0" />
              <small className="m-2">P5.js</small>
            </div>
          </div>*/}
        </div>
      </Link>
      <BottomBar visID={visID} userID={userInfo.id} likes={likes} />
    </div>
  );
}

function formatDateToLong(dateString) {
  const date = new Date(dateString);
  const options = { month: "short", day: "2-digit", year: "numeric" };
  return date.toLocaleDateString("en-US", options).replace(",", "");
}

function BottomBar({ visID, userID, likes }) {
  const [showShare, setShowShare] = useState(false);
  const sharePopupRef = useRef(null);

  useOutsideAlerter(sharePopupRef, setShowShare);

  const [currentLikeCount, setCurrentLikeCount] = useState(likes.length);
  const [isLiked, setIsLiked] = useState(likes.some(({ id }) => id === userID));

  useEffect(() => {
    setIsLiked(likes.some(({ id }) => id === userID));
  }, [userID]);

  const mutationArguments = {
    variables: {
      id: visID,
      userID: userID,
    },
    // refetchQueries: [MY_VISUALS, 'VisualsQuery'],
    update(cache, { data, error }) {
      if (data?.updateVisual) {
        setIsLiked(!isLiked);
        setCurrentLikeCount(data?.updateVisual?.likesCount);
      }
    },
  };

  const [likeVisual] = useMutation(LIKE_VISUAL, mutationArguments);
  const [unlikeVisual] = useMutation(UNLIKE_VISUAL, mutationArguments);

  function handleVisualLike() {
    isLiked ? unlikeVisual() : likeVisual();
  }

  return (
    <div className="d-flex border-top rounded-0 m-0 w-100 h-40 fs-sm align-items-center">
      {showShare && (
        <div className="edit-background mt-0">
          <div className="edit-popup" ref={sharePopupRef}>
            <ShareMenu setShowShare={setShowShare} />
          </div>
        </div>
      )}
      <button
        className="btn btn-link text-decoration-none d-flex align-items-center h-100 px-0 ms-3"
        onClick={handleVisualLike}
        disabled={!userID}
      >
        <i
          className={
            isLiked ? "bi bi-heart-fill me-2 liked" : "bi bi-heart me-2"
          }
        ></i>
        <span>{currentLikeCount}</span>
      </button>
      {/*<button
        className="btn btn-link text-decoration-none d-flex align-items-center h-100"
        onClick={() => setShowShare(true)}
      >
        <i class="bi bi-share me-2"></i>
        Share
      </button>*/}
    </div>
  );
}

export function VisualizationCards({
  currentFilter,
  currentTags,
  currentSearch,
  currentUser,
  currentSort,
  friendData,
  showAuthor = true,
  showDescription = true,
  showParameters = false,
  showImage = true,
}) {
  let whereValue = {};

  if (currentFilter === "featured") {
    whereValue["privacy"] = { equals: "public" };
  }

  if (currentFilter === "my") {
    whereValue["author"] = { id: { equals: currentUser?.id } };
  }

  if (currentFilter === "favorites") {
    whereValue["likes"] = { some: { id: { equals: currentUser?.id } } };
    whereValue["OR"] = [
      {
        privacy: { equals: "friends" },
      },
      {
        privacy: { equals: "public" },
      },
    ];
  }

  const tagLabels = (currentTags || [])
    .filter(({ selected }) => selected)
    .map(({ label }) => label);

  if (tagLabels) {
    if (tagLabels.length !== 0) {
      whereValue["tags"] = {
        some: {
          label: {
            in: tagLabels,
          },
        },
      };
    }
  }

  if (friendData) {
    whereValue["author"] = { id: { equals: friendData?.id } };
  }

  if (currentFilter === "friends") {
    whereValue["author"] = {
      OR: [
        {
          following: {
            some: {
              recipient: { id: { equals: currentUser?.id } },
              status: { equals: "accepted" },
            },
          },
        },
        {
          followers: {
            some: {
              requester: { id: { equals: currentUser?.id } },
              status: { equals: "accepted" },
            },
          },
        },
      ],
    };
    whereValue["OR"] = [
      {
        privacy: { equals: "friends" },
      },
      {
        privacy: { equals: "public" },
      },
    ];
  }

  if (currentSearch) {
    whereValue["title"] =
      process.env.NODE_ENV === "development"
        ? {
            contains: currentSearch,
          }
        : {
            contains: currentSearch,
            mode: "insensitive",
          };
  }

  const { loading, error, data } = useQuery(MY_VISUALS, {
    variables: {
      where: whereValue,
    },
    fetchPolicy: "network-only",
  });

  // if (loading) return <div className="custom-grid h-100 mb-5"><LoadingPlaceholder /></div>;
  if (loading)
    return (
      <div className="custom-grid h-100 mb-5 spinner-grow">
        {" "}
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  if (error) return <p>Error: {error.message}</p>;

  const sortedArray = sortVisuals(
    data.visuals,
    currentSort.type,
    currentSort.isDescending
  );

  // Sort according to the sort prop that was passed
  let customSources = sortedArray.map((visual) => (
    <ImageCard
      parameters={visual.parameters}
      cover={visual.cover}
      description={visual.description}
      userInfo={visual.author}
      title={visual.title}
      visID={visual.id}
      key={visual.id}
      likes={visual.likes}
      createdAt={visual.createdAt}
      showAuthor={showAuthor}
      showDescription={showDescription}
      showParameters={showParameters}
      showImage={showImage}
    />
  ));

  if (currentFilter === "my" && customSources.length === 0) {
    return (
      <p className="mt-2">
        You have not created any visuals! Feel copy a featured visual or create
        your own from scratch.
      </p>
    );
  }

  return (
    <div>
      <div className="custom-grid h-100 mb-5">{customSources}</div>
    </div>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="card grid-item rounded-0 w-100 h-100">
      {/* (
        <img
          className="card-img-top rounded-0 p-2"
          src={cover.url}
          alt={title}
        />
      )*/}
      <div className="card-body w-100 h-100">
        <h5 className="card-title placeholder-glow">
          <span className="placeholder col-12"></span>
        </h5>
        <p className="card-text placeholder-glow"></p>
        <h6>Parameters</h6>
        <div className="placeholder-glow">
          <span className="placeholder col-3 me-1 bg-primary"></span>
          <span className="placeholder col-4 me-1 bg-primary"></span>
          <span className="placeholder col-4 bg-primary"></span>
        </div>
        <div className="d-flex justify-content-between">
          <div className="p5-card mt-3">
            <img src={p5logo} className="m-0 p-0" />
            <small className="m-2">P5.js</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function sortVisuals(inputArray, sortMethod, isDescending = true) {
  // Determine the multiplier for ascending or descending order.
  const multiplier = isDescending ? -1 : 1;

  // Helper function: compares the number of likes.
  function compareLikes(a, b) {
    return (a.likes.length - b.likes.length) * multiplier;
  }

  // Helper function: compares titles alphabetically.
  function compareAlphabetical(a, b) {
    const nameA = a.title?.toUpperCase() || "";
    const nameB = b.title?.toUpperCase() || "";
    return nameA.localeCompare(nameB) * multiplier;
  }

  // Helper function: compares the createdAt dates.
  function compareDate(a, b) {
    return (new Date(a.createdAt) - new Date(b.createdAt)) * multiplier;
  }

  // Use the helper functions in the switch cases.
  switch (sortMethod) {
    case "likes":
      // Primary sort: likes; if equal, fallback to alphabetical, then date.
      return inputArray.toSorted(
        (a, b) =>
          compareLikes(a, b) || compareAlphabetical(a, b) || compareDate(a, b)
      );

    case "alphabetical":
      // Primary sort: title; if equal, fallback to date.
      return inputArray.toSorted(
        (a, b) => compareAlphabetical(a, b) || compareDate(a, b)
      );

    case "createdAt":
      // Sort by creation date.
      return inputArray.toSorted((a, b) => compareDate(a, b));

    default:
      // Return unsorted array if no sort method is specified.
      return inputArray;
  }
}
