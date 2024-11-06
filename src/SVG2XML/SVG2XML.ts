import * as fs from 'fs';
import * as path from 'path';
import { parseString } from 'xml2js';
import { AnimationElement, CircleElement, GradientElement, gradientMap, GradientStop, LineElement, PathElement, RectElement, RGBColor, SvgAttributes } from './ISVG2XML';

/**
 * Converts a hex color code to an RGB color object.
 * Supports shorthand hex codes (e.g., "#f00" to "#ff0000").
 * 
 * @param hex - Hex color code (e.g., "#ff5733" or "#f53").
 * @returns RGB color object with `r`, `g`, and `b` properties or `null` if invalid.
 */
function hexToRgb(hex: string): RGBColor | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Converts an optional color string to a valid color format.
 * @param color - Optional color string from SVG element.
 * @returns Hex color string (e.g., '#000000' if color is undefined).
 */
function convertColor(color: string | undefined): string {
  if (!color) return '#000000';
  if (color.startsWith('#') || color.startsWith('rgb') ||
    ['black', 'red', 'blue', 'green'].includes(color)) {
    return color;
  }
  return '#000000';
}

/**
 * Converts a color code to an 8-digit hex format with opacity applied.
 * The function accepts hex codes or rgb format and returns a hex color with alpha.
 * 
 * @param color - The color code in hex or rgb format.
 * @param opacity - The opacity value as a string (from "0" to "1").
 * @returns Hex color code with applied opacity (e.g., "#80ff5733" for 50% opacity) or original color if format is unrecognized.
 */
