/** @jest-environment node */

const { createTransformersService } = require('../../main/services/transformersService');

describe('createTransformersService', () => {
  it('builds a model runtime service backed by the transformers runtime', async () => {
    const runner = jest.fn(async () => ['generated']);
    const pipeline = jest.fn(async () => runner);
    const env = {};

    const service = createTransformersService({
      transformers: {
        pipeline,
        env,
      },
    });

    await expect(service.runTextGeneration('model-a', 'prompt', { max_new_tokens: 5 })).resolves.toEqual(['generated']);

    expect(env.allowLocalModels).toBe(false);
    expect(env.localModelPath).toBe('/models');
    expect(pipeline).toHaveBeenCalledWith('text-generation', 'model-a');
    expect(runner).toHaveBeenCalledWith('prompt', { max_new_tokens: 5 });
  });
});
