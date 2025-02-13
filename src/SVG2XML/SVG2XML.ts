/**
 * SVG2XML for zorimo/common
 * 
 * This module converts SVG files to Android Vector Drawable XML format.
 * It is part of the zorimo/common package and integrates with other zorimo utilities.
 * 
 * @module zorimo/common/svg2xml
 */

import * as fs from 'fs';
import * as path from 'path';
import { parseString } from 'xml2js';
import {
  AnimationElement, CircleElement, FilterElement,
  GradientElement, gradientMap, GradientStop,
  GroupElement, LineElement, PathElement,
  RectElement, RGBColor, SvgAttributes, TransformResult
} from './ISVG2XML';

// Global variables.
let filters: { [key: string]: FilterElement } = {};

// Utility functions.
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
 * Converts an optional color string to a valid color format.
 * @param color - Optional color string from SVG element.
 * @returns Hex color string (e.g., '#000000' if color is undefined).
 */
function convertColor(color: string | undefined): string {
  if (!color) return '#FF373737'; // default color
  if (color === 'none') return '@android:color/transparent';
  if (color === '#373737') return '#FF373737';
  if (color === 'white') return '#FFFFFFFF';

  const colorMap: { [key: string]: string } = {
    'white': '#FFFFFFFF',
    'black': '#FF000000',
    'red': '#FFFF0000',
    'blue': '#FF0000FF',
    'green': '#FF00FF00'
  };

  if (colorMap[color]) {
    return colorMap[color];
  }

  if (color.startsWith('#')) {
    return color.length === 7 ? `#FF${color.slice(1)}` : color;
  }

  return '#FF373737';
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
 * Parses an SVG transform string to extract rotation and translation values.
 * Supports parsing rotation and translation values for Android Vector transformations.
 * 
 * @param transform - Transform attribute string from SVG.
 * @returns Object with rotation, translationX, and translationY values.
 */
function processTransform(transform: string): TransformResult {
  const result: TransformResult = {
    rotation: 0,
    pivotX: undefined,
    pivotY: undefined
  };

  if (!transform) return result;

  const rotateMatch = transform.match(/rotate\(([-\d.]+)(?:[\s,]+([-\d.]+)[\s,]+([-\d.]+))?\)/);
  console.log('Transform:', transform);
  console.log('Match:', rotateMatch);

  if (rotateMatch) {
    result.rotation = parseFloat(rotateMatch[1]);
    if (rotateMatch[2] && rotateMatch[3]) {
      result.pivotX = parseFloat(rotateMatch[2]);
      result.pivotY = parseFloat(rotateMatch[3]);
    }
  }

  return result;
}

/**
 * Returns the transformed shadow effect for a given filter ID.
 * @param filterId - The ID of the filter to apply.
 * @returns Transformed Android Vector properties (translateX, translateY).
 */
function applyFilter(filterId: string): string {
  if (!filters[filterId]) return '';
  const filterEffect = convertFilter(filters[filterId]);
  return `
      android:translateX="${filterEffect.dx}"
      android:translateY="${filterEffect.dy}"`;
}

/**
 * Applies a drop shadow effect by duplicating the given SVG element as a shadow layer.
 * The shadow element is placed behind the original element with adjusted color and position.
 * @param originalXml - The original XML representation of the SVG element.
 * @param filterId - The filter ID to retrieve shadow effect parameters.
 * @param element - The parsed SVG element object.
 * @param tagType - The type of SVG element (path, circle, rect, line).
 * @returns The modified XML containing both the shadow and the original element.
 */
function applyDropShadow(originalXml: string, filterId: string, element: any, tagType: string): string {
  if (!filters[filterId]) return originalXml;

  const filterEffect = convertFilter(filters[filterId]);
  let shadowXml = '';

  if (tagType === 'path') {
    const pathDataMatch = originalXml.match(/android:pathData="([^"]+)"/);
    const pathData = pathDataMatch ? pathDataMatch[1] : (element.$.d || '');
    if (!pathData) {
      console.warn(`Warning: Missing pathData for element with filter ${filterId}`);
      return originalXml;
    }
    shadowXml = `
    <path
      android:fillColor="${filterEffect.shadowColor}"
      android:pathData="${pathData}"
      android:translateX="${filterEffect.dx}"
      android:translateY="${filterEffect.dy}" />`;
  }
  else if (tagType === 'circle') {
    shadowXml = `
    <circle
      android:cx="${element.$.cx}"
      android:cy="${element.$.cy}"
      android:r="${element.$.r}"
      android:fillColor="${filterEffect.shadowColor}"
      android:translateX="${filterEffect.dx}"
      android:translateY="${filterEffect.dy}" />`;
  }
  else if (tagType === 'rect') {
    shadowXml = `
    <rect
      android:x="${element.$.x}"
      android:y="${element.$.y}"
      android:width="${element.$.width}"
      android:height="${element.$.height}"
      android:fillColor="${filterEffect.shadowColor}"
      android:translateX="${filterEffect.dx}"
      android:translateY="${filterEffect.dy}" />`;
  }
  else if (tagType === 'line') {
    shadowXml = `
    <path
      android:pathData="M ${element.$.x1},${element.$.y1} L ${element.$.x2},${element.$.y2}"
      android:strokeColor="${filterEffect.shadowColor}"
      android:strokeWidth="${element.$['stroke-width'] || '1'}"
      android:translateX="${filterEffect.dx}"
      android:translateY="${filterEffect.dy}" />`;
  }

  return `${shadowXml}\n${originalXml}`;
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

  const pathData = `M ${cx} ${cy - r} ` +
    `C ${cx + r * 0.552285} ${cy - r} ${cx + r} ${cy - r * 0.552285} ${cx + r} ${cy} ` +
    `C ${cx + r} ${cy + r * 0.552285} ${cx + r * 0.552285} ${cy + r} ${cx} ${cy + r} ` +
    `C ${cx - r * 0.552285} ${cy + r} ${cx - r} ${cy + r * 0.552285} ${cx - r} ${cy} ` +
    `C ${cx - r} ${cy - r * 0.552285} ${cx - r * 0.552285} ${cy - r} ${cx} ${cy - r} Z`;

  const fill = circle.$.fill || '#000000';
  const stroke = circle.$.stroke;
  const strokeWidth = circle.$['stroke-width'];

  let filterEffect = '';
  if (circle.$['filter']) {
    const filterId = circle.$['filter'].slice(5, -1);
    filterEffect = applyFilter(filterId);
  }

  return `    <path
        android:fillColor="${convertColor(fill)}"${stroke ? `
        android:strokeColor="${convertColor(stroke)}"` : ''}${strokeWidth ? `
        android:strokeWidth="${strokeWidth}"` : ''}
        android:pathData="${pathData}"${filterEffect} />\n`;
}

