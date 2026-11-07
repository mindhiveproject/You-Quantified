import { gql } from "@apollo/client";

// A catalog entry: the yq-data graph a source runs, the device inputs it
// connects and the outputs it streams. Shared with MindHive's backend.
const BLOCK_FIELDS = gql`
  fragment DataSourceBlockFields on DataSourceBlock {
    id
    title
    description
    requirementLabel
    inputs
    outputs
    graph
  }
`;

export const DATA_SOURCE_BLOCKS = gql`
  query DataSourceBlocks {
    dataSourceBlocks(
      where: { published: { equals: true } }
      orderBy: [{ title: asc }]
    ) {
      ...DataSourceBlockFields
    }
  }
  ${BLOCK_FIELDS}
`;

// The data sources linked into one visual, in the order they were linked.
export const VISUAL_DATA_SOURCES = gql`
  query VisualDataSources($visualId: ID!) {
    visualDataSources(
      where: { visual: { id: { equals: $visualId } } }
      orderBy: [{ order: asc }]
    ) {
      id
      label
      block {
        ...DataSourceBlockFields
      }
    }
  }
  ${BLOCK_FIELDS}
`;

// Links one block into a visual, or several at once when a visual is copied.
export const LINK_DATA_SOURCES = gql`
  mutation LinkDataSources($data: [VisualDataSourceCreateInput!]!) {
    createVisualDataSources(data: $data) {
      id
    }
  }
`;

export const UNLINK_DATA_SOURCE = gql`
  mutation UnlinkDataSource($id: ID!) {
    deleteVisualDataSource(where: { id: $id }) {
      id
    }
  }
`;
