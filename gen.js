import { createReadStream, writeFileSync } from "node:fs";
import { Splitable } from "async-iterable-split";

const rules = [];

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
        rules.push({ type: "domain", value });
        break;
      case "full":
        rules.push({ type: "full", value });
        break;
      case "keyword":
        rules.push({ type: "keyword", value });
        break;
      case "regexp":
        rules.push({ type: "regexp", value });
        break;
      default:
        throw new Error(`unknow type: ${type}`);
    }
  }
}

await parse("cn");

writeFileSync("cn.json", JSON.stringify(rules));
