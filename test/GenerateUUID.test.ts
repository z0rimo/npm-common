import { GenerateUUID } from '../src/GenerateUUID';

describe('GenerateUUID', () => {
  test('should generate a valid UUID', () => {
    const uuid = GenerateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});