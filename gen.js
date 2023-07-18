import { createReadStream, writeFileSync } from "node:fs";
import { Splitable } from "async-iterable-split";

const rules = {
  full: [],
  keyword: [],
  suffix: ["hcfy.app", "biliimg.com", "volcengine.com"],
  regexp: [
    ["^(::f{4}:)?10\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})$", "i"],
    ["^(::f{4}:)?192\\.168\\.([0-9]{1,3})\\.([0-9]{1,3})$", "i"],
    [
      "^(::f{4}:)?172\\.(1[6-9]|2\\d|30|31)\\.([0-9]{1,3})\\.([0-9]{1,3})$",
      "i",
    ],
    ["^(::f{4}:)?127\\.([0-9]{1,3})\\.([0-9]{1,3})\\.([0-9]{1,3})$", "i"],
    ["^(::f{4}:)?169\\.254\\.([0-9]{1,3})\\.([0-9]{1,3})$", "i"],
    ["^f[cd][0-9a-f]{2}:", "i"],
    ["^fe80:", "i"],
    ["^::1$"],
    ["^::"],
  ],
};

async function parse(filename) {
  const splitable = new Splitable(createReadStream(`data/${filename}`));
  while (await splitable.hasValue()) {
    const line = new TextDecoder().decode(await splitable.readLine());
    const expression = line.split("#")[0].trim();
    if (expression.length === 0) {
      continue;
    }
    const [, type, value, attrs] = expression.match(
      /(?:(include|domain|full|keyword|regexp):)?([\S\@]+)(.*)/
    );
    if (attrs && attrs.indexOf("@!cn") !== -1) {
      continue;
    }

    switch (type) {
      case "include":
        await parse(expression.substring(8));
        break;
      case "domain":
      case undefined:
        rules.suffix.push(value);
        break;
      case "full":
        rules.full.push(value);
        break;
      case "keyword":
        rules.keyword.push(value);
        break;
      case "regexp":
        rules.regexp.push([value]);
        break;
      default:
        throw new Error(`unknow type: ${type}`);
    }
  }
}

await parse("private");
await parse("cn");

writeFileSync("bypass.json", JSON.stringify(rules));
