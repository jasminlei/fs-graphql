const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const { GraphQLError } = require('graphql')
const jwt = require('jsonwebtoken')

const mongooseErrorToGraphQLError = (error, invalidArgs) => {
  if (error?.name === 'ValidationError') {
    const details = Object.values(error.errors ?? {})
      .map((e) => e.message)
      .filter(Boolean)
      .join(', ')

    return new GraphQLError(details || error.message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs,
      },
    })
  }

  if (error?.code === 11000) {
    const entries = Object.entries(error.keyValue ?? {})
    const [[field, value]] = entries.length ? entries : [[null, null]]
    const label =
      field === 'name' ? 'Name' : field === 'title' ? 'Title' : field || 'Field'
    const message = value
      ? `${label} must be unique: ${value}`
      : `${label} must be unique`

    return new GraphQLError(message, {
      extensions: {
        code: 'BAD_USER_INPUT',
        invalidArgs: value ?? invalidArgs,
      },
    })
  }

  return error
}

const resolvers = {
  Query: {
    bookCount: async () => Book.countDocuments({}),
    authorCount: async () => Author.countDocuments({}),
    me: (root, args, context) => context.currentUser,

    allBooks: async (root, args) => {
      const filter = {}

      if (args.genre) {
        filter.genres = { $in: [args.genre] }
      }

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        if (!author) {
          return []
        }
        filter.author = author._id
      }

      return Book.find(filter).populate('author')
    },

    allAuthors: async () => {
      const authors = await Author.find({})

      return Promise.all(
        authors.map(async (author) => {
          const bookCount = await Book.countDocuments({ author: author._id })
          return {
            id: author.id,
            name: author.name,
            born: author.born,
            bookCount,
          }
        }),
      )
    },
  },

  Mutation: {
    addBook: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        })
      }

      try {
        let author = await Author.findOne({ name: args.author })

        if (!author) {
          author = await new Author({ name: args.author }).save()
        }

        const book = new Book({
          title: args.title,
          published: args.published,
          author: author._id,
          genres: args.genres,
        })

        const savedBook = await book.save()
        return savedBook.populate('author')
      } catch (error) {
        throw mongooseErrorToGraphQLError(error, args)
      }
    },

    editAuthor: async (root, args, context) => {
      if (!context.currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'UNAUTHENTICATED',
          },
        })
      }

      try {
        const authorToEdit = await Author.findOne({ name: args.name })

        if (!authorToEdit) {
          return null
        }

        authorToEdit.born = args.setBornTo
        return authorToEdit.save()
      } catch (error) {
        throw mongooseErrorToGraphQLError(error, args)
      }
    },

    createUser: async (root, args) => {
      try {
        const user = new User({ ...args })
        return await user.save()
      } catch (error) {
        throw mongooseErrorToGraphQLError(error, args)
      }
    },

    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })

      if (!user || args.password !== 'secret') {
        throw new GraphQLError('wrong credentials', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }

      const userForToken = {
        username: user.username,
        id: user._id,
      }

      return { value: jwt.sign(userForToken, process.env.JWT_SECRET) }
    },

    _resetDatabase: async () => {
      if (process.env.NODE_ENV !== 'test') {
        throw new GraphQLError('_resetDatabase is only available in test mode')
      }

      await Author.deleteMany({})
      await Book.deleteMany({})
      await User.deleteMany({})
      return true
    },
  },

  Book: {
    author: async (root) => {
      if (root.author && typeof root.author === 'object' && root.author.name) {
        return root.author
      }
      return Author.findById(root.author)
    },
  },
}

module.exports = resolvers
