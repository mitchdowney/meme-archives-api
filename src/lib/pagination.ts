// 72 so 6 rows of 12 will fully load in smallest gallery view
const perPageTotal = 72

export const getPaginationQueryParams = (page = 1) => {
  const skip = page > 1 ? (Math.ceil(page) - 1) * perPageTotal : 0

  return {
    take: perPageTotal,
    skip
  }
}
