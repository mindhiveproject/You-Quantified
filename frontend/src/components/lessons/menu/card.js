import React, { useState } from "react";
import p5logo from "../../../assets/p5logo.png";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { NEW_USER_LESSON } from "../../../queries/lessons";
import { useContext } from "react";
import { UserContext } from "../../../App";

function LessonCard({ lessonData }) {
  const userLessons = lessonData?.userLessons || [];
  const hasViewed = userLessons.length > 0;
  // const hasCompleted = hasViewed && userLessons[0]?.isComplete;
  const { currentUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [createNewUserLesson, { data }] = useMutation(NEW_USER_LESSON);
  const [isLoading, setIsLoading] = useState(false);


  async function goToLessonCallback() {
    setIsLoading(true);
    /*
    if (currentUser?.isAdmin) {
      //navigate(`/lessons/${lessonData?.id}`);
      return
    }
    */

    if (hasViewed) {
      navigate(`/lessons/${userLessons[0]?.id}?user=true`);
      return;
    }

    // Start mutation to copy the lesson
    const response = await fetch(lessonData?.code?.url);
    const codeBlob = await response.blob();
    createNewUserLesson({
      variables: {
        data: {
          title: lessonData?.title,
          content: lessonData?.content,
          author: {
            connect: {
              id: currentUser?.id,
            },
          },
          code: {
            upload: codeBlob,
          },
          parameters: lessonData.parameters,
          lesson: {
            connect: {
              id: lessonData?.id,
            },
          },
        },
      },
    });
  }

  // If the lesson has been copied by the mutation, navigate there
  if (data) {
    navigate(`/lessons/${data?.createUserLesson?.id}`);
  }

  return (
    <button className="card" onClick={goToLessonCallback}>
      <div className="card-body text-start">
        <h6 className="card-title">
          <i className="bi bi-book me-2"></i>
          {lessonData?.title}
        </h6>
        {/*<p className="card-subtitle mb-2 text-body-tertiary d-flex col">
          <img src={p5logo} className="m-0 p-0 icon-image me-2 align-self-center" />
          {lessonData?.visual?.title}
  </p>*/}
        <p className="card-text">
          Some quick example text to build on the card title and make up the
          bulk of the card's content.
        </p>
      </div>
    </button>
  );
}

export function UnitCard({ unitData }) {
  const lessonCards = unitData?.lessons.map((lesson) => (
    <LessonCard lessonData={lesson} />
  ));

  return (
    <div className="lesson-card">
      <div className="accordion">
        <div className="accordion-item">
          <h2 className="accordion-header" id="headingOne">
            <button
              className="accordion-button"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#collapseOne"
              aria-expanded="true"
              aria-controls="collapseOne"
            >
              <div className="d-flex col justify-content-between">
                <div>
                  <h6>{unitData?.title}</h6>
                  <p className="p-0 m-0">{unitData?.description}</p>
                </div>
                {/*<small className="align-self-center me-3">5 hours</small>*/}
              </div>
            </button>
          </h2>
          <div
            id="collapseOne"
            className="accordion-collapse collapse show"
            aria-labelledby="headingOne"
            data-bs-parent="#accordionExample"
          >
            <div className="accordion-body">{lessonCards}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
