import { useLazyQuery, useMutation } from "@apollo/client";
import { useContext, useState } from "react";
import { MY_VISUALS, NEW_VISUAL } from "../../../queries/visuals";
import { NEW_LESSON } from "../../../queries/lessons";
import { UserContext } from "../../../App";
import { useNavigate } from "react-router-dom";

export function NewLesson({ setShowNew }) {
  const [visLink, setVisLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { currentUser } = useContext(UserContext);
  const isFormValid = !errorMessage && visLink;
  const [checkValidVis, { data: visData }] = useLazyQuery(MY_VISUALS, {
    onCompleted: (data) => {
      setErrorMessage(
        data && data?.visuals.length == 0 ? "Visual not found" : ""
      );
    },
  });

  const [createNewLesson, { data, error }] = useMutation(NEW_LESSON);

  function validateLink(input) {
    const visID = extractVisID(input);
    checkValidVis({ variables: { where: { id: { equals: visID } } } });
    setVisLink(input);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!isFormValid) {
      return;
    }

    const visMetadata = visData.visuals[0];

    const response = await fetch(visMetadata?.code?.url);
    const codeBlob = await response.blob();
    const titleText = "Untitled - " + visMetadata?.title;

    const lessonContent = {
      type: "doc",
      content: [
        [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: titleText }],
          },
        ],
      ],
    };

    createNewLesson({
      variables: {
        data: {
          title: titleText,
          content: lessonContent,
          code: {
            upload: codeBlob,
          },
          author: {
            connect: {
              id: currentUser?.id,
            },
          },
          parameters: visMetadata?.parameters,
        },
      },
    });
  }

  if (data?.id) {
    const navigate = useNavigate();
    navigate(`/lessons/${data?.id}`);
  }

  return (
    <div>
      <form onSubmit={handleFormSubmit}>
        <div className="mb-3">
          <label htmlFor="lessonVisual">Visual</label>

          <input
            type="text"
            className="form-control"
            placeholder="Paste link or id"
            aria-label="paste-vis-link"
            onChange={(e) => validateLink(e.target.value)}
            value={visLink}
          ></input>
          <button
            type="submit"
            className={`btn btn-primary btn-outline-dark mt-2 ${
              !isFormValid && "disabled"
            }`}
          >
            Create
          </button>

          {errorMessage && <p className="text-warning">{errorMessage}</p>}
        </div>
      </form>
    </div>
  );
}

function extractVisID(input) {
  // Check if the input is a full URL
  const urlPattern = /\/([^\/]+)$/;
  const urlMatch = input.match(urlPattern);

  if (urlMatch) {
    // If it's a full URL, return the captured group
    return urlMatch[1];
  } else {
    // If it's just the visID, return it directly
    return input;
  }
}

function createTextFileFromString(text, filename) {
  // Create a Blob object from the string

  const blob = new Blob([text], { type: "text/plain" });

  //const file = new File([blob], filename, { type: "text/plain" });
  // const downloadLink = URL.createObjectURL(file);

  // Create a new File object from the Blob
  return blob;
}
