/**
 * helpers.js - helpers for blessed
 * Copyright (c) 2013-2015, Christopher Jeffrey and contributors (MIT License).
 * https://github.com/chjj/blessed
 */

/**
 * Modules
 */

import { readdirSync, lstatSync } from "fs";
import { chars } from "./unicode";

/**
 * Helpers
 */

type Merge<A, B> = { [K in keyof (A | B)]: K extends keyof B ? B[K] : A[K] };

export function merge<A extends object, B extends object>(
  a: A,
  b: B
): Merge<A, B> {
  const aReturn = a as any;
  for (const key in b) {
    aReturn[key] = b[key];
  }
  return aReturn as Merge<A, B>;
}

export function asort<T extends { name: string }>(obj: T[]): T[] {
  return obj.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();

    let aLetter = aName[0];
    let bLetter = bName[0];
    if (aName[0] === "." && bName[0] === ".") {
      aLetter = aName[1];
      bLetter = bName[1];
    }

    return aLetter > bLetter ? 1 : aLetter < bLetter ? -1 : 0;
  });
}

export function hsort<T extends { index: number }>(obj: T[]): T[] {
  return obj.sort((a, b) => b.index - a.index);
}

export function findFile(start: string, target: string): string | null {
  return (function read(dir: string): string | null {
    if (dir === "/dev" || dir === "/sys" || dir === "/proc" || dir === "/net") {
      return null;
    }

    try {
      const files = readdirSync(dir);

      for (var i = 0; i < files.length; i++) {
        const file = files[i];

        var path = (dir === "/" ? "" : dir) + "/" + file;
        if (file === target) return path;

        try {
          const stat = lstatSync(path);
          if (stat && stat.isDirectory() && !stat.isSymbolicLink()) {
            const out = read(path);
            if (out) return out;
          }
        } catch (e) {
          continue;
        }
      }
    } catch (e) {
      return null;
    }

    return null;
  })(start);
}

// Escape text for tag-enabled elements.
export function escape(text: string): string {
  return text.replace(/[{}]/g, function (ch) {
    return ch === "{" ? "{open}" : "{close}";
  });
}

// To remove when Element is typed properly
const AnyElementPrototype = Element.prototype as any;

export function parseTags(text: string, screen: any) {
  return AnyElementPrototype._parseTags.call(
    { parseTags: true, screen: screen || Screen().global },
    text
  );
}

export function generateTags(
  style: Record<string, string | number | boolean>,
  text: string
) {
  var open = "",
    close = "";

  Object.keys(style || {}).forEach(function (key) {
    var val = style[key];
    if (typeof val === "string") {
      val = val.replace(/^light(?!-)/, "light-");
      val = val.replace(/^bright(?!-)/, "bright-");
      open = "{" + val + "-" + key + "}" + open;
      close += "{/" + val + "-" + key + "}";
    } else {
      if (val === true) {
        open = "{" + key + "}" + open;
        close += "{/" + key + "}";
      }
    }
  });

  if (text != null) {
    return open + text + close;
  }

  return {
    open: open,
    close: close,
  };
}

export function attrToBinary(
  style: Record<string, string | number | boolean>,
  element: any
) {
  return AnyElementPrototype.sattr.call(element || {}, style);
}

export function stripTags(text: string): string {
  if (!text) return "";
  return text
    .replace(/{(\/?)([\w\-,;!#]*)}/g, "")
    .replace(/\x1b\[[\d;]*m/g, "");
}

export function cleanTags(text: string): string {
  return stripTags(text).trim();
}

export function dropUnicode(text: string): string {
  if (!text) return "";
  return text
    .replace(chars.all, "??")
    .replace(chars.combining, "")
    .replace(chars.surrogate, "?");
}

let _screen: any = undefined;
export function Screen() {
  if (!_screen) {
    _screen = require("./widgets/screen");
  }
  return _screen;
}

let _element: any = undefined;
export function Element() {
  if (!_element) {
    _element = require("./widgets/element");
  }
  return _element;
}
