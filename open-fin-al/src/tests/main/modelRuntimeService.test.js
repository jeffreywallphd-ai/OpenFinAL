/** @jest-environment node */

const { createModelRuntimeService } = require('../../main/services/modelRuntime/createModelRuntimeService');
const { createTransformersTextGenerationRuntime } = require('../../main/services/modelRuntime/createTransformersTextGenerationRuntime');

describe('createModelRuntimeService', () => {
  it('delegates text generation through the configured runtime boundary', async () => {
    const generateText = jest.fn(async ({ model, prompt, params }) => ({ model, prompt, params, ok: true }));
    const service = createModelRuntimeService({
      textGenerationRuntime: { generateText },
    });

    await expect(service.runTextGeneration('model-a', 'prompt', { temperature: 0.2 })).resolves.toEqual({
      model: 'model-a',
      prompt: 'prompt',
      params: { temperature: 0.2 },
      ok: true,
    });

    expect(generateText).toHaveBeenCalledWith({
      model: 'model-a',
      prompt: 'prompt',
      params: { temperature: 0.2 },
    });
  });

  it('rejects runtimes that do not implement the text generation contract', () => {
    expect(() => createModelRuntimeService({ textGenerationRuntime: {} })).toThrow(
      'textGenerationRuntime must provide a generateText(request) function',
    );
  });
});

describe('createTransformersTextGenerationRuntime', () => {
  it('configures transformers env and reuses a cached pipeline for repeated calls to the same model', async () => {
    const runner = jest.fn(async () => ['first']);
    const pipeline = jest.fn(async () => runner);
    const env = {};

    const runtime = createTransformersTextGenerationRuntime({
      transformers: { pipeline, env },
    });

    await expect(runtime.generateText({ model: 'model-a', prompt: 'prompt 1' })).resolves.toEqual(['first']);
    await expect(runtime.generateText({ model: 'model-a', prompt: 'prompt 2', params: { top_k: 2 } })).resolves.toEqual(['first']);

    expect(env.allowLocalModels).toBe(false);
    expect(env.localModelPath).toBe('/models');
    expect(pipeline).toHaveBeenCalledTimes(1);
    expect(pipeline).toHaveBeenCalledWith('text-generation', 'model-a');
    expect(runner).toHaveBeenNthCalledWith(1, 'prompt 1', undefined);
    expect(runner).toHaveBeenNthCalledWith(2, 'prompt 2', { top_k: 2 });
  });

  it('keeps one in-flight pipeline initialization per model and caches separate models independently', async () => {
    let resolvePipeline;
    const runner = jest.fn(async () => ['model-a']);
    const secondRunner = jest.fn(async () => ['model-b']);
    const firstPipelinePromise = new Promise((resolve) => {
      resolvePipeline = () => resolve(runner);
    });
    const pipeline = jest.fn()
      .mockImplementationOnce(() => firstPipelinePromise)
      .mockImplementationOnce(async () => secondRunner);

    const runtime = createTransformersTextGenerationRuntime({
      transformers: { pipeline, env: {} },
    });

    const firstLoad = runtime.getPipeline('model-a');
    const secondLoad = runtime.getPipeline('model-a');
    expect(firstLoad).toBe(secondLoad);
    expect(pipeline).toHaveBeenCalledTimes(1);

    resolvePipeline();
    await expect(firstLoad).resolves.toBe(runner);
    await expect(runtime.generateText({ model: 'model-a', prompt: 'reuse cached runner' })).resolves.toEqual(['model-a']);
    await expect(runtime.generateText({ model: 'model-b', prompt: 'new model' })).resolves.toEqual(['model-b']);

    expect(pipeline).toHaveBeenCalledTimes(2);
    expect(pipeline).toHaveBeenNthCalledWith(1, 'text-generation', 'model-a');
    expect(pipeline).toHaveBeenNthCalledWith(2, 'text-generation', 'model-b');
  });

  it('rejects invalid requests', async () => {
    const runtime = createTransformersTextGenerationRuntime({
      transformers: { pipeline: jest.fn(), env: {} },
    });

    expect(() => runtime.getPipeline()).toThrow('A model must be specified');
    await expect(runtime.generateText({ model: 'model-a', prompt: '' })).rejects.toThrow('A prompt must be provided');
  });
});
