import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useDispatch, useSelector } from "react-redux";
import React, { useRef, useEffect, useState } from "react";
import DataManagement from "../../visuals/dashboard/data_management";
import { useQuery } from "@apollo/client";
import { selectParamValues } from "../../visuals/utility/selectors";
import { GET_LESSON } from "../../../queries/lessons";
import { useParams } from "react-router-dom";

const ParameterExtension = Node.create({
  name: "Parameters",
  group: "block",
  tag: "parameters",
  atom: true,
  addAttributes() {
    return {
      visMeta: {
        parseHTML: (element) => element.getAttribute("visMeta"),
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

function ParametersTipTap() {
  const { lessonID } = useParams();

  const { loading, error, data } = useQuery(GET_LESSON, {
    variables: { id: lessonID },
  });

  if (loading) return "Loading...";
  if (error) return `Error!`;

  const lessonData = data.lesson;

  const visData = {
    code: lessonData?.code,
    parameters: lessonData?.parameters,
    editable: true,
  };

  return (
    <NodeViewWrapper>
      <StateManagerParameters visMeta={visData} />
    </NodeViewWrapper>
  );
}
