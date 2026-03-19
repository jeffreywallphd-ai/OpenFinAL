const { createModelRuntimeService } = require('./modelRuntime/createModelRuntimeService');
const { createTransformersTextGenerationRuntime } = require('./modelRuntime/createTransformersTextGenerationRuntime');

function createTransformersService(options) {
  return createModelRuntimeService({
    textGenerationRuntime: createTransformersTextGenerationRuntime(options),
  });
}

module.exports = {
  createTransformersService,
};
