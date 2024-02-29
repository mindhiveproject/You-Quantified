import Document from "@tiptap/extension-document";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import ParameterExtension from "./parameters";
import { BubbleMenu, EditorContent, useEditor } from "@tiptap/react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { CHANGE_LESSON, GET_LESSON } from "../../../queries/lessons";
import { MY_VISUALS } from "../../../queries/visuals";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchCode } from "../../visuals/fetch_code";
import { VisualsWindow } from "../../visuals/window/visuals_window";
import { useFullScreenHandle } from "react-full-screen";

const CustomDocument = Document.extend({
  content: "emphasis heading block*",
});

const extensions = [
  StarterKit,
  Link.extend({ inclusive: false }),
  ParameterExtension,
  CustomDocument,
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading[level=1]") {
        return "Title";
      }
      if (node.type.name === "emphasis") {
        return "Subtitle";
      }
      return "Add content";
    },
  }),
];

export function QueryLesson() {
  const { lessonID } = useParams();

  const {
    loading,
    error,
    data: lessonData,
  } = useQuery(GET_LESSON, {
    variables: { id: lessonID },
  });

  if (loading) return "Loading...";
  if (error) return `Error!`;

  return <MainView lessonData={lessonData} visData={lessonData?.visual}/>;
}


function MainView({ visData, lessonData }) {
  const [visMetadata, _setVisMetadata] = useState(visData);
  const [code, setCode] = useState("");
  const [popupVisuals, setPopupVisuals] = useState(false);
  const fullScreenHandle = useFullScreenHandle();
  const dispatch = useDispatch();

  useEffect(() => {
    if (visMetadata?.parameters) {
      dispatch({ type: "params/load", payload: visMetadata?.parameters });
    }
  }, [visMetadata]);

  useEffect(() => {
    fetchCode(visMetadata?.code?.url)
      .then((response) => setCode(response))
      .catch((error) => setCode(null));
  });

  return (
    <div className="h-100 d-flex">
      <div className="w-50">
        <TipTap lessonData={lessonData} />
      </div>
      <div className="w-50">
        <VisualsWindow
          code={code}
          visMetadata={visMetadata}
          popupVisuals={popupVisuals}
          setPopupVisuals={setPopupVisuals}
          fullScreenHandle={fullScreenHandle}
        />
      </div>
    </div>
  );
}

function TipTap({ lessonData }) {
  const [updateLesson] = useMutation(CHANGE_LESSON, {
    variables: { id: lessonData?.id },
  });

  const editor = useEditor({
    extensions,
    content: lessonData?.content,
    onUpdate: (editor) => {
      const content = editor.getJSON();
      updateLesson({ variables: { data: content } });
    },
  });

  if (editor) {
    editor.setEditable(true);
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

function NewLineMenu({ editor }) {
  if (!editor) {
    return null;
  }

  return (
    <>
      <a
        className="btn btn-link"
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        <i className="bi bi-plus h5"></i>
      </a>
      <div className="dropdown">
        <ul className="dropdown-menu">
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
              onClick={() => {
                editor.commands.insertContent(`<parameters visID=${visID} />`);
              }}
              className="dropdown-item"
            >
              Parameters
            </button>
          </li>
        </ul>
      </div>
    </>
  );
}
