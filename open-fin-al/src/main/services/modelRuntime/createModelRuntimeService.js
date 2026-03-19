const { assertTextGenerationRuntime } = require('./IModelRuntimeService');

function createModelRuntimeService({ textGenerationRuntime }) {
  const runtime = assertTextGenerationRuntime(textGenerationRuntime);

  async function runTextGeneration(model, prompt, params) {
    return runtime.generateText({ model, prompt, params });
  }

  return {
    runTextGeneration,
  };
}

module.exports = {
  createModelRuntimeService,
};
