import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '../components/Login/Login'

// Мокаем api.js
vi.mock('../services/api', () => ({
  login: vi.fn(),
}))

import { login } from '../services/api'

beforeEach(() => {
  localStorage.clear()
  login.mockReset()
})

describe('Login', () => {
  it('отображает форму с логином и паролем', () => {
    render(<Login onLogin={() => {}} showToast={() => {}} />)

    expect(screen.getByText('Together')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Введите логин')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Введите пароль')).toBeInTheDocument()
    expect(screen.getByText('Войти')).toBeInTheDocument()
  })

  it('вызывает login при сабмите формы', async () => {
    login.mockResolvedValueOnce({ session_token: 'abc123' })
    const onLogin = vi.fn()

    render(<Login onLogin={onLogin} showToast={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Введите логин'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'password' },
    })
    fireEvent.click(screen.getByText('Войти'))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('admin', 'password')
      expect(onLogin).toHaveBeenCalledWith('abc123')
    })
  })

  it('показывает ошибку при неверных данных', async () => {
    login.mockRejectedValueOnce(new Error('Неверный логин или пароль'))

    render(<Login onLogin={() => {}} showToast={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Введите логин'), {
      target: { value: 'wrong' },
    })
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByText('Войти'))

    await waitFor(() => {
      expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument()
    })
  })

  it('кнопка блокируется во время загрузки', async () => {
    // login never resolves → loading state stays
    login.mockReturnValueOnce(new Promise(() => {}))

    render(<Login onLogin={() => {}} showToast={() => {}} />)

    fireEvent.change(screen.getByPlaceholderText('Введите логин'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByPlaceholderText('Введите пароль'), {
      target: { value: 'pass' },
    })
    fireEvent.click(screen.getByText('Войти'))

    await waitFor(() => {
      expect(screen.getByText('Вход...')).toBeDisabled()
    })
  })

  it('чекбокс "Запомнить меня" работает', () => {
    render(<Login onLogin={() => {}} showToast={() => {}} />)

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('загружает сохранённые credentials из localStorage', () => {
    localStorage.setItem(
      'together_credentials',
      JSON.stringify({ username: 'saved_user', password: 'saved_pass' })
    )

    render(<Login onLogin={() => {}} showToast={() => {}} />)

    expect(screen.getByPlaceholderText('Введите логин').value).toBe('saved_user')
    expect(screen.getByPlaceholderText('Введите пароль').value).toBe('saved_pass')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })
})