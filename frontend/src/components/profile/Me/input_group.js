import { validateUsername } from "../../login/signup";
import { motion, AnimatePresence } from "framer-motion";
import {
  AUTH_USER,
  CHECK_REPEATED_USER,
  CHANGE_USERNAME,
} from "../../../queries/user";
import { useLazyQuery, useMutation } from "@apollo/client";
import { useState } from "react";

export function MyUsernameButtonGroup({ userData }) {
  const [userInput, setUserInput] = useState(userData.name);
  const [inputError, setError] = useState();

  const [editingUsername, setEditingUsername] = useState(false);
  const [hasCopiedUsername, setHasCopiedUsername] = useState(false);
  const [checkRepeatedUser] = useLazyQuery(CHECK_REPEATED_USER);
  const [changeUsername] = useMutation(CHANGE_USERNAME, {
    refetchQueries: [AUTH_USER],
  });

  function checkInputValid(input) {
    setUserInput(input);
    if (input != "" && validateUsername(input)) {
      setError();
    } else {
      setError("Username is invalid");
    }
  }

  async function submitCallback(e) {
    e.preventDefault();

    const { data: repeatedUserData } = await checkRepeatedUser({
      variables: { name: userInput },
    });

    if (repeatedUserData?.usersCount > 0) {
      setError("Username is already taken");
      return;
    }

    const { data, error } = await changeUsername({
      variables: { newName: userInput, userID: userData.id },
    });

    if (error) {
      setError("An error occurred while changing the username");
      return;
    }

    setError("Username successfully changed!");
    setTimeout(() => {
      setError();
    }, 6000);
  }

  function checkEscapeBlur(event) {
    if (event.key == "Escape") {
      event.target.blur();
    }
  }

  function copyUserName() {
    if (hasCopiedUsername) return;

    navigator.clipboard.writeText(userData.id);
    setHasCopiedUsername(true);
    setTimeout(() => {
      setHasCopiedUsername(false);
    }, 3000);
  }

  return (
    <div>
      <div className="d-flex h-40">
        <form onSubmit={submitCallback} className="d-flex">
          <button
            className="btn btn-secondary btn-outline-dark d-flex align-items-center p-0 me-n0-1"
            type="button"
            id="button-addon1"
            onClick={copyUserName}
          >
            <AnimatePresence mode="wait">
              {hasCopiedUsername ? (
                <motion.i
                  key="check"
                  className="p-0 m-0 bi bi-check2 w-40px"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                />
              ) : (
                <motion.i
                  key="copy"
                  className="p-0 m-0 bi bi-copy w-40px"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
              /> 
              )}
            </AnimatePresence>
          </button>
          {/*<button
          className="btn btn-gray btn-outline-dark d-flex align-items-center p-0 me-n0-1"
          type="button"
          id="button-addon1"
          onClick={() => setEditingUsername(true)}
        >
          <span className="material-symbols-outlined w-40">edit</span>
        </button>*/}
          <input
            value={userInput}
            onChange={(e) => {
              checkInputValid(e.target.value);
            }}
            onBlur={() => setEditingUsername(false)}
            className="form-control border border-dark border-primary-active"
            onKeyDown={(e) => checkEscapeBlur(e)}
            disabled={!editingUsername}
          />
        </form>
      </div>
      <div>
        <AnimatePresence>
          {hasCopiedUsername && (
            <motion.p
              className="text-body-tertiary"
              key="copy-message"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              Copied user id to clipboard
            </motion.p>
          )}
        </AnimatePresence>
        <p className="text-body-tertiary">{inputError}</p>
      </div>
    </div>
  );
}
