export const resOK = (
  data?: any,
  message?: string,
  total?: number,
  limit?: number,
  page?: number,
) => {
  let meta;
  if (total && limit && page)
    meta = {
      total_pages: limit ? Math.ceil(total / limit) : 0,
      total_items: total,
      limit: limit,
      page: page,
    };

  return {
    code: 'SUCCESS',
    message: message || 'success',
    data,
    meta: meta,
  };
};

export const resErr = (message: string, code = 'ERROR', errors?: any) => ({
  code: code,
  message,
  errors,
});
