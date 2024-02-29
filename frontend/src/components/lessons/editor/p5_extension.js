import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { P5iFrame } from "../../visuals/P5Plugin/p5iframe";
import { useDispatch, useSelector } from "react-redux";
import React, { useRef, useEffect, useState } from "react";
import DataManagement from "../../visuals/dashboard/data_management";
import { useQuery } from "@apollo/client";
import { MY_VISUALS } from "../../../queries/visuals";
import { fetchCode } from "../../visuals/fetch_code";
import { selectParamValues } from "../../visuals/selectors";

// To insert it into the actual editor
// this.editor.chain().insertContentAt(this.editor.state.selection.head, { type: this.type.name }).focus().run()

const P5Extension = Node.create({
  name: "P5Visualization",
  group: "block",
  tag: "p5-visualization",
  atom: true,
  addAttributes() {
    return {
      visID: {
        default: "clrpzl7jr00020wfku5szbyg8",
        parseHTML: (element) => element.getAttribute("visID"),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(P5LessonVisualsTipTap);
  },
  renderHTML({ HTMLAttributes }) {
    return ["p5-visualization", mergeAttributes(HTMLAttributes)];
  },
  parseHTML() {
    return [
      {
        tag: "p5-visualization",
      },
    ];
  },
});

export default P5Extension;

function LoadP5LessonVisuals({ visMetadata, setVisMetadata }) {
  const visID = visMetadata?.id;
  const params = useSelector(selectParamValues);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const [dispCode, setDispCode] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    fetchCode(visMetadata?.code?.url)
      .then((response) => setCode(response))
      .catch((error) => setCode(null));
  }, []);

  if (Object.keys(params).length === 0) return <div>Loading...</div>;

  return (
    <>
      <DataManagement
        visInfo={visMetadata}
        custom={false}
        setVisInfo={setVisMetadata}
      />
      <div className="mb-n5" />
      <div className="p5-container-lessons">
        <P5iFrame params={params} code={code} />
      </div>
    </>
  );
}

function StateManagerP5Visuals({ visMeta }) {
  const [visMetadata, setVisMetadata] = useState(visMeta);

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch({ type: "params/load", payload: visMetadata?.parameters });
  }, []);

  return (
    <LoadP5LessonVisuals
      visMetadata={visMetadata}
      setVisMetadata={setVisMetadata}
    />
  );
}

function P5LessonVisualsTipTap(props) {
  const { loading, error, data } = useQuery(MY_VISUALS, {
    variables: { where: { id: { equals: props.node.attrs.visID } } },
  });

  if (loading) return <NodeViewWrapper>Loading...</NodeViewWrapper>;
  if (error) return;

  return (
    <NodeViewWrapper>
      <StateManagerP5Visuals visMeta={data?.visuals[0]} />
    </NodeViewWrapper>
  );
}
