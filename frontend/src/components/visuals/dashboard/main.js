import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@apollo/client/react";
import { MY_VISUALS } from "../../../queries/visuals";
import MainView from "./main_view";
import NoVisualScreen from "./no_visual_screen";
import { isNewBackendVisual } from "../../../utility/newBackendVisuals";
import { HocuspocusProviderWebsocketComponent, HocuspocusRoom } from "@hocuspocus/provider-react";

export { VisualScreen } from "./visual_screen";

const collabEndpoint =
  process.env.NODE_ENV === "development"
    ? process.env.REACT_APP_COLLAB_ENDPOINT_DEV || "ws://localhost:3001/collab"
    : process.env.REACT_APP_COLLAB_ENDPOINT;

export function QueryMainView() {
  const { visID } = useParams();

  const { dataState, error, data } = useQuery(MY_VISUALS, {
    variables: { where: { id: { equals: visID } } },
    // fetchPolicy: "network-only",
  });

  if (error) return `Error! ${error.message}`;

  if (dataState === "empty") return "Loading...";

  if (data?.visuals?.length === 0 || isNewBackendVisual(data?.visuals?.[0])) {
    return <NoVisualScreen />;
  }

  return (
    <HocuspocusProviderWebsocketComponent url={collabEndpoint}>
      <HocuspocusRoom name={`visual:${visID}`}>
        <MainView visID={visID} queryData={data?.visuals[0]} />
      </HocuspocusRoom>
    </HocuspocusProviderWebsocketComponent>
  );
}
