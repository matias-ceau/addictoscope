// onnxruntime-web ships its types outside its package.json "exports", so
// "bundler" resolution cannot see them; its API is onnxruntime-common's.
declare module "onnxruntime-web" {
  export * from "onnxruntime-common";
}
