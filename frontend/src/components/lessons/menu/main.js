import React, { useContext, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../../../App";
import { MyUserName } from "../../visuals/menu/username";
import { NewLesson } from "./new";
import { useOutsideAlerter } from "../../../utility/outsideClickDetection";
import { useQuery } from "@apollo/client";
import { GET_UNITS } from "../../../queries/lessons";
import { UnitCard } from "./card";
export function LessonMenu() {
  const { currentUser } = useContext(UserContext);

  return (
    <div className="h-100 center-margin overflow-scroll disable-scrollbar">
      <div className="align-items-start">
        {currentUser && <MyUserName currentUser={currentUser} />}
        <h2 className="mt-5 mb-2 fw-bJajajold">Guides</h2>
      </div>
      <p>
        Explore the guides and lessons that walk users through visualizations,
        explorations and data collection.
      </p>
      {currentUser?.isAdmin && <NewLessonButton currentUser={currentUser} />}
      <LessonMenuQuery />
    </div>
  );
}

export function LessonMenuQuery({ currentUser }) {
  const { data, loading, error } = useQuery(GET_UNITS, {
    variables: { userID: currentUser?.id },
  });
  

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="mt-4 mb-4">
      {data?.units.map((unit) => (
        <UnitCard unitData={unit} />
      ))}
    </div>
  );
}

function NewLessonButton({ currentUser }) {
  const [showNew, setShowNew] = useState();
  const newPopupRef = useRef(null);

  useOutsideAlerter(newPopupRef, setShowNew);

  if (!currentUser?.isAdmin && !showNew) return;

  return (
    <div>
      <button
        className={`btn btn-secondary btn-outline-dark fw-medium ${
          showNew && "active"
        }`}
        onClick={() => setShowNew(!showNew)}
      >
        <i className="bi bi-plus m-0 p-0 me-1"></i>New lesson
      </button>
      {showNew && (
        <div className="new-lesson-background">
          <div className="new-lesson-popup" ref={newPopupRef}>
            <NewLesson setShowNew={setShowNew} />
          </div>
        </div>
      )}
    </div>
  );
}
