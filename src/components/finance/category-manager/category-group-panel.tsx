'use client';

import { Archive, ArrowDown, ArrowUp, Pencil, Plus, RotateCcw } from 'lucide-react';

import {
  Badge,
  Button,
  Cluster,
  ColorSwatch,
  Icon,
  IconTile,
  ListRow,
  Panel,
  Text,
} from '@/components/ui';

import type { Category, Group } from './category-types';

const MoveIconSize = 16;
const ActionIconSize = 14;

type MoveHandler = (delta: number) => void;

const transactionCountLabel = (count: number) => `${count} transaction${count === 1 ? '' : 's'}`;

const categoryCountLabel = (count: number) => `${count} categor${count === 1 ? 'y' : 'ies'}`;

function MoveButtons({
  isFirst,
  isLast,
  name,
  onMove,
  variant,
}: {
  isFirst: boolean;
  isLast: boolean;
  name: string;
  onMove: MoveHandler;
  variant: 'ghost' | 'outline';
}) {
  return (
    <>
      <Button
        variant={variant}
        size="icon"
        aria-label={`Move ${name} up`}
        disabled={isFirst}
        onClick={() => onMove(-1)}
      >
        <ArrowUp size={MoveIconSize} />
      </Button>
      <Button
        variant={variant}
        size="icon"
        aria-label={`Move ${name} down`}
        disabled={isLast}
        onClick={() => onMove(1)}
      >
        <ArrowDown size={MoveIconSize} />
      </Button>
    </>
  );
}

function GroupActions({
  group,
  isFirst,
  isLast,
  onAddCategory,
  onArchive,
  onEdit,
  onMove,
}: {
  group: Group;
  isFirst: boolean;
  isLast: boolean;
  onAddCategory: () => void;
  onArchive: () => void;
  onEdit: () => void;
  onMove: MoveHandler;
}) {
  return (
    <Cluster>
      <ColorSwatch color={group.color} aria-label={`Colour ${group.color}`} />
      <MoveButtons
        name={group.name}
        variant="outline"
        isFirst={isFirst}
        isLast={isLast}
        onMove={onMove}
      />
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil size={ActionIconSize} /> Edit
      </Button>
      <Button variant="outline" size="sm" onClick={onAddCategory}>
        <Plus size={ActionIconSize} /> Category
      </Button>
      {!group.isSystem && (
        <Button
          variant="outline"
          size="sm"
          aria-label={`Archive group ${group.name}`}
          onClick={onArchive}
        >
          <Archive size={ActionIconSize} />
        </Button>
      )}
    </Cluster>
  );
}

function CategoryRow({
  category,
  color,
  isFirst,
  isLast,
  onArchive,
  onEdit,
  onMove,
}: {
  category: Category;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  onArchive: () => void;
  onEdit: () => void;
  onMove: MoveHandler;
}) {
  return (
    <ListRow
      title={category.name}
      description={transactionCountLabel(category.transactionCount)}
      leading={
        <IconTile color={color}>
          <Icon icon={category.icon} />
        </IconTile>
      }
    >
      <MoveButtons
        name={category.name}
        variant="ghost"
        isFirst={isFirst}
        isLast={isLast}
        onMove={onMove}
      />
      <Button variant="outline" size="sm" aria-label={`Edit ${category.name}`} onClick={onEdit}>
        <Pencil size={ActionIconSize} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        aria-label={`Archive ${category.name}`}
        onClick={onArchive}
      >
        <Archive size={ActionIconSize} />
      </Button>
    </ListRow>
  );
}

function ArchivedCategoryRow({
  category,
  onRestore,
}: {
  category: Category;
  onRestore: () => void;
}) {
  return (
    <ListRow
      title={category.name}
      description={
        <>
          <Badge tone="neutral">Archived</Badge> {transactionCountLabel(category.transactionCount)}
        </>
      }
      leading={
        <IconTile>
          <Icon icon={category.icon} />
        </IconTile>
      }
    >
      <Button variant="outline" size="sm" onClick={onRestore}>
        <RotateCcw size={ActionIconSize} /> Restore
      </Button>
    </ListRow>
  );
}

export function CategoryGroupPanel({
  group,
  isFirst,
  isLast,
  onAddCategory,
  onArchiveCategory,
  onArchiveGroup,
  onEditCategory,
  onEditGroup,
  onMoveCategory,
  onMoveGroup,
  onRestoreCategory,
  showArchived,
}: {
  group: Group;
  isFirst: boolean;
  isLast: boolean;
  onAddCategory: () => void;
  onArchiveCategory: (category: Category) => void;
  onArchiveGroup: () => void;
  onEditCategory: (category: Category) => void;
  onEditGroup: () => void;
  onMoveCategory: (index: number, delta: number) => void;
  onMoveGroup: MoveHandler;
  onRestoreCategory: (category: Category) => void;
  showArchived: boolean;
}) {
  const live = group.categories.filter(category => !category.archivedAt);
  const archived = group.categories.filter(category => category.archivedAt);

  return (
    <Panel
      title={group.name}
      description={`${group.kind === 'income' ? 'Income' : 'Expense'} group · ${categoryCountLabel(live.length)}`}
      action={
        <GroupActions
          group={group}
          isFirst={isFirst}
          isLast={isLast}
          onMove={onMoveGroup}
          onEdit={onEditGroup}
          onAddCategory={onAddCategory}
          onArchive={onArchiveGroup}
        />
      }
    >
      {!live.length && <Text tone="muted">No categories yet.</Text>}
      {live.map((category, index) => (
        <CategoryRow
          key={category.id}
          category={category}
          color={group.color}
          isFirst={index === 0}
          isLast={index === live.length - 1}
          onMove={delta => onMoveCategory(index, delta)}
          onEdit={() => onEditCategory(category)}
          onArchive={() => onArchiveCategory(category)}
        />
      ))}
      {showArchived &&
        archived.map(category => (
          <ArchivedCategoryRow
            key={category.id}
            category={category}
            onRestore={() => onRestoreCategory(category)}
          />
        ))}
    </Panel>
  );
}
