import { ConfigurationOption } from '../ConfigurationOption';

describe('ConfigurationOption', () => {
  it('initializes all expected fields with default values', () => {
    const option = new ConfigurationOption();

    expect(option.getFields().size).toBe(12);
    expect(option.toObject()).toEqual({
      id: null,
      setting: null,
      name: null,
      label: null,
      hasValue: true,
      valueName: null,
      valueType: null,
      valueSite: null,
      value: null,
      isActive: false,
      valueIsKey: false,
      isLocked: false,
    });
  });

  it('sets and gets known field values', () => {
    const option = new ConfigurationOption();

    option.setFieldValue('id', 11);
    option.setFieldValue('setting', 'market_data');
    option.setFieldValue('name', 'refreshRate');
    option.setFieldValue('label', { text: 'Refresh Rate' });
    option.setFieldValue('hasValue', false);
    option.setFieldValue('valueName', 'interval');
    option.setFieldValue('valueType', 'number');
    option.setFieldValue('valueSite', 'client');
    option.setFieldValue('value', '5');
    option.setFieldValue('isActive', true);
    option.setFieldValue('valueIsKey', true);
    option.setFieldValue('isLocked', true);

    expect(option.getId()).toBe(11);
    expect(option.getFieldValue('setting')).toBe('market_data');
    expect(option.getFieldValue('name')).toBe('refreshRate');
    expect(option.getFieldValue('label')).toEqual({ text: 'Refresh Rate' });
    expect(option.getFieldValue('hasValue')).toBe(false);
    expect(option.getFieldValue('valueName')).toBe('interval');
    expect(option.getFieldValue('valueType')).toBe('number');
    expect(option.getFieldValue('valueSite')).toBe('client');
    expect(option.getFieldValue('value')).toBe('5');
    expect(option.getFieldValue('isActive')).toBe(true);
    expect(option.getFieldValue('valueIsKey')).toBe(true);
    expect(option.getFieldValue('isLocked')).toBe(true);
  });

  it('throws when setting an unknown field', () => {
    const option = new ConfigurationOption();

    expect(() => option.setFieldValue('unknown', 123)).toThrow(
      'The requested data property does not exist.',
    );
  });

  it('throws when getting an unknown field', () => {
    const option = new ConfigurationOption();

    expect(() => option.getFieldValue('unknown')).toThrow(TypeError);
  });

  it('converts current field state into a plain object', () => {
    const option = new ConfigurationOption();
    option.setFieldValue('id', 1);
    option.setFieldValue('setting', 'theme');
    option.setFieldValue('name', 'color_mode');
    option.setFieldValue('value', 'dark');

    expect(option.toObject()).toEqual({
      id: 1,
      setting: 'theme',
      name: 'color_mode',
      label: null,
      hasValue: true,
      valueName: null,
      valueType: null,
      valueSite: null,
      value: 'dark',
      isActive: false,
      valueIsKey: false,
      isLocked: false,
    });
  });

  it('throws for unimplemented request/response fillers', () => {
    const option = new ConfigurationOption();

    expect(() => option.fillWithRequest({} as any)).toThrow('Method not implemented.');
    expect(() => option.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
