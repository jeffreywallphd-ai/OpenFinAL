jest.mock('uuid', () => ({ v4: () => 'module-uuid' }));

import { LearningModule } from '../LearningModule';

describe('LearningModule', () => {
  it('requires learningModule payload', () => {
    expect(() => new LearningModule().fillWithRequest({ request: { request: {} } } as any)).toThrow(
      'Making a request about a learning module requires a learningModule property',
    );
  });

  it('fills all provided fields and defaults id', () => {
    const entity = new LearningModule();
    const payload = {
      key: 'k1',
      title: 'Basics',
      description: 'desc',
      keywords: 'finance',
      timeEstimate: 15,
      pages: [{ id: 'p1' }],
      quiz: { q: 1 },
      dateCreated: '2024-01-01',
    };

    entity.fillWithRequest({ request: { request: { learningModule: payload } } } as any);
    expect(entity.getId()).toBe('module-uuid');
    expect(entity.getFieldValue('title')).toBe('Basics');
    expect(entity.getFieldValue('quiz')).toEqual({ q: 1 });
  });

  it('uses provided id when present', () => {
    const entity = new LearningModule();
    entity.fillWithRequest({ request: { request: { learningModule: { id: 'provided-id' } } } } as any);
    expect(entity.getId()).toBe('provided-id');
  });
});
