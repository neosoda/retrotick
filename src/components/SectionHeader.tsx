interface SectionHeaderProps {
  title: string;
  first?: boolean;
}

export function SectionHeader({ title, first }: SectionHeaderProps) {
  return (
    <h2 class={`w-full text-base text-gray-500 ${first ? 'mt-0' : 'mt-4'} mb-1`}>
      {title}
    </h2>
  );
}
