import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useDispatch, useSelector } from "react-redux";
import React, { useRef, useEffect, useState } from "react";
import DataManagement from "../../visuals/dashboard/data_management";
import { useQuery } from "@apollo/client";
import { MY_VISUALS } from "../../../queries/visuals";
import { selectParamValues } from "../../visuals/selectors";

const ParameterExtension = Node.create({
  name: "Parameters",
  group: "block",
  tag: "parameters",
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
    return ReactNodeViewRenderer(ParametersTipTap);
  },
  renderHTML({ HTMLAttributes }) {
    return ["parameters", mergeAttributes(HTMLAttributes)];
  },
  parseHTML() {
    return [{ tag: "parameters" }];
  },
});

export default ParameterExtension;

function LoadParameters({ visMetadata, setVisMetadata }) {
  const params = useSelector(selectParamValues);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  if (Object.keys(params).length === 0) return <div>Loading...</div>;

  return (
    <DataManagement
      visInfo={visMetadata}
      custom={false}
      setVisInfo={setVisMetadata}
    ></DataManagement>
  );
}

function StateManagerParameters({ visMeta }) {
  const [visMetadata, setVisMetadata] = useState(visMeta);

  return (
    <LoadParameters visMetadata={visMetadata} setVisMetadata={setVisMetadata} />
  );
}

function ParametersTipTap(props) {
  const { loading, error, data } = useQuery(MY_VISUALS, {
    variables: { where: { id: { equals: props.node.attrs.visID } } },
  });

  if (loading) return <NodeViewWrapper>Loading...</NodeViewWrapper>;
  if (error) return <NodeViewWrapper>{error}</NodeViewWrapper>;

  return (
    <NodeViewWrapper>
      <StateManagerParameters visMeta={data?.visuals[0]} />
    </NodeViewWrapper>
  );
}
