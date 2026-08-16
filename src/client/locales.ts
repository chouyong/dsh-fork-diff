export type LocaleKey =
  | 'trigger'
  | 'dialog.title'
  | 'dialog.close'
  | 'dialog.compareWith'
  | 'dialog.current'
  | 'dialog.openSession'
  | 'relation.sibling'
  | 'relation.parent'
  | 'relation.child'
  | 'state.loading'
  | 'state.empty'
  | 'state.retry'
  | 'filter.changes'
  | 'filter.all'
  | 'status.same'
  | 'status.changed'
  | 'status.left-only'
  | 'status.right-only'

const ZH: Record<LocaleKey, string> = {
  trigger: '比较分支',
  'dialog.title': '分支对比',
  'dialog.close': '关闭分支对比',
  'dialog.compareWith': '比较对象',
  'dialog.current': '当前分支',
  'dialog.openSession': '打开会话',
  'relation.sibling': '兄弟分支',
  'relation.parent': '父分支',
  'relation.child': '子分支',
  'state.loading': '正在读取两个分支的完整历史…',
  'state.empty': '当前筛选下没有差异。',
  'state.retry': '重试',
  'filter.changes': '仅差异',
  'filter.all': '全部',
  'status.same': '相同',
  'status.changed': '已修改',
  'status.left-only': '仅当前分支',
  'status.right-only': '仅比较分支',
}

const EN: Record<LocaleKey, string> = {
  trigger: 'Compare forks',
  'dialog.title': 'Fork diff',
  'dialog.close': 'Close fork diff',
  'dialog.compareWith': 'Compare with',
  'dialog.current': 'Current fork',
  'dialog.openSession': 'Open session',
  'relation.sibling': 'Sibling fork',
  'relation.parent': 'Parent fork',
  'relation.child': 'Child fork',
  'state.loading': 'Loading complete histories…',
  'state.empty': 'No differences match this filter.',
  'state.retry': 'Retry',
  'filter.changes': 'Changes only',
  'filter.all': 'All',
  'status.same': 'Same',
  'status.changed': 'Changed',
  'status.left-only': 'Current only',
  'status.right-only': 'Comparison only',
}

export type Translate = (key: LocaleKey) => string

export function createTranslate(): Translate {
  const language = typeof document === 'undefined' ? 'zh' : document.documentElement.lang
  const dictionary = language.toLowerCase().startsWith('en') ? EN : ZH
  return key => dictionary[key]
}
