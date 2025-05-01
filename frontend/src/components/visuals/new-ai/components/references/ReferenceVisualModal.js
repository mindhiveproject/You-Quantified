import React, { useState } from "react";
import { useQuery } from "@apollo/client";
import { SEARCH_VISUALS } from "../../../../../queries/visuals";
import DisplayVisResult from "./DisplayVisResult";

/**
 * Modal component for searching and selecting visual references
 * 
 * @param {object} props
 * @param {function} props.addReference - Function to add a new reference
 * @param {function} props.setShowModal - Function to control modal visibility
 * @param {Array} props.additionalReferences - Array of currently added references
 */
function ReferenceVisualModal({
  addReference,
  setShowModal,
  additionalReferences,
}) {
  const [rawSearch, _setRawSearch] = useState("");
  const [search, setSearch] = useState("");

  function handleSearchChange(e) {
    const val = e.target.value;
    _setRawSearch(val);

    let processedSearch = val.toString();
    try {
      const url = new URL(processedSearch);
      const pathname = url.pathname;
      let parts = pathname.split("/");
      processedSearch = parts.pop();
    } catch (e) {
      // Not a URL, use as is
    }

    setSearch(processedSearch);
  }

  const { data, error } = useQuery(SEARCH_VISUALS, {
    variables: {
      visID: search,
      title: search,
    },
  });

  const visResults = data?.visuals.map((visInfo) => {
    const hasBeenAdded = additionalReferences.find(
      (object) => object?.id === visInfo?.id
    );
    return (
      <DisplayVisResult
        visInfo={visInfo}
        addReference={addReference}
        setShowModal={setShowModal}
        hasBeenAdded={hasBeenAdded}
        key={visInfo.id}
      />
    );
  });

  return (
    <div className="d-flex flex-column p-2">
      <input
        type="text"
        className="form-control bg-black ai-ref-input"
        placeholder="Search by name, id, or link"
        onChange={handleSearchChange}
        value={rawSearch}
        autoFocus
      />
      {visResults && (
        <div className="mt-2 max-height-40vh overflow-scroll black-scrollbar">
          {visResults}
        </div>
      )}
      {search && error && (
        <span className="mt-1">{`Error loading visuals: ${error}`}</span>
      )}
      {data?.visuals.length === 0 && (
        <span className="mt-1">No results found</span>
      )}
    </div>
  );
}

export default ReferenceVisualModal;