/**
 * @typedef {Object} PaginationMeta
 * @property {number} [page]
 * @property {number} [limit]
 * @property {number} [total]
 * @property {number} [totalPages]
 */

/**
 * @typedef {Object} ApiSuccessResponse
 * @property {boolean} [success]
 * @property {string} [message]
 * @property {unknown} [data]
 * @property {PaginationMeta | Record<string, unknown>} [meta]
 */

/**
 * @typedef {Object} ApiErrorResponse
 * @property {boolean} [success]
 * @property {string} [code]
 * @property {string} [message]
 * @property {Record<string, string[] | string>} [errors]
 * @property {Record<string, string[] | string>} [fieldErrors]
 * @property {string} [requestId]
 */

/**
 * @typedef {Object} MoneyMinor
 * @property {number} amount
 * @property {string} currency
 */

/**
 * @typedef {Object} CurrentUser
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [email]
 * @property {string} [role]
 * @property {string[]} [roles]
 * @property {boolean} [totpVerified]
 * @property {boolean} [requiresTotp]
 * @property {boolean} [isActive]
 */

/**
 * @typedef {Object} SessionState
 * @property {boolean} isLoading
 * @property {boolean} isAuthenticated
 * @property {boolean} totpRequired
 * @property {CurrentUser | null} user
 * @property {string | null} role
 * @property {unknown} [session]
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} name
 * @property {string} [slug]
 */

/**
 * @typedef {Object} VehicleBrand
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} VehicleModel
 * @property {string} id
 * @property {string} name
 * @property {string} [brandId]
 */

/**
 * @typedef {Object} PartsBrand
 * @property {string} id
 * @property {string} name
 */

/**
 * @typedef {Object} ProductSummary
 * @property {string} id
 * @property {string} name
 * @property {string} [slug]
 * @property {MoneyMinor} [price]
 * @property {boolean} [inStock]
 */

/**
 * @typedef {ProductSummary & {
 *   description?: string,
 *   compatibility?: Array<Record<string, unknown>>
 * }} ProductDetail
 */

/**
 * @typedef {Object} OrderSummary
 * @property {string} orderNumber
 * @property {string} status
 * @property {MoneyMinor} [total]
 */

/**
 * @typedef {Object} NotificationSummary
 * @property {string} id
 * @property {string} title
 * @property {boolean} [read]
 * @property {string} [createdAt]
 */
