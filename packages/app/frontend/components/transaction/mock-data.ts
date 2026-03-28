import type { TransactionType } from '@frontend/lib/types'

import type { CategoryColor, CategoryIconType } from '../category/types'

// モックデータ：本番ではAPIから取得する
export const MOCK_CATEGORIES: {
  id: string
  name: string
  type: TransactionType
  isSaving: boolean
  icon: CategoryIconType
  color: CategoryColor
}[] = [
  {
    id: 'cat-1',
    name: '食費',
    type: 'expense',
    isSaving: false,
    icon: 'utensils',
    color: 'red',
  },
  {
    id: 'cat-2',
    name: '交通費',
    type: 'expense',
    isSaving: false,
    icon: 'bus',
    color: 'blue',
  },
  {
    id: 'cat-3',
    name: '外食',
    type: 'expense',
    isSaving: false,
    icon: 'coffee',
    color: 'orange',
  },
  {
    id: 'cat-4',
    name: '娯楽・グッズ',
    type: 'expense',
    isSaving: false,
    icon: 'music',
    color: 'purple',
  },
  {
    id: 'cat-5',
    name: '衣服',
    type: 'expense',
    isSaving: false,
    icon: 'shirt',
    color: 'pink',
  },
  {
    id: 'cat-6',
    name: '日用品',
    type: 'expense',
    isSaving: false,
    icon: 'shopping_cart',
    color: 'teal',
  },
  {
    id: 'cat-7',
    name: '美容',
    type: 'expense',
    isSaving: false,
    icon: 'heart_pulse',
    color: 'pink',
  },
  {
    id: 'cat-8',
    name: '積立：遠征費',
    type: 'expense',
    isSaving: true,
    icon: 'plane',
    color: 'blue',
  },
  {
    id: 'cat-9',
    name: '積立：グッズ',
    type: 'expense',
    isSaving: true,
    icon: 'gift',
    color: 'purple',
  },
  {
    id: 'cat-11',
    name: '積立：旅行費',
    type: 'expense',
    isSaving: true,
    icon: 'plane',
    color: 'teal',
  },
  {
    id: 'cat-12',
    name: '積立：機材費',
    type: 'expense',
    isSaving: true,
    icon: 'zap',
    color: 'yellow',
  },
  {
    id: 'cat-13',
    name: '積立：緊急資金',
    type: 'expense',
    isSaving: true,
    icon: 'piggy_bank',
    color: 'green',
  },
  {
    id: 'cat-10',
    name: '給与',
    type: 'income',
    isSaving: false,
    icon: 'wallet',
    color: 'green',
  },
]

export const MOCK_EVENTS = [
  { id: 'ev-1', name: 'バレンタインイベント' },
  { id: 'ev-2', name: '春ライブ遠征' },
  { id: 'ev-3', name: '春グッズ' },
]
