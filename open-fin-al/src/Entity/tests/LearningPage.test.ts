jest.mock('uuid', () => ({ v4: () => 'page-uuid' }));

import { LearningPage } from '../LearningPage';

describe('LearningPage', () => {
  it('requires learningPage property in request', () => {
    expect(() => new LearningPage().fillWithRequest({ request: { request: {} } } as any)).toThrow(
      'Making a request about a learning module page requires a learningPage property',
    );
  });

  it('fills from nested learningModule.learningPage shape and preserves current moduleId behavior', () => {
    const entity = new LearningPage();
    const learningPage = { id: 'id1', moduleId: 'mod-1', keywords: 'kw', title: 't', pageContentUrl: '/p', voiceoverUrl: '/v' };
    entity.fillWithRequest({ request: { request: { learningPage: true, learningModule: { learningPage } } } } as any);
    expect(entity.getId()).toBe('id1');
    expect(entity.getFieldValue('moduleId')).toBe('kw');
    expect(entity.getFieldValue('title')).toBe('t');
  });

  it('defaults id to uuid when not provided', () => {
    const entity = new LearningPage();
    entity.fillWithRequest({ request: { request: { learningPage: true, learningModule: { learningPage: {} } } } } as any);
    expect(entity.getId()).toBe('page-uuid');
  });
});
