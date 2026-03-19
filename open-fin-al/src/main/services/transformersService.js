function createTransformersService({ pipeline, env }) {
  env.allowLocalModels = false;
  env.localModelPath = '/models';

  let activeModelName = null;
  let activePipeline = null;

  async function getPipeline(model) {
    if (model !== activeModelName) {
      activeModelName = model;
      activePipeline = pipeline('text-generation', model);
    }

    return activePipeline;
  }

  async function runTextGeneration(model, prompt, params) {
    if (!model) {
      throw new Error('An model must be specified');
    }

    if (!prompt) {
      throw new Error('A prompt must be provided');
    }

    const runner = await getPipeline(model);
    return runner(prompt, params);
  }

  return {
    getPipeline,
    runTextGeneration,
  };
}

module.exports = {
  createTransformersService,
};
