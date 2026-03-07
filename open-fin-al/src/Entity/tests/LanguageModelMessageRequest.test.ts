import { LanguageModelRequest } from '../LanguageModelMessageRequest';

describe('LanguageModelMessageRequest entity class', () => {
  it('sets and gets role/content', () => {
    const entity = new LanguageModelRequest();
    entity.setFieldValue('role', 'user');
    entity.setFieldValue('content', 'hello');
    expect(entity.getRole()).toBe('user');
    expect(entity.getContent()).toBe('hello');
  });

  it('throws for unimplemented methods and unknown field', () => {
    const entity = new LanguageModelRequest();
    expect(() => entity.getId()).toThrow('Method not implemented.');
    expect(() => entity.fillWithRequest({} as any)).toThrow('Method not implemented.');
    expect(() => entity.fillWithResponse({} as any)).toThrow('Method not implemented.');
    expect(() => entity.setFieldValue('other', 'x')).toThrow('The requested data property does not exist.');
  });
});
