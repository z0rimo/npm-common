export interface SvgAttributes {
  width?: string;
  height?: string;
  viewBox?: string;
}

export interface PathElement {
  $: {
    d: string;
    fill?: string;
    stroke?: string;
    transform?: string;
    'stroke-width'?: string;
  };
}

export interface RectElement {
  $: {
    x?: string;
    y?: string;
    width: string;
    height: string;
    fill?: string;
    stroke?: string;
    rx?: string;
    ry?: string;
    transform?: string;
    'stroke-width'?: string;
  };
}

export interface CircleElement {
  $: {
    cx: string;
    cy: string;
    r: string;
    fill?: string;
    stroke?: string;
    'stroke-width'?: string;
  };
}

export interface LineElement {
  $: {
    x1: string;
    y1: string;
    x2: string;
    y2: string;
    stroke?: string;
    'stroke-width'?: string;
  };
}

export interface GradientStop {
  $: {
    offset: string;
    'stop-color': string;
    'stop-opacity'?: string;
  };
}

export interface GradientElement {
  $: {
    id: string;
    type: string;
    x1?: string;
    y1?: string;
    x2?: string;
    y2?: string;
    cx?: string;
    cy?: string;
    r?: string;
  };
  stop: GradientStop[];
}

export interface AnimationElement {
  $: {
    attributeName: string;
    dur?: string;
    from?: string;
    to?: string;
    repeatCount?: string;
  };
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface GroupElement {
  $: {
    filter?: string;
    transform?: string;
  };
  circle?: CircleElement[];
  rect?: RectElement[];
  path?: PathElement[];
}

export const gradientMap = new Map<string, GradientElement>();