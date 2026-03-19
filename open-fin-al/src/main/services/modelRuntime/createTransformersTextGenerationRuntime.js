function createTransformersTextGenerationRuntime({
  transformers = require('@xenova/transformers'),
  task = 'text-generation',
  allowLocalModels = false,
  localModelPath = '/models',
} = {}) {
  const { pipeline, env } = transformers;

  env.allowLocalModels = allowLocalModels;
  env.localModelPath = localModelPath;

  const pipelineCache = new Map();

  function getPipeline(model) {
    if (!model) {
      throw new Error('A model must be specified');
    }

    if (!pipelineCache.has(model)) {
      pipelineCache.set(model, Promise.resolve(pipeline(task, model)));
    }

    return pipelineCache.get(model);
  }

  async function generateText({ model, prompt, params }) {
    if (!prompt) {
      throw new Error('A prompt must be provided');
    }

    const runner = await getPipeline(model);
    return runner(prompt, params);
  }

  return {
    getPipeline,
    generateText,
  };
}

module.exports = {
  createTransformersTextGenerationRuntime,
};
