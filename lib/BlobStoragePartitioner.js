const {
  BlobServiceClient,
  StorageSharedKeyCredential
} = require("@azure/storage-blob");

class BlobStoragePartitioner {
  /**
   * BlobStoragePartitioner constructor
   *
   * @param {string} storages - account:accountKey;account:accountKey
   */
  constructor(storages) {
    // validate input
    if (typeof storages !== "string" || storages.length < 1) {
      throw new Error(
        'Storages need to be provided as string. like "account:accountKey;account2:accountKey2"'
      );
    }

    const colons = storages.split(":").length - 1;
    const semicolons = storages.split(";").length - 1;
    if (colons !== semicolons + 1) {
      throw new Error(
        "Make sure yous tring is correctly formated. account and accountKey are seperated by colon and additional storages are seperated by semicolon. The string has to end without semicolon"
      );
    }

    // transform string to object
    const storageStrings = storages.split(";");
    const storagesObject = storageStrings.map(storageString => {
      const parts = storageString.split(":");
      return {
        account: parts[0],
        accountKey: parts[1]
      };
    });
    this.storages = storagesObject;
  }

  /**
   * Initialize all connections to blob storages
   * Note: The function is initializing the connections sequential
   *       to always have the same order for a set of storages
   */
  async init() {
    for (const storage of this.storages) {
      const sharedKeyCredential = new StorageSharedKeyCredential(
        storage.account,
        storage.accountKey
      );
      const blobServiceClient = new BlobServiceClient(
        `https://${storage.account}.blob.core.windows.net`,
        sharedKeyCredential
      );

      this.clients = this.clients || [];
      this.clients.push(blobServiceClient);
    }
  }

  /**
   * Get the partition key for a given uuid
   * Note: there is no validation to keep this function fast
   *
   * @param {string} id - please make sure the format is uuid - preferred uuid/v4
   * @param {int} maxInt - the amount of partions the id should distribute to
   * @returns {int} key - the partition key as integer
   */
  getPartitionKey(id, maxInt) {
    const cleanId = id.replace("-", "");
    const integer = parseInt(cleanId, 16);
    const key = integer % maxInt;
    return key;
  }

  /**
   * Return the appropriate client for a given id
   *
   * @param {string} id - please make sure the format is uuid - preferred uuid/v4
   * @returns {BlobBlobClient} client - initialized blobServiceClient from "@azure/storage-blob" library
   */
  getClient(id) {
    const key = this.getPartitionKey(id, this.clients.length);
    return this.clients[key];
  }

  /**
   * Save the content as file to a partitioned storage account
   *
   * @param {string} content - content of the file to cache
   * @param {string} file - filename
   * @param {string} id - please make sure the format is uuid - preferred uuid/v4
   * @returns {object} uploadBlobResponse
   */
  async saveToCache(content, file, id) {
    const client = this.getClient(id);
    const containerClient = client.getContainerClient(id);
    try {
      await containerClient.create();
    } catch (e) {
      // The container already exits
    }
    const blockBlobClient = containerClient.getBlockBlobClient(file);
    const uploadBlobResponse = await blockBlobClient.upload(
      content,
      content.length
    );
    return uploadBlobResponse;
  }

  /**
   * Collect a readable stream to local memory and return the string
   *
   * @param {Stream} readableStream
   * @returns {Promise} Promise resolves with content or rejects with error
   */
  streamToString(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on("data", data => {
        chunks.push(data.toString());
      });
      readableStream.on("end", () => {
        resolve(chunks.join(""));
      });
      readableStream.on("error", reject);
    });
  }

  /**
   * Load file content from cache
   *
   * @param {string} file - filename
   * @param {string} id - please make sure the format is uuid - preferred uuid/v4
   * @returns {string} content - downloaded file content as string
   */
  async loadFromCache(file, id) {
    const client = this.getClient(id);
    const containerClient = client.getContainerClient(id);
    const blobClient = containerClient.getBlobClient(file);
    const downloadBlockBlobResponse = await blobClient.download();
    const content = await this.streamToString(
      downloadBlockBlobResponse.readableStreamBody
    );
    return content;
  }

  /**
   * Delete the cache for an id
   *
   * @param {string} id
   */
  async deleteCache(id) {
    const client = this.getClient(id);
    const containerClient = client.getContainerClient(id);
    const deletionResult = await containerClient.delete();
    return deletionResult;
  }
}

module.exports = BlobStoragePartitioner;
