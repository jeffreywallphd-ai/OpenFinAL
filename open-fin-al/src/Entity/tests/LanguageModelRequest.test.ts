import { LanguageModelRequest } from '../LanguageModelRequest';

describe('LanguageModelRequest', () => {
  it('requires model property', () => {
    expect(() => new LanguageModelRequest().fillWithRequest({ request: { request: {} } } as any)).toThrow(
      'Making a request for a language model requires a model property',
    );
  });

  it('fills model name and messages', () => {
    const entity = new LanguageModelRequest();
    entity.fillWithRequest({ request: { request: { model: { name: 'gpt', messages: [{ role: 'user', content: 'hi' }] } } } } as any);
    expect(entity.getFieldValue('model')).toBe('gpt');
    expect(entity.getFieldValue('messages')).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('exposes current behavior for missing role/content and unimplemented methods', () => {
    const entity = new LanguageModelRequest();
    expect(() => entity.getRole()).toThrow();
    expect(() => entity.getContent()).toThrow();
    expect(() => entity.getId()).toThrow('Method not implemented.');
    expect(() => entity.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
