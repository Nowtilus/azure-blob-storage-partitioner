# azure-blob-storage-partitioner

[![Build Status](https://travis-ci.com/Nowtilus/azure-blob-storage-partitioner.svg?branch=master)](https://travis-ci.com/Nowtilus/azure-blob-storage-partitioner) [![Coverage Status](https://coveralls.io/repos/github/Nowtilus/azure-blob-storage-partitioner/badge.svg?branch=master)](https://coveralls.io/github/Nowtilus/azure-blob-storage-partitioner?branch=master) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/dde63d0a3429443389d8cabe8e3cab1a)](https://www.codacy.com/gh/Nowtilus/azure-blob-storage-partitioner?utm_source=github.com&utm_medium=referral&utm_content=Nowtilus/azure-blob-storage-partitioner&utm_campaign=Badge_Grade)

This module can be a good fit if you have millions of items to cache in Azure that eceed the limits of a single azure blob storage account.

<https://docs.microsoft.com/de-de/azure/azure-resource-manager/management/azure-subscription-service-limits#storage-limits>

e.g.

- Maximum request rate per storage account - 20,000 requests per second
- Maximum ingress per storage account (US, Europe regions) - 25 Gbps
- Maximum storage account capacity 5 PiB

Note: The numbers are copied from azure at 2020-04-24

Please also note that you need a unique id that you can refer to later. Preferably uuid/v4 to partion the files on multiple storage accounts.

## Getting Started

Imagine you have a webservice that allows users to track their bycicle route. You now save all the tracking data for every section of the track to a distributed blob storage cache store. After the user has finished the ride, you take the route files and calculate the distance and persist it to database.

```js
const BlobStoragePartioner = require("./BlobStoragePartioner");
const uuid = require("uuid/v4");

async function test() {
  /* INIT */
  const storages = "mystorageaccount0:accessKey0;mystorageaccount1:accessKey1"; // you can specify a virtually endless amount of storage accounts

  const storageCluster = new BlobStoragePartitioner(storages);
  await storageCluster.init();

  /* CACHE */
  const sessionId = uuid(); // this should be persisted somewhere

  // will save the files and content always to the same storage account for the same sessionId
  await storageCluster.saveToCache("data 1", "section_a.txt", sessionId);
  await storageCluster.saveToCache("data 2", "section_b.txt", sessionId);

  // load from cache
  const a = await storageCluster.loadFromCache("section_a.txt", sessionId);
  const b = await storageCluster.loadFromCache("section_b.txt", sessionId);

  // ... work with the data you cached

  // delete everything when the session is no longer active
  await storageCluster.deleteCache(sessionId);
}

test();
```
