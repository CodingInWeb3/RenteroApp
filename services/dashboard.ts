import qs from 'qs'
import { BaseURL } from '../constants'
import { UserLoginParams } from '../types/service'

/**
 * user login
 * @param params 
 * @returns 
 */
export const userLogin = async (params: UserLoginParams) => {
  const data = await fetch(`${BaseURL}/user/login?${qs.stringify(params)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8'
    },
    // credentials: 'include',
    body: JSON.stringify(params)
  })
  return await data.json()
}

/**
 * 出借者列表
 * @returns 
 */
export const lenderList = async (token: string) => {
  const data = await fetch(`${BaseURL}/order/lending/list`, {
    headers: {
      token: token
    }
  })
  return await data.json()
}

/**
 * 借用者列表
 * @returns 
 */
export const borrowerList = async () => {
  const data = await fetch(`${BaseURL}/order/borrow/list`)
  return await data.json()
}