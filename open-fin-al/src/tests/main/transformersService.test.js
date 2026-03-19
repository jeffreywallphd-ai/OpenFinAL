/** @jest-environment node */

const { createTransformersService } = require('../../main/services/transformersService');

describe('createTransformersService', () => {
  it('configures transformers env and caches the pipeline per model', async () => {
    const firstRunner = jest.fn(async () => ['first']);
    const secondRunner = jest.fn(async () => ['second']);
    const pipeline = jest.fn()
      .mockResolvedValueOnce(firstRunner)
      .mockResolvedValueOnce(secondRunner);
    const env = {};

    const service = createTransformersService({ pipeline, env });

    await expect(service.runTextGeneration('model-a', 'prompt', { max_new_tokens: 5 })).resolves.toEqual(['first']);
    await expect(service.runTextGeneration('model-a', 'prompt 2')).resolves.toEqual(['first']);
    await expect(service.runTextGeneration('model-b', 'prompt 3')).resolves.toEqual(['second']);

    expect(env.allowLocalModels).toBe(false);
    expect(env.localModelPath).toBe('/models');
    expect(pipeline).toHaveBeenCalledTimes(2);
    expect(firstRunner).toHaveBeenCalledTimes(2);
    expect(secondRunner).toHaveBeenCalledTimes(1);
  });

  it('rejects missing model or prompt', async () => {
    const service = createTransformersService({
      pipeline: jest.fn(),
      env: {},
    });

    await expect(service.runTextGeneration(null, 'prompt')).rejects.toThrow('An model must be specified');
    await expect(service.runTextGeneration('model-a', '')).rejects.toThrow('A prompt must be provided');
  });
});
