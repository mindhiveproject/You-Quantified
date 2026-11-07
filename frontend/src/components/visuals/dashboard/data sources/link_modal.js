import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { AnimatePresence, motion } from "motion/react";
import { DATA_SOURCE_BLOCKS } from "../../../../queries/dataSources";
import { ModalHeader } from "../../../modal";
import { DeviceRow, OutputChips, Section } from "./source_card";

const ACRONYMS = { eeg: "EEG", ppg: "PPG" };

// What a block streams, from its first output, which the catalog groups and
// filters by.
function modalityOf(block) {
  return block.outputs[0]?.modality ?? "other";
}

function modalityLabel(modality) {
  return ACRONYMS[modality] ?? modality[0].toUpperCase() + modality.slice(1);
}

// Links catalog blocks into the project: what is already linked on top, the
// whole catalog to link more from below. After MindHive's LinkDataSourceModal.
export function LinkSourceModal({ sources, onLink, onUnlink, onClose }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(null);
  const { data, error } = useQuery(DATA_SOURCE_BLOCKS);

  const catalog = data?.dataSourceBlocks ?? [];
  const modalities = [...new Set(catalog.map(modalityOf))];
  const blocks = catalog.filter(
    (block) =>
      (!filter || modalityOf(block) === filter) &&
      block.title.toLowerCase().includes(search.toLowerCase()),
  );
  const groups = modalities
    .map((modality) => ({
      modality,
      blocks: blocks.filter((block) => modalityOf(block) === modality),
    }))
    .filter((group) => group.blocks.length > 0);

  return (
    <div>
      <ModalHeader title="Link a Data Source" onClose={onClose} />
      <div className="d-flex flex-column gap-3">
        <hr className="m-0" />
        {sources.length > 0 && (
          <>
            <h3 className="modal-section-title">Added Data Sources</h3>
            {sources.map((source) => (
              <DeviceRow
                key={source.id}
                className="muted"
                title={source.label || source.block.title}
                subtitle={source.block.requirementLabel}
                subtitleClass="text-body-tertiary"
                actions={
                  <button
                    className="btn btn-danger border-dark btn-48 square"
                    title="Unlink"
                    onClick={() => onUnlink(source)}
                  >
                    <span className="svg-icon icon-unlink" />
                  </button>
                }
              />
            ))}
            <hr className="m-0" />
          </>
        )}

        <h3 className="modal-section-title">Add a new source</h3>
        <div>
          <p className="mb-2">Filter</p>
          <div className="d-flex flex-wrap gap-1">
            {modalities.map((modality) => (
              <button
                key={modality}
                className={`tag ${filter === modality ? "active" : ""}`}
                onClick={() => setFilter(filter === modality ? null : modality)}
              >
                {modalityLabel(modality)}
                {filter === modality && (
                  <span className="material-symbols-outlined">close_small</span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="source-search" className="d-block mb-2">
            Search
          </label>
          <input
            id="source-search"
            type="text"
            className="form-control"
            placeholder="Type to search for a device"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        {error && <p className="text-danger">{`Error loading data sources: ${error.message}`}</p>}
        {data && groups.length === 0 && (
          <p className="text-body-tertiary">No data sources match your search.</p>
        )}
        {groups.map(({ modality, blocks }) => (
          <Section
            key={modality}
            large
            title={modalityLabel(modality)}
            subtitle={`Devices that stream ${ACRONYMS[modality] ?? modality} data`}
          >
            {blocks.map((block) => (
              <CatalogRow key={block.id} block={block} onLink={onLink} />
            ))}
          </Section>
        ))}
      </div>
    </div>
  );
}

function CatalogRow({ block, onLink }) {
  const [showOutputs, setShowOutputs] = useState(false);
  const [linked, setLinked] = useState(false);

  // The icon turns into a check for a moment, like copying a profile link.
  // Clicks in the meantime are ignored, so a double click links it once.
  function link() {
    if (linked) return;
    onLink(block);
    setLinked(true);
    setTimeout(() => setLinked(false), 2000);
  }

  return (
    <DeviceRow
      className="catalog"
      title={block.title}
      subtitle={block.requirementLabel}
      subtitleClass="text-body-tertiary"
      actions={
        <>
          <button
            className={`btn btn-outline-dark btn-48 ${showOutputs ? "active" : ""}`}
            onClick={() => setShowOutputs(!showOutputs)}
            aria-pressed={showOutputs}
          >
            <span className="material-symbols-outlined">graphic_eq</span>
            Outputs
          </button>
          <button
            className="btn btn-secondary border-dark btn-48 square"
            title={linked ? "Linked" : "Link"}
            onClick={link}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={linked ? "check" : "link"}
                className={linked ? "material-symbols-outlined" : "svg-icon icon-link"}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {linked && "check"}
              </motion.span>
            </AnimatePresence>
          </button>
        </>
      }
    >
      {showOutputs && <OutputChips block={block} />}
    </DeviceRow>
  );
}
