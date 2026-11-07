import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { VISUAL_CARDS } from "../../../../../queries/visuals";
import { DisplayVisResult } from "../references";
import { motion } from "motion/react";
import { withoutNewBackendVisuals } from "../../../../../utility/newBackendVisuals";



function IntroSuggestions({ additionalReferences, addReference, removeReference }) {
  const {
    data: allFeaturedVisuals,
    dataState,
    error,
  } = useQuery(VISUAL_CARDS, {
    variables: {
      where: {
        privacy: { equals: "public" },
      },
    },
  });


  if (error) {
    return <div>Error loading featured visuals</div>;
  }

  if (dataState === "empty") {
    return <div>Loading featured visuals...</div>;
  }

  const renderVisuals = withoutNewBackendVisuals(allFeaturedVisuals?.visuals)?.map((visMeta) => {
    const hasBeenAdded = additionalReferences.find(
      (object) => object?.id === visMeta?.id
    );

    return (
      <motion.div
        className="col width-256px gx-2"
        layout="position"
        transition={{ duration: 0.15 }}
        key={visMeta?.id}
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
    <div className="d-flex w-100 overflow-x-scroll black-scrollbar overscroll-x-none" >
      <div className="row flex-nowrap ms-n1">{renderVisuals}</div>
    </div>
  );
}

export default IntroSuggestions;
