// A data source block declares its outputs as `{ node, stream?, channels }`: a
// graph node id, plus a stream name when that node emits more than one stream
// (a face landmarker emits both "blendshapes" and "head_pose"). Same helpers as
// MindHive's lib/yqOutputs.js, since both read the same blocks.

export function outputKey(output) {
  return output.stream ? `${output.node}/${output.stream}` : output.node;
}

export function channelKey(output, channelIndex) {
  return `${outputKey(output)}::${channelIndex}`;
}

// The declared output a packet belongs to. `nodeId` is its key in
// `pipeline.recordTargets()`; a packet carries its stream name in `metadata.name`.
export function findOutput(outputs, nodeId, packet) {
  return outputs.find(
    (output) =>
      output.node === nodeId &&
      (!output.stream || output.stream === packet.metadata?.name),
  );
}
