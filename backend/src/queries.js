// Data alat + jumlah yang sedang dipinjam + stok tersedia. Selalu diakhiri WHERE, boleh disambung AND ...
exports.TOOL_SELECT = `
  SELECT t.id, t.name, t.description, t.image, t.category, t.item_condition, t.stock_total,
         COALESCE(b.n, 0) AS stock_borrowed,
         t.stock_total - COALESCE(b.n, 0) AS stock_available
  FROM tools t
  LEFT JOIN (SELECT tool_id, COUNT(*) AS n FROM loans WHERE status = 'Belum Dikembalikan' GROUP BY tool_id) b
         ON b.tool_id = t.id
  WHERE t.is_deleted = 0`;
