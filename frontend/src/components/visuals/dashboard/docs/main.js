import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { Color } from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Blockquote from "@tiptap/extension-blockquote";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import javascript from "highlight.js/lib/languages/javascript";
import { createLowlight } from "lowlight";
import { sanitizeURL } from "../../../../utility/sanitize_urls";
import { useOutsideAlerter } from "../../../../utility/outsideClickDetection";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import {
  useHocuspocusAwareness,
  useHocuspocusProvider,
  useHocuspocusConnectionStatus,
} from "@hocuspocus/provider-react";

const lowlight = createLowlight();
lowlight.register("js", javascript);

const TAB_CHAR = "\u0009";

const TabHandler = Extension.create({
  name: "tabHandler",
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // Sinks a list item / inserts a tab character
        editor
          .chain()
          .sinkListItem("listItem")
          .command(({ tr }) => {
            tr.insertText(TAB_CHAR);
            return true;
          })
          .run();
        // Prevent default behavior (losing focus)
        return true;
      },
    };
  },
});

// In case I want to add support for more languages:
// https://tiptap.dev/docs/examples/advanced/syntax-highlighting

const TOOL_SIZE = 48;
const DIVIDER_SIZE = 1;

// The formatting tools, in groups separated by a divider.
const toolGroups = (editor, setIsAddingLink) => {
  const chain = () => editor.chain().focus();
  const can = (command) => editor.can().chain().focus()[command]().run();

  return [
    [
      { icon: "undo", label: "Undo", run: () => chain().undo().run(), disabled: !can("undo") },
      { icon: "redo", label: "Redo", run: () => chain().redo().run(), disabled: !can("redo") },
    ],
    [
      {
        icon: "format_h1",
        label: "Heading 1",
        run: () => chain().toggleHeading({ level: 3 }).run(),
        active: editor.isActive("heading", { level: 3 }),
      },
      {
        icon: "format_h2",
        label: "Heading 2",
        run: () => chain().toggleHeading({ level: 4 }).run(),
        active: editor.isActive("heading", { level: 4 }),
      },
      {
        icon: "format_paragraph",
        label: "Paragraph",
        run: () => chain().setParagraph().run(),
        active: editor.isActive("paragraph"),
      },
    ],
    [
      {
        icon: "format_bold",
        label: "Bold",
        run: () => chain().toggleBold().run(),
        disabled: !can("toggleBold"),
        active: editor.isActive("bold"),
      },
      {
        icon: "format_italic",
        label: "Italic",
        run: () => chain().toggleItalic().run(),
        disabled: !can("toggleItalic"),
        active: editor.isActive("italic"),
      },
      {
        icon: "format_underlined",
        label: "Underline",
        run: () => chain().toggleUnderline().run(),
        active: editor.isActive("underline"),
      },
      editor.isActive("link")
        ? { icon: "link_off", label: "Remove link", run: () => chain().unsetLink().run() }
        : { icon: "link", label: "Add link", run: () => setIsAddingLink(true) },
      {
        icon: "code",
        label: "Code",
        run: () => chain().toggleCode().run(),
        disabled: !can("toggleCode"),
        active: editor.isActive("code"),
      },
    ],
    [
      {
        icon: "data_object",
        label: "Code block",
        run: () => chain().toggleCodeBlock().run(),
        active: editor.isActive("codeBlock"),
      },
      {
        icon: "format_list_bulleted",
        label: "Bulleted list",
        run: () => chain().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
      },
      {
        icon: "format_list_numbered",
        label: "Numbered list",
        run: () => chain().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
      },
      {
        icon: "format_quote",
        label: "Quote",
        run: () => chain().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
      },
    ],
  ];
};

