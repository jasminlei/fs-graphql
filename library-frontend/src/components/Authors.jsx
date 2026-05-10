import { useMutation, useQuery } from '@apollo/client/react'
import { useState } from 'react'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'

const Authors = (props) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const result = useQuery(ALL_AUTHORS, {
    skip: !props.show,
  })

  const [editAuthor] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
    awaitRefetchQueries: true,
  })

  const authors = result.data?.allAuthors ?? []
  const selectedName = name || authors[0]?.name || ''

  if (!props.show) {
    return null
  }

  if (result.loading) {
    return <div>loading...</div>
  }

  if (result.error) {
    return <div>error: {result.error.message}</div>
  }

  const submit = async (event) => {
    event.preventDefault()

    if (!selectedName || born === '') {
      return
    }

    await editAuthor({
      variables: {
        name: selectedName,
        setBornTo: Number(born),
      },
    })

    setBorn('')
  }

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.map((a) => (
            <tr key={a.id}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {props.token ? (
        <>
          <h3>set birthyear</h3>
          <form onSubmit={submit}>
            <div>
              <label htmlFor='name'>name</label>
              <select
                id='name'
                name='name'
                value={selectedName}
                onChange={({ target }) => setName(target.value)}
              >
                {authors.map((a) => (
                  <option key={a.name} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='born'>born</label>
              <input
                id='born'
                name='born'
                type='number'
                value={born}
                onChange={({ target }) => setBorn(target.value)}
              />
            </div>
            <button type='submit'>update author</button>
          </form>
        </>
      ) : (
        <div>log in to edit author birth year</div>
      )}
    </div>
  )
}

export default Authors
