import { convertSvgToAndroidVector } from '../src/SVG2XML/SVG2XML';
import * as fs from 'fs';
import * as path from 'path';
import { rmSync } from 'fs';

describe('SVG to Android Vector XML Converter', () => {
  const testDir = path.join(__dirname, 'test');
  const inputFile = path.join(testDir, 'test.svg');
  const outputFile = path.join(testDir, 'test.xml');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  test('should convert basic SVG path to Android Vector XML', () => {
    const basicSvg = `
            <svg width="100" height="100" viewBox="0 0 100 100">
                <path d="M10 10 H 90 V 90 H 10 L 10 10" fill="black"/>
            </svg>
        `;
    fs.writeFileSync(inputFile, basicSvg);
    convertSvgToAndroidVector(inputFile, outputFile);
    const result = fs.readFileSync(outputFile, 'utf8');
    expect(result).toContain('android:pathData="M10 10 H 90 V 90 H 10 L 10 10"');
    expect(result).toContain('android:fillColor="black"');
  });

  test('should handle SVG with gradient', () => {
    const gradientSvg = `
            <svg width="100" height="100" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:rgb(0,0,255);stop-opacity:1" />
                    </linearGradient>
                </defs>
                <path d="M10 10 H 90 V 90 H 10 L 10 10" fill="url(#grad1)"/>
            </svg>
        `;
    fs.writeFileSync(inputFile, gradientSvg);
    convertSvgToAndroidVector(inputFile, outputFile);
    const result = fs.readFileSync(outputFile, 'utf8');
    expect(result).toContain('<gradient');
    expect(result).toContain('android:type="linear"');
  });

  test('should handle SVG with circle', () => {
    const circleSvg = `
            <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red"/>
            </svg>
        `;
    fs.writeFileSync(inputFile, circleSvg);
    convertSvgToAndroidVector(inputFile, outputFile);
    const result = fs.readFileSync(outputFile, 'utf8');
    expect(result).toContain('android:pathData="M 10,50 A 40,40 0 1 0 90,50 A 40,40 0 1 0 10,50"');
    expect(result).toContain('android:fillColor="red"');
    expect(result).toContain('android:strokeColor="black"');
    expect(result).toContain('android:strokeWidth="3"');
  });

  test('should handle SVG with rectangle', () => {
    const rectSvg = `
            <svg width="100" height="100" viewBox="0 0 100 100">
                <rect x="10" y="10" width="80" height="80" fill="blue"/>
            </svg>
        `;
    fs.writeFileSync(inputFile, rectSvg);
    convertSvgToAndroidVector(inputFile, outputFile);
    const result = fs.readFileSync(outputFile, 'utf8');
    expect(result).toContain('android:pathData="M10 10 h80 v80 h-80 z"');
    expect(result).toContain('android:fillColor="blue"');
  });

  test('should handle SVG with line', () => {
    const lineSvg = `
            <svg width="100" height="100" viewBox="0 0 100 100">
                <line x1="10" y1="10" x2="90" y2="90" stroke="red" stroke-width="2"/>
            </svg>
        `;
    fs.writeFileSync(inputFile, lineSvg);
    convertSvgToAndroidVector(inputFile, outputFile);
    const result = fs.readFileSync(outputFile, 'utf8');
    expect(result).toContain('android:pathData="M10,10 L90,90"');
    expect(result).toContain('android:strokeColor="red"');
    expect(result).toContain('android:strokeWidth="2"');
  });
});