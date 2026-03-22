import { ConfigurationSection } from '../ConfigurationSection';
import { Configuration } from '../Configuration';

describe('ConfigurationSection', () => {
  const createRequestModel = (request: any) => ({ request } as any);

  it('initializes all expected fields with default values', () => {
    const section = new ConfigurationSection();

    expect(section.getFields().size).toBe(3);
    expect(section.toObject()).toEqual({
      id: null,
      label: null,
      configurations: [],
    });
  });

  it('sets and gets known field values', () => {
    const section = new ConfigurationSection();
    const config = new Configuration();

    section.setFieldValue('id', 101);
    section.setFieldValue('label', 'General');
    section.setFieldValue('configurations', [config]);

    expect(section.getId()).toBe(101);
    expect(section.getFieldValue('label')).toBe('General');
    expect(section.getFieldValue('configurations')).toEqual([config]);
  });

  it('throws when setting an unknown field', () => {
    const section = new ConfigurationSection();

    expect(() => section.setFieldValue('missing', 'value')).toThrow(
      'The requested data property does not exist.',
    );
  });

  it('throws when getting an unknown field', () => {
    const section = new ConfigurationSection();

    expect(() => section.getFieldValue('unknown')).toThrow(TypeError);
  });

  it('throws when fillWithRequest is missing top-level label', () => {
    const section = new ConfigurationSection();

    expect(() =>
      section.fillWithRequest(
        createRequestModel({
          request: {
            section: {
              label: 'Nested Label',
              configurations: [],
            },
          },
        }),
      ),
    ).toThrow('A configuration section must have a label');
  });

  it('fills fields from nested request.section values', () => {
    const section = new ConfigurationSection();
    const config = new Configuration();
    config.setFieldValue('id', 20);
    config.setFieldValue('name', 'Theme Config');

    section.fillWithRequest(
      createRequestModel({
        request: {
          label: 'top-level-label',
          section: {
            label: 'Appearance',
            configurations: [config],
          },
        },
      }),
    );

    expect(section.getFieldValue('label')).toBe('Appearance');
    expect(section.getFieldValue('configurations')).toEqual([config]);
  });

  it('toObject serializes nested configurations using each configuration\'s toObject', () => {
    const section = new ConfigurationSection();

    const configOne = new Configuration();
    configOne.setFieldValue('id', 1);
    configOne.setFieldValue('name', 'First');

    const configTwo = new Configuration();
    configTwo.setFieldValue('id', 2);
    configTwo.setFieldValue('name', 'Second');

    section.setFieldValue('id', 500);
    section.setFieldValue('label', 'Section A');
    section.setFieldValue('configurations', [configOne, configTwo]);

    expect(section.toObject()).toEqual({
      id: 500,
      label: 'Section A',
      configurations: [configOne.toObject(), configTwo.toObject()],
    });
  });

  it('throws for unimplemented fillWithResponse', () => {
    const section = new ConfigurationSection();

    expect(() => section.fillWithResponse({} as any)).toThrow('Method not implemented.');
  });
});