// The formatting tools that fit in the bar. The rest go in a row under a
// "more" button, like Google Docs does.
const MenuBar = ({ editor, setIsAddingLink }) => {
  const barRef = useRef(null);
  const moreRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [showMore, setShowMore] = useState(false);
  useOutsideAlerter(moreRef, setShowMore);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(barRef.current);
    return () => observer.disconnect();
  }, []);

  const tools = editor
    ? toolGroups(editor, setIsAddingLink).flatMap((group, g) =>
        group.map((tool, i) => ({ ...tool, divider: g > 0 && i === 0 })),
      )
    : [];
  const cost = (tool) => TOOL_SIZE + (tool.divider ? DIVIDER_SIZE : 0);

  // Leave room for the "more" button when not everything fits.
  const total = tools.reduce((sum, tool) => sum + cost(tool), 0);
  const budget = total > width ? width - TOOL_SIZE : width;
  let used = 0;
  let visibleCount = 0;
  for (const tool of tools) {
    used += cost(tool);
    if (used > budget) break;
    visibleCount++;
  }
  const hidden = tools.slice(visibleCount);

  const renderTool = (tool, onRun) => (
    <React.Fragment key={tool.icon}>
      {tool.divider && <div className="tool-divider" />}
      <button
        className={`tool-btn ${tool.active ? "is-active" : ""}`}
        title={tool.label}
        disabled={tool.disabled}
        onClick={() => {
          tool.run();
          onRun?.();
        }}
      >
        <span className="material-symbols-outlined">{tool.icon}</span>
      </button>
    </React.Fragment>
  );

  return (
    <div className="tool-bar" ref={barRef}>
      {tools.slice(0, visibleCount).map((tool) => renderTool(tool))}
      {hidden.length > 0 && (
        <div ref={moreRef}>
          <button
            className={`tool-btn ${showMore ? "is-active" : ""}`}
            title="More"
            onClick={() => setShowMore(!showMore)}
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>
          {showMore && (
            <div className="tool-overflow">
              {hidden.map((tool, i) =>
                renderTool({ ...tool, divider: tool.divider && i > 0 }, () =>
                  setShowMore(false),
                ),
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function LinkMenu({ editor, setIsAddingLink }) {
  const previousUrl = editor.getAttributes("link").href;

  const setLink = useCallback(
    (event) => {
      let url = event.target.value;

      if (url === null) {
        return;
      }

      // empty
      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }

      // update link
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({
          href: sanitizeURL(url),
          target: "_blank",
        })
        .run();
    },
    [editor],
  );

  return (
    <div>
      <p>Link to another website</p>
      <input
        type="text"
        placeholder="Insert address"
        className="form-control"
        autoFocus
        defaultValue={previousUrl || undefined}
        onBlur={() => setIsAddingLink(false)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            setLink(event);
            setIsAddingLink(false);
          }
        }}
      ></input>
    </div>
  );
}

export const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
  Link.extend({ inclusive: false }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false, // TODO : Making this as `false` becase marks are not preserved when I try to preserve attrs, awaiting a bit of help
    },
    undoRedo: false,
  }),
  CodeBlockLowlight.configure({ lowlight }),
  TabHandler,
  Underline,
  Blockquote,
];

export default function DocsWindow({
  setDocsVisibility,
  isEditable,
  isDocsVisible,
}) {
  const saveTimeout = React.useRef(null);
  const provider = useHocuspocusProvider();
  const status = useHocuspocusConnectionStatus();
  const users = useHocuspocusAwareness();

  const editor = useEditor({
    extensions: [
      ...extensions,
      Collaboration.configure({ document: provider.document, field: "docs" }),
      CollaborationCaret.configure({
        provider,
        user: { name: users[0]?.user?.name, color: users[0]?.user?.color },
      }),
    ],
    editable: isEditable,
  });

  const [_isDocsVisible, _setIsDocsVisible] = useState(isDocsVisible);

  function setIsDocsVisible(input) {
    setDocsVisibility(input);
    _setIsDocsVisible(input);
  }

  const [isAddingLink, setIsAddingLink] = useState(false);
  const linkPopupRef = React.useRef(null);
  useOutsideAlerter(linkPopupRef, setIsAddingLink);

  return (
    <div className="d-flex flex-column h-100 overflow-clip">
      {isEditable && (
        <div className="action-bar">
          <MenuBar editor={editor} setIsAddingLink={setIsAddingLink} />
          <button
            className={`btn btn-48 ${
              _isDocsVisible ? "btn-outline-primary" : "btn-outline-dark"
            }`}
            onClick={() => setIsDocsVisible(!_isDocsVisible)}
          >
            <span className="material-symbols-outlined">
              {_isDocsVisible ? "visibility" : "visibility_off"}
            </span>
            {_isDocsVisible ? "Visible" : "Hidden"}
          </button>
        </div>
      )}
      <div className="scrollable-editor">
        <EditorContent editor={editor}></EditorContent>
      </div>
      {isAddingLink && (
        <div className="edit-background">
          <div className="edit-popup" ref={linkPopupRef}>
            <LinkMenu setIsAddingLink={setIsAddingLink} editor={editor} />
          </div>
        </div>
      )}
    </div>
  );
}
