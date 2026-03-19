/**
 * @typedef {Object} TextGenerationRuntime
 * @property {(request: { model: string, prompt: string, params?: Record<string, unknown> }) => Promise<unknown>} generateText
 */

/**
 * @typedef {Object} IModelRuntimeService
 * @property {(model: string, prompt: string, params?: Record<string, unknown>) => Promise<unknown>} runTextGeneration
 */

function assertTextGenerationRuntime(runtime) {
  if (!runtime || typeof runtime.generateText !== 'function') {
    throw new TypeError('textGenerationRuntime must provide a generateText(request) function');
  }

  return runtime;
}

module.exports = {
  assertTextGenerationRuntime,
};
