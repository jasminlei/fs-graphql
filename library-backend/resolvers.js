const Author = require('./models/author')
const Book = require('./models/book')

const resolvers = {
  Query: {
    bookCount: async () => Book.countDocuments({}),
    authorCount: async () => Author.countDocuments({}),

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
    addBook: async (root, args) => {
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
    },

    editAuthor: async (root, args) => {
      const authorToEdit = await Author.findOne({ name: args.name })

      if (!authorToEdit) {
        return null
      }

      authorToEdit.born = args.setBornTo
      return authorToEdit.save()
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

module.exports = {
  resolvers,
}
