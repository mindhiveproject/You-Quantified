import { useContext, useLayoutEffect, useState, useRef } from "react";
import { UserContext } from "../../App";
import { useNavigate, useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { DELETE_VISUAL, NEW_VISUAL } from "../../queries/visuals";
import { useMutation } from "@apollo/client";
import { profanity } from "@2toad/profanity";

export function EditModalManager({
  visMetadata,
  setShowEdit,
  changeVisMetadata,
}) {
  const { currentUser } = useContext(UserContext);

  if (!currentUser?.id) {
    return <SignInEditPopup />;
  }

  if (currentUser.id !== visMetadata?.author?.id) {
    return <CopyEditPopup visMetadata={visMetadata} />;
  }

  return (
    <EditScreen
      visMetadata={visMetadata}
      setShowEdit={setShowEdit}
      changeVisMetadata={changeVisMetadata}
    />
  );
}

function SignInEditPopup() {
  const { visID } = useParams();

  return (
    <div>
      <p>To modify the visuals, you need an account.</p>
      <Link
        to={`/login?visual=${visID}`}
        className="btn btn-secondary btn-outline-dark me-2"
      >
        Log In
      </Link>
      <Link to={`/signup?visual=${visID}`} className="btn btn-outline-dark">
        Sign Up
      </Link>
    </div>
  );
}

function CopyEditPopup({ visMetadata }) {
  const { currentUser } = useContext(UserContext);

  const [createNewVisual, { data, loading, error }] = useMutation(NEW_VISUAL);

  async function createVisualCopy() {
    const response = await fetch(visMetadata?.code?.url);
    const codeBlob = await response.blob();

    createNewVisual({
      variables: {
        data: {
          title: visMetadata?.title,
          description: visMetadata?.description,
          parameters: visMetadata?.parameters,
          author: {
            connect: {
              id: currentUser?.id,
            },
          },
          editable: true,
          code: {
            upload: codeBlob,
          },
        },
      },
    });
  }

  const navigate = useNavigate();

  if (data) {
    setTimeout(() => {
      navigate(`/visuals/${data?.createVisual?.id}`);
    }, 30);
  }

  return (
    <div>
      <p> You do not own this visualization.</p>
      <button
        className="btn btn-secondary btn-outline-dark"
        onClick={createVisualCopy}
      >
        Create a copy?
      </button>
      <button className="btn btn-outline-dark ms-2">Sign Out</button>
    </div>
  );
}

function EditScreen({ visMetadata, setShowEdit, changeVisMetadata }) {
  const textbox = useRef(null);
  const [visName, setVisName] = useState(visMetadata?.title);
  const [visCover, setVisCover] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const [visDescription, setVisDescription] = useState(
    visMetadata?.description
  );

  let isFormValid = visName && visDescription && !errorMessage;

  const [deleteVisual, { data: visualDeleted, loading, error }] = useMutation(
    DELETE_VISUAL,
    { variables: { id: visMetadata?.id } }
  );

  function deleteButtonCallback() {
    const checkConfirmation = confirm(
      "Are you sure you want to delete the current visual?"
    );
    if (checkConfirmation) deleteVisual;
  }

  function validateName(input) {
    setVisName(input);
    const regex = /^(?!.*[%$\-\/])[^\n\r]{1,50}$/;
    if (!regex.test(input) | profanity.exists(input)) {
      setErrorMessage("Invalid name");
      return;
    }
    setErrorMessage();
  }

  function validateDescription(input) {
    const regex = /^[^%$-\/]+$/;
    setVisDescription(input);
    if (!regex.test(input) || profanity.exists(input)) {
      setErrorMessage("Invalid description");
      return;
    }
    setErrorMessage();
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!isFormValid) {
      return;
    }
    const data = {
      title: visName,
      description: visDescription,
    };

    if (visCover) {
      data["cover"] = {
        upload: visCover,
      };
    }

    changeVisMetadata({
      variables: {
        data,
      },
    });
    setShowEdit(false);
  }

  useLayoutEffect(() => {
    textbox.current.style.height = "inherit";
    textbox.current.style.resize = "none";
    textbox.current.style.height = `${textbox.current.scrollHeight}px`;
  });

  const navigate = useNavigate();

  if (visualDeleted) {
    navigate("/visuals");
  }

  return (
    <div>
      <div className="d-flex justify-content-between">
        <button
          className="devices-close-btn h4 text-end"
          onClick={() => setShowEdit(false)}
        >
          <i className="bi bi-x"></i>
        </button>
        <h3 className="mb-3">Edit</h3>
      </div>
      <form onSubmit={handleFormSubmit}>
        <div className="mb-3">
          <label htmlFor="visualName" id="basic-addon2">
            Name
          </label>
          <input
            type="text"
            className="form-control"
            placeholder="Visual name"
            aria-label="Visual name"
            id="visualName"
            autoComplete="off"
            onChange={(e) => validateName(e.target.value)}
            value={visName}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="description">Description</label>
          <textarea
            type="text"
            className="form-control"
            id="description"
            placeholder="Description"
            onChange={(e) => validateDescription(e.target.value)}
            value={visDescription}
            ref={textbox}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="inputUpload">Cover</label>
          <input
            type="file"
            className="form-control"
            id="inputUpload"
            accept=".png,.jpg"
            onChange={(e) => handleCoverUpload(e, setVisCover)}
          />
        </div>
        {errorMessage && <p className="text-warning">{errorMessage}</p>}
        <div className="d-flex justify-content-between">
          <button
            className="btn btn-outline-danger"
            onClick={deleteButtonCallback}
          >
            Delete visual
          </button>
          <button
            type="submit"
            className={`btn btn-primary btn-outline-dark text-white ${
              !isFormValid && "disabled"
            }`}
          >
            <i className="bi bi-floppy2-fill"></i> Save changes
          </button>
        </div>
      </form>
    </div>
  );
}

async function handleCoverUpload(e, setVisCover) {
  const form = e.currentTarget;
  const [file] = await form.files;

  if (!file) {
    setVisCover();
    console.log("No cover");
    return;
  }

  setVisCover(file);
}
