# azure-blob-storage-partitioner

[![Build Status](https://travis-ci.com/Nowtilus/azure-blob-storage-partitioner.svg?branch=master)](https://travis-ci.com/Nowtilus/azure-blob-storage-partitioner) [![Coverage Status](https://coveralls.io/repos/github/Nowtilus/azure-blob-storage-partitioner/badge.svg?branch=master)](https://coveralls.io/github/Nowtilus/azure-blob-storage-partitioner?branch=master)

This module can be a good fit if you have millions of items to cache in Azure that eceed the limits of a single azure blob storage account.

https://docs.microsoft.com/de-de/azure/azure-resource-manager/management/azure-subscription-service-limits#storage-limits

e.g.

- Maximum request rate per storage account - 20,000 requests per second
- Maximum ingress1 per storage account (US, Europe regions) - 25 Gbps
- Maximum storage account capacity 5 PiB

Note: The numbers are copied from azure at 2020-04-24

Please also note that you need a unique id that you can refer to later. Preferably uuid/v4 to partion the files on multiple storage accounts.

## Getting Started

```js
const BlobStoragePartioner = require("./BlobStoragePartioner");
const uuid = require("uuid/v4");

async function test() {
  /* INIT */
  const storages = "mystorageaccount0:accessKey0;mystorageaccount1:accessKey1"; // you can specify a virtually endless amount of storage accounts

  const BlobStorage = new BlobStoragePartioner(storages);
  await BlobStorage.init();

  /* CACHE */
  const sessionId = uuid(); // this should be persisted somewhere

  await BlobStorage.saveToCache("my content", "my_file.txt", sessionId);
  await BlobStorage.saveToCache("my content", "my_file_2.txt", sessionId);
  const cached = await BlobStorage.loadFromCache("my_file.txt", sessionId);
  console.log(sessionId, cached);
  const cached2 = await BlobStorage.loadFromCache("my_file_2.txt", sessionId);
  console.log(sessionId, cached2);

  // delete everything when the session is no longer active
  await BlobStorage.deleteCache(sessionId);
}

test();
```
