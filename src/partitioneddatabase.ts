import { JSONLinesDataBase, JsonLinesDataBase } from "./jsonlinesdb";

function PartitionedDatabase(partitionKey: string) {
  // replace with better type
  const partitons = new Map<string, JSONLinesDataBase>();
  const keyToPartition = new Map<any, string>();

  function add(partitionValue: string, objectKeyName: string) {
    const db = JsonLinesDataBase(partitionValue, objectKeyName);
    partitons.set(partitionValue, db);
  }

  async function write(object: Record<string, any>) {
    const partitionValue = object[partitionKey];
    // typeof === string
    if (!partitionValue) {
      throw new Error("missing partition value");
    }
    let db = partitons.get(partitionValue);
    if (!db) {
      // maybe have it created here??
      throw new Error("partition not avaiable");
    }

    await db.write(object);
    keyToPartition.set(object[db.keyName()], partitionValue);
  }

  async function get(key: string): Promise<any> {
    const partitionKey = keyToPartition.get(key);
    if (!partitionKey) {
      return undefined;
    }

    const db = partitons.get(partitionKey);
    if (!db) {
      return undefined;
    }

    return await db.get(key);
  }

  return {
    get,
    add,
    write,
  };
}

export { PartitionedDatabase };
