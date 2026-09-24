-- ============================================================================
-- Orbital Balance — Reserve transaction type (0006)
-- Adds 'reserve' as a transaction type: money sent to a reserve/investment/
-- caixinha. It subtracts from the balance like an expense, but is never
-- counted as an expense (necessity tagging, "despesas" totals, reports).
-- ============================================================================

alter type public.transaction_type add value if not exists 'reserve';
