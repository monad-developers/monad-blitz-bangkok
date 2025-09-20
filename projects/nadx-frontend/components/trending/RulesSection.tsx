"use client";

interface RulesSectionProps {
  title?: string;
  content?: string;
}

export default function RulesSection({
  title = "Rule",
  content = "Rule example",
}: RulesSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{content}</p>
    </div>
  );
}
