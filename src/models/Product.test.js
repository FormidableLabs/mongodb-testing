import TestDbHelper from "../testUtils/testDbHelper";
import Product from "./Product";

const dbHelper = new TestDbHelper();

beforeAll(async () => {
  await dbHelper.start();
});

afterAll(async () => {
  await dbHelper.stop();
});

let product;
beforeEach(async () => {
  product = new Product(dbHelper.db);
});

afterEach(async () => {
  await dbHelper.cleanup();
});

describe("findById", () => {
  test("should return the correct document by ID", async () => {
    // 1. Insert the desired documents and collections into the database
    const { product2 } = await createSampleProducts();

    // 2. Call the method under test with the parameters needed for the desired outcome
    const result = await product.findById(product2._id);

    // 3. Make assertions on the result
    expect(result).toMatchObject(product2);
  });

  test("should return null if a document with the provided ID could not be found", async () => {
    const result = await product.findById("123456789123");
    expect(result).toBeNull();
  });
});

describe("findByIds", () => {
  test("should return the correct documents by ID", async () => {
    const { product1, product3 } = await createSampleProducts();
    const result = await product.findByIds([product1._id, product3._id]);
    expect(result).toMatchObject([product1, product3]);
  });

  test("should return empty array if documents with the provided IDs could not be found", async () => {
    const result = await product.findByIds(["123456789123"]);
    expect(result).toEqual([]);
  });
});

describe("findByBrand", () => {
  test("should return matching documents with no sort", async () => {
    const { product1, product3 } = await createSampleProducts();
    const result = await product.findByBrand("Bernina");
    expect(result).toEqual([product1, product3]);
  });

  test("should return matching documents with custom sort", async () => {
    const { product1, product3 } = await createSampleProducts();
    const result = await product.findByBrand("Bernina", { salePrice: 1 });
    expect(result).toEqual([product3, product1]); // sorted by sale price, ascending
  });

  test("should return empty array if there are no matches", async () => {
    const { product1, product3 } = await createSampleProducts();
    const result = await product.findByBrand("Unknown");
    expect(result).toEqual([]);
  });
});

describe("serialize", () => {
  test("should return correct shape", async () => {
    const { product4 } = await createSampleProducts();
    const result = await product.serialize(product4._id);

    expect(result).toMatchObject({
      id: String(product4._id),
      model: "NQ3600D",
      title: "Sewing & Embroidery Machine",
      brandName: "Brother",
      price: 219.99,
      listPrice: 249.99,
      // we'll test these in more detail in another test
      sku: expect.any(String),
      discount: expect.any(Number),
      discountPercent: expect.any(Number),
      relatedProducts: expect.any(Array)
    });
  });

  test("should return the correct SKU", async () => {
    const { product4 } = await createSampleProducts();
    const { sku } = await product.serialize(product4._id);
    expect(sku).toBe("Brother-NQ3600D");
  });

  test("should return the correct discount if msrp is higher than sale price", async () => {
    const { product4 } = await createSampleProducts();
    const { discount, discountPercent } = await product.serialize(product4._id);
    expect(discount).toBe(30);
    expect(discountPercent).toBe(13);
  });

  test("should return a zero discount if msrp is lower than sale price", async () => {
    const { product1 } = await createSampleProducts();
    const { discount, discountPercent } = await product.serialize(product1._id);
    expect(discount).toBe(0);
    expect(discountPercent).toBe(0);
  });

  test("should return a zero discount if msrp is not set", async () => {
    const { product2 } = await createSampleProducts();
    const { discount, discountPercent } = await product.serialize(product2._id);
    expect(discount).toBe(0);
    expect(discountPercent).toBe(0);
  });

  test("should return the correct related products", async () => {
    const { product1, product3, product4 } = await createSampleProducts();
    const { relatedProducts } = await product.serialize(product4._id);

    expect(relatedProducts).toEqual([
      {
        id: String(product1._id),
        title: "PLUS Sewing Quilting Machine",
        brandName: "Bernina"
      },
      {
        id: String(product3._id),
        title: "L460 Overlocker",
        brandName: "Bernina"
      }
    ]);
  });

  test("should return an empty array if there are no related products", async () => {
    const { product1 } = await createSampleProducts();
    const { relatedProducts } = await product.serialize(product1._id);
    expect(relatedProducts).toEqual([]);
  });
});

/**
 * Insert set of sample products into the database
 */
async function createSampleProducts() {
  const product1 = await dbHelper.createDoc(product.collectionName, {
    name: "PLUS Sewing Quilting Machine",
    modelNum: "B880",
    brand: "Bernina",
    salePrice: 349.99,
    msrp: 329.99,
    relatedProducts: []
  });
  const product2 = await dbHelper.createDoc(product.collectionName, {
    name: "Mechanical Sewing Machine with Foot Pedal",
    modelNum: "10",
    brand: "Alphasew",
    salePrice: 79.99,
    relatedProducts: []
  });
  const product3 = await dbHelper.createDoc(product.collectionName, {
    name: "L460 Overlocker",
    modelNum: "L460",
    brand: "Bernina",
    salePrice: 189.99,
    relatedProducts: []
  });
  const product4 = await dbHelper.createDoc(product.collectionName, {
    name: "Sewing & Embroidery Machine",
    modelNum: "NQ3600D",
    brand: "Brother",
    salePrice: 219.99,
    msrp: 249.99,
    relatedProducts: [product1._id, product3._id]
  });

  return { product1, product2, product3, product4 };
}
