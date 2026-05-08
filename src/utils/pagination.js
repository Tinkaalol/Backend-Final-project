
export function encodeCursor(id) {
  return Buffer.from(JSON.stringify({ id })).toString('base64');
}

export function decodeCursor(cursor) {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    return decoded.id;
  } catch {
    return null;
  }
}

export function buildPaginationArgs(query) {
  const limit = Math.min(parseInt(query.limit) || 20, 100);
  const cursor = query.cursor ? decodeCursor(query.cursor) : null;

  return {
    take: limit + 1, 
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    limit,
  };
}

export function buildPaginationResponse(items, limit) {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? encodeCursor(data[data.length - 1].id) : null;

  return {
    data,
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
  };
}
