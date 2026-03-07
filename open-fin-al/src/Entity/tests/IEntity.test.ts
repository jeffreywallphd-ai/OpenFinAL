import { Field } from '../Field';
import { IEntity } from '../IEntity';

describe('IEntity contract', () => {
  it('supports a concrete object that satisfies the interface shape', () => {
    const fields = new Map<string, Field>([['id', new Field('id', 'integer', 10)]]);
    const entity: IEntity = {
      fields,
      getFields: () => fields,
      getFieldValue: (field: string) => fields.get(field)?.value,
      setFieldValue: (field: string, value: unknown) => fields.get(field)?.setValue(value),
      fillWithRequest: () => undefined,
      fillWithResponse: () => undefined,
      getId: () => fields.get('id')?.value,
    };

    entity.setFieldValue('id', 22);
    expect(entity.getFieldValue('id')).toBe(22);
    expect(entity.getId()).toBe(22);
  });
});
