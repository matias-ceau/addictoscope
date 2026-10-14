// See package.json: addictoscope only runs text models, never image pipelines.
module.exports = function sharp() {
  throw new Error("sharp is stubbed out in addictoscope (image inputs are not supported)");
};
