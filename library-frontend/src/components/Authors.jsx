import { gql } from '@apollo/client'
import { useMutation, useQuery } from '@apollo/client/react'

import { useState } from 'react'

const ALL_AUTHORS = gql`
  query {
    allAuthors {
      name
      born
      bookCount
      id
    }
  }
`

const EDIT_AUTHOR = gql`
  mutation EditAuthor($name: String!, $setBornTo: Int!) {
    editAuthor(name: $name, setBornTo: $setBornTo) {
      name
      born
      id
    }
  }
`

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
  const selectedName = name || ''

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
    </div>
  )
}

export default Authors
