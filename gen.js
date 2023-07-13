import { createReadStream, createWriteStream } from "node:fs";
import { Splitable } from "async-iterable-split";

const cnFile = createWriteStream("cn.txt");

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
        cnFile.write("domain:" + value + "\n");
        break;
      case "full":
        cnFile.write("full:" + value + "\n");
        break;
      case "keyword":
        cnFile.write("keyword:" + value + "\n");
        break;
      case "regexp":
        cnFile.write("regexp:" + value + "\n");
        break;
      default:
        throw new Error(`unknow type: ${type}`);
    }
  }
}

await parse("cn");
