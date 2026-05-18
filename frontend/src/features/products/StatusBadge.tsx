import { Badge } from '@/components/ui/Badge';
import type { ProductStatus } from '@/types/product';

const config: Record<ProductStatus, { label: string; tone: 'success' | 'warn' | 'danger' | 'neutral' }> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  DISPLAY_SAMPLE: { label: 'Display', tone: 'warn' },
  DISCONTINUED: { label: 'Discontinued', tone: 'neutral' },
  CRITICAL_DEADSTOCK: { label: 'Deadstock', tone: 'danger' },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = config[status];
  return <Badge tone={cfg.tone}>{cfg.label}</Badge>;
}
