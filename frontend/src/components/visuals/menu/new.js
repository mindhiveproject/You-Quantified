import { MyUserName } from "./username";
import { useContext, useState } from "react";
import { UserContext } from "../../../App";
import { profanity } from "@2toad/profanity";
import { useMutation } from "@apollo/client";
import { NEW_VISUAL } from "../../../queries/visuals";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const defaultCode = `
windowResized = () => {
  // Allows the canvas to resize when you resize your window
  resizeCanvas(windowWidth, windowHeight);
};

setup = () => {
  // This creates the Canvas so that it takes the size of your window.
  createCanvas(windowWidth, windowHeight);
};

// Code that is constantly being updated
draw = () => {
  background(220);
};
`;

export function NewVisual() {
  const { currentUser } = useContext(UserContext);
  const [allParams, setAllParams] = useState([{ name: "", suggested: "" }]);
  const [initCode, setInitCode] = useState(false);
  const [visName, setVisName] = useState("");
  const [visDescription, setVisDescription] = useState("");
  const [isParamsValid, setIsParamsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState();

  const navigate = useNavigate();

  let isFormValid = visName && visDescription && isParamsValid && !errorMessage;

  const [createNewVisual, { data, loading, error }] = useMutation(NEW_VISUAL);

  if (error) {
    console.log(JSON.stringify(error));
  }

  function validateDescription(input) {
    const regex = /^(?!.*[%$\-\/])[^\n\r]{1,1000}$/;
    if (!regex.test(input) || profanity.exists(input)) {
      setVisDescription("");
      setErrorMessage("Invalid description");
      return;
    }
    setVisDescription(input);
    setErrorMessage();
  }

  function validateName(input) {
    const regex = /^(?!.*[%$\-\/])[^\n\r]{1,50}$/;
    if (!regex.test(input) || profanity.exists(input)) {
      setVisName("");
      setErrorMessage("Invalid name");
      return;
    }
    setVisName(input);
    setErrorMessage();
  }

  function createNewParam() {
    const newItem = { name: "", suggested: "" };
    setAllParams((prevParams) => [...prevParams, newItem]);
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!isFormValid) {
      return;
    }
    const params = allParams.map((item) => {
      return { name: item?.name, suggested: item?.suggested.split(/,\s*|,/) };
    });

    let codeFile = initCode;
    if (!codeFile) {
      const blob = new Blob([defaultCode], { type: "text/plain" });
      codeFile = blob;
    }

    const visMetadata = {
      title: visName,
      description: visDescription,
      parameters: params,
      author: {
        connect: {
          id: currentUser?.id,
        },
      },
      editable: true,
      code: {
        upload: codeFile,
      },
    };

    createNewVisual({
      variables: {
        data: visMetadata,
      },
    });
  }

  if (data?.createVisual?.id) {
    console.log("Navigating...");
    navigate(`/visuals/${data?.createVisual?.id}`);
    return;
  }

  return (
    <div className="scrollable">
      <div className="h-100 center-margin overflow-scroll disable-scrollbar">
        <div className="align-items-start mb-5">
          {currentUser && <MyUserName currentUser={currentUser} />}
          <Link
            className="btn btn-link text-decoration-none fw-medium mb-0 p-0 mt-5"
            to="/visuals"
          ><i className="bi bi-arrow-left-short"></i>Visuals</Link>
          <h2 className="mt-0 mb-1 fw-bold">New visual</h2>
          <p>
            Create a new P5.js visual from scratch or upload your code<br></br>
          </p>
        </div>
        <h5>Information</h5>
        <div className="input-group mb-2">
          <span className="input-group-text" id="basic-addon2">
            Name
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Visual name"
            aria-label="Visual name"
            autoComplete="off"
            onChange={(e) => validateName(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <textarea
            type="text"
            className="form-control"
            placeholder="Please provide a short description"
            aria-label="Description"
            onChange={(e) => validateDescription(e.target.value)}
          />
        </div>
        {errorMessage && <p className="text-warning">{errorMessage}</p>}
        <div className="mb-4">
          <h5>Parameters</h5>
          <div className="pb-2">
            <button
              onClick={createNewParam}
              className="btn btn-link fs-5 mt-0 pt-0 pb-0"
            >
              <i className="bi bi-plus"></i>
            </button>
            Add parameters by name. Optionally, add suggested data streams as
            comma sepparated values.
          </div>
          {allParams.map((item, idx) => (
            <ParamItem
              myParam={item}
              idx={idx}
              setAllParams={setAllParams}
              setIsParamsValid={setIsParamsValid}
              key={idx}
            />
          ))}
        </div>
        <div className="mb-4">
          <h5>Code</h5>
          <input
            type="file"
            className="form-control"
            id="inputUpload"
            accept=".txt,.js"
            onChange={(e) => handleFileUpload(e, setInitCode)}
          />
        </div>
        {loading && <p className="text-success">Creating visual...</p>}
        <button
          type="submit"
          className={`btn btn-primary ${
            (!isFormValid || loading) && "disabled"
          }`}
          onClick={handleFormSubmit}
        >
          Create visual
        </button>
      </div>
    </div>
  );
}

async function handleFileUpload(e, setInitCode) {
  const form = e.currentTarget;
  const [file] = await form.files;

  if (!file) {
    setInitCode();
    console.log("No file selected");
    return;
  }

  const extension = file.name
    .substring(file.name.lastIndexOf("."))
    .toLowerCase();

  if (extension === ".js") {
    // Read the contents of the .js file
    const reader = new FileReader();
    reader.onload = function (event) {
      const jsContent = event.target.result;

      const txtContent = jsContent.replace(/(?:\r\n|\r|\n)/g, "\n"); // Normalize line endings

      const txtBlob = new Blob([txtContent], { type: "text/plain" });
      setInitCode(txtBlob);
    };
    reader.readAsText(file);
  } else {
    // For .txt files, directly create a Blob
    const txtBlob = new Blob([file], { type: "text/plain" });
    setInitCode(txtBlob);
  }
}

function ParamItem({ myParam, setAllParams, idx, setIsParamsValid }) {
  const [myParamValid, _setMyParamValid] = useState(true);

  function setMyParamValid(val) {
    _setMyParamValid(val);
    setIsParamsValid(val);
  }

  function updateParams(value) {
    setAllParams((prevParams) => {
      const newParams = [...prevParams];
      newParams[idx] = value;
      return newParams;
    });
  }

  function deleteParameter() {
    setAllParams((prevParams) => {
      const newParams = [...prevParams];
      newParams.splice(idx, 1);
      return newParams;
    });
  }

  function updateName(e) {
    updateParams({ name: e.target.value, suggested: myParam?.suggested });
  }

  function updateSuggested(e) {
    const isValid = validateCommaSeparatedList(e.target.value);
    setMyParamValid(isValid);
    if (isValid) {
      updateParams({
        name: myParam?.name,
        suggested: e.target.value,
      });
    }
  }

  return (
    <div key={idx}>
      <div className="param-input">
        <input
          autoComplete="off"
          className="form-control col-name"
          placeholder="Name"
          onChange={updateName}
        ></input>
        <input
          className="form-control col-suggested"
          placeholder="Suggested (i.e. Alpha, Beta, Gamma)"
          onChange={updateSuggested}
        ></input>
        <button
          className="btn btn-outline-danger fw-medium"
          onClick={deleteParameter}
        >
          Delete
        </button>
      </div>
      {!myParamValid && (
        <p className="text-warning">
          Invalid input for the suggested parameters.
        </p>
      )}
    </div>
  );
}

function validateCommaSeparatedList(input) {
  // Check if input is a string

  if (input === "") {
    return true;
  }

  if (typeof input !== "string") {
    return false;
  }

  // Trim leading and trailing whitespace
  input = input.trim();

  // Check if the input is empty after trimming
  if (input === "") {
    return false;
  }

  // Split the input by commas
  const items = input.split(",");

  // Check if each item is not empty and does not contain only whitespace
  for (let item of items) {
    item = item.trim();
    if (item === "") {
      return false;
    }
  }

  // If all checks pass, return true
  return true;
}
