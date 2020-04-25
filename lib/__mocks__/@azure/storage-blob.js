const Readable = require("stream").Readable;

class BlobServiceClient {
  constructor(url, sharedKeyCredential) {
    this.url = url;
    this.sharedKeyCredential = sharedKeyCredential;
    this.blobStorages = {};
  }
  init() {
    return {};
  }
  getContainerClient(id) {
    this.blobStorages.container = this.blobStorages.container || {};
    this.blobStorages.container[id] = this.blobStorages.container[id] || {};
    let container = this.blobStorages.container[id];

    const deleteContainer = () => (this.blobStorages.container[id] = {});

    return {
      create() {},
      delete() {
        if (id === "fails") throw new Error("Deletion failed");
        deleteContainer();
      },
      getBlockBlobClient(filename) {
        if (filename === "saving_fails.txt") throw new Error("Saving failed");
        return {
          upload(content, length) {
            container[filename] = content;
            return {
              result: "upload successful"
            };
          }
        };
      },
      getBlobClient(filename) {
        return {
          download() {
            const readable = new Readable();
            readable._read = () => {};
            readable.push(container[filename]);
            readable.push(null);
            return {
              readableStreamBody: readable
            };
          }
        };
      }
    };
  }
}

class StorageSharedKeyCredential {
  constructor(account, accountKey) {
    this.account = account;
    this.accountKey = accountKey;
  }
}
module.exports = {
  BlobServiceClient,
  StorageSharedKeyCredential
};