function convertColorWithOpacity(color: string, opacity: string): string {
  const alpha = Math.round(parseFloat(opacity) * 255).toString(16).padStart(2, '0');
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (rgb) {
      return `#${alpha}${color.slice(1)}`;
    }
  }

  const rgbMatch = color.match(/rgb$(\d+),\s*(\d+),\s*(\d+)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${alpha}${r}${g}${b}`;
  }

  return color;
}

/**
 * Converts an SVG Path element to Android Vector format.
 * @param path - Path element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<path>` element.
 */
function convertPath(path: PathElement): string {
  const strokeWidth = path.$['stroke-width'];
  const fill = path.$.fill;
  let fillColor = '';

  if (fill && fill.startsWith('url(#')) {
    const gradientId = fill.slice(5, -1); // url(#id) 에서 id 추출
    const gradient = gradientMap.get(gradientId);
    if (gradient) {
      return `    <path
        android:pathData="${path.$.d}">
        ${convertGradient(gradient)}
    </path>`;
    }
  }

  return `    <path
        android:pathData="${path.$.d}"
        android:fillColor="${convertColor(fill)}"${path.$.stroke ? `
        android:strokeColor="${convertColor(path.$.stroke)}"` : ''}${strokeWidth ? `
        android:strokeWidth="${strokeWidth}"` : ''} />`;
}

/**
 * Converts an SVG Gradient element (linear or radial) to Android Vector format.
 * @param gradient - Gradient element from parsed SVG.
 * @returns Formatted string for Android Vector XML gradient attributes.
 */
function convertGradient(gradient: GradientElement): string {
  if (gradient.$.type === 'linear' || gradient.$.type === 'linearGradient') {
    return `        <aapt:attr name="android:fillColor">
            <gradient
                android:type="linear"
                android:startX="${gradient.$.x1 || '0%'}"
                android:startY="${gradient.$.y1 || '0%'}"
                android:endX="${gradient.$.x2 || '100%'}"
                android:endY="${gradient.$.y2 || '0%'}">
                ${gradient.stop.map((stop: GradientStop) => {
                    const color = stop.$['stop-color'];
                    const opacity = stop.$['stop-opacity'];
                    const colorWithOpacity = opacity ? convertColorWithOpacity(color, opacity) : color;
                    return `                <item
                    android:offset="${stop.$.offset}"
                    android:color="${colorWithOpacity}" />`;
                }).join('\n')}
            </gradient>
        </aapt:attr>`;
  }
  return '';
}

/**
 * Converts SVG animation attributes to Android-compatible objectAnimator attributes.
 * @param animation - Animation element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<objectAnimator>` element.
 */
function convertAnimation(animation: AnimationElement): string {
  const propertyName = getPropertyName(animation.$.attributeName);
  return `    <objectAnimator
      android:propertyName="${propertyName}"
      android:duration="${animation.$.dur || '1000'}"
      android:valueFrom="${animation.$.from || '0'}"
      android:valueTo="${animation.$.to || '1'}"
      android:valueType="floatType"
      android:repeatCount="${animation.$.repeatCount || 'infinite'}" />\n`;
}

/**
 * Maps SVG attribute names to Android property names.
 * @param svgAttribute - Attribute name from SVG (e.g., 'opacity').
 * @returns Mapped property name (e.g., 'alpha').
 */
function getPropertyName(svgAttribute: string): string {
  const propertyMap: { [key: string]: string } = {
    'opacity': 'alpha',
    'transform': 'rotation',
    'cx': 'x',
    'cy': 'y',
    'r': 'radius'
  };
  return propertyMap[svgAttribute] || svgAttribute;
}

/**
 * Converts an SVG Rect element to Android Vector format.
 * @param rect - Rect element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<path>` element representing a rectangle.
 */
function convertRect(rect: RectElement): string {
  const x = rect.$.x || '0';
  const y = rect.$.y || '0';
  const strokeWidth = rect.$ && rect.$['stroke-width'] ? rect.$['stroke-width'] : null;
  const stroke = rect.$ && rect.$.stroke ? rect.$.stroke : null;

  const rectPath = `M${x} ${y} h${rect.$.width} v${rect.$.height} h-${rect.$.width} z`;
  return `    <path
        android:pathData="${rectPath}"
        android:fillColor="${convertColor(rect.$.fill)}"${stroke ? `
        android:strokeColor="${stroke}"` : ''}${strokeWidth ? `
        android:strokeWidth="${strokeWidth}"` : ''} />\n`;
}

/**
 * Converts an SVG Circle element to Android Vector format.
 * @param circle - Circle element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<path>` element representing a circle.
 */
function convertCircle(circle: CircleElement): string {
  const cx = parseFloat(circle.$.cx);
  const cy = parseFloat(circle.$.cy);
  const r = parseFloat(circle.$.r);
  const strokeWidth = circle.$ && circle.$['stroke-width'] ? circle.$['stroke-width'] : null;
  const stroke = circle.$ && circle.$.stroke ? circle.$.stroke : null;

  const circlePath = `M ${cx - r},${cy} A ${r},${r} 0 1 0 ${cx + r},${cy} A ${r},${r} 0 1 0 ${cx - r},${cy}`;

  return `    <path
      android:pathData="${circlePath}"
      android:fillColor="${convertColor(circle.$.fill)}"${stroke ? `
      android:strokeColor="${stroke}"` : ''}${strokeWidth ? `
      android:strokeWidth="${strokeWidth}"` : ''} />\n`;
}

/**
 * Converts an SVG Line element to Android Vector format.
 * @param line - Line element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<path>` element representing a line.
 */
function convertLine(line: LineElement): string {
  const strokeWidth = line.$ && line.$['stroke-width'] ? line.$['stroke-width'] : '1';
  const linePath = `M${line.$.x1},${line.$.y1} L${line.$.x2},${line.$.y2}`;
  return `    <path
      android:pathData="${linePath}"
      android:strokeColor="${convertColor(line.$.stroke)}"
      android:strokeWidth="${strokeWidth}" />\n`;
}

/**
 * Converts an SVG file to an Android Vector XML format.
 * @param inputFile - Path to the SVG file to convert.
 * @param outputFile - Path to save the output Android Vector XML file.
 */
function convertSvgToAndroidVector(inputFile: string, outputFile: string) {
  gradientMap.clear();
  const svgContent = fs.readFileSync(inputFile, 'utf8');

  parseString(svgContent, (err, result) => {
    if (err) {
      console.error('Error parsing SVG:', err);
      return;
    }

    const svgAttributes: SvgAttributes = result.svg.$;
    const viewBox = svgAttributes.viewBox?.split(' ').map(Number) || [0, 0, 100, 100];
    const width = svgAttributes.width?.replace('px', '') || '100';
    const height = svgAttributes.height?.replace('px', '') || '100';

    let vectorXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:aapt="http://schemas.android.com/aapt"
    android:width="${width}dp"
    android:height="${height}dp"
    android:viewportWidth="${viewBox[2]}"
    android:viewportHeight="${viewBox[3]}">\n`;

    // Process gradients, animations, and various SVG elements
    if (result.svg.defs && result.svg.defs[0]) {
      const defs = result.svg.defs[0];
      if (defs.linearGradient) {
        defs.linearGradient.forEach((gradient: GradientElement) => {
          gradient.$.type = 'linear';
          gradientMap.set(gradient.$.id, gradient);
        });
      }
    }

    if (result.svg.animate || result.svg.animateTransform) {
      vectorXml += '    <group>\n';
      if (result.svg.animate) {
        result.svg.animate.forEach((animation: AnimationElement) => {
          vectorXml += convertAnimation(animation);
        });
      }
      if (result.svg.animateTransform) {
        result.svg.animateTransform.forEach((animation: AnimationElement) => {
          vectorXml += convertAnimation(animation);
        });
      }
      vectorXml += '    </group>\n';
    }

    if (result.svg.path) {
      result.svg.path.forEach((path: PathElement, index: number) => {
        vectorXml += convertPath(path);
        if (index < result.svg.path.length - 1 ||
          result.svg.rect || result.svg.circle || result.svg.line) {
          vectorXml += '\n';
        }
      });
    }

    if (result.svg.rect) {
      result.svg.rect.forEach((rect: RectElement, index: number) => {
        vectorXml += convertRect(rect);
        if (index < result.svg.rect.length - 1 ||
          result.svg.circle || result.svg.line) {
          vectorXml += '\n';
        }
      });
    }

    if (result.svg.circle) {
      result.svg.circle.forEach((circle: CircleElement, index: number) => {
        vectorXml += convertCircle(circle);
        if (index < result.svg.circle.length - 1 || result.svg.line) {
          vectorXml += '\n';
        }
      });
    }

    if (result.svg.line) {
      result.svg.line.forEach((line: LineElement, index: number) => {
        vectorXml += convertLine(line);
        if (index < result.svg.line.length - 1) {
          vectorXml += '\n';
        }
      });
    }

    vectorXml += '</vector>';

    fs.writeFileSync(outputFile, vectorXml);
    console.log('Conversion completed successfully!');
  });
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.log('Usage: tsx SVG2XML.ts <input.svg>');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = path.join(
    path.dirname(inputFile),
    path.basename(inputFile, '.svg') + '.xml'
  );

  convertSvgToAndroidVector(inputFile, outputFile);
}

export { convertSvgToAndroidVector };