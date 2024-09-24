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
 
## Contributing
Contributions are welcome! Please open an issue or submit a pull request with your improvements.
