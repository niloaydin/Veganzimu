const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate')
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  addresses: [], // Ya array yap ya da methodu sil
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      autopopulate: { maxDepth: 2 },
    },
  ],
  likesProduct: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      autopopulate: { maxDepth: 2 },
    },
  ],
})
class User {
  async addOrder(order) {
    this.orders.push(order)
    await this.save()
  }

  async addAddress(address) {
    this.addresses.push(address)
    await this.save()
  }

  async getAddresses() {
    return this.addresses
  }

  async likeProduct(product) {
    this.likesProduct.push(product)
    product.likedBy.push(this)

    await product.save()
    await this.save()
  }
}

userSchema.loadClass(User)
userSchema.plugin(autopopulate)
userSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
})

module.exports = mongoose.model('User', userSchema)
