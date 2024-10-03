const fs = require('fs');
const path = require('path');

/**
 * Removes all `fill` attributes from the given SVG content.
 * This ensures that the SVG can be styled dynamically without any inline fill color.
 * 
 * @param svgData - The contents of the SVG file as a string.
 * @returns The SVG content with all `fill` attributes removed.
 */
const removeFillFromSvg = (svgData: string): string => {
  return svgData.replace(/\s*fill="[^"]*"/g, '');
};

/**
 * Extracts the width and height attributes from an SVG file content.
 * If the width or height attributes are not found, defaults to 100.
 * 
 * @param svgData - The contents of the SVG file as a string.
 * @returns An object containing the width and height of the SVG.
 */
const getSvgDimensions = (svgData: string): { width: string, height: string } => {
  const widthMatch = svgData.match(/width="(\d+(\.\d+)?)"/);
  const heightMatch = svgData.match(/height="(\d+(\.\d+)?)"/);

  const width = widthMatch ? widthMatch[1] : '100'; // default to 100 if width not found
  const height = heightMatch ? heightMatch[1] : '100'; // default to 100 if height not found

  return { width, height };
};

/**
 * Moves the processed SVG file to the 'origin-svgs' folder after processing.
 * @param svgFile - The name of the SVG file to move.
 * @param inputFolder - The folder where the SVG files are stored.
 */
const moveToOriginFolder = (svgFile: string, inputFolder: string): void => {
  const originFolder = path.join(inputFolder, 'origin-svgs');

  // Ensure the 'origin-svgs' folder exists, create if it does not exist
  if (!fs.existsSync(originFolder)) {
    fs.mkdirSync(originFolder, { recursive: true });
  }

  // Move the file to the 'origin-svgs' folder
  const sourcePath = path.join(inputFolder, svgFile);
  const destPath = path.join(originFolder, svgFile);
  fs.renameSync(sourcePath, destPath);
};

/**
 * Creates a directory structure and the necessary files for a given SVG.
 * If the directory does not exist, it creates the directory.
 * 
 * @param svgFile - The name of the SVG file to process.
 * @param inputFolder - The folder containing the original SVG files.
 * @param outputFolder - The folder where the processed files will be generated.
 */
const createFilesForSvg = (svgFile: string, inputFolder: string, outputFolder: string = 'svgs'): void => {
  const svgFileName = path.basename(svgFile, '.svg');
  const svgFilePath = path.join(outputFolder, svgFileName);

  // Ensure the output folder exists, create if it does not exist
  if (!fs.existsSync(svgFilePath)) {
    fs.mkdirSync(svgFilePath, { recursive: true });
  }

  const svgData = fs.readFileSync(path.join(inputFolder, svgFile), 'utf8');
  const cleanedSvgData = removeFillFromSvg(svgData);
  const { width, height } = getSvgDimensions(svgData);

  // Create the cleaned SVG file
  fs.writeFileSync(path.join(svgFilePath, `${svgFileName}.svg`), cleanedSvgData);

  // Create the TSX file for the default React component
  const tsxContent = `export { ReactComponent as default } from './${svgFileName}.svg';`;
  fs.writeFileSync(path.join(svgFilePath, `${svgFileName}.tsx`), tsxContent);

  // Create the index.ts file
  const indexContent = `export { default } from './${svgFileName}';`;
  fs.writeFileSync(path.join(svgFilePath, 'index.ts'), indexContent);

  // Create the lazy-loaded React component
  const lazyContent = `
import React, { Suspense } from "react";
const ${svgFileName} = React.lazy(() => import('./${svgFileName}'));

function Lazy${svgFileName}(props: React.SVGAttributes<SVGSVGElement>) {
  return (
    <Suspense fallback={(<svg width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    />)} >
    
      <${svgFileName} {...props} />
    </Suspense>
  );
}

export default React.memo(Lazy${svgFileName});
`;
  fs.writeFileSync(path.join(outputFolder, `Lazy${svgFileName}.tsx`), lazyContent);

  // Move the original SVG file to the origin-svgs folder
  moveToOriginFolder(svgFile, inputFolder);
};

/**
 * Processes all SVG files in a specified folder.
 * Creates the necessary files and directories for each SVG found.
 * 
 * @param inputFolder - The folder containing the original SVG files.
 * @param [outputFolder='svgs'] - The folder where the processed files will be generated.
 */
const processSvgs = (inputFolder: string, outputFolder: string = 'svgs'): void => {
  // Ensure the output folder exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const svgFiles = fs.readdirSync(inputFolder);

  for (const svgFile of svgFiles) {
    if (path.extname(svgFile) === '.svg') {
      createFilesForSvg(svgFile, inputFolder, outputFolder);
    }
  }
};

// Example Usage
const inputFolder = path.join(__dirname, 'svgs'); // Folder containing original SVGs
const outputFolder = path.join(__dirname, 'svgs');  // Generated files remain in svgs folder

processSvgs(inputFolder, outputFolder);

export { removeFillFromSvg, getSvgDimensions, createFilesForSvg, moveToOriginFolder, processSvgs };