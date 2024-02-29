import { React } from "react";
import { Link } from "react-router-dom";
import p5logo from "../../assets/p5logo.png";
import { MY_VISUALS } from "../../queries/visuals";
import { useQuery, gql } from "@apollo/client";

export function ImageCard({ parameters, cover, description, title, visId }) {
  // Represents a single card with the visualizations in the main menu

  const paramList = parameters.map((property) => (
    <div
      className="col-auto vis-property me-1 mb-1 p-1 ps-2 pe-2"
      key={property.name}
    >
      {property.name}
    </div>
  ));

  if (paramList.length > 6) {
    paramList.length = 6;
    paramList.push(
      <div className="col-auto vis-property me-1 mb-1 p-1 ps-2 pe-2" key="more">
        ...
      </div>
    );
  }

  return (
    <Link
      to={visId}
      // onClick={() => dispatch({ type: "params/load", payload: visSource })}
      className="card grid-item rounded-0"
      key={visId}
    >
      {cover?.url && (
        <img
          className="card-img-top rounded-0 p-2"
          src={cover.url}
          alt={title}
        />
      )}
      <div className="card-body" key={visId}>
        <h5 className="card-title">{title}</h5>
        <p className="card-text">{description}</p>
        <h6>Parameters</h6>
        <div className="container row justify-content-start">{paramList}</div>
        <div className="d-flex justify-content-between">
          <div className="p5-card mt-3">
            <img src={p5logo} className="m-0 p-0" />
            <small className="m-2">P5.js</small>
            {/*visSource["engine"] === "P5" ? (
              <>
                <img src={p5logo} className="m-0 p-0" />
                <small className="m-2">P5.js</small>
              </>
            ) : (
              <small className="m-2">{visSource["engine"]}</small>
            )*/}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function VisualizationCards({
  currentFilter,
  currentSearch,
  currentUser,
}) {
  let whereValue = {};

  if (currentFilter === "all") {
    whereValue["published"] = { equals: true };
  }

  if (currentFilter === "my") {
    whereValue["author"] = { id: { equals: currentUser?.id } };
  }

  if (currentSearch) {
    whereValue["title"] = { contains: currentSearch };
  }

  const { loading, error, data } = useQuery(MY_VISUALS, {
    variables: {
      where: whereValue,
    },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  console.log(data.visuals);
  let customSources = data.visuals.map((visual) => (
    <ImageCard
      parameters={visual.parameters}
      cover={visual.cover}
      description={visual.description}
      title={visual.title}
      visId={visual.id}
    />
  ));

  return (
    <div key="visCards">
      <div className="custom-grid h-100 mt-3">{customSources}</div>
    </div>
  );
}
