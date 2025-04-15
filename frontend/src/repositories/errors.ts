/** Repositoryレイヤのエラー */
export class RepositoryError extends Error {}

/** ネットワークエラー */
export class NetworkError extends RepositoryError {}
