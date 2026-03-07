import * as Module from '../XMLResponse';
import { XMLResponse } from '../XMLResponse';

describe('XMLResponse', () => {
  it('exports module members', () => {
    expect(Object.keys(Module).length).toBeGreaterThan(0);
  });

  it('constructs XMLResponse from valid XML', () => {
    const instance = new XMLResponse('<root><item>ok</item></root>');
    expect(instance).toBeInstanceOf(XMLResponse);
    expect(instance.toString()).toContain('<root>');
  });

  it('throws for invalid XML payloads', () => {
    expect(() => new XMLResponse('<root>')).toThrow('Error parsing XML data');
  });
});
