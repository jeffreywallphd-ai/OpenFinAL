import { User } from '../User';

describe('User', () => {
  it('requires username', () => {
    expect(() => new User().fillWithRequest({ request: { request: { user: {} } } } as any)).toThrow(
      'A username must be provided to create a new user',
    );
  });

  it('fills all user fields', () => {
    const entity = new User();
    entity.fillWithRequest({ request: { request: { user: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', username: 'jdoe' } } } } as any);

    expect(entity.getFieldValue('firstName')).toBe('Jane');
    expect(entity.getFieldValue('lastName')).toBe('Doe');
    expect(entity.getFieldValue('email')).toBe('jane@example.com');
    expect(entity.getFieldValue('username')).toBe('jdoe');
  });
});
