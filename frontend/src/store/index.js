import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

import io from 'socket.io-client'

axios.defaults.baseURL = process.env.VUE_APP_BASE_URL
axios.defaults.withCredentials = true

Vue.use(Vuex)

const socket = io(process.env.VUE_APP_BASE_URL)

// socket.on('hello world!', () => {
//   console.log('we received message from the websocker server!')
// })

// setInterval(() => {
//   const number = Math.random()
//   console.log(`i'm sending out a request`, number)
//   socket.emit('new message', number, res => {
//     console.log('this is a response', res)
//   })
// }, 3000)

const mutations = {
  INCREMENT_COUNT: 'increment count',
  SET_USER: 'set user',
  SET_LIVE_STREAM: 'set live stream',
  ADD_LIVE_STREAM: 'add live stream',
  ADD_MESSAGE_TO_LIVE_STREAM: 'add message to live stream',
  UPDATE_CART_ORDER_ITEMS: 'update cart with order items',
}

const store = new Vuex.Store({
  state: {
    count: 0,
    user: null,
    currentLiveStream: null,
    liveStreams: [],
    liveStreamMessages: [],
    cart: { orderItems: [] },
  },
  mutations: {
    [mutations.INCREMENT_COUNT](state) {
      state.count++
    },
    [mutations.SET_USER](state, user) {
      console.log('user in store', user)
      state.user = user
    },
    [mutations.SET_LIVE_STREAM](state, live) {
      state.currentLiveStream = live
    },
    [mutations.ADD_LIVE_STREAM](state, stream) {
      state.liveStreams.push(stream)
    },
    [mutations.ADD_MESSAGE_TO_LIVE_STREAM](state, message) {
      state.liveStreamMessages.push(message)
    },
    [mutations.UPDATE_CART_ORDER_ITEMS](state, orderItems) {
      state.cart.orderItems = orderItems
    },
  },
  actions: {
    incrementCount({ commit }) {
      commit(mutations.INCREMENT_COUNT)
    },
    async fetchUser(store, id) {
      const userRequest = await axios.get(`/api/users/${id}`)
      return userRequest.data
    },
    async fetchUsers() {
      const usersRequest = await axios.get('/api/users')
      return usersRequest.data
    },
    async fetchProducts() {
      const productRequest = await axios.get('/api/products')
      return productRequest.data
    },
    async fetchProduct(store, id) {
      const productRequest = await axios.get(`/api/products/${id}`)
      return productRequest.data
    },
    async fetchOrders() {
      const orderRequest = await axios.get('/api/orders')
      return orderRequest.data
    },
    async fetchOrders(store, id) {
      const orderRequest = await axios.get(`/api/orders/${id}`)
      return orderRequest.data
    },
    async fetchSession({ commit }) {
      const user = await axios.get('/api/accounts/session')
      commit(mutations.SET_USER, user.data || null)
    },
    async login({ commit }, credentials) {
      // try {
      const user = await axios.post('/api/accounts/session', credentials)
      commit(mutations.SET_USER, user.data)
      //  } catch (e) {
      // throw e
      //}
    },
    async register(store, user) {
      return axios.post('/api/accounts', user)
    },
    async logout({ commit }) {
      await axios.delete('/api/accounts/session')
      commit(mutations.SET_USER, null)
    },
    async goLive({ state, commit }) {
      socket.emit('go live', state.user._id, () => {
        commit(mutations.SET_LIVE_STREAM, state.user._id)
      })
    },
    async addLiveStream({ commit }, stream) {
      commit(mutations.ADD_LIVE_STREAM, stream)
    },
    async addToCart({ state, commit }, { product, quantity = 1 }) {
      // check if vue supports mutable arrays in state
      // simplify the code!!!!!
      // in worst case try to libraries. Immer or immutable js
      const currentOrderItems = state.cart.orderItems.slice()

      const currentProductIndex = currentOrderItems.findIndex(orderItem => orderItem.item._id === product._id)
      if (currentProductIndex !== -1) {
        currentOrderItems.splice(currentProductIndex, 1, {
          ...currentOrderItems[currentProductIndex],
          quantity: currentOrderItems[currentProductIndex].quantity + quantity,
        })
      } else {
        currentOrderItems.push({ item: product, quantity })
      }
      commit(mutations.UPDATE_CART_ORDER_ITEMS, currentOrderItems)
    },
    async sendMessageToLiveStream({ state, commit }, body) {
      const message = {
        body,
        author: state.user.name,
      }
      commit(mutations.ADD_MESSAGE_TO_LIVE_STREAM, message)
      socket.emit('new message', state.currentLiveStream, message)
    },
    async joinStream({ commit }, stream) {
      socket.emit('join stream', stream)
      commit(mutations.SET_LIVE_STREAM, stream)
    },
    async createOrder(store, { orderItems }) {
      console.log('order items in frontend', orderItems)
      await axios.post('/api/orders', { orderItems })
    }, // This place the order. If you want to add products you should add another function for that. Create chart.
    async addAddress(store, { address }) {
      console.log('furkanin logu', address)
      const userId = store.state.user._id
      await axios.post(`/api/users/${userId}/addresses`, { address })
    },
    async likesProduct(store, { product }) {
      console.log('furkanin producti', product)
      const userId = store.state.user._id
      await axios.post(`/api/users/${userId}/likes`, { product })
    },
  },

  modules: {},
})

socket.on('new live stream', user => {
  store.dispatch('addLiveStream', user)
})

socket.on('new live stream message', message => {
  store.commit(mutations.ADD_MESSAGE_TO_LIVE_STREAM, message)
})

export default async function init() {
  await store.dispatch('fetchSession')
  return store
}
