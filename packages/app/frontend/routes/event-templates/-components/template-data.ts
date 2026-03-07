export type TemplateItem = {
  id: string
  categoryId: string
  categoryName: string
  name: string
  amount: number
  type: 'income' | 'expense'
}

export type TemplateDetail = {
  id: string
  name: string
  items: TemplateItem[]
}

// モックデータ：本番ではAPIから /event-templates を取得する
export const TEMPLATE_DETAILS: Record<string, TemplateDetail> = {
  'tmpl-1': {
    id: 'tmpl-1',
    name: 'ライブ遠征',
    items: [
      {
        id: 'i-1',
        categoryId: 'cat-2',
        categoryName: '交通費',
        name: '新幹線代',
        amount: 8000,
        type: 'expense',
      },
      {
        id: 'i-2',
        categoryId: 'cat-4',
        categoryName: '娯楽・グッズ',
        name: 'ライブグッズ',
        amount: 10000,
        type: 'expense',
      },
      {
        id: 'i-3',
        categoryId: 'cat-3',
        categoryName: '外食',
        name: '遠征ご飯',
        amount: 3000,
        type: 'expense',
      },
    ],
  },
  'tmpl-2': {
    id: 'tmpl-2',
    name: 'グッズ購入',
    items: [
      {
        id: 'i-4',
        categoryId: 'cat-4',
        categoryName: '娯楽・グッズ',
        name: 'グッズ購入',
        amount: 5000,
        type: 'expense',
      },
      {
        id: 'i-5',
        categoryId: 'cat-2',
        categoryName: '交通費',
        name: '交通費',
        amount: 1000,
        type: 'expense',
      },
    ],
  },
  'tmpl-3': {
    id: 'tmpl-3',
    name: 'イベント参加（日帰り）',
    items: [
      {
        id: 'i-6',
        categoryId: 'cat-2',
        categoryName: '交通費',
        name: '電車代',
        amount: 2000,
        type: 'expense',
      },
      {
        id: 'i-7',
        categoryId: 'cat-4',
        categoryName: '娯楽・グッズ',
        name: 'チケット',
        amount: 8000,
        type: 'expense',
      },
      {
        id: 'i-8',
        categoryId: 'cat-3',
        categoryName: '外食',
        name: '食事',
        amount: 1500,
        type: 'expense',
      },
    ],
  },
  'tmpl-4': {
    id: 'tmpl-4',
    name: '給料日',
    items: [
      {
        id: 'i-9',
        categoryId: 'cat-1',
        categoryName: '給与・賞与',
        name: '給与',
        amount: 250000,
        type: 'income',
      },
      {
        id: 'i-10',
        categoryId: 'cat-1',
        categoryName: '給与・賞与',
        name: 'RW手当',
        amount: 5000,
        type: 'income',
      },
      {
        id: 'i-11',
        categoryId: 'cat-5',
        categoryName: '社会保険料',
        name: '厚生年金',
        amount: 15000,
        type: 'expense',
      },
      {
        id: 'i-12',
        categoryId: 'cat-6',
        categoryName: '税金',
        name: '住民税',
        amount: 8000,
        type: 'expense',
      },
      {
        id: 'i-13',
        categoryId: 'cat-6',
        categoryName: '税金',
        name: '市県民税',
        amount: 5000,
        type: 'expense',
      },
    ],
  },
}
