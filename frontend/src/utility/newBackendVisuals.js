export function isNewBackendVisual(visual) {
  const parameters = visual?.parameters;
  return (
    parameters !== null &&
    typeof parameters === "object" &&
    !Array.isArray(parameters)
  );
}

export function withoutNewBackendVisuals(visuals) {
  return visuals?.filter((visual) => !isNewBackendVisual(visual));
}
