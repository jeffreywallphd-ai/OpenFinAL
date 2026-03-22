import { Configuration } from '../Configuration';
import { ConfigurationOption } from '../ConfigurationOption';

describe('Configuration', () => {
  const createRequestModel = (request: any) => ({ request } as any);

  it('initializes all expected fields with default values', () => {
    const configuration = new Configuration();

    expect(configuration.getFields().size).toBe(5);
    expect(configuration.toObject()).toEqual({
      id: null,
      name: null,
      purpose: null,
      type: null,
      options: [],
    });
  });

  it('sets and gets known field values', () => {
    const configuration = new Configuration();
    const option = new ConfigurationOption();

    configuration.setFieldValue('id', 3);
    configuration.setFieldValue('name', 'Display Preferences');
    configuration.setFieldValue('purpose', 'UI customization');
    configuration.setFieldValue('type', 'selection');
    configuration.setFieldValue('options', [option]);

    expect(configuration.getId()).toBe(3);
    expect(configuration.getFieldValue('name')).toBe('Display Preferences');
    expect(configuration.getFieldValue('purpose')).toBe('UI customization');
    expect(configuration.getFieldValue('type')).toBe('selection');
    expect(configuration.getFieldValue('options')).toEqual([option]);
  });

  it('throws when setting an unknown field', () => {
    const configuration = new Configuration();

    expect(() => configuration.setFieldValue('unknown', 'x')).toThrow(
      'The requested data property does not exist.',
    );
  });

  it('throws when getting an unknown field', () => {
    const configuration = new Configuration();

    expect(() => configuration.getFieldValue('missing')).toThrow(TypeError);
  });

  it('throws when fillWithRequest is missing top-level name', () => {
    const configuration = new Configuration();

    expect(() =>
      configuration.fillWithRequest(
        createRequestModel({
          request: {
            configuration: { type: 'toggle', options: [] },
          },
        }),
      ),
    ).toThrow('A configuration must have a name');
  });

  it('throws when fillWithRequest is missing top-level type', () => {
    const configuration = new Configuration();

    expect(() =>
      configuration.fillWithRequest(
        createRequestModel({
          request: {
            name: 'Notifications',
            configuration: { name: 'Notifications', options: [] },
          },
        }),
      ),
    ).toThrow('A configuration must have a type');
  });

  it('throws when fillWithRequest is missing top-level options', () => {
    const configuration = new Configuration();

    expect(() =>
      configuration.fillWithRequest(
        createRequestModel({
          request: {
            name: 'Notifications',
            type: 'toggle',
            configuration: { name: 'Notifications', type: 'toggle' },
          },
        }),
      ),
    ).toThrow('A configuration must have at least one configuration option. None were provided.');
  });

  it('fills fields from nested request.configuration values', () => {
    const configuration = new Configuration();
    const first = new ConfigurationOption();
    first.setFieldValue('id', 1);
    first.setFieldValue('name', 'news');
    const second = new ConfigurationOption();
    second.setFieldValue('id', 2);
    second.setFieldValue('name', 'alerts');

    configuration.fillWithRequest(
      createRequestModel({
        request: {
          name: 'top-level-name',
          type: 'top-level-type',
          options: ['top-level-options-marker'],
          configuration: {
            name: 'Notification Settings',
            purpose: 'Control notifications',
            type: 'multi-select',
            options: [first, second],
          },
        },
      }),
    );

    expect(configuration.getFieldValue('name')).toBe('Notification Settings');
    expect(configuration.getFieldValue('purpose')).toBe('Control notifications');
    expect(configuration.getFieldValue('type')).toBe('multi-select');
    expect(configuration.getFieldValue('options')).toEqual([first, second]);
  });

  it('toObject serializes nested options using each option\'s toObject', () => {
    const configuration = new Configuration();

    const optionOne = new ConfigurationOption();
    optionOne.setFieldValue('id', 9);
    optionOne.setFieldValue('name', 'Option 1');

    const optionTwo = new ConfigurationOption();
    optionTwo.setFieldValue('id', 10);
    optionTwo.setFieldValue('name', 'Option 2');

    configuration.setFieldValue('id', 99);
    configuration.setFieldValue('name', 'Serialized Config');
    configuration.setFieldValue('purpose', 'Serialization test');
    configuration.setFieldValue('type', 'list');
    configuration.setFieldValue('options', [optionOne, optionTwo]);

    expect(configuration.toObject()).toEqual({
      id: 99,
      name: 'Serialized Config',
      purpose: 'Serialization test',
      type: 'list',
      options: [optionOne.toObject(), optionTwo.toObject()],
    });
  });

  it('throws for unimplemented fillWithResponse', () => {
    const configuration = new Configuration();

    expect(() => configuration.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
