const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')
const jwt = require('jsonwebtoken')

const typeDefs = require('./schema')
const resolvers = require('./resolvers')
const User = require('./models/user')

const getUserFromAuthHeader = async (auth) => {
  if (!auth) {
    return null
  }

  if (!auth.toLowerCase().startsWith('bearer ')) {
    return null
  }

  try {
    const decodedToken = jwt.verify(auth.substring(7), process.env.JWT_SECRET)
    return await User.findById(decodedToken.id)
  } catch {
    return null
  }
}

const startServer = async (port) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  })

  const { url } = await startStandaloneServer(server, {
    listen: { port },
    context: async ({ req }) => {
      const auth = req?.headers?.authorization
      const currentUser = await getUserFromAuthHeader(auth)
      return { currentUser }
    },
  })

  console.log(`Server ready at ${url}`)
}

module.exports = startServer
