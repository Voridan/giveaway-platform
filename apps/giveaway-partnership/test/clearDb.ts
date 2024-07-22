import { Connection } from 'mongoose';

export async function clearDb(connection: Connection) {
  const collections = Object.keys(connection.collections);
  for (const collectionName of collections) {
    const collection = connection.collections[collectionName];
    await collection.deleteMany({});
  }
}
