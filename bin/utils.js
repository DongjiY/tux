import { readFile } from "node:fs";

export function jsonToObj(path) {
  return new Promise((resolve, reject) => {
    readFile(path, (err, data) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        const obj = JSON.parse(data);
        resolve(obj);
      }
    });
  });
}
