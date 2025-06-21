import type { ConditionNode } from '../../conditionTree'
import { isLeaf } from '../../conditionTree'
import type { Model } from '../../query'
import type { CommandParameters } from '..'

/**
 * 条件式を組み立てる
 * @param node 条件ノード
 * @param index プレースホルダインデックス
 * @returns 組み立てられたクエリと次のインデックス
 */
export const buildExpression = <M extends Model>(
  node: ConditionNode<M>,
  index: number,
): {
  query: string
  index: number
} => {
  if (isLeaf(node)) {
    const query = ['(', node.key, node.operator, `?${index}`, ')'].join(' ')
    return {
      query,
      index: index + 1,
    }
  } else {
    let currentIndex = index
    const queries: string[] = []
    for (const childNode of node.items) {
      const result = buildExpression(childNode, currentIndex)
      currentIndex = result.index
      queries.push(result.query)
    }

    const children = queries.join(node.type === 'every' ? ' AND ' : ' OR ')
    const query = ['(', children, ')'].join(' ')
    return {
      query,
      index: currentIndex,
    }
  }
}

/**
 * 条件式に必要なパラメータの配列を構成する
 * @param node 条件ノード
 * @returns パラメータの配列
 */
export const buildParams = <M extends Model>(
  node: ConditionNode<M>,
): CommandParameters<M>[] => {
  if (isLeaf(node)) {
    return [node.value]
  }

  return node.items.map(buildParams).flat()
}
