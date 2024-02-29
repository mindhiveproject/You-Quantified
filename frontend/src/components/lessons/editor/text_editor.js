import React, { useEffect, useState } from "react";
import {
  EditorContent,
  FloatingMenu,
  BubbleMenu,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import P5Extension from "./p5_extension";
import Placeholder from "@tiptap/extension-placeholder";
import Document from "@tiptap/extension-document";
import DeviceExtension from "./connectivity";

const CustomDocument = Document.extend({
  content: "heading block*",
});

const extensions = [
  StarterKit,
  Link.extend({ inclusive: false }),
  P5Extension,
  CustomDocument,
  DeviceExtension,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return "Enter a title";
      }
      return "Add the content";
    },
  }),
];

const content = `
<h1>Custom title</h1><p></p><p>This is a sample lesson</p><device-connection device="EMOTIV"></device-connection><p5-visualization visid="clrpzl7jr00020wfku5szbyg8"></p5-visualization>
`;

function TipTap() {
  const editor = useEditor({
    extensions,
    content,
  });

  if (editor) {
    editor.setEditable(true);
    console.log(editor.getJSON());
  }

  return (
    <>
      <EditorContent editor={editor} />
      <BubbleMenu editor={editor}>
        <InlineMenuWithLink editor={editor} />
      </BubbleMenu>
      <FloatingMenu editor={editor}>
        <NewLineMenu editor={editor} />
      </FloatingMenu>
    </>
  );
}

function InlineMenu({ editor, setIsAddingLink }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="inline-menu">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "is-active" : ""}
      >
        <span className="material-symbols-outlined inline-icon">
          format_bold
        </span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "is-active" : ""}
      >
        <span className="material-symbols-outlined inline-icon">
          format_italic
        </span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive("strike") ? "is-active" : ""}
      >
        <span className="material-symbols-outlined inline-icon">
          format_strikethrough
        </span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={editor.isActive("code") ? "is-active" : ""}
      >
        <span className="material-symbols-outlined inline-icon">code</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "is-active" : ""}
      >
        <span className="material-symbols-outlined inline-icon">
          format_list_bulleted
        </span>
      </button>
      <button
        onClick={() => setIsAddingLink(true)}
        className={editor.isActive("link") ? "is-active" : ""}
      >
        <span className="material-symbols-outlined inline-icon">link</span>
      </button>
    </div>
  );
}

function InlineMenuWithLink({ editor }) {
  const [isAddingLink, setIsAddingLink] = useState(false);

  if (!editor) {
    return null;
  }

  return (
    <div>
      {!isAddingLink ? (
        <InlineMenu editor={editor} setIsAddingLink={setIsAddingLink} />
      ) : (
        <LinkMenu editor={editor} setIsAddingLink={setIsAddingLink} />
      )}
    </div>
  );
}

function LinkMenu({ editor, setIsAddingLink }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Insert address"
        autoFocus
        onBlur={() => setIsAddingLink(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            editor
              .chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href: event.target.value, target: "_blank" })
              .run();
            setIsAddingLink(false);
          }
        }}
      ></input>
    </div>
  );
}

function NewLineMenu({ editor }) {
  if (!editor) {
    return null;
  }

  const [isAddingP5Link, setIsAddingP5Link] = useState(false);

  const deviceList = ["EMOTIV", "Muse"];

  return (
    <>
      <a
        className="btn btn-link"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
        onClick={() => setIsAddingP5Link(false)}
      >
        <i className="bi bi-plus h5"></i>
      </a>
      <div className="dropdown">
        <ul className="dropdown-menu">
          {isAddingP5Link ? (
            <GetVisIDFromLink editor={editor} setter={setIsAddingP5Link} />
          ) : (
            <>
              <li>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className="dropdown-item"
                >
                  Title
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className="dropdown-item"
                >
                  Subtitle
                </button>
              </li>
              <li>
                <button
                  onClick={(event) => {
                    setIsAddingP5Link(true);
                    event.stopPropagation();
                  }}
                  className="dropdown-item"
                >
                  P5 Visual
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="dropdown-item"
                  data-bs-toggle="dropdown-submenu"
                  data-bs-target="#nested-dropdown"
                  aria-expanded="false"
                >
                  Devices
                </button>
                <ul
                  className="submenu-right dropdown-menu"
                  id="nested-dropdown"
                >
                  {deviceList.map((deviceName) => (
                    <li key={deviceName}>
                      <button
                        className="dropdown-item"
                        onClick={() => addDevice(editor, deviceName)}
                      >
                        {deviceName}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            </>
          )}
        </ul>
      </div>
    </>
  );
}

function addDevice(editor, device) {
  editor.commands.insertContent(`<device-connection device=${device} />`);
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

function GetVisIDFromLink({ editor, setter }) {
  return (
    <div>
      <input
        type="text"
        placeholder="Insert visualization ID or link"
        autoFocus
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            const visID = extractVisID(event.target.value);
            /*if (!getVisMeta(visID)) {
              setter(false);
              return;
            }*/
            console.log(visID);
            editor.commands.insertContent(
              `<p5-visualization visID=${visID} />`
            );
            setter(false);
          }
        }}
        onBlur={() => setter(false)}
      ></input>
    </div>
  );
}

export function TextEditor() {
  return <TipTap />;
}
