export default class Product {
  constructor(db) {
    this.db = db;
    this.collectionName = "products";
    this.collection = db.collection(this.collectionName);
  }

  /**
   * Find a specific product document by ID
   * @param {ObjectID} productId
   */
  findById(productId) {
    return this.collection.findOne({ _id: productId });
  }

  /**
   * Find a list of product documents by IDs
   * @param {ObjectID[]} ids
   */
  findByIds(ids) {
    return this.collection.find({ _id: { $in: ids } }).toArray();
  }

  /**
   * Find a list of product documents with the provided brand
   * @param {string} brandName
   * @param {MongoSort} [sort]
   */
  findByBrand(brandName, sort = {}) {
    return this.collection
      .find({ brand: brandName })
      .sort(sort)
      .toArray();
  }

  /**
   * Return a custom serialized product object
   * @param {ObjectID} productId
   */
  async serialize(productId) {
    const product = await this.findById(productId);
    const relatedProducts = await this.findByIds(product.relatedProducts);

    return {
      id: product._id.toString(),
      model: product.modelNum,
      sku: `${product.brand}-${product.modelNum}`,
      title: product.name,
      brandName: product.brand,
      price: product.salePrice,
      listPrice: product.msrp,
      discount:
        product.salePrice < product.msrp
          ? Math.abs(product.salePrice - product.msrp)
          : 0,
      discountPercent:
        product.salePrice < product.msrp
          ? Math.ceil(
              Math.abs(
                ((product.salePrice - product.msrp) / product.msrp) * 100
              )
            )
          : 0,
      relatedProducts: relatedProducts.map(relatedProduct => ({
        id: relatedProduct._id.toString(),
        title: relatedProduct.name,
        brandName: relatedProduct.brand
      }))
    };
  }
}
