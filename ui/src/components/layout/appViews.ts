export const APP_VIEWS = ['board', 'categories', 'account'] as const

export type AppView = (typeof APP_VIEWS)[number]

export const VIEW_LABELS: Readonly<Record<AppView, string>> = {
  board: 'Board',
  categories: 'Categories',
  account: 'Account',
}
