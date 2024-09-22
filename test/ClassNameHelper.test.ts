import ClassNameHelper from '../src/ClassNameHelper';

describe('ClassNameHelper', () => {
  test('should concatenate class names based on truthy values', () => {
    const result = ClassNameHelper.concat('class1', null, 'class2', undefined, false, 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  test('should return an empty string if all values are falsy', () => {
    const result = ClassNameHelper.concat(null, undefined, false);
    expect(result).toBe('');
  });

  test('should handle a single class name correctly', () => {
    const result = ClassNameHelper.concat('class1');
    expect(result).toBe('class1');
  });

  test('should handle an empty input', () => {
    const result = ClassNameHelper.concat();
    expect(result).toBe('');
  });
});