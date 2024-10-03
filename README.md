# @zorimo/common

![npm version](https://img.shields.io/npm/v/@zorimo/common)

A set of common utility methods used by zorimo.

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
 
## Contributing
Contributions are welcome! Please open an issue or submit a pull request with your improvements.
