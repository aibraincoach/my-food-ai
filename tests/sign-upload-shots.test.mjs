// node --import tsx --test tests/sign-upload-shots.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { validUploadShots } from "../src/lib/posts/upload-draft.ts";

test("legacy upload shots reject invalid ordering and dimensions", () => {
  for (const shots of [
    [{position:-1,width:1080,height:1080}],
    [{position:9999,width:1080,height:1080}],
    [{position:0,width:0,height:1080}],
    [{position:0,width:1080,height:1080},{position:0,width:1080,height:1080}],
    [{position:0,width:1080,height:4097}],
    [{position:0,width:1.5,height:1080}],
  ]) assert.equal(validUploadShots(shots), false, JSON.stringify(shots));
  assert.equal(validUploadShots([{position:0,width:1080,height:1080}]), true);
});
