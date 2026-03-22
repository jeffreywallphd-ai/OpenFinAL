import { Field } from '../Field';

describe('Field', () => {
  it('stores constructor values', () => {
    const field = new Field('name', 'string', 'initial');
    expect(field.name).toBe('name');
    expect(field.dataType).toBe('string');
    expect(field.value).toBe('initial');
  });

  it('updates value via setValue', () => {
    const field = new Field('price', 'float', 1);
    field.setValue(2.5);
    expect(field.value).toBe(2.5);
  });
});
