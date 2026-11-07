import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { DATA_SOURCE_BLOCKS } from "../../../../queries/dataSources";
import { ModalHeader } from "../../../modal";
import { OutputChips } from "./source_card";

// Links catalog blocks into the project: what is already linked on top, the
// whole catalog to link more from below. After MindHive's LinkDataSourceModal.
export function LinkSourceModal({ sources, onLink, onUnlink, onClose }) {
  const [search, setSearch] = useState("");
  const [showOutputs, setShowOutputs] = useState(false);
  const { data, error } = useQuery(DATA_SOURCE_BLOCKS);

  const blocks = (data?.dataSourceBlocks ?? []).filter((block) =>
    block.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <ModalHeader title="Link a data source" onClose={onClose} />
      <p>Linked data sources can be connected and mapped to this visual.</p>

      <h6 className="mt-4">Linked</h6>
      {sources.length === 0 ? (
        <p className="text-body-tertiary">Nothing is linked yet.</p>
      ) : (
        <ul className="list-group rounded-0">
          {sources.map((source) => (
            <BlockRow
              key={source.id}
              title={source.label || source.block.title}
              subtitle={source.block.requirementLabel}
            >
              <button
                className="btn btn-outline-dark btn-sm"
                onClick={() => onUnlink(source)}
              >
                Unlink
              </button>
            </BlockRow>
          ))}
        </ul>
      )}

      <h6 className="mt-4">All data sources</h6>
      <div className="d-flex align-items-center mb-2">
        <input
          type="text"
          className="form-control"
          placeholder="Search data sources"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="form-check text-nowrap ms-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="show-outputs"
            checked={showOutputs}
            onChange={(e) => setShowOutputs(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="show-outputs">
            Show outputs
          </label>
        </div>
      </div>
      {error && <p className="text-danger">{`Error loading data sources: ${error.message}`}</p>}
      {data && blocks.length === 0 && (
        <p className="text-body-tertiary">No data sources match your search.</p>
      )}
      <ul className="list-group rounded-0">
        {blocks.map((block) => (
          <BlockRow
            key={block.id}
            title={block.title}
            subtitle={block.requirementLabel}
            outputs={showOutputs && <OutputChips block={block} />}
          >
            <button
              className="btn btn-secondary btn-outline-dark btn-sm"
              onClick={() => onLink(block)}
            >
              Link
            </button>
          </BlockRow>
        ))}
      </ul>
    </div>
  );
}

function BlockRow({ title, subtitle, outputs, children }) {
  return (
    <li className="list-group-item border-dark">
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <span className="d-block fw-medium">{title}</span>
          <small className="text-body-tertiary">{subtitle}</small>
        </div>
        {children}
      </div>
      {outputs && <div className="mt-2">{outputs}</div>}
    </li>
  );
}
