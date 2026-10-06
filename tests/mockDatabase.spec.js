import React, { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Field } from '../src/App.jsx'
import { createRepository } from '../src/data/mockDatabase.js'

describe('repositorio simulado', () => {
  let storage
  let repository

  beforeEach(() => {
    const values = new Map()
    storage = {
      getItem: key => values.has(key) ? values.get(key) : null,
      setItem: (key, value) => values.set(key, value),
    }
    repository = createRepository('records', [{ id: 1, nombre: 'Inicial' }], storage)
  })

  it('crea, consulta, actualiza y elimina registros persistidos', () => {
    const created = repository.create({ nombre: 'Nuevo' })
    expect(repository.findById(created.id).nombre).toBe('Nuevo')
    expect(repository.update(created.id, { nombre: 'Editado' }).nombre).toBe('Editado')
    repository.remove(created.id)
    expect(repository.list()).toEqual([{ id: 1, nombre: 'Inicial' }])
    expect(storage.getItem('records')).toBe('[{"id":1,"nombre":"Inicial"}]')
  })

  it('rechaza identificadores duplicados y registros inexistentes', () => {
    expect(() => repository.create({ id: 1, nombre: 'Duplicado' })).toThrowError(/Ya existe/)
    expect(() => repository.update(99, { nombre: 'No existe' })).toThrowError(/No existe/)
    expect(() => repository.remove(99)).toThrowError(/No existe/)
  })
})

describe('renderizado e interacciones React', () => {
  let container
  let root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('renderiza props y actualiza el estado al recibir un evento', () => {
    function Counter({ label }) {
      const [count, setCount] = useState(0)
      return React.createElement('button', { onClick: () => setCount(value => value + 1) }, `${label}: ${count}`)
    }

    act(() => root.render(React.createElement(Counter, { label: 'Unidades' })))
    const button = container.querySelector('button')
    expect(button.textContent).toBe('Unidades: 0')
    act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(button.textContent).toBe('Unidades: 1')
  })

  it('renderiza el componente de formulario con las props recibidas', () => {
    act(() => root.render(React.createElement(Field, {
      name: 'email',
      label: 'Correo electrónico',
      type: 'email',
      defaultValue: 'cliente@prostock.cl',
    })))
    expect(container.querySelector('label').textContent).toBe('Correo electrónico')
    expect(container.querySelector('input').type).toBe('email')
    expect(container.querySelector('input').value).toBe('cliente@prostock.cl')
  })
})
