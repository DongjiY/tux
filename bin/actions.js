import { readFile } from "node:fs";

export function run(options) {
  readFile(options.file, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const obj = JSON.parse(data);
      console.log(obj);
    }
  });
}
