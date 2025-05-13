import { useMutation } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { NEW_VISUAL } from "../../../../../queries/visuals";
import { UserContext } from "../../../../../App";
import { useContext, useState } from "react";
import clsx from "clsx";
import { useSearchParams } from "react-router-dom";

/**
 * Button to save & create a visual based on the AI's info
 *
 * @param {object} props
 * @param {boolean} props.isDisabled - Disabled behavior of the button
 * @param {object} props.visualMetaAI - Object containing the visual's metadata
 */
function CreateButton({ isDisabled, visualMetaAI }) {
  const navigate = useNavigate();
  const { currentUser } = useContext(UserContext);
  const [createNewVisual] = useMutation(NEW_VISUAL);
  const [isError, setIsError] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  async function submitVisualForCreation() {
    const codeFile = new Blob([visualMetaAI?.code], { type: "text/plain" });

    const newVisData = {
      title: visualMetaAI?.name,
      description: "AI generated visual",
      parameters: visualMetaAI?.parameters,
      code: {
        upload: codeFile,
      },
      editable: true,
      author: {
        connect: {
          id: currentUser?.id,
        },
      },
      genAI: {
        connect: {
          langGraphThread: searchParams.get("ai-thread")
        }
      }
    };

    const { data } = await createNewVisual({
      variables: {
        data: newVisData,
      },
    });

    if (data) {
      navigate(`/visuals/${data?.createVisual?.id}`);
    } else {
      setIsError(true);
    }
  }

  return (
    <button
      className={clsx(
        "btn",
        "d-flex align-items-center",
        "h-48px ps-3",
        isError ? "btn-outline-warning" : "btn-outline-secondary"
      )}
      disabled={isDisabled}
      onClick={submitVisualForCreation}
    >
      <span className="material-symbols-outlined m-0 me-1">check</span>
      Save & Create
    </button>
  );
}

export default CreateButton;