function convertFilter(filter: FilterElement): { shadowColor: string, dx: number, dy: number } {
  if (!filter.feDropShadow || !filter.feDropShadow[0]) return { shadowColor: '#33373737', dx: 0, dy: 4 };

  const shadow = filter.feDropShadow[0].$;
  const dx = parseFloat(shadow.dx || '0');
  const dy = parseFloat(shadow.dy || '0');
  const stdDeviation = parseFloat(shadow.stdDeviation || '2');
  const floodColor = shadow['flood-color'] || '#000000';
  const floodOpacity = parseFloat(shadow['flood-opacity'] || '0.2');

  const shadowColor = convertColorWithOpacity(floodColor, floodOpacity.toString());

  return { shadowColor, dx, dy: dy + stdDeviation };
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
 * Converts an SVG Line element to Android Vector format.
 * @param line - Line element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<path>` element representing a line.
 */
function convertLine(line: LineElement): string {
  const strokeWidth = line.$ && line.$['stroke-width'] ? line.$['stroke-width'] : '1';
  const linePath = `M${line.$.x1},${line.$.y1} L${line.$.x2},${line.$.y2}`;

  let filterEffect = '';
  if (line.$['filter']) {
    const filterId = line.$['filter'].slice(5, -1);
    filterEffect = applyFilter(filterId);
  }

  return `    <path
      android:pathData="${linePath}"
      android:strokeColor="${convertColor(line.$.stroke)}"
      android:strokeWidth="${strokeWidth}"${filterEffect} />\n`;
}

/**
 * Converts an SVG Path element to Android Vector format.
 * @param path - Path element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<path>` element.
 */
function convertPath(path: PathElement, isFirstGroup: boolean = false): string {
  const transform = path.$.transform;
  const fill = path.$.fill || (isFirstGroup ? '#FFFFFFFF' : undefined);
  let groupStart = '';
  let groupEnd = '';

  if (transform) {
    const { rotation, pivotX, pivotY } = processTransform(transform);
    if (rotation !== 0) {
      groupStart = `    <group
        android:rotation="${rotation}"${pivotX !== undefined ? `
        android:pivotX="${pivotX}"` : ''}${pivotY !== undefined ? `
        android:pivotY="${pivotY}"` : ''}>
`;
      groupEnd = '    </group>\n';
    }
  }

  let filterEffect = '';
  if (path.$['filter']) {
    const filterId = path.$['filter'].slice(5, -1);
    filterEffect = applyFilter(filterId);
  }

  const pathElement = `    <path
        android:pathData="${path.$.d}"${fill ? `
        android:fillColor="${convertColor(fill)}"` : ''}${path.$.stroke ? `
        android:strokeColor="${convertColor(path.$.stroke)}"` : ''}${path.$['stroke-width'] ? `
        android:strokeWidth="${path.$['stroke-width']}"` : ''}${filterEffect} />\n`;

  return groupStart + pathElement + groupEnd;
}

/**
 * Converts an SVG Rect element to Android Vector format.
 * @param rect - Rect element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<path>` element representing a rectangle.
 */
function convertRect(rect: RectElement): string {
  const transform = rect.$.transform;
  let groupStart = '';
  let groupEnd = '';

  if (transform) {
    const { rotation, pivotX, pivotY } = processTransform(transform);
    if (rotation !== 0) {
      groupStart = `    <group
        android:rotation="${rotation}"${pivotX !== undefined ? `
        android:pivotX="${pivotX}"` : ''}${pivotY !== undefined ? `
        android:pivotY="${pivotY}"` : ''}>\n`;
      groupEnd = '    </group>\n';
    }
  }

  const x = parseFloat(rect.$.x || '0');
  const y = parseFloat(rect.$.y || '0');
  const width = parseFloat(rect.$.width);
  const height = parseFloat(rect.$.height);

  const rxValue = rect.$.rx || '0';
  const ryValue = rect.$.ry || rxValue || '0';
  const rx = parseFloat(rxValue);
  const ry = parseFloat(ryValue);

  let pathData: string;
  if (rx === 0 && ry === 0) {
    pathData = `M ${x} ${y} h ${width} v ${height} h ${-width} Z`;
  } else {
    pathData = `M ${x + rx} ${y} ` +
      `L ${x + width - rx} ${y} ` +
      `Q ${x + width} ${y} ${x + width} ${y + ry} ` +
      `L ${x + width} ${y + height - ry} ` +
      `Q ${x + width} ${y + height} ${x + width - rx} ${y + height} ` +
      `L ${x + rx} ${y + height} ` +
      `Q ${x} ${y + height} ${x} ${y + height - ry} ` +
      `L ${x} ${y + ry} ` +
      `Q ${x} ${y} ${x + rx} ${y} Z`;
  }

  let filterEffect = '';
  if (rect.$['filter']) {
    const filterId = rect.$['filter'].slice(5, -1);
    filterEffect = applyFilter[filterId] || '';
  }

  const pathElement = `    <path
        android:fillColor="${convertColor(rect.$.fill)}"${rect.$.stroke ? `
        android:strokeColor="${convertColor(rect.$.stroke)}"` : ''}${rect.$['stroke-width'] ? `
        android:strokeWidth="${rect.$['stroke-width']}"` : ''}
        android:pathData="${pathData}"${filterEffect} />\n`;

  return groupStart + pathElement + groupEnd;
}

/**
 * Processes an SVG element and applies a shadow effect if a filter is present.
 * @param element - The parsed SVG element object.
 * @param converter - The function that converts the element into Android Vector XML.
 * @param tagType - The type of SVG element (path, circle, rect, line).
 * @returns The processed XML with optional shadow effect.
 */
function processElement(element: any, converter: (el: any) => string, tagType: string): string {
  let xml = converter(element);
  if (element.$['filter']) {
    const filterId = element.$['filter'].slice(5, -1);
    return applyDropShadow(xml, filterId, element, tagType);
  }
  return xml;
}

/**
 * Converts an SVG Group element, handling transformations and nested elements.
 * Processes transformations like rotation and translation, and converts nested SVG elements
 * (path, circle, rect) into Android Vector XML format.
 * 
 * @param group - Group element from parsed SVG.
 * @returns Formatted string for Android Vector XML `<group>` element with nested elements.
 */
function handleGroup(group: GroupElement, indentLevel: number = 1): string {
  let result = '';

  const transform = group.$.transform;
  let groupStart = '';
  let groupEnd = '';

  if (transform) {
    const { rotation, pivotX, pivotY } = processTransform(transform);
    groupStart = `<group android:rotation="${rotation}"${pivotX ? ` android:pivotX="${pivotX}"` : ''}${pivotY ? ` android:pivotY="${pivotY}"` : ''}>\n`;
    groupEnd = '</group>\n';
  }

  if (group.path) {
    group.path.forEach(path => {
      result += convertPath(path);
    });
  }

  if (group.circle) {
    group.circle.forEach(circle => {
      result += convertCircle(circle);
    });
  }

  if (group.rect) {
    group.rect.forEach(rect => {
      result += convertRect(rect);
    });
  }

  if (group.g) {
    group.g.forEach(innerGroup => {
      result += handleGroup(innerGroup, indentLevel + 1);
    });
  }

  return groupStart + result + groupEnd;
}

/**
 * Converts an SVG file to an Android Vector XML format.
 * @param inputFile - Path to the SVG file to convert.
 * @param outputFile - Path to save the output Android Vector XML file.
 */
function convertSvgToAndroidVector(inputFile: string, outputFile: string) {
  gradientMap.clear();
  filters = {};
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
    android:viewportHeight="${viewBox[3]}">
`;

    if (result.svg.defs && result.svg.defs[0]) {
      const defs = result.svg.defs[0];
      if (defs.filter) {
        defs.filter.forEach((filter: FilterElement) => {
          filters[filter.$.id] = filter;
        });
      }
    }

    let bodyXml = '';
    let groupedElements: string[] = [];

    if (result.svg.path) {
      result.svg.path.forEach((path: PathElement) => {
        groupedElements.push(processElement(path, convertPath, 'path'));
      });
    }

    if (result.svg.circle) {
      result.svg.circle.forEach((circle: CircleElement) => {
        groupedElements.push(processElement(circle, convertCircle, 'circle'));
      });
    }

    if (result.svg.rect) {
      result.svg.rect.forEach((rect: RectElement) => {
        groupedElements.push(processElement(rect, convertRect, 'rect'));
      });
    }

    if (result.svg.line) {
      result.svg.line.forEach((line: LineElement) => {
        groupedElements.push(processElement(line, convertLine, 'line'));
      });
    }

    if (result.svg.g) {
      result.svg.g.forEach((group: GroupElement) => {
        bodyXml += handleGroup(group, 1);
      });
    }

    vectorXml += bodyXml;
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