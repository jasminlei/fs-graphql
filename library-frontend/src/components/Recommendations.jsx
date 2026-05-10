import { useQuery } from '@apollo/client/react'
import { ALL_BOOKS, ME } from '../queries'

const Recommendations = (props) => {
  const meResult = useQuery(ME, {
    skip: !props.show,
  })

  const booksResult = useQuery(ALL_BOOKS, {
    skip: !props.show,
  })

  if (!props.show) {
    return null
  }

  if (meResult.loading || booksResult.loading) {
    return <div>loading...</div>
  }

  if (meResult.error) {
    return <div>error: {meResult.error.message}</div>
  }

  if (booksResult.error) {
    return <div>error: {booksResult.error.message}</div>
  }

  const me = meResult.data?.me
  if (!me) {
    return <div>not authenticated</div>
  }

  const favouriteGenre = me.favoriteGenre
  const books = booksResult.data?.allBooks ?? []
  const recommendedBooks = books.filter((b) =>
    b.genres.includes(favouriteGenre),
  )

  return (
    <div>
      <h2>recommendations</h2>
      <div>books in your favorite genre {favouriteGenre}</div>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {recommendedBooks.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author?.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Recommendations
