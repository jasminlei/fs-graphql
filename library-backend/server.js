const { ApolloServer } = require('@apollo/server')
const { startStandaloneServer } = require('@apollo/server/standalone')

const { typeDefs } = require('./schema')
const { resolvers } = require('./resolvers')

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const startServer = async (port) => {
  const { url } = await startStandaloneServer(server, {
    listen: { port },
  })
  console.log(`Server ready at ${url}`)
}

module.exports = startServer
