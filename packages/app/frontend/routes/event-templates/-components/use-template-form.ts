import { useState } from 'react'

import type { FormItem } from './template-form-item'
import { newFormItem } from './template-form-item'

export const useTemplateForm = (
  initialName = '',
  initialItems?: FormItem[],
) => {
  const [templateName, setTemplateName] = useState(initialName)
  const [items, setItems] = useState<FormItem[]>(
    initialItems ?? [newFormItem()],
  )

  const addItem = () => {
    setItems((prev) => [...prev, newFormItem()])
  }

  const removeItem = (uid: string) => {
    setItems((prev) => prev.filter((it) => it.uid !== uid))
  }

  const updateItem = (uid: string, patch: Partial<Omit<FormItem, 'uid'>>) => {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)),
    )
  }

  const isValid =
    templateName.trim().length > 0 &&
    items.length > 0 &&
    items.every(
      (it) => it.categoryId && it.name.trim() && parseInt(it.amount, 10) > 0,
    )

  return {
    templateName,
    setTemplateName,
    items,
    addItem,
    removeItem,
    updateItem,
    isValid,
  }
}
