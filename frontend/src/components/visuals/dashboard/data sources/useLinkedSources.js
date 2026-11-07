import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  VISUAL_DATA_SOURCES,
  LINK_DATA_SOURCES,
  UNLINK_DATA_SOURCE,
} from "../../../../queries/dataSources";
import { deviceRuntime } from "../../../../devices/runtime";

const REFETCH = {
  refetchQueries: [VISUAL_DATA_SOURCES],
  awaitRefetchQueries: true,
};

// The data sources linked into a project, as `{ id, label, block }` rows.
//
// An editor's links are saved on the visual. Anyone else can link and unlink
// too, but only for as long as they have the project open: their changes live
// in `sessionSources` and are dropped when they leave (or saved, if they make a
// copy).
export function useLinkedSources(visID, isEditable) {
  const { data } = useQuery(VISUAL_DATA_SOURCES, {
    variables: { visualId: visID },
  });
  const [linkSources] = useMutation(LINK_DATA_SOURCES, REFETCH);
  const [unlinkSource] = useMutation(UNLINK_DATA_SOURCE, REFETCH);
  const [sessionSources, setSessionSources] = useState(null);

  const sources = sessionSources ?? data?.visualDataSources ?? [];

  function link(block) {
    if (!isEditable) {
      const id = `session-${crypto.randomUUID()}`;
      setSessionSources([...sources, { id, label: null, block }]);
      return;
    }
    linkSources({
      variables: {
        data: [
          {
            visual: { connect: { id: visID } },
            block: { connect: { id: block.id } },
            order: sources.length,
          },
        ],
      },
    });
  }

  function unlink(source) {
    deviceRuntime.closeSource(source.id);
    if (!isEditable) {
      setSessionSources(sources.filter(({ id }) => id !== source.id));
      return;
    }
    unlinkSource({ variables: { id: source.id } });
  }

  return { sources, link, unlink };
}
