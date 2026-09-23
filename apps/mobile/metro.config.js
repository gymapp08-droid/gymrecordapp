const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);
config.projectRoot = projectRoot;

const watchFolders = [projectRoot];
if (fs.existsSync(path.resolve(monorepoRoot, 'packages'))) {
  watchFolders.push(monorepoRoot);
}
config.watchFolders = watchFolders;

const nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];
if (fs.existsSync(path.resolve(monorepoRoot, 'node_modules'))) {
  nodeModulesPaths.push(path.resolve(monorepoRoot, 'node_modules'));
}
config.resolver.nodeModulesPaths = nodeModulesPaths;

module.exports = config;
