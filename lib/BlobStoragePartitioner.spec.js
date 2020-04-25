const BlobStoragePartitioner = require("./BlobStoragePartitioner");
const uuid = require("uuid/v4");

describe("Init BlobStoragePartitioner", () => {
  it("should initialize BlobStoragePartitioner with one blob storage", async () => {
    const storages = "mystorageaccount0:accessKey0";
    const storage = new BlobStoragePartitioner(storages);
    await storage.init();
    expect(storage.clients).toHaveLength(1);
  });

  it("should initialize BlobStoragePartitioner with multiple blob storages", async () => {
    const storages =
      "mystorageaccount0:accessKey0;mystorageaccount1:accessKey1;mystorageaccount2:accessKey2";
    const storage = new BlobStoragePartitioner(storages);
    await storage.init();
    expect(storage.clients).toHaveLength(3);
  });

  it("should throw an error if no storages are provided", async () => {
    expect.assertions(1);
    const storages = "";
    try {
      const storage = new BlobStoragePartitioner(storages);
      await storage.init();
    } catch (e) {
      expect(e.message).toBe(
        'Storages need to be provided as string. like "account:accountKey;account2:accountKey2"'
      );
    }
  });

  it("should throw an error if storages are provided as frong type", async () => {
    expect.assertions(1);
    const storages = {
      storage: 1
    };
    try {
      const storage = new BlobStoragePartitioner(storages);
      await storage.init();
    } catch (e) {
      expect(e.message).toBe(
        'Storages need to be provided as string. like "account:accountKey;account2:accountKey2"'
      );
    }
  });

  it("should throw an error if storages string is not formated correctly", async () => {
    expect.assertions(1);
    const storages =
      "mystorageaccount0:accessKey0;mystorageaccount1:accessKey1;mystorageaccount2:accessKey2;";
    try {
      const storage = new BlobStoragePartitioner(storages);
      await storage.init();
    } catch (e) {
      expect(e.message).toBe(
        "Make sure yous tring is correctly formated. account and accountKey are seperated by colon and additional storages are seperated by semicolon. The string has to end without semicolon"
      );
    }
  });
});

describe("Save to blob storage cache", () => {
  it("should save text content to a blob storage and create a new container", async () => {
    const storage = new BlobStoragePartitioner("mystorageaccount0:accessKey0");
    await storage.init();

    const content = "my content";
    const id = uuid();
    await storage.saveToCache(content, "test_file.txt", id);
    const cachedContent = await storage.loadFromCache("test_file.txt", id);
    expect(cachedContent).toBe(content);
  });

  it("should save text content to a blob storage using an existing container", async () => {
    const storage = new BlobStoragePartitioner("mystorageaccount0:accessKey0");
    await storage.init();

    const id = uuid();
    await storage.saveToCache("new container", "file1.txt", id);
    await storage.saveToCache("exising container", "file2.txt", id);
    const cachedContent = await storage.loadFromCache("file2.txt", id);
    expect(cachedContent).toBe("exising container");
  });

  it("should distribute ids to storages equally", async () => {
    const storage = new BlobStoragePartitioner(
      "mystorageaccount0:accessKey0;mystorageaccount1:accessKey1;mystorageaccount2:accessKey2"
    );
    await storage.init();

    // generate 10.000 entries
    entryCount = 10000;
    for (let i = 0; i < entryCount; i++) {
      const id = uuid();
      await storage.saveToCache("content", "test_file.txt", id);
    }

    // every storage should have ~3.333 entries
    expect(storage.clients).toHaveLength(3);
    for (const client of storage.clients) {
      expect(Object.keys(client.blobStorages.container).length).toBeGreaterThan(
        (entryCount / 3) * 0.9
      );
      expect(Object.keys(client.blobStorages.container).length).toBeLessThan(
        (entryCount / 3) * 1.1
      );
    }
  });

  it("should throw an error if the operation fails", async () => {
    expect.assertions(1);

    try {
      const storage = new BlobStoragePartitioner(
        "mystorageaccount0:accessKey0"
      );
      await storage.init();

      const id = uuid();
      await storage.saveToCache("fail", "saving_fails.txt", id);
    } catch (e) {
      expect(e.message).toBe("Saving failed");
    }
  });
});

describe("Delete at blob storage cache", () => {
  it("should delete a container on a blob storage", async () => {
    const storage = new BlobStoragePartitioner("mystorageaccount0:accessKey0");
    await storage.init();

    const id = uuid();
    await storage.saveToCache("content", "file.txt", id);
    const cachedContent = await storage.loadFromCache("file.txt", id);
    expect(cachedContent).toBe("content");

    await storage.deleteCache(id);
    const deletedContent = await storage.loadFromCache("file.txt", id);
    expect(deletedContent).toBe("");
  });

  it("should throw error if operation faile", async () => {
    expect.assertions(1);

    try {
      const storage = new BlobStoragePartitioner(
        "mystorageaccount0:accessKey0"
      );
      await storage.init();
      await storage.deleteCache("fails");
    } catch (e) {
      expect(e.message).toBe("Deletion failed");
    }
  });
});
