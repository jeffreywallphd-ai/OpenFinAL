function createFileService({ fs }) {
  function readFromFile(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data);
      });
    });
  }

  function readFromFileBinary(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, (error, data) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(data);
      });
    });
  }

  return {
    readFromFile,
    readFromFileBinary,
  };
}

module.exports = {
  createFileService,
};
