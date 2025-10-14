type CategoryIconProps = {
  categoryIcon: string;
};

export function CategoryIcon({ categoryIcon }: CategoryIconProps) {
  return (
    <div className="flex items-center justify-center rounded-full w-8 h-8 bg-gray-100">
      <div className="text-lg">{categoryIcon}</div>
    </div>
  );
}
