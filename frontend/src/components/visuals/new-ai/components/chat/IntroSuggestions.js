import { useState } from "react";
import { useQuery } from "@apollo/client";
import { MY_VISUALS } from "../../../../../queries/visuals";
import { DisplayVisResult } from "../references";
import { motion } from "motion/react";

function IntroSuggestions({ additionalReferences, setAdditionalReferences }) {
  const {
    data: allFeaturedVisuals,
    loading,
    error,
  } = useQuery(MY_VISUALS, {
    variables: {
      where: {
        privacy: { equals: "public" },
      },
    },
  });

  function addReference({ name, id, type, codeURL }) {
    setAdditionalReferences((prev) => {
      if (prev.find((obj) => id === obj.id)) return prev;
      return [...prev, { name, id, type, codeURL }];
    });
  }

  if (error) {
    return <div>Error loading featured visuals</div>;
  }

  if (loading) {
    return <div>Loading featured visuals...</div>;
  }

  console.log("Featured visuals", allFeaturedVisuals);

  const renderVisuals = allFeaturedVisuals?.visuals.map((visMeta) => {
    const hasBeenAdded = additionalReferences.find(
      (object) => object?.id === visMeta?.id
    );

    return (
      <motion.div
        className="col width-256px gx-2"
        layout="position"
        transition={{ duration: 0.15 }}
      >
        <DisplayVisResult
          visInfo={visMeta}
          addReference={addReference}
          hasBeenAdded={hasBeenAdded}
          showImage={true}
        />
      </motion.div>
    );
  });
  return (
    <div className="d-flex w-100 overflow-x-scroll black-scrollbar overscroll-x-none">
      <div className="row flex-nowrap ms-n1">{renderVisuals}</div>
    </div>
  );
}

export default IntroSuggestions;
