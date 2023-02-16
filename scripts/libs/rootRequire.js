const rootPath = path.resolve(__dirname, '../..');
global.rootRequire = (name) => require(`${rootPath}/${name}`);
