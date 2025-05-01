import React, { useRef } from "react";
import { AIExpandButton } from "../ui";

/**
 * Button component to upload image files as references
 * 
 * @param {function} props.addReference - Function to add a new reference
 */
function FileInputButton({ addReference }) {
  const fileInputRef = useRef(null);

  async function uploadImgFile(e) {
    const file = e.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        addReference({ imgSrc: reader.result, name: file.name, type: "image" });
      };
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".jpg,.png"
        style={{ display: "none" }}
        onChange={uploadImgFile}
        ref={fileInputRef}
      />
      <AIExpandButton
        icon={"photo_prints"}
        text={"Add an image"}
        onClick={() => {
          fileInputRef.current.click();
        }}
      />
    </div>
  );
}

export default FileInputButton;