import { useState } from 'react'
import { useLazyQuery, useQuery } from '@apollo/client/react'
import { ALL_BOOKS } from '../queries'

const Books = (props) => {
  const [selectedGenre, setSelectedGenre] = useState(null)

  const allBooksResult = useQuery(ALL_BOOKS, {
    variables: { genre: null },
    fetchPolicy: 'cache-and-network',
    skip: !props.show,
  })

  const [fetchFilteredBooks, filteredBooksResult] = useLazyQuery(ALL_BOOKS, {
    fetchPolicy: 'cache-and-network',
  })

  const handleSelectGenre = async (genre) => {
    setSelectedGenre(genre)

    await allBooksResult.refetch?.({ genre: null })

    if (genre !== null) {
      fetchFilteredBooks({ variables: { genre } })
    }
  }

  if (!props.show) {
    return null
  }

  if (allBooksResult.loading || filteredBooksResult.loading) {
    return <div>loading...</div>
  }

  if (allBooksResult.error) {
    return <div>error: {allBooksResult.error.message}</div>
  }

  if (filteredBooksResult.error) {
    return <div>error: {filteredBooksResult.error.message}</div>
  }

  const unfilteredBooks = allBooksResult.data?.allBooks ?? []
  const genres = [...new Set(unfilteredBooks.flatMap((b) => b.genres))]

  const books =
    selectedGenre === null
      ? unfilteredBooks
      : (filteredBooksResult.data?.allBooks ?? [])

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author?.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {genres.map((g) => (
          <button key={g} onClick={() => handleSelectGenre(g)}>
            {g}
          </button>
        ))}
        <button onClick={() => handleSelectGenre(null)}>all genres</button>
      </div>
    </div>
  )
}

export default Books
