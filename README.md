# @zorimo/common

![npm version](https://img.shields.io/npm/v/@zorimo/common)

A set of common utility methods.

## Installation

You can install this package via npm:

```
npm install @zorimo/common
```

## Usage
### ClassNameHelper
Concatenate class names based on conditions:

```
import { ClassNameHelper } from '@zorimo/common';

const className = ClassNameHelper.concat('class1', null, 'class2', undefined, false, 'class3');
// className will be 'class1 class2 class3'
```

#### Advanced Usage
You can also use ClassNameHelper in more complex scenarios where conditional class names are necessary:

```
import { ClassNameHelper } from '@zorimo/common';

const isActive = true;
const className = ClassNameHelper.concat('class1', isActive && 'active', 'class3');
// className will be 'class1 active class3' if isActive is true
```

### CookieProvider
Set, get, and remove cookies:

```
import { CookieProvider } from '@zorimo/common';

const cookieProvider = new CookieProvider();
cookieProvider.setCookie('testCookie', 'testValue', new Date(Date.now() + 3600 * 1000));

const value = cookieProvider.getCookie('testCookie'); // 'testValue'
cookieProvider.removeCookie('testCookie');
```

### GenerateUUID
Generate a unique identifier:

```
import { GenerateUUID } from '@zorimo/common';

const uuid = GenerateUUID();
console.log(uuid); // e.g., 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
```

### LazySVGGenerator
Generate React components from SVG files and dynamically create files for lazy-loaded components.

#### How to Use
To process all SVG files in a specific folder and generate React components:

1. Prepare your SVG files in the `svgs` folder.
2. Run the following command to process the files:

```
npx tsx LazySVGGenerator.ts
```

This will generate:
- A cleaned SVG file without `fill` attributes.
- A React component (`tsx` file) that uses the SVG file.
- A `LazyComponent` that loads the SVG lazily using React's `Suspense`.
- An `index.ts` file for easy imports.

#### SVG File Configuration (svg.d.ts)
To properly import SVG files as React components, you need to configure TypeScript to understand SVG files. Add the following `svg.d.ts` file to your project:

```typescript
declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
```

This allows you to import SVG files as React components like this:
```
import { ReactComponent as MyIcon } from './my-icon.svg';
```

### SVG2XML Converter
Convert SVG files into Android-compatible XML vector format, which can be used directly in Android projects.

#### How to Use
The svg2xml converter processes SVG files and generates XML files optimized for Android’s vector format:

1. Place your SVG files in a folder.
2. Use the following command to convert an SVG file:

```
npx tsx SVG2XML.ts <input.svg>
```
The output XML will include:

- Path data extracted from SVG paths, circles, rectangles, and lines.
- Color conversion with optional alpha transparency.
- Gradients and animations, if present, mapped to Android-compatible attributes.

#### Example of Output Structure
A simple SVG input will be converted to an XML structure like:
```
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="100dp"
    android:height="100dp"
    android:viewportWidth="100"
    android:viewportHeight="100">
    <path
        android:pathData="M0,0 L100,100"
        android:fillColor="#ff0000" />
</vector>
```

## API

### ClassNameHelper
- **concat(...names: Array<string | null | undefined | false>): string**
  - Concatenates a list of class names, ignoring falsy values.

### CookieProvider
- **setCookie(name: string, value: string, exp: Date): void**
  - Sets a cookie with the specified name, value, and expiration date.

- **getCookie(name: string): string | null**
  - Retrieves the value of the specified cookie.

- **removeCookie(name: string): void**
  - Removes the specified cookie.

### GenerateUUID
- **GenerateUUID(): string**
  - Generates and returns a UUID (Universally Unique Identifier).
 
### LazySVGGenerator
- **processSvgs(inputFolder: string, outputFolder: string): void**
  - Processes all SVG files in the specified folder, generating React components and necessary files for lazy loading.

- **removeFillFromSvg(svgData: string): string**
  - Removes the fill attributes from the SVG content.

- **getSvgDimensions(svgData: string): { width: string, height: string }**
  - Extracts the width and height attributes from the SVG content.
    
- **createFilesForSvg(svgFile: string, inputFolder: string, outputFolder: string): void**
  - Creates necessary files and directories for the given SVG file, including the React component and lazy-loaded component.
    
- **moveToOriginFolder(svgFile: string, inputFolder: string): void**
  - Moves the original SVG file to the origin-svgs folder after processing.
 
### SVG2XML Converter
- **convertSvgToAndroidVector(inputFile: string, outputFile: string): void**
  - Converts an SVG file to an Android XML vector file format, processing paths, shapes, gradients, and animations.
 
## Contributing
Contributions are welcome! Please open an issue or submit a pull request with your improvements.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/z0rimo/npm-common/blob/main/LICENSE) file for details.
