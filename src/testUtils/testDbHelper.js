import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

// Extend the default timeout so MongoDB binaries can download when first run
jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;

export default class TestDbHelper {
  constructor() {
    this.db = null;
    this.server = new MongoMemoryServer();
    this.connection = null;
  }

  /**
   * Start the server and establish a connection
   */
  async start() {
    const url = await this.server.getConnectionString();
    this.connection = await MongoClient.connect(
      url,
      { useNewUrlParser: true }
    );
    this.db = this.connection.db(await this.server.getDbName());
  }

  /**
   * Close the connection and stop the server
   */
  stop() {
    this.connection.close();
    return this.server.stop();
  }

  /**
   * Delete all collections and indexes
   */
  async cleanup() {
    const collections = await this.db.listCollections().toArray();
    return Promise.all(
      collections
        .map(({ name }) => name)
        .map(collection => this.db.collection(collection).drop())
    );
  }

  /**
   * Manually insert a document into the database and return the created document
   * @param {string} collectionName
   * @param {Object} document
   */
  async createDoc(collectionName, document) {
    const { ops } = await this.db
      .collection(collectionName)
      .insertOne(document);
    return ops[0];
  }
}
